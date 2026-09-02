import { Boxes, ClipboardList, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { describeSpec, specsEqual } from "@/lib/spec";
import { useYard } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BottomDock() {
  const spec = useYard((s) => s.spec);
  const builtSpec = useYard((s) => s.builtSpec);
  const overlay = useYard((s) => s.overlay);
  const toggleOverlay = useYard((s) => s.toggleOverlay);
  const raiseFromSpec = useYard((s) => s.raiseFromSpec);
  const setGenerating = useYard((s) => s.setGenerating);
  const generating = useYard((s) => s.generating);
  const empty = useYard((s) => s.plan.pieces.length === 0);
  const dirty = Boolean(builtSpec && !specsEqual(spec, builtSpec));
  const pieceCount = useYard((s) => s.plan.pieces.length);

  function raise() {
    setGenerating(true);
    window.setTimeout(() => {
      raiseFromSpec();
      setGenerating(false);
      toast("Raised to match your answers.");
    }, 180);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-xl border border-border bg-surface/92 p-2 shadow-panel">
      <Button
        variant={overlay === "brief" ? "primary" : "secondary"}
        size="sm"
        aria-pressed={overlay === "brief"}
        aria-label={empty ? "Plan" : "Answers"}
        onClick={() => toggleOverlay("brief")}
      >
        <ClipboardList className="size-3.5" />
        <span className="hidden sm:inline">{empty ? "Plan" : "Answers"}</span>
      </Button>
      <Button
        variant={overlay === "kit" ? "primary" : "secondary"}
        size="sm"
        aria-pressed={overlay === "kit"}
        aria-label="CHOAM kit"
        onClick={() => toggleOverlay("kit")}
      >
        <Boxes className="size-3.5" />
        <span className="hidden sm:inline">CHOAM kit</span>
      </Button>
      <p className="min-w-0 flex-1 truncate px-1 text-xs text-muted" title={describeSpec(spec)}>
        {empty
          ? "Answer the plan, then raise. The yard stays visible."
          : dirty
            ? "Answers changed — raise again to match"
            : `${pieceCount} pcs · ${describeSpec(spec)}`}
      </p>
      <Button
        size="sm"
        className={cn("shrink-0", !dirty && !empty && "bg-elevated text-fg hover:bg-surface")}
        variant={dirty || empty ? "primary" : "secondary"}
        onClick={raise}
        disabled={generating}
      >
        <Warehouse className="size-3.5" />
        {generating ? "Raising…" : dirty ? "Raise again" : empty ? "Raise this sietch" : "Raise again"}
      </Button>
    </div>
  );
}
