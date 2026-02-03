import { CheckCircle2, FolderOpen, MoreVertical, Trash2 } from "lucide-react";

import type { AudioSpectrumController } from "../hooks/use-audio-spectrum";
import type { SoundPack } from "../types";
import { AudioSpectrum } from "./audio-spectrum";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";

interface SoundPackCardProps {
  pack: SoundPack;
  isActive: boolean;
  pulseId?: number;
  disabled?: boolean;
  audioSpectrum?: AudioSpectrumController;
  onActivate: (packId: string) => void;
  onRemove: (packId: string) => void;
  onOpenInExplorer: (packId: string) => void;
}

export function SoundPackCard({
  pack,
  isActive,
  pulseId = 0,
  disabled = false,
  audioSpectrum,
  onActivate,
  onRemove,
  onOpenInExplorer,
}: SoundPackCardProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        isActive
          ? "border-[#79b8ff]/30 bg-[#79b8ff]/5"
          : "hover:bg-[#262626]",
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="truncate text-sm font-medium text-[#E0E0E0]">
            {pack.name}
          </div>
          <div className="truncate text-xs text-[#727272]">
            {pack.author ? `por ${pack.author}` : "Autor desconhecido"} • v
            {pack.version}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isActive ? (
            <span className="flex items-center gap-2 text-xs text-[#79b8ff]">
              <CheckCircle2 className="h-4 w-4" />
              Ativo
              {audioSpectrum?.isEnabled ? (
                <AudioSpectrum controller={audioSpectrum} className="ml-1" />
              ) : pulseId > 0 ? (
                <span className="relative ml-1 h-2 w-10 overflow-hidden">
                  <span key={pulseId} className="key-wave absolute inset-0" />
                </span>
              ) : (
                <span className="ml-1 h-2 w-10 rounded-full bg-[#2A2A2A]" />
              )}
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onActivate(pack.id)}
              disabled={disabled}
            >
              Ativar
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Mais opções</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenInExplorer(pack.id)}>
                <FolderOpen className="h-4 w-4" />
                Abrir no explorador
              </DropdownMenuItem>
              {!isActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-[#FF7A84] focus:text-[#FF7A84]"
                    onClick={() => onRemove(pack.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover pacote
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
