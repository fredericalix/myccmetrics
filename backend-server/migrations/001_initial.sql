-- Users who have authenticated via Clever Cloud OAuth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cc_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    oauth_token_enc BYTEA NOT NULL,
    oauth_secret_enc BYTEA NOT NULL,
    oauth_nonce BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_cc_user_id ON users(cc_user_id);

-- Cached Warp10 tokens per organization
CREATE TABLE IF NOT EXISTS warp10_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cc_org_id VARCHAR(255) NOT NULL,
    token_enc BYTEA NOT NULL,
    token_nonce BYTEA NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_warp10_tokens_org ON warp10_tokens(cc_org_id);
CREATE INDEX IF NOT EXISTS idx_warp10_tokens_expiry ON warp10_tokens(expires_at);
