/** Vehicle stall math for the planner. Player-measured, not Funcom tables. See docs/choam.md. */

export const PARK_VEHICLES = ["bike", "buggy", "thopter", "carrier", "crawler"] as const;
export type ParkVehicleId = (typeof PARK_VEHICLES)[number];

/** Largest first. Used to pick a primary vehicle and to pack stalls. */
export const PARK_PRIMARY: ParkVehicleId[] = [
  "carrier",
  "crawler",
  "thopter",
  "buggy",
  "bike",
];

export const PARK_LABELS: Record<ParkVehicleId, string> = {
  bike: "Sandbike",
  buggy: "Buggy",
  thopter: "Ornithopter",
  carrier: "Carrier",
  crawler: "Crawler",
};

export function isParkVehicle(v: unknown): v is ParkVehicleId {
  return (PARK_VEHICLES as readonly string[]).includes(v as string);
}

export function uniqueVehicles(list: unknown): ParkVehicleId[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<ParkVehicleId>();
  const out: ParkVehicleId[] = [];
  for (const item of list) {
    if (!isParkVehicle(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return PARK_PRIMARY.filter((v) => seen.has(v));
}

export function primaryVehicle(vehicles: ParkVehicleId[]): ParkVehicleId | "none" {
  const u = uniqueVehicles(vehicles);
  return u[0] ?? "none";
}

/**
 * Comfortable empty floor in CHOAM cells (walk-around, not a coffin).
 * Hangar padding matches the historical single-vehicle bays so old raises stay familiar.
 */
const SINGLE: Record<ParkVehicleId, { along: number; depth: number; hangarAlong: number; hangarDepth: number }> =
  {
    bike: { along: 3, depth: 2, hangarAlong: 4, hangarDepth: 3 },
    buggy: { along: 3, depth: 2, hangarAlong: 4, hangarDepth: 3 },
    thopter: { along: 4, depth: 3, hangarAlong: 5, hangarDepth: 4 },
    crawler: { along: 4, depth: 4, hangarAlong: 4, hangarDepth: 4 },
    carrier: { along: 6, depth: 6, hangarAlong: 6, hangarDepth: 6 },
  };

/** Multi-vehicle stalls: research footprints plus a cell of walk-around. */
const FLEET: Record<ParkVehicleId, { along: number; depth: number }> = {
  bike: { along: 2, depth: 2 },
  buggy: { along: 3, depth: 3 },
  thopter: { along: 4, depth: 4 },
  crawler: { along: 4, depth: 4 },
  carrier: { along: 6, depth: 6 },
};

export function stallSize(
  vehicle: ParkVehicleId,
  hangar: boolean,
  multi: boolean,
): { along: number; depth: number } {
  if (multi) return FLEET[vehicle];
  const s = SINGLE[vehicle];
  return hangar ? { along: s.hangarAlong, depth: s.hangarDepth } : { along: s.along, depth: s.depth };
}

export type PackedStall = {
  vehicle: ParkVehicleId;
  shared: ParkVehicleId[];
  along: number;
  depth: number;
  u0: number;
  v0: number;
};

/**
 * A carrier hall is big enough that scout, buggy, and bike park in it.
 * A crawler needs its own 4×4 well and never shares.
 */
export function groupStalls(vehicles: ParkVehicleId[]): ParkVehicleId[][] {
  const set = new Set(uniqueVehicles(vehicles));
  const groups: ParkVehicleId[][] = [];
  if (set.has("carrier")) {
    const shared = PARK_PRIMARY.filter((v) => v !== "crawler" && set.has(v));
    groups.push(shared);
    for (const v of shared) set.delete(v);
  }
  for (const v of PARK_PRIMARY) {
    if (set.has(v)) groups.push([v]);
  }
  return groups;
}

export const MAX_VEHICLE_COUNT = 4;

export type VehicleCounts = Partial<Record<ParkVehicleId, number>>;

export function countOf(
  id: ParkVehicleId,
  vehicles: ParkVehicleId[],
  counts?: VehicleCounts,
): number {
  const parked = uniqueVehicles(vehicles);
  if (!parked.includes(id)) return 0;
  const n = counts?.[id];
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_VEHICLE_COUNT, Math.round(n as number)));
}

export type FleetOpts = {
  counts?: VehicleCounts;
  wrapAlong?: number;
};

function stallItems(
  vehicles: ParkVehicleId[],
  hangar: boolean,
  counts?: VehicleCounts,
): { vehicle: ParkVehicleId; shared: ParkVehicleId[]; along: number; depth: number }[] {
  const parked = uniqueVehicles(vehicles);
  const groups = groupStalls(parked);
  const multi = parked.length > 1 || parked.some((v) => countOf(v, parked, counts) > 1);
  const items: { vehicle: ParkVehicleId; shared: ParkVehicleId[]; along: number; depth: number }[] =
    [];
  for (const g of groups) {
    const host = g[0]!;
    const size = stallSize(host, hangar, multi);
    const copies = countOf(host, parked, counts);
    items.push({ vehicle: host, shared: g, along: size.along, depth: size.depth });
    for (let i = 1; i < copies; i++) {
      items.push({ vehicle: host, shared: [host], along: size.along, depth: size.depth });
    }
    for (const extra of g.slice(1)) {
      const extraN = countOf(extra, parked, counts);
      if (extraN <= 1) continue;
      const extraSize = stallSize(extra, hangar, true);
      for (let i = 1; i < extraN; i++) {
        items.push({
          vehicle: extra,
          shared: [extra],
          along: extraSize.along,
          depth: extraSize.depth,
        });
      }
    }
  }
  return items;
}

/** Shelf-pack along a hangar face. Wrap at 10 cells unless wrapAlong is set. */
export function fleetStalls(
  vehicles: ParkVehicleId[],
  hangar: boolean,
  opts?: FleetOpts,
): PackedStall[] {
  const items = stallItems(vehicles, hangar, opts?.counts);
  if (!items.length) return [];
  const maxItem = Math.max(...items.map((i) => i.along));
  const totalAlong = items.reduce((s, i) => s + i.along, 0);
  const cap = opts?.wrapAlong ?? 10;
  const maxAlong = Math.max(maxItem, Math.min(cap, totalAlong));
  const sorted = [...items].sort((a, b) => b.depth - a.depth || b.along - a.along);
  const out: PackedStall[] = [];
  let rowAlong = 0;
  let rowV = 0;
  let rowMaxDepth = 0;
  for (const it of sorted) {
    if (rowAlong > 0 && rowAlong + it.along > maxAlong) {
      rowV += rowMaxDepth;
      rowAlong = 0;
      rowMaxDepth = 0;
    }
    out.push({ ...it, u0: rowAlong, v0: rowV });
    rowAlong += it.along;
    rowMaxDepth = Math.max(rowMaxDepth, it.depth);
  }
  return out;
}

export function packExtent(stalls: PackedStall[]): { along: number; depth: number } {
  let along = 0;
  let depth = 0;
  for (const s of stalls) {
    along = Math.max(along, s.u0 + s.along);
    depth = Math.max(depth, s.v0 + s.depth);
  }
  return { along, depth };
}

/** Cells the pack needs on the bay face, plus living depth behind the hangar. */
export function fleetNeed(
  vehicles: ParkVehicleId[],
  hangar: boolean,
  shareFace: boolean,
  opts?: FleetOpts,
): { along: number; depth: number; stalls: PackedStall[]; rigid: boolean } {
  const stalls = fleetStalls(vehicles, hangar, opts);
  if (!stalls.length) return { along: 0, depth: 0, stalls, rigid: false };
  const ext = packExtent(stalls);
  const rigid =
    stalls.length > 1 || stalls.some((s) => s.vehicle === "carrier" || s.vehicle === "crawler");
  return {
    along: ext.along + (shareFace ? 1 : 0),
    depth: ext.depth + 2,
    stalls,
    rigid,
  };
}

function countLabel(id: ParkVehicleId, n: number): string {
  const one = PARK_LABELS[id].toLowerCase();
  if (n <= 1) return one;
  if (id === "thopter") return `${n} ornithopters`;
  if (id === "bike") return `${n} sandbikes`;
  if (id === "buggy") return `${n} buggies`;
  if (id === "carrier") return `${n} carriers`;
  return `${n} crawlers`;
}

export function describeFleet(vehicles: ParkVehicleId[], counts?: VehicleCounts): string {
  const u = uniqueVehicles(vehicles);
  if (!u.length) return "no vehicles";
  const names = u.map((v) => countLabel(v, countOf(v, u, counts)));
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
