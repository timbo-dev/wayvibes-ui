import { RefreshCw } from "lucide-react";

import { Button } from "./components/ui/button";
import { AudioControlsPanel } from "./features/audio-controls/audio-controls-panel";
import { SettingsPanel } from "./features/settings/settings-panel";
import { SoundPacksPanel } from "./features/sound-packs/sound-packs-panel";
import { WayvibesStatusPanel } from "./features/wayvibes-status/wayvibes-status-panel";
import { useAudioSpectrum } from "./hooks/use-audio-spectrum";
import { useAppInit } from "./hooks/use-app-init";
import { useKeypressFeedback } from "./hooks/use-keypress-feedback";
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

  const {
    onImportClick,
    onDrop,
    onDragOver,
    onDragEnter,
    onDragLeave,
    isDragging,
  } = useSoundPackImport();
  const { lastKey, pulseId } = useKeypressFeedback();
  const audioSpectrum = useAudioSpectrum();

  return (
    <div
      className="relative min-h-screen bg-[#1f1f1f]"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      {isDragging ? (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#1f1f1f]/80 p-4">
          <div className="w-full max-w-xl rounded-xl border border-dashed border-[#79b8ff]/60 bg-[#1A1A1A] p-6 text-center">
            <p className="text-sm font-medium text-[#E0E0E0]">Solte o arquivo aqui</p>
            <p className="mt-1 text-xs text-[#727272]">
              Suporta .zip, .rar, .7z, .tar, .tar.gz e .gz
            </p>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex h-full w-full max-w-[600px] flex-col gap-4 p-4">
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

        <WayvibesStatusPanel lastKey={lastKey} audioSpectrum={audioSpectrum} />
        <AudioControlsPanel />
        <SoundPacksPanel
          onImportClick={() => void onImportClick()}
          pulseId={pulseId}
          audioSpectrum={audioSpectrum}
        />
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
