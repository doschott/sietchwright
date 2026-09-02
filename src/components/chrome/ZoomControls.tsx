import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useYard } from "@/lib/store";

export function ZoomControls() {
  const zoomBy = useYard((s) => s.zoomBy);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface/92 shadow-panel">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-none"
        aria-label="Zoom in"
        title="Zoom in (+)"
        onClick={() => zoomBy("in")}
      >
        <Plus className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-none border-t border-border"
        aria-label="Zoom out"
        title="Zoom out (−)"
        onClick={() => zoomBy("out")}
      >
        <Minus className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-none border-t border-border"
        aria-label="Fit yard in view"
        title="Fit yard (F)"
        onClick={() => zoomBy("fit")}
      >
        <Maximize2 className="size-4" />
      </Button>
    </div>
  );
}
