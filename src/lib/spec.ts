import type { Rot } from "./grid.ts";
import { isStorage, type StorageId } from "./stations.ts";
import {
  MAX_VEHICLE_COUNT,
  PARK_LABELS,
  PARK_VEHICLES,
  countOf,
  describeFleet,
  fleetNeed,
  fleetStalls,
  isParkVehicle,
  neededStoriesFor,
  primaryVehicle,
  remapCounts,
  resolveVehicle,
  uniqueVehicles,
  type ParkVehicleId,
  type VehicleCounts,
} from "./vehicles.ts";

export {
  MAX_VEHICLE_COUNT,
  PARK_LABELS,
  PARK_VEHICLES,
  isParkVehicle,
  uniqueVehicles,
  primaryVehicle,
  countOf,
};
export type { ParkVehicleId, VehicleCounts };

/** Horizontal / vertical staking units on an Advanced Sub-Fief. 5 each, 10 total. */
export const MAX_HORIZONTAL_STAKES = 5;
export const MAX_VERTICAL_STAKES = 5;
export const STAKE_PLOT = 10;
/** Basic sub-fief height without staking. Elevated consoles reach ~8. */
export const BASE_STORY_CAP = 5;
export const MAX_STORIES = 8;

export type StoryCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type StakeCount = 0 | 1 | 2 | 3 | 4 | 5;

export const FACINGS = ["south", "east", "north", "west"] as const;
export type Facing = (typeof FACINGS)[number];

export const SIZES = ["starter", "compact", "keep", "compound", "advanced"] as const;
export type SizeId = (typeof SIZES)[number];

export const LAYOUTS = ["box", "courtyard", "hangar", "tower"] as const;
export type LayoutId = (typeof LAYOUTS)[number];

export const VEHICLES = ["none", ...PARK_VEHICLES] as const;
export type VehicleId = (typeof VEHICLES)[number];

export type BriefSpec = {
  size: SizeId;
  stories: StoryCount;
  layout: LayoutId;
  entrance: Facing;
  vehicle: VehicleId;
  /** Parked vehicles. Empty means none. If omitted, derived from `vehicle`. */
  vehicles?: ParkVehicleId[];
  /** How many of each parked vehicle. Missing keys mean 1. */
  vehicleCounts?: VehicleCounts;
  /** Horizontal staking units (0-5). Each adds a 10-cell strip. */
  extendWide?: StakeCount;
  /** Vertical staking units (0-5). Each raises the story cap by 1. */
  extendHigh?: StakeCount;
  bay: Facing;
  airlock: boolean;
  cistern: boolean;
  workshop: boolean;
  loft: boolean;
  lookout: boolean;
  /** Storage crate the player can actually place. none = no markers. */
  storage?: StorageId;
};

export const DEFAULT_SPEC: BriefSpec = {
  size: "compact",
  stories: 2,
  layout: "box",
  entrance: "south",
  vehicle: "none",
  vehicles: [],
  vehicleCounts: {},
  extendWide: 0,
  extendHigh: 0,
  bay: "south",
  airlock: true,
  cistern: true,
  workshop: false,
  loft: true,
  lookout: false,
  storage: "none",
};

export const SIZE_OPTS: { id: SizeId; label: string }[] = [
  { id: "starter", label: "Starter 4×4" },
  { id: "compact", label: "Compact 6×5" },
  { id: "keep", label: "Keep 7×7" },
  { id: "compound", label: "Compound 9×6" },
  { id: "advanced", label: "Advanced 10×10" },
];

export const LAYOUT_OPTS: { id: LayoutId; label: string }[] = [
  { id: "box", label: "Solid box" },
  { id: "courtyard", label: "Open courtyard" },
  { id: "hangar", label: "Vehicle hangar" },
  { id: "tower", label: "Watchtower" },
];

export const VEHICLE_OPTS: { id: VehicleId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "bike", label: "Sandbike" },
  { id: "buggy", label: "Buggy" },
  { id: "scout", label: "Scout ornithopter" },
  { id: "assault", label: "Assault ornithopter" },
  { id: "carrier", label: "Carrier" },
  { id: "crawler", label: "Crawler" },
];

