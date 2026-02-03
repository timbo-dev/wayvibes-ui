use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
  pub active_pack_id: Option<String>,
  pub volume: f32,
  pub paused: bool,
}

impl Default for AppConfig {
  fn default() -> Self {
    Self {
      active_pack_id: None,
      volume: 0.7,
      paused: false,
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoundPack {
  pub id: String,
  pub name: String,
  pub version: String,
  pub author: Option<String>,
  pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WayvibesStatus {
  pub installed: bool,
  pub running: bool,
  pub version: Option<String>,
  pub pid: Option<u32>,
}
