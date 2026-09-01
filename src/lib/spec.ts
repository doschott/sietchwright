import type { Rot } from "./grid.ts";

export const FACINGS = ["south", "east", "north", "west"] as const;
export type Facing = (typeof FACINGS)[number];

export const SIZES = ["starter", "compact", "keep", "compound"] as const;
export type SizeId = (typeof SIZES)[number];

export const LAYOUTS = ["box", "courtyard", "hangar", "tower"] as const;
export type LayoutId = (typeof LAYOUTS)[number];

export const VEHICLES = ["none", "bike", "buggy", "thopter"] as const;
export type VehicleId = (typeof VEHICLES)[number];

export type BriefSpec = {
  size: SizeId;
  stories: 1 | 2 | 3;
  layout: LayoutId;
  entrance: Facing;
  vehicle: VehicleId;
  bay: Facing;
  airlock: boolean;
  cistern: boolean;
  workshop: boolean;
  loft: boolean;
  lookout: boolean;
};

export const DEFAULT_SPEC: BriefSpec = {
  size: "compact",
  stories: 2,
  layout: "box",
  entrance: "south",
  vehicle: "none",
  bay: "south",
  airlock: true,
  cistern: true,
  workshop: false,
  loft: true,
  lookout: false,
};

export const SIZE_OPTS: { id: SizeId; label: string }[] = [
  { id: "starter", label: "Starter 4×4" },
  { id: "compact", label: "Compact 6×5" },
  { id: "keep", label: "Keep 7×7" },
  { id: "compound", label: "Compound 9×6" },
];

export const LAYOUT_OPTS: { id: LayoutId; label: string }[] = [
  { id: "box", label: "Solid box" },
  { id: "courtyard", label: "Open courtyard" },
  { id: "hangar", label: "Vehicle hangar" },
  { id: "tower", label: "Watchtower" },
];

export const VEHICLE_OPTS: { id: VehicleId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "bike", label: "Bike" },
  { id: "buggy", label: "Buggy" },
  { id: "thopter", label: "Ornithopter" },
];

export const FACING_OPTS: { id: Facing; label: string }[] = [
  { id: "south", label: "South" },
  { id: "east", label: "East" },
  { id: "north", label: "North" },
  { id: "west", label: "West" },
];

export const EXTRA_OPTS: {
  key: keyof Pick<BriefSpec, "airlock" | "cistern" | "workshop" | "loft" | "lookout">;
  label: string;
}[] = [
  { key: "airlock", label: "Airlock" },
  { key: "cistern", label: "Cistern" },
  { key: "workshop", label: "Workshop" },
  { key: "loft", label: "Sleeping loft" },
  { key: "lookout", label: "Roof lookout" },
];

export const SIZE_DIMS: Record<SizeId, { w: number; d: number }> = {
  starter: { w: 4, d: 4 },
  compact: { w: 6, d: 5 },
  keep: { w: 7, d: 7 },
  compound: { w: 9, d: 6 },
};

export const FACE_ROT: Record<Facing, Rot> = {
  south: 0,
  east: 90,
  north: 180,
  west: 270,
};

export function isFacing(v: unknown): v is Facing {
  return FACINGS.includes(v as Facing);
}
export function isSize(v: unknown): v is SizeId {
  return SIZES.includes(v as SizeId);
}
export function isLayout(v: unknown): v is LayoutId {
  return LAYOUTS.includes(v as LayoutId);
}
export function isVehicle(v: unknown): v is VehicleId {
  return VEHICLES.includes(v as VehicleId);
}

export function specsEqual(a: BriefSpec, b: BriefSpec): boolean {
  return (
    a.size === b.size &&
    a.stories === b.stories &&
    a.layout === b.layout &&
    a.entrance === b.entrance &&
    a.vehicle === b.vehicle &&
    a.bay === b.bay &&
    a.airlock === b.airlock &&
    a.cistern === b.cistern &&
    a.workshop === b.workshop &&
    a.loft === b.loft &&
    a.lookout === b.lookout
  );
}

export function applyConstraints(spec: BriefSpec): { spec: BriefSpec; notes: string[] } {
  const next: BriefSpec = { ...spec };
  const notes: string[] = [];
  if (next.layout === "tower" && next.size === "compound") {
    next.size = "keep";
    notes.push("A watchtower on a 9×6 pad is a keep — using 7×7.");
  }
  if (next.layout === "courtyard" && next.size === "starter") {
    next.size = "compact";
    notes.push("An open courtyard needs a 6×5 pad.");
  }
  if (next.layout === "hangar" && next.size === "starter") {
    next.size = "compact";
    notes.push("A hangar needs a 6×5 pad.");
  }
  if (next.layout === "hangar" && next.vehicle === "none") {
    next.vehicle = "thopter";
    notes.push("A hangar parks an ornithopter.");
  }
  if (next.layout === "tower" && next.stories < 3) {
    next.stories = 3;
    notes.push("A watchtower is three stories.");
  }
  if (next.vehicle !== "none" && next.stories < 2) {
    next.stories = 2;
    notes.push("A two-high garage needs two stories.");
  }
  if ((next.loft || next.lookout) && next.stories < 2) {
    next.stories = 2;
    notes.push("A loft or lookout needs two stories.");
  }
  if (next.lookout && next.layout === "tower" && next.stories < 3) {
    next.stories = 3;
    notes.push("Tower lookout sits on a third story.");
  }
  return { spec: next, notes };
}