export const PARK_OPTS: { id: ParkVehicleId; label: string }[] = PARK_VEHICLES.map((id) => ({
  id,
  label: PARK_LABELS[id],
}));

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
  { key: "workshop", label: "Starter shops" },
  { key: "loft", label: "Sleeping loft" },
  { key: "lookout", label: "Roof lookout" },
];

export const SIZE_DIMS: Record<SizeId, { w: number; d: number }> = {
  starter: { w: 4, d: 4 },
  compact: { w: 6, d: 5 },
  keep: { w: 7, d: 7 },
  compound: { w: 9, d: 6 },
  advanced: { w: 10, d: 10 },
};

export const FACE_ROT: Record<Facing, Rot> = {
  south: 0,
  east: 90,
  north: 180,
  west: 270,
};

export function clampStake(n: unknown): StakeCount {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v >= MAX_HORIZONTAL_STAKES) return MAX_HORIZONTAL_STAKES;
  return v as StakeCount;
}

export function maxStoriesFor(extendHigh: number): StoryCount {
  const cap = Math.min(MAX_STORIES, BASE_STORY_CAP + clampStake(extendHigh));
  return cap as StoryCount;
}

export function clampStories(n: unknown, max: number = BASE_STORY_CAP): StoryCount {
  const v = Math.round(Number(n));
  const hi = Math.min(MAX_STORIES, Math.max(1, max));
  if (!Number.isFinite(v) || v < 1) return 2;
  if (v > hi) return hi as StoryCount;
  return v as StoryCount;
}

export function extendWideOf(spec: Pick<BriefSpec, "extendWide">): StakeCount {
  return clampStake(spec.extendWide);
}

export function extendHighOf(spec: Pick<BriefSpec, "extendHigh">): StakeCount {
  return clampStake(spec.extendHigh);
}

/** Actual pad cells after horizontal staking units. */
export function padDims(
  spec: Pick<BriefSpec, "size" | "extendWide" | "bay">,
): { w: number; d: number } {
  const base = SIZE_DIMS[isSize(spec.size) ? spec.size : "compact"];
  const extra = extendWideOf(spec) * STAKE_PLOT;
  if (spec.bay === "east" || spec.bay === "west") {
    return { w: base.w, d: base.d + extra };
  }
  return { w: base.w + extra, d: base.d };
}

export function countsOf(spec: Pick<BriefSpec, "vehicle" | "vehicles" | "vehicleCounts">): VehicleCounts {
  const parked = parkedVehicles(spec);
  const out: VehicleCounts = {};
  for (const v of parked) out[v] = countOf(v, parked, spec.vehicleCounts);
  return out;
}

export function sameCounts(a: BriefSpec, b: BriefSpec): boolean {
  const parked = parkedVehicles(a);
  if (parked.join(",") !== parkedVehicles(b).join(",")) return false;
  for (const v of parked) {
    if (countOf(v, parked, a.vehicleCounts) !== countOf(v, parked, b.vehicleCounts)) return false;
  }
  return true;
}

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
  if (v === "none") return true;
  return resolveVehicle(v) !== null;
}

export function parkedVehicles(spec: Pick<BriefSpec, "vehicle" | "vehicles">): ParkVehicleId[] {
  if (spec.vehicles) return uniqueVehicles(spec.vehicles);
  if (spec.vehicle !== "none" && isParkVehicle(spec.vehicle)) {
    return uniqueVehicles([spec.vehicle]);
  }
  return [];
}

export function specsEqual(a: BriefSpec, b: BriefSpec): boolean {
  return (
    a.size === b.size &&
    a.stories === b.stories &&
    a.layout === b.layout &&
    a.entrance === b.entrance &&
    sameCounts(a, b) &&
    extendWideOf(a) === extendWideOf(b) &&
    extendHighOf(a) === extendHighOf(b) &&
    a.bay === b.bay &&
    a.airlock === b.airlock &&
    a.cistern === b.cistern &&
    a.workshop === b.workshop &&
    a.loft === b.loft &&
    a.lookout === b.lookout &&
    (a.storage ?? "none") === (b.storage ?? "none")
  );
}

