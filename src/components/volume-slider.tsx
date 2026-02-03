import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Slider } from "./ui/slider";
import { toPercentage } from "../lib/utils";

interface VolumeSliderProps {
  volume: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function VolumeSlider({ volume, disabled, onChange }: VolumeSliderProps) {
  const [localValue, setLocalValue] = useState(volume);

  useEffect(() => {
    setLocalValue(volume);
  }, [volume]);

  const percentage = toPercentage(localValue);
  const Icon = percentage === 0 ? VolumeX : Volume2;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#727272]">
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          Volume
        </span>
        <span className="font-mono text-[#888888]">{percentage}%</span>
      </div>
      <Slider
        disabled={disabled}
        min={0}
        max={1}
        step={0.01}
        value={[localValue]}
        onValueChange={(value) => {
          const nextValue = value[0] ?? 0;
          setLocalValue(nextValue);
        }}
        onValueCommit={(value) => {
          const nextValue = value[0] ?? 0;
          onChange(nextValue);
        }}
      />
    </div>
  );
}
