use crate::api::cc_client::CcClient;
use crate::auth::encryption;
use crate::auth::middleware::AuthUser;
use crate::db::users::UserInfo;
use crate::error::AppError;
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/me", get(me))
        .route("/api/organisations", get(list_organisations))
        .route(
            "/api/organisations/{orgId}/applications",
            get(list_applications),
        )
        .route(
            "/api/organisations/{orgId}/addons",
            get(list_addons),
        )
}

fn build_cc_client<'a>(
    state: &'a AppState,
    user: &'a crate::db::users::User,
) -> Result<CcClient<'a>, AppError> {
    let nonce = &user.oauth_nonce;
    if nonce.len() < 24 {
        return Err(AppError::Internal(anyhow::anyhow!("invalid oauth nonce length")));
    }
    let token = encryption::decrypt(&user.oauth_token_enc, &nonce[..12], &state.config.encryption_key)
        .map_err(|e| AppError::Internal(e))?;
    let secret = encryption::decrypt(&user.oauth_secret_enc, &nonce[12..24], &state.config.encryption_key)
        .map_err(|e| AppError::Internal(e))?;

    Ok(CcClient::new(
        &state.http_client,
        &state.config,
        String::from_utf8(token).map_err(|e| AppError::Internal(e.into()))?,
        String::from_utf8(secret).map_err(|e| AppError::Internal(e.into()))?,
    ))
}

async fn me(AuthUser(user): AuthUser) -> Json<UserInfo> {
    Json(user.into())
}

async fn list_organisations(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = build_cc_client(&state, &user)?;
    let orgs = client.list_organisations().await.map_err(|e| AppError::CcApi(e.to_string()))?;
    Ok(Json(serde_json::to_value(orgs)?))
}

async fn list_applications(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(org_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = build_cc_client(&state, &user)?;
    let apps = client.list_applications(&org_id).await.map_err(|e| AppError::CcApi(e.to_string()))?;
    Ok(Json(serde_json::to_value(apps)?))
}

async fn list_addons(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(org_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = build_cc_client(&state, &user)?;
    let addons = client.list_addons(&org_id).await.map_err(|e| AppError::CcApi(e.to_string()))?;
    Ok(Json(serde_json::to_value(addons)?))
}
