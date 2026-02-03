use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use flate2::read::GzDecoder;
use sevenz_rust::decompress_file;
use tar::Archive as TarArchive;
use unrar::Archive as UnrarArchive;
use zip::ZipArchive;

use crate::error::AppError;
use crate::models::SoundPack;

#[derive(Clone, Copy)]
enum ArchiveType {
  Zip,
  Tar,
  TarGz,
  Gz,
  Rar,
  SevenZ,
}

pub fn list_packs(packs_dir: &Path) -> Result<Vec<SoundPack>, AppError> {
  if !packs_dir.exists() {
    return Ok(Vec::new());
  }

  let mut packs = Vec::new();
  for entry in fs::read_dir(packs_dir)? {
    let entry = entry?;
    let path = entry.path();
    if !path.is_dir() {
      continue;
    }

    let pack_id = path
      .file_name()
      .and_then(|value| value.to_str())
      .unwrap_or_default()
      .to_string();

    let config_path = path.join("config.json");
    let config: serde_json::Value = if config_path.exists() {
      let content = fs::read_to_string(config_path)?;
      serde_json::from_str(&content)?
    } else {
      continue;
    };

    let name = config
      .get("name")
      .and_then(|v| v.as_str())
      .unwrap_or(&pack_id)
      .to_string();
    let version = config
      .get("version")
      .and_then(|v| v.as_str())
      .unwrap_or("1.0.0")
      .to_string();
    let author = config
      .get("author")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string());
    let description = config
      .get("description")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string());

    packs.push(SoundPack {
      id: pack_id,
      name,
      version,
      author,
      description,
    });
  }
  packs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
  Ok(packs)
}

pub fn import_pack(archive_path: &Path, packs_dir: &Path) -> Result<SoundPack, AppError> {
  if !is_wayvibes_installed() {
    return Err(AppError::WayvibesMissing);
  }

  let archive_type = detect_archive_type(archive_path).ok_or_else(|| {
    AppError::InvalidPack("Formato não suportado".into())
  })?;

  let temp_root = packs_dir.join(".importing");
  fs::create_dir_all(&temp_root)?;
  let temp_dir = temp_root.join(temp_dir_name());
  fs::create_dir_all(&temp_dir)?;

  let result = (|| {
    extract_archive(archive_path, &temp_dir, archive_type)?;

    let mut did_flatten = false;
    let root_config = temp_dir.join("config.json");
    if !root_config.exists() {
      if let Some(config_path) = find_config_in_subdirs(&temp_dir)? {
        flatten_pack_dir(&temp_dir, &config_path)?;
        did_flatten = true;
      } else {
        return Err(AppError::InvalidPack("config.json não encontrado".into()));
      }
    }

    let config_path = temp_dir.join("config.json");
    if !config_path.exists() {
      return Err(AppError::InvalidPack("config.json não encontrado".into()));
    }

    if let Err(err) = validate_pack_with_wayvibes(&temp_dir) {
      if did_flatten {
        return Err(AppError::InvalidPack(
          "Pacote inválido. Tentamos corrigir a estrutura, mas o wayvibes não conseguiu ler. Ajuste manual necessário.".into(),
        ));
      }
      return Err(err);
    }

    let config: serde_json::Value = serde_json::from_str(&fs::read_to_string(&config_path)?)?;

    let pack_name = config
      .get("name")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string())
      .unwrap_or_else(|| {
        archive_path
          .file_stem()
          .and_then(|s| s.to_str())
          .unwrap_or("unknown-pack")
          .to_string()
      });

    let pack_id = slugify(&pack_name);
    if pack_id.is_empty() {
      return Err(AppError::InvalidPack("Nome do pacote inválido".into()));
    }

    let target_dir = packs_dir.join(&pack_id);
    if target_dir.exists() {
      return Err(AppError::InvalidPack(format!(
        "Pacote '{}' já existe",
        pack_id
      )));
    }

    let version = config
      .get("version")
      .and_then(|v| v.as_str())
      .unwrap_or("1.0.0")
      .to_string();
    let author = config
      .get("author")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string());
    let description = config
      .get("description")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string());

    fs::rename(&temp_dir, &target_dir)?;

    Ok(SoundPack {
      id: pack_id,
      name: pack_name,
      version,
      author,
      description,
    })
  })();

  if result.is_err() {
    let _ = fs::remove_dir_all(&temp_dir);
  }

  result
}

pub fn delete_pack(pack_id: &str, packs_dir: &Path) -> Result<(), AppError> {
  let target_dir = packs_dir.join(pack_id);
  if !target_dir.exists() {
    return Err(AppError::InvalidPack("Pacote não encontrado".into()));
  }
  fs::remove_dir_all(target_dir)?;
  Ok(())
}

