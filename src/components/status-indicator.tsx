import { BadgeCheck, CircleAlert, Loader2, MoreVertical, Square } from "lucide-react";

import type { AudioSpectrumController } from "../hooks/use-audio-spectrum";
import type { WayvibesStatus } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";

interface StatusIndicatorProps {
  status: WayvibesStatus;
  className?: string;
  onForceStop?: () => void;
  lastKey?: string | null;
  audioSpectrum?: AudioSpectrumController;
  isLoading?: boolean;
}

export function StatusIndicator({
  status,
  className,
  onForceStop,
  lastKey,
  audioSpectrum,
  isLoading = false,
}: StatusIndicatorProps) {
  if (!status.installed) {
    return (
      <Card className={cn("border-[#FF7A84]/30 bg-[#FF7A84]/5", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-[#FF7A84]">
            <CircleAlert className="h-4 w-4" />
            Wayvibes não instalado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#727272]">
            Instale com: <span className="font-mono text-[#9db1c5]">sudo pacman -S wayvibes</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-[#79b8ff]/20 bg-[#79b8ff]/5", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm text-[#E0E0E0]">
          <BadgeCheck className="h-4 w-4 text-[#79b8ff]" />
          Wayvibes disponível
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        </CardTitle>
        {status.running ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Opções</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-[#FF7A84] focus:text-[#FF7A84]"
                onClick={onForceStop}
              >
                <Square className="h-4 w-4" />
                Forçar parada
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[#727272]">
          {status.running ? "Em execução" : "Pronto para iniciar"}
          {status.pid ? ` • PID ${status.pid}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-[#727272]">
          <span>Última tecla</span>
          <span className="rounded bg-[#2A2A2A] px-2 py-1 font-mono text-[#E0E0E0]">
            {lastKey ?? "—"}
          </span>
        </div>
        {audioSpectrum ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                audioSpectrum.isEnabled
                  ? audioSpectrum.stop()
                  : void audioSpectrum.start()
              }
            >
              {audioSpectrum.isEnabled
                ? "Desativar visualizador"
                : "Ativar visualizador"}
            </Button>
            {audioSpectrum.error ? (
              <span className="text-xs text-[#FF7A84]">
                {audioSpectrum.error}
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
