use crate::auth::oauth::sign_api_request;
use crate::config::Config;
use serde::Deserialize;

#[derive(Debug, Deserialize, serde::Serialize, Clone)]
pub struct CcOrganisation {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub avatar: Option<String>,
}

#[derive(Debug, Deserialize, serde::Serialize, Clone)]
pub struct CcApplication {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub app_type: Option<String>,
    #[serde(default)]
    pub state: Option<String>,
    #[serde(default)]
    pub instance: Option<CcInstance>,
    #[serde(default)]
    pub zone: Option<String>,
    #[serde(default)]
    pub last_deploy: Option<i64>,
}

#[derive(Debug, Deserialize, serde::Serialize, Clone)]
pub struct CcInstance {
    #[serde(rename = "type")]
    pub instance_type: Option<String>,
    pub variant: Option<CcVariant>,
}

#[derive(Debug, Deserialize, serde::Serialize, Clone)]
pub struct CcVariant {
    pub name: Option<String>,
    pub slug: Option<String>,
}

#[derive(Debug, Deserialize, serde::Serialize, Clone)]
pub struct CcAddon {
    pub id: String,
    pub name: String,
    #[serde(rename = "realId")]
    pub real_id: Option<String>,
    pub region: Option<String>,
    pub provider: Option<CcAddonProvider>,
    #[serde(rename = "creationDate")]
    pub creation_date: Option<i64>,
}

#[derive(Debug, Deserialize, serde::Serialize, Clone)]
pub struct CcAddonProvider {
    pub id: Option<String>,
    pub name: Option<String>,
}

pub struct CcClient<'a> {
    http: &'a reqwest::Client,
    config: &'a Config,
    access_token: String,
    access_secret: String,
}

impl<'a> CcClient<'a> {
    pub fn new(
        http: &'a reqwest::Client,
        config: &'a Config,
        access_token: String,
        access_secret: String,
    ) -> Self {
        CcClient {
            http,
            config,
            access_token,
            access_secret,
        }
    }

    fn sign(&self, method: &str, url: &str) -> String {
        sign_api_request(
            method,
            url,
            &self.config.cc_consumer_key,
            &self.config.cc_consumer_secret,
            &self.access_token,
            &self.access_secret,
        )
    }

    pub async fn get_self(&self) -> anyhow::Result<serde_json::Value> {
        let url = format!("{}/v2/self", self.config.cc_api_base_url);
        let auth = self.sign("GET", &url);
        let resp = self
            .http
            .get(&url)
            .header("Authorization", &auth)
            .send()
            .await?;
        let status = resp.status();
        let body = resp.text().await?;
        if !status.is_success() {
            anyhow::bail!("CC API /v2/self failed ({}): {}", status, body);
        }
        Ok(serde_json::from_str(&body)?)
    }

    pub async fn list_organisations(&self) -> anyhow::Result<Vec<CcOrganisation>> {
        let url = format!("{}/v2/organisations", self.config.cc_api_base_url);
        let auth = self.sign("GET", &url);
        let resp = self
            .http
            .get(&url)
            .header("Authorization", &auth)
            .send()
            .await?;
        let status = resp.status();
        let body = resp.text().await?;
        if !status.is_success() {
            anyhow::bail!("CC API /v2/organisations failed ({}): {}", status, body);
        }
        Ok(serde_json::from_str(&body)?)
    }

    pub async fn list_applications(
        &self,
        org_id: &str,
    ) -> anyhow::Result<Vec<CcApplication>> {
        let url = format!(
            "{}/v2/organisations/{}/applications",
            self.config.cc_api_base_url, org_id
        );
        let auth = self.sign("GET", &url);
        let resp = self
            .http
            .get(&url)
            .header("Authorization", &auth)
            .send()
            .await?;
        let status = resp.status();
        let body = resp.text().await?;
        if !status.is_success() {
            tracing::error!("CC API list applications failed ({}): {}", status, body);
            anyhow::bail!("CC API list applications failed ({}): {}", status, body);
        }
        Ok(serde_json::from_str(&body)?)
    }

    pub async fn list_addons(&self, org_id: &str) -> anyhow::Result<Vec<CcAddon>> {
        let url = format!(
            "{}/v2/organisations/{}/addons",
            self.config.cc_api_base_url, org_id
        );
        let auth = self.sign("GET", &url);
        let resp = self
            .http
            .get(&url)
            .header("Authorization", &auth)
            .send()
            .await?;
        let status = resp.status();
        let body = resp.text().await?;
        if !status.is_success() {
            tracing::error!("CC API list addons failed ({}): {}", status, body);
            anyhow::bail!("CC API list addons failed ({}): {}", status, body);
        }
        Ok(serde_json::from_str(&body)?)
    }

    pub async fn get_metrics_token(&self, org_id: &str) -> anyhow::Result<String> {
        let url = format!(
            "{}/v2/metrics/read/{}",
            self.config.cc_api_base_url, org_id
        );
        let auth = self.sign("GET", &url);
        let resp = self
            .http
            .get(&url)
            .header("Authorization", &auth)
            .send()
            .await?;
        let status = resp.status();
        let body = resp.text().await?;
        if !status.is_success() {
            anyhow::bail!("CC API metrics token failed ({}): {}", status, body);
        }
        // Response is raw string (the Warp10 token), not JSON
        Ok(body.trim().trim_matches('"').to_string())
    }
}
