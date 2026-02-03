import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled,
} from "@tauri-apps/plugin-autostart";

export async function getAutostartEnabled(): Promise<boolean> {
  return isEnabled();
}

export async function setAutostartEnabled(enabled: boolean): Promise<boolean> {
  if (enabled) {
    await enableAutostart();
  } else {
    await disableAutostart();
  }
  return isEnabled();
}