export function normalizeSpec(spec: BriefSpec): BriefSpec {
  return applyConstraints(spec).spec;
}

export function parseSpec(raw: unknown): BriefSpec {
  const o = (raw ?? {}) as Record<string, unknown>;
  const storiesRaw = Number(o.stories);
  const stories: 1 | 2 | 3 = storiesRaw === 3 ? 3 : storiesRaw === 1 ? 1 : 2;
  return normalizeSpec({
    size: isSize(o.size) ? o.size : DEFAULT_SPEC.size,
    stories,
    layout: isLayout(o.layout) ? o.layout : DEFAULT_SPEC.layout,
    entrance: isFacing(o.entrance) ? o.entrance : DEFAULT_SPEC.entrance,
    vehicle: isVehicle(o.vehicle) ? o.vehicle : DEFAULT_SPEC.vehicle,
    bay: isFacing(o.bay) ? o.bay : DEFAULT_SPEC.bay,
    airlock: o.airlock !== false,
    cistern: o.cistern !== false,
    workshop: o.workshop === true,
    loft: o.loft !== false,
    lookout: o.lookout === true,
  });
}

export function describeSpec(spec: BriefSpec): string {
  const s = normalizeSpec(spec);
  const { w, d } = SIZE_DIMS[s.size];
  const bits: string[] = [
    `${s.stories}-story ${w}×${d} ${s.layout === "box" ? "box" : s.layout}`,
    `${s.entrance} ${s.airlock ? "airlock" : "people door"}`,
  ];
  if (s.vehicle !== "none") {
    const v =
      s.vehicle === "thopter" ? "ornithopter" : s.vehicle === "buggy" ? "buggy" : "bike";
    bits.push(`${s.bay} two-high garage for a ${v}`);
  }
  const extras = EXTRA_OPTS.filter((e) => s[e.key])
    .map((e) => e.label.toLowerCase())
    .filter((n) => n !== "airlock");
  if (extras.length) bits.push(extras.join(", "));
  return bits.join(". ") + ".";
}

export function nameFromSpec(spec: BriefSpec): string {
  const s = normalizeSpec(spec);
  const { w, d } = SIZE_DIMS[s.size];
  const shape =
    s.layout === "tower"
      ? "watchtower"
      : s.layout === "hangar"
        ? "hangar"
        : s.layout === "courtyard"
          ? "courtyard"
          : "shelter";
  const park =
    s.vehicle === "thopter"
      ? " · 'thopter"
      : s.vehicle === "buggy"
        ? " · buggy"
        : s.vehicle === "bike"
          ? " · bike"
          : "";
  return `${w}×${d} ${s.stories}-story ${shape}${park}`;
}

export const PRESETS: { id: string; label: string; spec: BriefSpec }[] = [
  {
    id: "keep",
    label: "Courtyard keep",
    spec: {
      size: "keep",
      stories: 2,
      layout: "courtyard",
      entrance: "south",
      vehicle: "bike",
      bay: "west",
      airlock: true,
      cistern: true,
      workshop: true,
      loft: true,
      lookout: true,
    },
  },
  {
    id: "starter",
    label: "Starter box",
    spec: {
      size: "starter",
      stories: 1,
      layout: "box",
      entrance: "south",
      vehicle: "none",
      bay: "south",
      airlock: false,
      cistern: true,
      workshop: false,
      loft: false,
      lookout: false,
    },
  },
  {
    id: "hangar",
    label: "Thopter bay",
    spec: {
      size: "compound",
      stories: 2,
      layout: "hangar",
      entrance: "east",
      vehicle: "thopter",
      bay: "south",
      airlock: false,
      cistern: true,
      workshop: true,
      loft: true,
      lookout: false,
    },
  },
  {
    id: "tower",
    label: "Watchtower",
    spec: {
      size: "starter",
      stories: 3,
      layout: "tower",
      entrance: "south",
      vehicle: "none",
      bay: "south",
      airlock: false,
      cistern: false,
      workshop: false,
      loft: true,
      lookout: true,
    },
  },
  {
    id: "water",
    label: "Cistern hall",
    spec: {
      size: "compound",
      stories: 2,
      layout: "box",
      entrance: "south",
      vehicle: "none",
      bay: "south",
      airlock: true,
      cistern: true,
      workshop: false,
      loft: true,
      lookout: false,
    },
  },
];
