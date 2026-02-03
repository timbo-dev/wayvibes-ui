import { Loader2 } from "lucide-react";

import { Skeleton } from "../../components/ui/skeleton";
import { Switch } from "../../components/ui/switch";
import { useAppStore } from "../../stores/app-store";

export function SettingsPanel() {
  const { autostartEnabled, setAutostartEnabled, isLoading } = useAppStore();
  const showSkeleton = isLoading && autostartEnabled === false;

  if (showSkeleton) {
    return (
      <section className="rounded-lg border border-[#363636] bg-[#1A1A1A] p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-10" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#363636] bg-[#1A1A1A] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#E0E0E0]">
            Iniciar com o sistema
          </h3>
          <p className="text-xs text-[#727272]">
            Abrir em segundo plano ao ligar o computador
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#727272]" /> : null}
          <Switch
            checked={autostartEnabled}
            onCheckedChange={(value) => void setAutostartEnabled(value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </section>
  );
}
