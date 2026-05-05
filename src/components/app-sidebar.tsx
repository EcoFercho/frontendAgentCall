import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GaugeIcon,
  LogOutIcon,
  MailIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersRoundIcon
} from "lucide-react";

export type PanelSection = "dashboard" | "config" | "shift-users";

export function AppSidebar({
  activeSection,
  onSectionChange,
  userEmail,
  isLive,
  collapsed,
  className,
  onToggleCollapsed,
  onLogout
}: {
  activeSection: PanelSection;
  onSectionChange: (section: PanelSection) => void;
  userEmail: string;
  isLive: boolean;
  collapsed: boolean;
  className?: string;
  onToggleCollapsed: () => void;
  onLogout: () => void;
}) {
  return (
    <aside
      className={cn(
        "shrink-0 border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(39,214,195,0.12),_transparent_28%),linear-gradient(180deg,_#0d1015_0%,_#131922_52%,_#171c26_100%)] text-white",
        collapsed ? "w-[92px]" : "w-[312px]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/8 text-white">
            <MailIcon className="size-4" />
          </div>
          {!collapsed ? (
            <div>
              <p className="text-sm font-semibold text-white">Voice Mail Ops</p>
              <p className="text-xs text-white/45">Centro de control Gmail</p>
            </div>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-xl border border-white/8 bg-white/6 text-white/72 hover:bg-white/10 hover:text-white"
          onClick={onToggleCollapsed}
        >
          {collapsed ? <ChevronRightIcon className="size-4" /> : <ChevronLeftIcon className="size-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-4">
          <div>
            {!collapsed ? (
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/38">
                Navegacion
              </p>
            ) : null}
            <div className="mt-3 space-y-1.5">
              <button
                className={`dashboard-nav-item ${activeSection === "dashboard" ? "dashboard-nav-item-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                type="button"
                onClick={() => onSectionChange("dashboard")}
              >
                <GaugeIcon className="size-4 shrink-0" />
                {!collapsed ? (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">Panel</div>
                    <div className="truncate text-xs text-current/55">Bandeja operativa y estado</div>
                  </div>
                ) : null}
              </button>

              <button
                className={`dashboard-nav-item ${activeSection === "config" ? "dashboard-nav-item-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                type="button"
                onClick={() => onSectionChange("config")}
              >
                <Settings2Icon className="size-4 shrink-0" />
                {!collapsed ? (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">Configuracion</div>
                    <div className="truncate text-xs text-current/55">Correo base y credenciales</div>
                  </div>
                ) : null}
              </button>

              <button
                className={`dashboard-nav-item ${activeSection === "shift-users" ? "dashboard-nav-item-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                type="button"
                onClick={() => onSectionChange("shift-users")}
              >
                <UsersRoundIcon className="size-4 shrink-0" />
                {!collapsed ? (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">Usuarios de turno</div>
                    <div className="truncate text-xs text-current/55">Prioridad, horario y disponibilidad</div>
                  </div>
                ) : null}
              </button>
            </div>
          </div>

          {!collapsed ? (
            <>
              <Card className="border-white/8 bg-white/5 py-0">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2 font-medium text-white">
                    <ShieldCheckIcon className="size-4 text-primary" />
                    Cuenta conectada
                  </div>
                  <p className="truncate text-sm text-white/78">{userEmail}</p>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    onClick={onLogout}
                  >
                    <LogOutIcon className="mr-1 size-4" />
                    Cerrar sesion
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>

      {!collapsed ? (
        <div className="border-t border-white/8 px-4 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/8">
              <MailIcon className="size-4 text-white/72" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{userEmail}</p>
              <p className="text-xs text-white/42">Administrador activo</p>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
