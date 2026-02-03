import { StatusIndicator } from "../../components/status-indicator";
import { Skeleton } from "../../components/ui/skeleton";
import type { AudioSpectrumController } from "../../hooks/use-audio-spectrum";
import { useAppStore } from "../../stores/app-store";

interface WayvibesStatusPanelProps {
  lastKey: string | null;
  audioSpectrum: AudioSpectrumController;
}

export function WayvibesStatusPanel({
  lastKey,
  audioSpectrum,
}: WayvibesStatusPanelProps) {
  const { wayvibesStatus, stopWayvibes, isLoading } = useAppStore();
  const showSkeleton =
    isLoading &&
    !wayvibesStatus.installed &&
    !wayvibesStatus.running &&
    !wayvibesStatus.pid;

  if (showSkeleton) {
    return (
      <div className="rounded-lg border border-[#363636] bg-[#1A1A1A] p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <StatusIndicator
      status={wayvibesStatus}
      lastKey={lastKey}
      audioSpectrum={audioSpectrum}
      isLoading={isLoading}
      onForceStop={isLoading ? undefined : () => void stopWayvibes()}
    />
  );
}
