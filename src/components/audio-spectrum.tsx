import { useEffect, useRef } from "react";

import type { AudioSpectrumController } from "../hooks/use-audio-spectrum";
import { cn } from "../lib/utils";

interface AudioSpectrumProps {
  controller: AudioSpectrumController;
  className?: string;
}

export function AudioSpectrum({ controller, className }: AudioSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isEnabled, getFrequencyData } = controller;

  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let rafId = 0;
    const draw = () => {
      const data = getFrequencyData();
      if (!data) {
        return;
      }
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = data.length;
      const barWidth = Math.max(1, Math.floor(width / barCount));
      for (let i = 0; i < barCount; i += 1) {
        const value = data[i] ?? 0;
        const barHeight = Math.max(1, Math.round((value / 255) * height));
        const x = i * barWidth;
        const y = height - barHeight;
        ctx.fillStyle = "rgba(121, 184, 255, 0.9)";
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [getFrequencyData, isEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-2 w-12 rounded-full bg-[#2A2A2A]", className)}
      width={48}
      height={8}
    />
  );
}
