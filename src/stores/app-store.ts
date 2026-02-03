import { create } from "zustand";

import type { AppConfig, SoundPack, WayvibesStatus } from "../types";
import { getAutostartEnabled, setAutostartEnabled } from "../services/autostart-service";
import { getConfig } from "../services/config-service";
import {
  deleteSoundPack,
  getSoundPacks,
  importSoundPack,
} from "../services/sound-pack-service";
import {
  getWayvibesStatus,
  setActivePack,
  setVolume,
  stopWayvibes,
  togglePause,
} from "../services/wayvibes-service";

interface AppState {
  wayvibesStatus: WayvibesStatus;
  soundPacks: SoundPack[];
  activePackId: string | null;
  volume: number;
  paused: boolean;
  autostartEnabled: boolean;
  isLoading: boolean;
  lastError: string | null;
  refreshAll: () => Promise<void>;
  importSoundPack: (path: string) => Promise<void>;
  deleteSoundPack: (packId: string) => Promise<void>;
  setActivePack: (packId: string) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePause: () => Promise<void>;
  stopWayvibes: () => Promise<void>;
  setAutostartEnabled: (enabled: boolean) => Promise<void>;
  setLastError: (message: string | null) => void;
}

const defaultStatus: WayvibesStatus = {
  installed: false,
  running: false,
  version: null,
  pid: null,
};

function applyConfig(state: AppState, config: AppConfig) {
  return {
    ...state,
    activePackId: config.activePackId,
    volume: config.volume,
    paused: config.paused,
  };
}

export const useAppStore = create<AppState>((set) => ({
  wayvibesStatus: defaultStatus,
  soundPacks: [],
  activePackId: null,
  volume: 0.7,
  paused: false,
  autostartEnabled: false,
  isLoading: false,
  lastError: null,
  setLastError: (message) => set({ lastError: message }),
  refreshAll: async () => {
    set({ isLoading: true, lastError: null });
    try {
      const [status, packs, config, autostartEnabled] = await Promise.all([
        getWayvibesStatus(),
        getSoundPacks(),
        getConfig(),
        getAutostartEnabled(),
      ]);
      set((state) => ({
        ...applyConfig(state, config),
        wayvibesStatus: status,
        soundPacks: packs,
        autostartEnabled,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        lastError: error instanceof Error ? error.message : "Falha ao atualizar",
      });
    }
  },
  importSoundPack: async (path) => {
    set({ isLoading: true, lastError: null });
    try {

      console.log('is executing here? before importSoundPack')
      await importSoundPack(path);

      console.log('is executing here?')
      const [packs, config] = await Promise.all([getSoundPacks(), getConfig()]);
      set((state) => ({
        ...applyConfig(state, config),
        soundPacks: packs,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        lastError:
          error instanceof Error ? error.message : "Falha ao importar pacote",
      });
    }
  },
  deleteSoundPack: async (packId) => {
    set({ isLoading: true, lastError: null });
    try {
      await deleteSoundPack(packId);
      const [packs, config] = await Promise.all([getSoundPacks(), getConfig()]);
      set((state) => ({
        ...applyConfig(state, config),
        soundPacks: packs,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        lastError:
          error instanceof Error ? error.message : "Falha ao remover pacote",
      });
    }
  },
  setActivePack: async (packId) => {
    set({ isLoading: true, lastError: null });
    try {
      await setActivePack(packId);
      const [config, status] = await Promise.all([
        getConfig(),
        getWayvibesStatus(),
      ]);
      set((state) => ({
        ...applyConfig(state, config),
        wayvibesStatus: status,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        lastError:
          error instanceof Error ? error.message : "Falha ao ativar pacote",
      });
    }
  },
  setVolume: async (volume) => {
    set({ volume });
    try {
      await setVolume(volume);
      const status = await getWayvibesStatus();
      set({ wayvibesStatus: status });
    } catch (error) {
      set({
        lastError:
          error instanceof Error ? error.message : "Falha ao atualizar volume",
      });
    }
  },
  togglePause: async () => {
    set({ isLoading: true, lastError: null });
    try {
      await togglePause();
      const [config, status] = await Promise.all([
        getConfig(),
        getWayvibesStatus(),
      ]);
      set((state) => ({
        ...applyConfig(state, config),
        wayvibesStatus: status,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        lastError:
          error instanceof Error ? error.message : "Falha ao alternar pausa",
      });
    }
  },
  stopWayvibes: async () => {
    set({ isLoading: true, lastError: null });
    try {
      await stopWayvibes();
      const [status, config] = await Promise.all([
        getWayvibesStatus(),
        getConfig(),
      ]);
      set((state) => ({
        ...applyConfig(state, config),
        wayvibesStatus: status,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        lastError:
          error instanceof Error ? error.message : "Falha ao parar o Wayvibes",
      });
    }
  },
  setAutostartEnabled: async (enabled) => {
    set({ isLoading: true, lastError: null });
    try {
      const autostartEnabled = await setAutostartEnabled(enabled);
      set({ autostartEnabled, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        lastError:
          error instanceof Error
            ? error.message
            : "Falha ao atualizar inicialização automática",
      });
    }
  },
}));
