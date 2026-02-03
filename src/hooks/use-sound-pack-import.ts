import { useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";

import { isZipPath } from "../lib/utils";
import { useAppStore } from "../stores/app-store";

export function useSoundPackImport() {
  const importSoundPack = useAppStore((state) => state.importSoundPack);

  const onImportClick = useCallback(async () => {
    const result = await open({
      multiple: false,
      filters: [{ name: "Pacotes zip", extensions: ["zip"] }],
    });

    if (typeof result === "string" && isZipPath(result)) {
      await importSoundPack(result);
    }
  }, [importSoundPack]);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      const filePath = (file as File & { path?: string })?.path ?? "";
      if (filePath && isZipPath(filePath)) {
        await importSoundPack(filePath);
      }
    },
    [importSoundPack],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setup = async () => {
      unlisten = await listen("tray-import", () => {
        void onImportClick();
      });
    };
    void setup();
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [onImportClick]);

  return { onImportClick, onDrop, onDragOver };
}
