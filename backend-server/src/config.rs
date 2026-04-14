use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub frontend_url: String,
    pub cc_consumer_key: String,
    pub cc_consumer_secret: String,
    pub encryption_key: [u8; 32],
    pub cc_api_base_url: String,
    pub warp10_endpoint: String,
    pub session_secret: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let encryption_key_b64 = env::var("ENCRYPTION_KEY")
            .unwrap_or_else(|_| {
                // Generate a random key for development
                use base64::Engine;
                let mut key = [0u8; 32];
                rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut key);
                base64::engine::general_purpose::STANDARD.encode(key)
            });

        let key_bytes = base64::Engine::decode(
            &base64::engine::general_purpose::STANDARD,
            &encryption_key_b64,
        )?;
        let encryption_key: [u8; 32] = key_bytes
            .try_into()
            .map_err(|_| anyhow::anyhow!("ENCRYPTION_KEY must decode to exactly 32 bytes"))?;

        Ok(Config {
            database_url: env::var("DATABASE_URL")
                .or_else(|_| env::var("POSTGRESQL_ADDON_URI"))?,
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()?,
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            cc_consumer_key: env::var("CC_OAUTH_CONSUMER_KEY")
                .unwrap_or_default(),
            cc_consumer_secret: env::var("CC_OAUTH_CONSUMER_SECRET")
                .unwrap_or_default(),
            encryption_key,
            cc_api_base_url: env::var("CC_API_BASE_URL")
                .unwrap_or_else(|_| "https://api.clever-cloud.com".to_string()),
            warp10_endpoint: env::var("WARP10_ENDPOINT").unwrap_or_else(|_| {
                "https://c2-warp10-clevercloud-customers.services.clever-cloud.com/api/v0/exec"
                    .to_string()
            }),
            session_secret: env::var("SESSION_SECRET")
                .unwrap_or_else(|_| "dev-session-secret-change-in-production".to_string()),
        })
    }

    pub fn backend_url(&self) -> String {
        if self.port == 443 || self.port == 80 {
            // In production behind a reverse proxy
            format!("https://localhost")
        } else {
            format!("http://localhost:{}", self.port)
        }
    }

    pub fn callback_url(&self) -> String {
        let app_url = env::var("APP_URL").unwrap_or_else(|_| {
            format!("http://localhost:{}", self.port)
        });
        format!("{}/auth/callback", app_url)
    }
}
