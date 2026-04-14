use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
pub struct Warp10Token {
    pub id: Uuid,
    pub cc_org_id: String,
    pub token_enc: Vec<u8>,
    pub token_nonce: Vec<u8>,
    pub fetched_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

pub async fn find_valid_token(
    pool: &PgPool,
    cc_org_id: &str,
) -> Result<Option<Warp10Token>, sqlx::Error> {
    sqlx::query_as::<_, Warp10Token>(
        "SELECT * FROM warp10_tokens WHERE cc_org_id = $1 AND expires_at > NOW() ORDER BY fetched_at DESC LIMIT 1",
    )
    .bind(cc_org_id)
    .fetch_optional(pool)
    .await
}

pub async fn insert_token(
    pool: &PgPool,
    cc_org_id: &str,
    token_enc: &[u8],
    token_nonce: &[u8],
    expires_at: DateTime<Utc>,
) -> Result<Warp10Token, sqlx::Error> {
    // Delete any existing tokens for this org first
    sqlx::query("DELETE FROM warp10_tokens WHERE cc_org_id = $1")
        .bind(cc_org_id)
        .execute(pool)
        .await?;

    sqlx::query_as::<_, Warp10Token>(
        r#"
        INSERT INTO warp10_tokens (cc_org_id, token_enc, token_nonce, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#,
    )
    .bind(cc_org_id)
    .bind(token_enc)
    .bind(token_nonce)
    .bind(expires_at)
    .fetch_one(pool)
    .await
}

pub async fn delete_expired(pool: &PgPool) -> Result<u64, sqlx::Error> {
    let result = sqlx::query("DELETE FROM warp10_tokens WHERE expires_at <= NOW()")
        .execute(pool)
        .await?;
    Ok(result.rows_affected())
}
