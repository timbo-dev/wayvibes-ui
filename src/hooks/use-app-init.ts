import { useEffect } from "react";

import { useAppStore } from "../stores/app-store";

export function useAppInit() {
  const refreshAll = useAppStore((state) => state.refreshAll);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);
}
