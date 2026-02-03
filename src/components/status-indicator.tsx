import { BadgeCheck, CircleAlert } from "lucide-react";

import type { WayvibesStatus } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";

interface StatusIndicatorProps {
  status: WayvibesStatus;
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-[#E0E0E0]">
          <BadgeCheck className="h-4 w-4 text-[#79b8ff]" />
          Wayvibes disponível
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[#727272]">
          {status.running ? "Em execução" : "Pronto para iniciar"}{" "}
          {status.version ? `• v${status.version}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
