mod api;
mod auth;
mod config;
mod db;
mod error;
mod metrics;
mod state;

use axum::http::{header, HeaderValue, Method};
use axum::routing::get;
use axum::Router;
use sqlx::postgres::PgPoolOptions;
use state::AppState;
use std::sync::Arc;
use std::time::Duration;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tower_sessions::cookie::SameSite;
use tower_sessions::{Expiry, SessionManagerLayer};
use tower_sessions_sqlx_store::PostgresStore;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file if present (development)
    let _ = dotenvy::dotenv();

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,sqlx=warn".into()),
        )
        .with_target(false)
        .init();

    let config = config::Config::from_env()?;
    tracing::info!("Starting MyCCmetrics backend on port {}", config.port);

    // Database connection pool
    let db = PgPoolOptions::new()
        .max_connections(20)
        .min_connections(2)
        .acquire_timeout(Duration::from_secs(10))
        .connect(&config.database_url)
        .await?;

    // Run database migrations
    sqlx::migrate!("./migrations").run(&db).await?;
    tracing::info!("Database migrations applied");

    // Session store
    let session_store = PostgresStore::new(db.clone());
    session_store.migrate().await?;

    // Spawn background task to clean up expired sessions
    use tower_sessions::session_store::ExpiredDeletion;
    let deletion_task = tokio::task::spawn(
        session_store
            .clone()
            .continuously_delete_expired(Duration::from_secs(3600)),
    );

    // Session layer
    let session_layer = SessionManagerLayer::new(session_store)
        .with_name("myccmetrics.sid")
        .with_http_only(true)
        .with_secure(cfg!(not(debug_assertions)))
        .with_same_site(SameSite::None)
        .with_expiry(Expiry::OnInactivity(time::Duration::hours(24)));

    // CORS
    let frontend_origin = config.frontend_url.parse::<HeaderValue>()?;
    let cors = CorsLayer::new()
        .allow_origin(frontend_origin)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::COOKIE])
        .allow_credentials(true);

    // HTTP client for outbound requests
    let http_client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()?;

    let app_state = AppState {
        db,
        http_client,
        config: Arc::new(config.clone()),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(health))
        .merge(auth::routes::router())
        .merge(api::routes::router())
        .merge(metrics::routes::router())
        .layer(session_layer)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(app_state);

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Listening on {}", addr);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    deletion_task.abort();
    Ok(())
}

async fn health() -> &'static str {
    "ok"
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install CTRL+C handler");
    tracing::info!("Shutdown signal received");
}
