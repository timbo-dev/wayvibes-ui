#[path = "tray/events.rs"]
mod events;
#[path = "tray/menu.rs"]
mod menu;

use tauri::tray::TrayIconBuilder;
use tauri::{App, Result};

pub fn setup_tray(app: &App) -> Result<()> {
  let menu = menu::build_menu(app)?;

  TrayIconBuilder::new()
    .icon(app.default_window_icon().cloned().expect("ícone padrão ausente"))
    .menu(&menu)
    .on_menu_event(events::handle_menu_event)
    .build(app)?;

  Ok(())
}
