import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";

import { isArchivePath } from "../lib/utils";
import { useAppStore } from "../stores/app-store";

export function useSoundPackImport() {
  const importSoundPack = useAppStore((state) => state.importSoundPack);
  const setLastError = useAppStore((state) => state.setLastError);
  const isInstalled = useAppStore((state) => state.wayvibesStatus.installed);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const onImportClick = useCallback(async () => {
    if (!isInstalled) {
      setLastError("Instale o wayvibes para importar pacotes.");
      return;
    }
    const result = await open({
      multiple: false,
      filters: [{ name: "Pacotes", extensions: ["zip", "rar", "7z", "tar", "gz", "tgz"] }],
    });

    if (typeof result === "string") {
      if (!isArchivePath(result)) {
        setLastError("Formato inválido. Use .zip, .rar, .7z, .tar, .tar.gz ou .gz.");
        return;
      }
      await importSoundPack(result);
    }
  }, [importSoundPack, isInstalled, setLastError]);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      if (!isInstalled) {
        setLastError("Instale o wayvibes para importar pacotes.");
        return;
      }
      const file = event.dataTransfer.files?.[0];
      const filePath = (file as File & { path?: string })?.path ?? "";
      if (filePath && isArchivePath(filePath)) {
        await importSoundPack(filePath);
      } else if (filePath) {
        setLastError("Formato inválido. Use .zip, .rar, .7z, .tar, .tar.gz ou .gz.");
      }
    },
    [importSoundPack, isInstalled, setLastError],
  );

  const onDragEnter = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      if (!isInstalled) {
        return;
      }
      if (event.dataTransfer.types?.includes("Files")) {
        dragCounter.current += 1;
        setIsDragging(true);
      }
    },
    [isInstalled],
  );

  const onDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    if (!isInstalled) {
      return;
    }
    if (event.dataTransfer.types?.includes("Files")) {
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    }
  }, [isInstalled]);

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

  return { onImportClick, onDrop, onDragOver, onDragEnter, onDragLeave, isDragging };
}
