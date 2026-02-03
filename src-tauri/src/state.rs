use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use directories::ProjectDirs;

use crate::error::AppError;
use crate::models::AppConfig;
use crate::services::config_service;

pub struct AppState {
  pub packs_dir: PathBuf,
  pub config_path: PathBuf,
  pub config: Mutex<AppConfig>,
}

impl AppState {
  pub fn new() -> Result<Self, AppError> {
    let project_dirs = ProjectDirs::from("", "", "wayvibes-ui")
      .ok_or_else(|| AppError::InvalidConfig("Diretório do app indisponível".into()))?;
    let data_dir = project_dirs.data_dir().to_path_buf();
    let config_dir = project_dirs.config_dir().to_path_buf();
    let packs_dir = data_dir.join("packs");
    let config_path = config_dir.join("config.json");

    fs::create_dir_all(&packs_dir)?;
    fs::create_dir_all(&config_dir)?;

    let config = config_service::load_config(&config_path)?;

    Ok(Self {
      packs_dir,
      config_path,
      config: Mutex::new(config),
    })
  }

  pub fn save_config(&self, config: &AppConfig) -> Result<(), AppError> {
    config_service::save_config(&self.config_path, config)
  }
}
