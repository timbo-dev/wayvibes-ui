use tauri::{AppHandle, Emitter, Manager};
use tauri::menu::MenuEvent;

use super::menu::{MENU_IMPORT, MENU_OPEN, MENU_QUIT};

pub fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
  match event.id().as_ref() {
    MENU_OPEN => {
      show_main_window(app);
    }
    MENU_IMPORT => {
      show_main_window(app);
      let _ = app.emit("tray-import", ());
    }
    MENU_QUIT => {
      app.exit(0);
    }
    _ => {}
  }
}

fn show_main_window(app: &AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.show();
    let _ = window.set_focus();
  }
}
