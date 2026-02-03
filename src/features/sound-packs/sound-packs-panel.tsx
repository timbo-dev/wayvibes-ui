import { Button } from "../../components/ui/button";
import { SoundPackCard } from "../../components/sound-pack-card";
import { openPackInExplorer } from "../../services/sound-pack-service";
import { useAppStore } from "../../stores/app-store";

interface SoundPacksPanelProps {
  onImportClick: () => void;
}

export function SoundPacksPanel({ onImportClick }: SoundPacksPanelProps) {
  const { soundPacks, activePackId, setActivePack, deleteSoundPack } =
    useAppStore();

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
        <Button variant="outline" size="sm" onClick={onImportClick}>
          Importar .zip
        </Button>
      </div>

      <div className="space-y-2">
        {soundPacks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#363636] p-4 text-xs text-[#727272]">
            Arraste um arquivo .zip para importar ou use o botão acima.
          </div>
        ) : (
          soundPacks.map((pack) => (
            <SoundPackCard
              key={pack.id}
              pack={pack}
              isActive={pack.id === activePackId}
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
