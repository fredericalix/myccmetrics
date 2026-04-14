/// WarpScript template parameters
pub struct WarpScriptParams {
    pub token: String,
    pub app_id: String,
    /// Duration expression for Warp10 (e.g., "1 h", "6 h", "1 d", "7 d")
    pub duration: String,
    /// Bucket span in microseconds (e.g., 60000000 for 1 minute)
    pub bucket_span: String,
}

const CPU_TEMPLATE: &str = r#"
[ '{TOKEN}' '~cpu\.usage_(user|system|iowait)' { 'app_id' '{APP_ID}' } NOW {DURATION} ] FETCH
[ SWAP bucketizer.mean 0 {BUCKET_SPAN} 0 ] BUCKETIZE
[ SWAP [ 'app_id' ] reducer.mean ] REDUCE
SORT
"#;

const MEMORY_TEMPLATE: &str = r#"
[ '{TOKEN}' 'mem.used_percent' { 'app_id' '{APP_ID}' } NOW {DURATION} ] FETCH
[ SWAP bucketizer.mean 0 {BUCKET_SPAN} 0 ] BUCKETIZE
[ SWAP [ 'app_id' ] reducer.mean ] REDUCE
SORT
"#;

const NETWORK_TEMPLATE: &str = r#"
[ '{TOKEN}' 'net.bytes_recv' { 'app_id' '{APP_ID}' } NOW {DURATION} ] FETCH
[ SWAP mapper.rate 1 0 0 ] MAP
[ SWAP bucketizer.mean 0 {BUCKET_SPAN} 0 ] BUCKETIZE
[ SWAP [ 'app_id' ] reducer.sum ] REDUCE
SORT
'net_recv' STORE

[ '{TOKEN}' 'net.bytes_sent' { 'app_id' '{APP_ID}' } NOW {DURATION} ] FETCH
[ SWAP mapper.rate 1 0 0 ] MAP
[ SWAP bucketizer.mean 0 {BUCKET_SPAN} 0 ] BUCKETIZE
[ SWAP [ 'app_id' ] reducer.sum ] REDUCE
SORT
'net_sent' STORE

$net_recv $net_sent
"#;

const DISK_TEMPLATE: &str = r#"
[ '{TOKEN}' 'disk.used_percent' { 'app_id' '{APP_ID}' } NOW {DURATION} ] FETCH
[ SWAP bucketizer.last 0 {BUCKET_SPAN} 0 ] BUCKETIZE
[ SWAP [ 'app_id' ] reducer.max ] REDUCE
SORT
"#;

pub fn get_template(panel: &str) -> Option<&'static str> {
    match panel {
        "cpu" => Some(CPU_TEMPLATE),
        "memory" => Some(MEMORY_TEMPLATE),
        "network" => Some(NETWORK_TEMPLATE),
        "disk" => Some(DISK_TEMPLATE),
        _ => None,
    }
}

pub fn render(template: &str, params: &WarpScriptParams) -> String {
    template
        .replace("{TOKEN}", &params.token)
        .replace("{APP_ID}", &params.app_id)
        .replace("{DURATION}", &params.duration)
        .replace("{BUCKET_SPAN}", &params.bucket_span)
}

/// Convert a human-friendly duration to a WarpScript duration expression
/// e.g. "1h" -> "1 h", "6h" -> "6 h", "24h" -> "24 h", "7d" -> "7 d", "30d" -> "30 d"
pub fn parse_duration(input: &str) -> Option<String> {
    let input = input.trim().to_lowercase();
    if let Some(hours) = input.strip_suffix('h') {
        hours.parse::<u64>().ok().map(|h| format!("{} h", h))
    } else if let Some(days) = input.strip_suffix('d') {
        days.parse::<u64>().ok().map(|d| format!("{} d", d))
    } else if let Some(minutes) = input.strip_suffix('m') {
        minutes.parse::<u64>().ok().map(|m| format!("{} m", m))
    } else {
        None
    }
}

/// Convert a human-friendly bucket span to microseconds string
/// e.g. "1m" -> "60000000", "5m" -> "300000000", "1h" -> "3600000000"
pub fn parse_bucket_span(input: &str) -> Option<String> {
    let input = input.trim().to_lowercase();
    if let Some(minutes) = input.strip_suffix('m') {
        minutes
            .parse::<u64>()
            .ok()
            .map(|m| (m * 60 * 1_000_000).to_string())
    } else if let Some(hours) = input.strip_suffix('h') {
        hours
            .parse::<u64>()
            .ok()
            .map(|h| (h * 3600 * 1_000_000).to_string())
    } else {
        None
    }
}

/// Return a sensible default bucket span for a given duration
pub fn default_bucket_for_duration(duration: &str) -> &str {
    match duration {
        "1h" => "1m",
        "6h" => "5m",
        "24h" => "15m",
        "7d" => "1h",
        "30d" => "4h",
        _ => "5m",
    }
}
