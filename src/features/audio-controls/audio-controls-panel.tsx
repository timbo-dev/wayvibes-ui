import { Loader2, PauseCircle, PlayCircle } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { VolumeSlider } from "../../components/volume-slider";
import { useAppStore } from "../../stores/app-store";

export function AudioControlsPanel() {
  const {
    wayvibesStatus,
    volume,
    paused,
    togglePause,
    setVolume,
    isLoading,
  } = useAppStore();
  const showSkeleton = isLoading && !wayvibesStatus.installed;

  if (showSkeleton) {
    return (
      <div className="space-y-3 rounded-lg border border-[#363636] bg-[#1A1A1A] p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-[#363636] bg-[#1A1A1A] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#E0E0E0]">
          Reprodução dos sons
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void togglePause()}
          disabled={!wayvibesStatus.installed || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando
            </span>
          ) : paused ? (
            <span className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Retomar
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <PauseCircle className="h-4 w-4" />
              Pausar
            </span>
          )}
        </Button>
      </div>
      <VolumeSlider
        volume={volume}
        disabled={!wayvibesStatus.installed || paused}
        onChange={(nextValue) => void setVolume(nextValue)}
      />
    </div>
  );
}
