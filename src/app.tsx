import { RefreshCw } from "lucide-react";

import { Button } from "./components/ui/button";
import { AudioControlsPanel } from "./features/audio-controls/audio-controls-panel";
import { SettingsPanel } from "./features/settings/settings-panel";
import { SoundPacksPanel } from "./features/sound-packs/sound-packs-panel";
import { WayvibesStatusPanel } from "./features/wayvibes-status/wayvibes-status-panel";
import { useAppInit } from "./hooks/use-app-init";
import { useSoundPackImport } from "./hooks/use-sound-pack-import";
import { cn } from "./lib/utils";
import { useAppStore } from "./stores/app-store";

function App() {
  useAppInit();

  const {
    isLoading,
    lastError,
    refreshAll,
  } = useAppStore();

  const { onImportClick, onDrop, onDragOver } = useSoundPackImport();

  return (
    <div
      className="min-h-screen bg-[#1f1f1f]"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="mx-auto flex h-full max-w-md flex-col gap-4 p-4">
        <header
          className="flex items-center justify-between select-none"
          data-tauri-drag-region
        >
          <div>
            <h1 className="text-lg font-semibold text-[#FAFAFA]">WayVibes</h1>
            <p className="text-xs text-[#727272]">
              Interface para pacotes de som do teclado
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refreshAll()}
            disabled={isLoading}
            aria-label="Atualizar"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </header>

        <WayvibesStatusPanel />
        <AudioControlsPanel />
        <SoundPacksPanel onImportClick={() => void onImportClick()} />
        <SettingsPanel />

        {lastError ? (
          <div className="rounded-md border border-[#FF7A84]/30 bg-[#FF7A84]/5 p-3 text-xs text-[#FF7A84]">
            {lastError}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
