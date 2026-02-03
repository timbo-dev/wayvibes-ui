use std::path::Path;

use tokio::process::Command;

use crate::error::AppError;
use crate::models::WayvibesStatus;

/// Get the current status of wayvibes
pub async fn get_status() -> Result<WayvibesStatus, AppError> {
  let installed = is_installed().await;
  let running = if installed {
    is_running().await.unwrap_or(false)
  } else {
    false
  };
  let pid = if running {
    get_pid().await.unwrap_or(None)
  } else {
    None
  };

  Ok(WayvibesStatus {
    installed,
    running,
    version: None,
    pid,
  })
}

/// Start wayvibes with a sound pack and volume
/// Usage: wayvibes [soundpack_path] -v <volume> --background
pub async fn start(pack_path: &Path, volume: f32) -> Result<(), AppError> {
  ensure_installed().await?;

  // Stop any existing instance first
  let _ = stop().await;

  let path_str = pack_path
    .to_str()
    .ok_or_else(|| AppError::WayvibesCommand("Caminho inválido".into()))?;

  // Volume range is 0.0-10.0 in wayvibes, but our UI uses 0.0-1.0
  // Convert: UI 0.0-1.0 -> wayvibes 0.0-10.0
  let wayvibes_volume = volume * 10.0;

  println!(
    "[wayvibes] Starting with pack: {} volume: {}",
    path_str, wayvibes_volume
  );

  // Start wayvibes in background mode
  let output = Command::new("wayvibes")
    .arg(path_str)
    .arg("-v")
    .arg(format!("{:.1}", wayvibes_volume))
    .arg("--background")
    .output()
    .await?;

  if !output.status.success() {
    let error = String::from_utf8_lossy(&output.stderr).to_string();
    println!("[wayvibes] Failed to start: {}", error);
    return Err(AppError::WayvibesCommand(error));
  }

  println!("[wayvibes] Started successfully");
  Ok(())
}

/// Stop the running wayvibes process
pub async fn stop() -> Result<(), AppError> {
  println!("[wayvibes] Stopping...");

  let output = Command::new("pkill")
    .arg("-x")
    .arg("wayvibes")
    .output()
    .await?;

  // pkill returns 1 if no process was found, which is fine
  if output.status.success() {
    println!("[wayvibes] Stopped successfully");
  } else {
    println!("[wayvibes] No running process found");
  }

  Ok(())
}

/// Restart wayvibes with new settings (pack and/or volume)
pub async fn restart(pack_path: &Path, volume: f32) -> Result<(), AppError> {
  start(pack_path, volume).await
}

async fn is_installed() -> bool {
  Command::new("which")
    .arg("wayvibes")
    .output()
    .await
    .map(|output| output.status.success())
    .unwrap_or(false)
}

async fn is_running() -> Result<bool, AppError> {
  let output = Command::new("pgrep")
    .arg("-x")
    .arg("wayvibes")
    .output()
    .await?;
  Ok(output.status.success())
}

async fn get_pid() -> Result<Option<u32>, AppError> {
  let output = Command::new("pgrep")
    .arg("-nx")
    .arg("wayvibes")
    .output()
    .await?;
  if !output.status.success() {
    return Ok(None);
  }
  let raw = String::from_utf8_lossy(&output.stdout).trim().to_string();
  if raw.is_empty() {
    return Ok(None);
  }
  raw.parse::<u32>()
    .map(Some)
    .map_err(|_| AppError::WayvibesCommand("PID inválido".into()))
}

async fn ensure_installed() -> Result<(), AppError> {
  if !is_installed().await {
    return Err(AppError::WayvibesMissing);
  }
  Ok(())
}
