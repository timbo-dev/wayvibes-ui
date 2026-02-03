import { Switch } from "../../components/ui/switch";
import { useAppStore } from "../../stores/app-store";

export function SettingsPanel() {
  const { autostartEnabled, setAutostartEnabled } = useAppStore();

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
        <Switch
          checked={autostartEnabled}
          onCheckedChange={(value) => void setAutostartEnabled(value)}
        />
      </div>
    </section>
  );
}
