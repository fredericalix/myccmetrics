use crate::config::Config;
use hmac::{Hmac, Mac};
use percent_encoding::{utf8_percent_encode, AsciiSet, NON_ALPHANUMERIC};
use sha1::Sha1;
use std::collections::BTreeMap;
use std::time::{SystemTime, UNIX_EPOCH};

// RFC 3986 unreserved characters
const ENCODE_SET: &AsciiSet = &NON_ALPHANUMERIC
    .remove(b'-')
    .remove(b'.')
    .remove(b'_')
    .remove(b'~');

fn percent_encode(s: &str) -> String {
    utf8_percent_encode(s, ENCODE_SET).to_string()
}

fn generate_nonce() -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut bytes);
    base64::Engine::encode(&base64::engine::general_purpose::STANDARD, bytes)
        .replace(['+', '/', '='], "")
}

fn generate_timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        .to_string()
}

fn sign_request(
    method: &str,
    url: &str,
    params: &BTreeMap<String, String>,
    consumer_secret: &str,
    token_secret: &str,
) -> String {
    // Build parameter string (sorted by key)
    let param_string: String = params
        .iter()
        .map(|(k, v)| format!("{}={}", percent_encode(k), percent_encode(v)))
        .collect::<Vec<_>>()
        .join("&");

    // Build signature base string
    let base_string = format!(
        "{}&{}&{}",
        percent_encode(method),
        percent_encode(url),
        percent_encode(&param_string)
    );

    // Build signing key
    let signing_key = format!("{}&{}", percent_encode(consumer_secret), percent_encode(token_secret));

    // HMAC-SHA1
    let mut mac =
        Hmac::<Sha1>::new_from_slice(signing_key.as_bytes()).expect("HMAC can take key of any size");
    mac.update(base_string.as_bytes());
    let result = mac.finalize();
    base64::Engine::encode(&base64::engine::general_purpose::STANDARD, result.into_bytes())
}

fn build_authorization_header(params: &BTreeMap<String, String>) -> String {
    let entries: Vec<String> = params
        .iter()
        .filter(|(k, _)| k.starts_with("oauth_"))
        .map(|(k, v)| format!("{}=\"{}\"", percent_encode(k), percent_encode(v)))
        .collect();
    format!("OAuth {}", entries.join(", "))
}

/// Step 1: Get a request token from Clever Cloud
pub async fn request_temporary_token(
    config: &Config,
    http_client: &reqwest::Client,
) -> anyhow::Result<(String, String)> {
    let url = format!("{}/v2/oauth/request_token", config.cc_api_base_url);
    let callback_url = config.callback_url();

    let mut params = BTreeMap::new();
    params.insert("oauth_callback".to_string(), callback_url);
    params.insert("oauth_consumer_key".to_string(), config.cc_consumer_key.clone());
    params.insert("oauth_nonce".to_string(), generate_nonce());
    params.insert("oauth_signature_method".to_string(), "HMAC-SHA1".to_string());
    params.insert("oauth_timestamp".to_string(), generate_timestamp());
    params.insert("oauth_version".to_string(), "1.0".to_string());

    let signature = sign_request("POST", &url, &params, &config.cc_consumer_secret, "");
    params.insert("oauth_signature".to_string(), signature);

    let auth_header = build_authorization_header(&params);

    tracing::debug!("OAuth request_token URL: {}", url);
    tracing::debug!("OAuth callback: {}", params.get("oauth_callback").unwrap());
    tracing::debug!("OAuth Authorization header: {}", auth_header);

    let resp = http_client
        .post(&url)
        .header("Authorization", &auth_header)
        .send()
        .await?;

    let status = resp.status();
    let body = resp.text().await?;

    if !status.is_success() {
        tracing::error!("request_token failed ({}): {}", status, body);
        anyhow::bail!("request_token failed ({}): {}", status, body);
    }

    // Parse response: oauth_token=xxx&oauth_token_secret=yyy&oauth_callback_confirmed=true
    let parsed: BTreeMap<String, String> = url::form_urlencoded::parse(body.as_bytes())
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let token = parsed
        .get("oauth_token")
        .ok_or_else(|| anyhow::anyhow!("missing oauth_token in response"))?
        .clone();
    let secret = parsed
        .get("oauth_token_secret")
        .ok_or_else(|| anyhow::anyhow!("missing oauth_token_secret in response"))?
        .clone();

    Ok((token, secret))
}

/// Step 3: Exchange request token + verifier for access token
pub async fn exchange_access_token(
    config: &Config,
    http_client: &reqwest::Client,
    oauth_token: &str,
    oauth_token_secret: &str,
    oauth_verifier: &str,
) -> anyhow::Result<(String, String)> {
    let url = format!("{}/v2/oauth/access_token", config.cc_api_base_url);

    let mut params = BTreeMap::new();
    params.insert("oauth_consumer_key".to_string(), config.cc_consumer_key.clone());
    params.insert("oauth_token".to_string(), oauth_token.to_string());
    params.insert("oauth_signature_method".to_string(), "HMAC-SHA1".to_string());
    params.insert("oauth_timestamp".to_string(), generate_timestamp());
    params.insert("oauth_nonce".to_string(), generate_nonce());
    params.insert("oauth_version".to_string(), "1.0".to_string());
    params.insert("oauth_verifier".to_string(), oauth_verifier.to_string());

    let signature = sign_request("POST", &url, &params, &config.cc_consumer_secret, oauth_token_secret);
    params.insert("oauth_signature".to_string(), signature);

    let auth_header = build_authorization_header(&params);

    let resp = http_client
        .post(&url)
        .header("Authorization", &auth_header)
        .send()
        .await?;

    let status = resp.status();
    let body = resp.text().await?;

    if !status.is_success() {
        anyhow::bail!("access_token failed ({}): {}", status, body);
    }

    let parsed: BTreeMap<String, String> = url::form_urlencoded::parse(body.as_bytes())
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let token = parsed
        .get("oauth_token")
        .ok_or_else(|| anyhow::anyhow!("missing oauth_token in response"))?
        .clone();
    let secret = parsed
        .get("oauth_token_secret")
        .ok_or_else(|| anyhow::anyhow!("missing oauth_token_secret in response"))?
        .clone();

    Ok((token, secret))
}

/// Sign an API request with consumer + user tokens and return the Authorization header value
pub fn sign_api_request(
    method: &str,
    url: &str,
    consumer_key: &str,
    consumer_secret: &str,
    access_token: &str,
    access_secret: &str,
) -> String {
    let mut params = BTreeMap::new();
    params.insert("oauth_consumer_key".to_string(), consumer_key.to_string());
    params.insert("oauth_token".to_string(), access_token.to_string());
    params.insert("oauth_signature_method".to_string(), "HMAC-SHA1".to_string());
    params.insert("oauth_timestamp".to_string(), generate_timestamp());
    params.insert("oauth_nonce".to_string(), generate_nonce());
    params.insert("oauth_version".to_string(), "1.0".to_string());

    let signature = sign_request(method, url, &params, consumer_secret, access_secret);
    params.insert("oauth_signature".to_string(), signature);

    build_authorization_header(&params)
}
