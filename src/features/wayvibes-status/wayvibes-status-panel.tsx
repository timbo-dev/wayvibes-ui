import { StatusIndicator } from "../../components/status-indicator";
import { useAppStore } from "../../stores/app-store";

export function WayvibesStatusPanel() {
  const wayvibesStatus = useAppStore((state) => state.wayvibesStatus);
  return <StatusIndicator status={wayvibesStatus} />;
}