export function sizeFitsFleet(
  size: SizeId,
  spec: Pick<
    BriefSpec,
    | "vehicles"
    | "vehicle"
    | "vehicleCounts"
    | "layout"
    | "bay"
    | "entrance"
    | "extendWide"
    | "workshop"
    | "storage"
  >,
): boolean {
  const vehicles = parkedVehicles(spec);
  if (!vehicles.length) return true;
  const hangar = spec.layout === "hangar";
  const shareFace = spec.entrance === spec.bay;
  const dims = padDims({ ...spec, size });
  const along = spec.bay === "south" || spec.bay === "north" ? dims.w : dims.d;
  const deep = spec.bay === "south" || spec.bay === "north" ? dims.d : dims.w;
  const insertShops =
    (spec.workshop || (spec.storage && spec.storage !== "none")) &&
    vehicles.includes("scout") &&
    !vehicles.includes("assault") &&
    vehicles.some((v) => v === "bike" || v === "buggy");
  const need = fleetNeed(vehicles, hangar, shareFace, {
    counts: spec.vehicleCounts,
    wrapAlong: along,
    wrapDepth: deep,
    insertShops,
  });
  if (along < need.along) return false;
  if (need.rigid) return deep >= need.depth;
  return Math.max(2, deep - 2) >= 2;
}

export function minSizeForFleet(
  spec: Pick<
    BriefSpec,
    | "vehicles"
    | "vehicle"
    | "vehicleCounts"
    | "layout"
    | "bay"
    | "entrance"
    | "extendWide"
    | "workshop"
    | "storage"
  >,
): SizeId {
  for (const id of SIZES) {
    if (sizeFitsFleet(id, spec)) return id;
  }
  return "advanced";
}

function syncParked(spec: BriefSpec): BriefSpec {
  const vehicles = parkedVehicles(spec);
  const extendWide = clampStake(spec.extendWide);
  const extendHigh = clampStake(spec.extendHigh);
  const vehicleCounts = countsOf({
    ...spec,
    vehicles,
    vehicleCounts: remapCounts(spec.vehicleCounts as Record<string, number> | undefined),
  });
  return {
    ...spec,
    vehicles,
    vehicle: primaryVehicle(vehicles),
    vehicleCounts,
    extendWide,
    extendHigh,
    storage: isStorage(spec.storage) ? spec.storage : "none",
  };
}

