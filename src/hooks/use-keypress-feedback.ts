import { useEffect, useState } from "react";

export function useKeypressFeedback() {
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState(0);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      const nextKey = event.key === " " ? "Space" : event.key;
      setLastKey(nextKey);
      setPulseId((prev) => prev + 1);
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return { lastKey, pulseId };
}
