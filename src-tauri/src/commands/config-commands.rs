use tauri::State;

use crate::models::AppConfig;
use crate::state::AppState;

#[tauri::command]
pub fn get_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
  let config = state
    .config
    .lock()
    .map_err(|_| "Falha ao acessar configuração".to_string())?;
  Ok(config.clone())
}
