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

  let (active_pack_id, paused) = {
    let mut config = state
      .config
      .lock()
      .map_err(|_| "Falha ao acessar configuração".to_string())?;
    config.volume = volume;
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
    (config.active_pack_id.clone(), config.paused)
  };

  // If not paused and there's an active pack, restart with new volume
  if !paused {
    if let Some(pack_id) = active_pack_id {
      let pack_path = state.packs_dir.join(&pack_id);
      if pack_path.exists() {
        if let Err(err) = wayvibes_service::restart(&pack_path, volume).await {
          if !matches!(err, AppError::WayvibesMissing) {
            return Err(err.to_string());
          }
        }
      }
    }
  }

  Ok(())
}

#[tauri::command]
pub async fn toggle_pause(state: State<'_, AppState>) -> Result<(), String> {
  let (paused, active_pack_id, volume) = {
    let mut config = state
      .config
      .lock()
      .map_err(|_| "Falha ao acessar configuração".to_string())?;
    config.paused = !config.paused;
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
    (config.paused, config.active_pack_id.clone(), config.volume)
  };

  if paused {
    // Stop wayvibes
    if let Err(err) = wayvibes_service::stop().await {
      if !matches!(err, AppError::WayvibesMissing) {
        return Err(err.to_string());
      }
    }
  } else {
    // Resume: start wayvibes with active pack and volume
    if let Some(pack_id) = active_pack_id {
      let pack_path = state.packs_dir.join(&pack_id);
      if pack_path.exists() {
        if let Err(err) = wayvibes_service::start(&pack_path, volume).await {
          if !matches!(err, AppError::WayvibesMissing) {
            return Err(err.to_string());
          }
        }
      }
    }
  }

  Ok(())
}

#[tauri::command]
pub async fn stop_wayvibes(state: State<'_, AppState>) -> Result<(), String> {
  {
    let mut config = state
      .config
      .lock()
      .map_err(|_| "Falha ao acessar configuração".to_string())?;
    config.paused = true;
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
  }

  if let Err(err) = wayvibes_service::stop().await {
    if !matches!(err, AppError::WayvibesMissing) {
      return Err(err.to_string());
    }
  }

  Ok(())
}

#[tauri::command]
pub async fn set_active_pack(state: State<'_, AppState>, pack_id: String) -> Result<(), String> {
  let pack_path = state.packs_dir.join(&pack_id);
  if !pack_path.exists() {
    return Err("Pacote não encontrado".into());
  }

  let (paused, volume) = {
    let mut config = state
      .config
      .lock()
      .map_err(|_| "Falha ao acessar configuração".to_string())?;
    config.active_pack_id = Some(pack_id);
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
    (config.paused, config.volume)
  };

  // Start wayvibes with the new pack if not paused
  if !paused {
    if let Err(err) = wayvibes_service::start(&pack_path, volume).await {
      if !matches!(err, AppError::WayvibesMissing) {
        return Err(err.to_string());
      }
    }
  }

  Ok(())
}