fn detect_archive_type(path: &Path) -> Option<ArchiveType> {
  let name = path.file_name()?.to_string_lossy().to_lowercase();
  if name.ends_with(".zip") {
    Some(ArchiveType::Zip)
  } else if name.ends_with(".tar.gz") || name.ends_with(".tgz") {
    Some(ArchiveType::TarGz)
  } else if name.ends_with(".tar") {
    Some(ArchiveType::Tar)
  } else if name.ends_with(".gz") {
    Some(ArchiveType::Gz)
  } else if name.ends_with(".rar") {
    Some(ArchiveType::Rar)
  } else if name.ends_with(".7z") {
    Some(ArchiveType::SevenZ)
  } else {
    None
  }
}

fn extract_archive(
  archive_path: &Path,
  dest: &Path,
  archive_type: ArchiveType,
) -> Result<(), AppError> {
  match archive_type {
    ArchiveType::Zip => extract_zip(archive_path, dest),
    ArchiveType::Tar => extract_tar(archive_path, dest),
    ArchiveType::TarGz => extract_tar_gz(archive_path, dest),
    ArchiveType::Gz => extract_gz(archive_path, dest),
    ArchiveType::Rar => extract_rar(archive_path, dest),
    ArchiveType::SevenZ => extract_7z(archive_path, dest),
  }
}

fn extract_zip(archive_path: &Path, dest: &Path) -> Result<(), AppError> {
  let file = File::open(archive_path).map_err(AppError::Io)?;
  let mut archive = ZipArchive::new(file).map_err(AppError::Zip)?;

  for index in 0..archive.len() {
    let mut entry = archive.by_index(index)?;
    let entry_name = entry.name().to_string();
    if entry_name.ends_with('/') {
      continue;
    }

    let sanitized = sanitize_archive_path(Path::new(&entry_name))?;
    let out_path = dest.join(&sanitized);
    if let Some(parent) = out_path.parent() {
      fs::create_dir_all(parent)?;
    }
    let mut outfile = File::create(&out_path)?;
    let mut buffer = Vec::new();
    entry.read_to_end(&mut buffer)?;
    outfile.write_all(&buffer)?;
  }
  Ok(())
}

fn extract_tar(archive_path: &Path, dest: &Path) -> Result<(), AppError> {
  let file = File::open(archive_path).map_err(AppError::Io)?;
  extract_tar_reader(file, dest)
}

fn extract_tar_gz(archive_path: &Path, dest: &Path) -> Result<(), AppError> {
  let file = File::open(archive_path).map_err(AppError::Io)?;
  let decoder = GzDecoder::new(file);
  extract_tar_reader(decoder, dest)
}

fn extract_gz(archive_path: &Path, dest: &Path) -> Result<(), AppError> {
  let file = File::open(archive_path).map_err(AppError::Io)?;
  let decoder = GzDecoder::new(file);
  extract_tar_reader(decoder, dest).map_err(|_| {
    AppError::InvalidPack("Arquivo .gz inválido (esperado tar.gz)".into())
  })
}

fn extract_tar_reader<R: Read>(reader: R, dest: &Path) -> Result<(), AppError> {
  let mut archive = TarArchive::new(reader);
  let entries = archive.entries()?;
  for entry in entries {
    let mut entry = entry?;
    let entry_path = entry.path()?.to_path_buf();
    let sanitized = sanitize_archive_path(&entry_path)?;
    let out_path = dest.join(&sanitized);
    if let Some(parent) = out_path.parent() {
      fs::create_dir_all(parent)?;
    }
    entry.unpack(&out_path)?;
  }
  Ok(())
}

fn extract_7z(archive_path: &Path, dest: &Path) -> Result<(), AppError> {
  decompress_file(archive_path, dest).map_err(|err| {
    AppError::InvalidPack(format!("Falha ao extrair .7z: {}", err))
  })?;
  Ok(())
}

fn extract_rar(archive_path: &Path, dest: &Path) -> Result<(), AppError> {
  let mut archive = UnrarArchive::new(archive_path)
    .open_for_processing()
    .map_err(|err| AppError::InvalidPack(format!("Falha ao abrir .rar: {}", err)))?;

  loop {
    let next = archive
      .read_header()
      .map_err(|err| AppError::InvalidPack(format!("Falha ao ler .rar: {}", err)))?;
    match next {
      Some(entry) => {
        let entry_path = entry.entry().filename.clone();
        let sanitized = sanitize_archive_path(&entry_path)?;
        let out_path = dest.join(&sanitized);
        if let Some(parent) = out_path.parent() {
          fs::create_dir_all(parent)?;
        }
        archive = entry
          .extract_to(&out_path)
          .map_err(|err| AppError::InvalidPack(format!("Falha ao extrair .rar: {}", err)))?;
      }
      None => break,
    }
  }
  Ok(())
}

