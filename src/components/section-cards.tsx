import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { BellRingIcon, MailIcon, RefreshCwIcon, WifiIcon } from "lucide-react";

export function SectionCards({
  visibleCount,
  isLive,
  autoSyncEnabled,
  lastSyncedAt
}: {
  visibleCount: number;
  isLive: boolean;
  autoSyncEnabled: boolean;
  lastSyncedAt: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 xl:grid-cols-4">
      <Card className="dashboard-metric-card py-0 text-white">
        <CardHeader className="space-y-2 px-4 py-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardDescription className="text-white/44">Correos clasificados</CardDescription>
            <Badge variant="outline" className="border-white/10 bg-white/6 text-white/76">
              <MailIcon className="size-3.5" />
              activos
            </Badge>
          </div>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {visibleCount}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-0.5 border-0 px-4 pb-3 pt-0 text-sm">
          <div className="line-clamp-1 font-medium">Total procesado</div>
          <div className="line-clamp-1 text-xs text-white/44">No depende del limite visual del panel</div>
        </CardFooter>
      </Card>

      <Card className="dashboard-metric-card py-0 text-white">
        <CardHeader className="space-y-2 px-4 py-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardDescription className="text-white/44">Canal en vivo</CardDescription>
            <Badge
              variant="outline"
              className={
                isLive
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/6 text-white/60"
              }
            >
              <WifiIcon className="size-3.5" />
              {isLive ? "live" : "stop"}
            </Badge>
          </div>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {isLive ? "Conectado" : "Offline"}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-0.5 border-0 px-4 pb-3 pt-0 text-sm">
          <div className="line-clamp-1 font-medium">Canal en tiempo real</div>
          <div className="line-clamp-1 text-xs text-white/44">Actualiza apenas entra correo</div>
        </CardFooter>
      </Card>

      <Card className="dashboard-metric-card py-0 text-white">
        <CardHeader className="space-y-2 px-4 py-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardDescription className="text-white/44">Auto-sync</CardDescription>
            <Badge variant="outline" className="border-white/10 bg-white/6 text-white/76">
              <RefreshCwIcon className="size-3.5" />
              30s
            </Badge>
          </div>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {autoSyncEnabled ? "Encendido" : "Apagado"}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-0.5 border-0 px-4 pb-3 pt-0 text-sm">
          <div className="line-clamp-1 font-medium">Sync automatico</div>
          <div className="line-clamp-1 text-xs text-white/44">Cada 30s y al volver</div>
        </CardFooter>
      </Card>

      <Card className="dashboard-metric-card py-0 text-white">
        <CardHeader className="space-y-2 px-4 py-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardDescription className="text-white/44">Ultimo sync</CardDescription>
            <Badge variant="outline" className="border-white/10 bg-white/6 text-white/76">
              <BellRingIcon className="size-3.5" />
              backend
            </Badge>
          </div>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {lastSyncedAt
              ? new Intl.DateTimeFormat("es-BO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                }).format(new Date(lastSyncedAt))
              : "--:--:--"}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-0.5 border-0 px-4 pb-3 pt-0 text-sm">
          <div className="line-clamp-1 font-medium">Actividad reciente</div>
          <div className="line-clamp-1 text-xs text-white/44">Estado rapido del backend</div>
        </CardFooter>
      </Card>
    </div>
  );
}
