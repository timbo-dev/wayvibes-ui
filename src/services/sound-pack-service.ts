import { invoke } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";

import type { SoundPack } from "../types";

export async function getSoundPacks(): Promise<SoundPack[]> {
  return invoke<SoundPack[]>("get_sound_packs");
}

export async function importSoundPack(path: string): Promise<SoundPack> {
  return invoke<SoundPack>("import_sound_pack", { path });
}

export async function deleteSoundPack(packId: string): Promise<void> {
  await invoke("delete_sound_pack", { packId });
}

export async function getPackPath(packId: string): Promise<string> {
  return invoke<string>("get_pack_path", { packId });
}

export async function openPackInExplorer(packId: string): Promise<void> {
  const path = await getPackPath(packId);
  await revealItemInDir(path);
}
