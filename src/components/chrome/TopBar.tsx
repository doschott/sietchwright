import { Box, Eye, EyeOff, Grid3x3, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countPieces } from "@/lib/plan";
import { PIECES } from "@/lib/pieces";
import { useYard } from "@/lib/store";
import { cn } from "@/lib/utils";

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.726-8.835L1.254 2.25H8.08l4.258 5.636 5.906-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

function shareOnX() {
  const { plan } = useYard.getState();
  const n = plan.pieces.length;
  const granite = plan.pieces.reduce((sum, p) => sum + PIECES[p.type].granite, 0);
  const counts = countPieces(plan);
  const gd = counts.garage_door ?? 0;
  const garageLine = gd > 0 ? ` · ${gd} two-high garage door${gd > 1 ? "s" : ""}` : "";
  const page = typeof window !== "undefined" ? window.location.href : "";
  const text =
    n > 0
      ? `I raised "${plan.name}" in Sietchwright — ${n} CHOAM pieces, ~${granite} granite${garageLine}.\n\n${plan.brief}\n\n${page}`
      : `Laying out a Dune: Awakening base in Sietchwright. Empty yard, CHOAM kit, two-high garage doors.\n\n${page}`;
  const href = `https://x.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 900))}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

export function TopBar() {
  const showMarkers = useYard((s) => s.showMarkers);
  const toggleMarkers = useYard((s) => s.toggleMarkers);
  const showGrid = useYard((s) => s.showGrid);
  const toggleGrid = useYard((s) => s.toggleGrid);
  const view = useYard((s) => s.view);
  const setView = useYard((s) => s.setView);
  const undo = useYard((s) => s.undo);
  const resetYard = useYard((s) => s.resetYard);
  const history = useYard((s) => s.history);
  const pieceCount = useYard((s) => s.plan.pieces.length);

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="rounded-xl border border-border bg-surface/92 px-3 py-2 shadow-panel">
        <p className="font-display text-lg leading-tight tracking-wide text-fg">
          Sietchwright
        </p>
        <p className="text-xs text-muted">CHOAM-standard base planner</p>
      </div>
      <div className="flex flex-wrap justify-end gap-1.5">
        <div className="flex overflow-hidden rounded-md border border-border bg-surface/92 shadow-panel">
          {(
            [
              ["iso", "Iso"],
              ["top", "Top"],
              ["south", "South"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "h-11 px-3 text-xs",
                view === id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Button
          variant="secondary"
          size="icon"
          aria-label={showMarkers ? "Hide piece markers" : "Show piece markers"}
          onClick={toggleMarkers}
        >
          {showMarkers ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label={showGrid ? "Hide grid" : "Show grid"}
          onClick={toggleGrid}
        >
          <Grid3x3 className="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Undo"
          onClick={undo}
          disabled={history.length === 0}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Reset yard"
          onClick={resetYard}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant="secondary"
          onClick={shareOnX}
          aria-label="Share on X"
        >
          <XMark className="size-3.5" />
          <span className="hidden sm:inline">Share on X</span>
        </Button>
        <span className="hidden items-center rounded-md border border-border bg-surface/92 px-2 text-xs text-subtle md:flex">
          <Box className="mr-1 size-3.5" />
          {pieceCount > 0 ? `${pieceCount} pcs · ` : ""}R rotate · Del
        </span>
      </div>
    </header>
  );
}
