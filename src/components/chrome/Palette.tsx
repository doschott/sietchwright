import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KIT_LIST } from "@/lib/pieces";
import { useYard } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Palette() {
  const placeType = useYard((s) => s.placeType);
  const setPlaceType = useYard((s) => s.setPlaceType);
  const placeStory = useYard((s) => s.placeStory);
  const setPlaceStory = useYard((s) => s.setPlaceStory);
  const setOverlay = useYard((s) => s.setOverlay);
  const stories = useYard((s) => s.spec.stories);

  return (
    <section
      aria-label="CHOAM kit"
      className="flex h-full max-h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface/95 p-2 shadow-panel"
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-xs font-medium tracking-wide text-muted">CHOAM kit</p>
        <div className="flex items-center gap-1">
          <div className="flex overflow-hidden rounded-md border border-border">
            {Array.from({ length: Math.max(3, stories) }, (_, s) => s).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPlaceStory(s)}
                className={cn(
                  "h-8 min-w-8 px-2 text-xs",
                  placeStory === s ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                L{s}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Close kit"
            onClick={() => {
              setPlaceType(null);
              setOverlay("none");
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-0.5">
          {KIT_LIST.map((p) => {
            const on = placeType === p.type;
            return (
              <button
                key={p.type}
                type="button"
                onClick={() => setPlaceType(on ? null : p.type)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-left",
                  on ? "bg-accent text-accent-fg" : "text-fg hover:bg-elevated",
                )}
              >
                <Badge
                  className={cn(
                    "min-w-8 justify-center border-0 font-semibold",
                    on ? "bg-accent-fg/15 text-accent-fg" : "text-fg",
                  )}
                  style={on ? undefined : { background: p.marker, color: "#ede6d6" }}
                >
                  {p.code}
                </Badge>
                <span className="truncate text-sm">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      {placeType ? (
        <p className="mt-2 px-1 text-xs text-muted">
          {placeType === "garage_door"
            ? "Tap a wall face. The door spans two cells and two stories from that origin."
            : placeType === "pentashield"
              ? "Tap a wall face. The pentashield spans four cells and two or three stories from that origin."
              : "Tap the sand to place. Edges snap to the nearest face."}
        </p>
      ) : (
        <p className="mt-2 px-1 text-xs text-subtle">Pick a piece, then tap the yard.</p>
      )}
    </section>
  );
}
