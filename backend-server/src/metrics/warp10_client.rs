use serde::Serialize;

/// A single data point: [timestamp_ms, value]
#[derive(Debug, Serialize)]
pub struct DataPoint {
    pub timestamp: i64,
    pub value: f64,
}

/// A normalized metric series for the frontend
#[derive(Debug, Serialize)]
pub struct MetricSeries {
    pub name: String,
    pub data: Vec<Vec<serde_json::Value>>,
}

/// The response returned to the frontend
#[derive(Debug, Serialize)]
pub struct MetricsResponse {
    pub panel: String,
    pub series: Vec<MetricSeries>,
}

/// Execute a WarpScript against the Warp10 endpoint
pub async fn execute_warpscript(
    http_client: &reqwest::Client,
    warp10_url: &str,
    script: &str,
) -> anyhow::Result<serde_json::Value> {
    let resp = http_client
        .post(warp10_url)
        .header("Content-Type", "application/x-warp10-warpscript")
        .body(script.to_string())
        .send()
        .await?;

    let status = resp.status();
    let body = resp.text().await?;

    if !status.is_success() {
        tracing::error!("Warp10 exec failed ({}): {}", status, &body[..body.len().min(500)]);
        anyhow::bail!("Warp10 exec failed ({}): {}", status, body);
    }

    let parsed: serde_json::Value = serde_json::from_str(&body)?;
    Ok(parsed)
}

/// Parse Warp10 GTS JSON response into normalized MetricSeries
/// GTS format: [[{"c":"class","l":{...},"a":{},"v":[[ts_us, val], ...]}]]
/// or for multiple results: [gts_list1, gts_list2, ...]
pub fn parse_gts_response(raw: &serde_json::Value, panel: &str) -> MetricsResponse {
    let mut series = Vec::new();

    // The response is an array of GTS lists
    if let Some(outer) = raw.as_array() {
        for gts_list in outer {
            if let Some(gts_array) = gts_list.as_array() {
                for gts in gts_array {
                    let name = gts["c"].as_str().unwrap_or("unknown").to_string();
                    let values = parse_gts_values(gts);
                    series.push(MetricSeries { name, data: values });
                }
            } else if gts_list.is_object() {
                // Single GTS (not wrapped in array)
                let name = gts_list["c"].as_str().unwrap_or("unknown").to_string();
                let values = parse_gts_values(gts_list);
                series.push(MetricSeries { name, data: values });
            }
        }
    }

    MetricsResponse {
        panel: panel.to_string(),
        series,
    }
}

fn parse_gts_values(gts: &serde_json::Value) -> Vec<Vec<serde_json::Value>> {
    let mut data = Vec::new();

    if let Some(values) = gts["v"].as_array() {
        for point in values {
            if let Some(arr) = point.as_array() {
                // Format: [timestamp_us, value] or [timestamp_us, lat, lon, alt, value]
                if arr.is_empty() {
                    continue;
                }

                let timestamp_us = arr[0].as_i64().unwrap_or(0);
                // Convert microseconds to milliseconds for JavaScript
                let timestamp_ms = timestamp_us / 1000;

                // Value is the last element (handles both [ts, val] and [ts, lat, lon, alt, val])
                let raw_value = &arr[arr.len() - 1];
                let value = parse_mixed_value(raw_value);

                data.push(vec![
                    serde_json::Value::Number(serde_json::Number::from(timestamp_ms)),
                    serde_json::json!(value),
                ]);
            }
        }
    }

    data
}

/// Handle mixed value types from Warp10: String, Double, Int
fn parse_mixed_value(v: &serde_json::Value) -> f64 {
    match v {
        serde_json::Value::Number(n) => n.as_f64().unwrap_or(0.0),
        serde_json::Value::String(s) => s.parse::<f64>().unwrap_or(0.0),
        _ => 0.0,
    }
}
