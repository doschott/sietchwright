import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Warehouse, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EXTRA_OPTS,
  FACING_OPTS,
  LAYOUT_OPTS,
  MAX_HORIZONTAL_STAKES,
  MAX_VEHICLE_COUNT,
  MAX_VERTICAL_STAKES,
  PARK_OPTS,
  PRESETS,
  SIZE_OPTS,
  countOf,
  describeSpec,
  extendHighOf,
  extendWideOf,
  maxStoriesFor,
  parkedVehicles,
  specsEqual,
  type BriefSpec,
  type Facing,
  type LayoutId,
  type ParkVehicleId,
  type SizeId,
  type StakeCount,
  type StoryCount,
} from "@/lib/spec";
import { STORAGE_OPTS, type StorageId } from "@/lib/stations";
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

function MultiChipGroup({
  question,
  values,
  options,
  onToggle,
  onClear,
  noneLabel,
  noneDisabled,
  hint,
}: {
  question: string;
  values: ParkVehicleId[];
  options: { id: ParkVehicleId; label: string }[];
  onToggle: (id: ParkVehicleId) => void;
  onClear: () => void;
  noneLabel: string;
  noneDisabled?: boolean;
  hint?: string;
}) {
  const noneOn = values.length === 0;
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-medium tracking-wide text-muted">{question}</p>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          aria-pressed={noneOn}
          disabled={noneDisabled}
          onClick={onClear}
          className={cn(
            "h-10 rounded-md px-3 text-sm",
            noneOn
              ? "bg-accent text-accent-fg"
              : "border border-border bg-elevated text-muted hover:text-fg",
            noneDisabled && "opacity-40",
          )}
        >
          {noneLabel}
        </button>
        {options.map((o) => {
          const on = values.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o.id)}
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
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

const STEPS = ["Pad", "Doors", "Inside"] as const;

export function PromptDock() {
  const spec = useYard((s) => s.spec);
  const notes = useYard((s) => s.notes);
  const builtSpec = useYard((s) => s.builtSpec);
  const setSpec = useYard((s) => s.setSpec);
  const applySpec = useYard((s) => s.applySpec);
  const raiseFromSpec = useYard((s) => s.raiseFromSpec);
  const generating = useYard((s) => s.generating);
  const setGenerating = useYard((s) => s.setGenerating);
  const setOverlay = useYard((s) => s.setOverlay);
  const empty = useYard((s) => s.plan.pieces.length === 0);
  const dirty = Boolean(builtSpec && !specsEqual(spec, builtSpec));
  const [step, setStep] = useState(0);

  const parked = parkedVehicles(spec);
  const needsTwo = parked.length > 0 || spec.loft || spec.lookout || spec.layout === "tower";

  function toggleVehicle(id: ParkVehicleId) {
    const has = parked.includes(id);
    let next = has ? parked.filter((v) => v !== id) : [...parked, id];
    if (spec.layout === "hangar" && next.length === 0) next = ["scout"];
    const vehicleCounts = { ...spec.vehicleCounts };
    if (next.includes(id) && !has) vehicleCounts[id] = 1;
    if (!next.includes(id)) delete vehicleCounts[id];
    setSpec({ vehicles: next, vehicleCounts });
  }

  const stakeNums = [0, 1, 2, 3, 4, 5] as const;
  const storyCap = maxStoriesFor(extendHighOf(spec));
  const storyOpts = Array.from({ length: storyCap }, (_, i) => {
    const n = i + 1;
    return {
      id: String(n),
      label: String(n),
      disabled: (n === 1 && needsTwo) || (spec.layout === "tower" && n < 3),
    };
  });

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
    <section
      aria-label="Base plan answers"
      className="flex h-full max-h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface/95 shadow-panel"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted">
            {empty ? "Plan the sietch" : dirty ? "Answers changed" : "Change answers"}
          </p>
          <p className="font-display text-base text-fg">Step {step + 1} of 3 · {STEPS[step]}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="Close plan panel"
          onClick={() => setOverlay("none")}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex gap-1 px-3 pt-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i <= step ? "bg-accent" : "bg-border",
            )}
            aria-label={`Go to ${label}`}
          />
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {step === 0 ? (
          <div className="space-y-3">
            <ChipGroup
              question="How big is the pad?"
              value={spec.size}
              options={SIZE_OPTS.map((o) => ({
                ...o,
                disabled:
                  (spec.layout === "courtyard" && o.id === "starter") ||
                  (spec.layout === "tower" && o.id === "compound"),
              }))}
              onChange={(size: SizeId) => setSpec({ size })}
              hint={
                parked.includes("carrier") || (parked.includes("crawler") && parked.length > 1)
                  ? "A carrier plus a crawler fills an Advanced 10×10 pad."
                  : spec.layout === "hangar"
                    ? "Starter 4×4 stacks a garage under the fly-in. Assault wants three wall-tiles of height."
                    : spec.layout === "courtyard"
                      ? "Courtyard needs at least Compact 6×5."
                      : undefined
              }
            />
            <ChipGroup
              question="How many stories?"
              value={String(spec.stories)}
              options={storyOpts}
              onChange={(v) => setSpec({ stories: Number(v) as StoryCount })}
              hint={
                spec.layout === "tower"
                  ? "A watchtower is three stories."
                  : parked.includes("assault")
                    ? "Assault hangars are three wall-tiles high. Five stories fit a garage under one."
                    : parked.length
                      ? "Garage doors are two cells tall. A basic fief reaches five stories."
                      : extendHighOf(spec)
                        ? `Vertical staking raises the cap to ${storyCap} stories.`
                        : "A basic fief reaches five stories without staking units."
              }
            />
            <ChipGroup
              question="What shape?"
              value={spec.layout}
              options={LAYOUT_OPTS}
              onChange={(layout: LayoutId) => setSpec({ layout })}
            />
            <ChipGroup
              question="How many extensions wide?"
              value={String(extendWideOf(spec))}
              options={stakeNums.map((n) => ({ id: String(n), label: String(n) }))}
              onChange={(v) => setSpec({ extendWide: Number(v) as StakeCount })}
              hint={`Horizontal staking units. Max ${MAX_HORIZONTAL_STAKES} wide. Each adds a 10-cell strip. Advanced fief only.`}
            />
            <ChipGroup
              question="How many extensions high?"
              value={String(extendHighOf(spec))}
              options={stakeNums.map((n) => ({ id: String(n), label: String(n) }))}
              onChange={(v) => setSpec({ extendHigh: Number(v) as StakeCount })}
              hint={`Vertical staking units. Max ${MAX_VERTICAL_STAKES} high, ${MAX_HORIZONTAL_STAKES + MAX_VERTICAL_STAKES} total with wide.`}
            />
            <div>
              <p className="mb-1.5 text-xs font-medium tracking-wide text-muted">
                Or raise a preset
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => usePreset(p.spec)}
                    className="h-10 rounded-md border border-border bg-elevated px-3 text-sm text-muted hover:text-fg"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-3">
            <ChipGroup
              question="People walk in from which side?"
              value={spec.entrance}
              options={FACING_OPTS}
              onChange={(entrance: Facing) => setSpec({ entrance })}
            />
            <MultiChipGroup
              question="Park which vehicles?"
              values={parked}
              options={PARK_OPTS}
              onToggle={toggleVehicle}
              onClear={() => setSpec({ vehicle: "none", vehicles: [], vehicleCounts: {} })}
              noneLabel="None"
              noneDisabled={spec.layout === "hangar"}
              hint={
                spec.layout === "hangar"
                  ? "Sandbike shares a buggy bay. Scout is the small 'thopter (two high). Assault is three high and tight for new pilots. Carrier and crawler need Advanced 10×10."
                  : "Tap every vehicle you park. Sandbike fits in a buggy bay. Scout and assault are different craft."
              }
            />
            {parked.map((id) => (
              <ChipGroup
                key={id}
                question={`How many ${PARK_OPTS.find((o) => o.id === id)?.label ?? id}?`}
                value={String(countOf(id, parked, spec.vehicleCounts))}
                options={Array.from({ length: MAX_VEHICLE_COUNT }, (_, i) => ({
                  id: String(i + 1),
                  label: String(i + 1),
                }))}
                onChange={(v) =>
                  setSpec({
                    vehicleCounts: { ...spec.vehicleCounts, [id]: Number(v) },
                  })
                }
              />
            ))}
            {parked.length ? (
              <ChipGroup
                question="Garage door opens toward?"
                value={spec.bay}
                options={FACING_OPTS}
                onChange={(bay: Facing) => setSpec({ bay })}
              />
            ) : (
              <p className="text-xs text-subtle">No garage. People door only.</p>
            )}
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-3">
            <ChipGroup
              question="What storage can you place?"
              value={(spec.storage ?? "none") as StorageId}
              options={STORAGE_OPTS}
              onChange={(storage: StorageId) => setSpec({ storage })}
              hint="Chests are 20 slots. Small containers are 10. Many new players only have those two."
            />
            <div>
              <p className="mb-1.5 text-xs font-medium tracking-wide text-muted">
                What else is inside?
              </p>
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
              <ul className="space-y-0.5">
                {notes.map((n) => (
                  <li key={n} className="text-xs text-warn">
                    {n}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 space-y-2 border-t border-border p-3">
        <p className="text-xs text-pretty text-fg">{describeSpec(spec)}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {step < 2 ? (
            <Button className="flex-1" onClick={() => setStep((s) => s + 1)}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={raise} disabled={generating}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Warehouse className="size-4" />}
              {generating ? "Raising walls…" : dirty ? "Raise again to match" : "Raise this sietch"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
