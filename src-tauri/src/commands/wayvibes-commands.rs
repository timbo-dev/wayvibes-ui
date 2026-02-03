use tauri::State;

use crate::error::AppError;
use crate::models::WayvibesStatus;
use crate::services::wayvibes_service;
use crate::state::AppState;

#[tauri::command]
pub async fn get_wayvibes_status() -> Result<WayvibesStatus, String> {
  wayvibes_service::get_status()
    .await
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn set_volume(state: State<'_, AppState>, volume: f32) -> Result<(), String> {
  let volume = volume.clamp(0.0, 1.0);
  {
    let mut config = state
      .config
      .lock()
      .map_err(|_| "Falha ao acessar configuração".to_string())?;
    config.volume = volume;
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
  }
  if let Err(err) = wayvibes_service::set_volume(volume).await {
    if !matches!(err, AppError::WayvibesMissing) {
      return Err(err.to_string());
    }
  }
  Ok(())
}

#[tauri::command]
pub async fn toggle_pause(state: State<'_, AppState>) -> Result<(), String> {
  let paused = {
    let mut config = state
      .config
      .lock()
      .map_err(|_| "Falha ao acessar configuração".to_string())?;
    config.paused = !config.paused;
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
    config.paused
  };

  if let Err(err) = wayvibes_service::set_paused(paused).await {
    if !matches!(err, AppError::WayvibesMissing) {
      return Err(err.to_string());
    }
  }
  Ok(())
}

#[tauri::command]
pub async fn set_active_pack(
  state: State<'_, AppState>,
  pack_id: String,
) -> Result<(), String> {
  let pack_path = state.packs_dir.join(&pack_id);
  if !pack_path.exists() {
    return Err("Pacote não encontrado".into());
  }

  {
    let mut config = state
      .config
      .lock()
      .map_err(|_| "Falha ao acessar configuração".to_string())?;
    config.active_pack_id = Some(pack_id);
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
  }

  if let Err(err) = wayvibes_service::set_active_pack(&pack_path).await {
    if !matches!(err, AppError::WayvibesMissing) {
      return Err(err.to_string());
    }
  }
  Ok(())
}
