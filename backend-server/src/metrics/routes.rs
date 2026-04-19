use crate::auth::authz::{require_org_member, validate_cc_id};
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
    Router::new().route("/api/metrics/{orgId}/{appId}", get(get_metrics))
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

const CACHE_TTL_SECS: u64 = 30;

async fn get_metrics(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path((org_id, app_id)): Path<(String, String)>,
    Query(query): Query<MetricsQuery>,
) -> Result<Json<warp10_client::MetricsResponse>, AppError> {
    validate_cc_id(&org_id)?;
    validate_cc_id(&app_id)?;
    require_org_member(&state, &user, &org_id).await?;

    // Check in-memory cache first
    let cache_key = format!("{}:{}:{}:{}", org_id, app_id, query.panel, query.duration);
    {
        let cache = state.metrics_cache.read().await;
        if let Some(cached) = cache.get(&cache_key) {
            if cached.cached_at.elapsed().as_secs() < CACHE_TTL_SECS {
                tracing::debug!("Cache hit for {}", cache_key);
                return Ok(Json(cached.data.clone()));
            }
        }
    }

    // Cache miss — query Warp10
    let template = templates::get_template(&query.panel)
        .ok_or_else(|| AppError::BadRequest(format!("unknown panel: {}", query.panel)))?;

    let duration = templates::parse_duration(&query.duration)
        .ok_or_else(|| AppError::BadRequest(format!("invalid duration: {}", query.duration)))?;

    let bucket_input = query
        .bucket_span
        .as_deref()
        .unwrap_or_else(|| templates::default_bucket_for_duration(&query.duration));
    let bucket_span = templates::parse_bucket_span(bucket_input)
        .ok_or_else(|| AppError::BadRequest(format!("invalid bucket_span: {}", bucket_input)))?;
    let bucket_span_us: i64 = bucket_span
        .parse()
        .map_err(|_| AppError::BadRequest(format!("invalid bucket_span: {}", bucket_input)))?;

    let warp10_token = get_or_fetch_warp10_token(&state, &user, &org_id).await?;

    let params = templates::WarpScriptParams {
        token: warp10_token,
        app_id,
        duration,
        bucket_span,
    };
    let script = templates::render(template, &params);

    tracing::debug!("Executing WarpScript for panel={}", query.panel);

    let raw_response =
        warp10_client::execute_warpscript(&state.http_client, &state.config.warp10_endpoint, &script)
            .await
            .map_err(|e| AppError::Warp10(e.to_string()))?;

    let response = warp10_client::parse_gts_response(&raw_response, &query.panel, bucket_span_us);

    // Store in cache
    {
        let mut cache = state.metrics_cache.write().await;
        cache.insert(
            cache_key,
            crate::state::CachedMetrics {
                data: response.clone(),
                cached_at: std::time::Instant::now(),
            },
        );
    }

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

