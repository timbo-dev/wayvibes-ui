mod commands;
mod error;
mod models;
mod services;
mod state;
mod tray;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init());

  #[cfg(desktop)]
  let builder = {
    use tauri_plugin_autostart::MacosLauncher;
    builder.plugin(tauri_plugin_autostart::init(
      MacosLauncher::LaunchAgent,
      None,
    ))
  };

  builder
    .setup(|app| {
      let state = state::AppState::new()?;
      app.manage(state);

      if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
      }

      tray::setup_tray(app)?;
      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        let _ = window.hide();
        api.prevent_close();
      }
    })
    .invoke_handler(tauri::generate_handler![
      commands::wayvibes_commands::get_wayvibes_status,
      commands::sound_packs_commands::get_sound_packs,
      commands::sound_packs_commands::import_sound_pack,
      commands::sound_packs_commands::delete_sound_pack,
      commands::sound_packs_commands::get_pack_path,
      commands::wayvibes_commands::set_active_pack,
      commands::wayvibes_commands::set_volume,
      commands::wayvibes_commands::toggle_pause,
      commands::wayvibes_commands::stop_wayvibes,
      commands::config_commands::get_config,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
