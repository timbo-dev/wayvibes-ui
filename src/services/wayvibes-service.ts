import { invoke } from "@tauri-apps/api/core";

import type { WayvibesStatus } from "../types";

export async function getWayvibesStatus(): Promise<WayvibesStatus> {
  return invoke<WayvibesStatus>("get_wayvibes_status");
}

export async function setVolume(volume: number): Promise<void> {
  await invoke("set_volume", { volume });
}

export async function togglePause(): Promise<void> {
  await invoke("toggle_pause");
}

export async function stopWayvibes(): Promise<void> {
  await invoke("stop_wayvibes");
}

export async function setActivePack(packId: string): Promise<void> {
  await invoke("set_active_pack", { packId });
}
