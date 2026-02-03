use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};

use zip::ZipArchive;

use crate::error::AppError;
use crate::models::SoundPack;

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
    
    // Try config.json (wayvibes format)
    let config_path = path.join("config.json");
    
    let config: serde_json::Value = if config_path.exists() {
      let content = fs::read_to_string(config_path)?;
      serde_json::from_str(&content)?
    } else {
      // No config found, skip this folder
      continue;
    };
    
    let name = config.get("name")
      .and_then(|v| v.as_str())
      .unwrap_or(&pack_id)
      .to_string();
    let version = config.get("version")
      .and_then(|v| v.as_str())
      .unwrap_or("1.0.0")
      .to_string();
    let author = config.get("author")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string());
    let description = config.get("description")
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

pub fn import_pack(zip_path: &Path, packs_dir: &Path) -> Result<SoundPack, AppError> {
  println!("[import_pack] Opening zip: {:?}", zip_path);
  
  let file = File::open(zip_path).map_err(|e| {
    println!("[import_pack] Failed to open file: {}", e);
    AppError::Io(e)
  })?;
  
  let mut archive = ZipArchive::new(file).map_err(|e| {
    println!("[import_pack] Failed to read zip: {}", e);
    AppError::Zip(e)
  })?;

  // List all files and find config.json location
  println!("[import_pack] Zip contains {} files:", archive.len());
  let mut config_path: Option<String> = None;
  let mut root_prefix: Option<String> = None;
  
  for i in 0..archive.len() {
    if let Ok(entry) = archive.by_index(i) {
      let name = entry.name().to_string();
      println!("  - {}", name);
      
      // Look for config.json (wayvibes format) or manifest.json
      if name.ends_with("config.json") {
        config_path = Some(name.clone());
        // Extract the prefix (folder containing the config)
        if let Some(idx) = name.rfind('/') {
          root_prefix = Some(name[..=idx].to_string());
        }
      }
    }
  }

  let config_path = config_path.ok_or_else(|| {
    println!("[import_pack] ERROR: No config.json or manifest.json found");
    AppError::InvalidPack("config.json não encontrado".into())
  })?;
  
  println!("[import_pack] Found config at: {}", config_path);
  let prefix = root_prefix.clone().unwrap_or_default();
  println!("[import_pack] Root prefix: '{}'", prefix);

  // Read and parse config
  let config: serde_json::Value = {
    let mut config_file = archive.by_name(&config_path)?;
    let mut content = String::new();
    config_file.read_to_string(&mut content)?;
    println!("[import_pack] Config content: {}", content);
    serde_json::from_str(&content)?
  };

  // Extract pack name from config or zip filename
  let pack_name = config.get("name")
    .and_then(|v| v.as_str())
    .map(|s| s.to_string())
    .unwrap_or_else(|| {
      // Fallback: use zip filename or folder name
      zip_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown-pack")
        .to_string()
    });
  
  let pack_id = slugify(&pack_name);
  println!("[import_pack] Pack name: {}, id: {}", pack_name, pack_id);
  
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
  fs::create_dir_all(&target_dir)?;

  // Extract files, removing the prefix folder
  println!("[import_pack] Extracting files to {:?}", target_dir);
  for index in 0..archive.len() {
    let mut entry = archive.by_index(index)?;
    let entry_name = entry.name().to_string();
    
    // Skip directories
    if entry_name.ends_with('/') {
      continue;
    }
    
    // Remove prefix folder from path
    let relative_path = if !prefix.is_empty() && entry_name.starts_with(&prefix) {
      &entry_name[prefix.len()..]
    } else {
      &entry_name
    };
    
    if relative_path.is_empty() {
      continue;
    }
    
    let sanitized = sanitize_zip_path(relative_path)?;
    let out_path = target_dir.join(&sanitized);
    
    println!("[import_pack] Extracting: {} -> {:?}", entry_name, out_path);
    
    if let Some(parent) = out_path.parent() {
      fs::create_dir_all(parent)?;
    }
    let mut outfile = File::create(&out_path)?;
    let mut buffer = Vec::new();
    entry.read_to_end(&mut buffer)?;
    outfile.write_all(&buffer)?;
  }

  // Get version and author from config if available
  let version = config.get("version")
    .and_then(|v| v.as_str())
    .unwrap_or("1.0.0")
    .to_string();
  let author = config.get("author")
    .and_then(|v| v.as_str())
    .map(|s| s.to_string());

  println!("[import_pack] Pack imported successfully: {}", pack_id);

  Ok(SoundPack {
    id: pack_id,
    name: pack_name,
    version,
    author,
    description: None,
  })
}

pub fn delete_pack(pack_id: &str, packs_dir: &Path) -> Result<(), AppError> {
  let target_dir = packs_dir.join(pack_id);
  if !target_dir.exists() {
    return Err(AppError::InvalidPack("Pacote não encontrado".into()));
  }
  fs::remove_dir_all(target_dir)?;
  Ok(())
}

fn sanitize_zip_path(path: &str) -> Result<PathBuf, AppError> {
  let mut result = PathBuf::new();
  for component in Path::new(path).components() {
    match component {
      Component::Normal(value) => result.push(value),
      Component::CurDir => {}
      _ => {
        return Err(AppError::InvalidPack(
          "Caminho inválido no zip".into(),
        ))
      }
    }
  }
  Ok(result)
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
