use crate::auth::authz::{cc_client_for_user, require_org_member, validate_cc_id};
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
        .route("/api/organisations/{orgId}/addons", get(list_addons))
}

async fn me(AuthUser(user): AuthUser) -> Json<UserInfo> {
    Json(user.into())
}

async fn list_organisations(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = cc_client_for_user(&state, &user)?;
    let orgs = client
        .list_organisations()
        .await
        .map_err(|e| AppError::CcApi(e.to_string()))?;
    Ok(Json(serde_json::to_value(orgs)?))
}

async fn list_applications(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(org_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    validate_cc_id(&org_id)?;
    require_org_member(&state, &user, &org_id).await?;
    let client = cc_client_for_user(&state, &user)?;
    let apps = client
        .list_applications(&org_id)
        .await
        .map_err(|e| AppError::CcApi(e.to_string()))?;
    Ok(Json(serde_json::to_value(apps)?))
}

async fn list_addons(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(org_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    validate_cc_id(&org_id)?;
    require_org_member(&state, &user, &org_id).await?;
    let client = cc_client_for_user(&state, &user)?;
    let addons = client
        .list_addons(&org_id)
        .await
        .map_err(|e| AppError::CcApi(e.to_string()))?;
    Ok(Json(serde_json::to_value(addons)?))
}
