use std::path::PathBuf;

use tauri::State;

use crate::models::SoundPack;
use crate::services::sound_pack_service;
use crate::state::AppState;

#[tauri::command]
pub fn get_sound_packs(state: State<'_, AppState>) -> Result<Vec<SoundPack>, String> {
  sound_pack_service::list_packs(&state.packs_dir).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn import_sound_pack(state: State<'_, AppState>, path: String) -> Result<SoundPack, String> {
  println!("is executing here? after invoking import_sound_pack");

  let pack = sound_pack_service::import_pack(&PathBuf::from(path), &state.packs_dir)
    .map_err(|err| err.to_string())?;

  println!("is dying here?");

  let mut config = state
    .config
    .lock()
    .map_err(|_| "Falha ao acessar configuração".to_string())?;
  if config.active_pack_id.is_none() {
    config.active_pack_id = Some(pack.id.clone());
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
  }

  Ok(pack)
}

#[tauri::command]
pub fn delete_sound_pack(state: State<'_, AppState>, pack_id: String) -> Result<(), String> {
  sound_pack_service::delete_pack(&pack_id, &state.packs_dir)
    .map_err(|err| err.to_string())?;

  let mut config = state
    .config
    .lock()
    .map_err(|_| "Falha ao acessar configuração".to_string())?;
  if config.active_pack_id.as_deref() == Some(pack_id.as_str()) {
    config.active_pack_id = None;
    state
      .save_config(&config)
      .map_err(|err| err.to_string())?;
  }

  Ok(())
}

#[tauri::command]
pub fn get_pack_path(state: State<'_, AppState>, pack_id: String) -> Result<String, String> {
  let pack_path = state.packs_dir.join(&pack_id);
  if !pack_path.exists() {
    return Err("Pacote não encontrado".into());
  }
  pack_path
    .to_str()
    .map(|s| s.to_string())
    .ok_or_else(|| "Caminho inválido".into())
}