fn find_config_in_subdirs(root: &Path) -> Result<Option<PathBuf>, AppError> {
  for entry in fs::read_dir(root)? {
    let entry = entry?;
    let path = entry.path();
    if path.is_dir() {
      if let Some(found) = find_config_recursive(&path)? {
        return Ok(Some(found));
      }
    }
  }
  Ok(None)
}

fn find_config_recursive(dir: &Path) -> Result<Option<PathBuf>, AppError> {
  for entry in fs::read_dir(dir)? {
    let entry = entry?;
    let path = entry.path();
    if path.is_dir() {
      if let Some(found) = find_config_recursive(&path)? {
        return Ok(Some(found));
      }
    } else if path.file_name().and_then(|n| n.to_str()) == Some("config.json") {
      return Ok(Some(path));
    }
  }
  Ok(None)
}

fn flatten_pack_dir(root_dir: &Path, config_path: &Path) -> Result<(), AppError> {
  let config_dir = config_path
    .parent()
    .ok_or_else(|| AppError::InvalidPack("config.json inválido".into()))?;
  if config_dir == root_dir {
    return Ok(());
  }

  let root_name = root_dir
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("import");
  let flat_dir = root_dir
    .parent()
    .unwrap_or(root_dir)
    .join(format!("{}-flat", root_name));

  fs::create_dir_all(&flat_dir)?;
  for entry in fs::read_dir(config_dir)? {
    let entry = entry?;
    let from = entry.path();
    let name = entry.file_name();
    let to = flat_dir.join(name);
    fs::rename(from, to)?;
  }

  fs::remove_dir_all(root_dir)?;
  fs::rename(flat_dir, root_dir)?;

  Ok(())
}

fn validate_pack_with_wayvibes(pack_path: &Path) -> Result<(), AppError> {
  let path = pack_path
    .to_str()
    .ok_or_else(|| AppError::InvalidPack("Caminho inválido".into()))?;

  let before_pid = get_running_pid().unwrap_or(None);
  let status = Command::new("wayvibes")
    .arg(path)
    .arg("-v")
    .arg("1.0")
    .arg("--background")
    .status()
    .map_err(AppError::Io)?;

  if !status.success() {
    return Err(AppError::InvalidPack(
      "Pacote inválido (wayvibes não conseguiu iniciar)".into(),
    ));
  }

  if let Ok(after_pid) = get_running_pid() {
    if after_pid.is_some() && after_pid != before_pid {
      let _ = stop_pid(after_pid.unwrap());
    }
  }

  Ok(())
}

fn get_running_pid() -> Result<Option<u32>, AppError> {
  let output = Command::new("pgrep")
    .arg("-nx")
    .arg("wayvibes")
    .output()
    .map_err(AppError::Io)?;

  if !output.status.success() {
    return Ok(None);
  }

  let raw = String::from_utf8_lossy(&output.stdout).trim().to_string();
  if raw.is_empty() {
    return Ok(None);
  }
  raw.parse::<u32>()
    .map(Some)
    .map_err(|_| AppError::InvalidPack("PID inválido".into()))
}

fn stop_pid(pid: u32) -> Result<(), AppError> {
  let _ = Command::new("kill")
    .arg(pid.to_string())
    .output()
    .map_err(AppError::Io)?;
  Ok(())
}

fn is_wayvibes_installed() -> bool {
  Command::new("which")
    .arg("wayvibes")
    .output()
    .map(|output| output.status.success())
    .unwrap_or(false)
}

fn sanitize_archive_path(path: &Path) -> Result<PathBuf, AppError> {
  let mut result = PathBuf::new();
  for component in path.components() {
    match component {
      Component::Normal(value) => result.push(value),
      Component::CurDir => {}
      _ => {
        return Err(AppError::InvalidPack(
          "Caminho inválido no arquivo".into(),
        ))
      }
    }
  }
  Ok(result)
}

fn temp_dir_name() -> String {
  let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_millis())
    .unwrap_or(0);
  format!("tmp-{}", timestamp)
}

fn slugify(name: &str) -> String {
  let mut result = String::new();
  let mut prev_dash = false;
  for ch in name.chars() {
    if ch.is_ascii_alphanumeric() {
      result.push(ch.to_ascii_lowercase());
      prev_dash = false;
    } else if !prev_dash {
      result.push('-');
      prev_dash = true;
    }
  }
  result.trim_matches('-').to_string()
}
