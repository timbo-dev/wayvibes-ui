import { invoke } from "@tauri-apps/api/core";

import type { AppConfig } from "../types";

export async function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>("get_config");
}