export function applyConstraints(spec: BriefSpec): { spec: BriefSpec; notes: string[] } {
  const next: BriefSpec = syncParked({ ...spec });
  const notes: string[] = [];
  if (next.layout === "tower" && next.size === "compound") {
    next.size = "keep";
    notes.push("A watchtower on a 9×6 pad is a keep — using 7×7.");
  }
  if (next.layout === "courtyard" && next.size === "starter") {
    next.size = "compact";
    notes.push("An open courtyard needs a 6×5 pad.");
  }
  if (next.layout === "hangar" && next.vehicles!.length === 0) {
    next.vehicles = ["scout"];
    next.vehicle = "scout";
    notes.push("A hangar parks a scout ornithopter.");
  }
  if ((next.extendWide! > 0 || next.extendHigh! > 0) && next.size !== "advanced") {
    next.size = "advanced";
    notes.push("Staking units need an Advanced Sub-Fief (10×10).");
  }
  const minSize = minSizeForFleet(next);
  if (SIZES.indexOf(next.size) < SIZES.indexOf(minSize)) {
    next.size = minSize;
    const { w, d } = padDims(next);
    notes.push(
      `Parking ${describeFleet(next.vehicles!, next.vehicleCounts)} needs a ${w}×${d} pad (${SIZE_OPTS.find((o) => o.id === minSize)?.label ?? minSize}).`,
    );
  }
  while (
    next.extendWide! < MAX_HORIZONTAL_STAKES &&
    !sizeFitsFleet(next.size, next)
  ) {
    next.extendWide = (next.extendWide! + 1) as StakeCount;
    next.size = "advanced";
    notes.push(
      `More garages need another 10-cell strip. Using ${next.extendWide} wide staking unit${next.extendWide === 1 ? "" : "s"}.`,
    );
  }
  if (next.layout === "tower" && next.stories < 3) {
    next.stories = 3;
    notes.push("A watchtower is three stories.");
  }
  const parkedNow = next.vehicles!;
  const { w, d } = padDims(next);
  const along = next.bay === "south" || next.bay === "north" ? w : d;
  const deep = next.bay === "south" || next.bay === "north" ? d : w;
  const insertShops =
    (next.workshop || (next.storage && next.storage !== "none")) &&
    parkedNow.includes("scout") &&
    !parkedNow.includes("assault") &&
    parkedNow.some((v) => v === "bike" || v === "buggy");
  const stalls = fleetStalls(parkedNow, next.layout === "hangar", {
    counts: next.vehicleCounts,
    wrapAlong: along,
    wrapDepth: deep,
    insertShops,
  });
  let neededStories = neededStoriesFor(stalls);
  if (parkedNow.includes("assault") && neededStories < 3) neededStories = 3;
  if (parkedNow.length > 0 && neededStories < 2) neededStories = 2;
  if (parkedNow.length > 0 && next.stories < 2) {
    next.stories = 2;
    notes.push("A two-high garage needs two stories.");
  }
  if (neededStories > next.stories) {
    next.stories = neededStories as StoryCount;
    if (parkedNow.includes("assault")) {
      notes.push("An assault hangar is three wall-tiles high.");
    } else if (stalls.some((s) => s.story >= 2)) {
      notes.push("Garage below and fly-in above needs more stories.");
    }
  }
  const storyCap = Math.max(maxStoriesFor(next.extendHigh!), neededStories) as StoryCount;
  if (next.stories > storyCap) {
    next.stories = storyCap;
  }
  if ((next.loft || next.lookout) && next.stories < 2) {
    next.stories = 2;
    notes.push("A loft or lookout needs two stories.");
  }
  if (next.lookout && next.layout === "tower" && next.stories < 3) {
    next.stories = 3;
    notes.push("Tower lookout sits on a third story.");
  }
  return { spec: syncParked(next), notes };
}

export function normalizeSpec(spec: BriefSpec): BriefSpec {
  return applyConstraints(spec).spec;
}

export function parseSpec(raw: unknown): BriefSpec {
  const o = (raw ?? {}) as Record<string, unknown>;
  const extendWide = clampStake(o.extendWide);
  const extendHigh = clampStake(o.extendHigh);
  const stories = clampStories(o.stories, maxStoriesFor(extendHigh));
  const vehicles = uniqueVehicles(o.vehicles);
  const vehicleField = isVehicle(o.vehicle)
    ? ((resolveVehicle(o.vehicle) ?? (o.vehicle === "none" ? "none" : DEFAULT_SPEC.vehicle)) as VehicleId)
    : DEFAULT_SPEC.vehicle;
  const seeded =
    vehicles.length > 0
      ? vehicles
      : vehicleField !== "none" && isParkVehicle(vehicleField)
        ? [vehicleField]
        : [];
  const rawCounts =
    o.vehicleCounts && typeof o.vehicleCounts === "object"
      ? (o.vehicleCounts as VehicleCounts)
      : {};
  return normalizeSpec({
    size: isSize(o.size) ? o.size : DEFAULT_SPEC.size,
    stories,
    layout: isLayout(o.layout) ? o.layout : DEFAULT_SPEC.layout,
    entrance: isFacing(o.entrance) ? o.entrance : DEFAULT_SPEC.entrance,
    vehicle: primaryVehicle(seeded),
    vehicles: seeded,
    vehicleCounts: remapCounts(rawCounts as Record<string, number>),
    extendWide,
    extendHigh,
    bay: isFacing(o.bay) ? o.bay : DEFAULT_SPEC.bay,
    airlock: o.airlock !== false,
    cistern: o.cistern !== false,
    workshop: o.workshop === true,
    loft: o.loft !== false,
    lookout: o.lookout === true,
    storage: isStorage(o.storage) ? o.storage : "none",
  });
}

