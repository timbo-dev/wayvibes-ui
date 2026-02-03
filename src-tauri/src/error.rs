use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
  #[error("Falha ao acessar arquivos: {0}")]
  Io(#[from] std::io::Error),
  #[error("Falha ao processar zip: {0}")]
  Zip(#[from] zip::result::ZipError),
  #[error("Falha ao ler JSON: {0}")]
  Json(#[from] serde_json::Error),
  #[error("Configuração inválida: {0}")]
  InvalidConfig(String),
  #[error("Pacote inválido: {0}")]
  InvalidPack(String),
  #[error("Wayvibes não encontrado")]
  WayvibesMissing,
  #[error("Comando do Wayvibes falhou: {0}")]
  WayvibesCommand(String),
}
