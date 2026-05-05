import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BellRingIcon, MenuIcon, RefreshCwIcon, WifiIcon } from "lucide-react";

export function SiteHeader({
  title,
  visibleCount,
  isLive,
  autoSyncEnabled,
  syncing,
  backgroundSyncing,
  showSyncControls = true,
  visibleLabel = "visibles",
  onOpenMobileSidebar,
  onToggleAutoSync,
  onSync
}: {
  title: string;
  visibleCount: number;
  isLive: boolean;
  autoSyncEnabled: boolean;
  syncing: boolean;
  backgroundSyncing: boolean;
  showSyncControls?: boolean;
  visibleLabel?: string;
  onOpenMobileSidebar: () => void;
  onToggleAutoSync: () => void;
  onSync: () => void;
}) {
  const isUpdating = syncing;
  const showAutoSyncActivity = backgroundSyncing && !syncing;

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center border-b border-white/10 bg-[#0c1117]/92 text-white backdrop-blur">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            className="border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onOpenMobileSidebar}
          >
            <MenuIcon className="size-4" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/42">Panel de control</p>
            <h1 className="text-base font-medium text-white md:text-lg">{title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-white/10 bg-white/6 text-white/80">
            <BellRingIcon className="mr-1 size-3" />
            {visibleCount} {visibleLabel}
          </Badge>
          <Badge
            variant="outline"
            className={
              isLive
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 bg-white/6 text-white/60"
            }
          >
            <WifiIcon className="mr-1 size-3" />
            {isLive ? "Live" : "Offline"}
          </Badge>
          {showSyncControls ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                onClick={onToggleAutoSync}
              >
                {autoSyncEnabled ? "Auto-sync ON" : "Auto-sync OFF"}
              </Button>
              <Button
                size="sm"
                className="bg-[#ff845d] text-black hover:bg-[#ff9b7b]"
                onClick={onSync}
                disabled={isUpdating}
              >
                <RefreshCwIcon className={`mr-1 size-4 ${syncing || showAutoSyncActivity ? "animate-spin" : ""}`} />
                {isUpdating ? "Sincronizando" : showAutoSyncActivity ? "Auto-sync" : "Sincronizar"}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