export function describeSpec(spec: BriefSpec): string {
  const s = normalizeSpec(spec);
  const { w, d } = padDims(s);
  const bits: string[] = [
    `${s.stories}-story ${w}×${d} ${s.layout === "box" ? "box" : s.layout}`,
    `${s.entrance} ${s.airlock ? "airlock" : "people door"}`,
  ];
  const wide = extendWideOf(s);
  const high = extendHighOf(s);
  if (wide || high) {
    bits.push(`${wide} wide and ${high} high staking units`);
  }
  const parked = parkedVehicles(s);
  if (parked.length) {
    const fleet = describeFleet(parked, s.vehicleCounts);
    const penta = parked.includes("carrier") || parked.includes("assault");
    const garage = parked.some(
      (v) => v === "bike" || v === "buggy" || v === "crawler" || (v === "scout" && !penta),
    );
    if (penta && garage) {
      bits.push(`${s.bay} garage and pentashield for ${fleet}`);
    } else if (penta) {
      bits.push(`${s.bay} pentashield for ${fleet}`);
    } else {
      bits.push(`${s.bay} two-high garage for ${fleet}`);
    }
  }
  const extras = EXTRA_OPTS.filter((e) => s[e.key])
    .map((e) => e.label.toLowerCase())
    .filter((n) => n !== "airlock");
  if (extras.length) bits.push(extras.join(", "));
  return bits.join(". ") + ".";
}

export function nameFromSpec(spec: BriefSpec): string {
  const s = normalizeSpec(spec);
  const { w, d } = padDims(s);
  const shape =
    s.layout === "tower"
      ? "watchtower"
      : s.layout === "hangar"
        ? "hangar"
        : s.layout === "courtyard"
          ? "courtyard"
          : "shelter";
  const parked = parkedVehicles(s);
  let park = "";
  if (parked.length === 1) {
    park =
      parked[0] === "scout"
        ? " · scout"
        : parked[0] === "assault"
          ? " · assault"
          : parked[0] === "buggy"
            ? " · buggy"
            : parked[0] === "bike"
              ? " · bike"
              : parked[0] === "carrier"
                ? " · carrier"
                : " · crawler";
  } else if (parked.length > 1) {
    park = " · fleet";
  }
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
      vehicles: ["bike"],
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
      vehicles: [],
      bay: "south",
      airlock: false,
      cistern: true,
      workshop: false,
      loft: false,
      lookout: false,
      storage: "chest",
    },
  },
  {
    id: "starter-hangar",
    label: "Starter hangar",
    spec: {
      size: "starter",
      stories: 5,
      layout: "hangar",
      entrance: "east",
      vehicle: "buggy",
      vehicles: ["buggy", "scout"],
      bay: "south",
      airlock: true,
      cistern: true,
      workshop: true,
      loft: true,
      lookout: true,
      storage: "chest",
    },
  },
  {
    id: "hangar",
    label: "Scout bay",
    spec: {
      size: "compound",
      stories: 2,
      layout: "hangar",
      entrance: "east",
      vehicle: "scout",
      vehicles: ["scout"],
      bay: "south",
      airlock: false,
      cistern: true,
      workshop: true,
      loft: true,
      lookout: false,
      storage: "chest",
    },
  },
  {
    id: "fleet",
    label: "Advanced fleet hangar",
    spec: {
      size: "advanced",
      stories: 2,
      layout: "hangar",
      entrance: "east",
      vehicle: "carrier",
      vehicles: ["scout", "buggy", "bike", "carrier", "crawler"],
      bay: "south",
      airlock: true,
      cistern: true,
      workshop: true,
      loft: true,
      lookout: false,
      storage: "container",
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
      vehicles: [],
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
      vehicles: [],
      bay: "south",
      airlock: true,
      cistern: true,
      workshop: false,
      loft: true,
      lookout: false,
    },
  },
];
