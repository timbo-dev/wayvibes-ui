export interface WayvibesStatus {
  installed: boolean;
  running: boolean;
  version: string | null;
  pid?: number | null;
}

export interface SoundPack {
  id: string;
  name: string;
  version: string;
  author?: string | null;
  description?: string | null;
}

export interface AppConfig {
  activePackId: string | null;
  volume: number;
  paused: boolean;
}
