use crate::config::Config;
use crate::metrics::warp10_client::MetricsResponse;
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;

pub struct CachedMetrics {
    pub data: MetricsResponse,
    pub cached_at: Instant,
}

pub type MetricsCache = Arc<RwLock<HashMap<String, CachedMetrics>>>;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub http_client: reqwest::Client,
    pub config: Arc<Config>,
    pub metrics_cache: MetricsCache,
}
