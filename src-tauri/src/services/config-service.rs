use std::fs;
use std::path::Path;

use crate::error::AppError;
use crate::models::AppConfig;

pub fn load_config(path: &Path) -> Result<AppConfig, AppError> {
  if !path.exists() {
    let config = AppConfig::default();
    save_config(path, &config)?;
    return Ok(config);
  }

  let content = fs::read_to_string(path)?;
  let config = serde_json::from_str::<AppConfig>(&content)?;
  Ok(config)
}

pub fn save_config(path: &Path, config: &AppConfig) -> Result<(), AppError> {
  let payload = serde_json::to_string_pretty(config)?;
  fs::write(path, payload)?;
  Ok(())
}
