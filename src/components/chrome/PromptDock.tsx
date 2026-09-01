import { Loader2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EXTRA_OPTS,
  FACING_OPTS,
  LAYOUT_OPTS,
  PRESETS,
  SIZE_OPTS,
  VEHICLE_OPTS,
  describeSpec,
  specsEqual,
  type BriefSpec,
  type Facing,
  type LayoutId,
  type SizeId,
  type VehicleId,
} from "@/lib/spec";
import { useYard } from "@/lib/store";
import { cn } from "@/lib/utils";

function ChipGroup<T extends string>({
  question,
  value,
  options,
  onChange,
  hint,
}: {
  question: string;
  value: T;
  options: { id: T; label: string; disabled?: boolean }[];
  onChange: (id: T) => void;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-medium tracking-wide text-muted">{question}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              disabled={o.disabled}
              onClick={() => onChange(o.id)}
              className={cn(
                "h-10 rounded-md px-3 text-sm",
                on
                  ? "bg-accent text-accent-fg"
                  : "border border-border bg-elevated text-muted hover:text-fg",
                o.disabled && "opacity-40",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

export function PromptDock() {
  const spec = useYard((s) => s.spec);
  const notes = useYard((s) => s.notes);
  const builtSpec = useYard((s) => s.builtSpec);
  const setSpec = useYard((s) => s.setSpec);
  const applySpec = useYard((s) => s.applySpec);
  const raiseFromSpec = useYard((s) => s.raiseFromSpec);
  const generating = useYard((s) => s.generating);
  const setGenerating = useYard((s) => s.setGenerating);
  const empty = useYard((s) => s.plan.pieces.length === 0);
  const dirty = Boolean(builtSpec && !specsEqual(spec, builtSpec));

  const needsTwo = spec.vehicle !== "none" || spec.loft || spec.lookout || spec.layout === "tower";
  const hangarLike = spec.layout === "hangar" || spec.layout === "courtyard";

  function raise() {
    setGenerating(true);
    window.setTimeout(() => {
      raiseFromSpec();
      setGenerating(false);
      toast("Raised to match your answers.");
    }, 180);
  }

  function usePreset(next: BriefSpec) {
    applySpec(next);
    setGenerating(true);
    window.setTimeout(() => {
      useYard.getState().raiseFromSpec();
      setGenerating(false);
      toast("Raised to match your answers.");
    }, 180);
  }

  return (
    <div className="flex max-h-[42vh] flex-col overflow-hidden rounded-xl border border-border bg-surface/92 shadow-panel">
      <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-2">
        <p className="mb-3 text-xs font-medium tracking-wide text-muted">
          {empty
            ? "Answer each question. The yard follows these answers."
            : dirty
              ? "Answers changed — raise again to match the yard"
              : "Change any answer, then raise again"}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ChipGroup
            question="How big is the pad?"
            value={spec.size}
            options={SIZE_OPTS.map((o) => ({
              ...o,
              disabled:
                (hangarLike && o.id === "starter") ||
                (spec.layout === "tower" && o.id === "compound"),
            }))}
            onChange={(size: SizeId) => setSpec({ size })}
            hint={
              spec.layout === "hangar"
                ? "Hangar needs at least Compact 6×5."
                : spec.layout === "courtyard"
                  ? "Courtyard needs at least Compact 6×5."
                  : undefined
            }
          />
          <ChipGroup
            question="How many stories?"
            value={String(spec.stories)}
            options={[
              { id: "1", label: "1", disabled: needsTwo },
              { id: "2", label: "2", disabled: spec.layout === "tower" },
              { id: "3", label: "3" },
            ]}
            onChange={(v) => setSpec({ stories: Number(v) as 1 | 2 | 3 })}
            hint={
              spec.layout === "tower"
                ? "A watchtower is three stories."
                : spec.vehicle !== "none"
                  ? "Garage doors are two cells tall, so two stories."
                  : undefined
            }
          />
          <ChipGroup
            question="What shape?"
            value={spec.layout}
            options={LAYOUT_OPTS}
            onChange={(layout: LayoutId) => setSpec({ layout })}
          />
          <ChipGroup
            question="People walk in from which side?"
            value={spec.entrance}
            options={FACING_OPTS}
            onChange={(entrance: Facing) => setSpec({ entrance })}
          />
          <ChipGroup
            question="Park a vehicle?"
            value={spec.vehicle}
            options={VEHICLE_OPTS.map((o) => ({
              ...o,
              disabled: spec.layout === "hangar" && o.id === "none",
            }))}
            onChange={(vehicle: VehicleId) => setSpec({ vehicle })}
          />
          {spec.vehicle !== "none" ? (
            <ChipGroup
              question="Garage door opens toward?"
              value={spec.bay}
              options={FACING_OPTS}
              onChange={(bay: Facing) => setSpec({ bay })}
            />
          ) : (
            <div />
          )}
        </div>
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted">What else is inside?</p>
          <div className="flex flex-wrap gap-1">
            {EXTRA_OPTS.map((o) => {
              const on = spec[o.key];
              return (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSpec({ [o.key]: !on } as Partial<BriefSpec>)}
                  className={cn(
                    "h-10 rounded-md px-3 text-sm",
                    on
                      ? "bg-accent text-accent-fg"
                      : "border border-border bg-elevated text-muted hover:text-fg",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
        {notes.length ? (
          <ul className="mt-2 space-y-0.5">
            {notes.map((n) => (
              <li key={n} className="text-xs text-warn">
                {n}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => usePreset(p.spec)}
              className="h-10 shrink-0 rounded-md border border-border bg-elevated px-3 text-sm text-muted hover:text-fg"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t border-border p-3 pt-2">
        <p className="mb-2 text-xs text-pretty text-fg">{describeSpec(spec)}</p>
        <Button className="w-full" onClick={raise} disabled={generating}>
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Warehouse className="size-4" />}
          {generating ? "Raising walls…" : dirty ? "Raise again to match" : "Raise this sietch"}
        </Button>
      </div>
    </div>
  );
}
