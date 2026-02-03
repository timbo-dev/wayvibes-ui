import { Loader2 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { SoundPackCard } from "../../components/sound-pack-card";
import type { AudioSpectrumController } from "../../hooks/use-audio-spectrum";
import { openPackInExplorer } from "../../services/sound-pack-service";
import { useAppStore } from "../../stores/app-store";

interface SoundPacksPanelProps {
  onImportClick: () => void;
  pulseId: number;
  audioSpectrum: AudioSpectrumController;
}

export function SoundPacksPanel({
  onImportClick,
  pulseId,
  audioSpectrum,
}: SoundPacksPanelProps) {
  const {
    soundPacks,
    activePackId,
    setActivePack,
    deleteSoundPack,
    wayvibesStatus,
    isLoading,
  } = useAppStore();
  const isDisabled = !wayvibesStatus.installed || isLoading;
  const showSkeletonList = isLoading && soundPacks.length === 0;

  const handleOpenInExplorer = async (packId: string) => {
    try {
      await openPackInExplorer(packId);
    } catch (error) {
      console.error("Failed to open pack in explorer:", error);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#E0E0E0]">Pacotes de som</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onImportClick}
          disabled={!wayvibesStatus.installed || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importar pacote
            </span>
          ) : (
            "Importar pacote"
          )}
        </Button>
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {showSkeletonList ? (
          <>
            <div className="rounded-lg border border-[#363636] bg-[#1A1A1A] p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <div className="rounded-lg border border-[#363636] bg-[#1A1A1A] p-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
            <div className="rounded-lg border border-[#363636] bg-[#1A1A1A] p-4">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          </>
        ) : soundPacks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#363636] p-4 text-xs text-[#727272]">
            Arraste um arquivo compacto para importar ou use o botão acima.
          </div>
        ) : (
          soundPacks.map((pack) => (
            <SoundPackCard
              key={pack.id}
              pack={pack}
              isActive={pack.id === activePackId}
              pulseId={pulseId}
              audioSpectrum={audioSpectrum}
              disabled={isDisabled}
              onActivate={(id) => void setActivePack(id)}
              onRemove={(id) => void deleteSoundPack(id)}
              onOpenInExplorer={(id) => void handleOpenInExplorer(id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
