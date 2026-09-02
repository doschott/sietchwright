import { useEffect, useState } from "react";
import { Toaster } from "sonner";

function useDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}
import { Viewport } from "@/components/scene/Viewport";
import { loadSave } from "@/lib/storage";
import { useYard } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { BottomDock } from "./BottomDock";
import { Hotkeys } from "./Hotkeys";
import { Inspector } from "./Inspector";
import { Legend } from "./Legend";
import { Palette } from "./Palette";
import { PromptDock } from "./PromptDock";
import { TopBar } from "./TopBar";
import { ZoomControls } from "./ZoomControls";

export function AppShell() {
  const generating = useYard((s) => s.generating);
  const selectedId = useYard((s) => s.selectedId);
  const showMarkers = useYard((s) => s.showMarkers);
  const overlay = useYard((s) => s.overlay);
  const chromeHidden = useYard((s) => s.chromeHidden);
  const toggleChrome = useYard((s) => s.toggleChrome);
  const pieceCount = useYard((s) => s.plan.pieces.length);
  const desktop = useDesktop();

  useEffect(() => {
    const save = loadSave();
    useYard.setState({
      plan: save.plan,
      brief: save.brief,
      spec: save.spec,
      builtSpec: save.builtSpec,
      showMarkers: save.showMarkers,
      overlay: save.plan.pieces.length === 0 ? "brief" : "none",
    });
  }, []);

  const showBrief = overlay === "brief";
  const showKit = overlay === "kit";
  const showInspect =
    overlay === "inspect" || Boolean(selectedId && overlay !== "brief" && overlay !== "kit");
  const sidePanel = showBrief ? "brief" : showKit ? "kit" : showInspect ? "inspect" : null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <Hotkeys />
      <div className="absolute inset-0">
        <Viewport />
      </div>

      {chromeHidden ? (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3">
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <Button variant="secondary" size="sm" onClick={toggleChrome}>
              Show menus
            </Button>
            <ZoomControls />
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto shrink-0">
            <TopBar />
          </div>
          <div className="flex min-h-0 flex-1 items-stretch justify-between gap-3">
            {desktop && showKit ? (
              <div className="pointer-events-auto w-[min(100%,18rem)] shrink-0">
                <Palette />
              </div>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col items-end justify-between">
              {desktop && showMarkers && !sidePanel ? (
                <div className="pointer-events-auto">
                  <Legend />
                </div>
              ) : (
                <div />
              )}
              <div className="pointer-events-auto">
                <ZoomControls />
              </div>
            </div>
            {desktop && (showBrief || showInspect) ? (
              <div className="pointer-events-auto w-[min(100%,24rem)] shrink-0">
                {showBrief ? <PromptDock /> : <Inspector />}
              </div>
            ) : null}
          </div>
          {!desktop && sidePanel ? (
            <div className="pointer-events-auto h-[min(58vh,34rem)] w-full shrink-0">
              {showBrief ? <PromptDock /> : null}
              {showKit ? <Palette /> : null}
              {showInspect && !showBrief && !showKit ? <Inspector /> : null}
            </div>
          ) : null}
          {!desktop && selectedId && !sidePanel ? (
            <div className="pointer-events-auto">
              <Inspector compact />
            </div>
          ) : null}
          <div className="pointer-events-auto shrink-0">
            <BottomDock />
          </div>
        </div>
      )}

      {generating ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/40">
          <div className="rounded-xl border border-border bg-surface px-6 py-4 text-center shadow-panel">
            <p className="font-display text-lg tracking-wide">Raising walls</p>
            <p className="mt-1 text-sm text-muted">
              {pieceCount ? "Rebuilt from your answers" : "Built from your answers"}
            </p>
          </div>
        </div>
      ) : null}
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
