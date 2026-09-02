import type { Rot } from "./grid.ts";
import {
  PARK_LABELS,
  PARK_VEHICLES,
  describeFleet,
  fleetNeed,
  isParkVehicle,
  primaryVehicle,
  uniqueVehicles,
  type ParkVehicleId,
} from "./vehicles.ts";

export { PARK_LABELS, PARK_VEHICLES, isParkVehicle, uniqueVehicles, primaryVehicle };
export type { ParkVehicleId };

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
  stories: 1 | 2 | 3;
  layout: LayoutId;
  entrance: Facing;
  vehicle: VehicleId;
  /** Parked vehicles. Empty means none. If omitted, derived from `vehicle`. */
  vehicles?: ParkVehicleId[];
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
  vehicles: [],
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
  { id: "thopter", label: "Ornithopter" },
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
  { key: "workshop", label: "Workshop" },
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

export function parkedVehicles(spec: Pick<BriefSpec, "vehicle" | "vehicles">): ParkVehicleId[] {
  if (spec.vehicles) return uniqueVehicles(spec.vehicles);
  if (spec.vehicle !== "none" && isParkVehicle(spec.vehicle)) return [spec.vehicle];
  return [];
}

function sameParked(a: BriefSpec, b: BriefSpec): boolean {
  return parkedVehicles(a).join(",") === parkedVehicles(b).join(",");
}

export function specsEqual(a: BriefSpec, b: BriefSpec): boolean {
  return (
    a.size === b.size &&
    a.stories === b.stories &&
    a.layout === b.layout &&
    a.entrance === b.entrance &&
    sameParked(a, b) &&
    a.bay === b.bay &&
    a.airlock === b.airlock &&
    a.cistern === b.cistern &&
    a.workshop === b.workshop &&
    a.loft === b.loft &&
    a.lookout === b.lookout
  );
}

export function sizeFitsFleet(
  size: SizeId,
  spec: Pick<BriefSpec, "vehicles" | "vehicle" | "layout" | "bay" | "entrance">,
): boolean {
  const vehicles = parkedVehicles(spec);
  if (!vehicles.length) return true;
  const hangar = spec.layout === "hangar";
  const shareFace = spec.entrance === spec.bay;
  const need = fleetNeed(vehicles, hangar, shareFace);
  const { w, d } = SIZE_DIMS[size];
  const along = spec.bay === "south" || spec.bay === "north" ? w : d;
  const deep = spec.bay === "south" || spec.bay === "north" ? d : w;
  if (along < need.along) return false;
  if (need.rigid) return deep >= need.depth;
  return Math.max(2, deep - 2) >= 2;
}

export function minSizeForFleet(
  spec: Pick<BriefSpec, "vehicles" | "vehicle" | "layout" | "bay" | "entrance">,
): SizeId {
  const hangar = spec.layout === "hangar";
  for (const id of SIZES) {
    if (hangar && id === "starter") continue;
    if (sizeFitsFleet(id, spec)) return id;
  }
  return "advanced";
}

function syncParked(spec: BriefSpec): BriefSpec {
  const vehicles = parkedVehicles(spec);
  return { ...spec, vehicles, vehicle: primaryVehicle(vehicles) };
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
  if (next.layout === "hangar" && next.size === "starter") {
    next.size = "compact";
    notes.push("A hangar needs a 6×5 pad.");
  }
  if (next.layout === "hangar" && next.vehicles!.length === 0) {
    next.vehicles = ["thopter"];
    next.vehicle = "thopter";
    notes.push("A hangar parks an ornithopter.");
  }
  const minSize = minSizeForFleet(next);
  if (SIZES.indexOf(next.size) < SIZES.indexOf(minSize)) {
    next.size = minSize;
    const { w, d } = SIZE_DIMS[minSize];
    notes.push(
      `Parking ${describeFleet(next.vehicles!)} needs a ${w}×${d} pad (${SIZE_OPTS.find((o) => o.id === minSize)?.label ?? minSize}).`,
    );
  }
  if (next.layout === "tower" && next.stories < 3) {
    next.stories = 3;
    notes.push("A watchtower is three stories.");
  }
  if (next.vehicles!.length > 0 && next.stories < 2) {
    next.stories = 2;
    notes.push("A two-high garage needs two stories.");
  }
  if (next.vehicles!.includes("carrier") && next.stories < 3) {
    notes.push(
      "A carrier wants three wall-tiles of height in-game. This schematic still uses the two-high CHOAM garage door; leave the hall open or add a third story when you fly one.",
    );
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
  const storiesRaw = Number(o.stories);
  const stories: 1 | 2 | 3 = storiesRaw === 3 ? 3 : storiesRaw === 1 ? 1 : 2;
  const vehicles = uniqueVehicles(o.vehicles);
  const vehicleField = isVehicle(o.vehicle) ? o.vehicle : DEFAULT_SPEC.vehicle;
  const seeded =
    vehicles.length > 0
      ? vehicles
      : vehicleField !== "none" && isParkVehicle(vehicleField)
        ? [vehicleField]
        : [];
  return normalizeSpec({
    size: isSize(o.size) ? o.size : DEFAULT_SPEC.size,
    stories,
    layout: isLayout(o.layout) ? o.layout : DEFAULT_SPEC.layout,
    entrance: isFacing(o.entrance) ? o.entrance : DEFAULT_SPEC.entrance,
    vehicle: primaryVehicle(seeded),
    vehicles: seeded,
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
  const parked = parkedVehicles(s);
  if (parked.length) {
    bits.push(`${s.bay} two-high garage for ${describeFleet(parked)}`);
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
  const parked = parkedVehicles(s);
  let park = "";
  if (parked.length === 1) {
    park =
      parked[0] === "thopter"
        ? " · 'thopter"
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
      vehicles: ["thopter"],
      bay: "south",
      airlock: false,
      cistern: true,
      workshop: true,
      loft: true,
      lookout: false,
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
      vehicles: ["thopter", "buggy", "bike", "carrier", "crawler"],
      bay: "south",
      airlock: true,
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
