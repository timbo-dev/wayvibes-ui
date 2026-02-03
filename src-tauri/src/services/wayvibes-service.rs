use std::path::Path;

use tokio::process::Command;

use crate::error::AppError;
use crate::models::WayvibesStatus;

pub async fn get_status() -> Result<WayvibesStatus, AppError> {
  let installed = is_installed().await;
  let version = if installed {
    get_version().await.ok()
  } else {
    None
  };
  let running = if installed {
    is_running().await.unwrap_or(false)
  } else {
    false
  };

  Ok(WayvibesStatus {
    installed,
    running,
    version,
  })
}

pub async fn set_volume(volume: f32) -> Result<(), AppError> {
  ensure_installed().await?;
  run_wayvibes(&["set-volume", &format!("{volume:.2}")]).await?;
  Ok(())
}

pub async fn set_active_pack(pack_path: &Path) -> Result<(), AppError> {
  ensure_installed().await?;
  let path = pack_path
    .to_str()
    .ok_or_else(|| AppError::WayvibesCommand("Caminho inválido".into()))?;
  run_wayvibes(&["set-pack", path]).await?;
  Ok(())
}

pub async fn set_paused(paused: bool) -> Result<(), AppError> {
  ensure_installed().await?;
  if paused {
    run_wayvibes(&["pause"]).await?;
  } else {
    run_wayvibes(&["resume"]).await?;
  }
  Ok(())
}

async fn is_installed() -> bool {
  Command::new("which")
    .arg("wayvibes")
    .output()
    .await
    .map(|output| output.status.success())
    .unwrap_or(false)
}

async fn get_version() -> Result<String, AppError> {
  let output = Command::new("wayvibes").arg("--version").output().await?;
  if !output.status.success() {
    return Err(AppError::WayvibesCommand(
      String::from_utf8_lossy(&output.stderr).to_string(),
    ));
  }
  let raw = String::from_utf8_lossy(&output.stdout).trim().to_string();
  Ok(raw)
}

async fn is_running() -> Result<bool, AppError> {
  let output = Command::new("pgrep")
    .arg("-x")
    .arg("wayvibes")
    .output()
    .await?;
  Ok(output.status.success())
}

async fn ensure_installed() -> Result<(), AppError> {
  if !is_installed().await {
    return Err(AppError::WayvibesMissing);
  }
  Ok(())
}

async fn run_wayvibes(args: &[&str]) -> Result<(), AppError> {
  let output = Command::new("wayvibes").args(args).output().await?;
  if output.status.success() {
    return Ok(());
  }
  let error = String::from_utf8_lossy(&output.stderr).to_string();
  Err(AppError::WayvibesCommand(error))
}
