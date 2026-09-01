import { Badge } from "@/components/ui/badge";
import { PIECE_LIST } from "@/lib/pieces";
import { useYard } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Palette() {
  const placeType = useYard((s) => s.placeType);
  const setPlaceType = useYard((s) => s.setPlaceType);
  const placeStory = useYard((s) => s.placeStory);
  const setPlaceStory = useYard((s) => s.setPlaceStory);

  return (
    <div className="rounded-xl border border-border bg-surface/92 p-2 shadow-panel">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-xs font-medium tracking-wide text-muted">CHOAM kit</p>
        <div className="flex overflow-hidden rounded-md border border-border">
          {[0, 1, 2].map((s) => (
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
      </div>
      <div className="flex flex-nowrap gap-1 overflow-x-auto md:grid md:grid-cols-1 md:overflow-visible md:max-h-[52vh] md:overflow-y-auto">
        {PIECE_LIST.map((p) => {
          const on = placeType === p.type;
          return (
            <button
              key={p.type}
              type="button"
              onClick={() => setPlaceType(on ? null : p.type)}
              className={cn(
                "flex min-w-11 shrink-0 items-center gap-2 rounded-md px-1.5 py-2 text-left md:min-w-0 md:px-2",
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
              <span className="hidden truncate text-sm md:inline">{p.name}</span>
            </button>
          );
        })}
      </div>
      {placeType ? (
        <p className="mt-2 px-1 text-xs text-muted">
          {placeType === "garage_door"
            ? "Tap a wall face. The door spans two cells and two stories from that origin."
            : "Tap the sand to place. Edges snap to the nearest face."}
        </p>
      ) : null}
    </div>
  );
}
