import { useEffect } from "react";
import { Toaster } from "sonner";
import { Viewport } from "@/components/scene/Viewport";
import { loadSave } from "@/lib/storage";
import { useYard } from "@/lib/store";
import { Hotkeys } from "./Hotkeys";
import { Inspector } from "./Inspector";
import { Legend } from "./Legend";
import { Palette } from "./Palette";
import { PromptDock } from "./PromptDock";
import { TopBar } from "./TopBar";

export function AppShell() {
  const generating = useYard((s) => s.generating);
  const selectedId = useYard((s) => s.selectedId);
  const showMarkers = useYard((s) => s.showMarkers);
  const pieceCount = useYard((s) => s.plan.pieces.length);

  useEffect(() => {
    const save = loadSave();
    useYard.setState({
      plan: save.plan,
      brief: save.brief,
      spec: save.spec,
      builtSpec: save.builtSpec,
      showMarkers: save.showMarkers,
    });
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <Hotkeys />
      <div className="absolute inset-0">
        <Viewport />
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto">
          <TopBar />
        </div>
        <div className="flex min-h-0 flex-1 items-stretch justify-between gap-3">
          <div className="pointer-events-auto hidden w-56 shrink-0 md:block">
            <Palette />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-end justify-between">
            {showMarkers ? (
              <div className="pointer-events-auto">
                <Legend />
              </div>
            ) : (
              <div />
            )}
            {pieceCount > 0 || selectedId ? (
              <div className="pointer-events-auto hidden w-72 lg:block">
                <Inspector />
              </div>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-2">
          {selectedId ? (
            <div className="lg:hidden">
              <Inspector compact />
            </div>
          ) : null}
          <div className="md:hidden">
            <Palette />
          </div>
          <PromptDock />
        </div>
      </div>
      {generating ? (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/40">
          <div className="rounded-xl border border-border bg-surface px-6 py-4 text-center shadow-panel">
            <p className="font-display text-lg tracking-wide">Raising walls</p>
            <p className="mt-1 text-sm text-muted">Built from your answers</p>
          </div>
        </div>
      ) : null}
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
