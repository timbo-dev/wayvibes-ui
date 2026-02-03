use tauri::menu::{Menu, MenuItem};
use tauri::{App, Result, Runtime};

pub const MENU_OPEN: &str = "tray-open";
pub const MENU_IMPORT: &str = "tray-import";
pub const MENU_QUIT: &str = "tray-quit";

pub fn build_menu<R: Runtime>(app: &App<R>) -> Result<Menu<R>> {
  let open =
    MenuItem::with_id(app, MENU_OPEN, "Abrir WayVibes", true, None::<&str>)?;
  let import = MenuItem::with_id(
    app,
    MENU_IMPORT,
    "Importar pacote .zip",
    true,
    None::<&str>,
  )?;
  let quit = MenuItem::with_id(app, MENU_QUIT, "Sair", true, None::<&str>)?;

  Menu::with_items(app, &[&open, &import, &quit])
}
