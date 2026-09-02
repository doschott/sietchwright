import { RotateCw, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { specChecks } from "@/lib/build-from-spec";
import { countPieces } from "@/lib/plan";
import { PIECES } from "@/lib/pieces";
import { useYard } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Inspector({ compact = false }: { compact?: boolean }) {
  const plan = useYard((s) => s.plan);
  const spec = useYard((s) => s.spec);
  const builtSpec = useYard((s) => s.builtSpec);
  const selectedId = useYard((s) => s.selectedId);
  const rotateSelected = useYard((s) => s.rotateSelected);
  const removeSelected = useYard((s) => s.removeSelected);
  const select = useYard((s) => s.select);
  const setOverlay = useYard((s) => s.setOverlay);
  const piece = plan.pieces.find((p) => p.id === selectedId);
  const room = piece?.room ? plan.rooms.find((r) => r.id === piece.room) : undefined;
  const counts = countPieces(plan);
  const granite = plan.pieces.reduce((sum, p) => sum + PIECES[p.type].granite, 0);
  const checkSpec = builtSpec ?? spec;
  const checks = plan.pieces.length ? specChecks(plan, checkSpec) : [];
  const matched = checks.length > 0 && checks.every((c) => c.ok);

  if (compact && piece) {
    const def = PIECES[piece.type];
    return (
      <div className="rounded-xl border border-border bg-surface/92 p-3 shadow-panel">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge className="border-0 text-fg" style={{ background: def.marker }}>
                {def.code}
              </Badge>
              <h2 className="truncate font-display text-base text-fg">{def.name}</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              In-game: {def.inGame} from any standard set.
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="secondary" size="icon" onClick={rotateSelected} aria-label="Rotate">
              <RotateCw className="size-4" />
            </Button>
            <Button variant="danger" size="icon" onClick={removeSelected} aria-label="Remove">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Yard inspector"
      className="flex h-full max-h-full flex-col overflow-hidden rounded-xl border border-border bg-surface/95 shadow-panel"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-xs font-medium tracking-wide text-muted">Inspector</p>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Close inspector"
          onClick={() => {
            select(null);
            setOverlay("none");
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {piece ? (
        <div>
          <Badge className="border-0 text-fg" style={{ background: PIECES[piece.type].marker }}>
            {PIECES[piece.type].code}
          </Badge>
          <h2 className="mt-2 font-display text-lg text-fg">{PIECES[piece.type].name}</h2>
          <p className="text-xs text-muted">
            Cell {piece.x},{piece.z} · story {piece.y} · {piece.rot}°
          </p>
          <p className="mt-2 text-sm text-pretty text-muted">{PIECES[piece.type].hint}</p>
          <p className="mt-2 text-sm text-fg">
            In-game: place a <span className="font-medium">{PIECES[piece.type].inGame}</span> from
            any standard set (CHOAM Shelter, Atreides, Harkonnen — same slot).
          </p>
          {room ? (
            <p className="mt-2 text-sm text-muted">
              Room: <span className="text-fg">{room.name}</span> - {room.purpose}
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" onClick={rotateSelected}>
              <RotateCw className="size-3.5" />
              Rotate
            </Button>
            <Button variant="danger" size="sm" onClick={removeSelected}>
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="font-display text-lg text-fg">{plan.name}</h2>
          <p className="mt-1 text-sm text-pretty text-muted">
            {plan.pieces.length === 0
              ? "Blank sand. Answer the questions below, then raise. Or place a Foundation by hand."
              : plan.brief}
          </p>
          {checks.length ? (
            <div className="mt-3">
              <p className={cn("text-xs font-medium tracking-wide", matched ? "text-fg" : "text-warn")}>
                {matched ? "Follows your answers" : "Does not match your answers"}
              </p>
              <ul className="mt-2 space-y-1">
                {checks.map((c) => (
                  <li
                    key={c.label}
                    className={cn("flex items-center gap-2 text-xs", c.ok ? "text-muted" : "text-warn")}
                  >
                    <span className="font-mono">{c.ok ? "OK" : "NO"}</span>
                    <span>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {plan.tips.length ? (
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-muted">
              {plan.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          ) : null}
        </div>
      )}

      <div className="border-t border-border pt-3">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-xs font-medium tracking-wide text-muted">Bill of pieces</h3>
          <p className="font-mono text-xs tabular-nums text-muted">
            {plan.pieces.length} pcs · ~{granite} granite
          </p>
        </div>
        <ul className="space-y-1">
          {Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, n]) => {
              const def = PIECES[type as keyof typeof PIECES];
              if (!def) return null;
              return (
                <li key={type} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge
                      className="min-w-8 justify-center border-0 text-fg"
                      style={{ background: def.marker }}
                    >
                      {def.code}
                    </Badge>
                    <span>{def.name}</span>
                  </span>
                  <span className="font-mono tabular-nums text-muted">{n}</span>
                </li>
              );
            })}
        </ul>
      </div>
      </div>
    </section>
  );
}
