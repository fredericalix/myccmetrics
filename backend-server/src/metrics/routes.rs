use crate::auth::encryption;
use crate::auth::middleware::AuthUser;
use crate::db::warp10_tokens;
use crate::error::AppError;
use crate::metrics::{templates, warp10_client};
use crate::state::AppState;
use axum::extract::{Path, Query, State};
use axum::routing::get;
use axum::{Json, Router};
use chrono::{Duration, Utc};
use serde::Deserialize;

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/metrics/{orgId}/{appId}",
            get(get_metrics),
        )
        .route(
            "/api/metrics/debug/{orgId}/{resourceId}",
            get(debug_find_metrics),
        )
}

#[derive(Deserialize)]
struct MetricsQuery {
    panel: String,
    #[serde(default = "default_duration")]
    duration: String,
    #[serde(default)]
    bucket_span: Option<String>,
}

fn default_duration() -> String {
    "1h".to_string()
}

async fn get_metrics(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path((org_id, app_id)): Path<(String, String)>,
    Query(query): Query<MetricsQuery>,
) -> Result<Json<warp10_client::MetricsResponse>, AppError> {
    // Get the WarpScript template for this panel
    let template = templates::get_template(&query.panel)
        .ok_or_else(|| AppError::BadRequest(format!("unknown panel: {}", query.panel)))?;

    // Parse duration and bucket span
    let duration = templates::parse_duration(&query.duration)
        .ok_or_else(|| AppError::BadRequest(format!("invalid duration: {}", query.duration)))?;

    let bucket_input = query
        .bucket_span
        .as_deref()
        .unwrap_or_else(|| templates::default_bucket_for_duration(&query.duration));
    let bucket_span = templates::parse_bucket_span(bucket_input)
        .ok_or_else(|| AppError::BadRequest(format!("invalid bucket_span: {}", bucket_input)))?;

    // Get Warp10 token (from cache or CC API)
    let warp10_token = get_or_fetch_warp10_token(&state, &user, &org_id).await?;

    // Render WarpScript
    let params = templates::WarpScriptParams {
        token: warp10_token,
        app_id,
        duration,
        bucket_span,
    };
    let script = templates::render(template, &params);

    tracing::debug!("Executing WarpScript for panel={}", query.panel);

    // Execute against Warp10
    let raw_response =
        warp10_client::execute_warpscript(&state.http_client, &state.config.warp10_endpoint, &script)
            .await
            .map_err(|e| AppError::Warp10(e.to_string()))?;

    // Parse and normalize the response
    let response = warp10_client::parse_gts_response(&raw_response, &query.panel);

    Ok(Json(response))
}

async fn get_or_fetch_warp10_token(
    state: &AppState,
    user: &crate::db::users::User,
    org_id: &str,
) -> Result<String, AppError> {
    // Check cache first
    if let Some(cached) = warp10_tokens::find_valid_token(&state.db, org_id).await? {
        let token = encryption::decrypt(
            &cached.token_enc,
            &cached.token_nonce,
            &state.config.encryption_key,
        )
        .map_err(|e| AppError::Internal(e))?;
        return Ok(String::from_utf8(token).map_err(|e| AppError::Internal(e.into()))?);
    }

    // Fetch from CC API
    let nonce = &user.oauth_nonce;
    if nonce.len() < 24 {
        return Err(AppError::Internal(anyhow::anyhow!("invalid oauth nonce")));
    }
    let access_token =
        encryption::decrypt(&user.oauth_token_enc, &nonce[..12], &state.config.encryption_key)
            .map_err(|e| AppError::Internal(e))?;
    let access_secret =
        encryption::decrypt(&user.oauth_secret_enc, &nonce[12..24], &state.config.encryption_key)
            .map_err(|e| AppError::Internal(e))?;

    let cc_client = crate::api::cc_client::CcClient::new(
        &state.http_client,
        &state.config,
        String::from_utf8(access_token).map_err(|e| AppError::Internal(e.into()))?,
        String::from_utf8(access_secret).map_err(|e| AppError::Internal(e.into()))?,
    );

    let token = cc_client
        .get_metrics_token(org_id)
        .await
        .map_err(|e| AppError::CcApi(e.to_string()))?;

    // Cache with 4.5 day expiry
    let expires_at = Utc::now() + Duration::hours(108); // 4.5 days
    let (token_enc, token_nonce) = encryption::encrypt(token.as_bytes(), &state.config.encryption_key)
        .map_err(|e| AppError::Internal(e))?;

    let _ = warp10_tokens::insert_token(
        &state.db,
        org_id,
        &token_enc,
        &token_nonce,
        expires_at,
    )
    .await;

    Ok(token)
}

/// Debug endpoint to discover what metrics exist for a given resource
async fn debug_find_metrics(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path((org_id, resource_id)): Path<(String, String)>,
) -> Result<Json<serde_json::Value>, AppError> {
    let warp10_token = get_or_fetch_warp10_token(&state, &user, &org_id).await?;

    // Try FIND with app_id label
    let script = format!(
        "[ '{}' '~.*' {{ 'app_id' '{}' }} ] FIND SIZE 'by_app_id' STORE\n\
         [ '{}' '~.*' {{ 'addon_id' '{}' }} ] FIND SIZE 'by_addon_id' STORE\n\
         [ '{}' '~cpu.*' {{}} ] FIND <% DROP DUP LABELS 'app_id' GET '{}' == %> FILTER SIZE 'cpu_filtered' STORE\n\
         {{ 'by_app_id' $by_app_id 'by_addon_id' $by_addon_id 'cpu_filtered' $cpu_filtered }} ",
        warp10_token, resource_id,
        warp10_token, resource_id,
        warp10_token, resource_id,
    );

    let raw = warp10_client::execute_warpscript(&state.http_client, &state.config.warp10_endpoint, &script)
        .await
        .map_err(|e| AppError::Warp10(e.to_string()))?;

    Ok(Json(raw))
}
