/** Vehicle stall math for the planner. Player-measured, not Funcom tables. See docs/choam.md. */

export const PARK_VEHICLES = ["bike", "buggy", "scout", "assault", "carrier", "crawler"] as const;
export type ParkVehicleId = (typeof PARK_VEHICLES)[number];

/** Old saves used a single ornithopter. That is the scout. */
const VEHICLE_ALIAS: Record<string, ParkVehicleId> = { thopter: "scout" };

/** Largest first. Used to pick a primary vehicle and to pack stalls. */
export const PARK_PRIMARY: ParkVehicleId[] = [
  "carrier",
  "crawler",
  "assault",
  "scout",
  "buggy",
  "bike",
];

export const PARK_LABELS: Record<ParkVehicleId, string> = {
  bike: "Sandbike",
  buggy: "Buggy",
  scout: "Scout ornithopter",
  assault: "Assault ornithopter",
  carrier: "Carrier",
  crawler: "Crawler",
};

export function resolveVehicle(v: unknown): ParkVehicleId | null {
  if (typeof v !== "string") return null;
  if (v in VEHICLE_ALIAS) return VEHICLE_ALIAS[v]!;
  if ((PARK_VEHICLES as readonly string[]).includes(v)) return v as ParkVehicleId;
  return null;
}

export function isParkVehicle(v: unknown): v is ParkVehicleId {
  return resolveVehicle(v) !== null;
}

export function uniqueVehicles(list: unknown): ParkVehicleId[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<ParkVehicleId>();
  for (const item of list) {
    const id = resolveVehicle(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
  }
  return PARK_PRIMARY.filter((v) => seen.has(v));
}

export function primaryVehicle(vehicles: ParkVehicleId[]): ParkVehicleId | "none" {
  const u = uniqueVehicles(vehicles);
  return u[0] ?? "none";
}

/**
 * Comfortable empty floor in CHOAM cells (walk-around, not a coffin).
 * Hangar padding matches the historical single-vehicle bays so old raises stay familiar
 * on pads that can hold them. Tight pads clamp in fleetStalls.
 */
const SINGLE: Record<
  ParkVehicleId,
  { along: number; depth: number; hangarAlong: number; hangarDepth: number }
> = {
  bike: { along: 3, depth: 2, hangarAlong: 4, hangarDepth: 3 },
  buggy: { along: 3, depth: 2, hangarAlong: 4, hangarDepth: 3 },
  scout: { along: 4, depth: 3, hangarAlong: 5, hangarDepth: 4 },
  assault: { along: 4, depth: 5, hangarAlong: 5, hangarDepth: 5 },
  crawler: { along: 2, depth: 2, hangarAlong: 2, hangarDepth: 2 },
  carrier: { along: 5, depth: 6, hangarAlong: 5, hangarDepth: 6 },
};

/** Multi-vehicle stalls: research footprints plus a cell of walk-around. */
const FLEET: Record<ParkVehicleId, { along: number; depth: number }> = {
  bike: { along: 2, depth: 2 },
  buggy: { along: 3, depth: 3 },
  scout: { along: 4, depth: 4 },
  assault: { along: 4, depth: 5 },
  crawler: { along: 2, depth: 2 },
  carrier: { along: 5, depth: 6 },
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

export type OpeningKind = "garage" | "pentashield";

export type PackedStall = {
  vehicle: ParkVehicleId;
  shared: ParkVehicleId[];
  along: number;
  depth: number;
  u0: number;
  v0: number;
  story: number;
  rise: number;
  opening: OpeningKind;
};

export function openingOf(vehicle: ParkVehicleId): OpeningKind {
  return vehicle === "carrier" || vehicle === "assault" ? "pentashield" : "garage";
}

/** Wall-tiles of clear height. Scout is two. Assault and carrier are three. */
export function riseOf(vehicle: ParkVehicleId): number {
  if (vehicle === "carrier" || vehicle === "assault") return 3;
  return 2;
}

export function isGroundVehicle(v: ParkVehicleId): boolean {
  return v === "bike" || v === "buggy" || v === "crawler";
}

export function isFlyerVehicle(v: ParkVehicleId): boolean {
  return v === "scout" || v === "assault" || v === "carrier";
}

/**
 * A carrier hall is big enough that scout, buggy, and bike park in it.
 * Assault halls also take a scout. Buggy bays also take a sandbike.
 * A crawler needs its own 2×2 well unless it sits under a carrier.
 */
export function groupStalls(vehicles: ParkVehicleId[]): ParkVehicleId[][] {
  const set = new Set(uniqueVehicles(vehicles));
  const groups: ParkVehicleId[][] = [];
  if (set.has("carrier")) {
    const shared = PARK_PRIMARY.filter((v) => v !== "crawler" && set.has(v));
    groups.push(shared);
    for (const v of shared) set.delete(v);
  }
  if (set.has("assault") && set.has("scout")) {
    groups.push(["assault", "scout"]);
    set.delete("assault");
    set.delete("scout");
  }
  if (set.has("buggy") && set.has("bike")) {
    groups.push(["buggy", "bike"]);
    set.delete("buggy");
    set.delete("bike");
  }
  for (const v of PARK_PRIMARY) {
    if (set.has(v)) groups.push([v]);
  }
  return groups;
}

export const MAX_VEHICLE_COUNT = 4;

export type VehicleCounts = Partial<Record<ParkVehicleId, number>>;

export function remapCounts(counts?: Record<string, number> | VehicleCounts | null): VehicleCounts {
  const out: VehicleCounts = {};
  if (!counts) return out;
  for (const [k, n] of Object.entries(counts)) {
    const id = resolveVehicle(k);
    if (!id || !Number.isFinite(n)) continue;
    out[id] = n as number;
  }
  return out;
}

export function countOf(
  id: ParkVehicleId,
  vehicles: ParkVehicleId[],
  counts?: VehicleCounts | Record<string, number>,
): number {
  const parked = uniqueVehicles(vehicles);
  if (!parked.includes(id)) return 0;
  const mapped = remapCounts(counts);
  const n = mapped[id];
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_VEHICLE_COUNT, Math.round(n as number)));
}

export type FleetOpts = {
  counts?: VehicleCounts | Record<string, number>;
  wrapAlong?: number;
  wrapDepth?: number;
  /** Force compact stack (ground under flyer). Default: auto on tight hangar pads. */
  stack?: boolean;
  /** Put a shops deck at story 2 and raise the fly-in to story 3 (scout stack only). */
  insertShops?: boolean;
};

function stallItems(
  vehicles: ParkVehicleId[],
  hangar: boolean,
  counts?: VehicleCounts | Record<string, number>,
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

type StallItem = { vehicle: ParkVehicleId; shared: ParkVehicleId[]; along: number; depth: number };

function clampItem(it: StallItem, wrapAlong?: number, wrapDepth?: number): StallItem {
  if (it.vehicle === "carrier") return it;
  return {
    ...it,
    along: wrapAlong ? Math.max(2, Math.min(it.along, wrapAlong)) : it.along,
    depth: wrapDepth ? Math.max(2, Math.min(it.depth, wrapDepth)) : it.depth,
  };
}

function shelfPack(items: StallItem[], maxAlong: number, story: number): PackedStall[] {
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
    out.push({
      ...it,
      u0: rowAlong,
      v0: rowV,
      story,
      rise: riseOf(it.vehicle),
      opening: openingOf(it.vehicle),
    });
    rowAlong += it.along;
    rowMaxDepth = Math.max(rowMaxDepth, it.depth);
  }
  return out;
}

export function shouldStack(
  vehicles: ParkVehicleId[],
  hangar: boolean,
  opts?: FleetOpts,
): boolean {
  if (opts?.stack === false) return false;
  const parked = uniqueVehicles(vehicles);
  if (parked.includes("carrier")) return false;
  const ground = parked.some((v) => v === "bike" || v === "buggy" || v === "crawler");
  const flyer = parked.some((v) => v === "scout" || v === "assault");
  if (!ground || !flyer) return false;
  if (opts?.stack === true) return true;
  if (!hangar) return false;
  const along = opts?.wrapAlong ?? 10;
  const depth = opts?.wrapDepth ?? 10;
  return along <= 6 && depth <= 6;
}

/** Shelf-pack along a hangar face. Wrap at 10 cells unless wrapAlong is set. */
export function fleetStalls(
  vehicles: ParkVehicleId[],
  hangar: boolean,
  opts?: FleetOpts,
): PackedStall[] {
  const raw = stallItems(vehicles, hangar, opts?.counts).map((it) =>
    clampItem(it, opts?.wrapAlong, opts?.wrapDepth),
  );
  if (!raw.length) return [];
  const carriers = raw.filter((i) => i.vehicle === "carrier");
  const crawlers = raw.filter((i) => i.vehicle === "crawler");
  const rest = raw.filter((i) => i.vehicle !== "carrier" && i.vehicle !== "crawler");
  const carrierStack = carriers.length > 0 && crawlers.length > 0;
  const compactStack = shouldStack(vehicles, hangar, opts);
  const maxItem = Math.max(...raw.map((i) => i.along));
  const totalAlong = carrierStack
    ? rest.reduce((s, i) => s + i.along, 0) + carriers.reduce((s, i) => s + i.along, 0)
    : raw.reduce((s, i) => s + i.along, 0);
  const cap = opts?.wrapAlong ?? 10;
  const maxAlong = Math.max(maxItem, Math.min(cap, Math.max(totalAlong, maxItem)));

  if (compactStack && !carrierStack) {
    const grounds = raw.filter((i) => i.vehicle === "bike" || i.vehicle === "buggy" || i.vehicle === "crawler");
    const flyers = raw.filter((i) => i.vehicle === "scout" || i.vehicle === "assault");
    const leftover = raw.filter(
      (i) =>
        i.vehicle !== "bike" &&
        i.vehicle !== "buggy" &&
        i.vehicle !== "crawler" &&
        i.vehicle !== "scout" &&
        i.vehicle !== "assault",
    );
    const out: PackedStall[] = leftover.length ? shelfPack(leftover, maxAlong, 0) : [];
    let rowAlong = out.length ? packExtent(out).along : 0;
    let rowV = 0;
    const flyerStory =
      opts?.insertShops && flyers.some((f) => riseOf(f.vehicle) === 2) ? 3 : 2;
    const n = Math.max(grounds.length, flyers.length);
    for (let i = 0; i < n; i++) {
      const g = grounds[i];
      const f = flyers[i];
      const along = Math.max(g?.along ?? 0, f?.along ?? 0, 2);
      const depth = Math.max(g?.depth ?? 0, f?.depth ?? 0, 2);
      if (rowAlong > 0 && rowAlong + along > maxAlong) {
        rowV += depth;
        rowAlong = 0;
      }
      if (g) {
        out.push({
          ...g,
          along: g.along,
          depth: g.depth,
          u0: rowAlong,
          v0: rowV,
          story: 0,
          rise: riseOf(g.vehicle),
          opening: "garage",
        });
      }
      if (f) {
        out.push({
          ...f,
          along: f.along,
          depth: f.depth,
          u0: rowAlong,
          v0: rowV,
          story: flyerStory,
          rise: riseOf(f.vehicle),
          opening: openingOf(f.vehicle),
        });
      }
      rowAlong += along;
    }
    return out;
  }

  if (!carrierStack) {
    return shelfPack(raw, maxAlong, 0);
  }

  const out = shelfPack(rest, maxAlong, 0);
  let rowAlong = out.length ? packExtent(out).along : 0;
  let rowV = 0;
  let rowMaxDepth = out.length ? Math.max(...out.filter((s) => s.v0 === 0).map((s) => s.depth), 0) : 0;
  if (rowAlong >= maxAlong && rest.length) {
    rowV = packExtent(out).depth;
    rowAlong = 0;
    rowMaxDepth = 0;
  }
  const unpairedCrawlers = crawlers.slice(carriers.length);
  for (let i = 0; i < carriers.length; i++) {
    const car = carriers[i]!;
    if (rowAlong > 0 && rowAlong + car.along > maxAlong) {
      rowV += Math.max(rowMaxDepth, car.depth);
      rowAlong = 0;
      rowMaxDepth = 0;
    }
    out.push({
      ...car,
      u0: rowAlong,
      v0: rowV,
      story: 2,
      rise: riseOf("carrier"),
      opening: "pentashield",
    });
    const cr = crawlers[i];
    if (cr) {
      out.push({
        ...cr,
        along: 2,
        depth: 2,
        u0: rowAlong + Math.max(0, Math.floor((car.along - 2) / 2)),
        v0: rowV,
        story: 0,
        rise: 2,
        opening: "garage",
      });
    }
    rowAlong += car.along;
    rowMaxDepth = Math.max(rowMaxDepth, car.depth);
  }
  if (unpairedCrawlers.length) {
    out.push(...shelfPack(unpairedCrawlers, maxAlong, 0));
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

/** Cells the pack needs on the bay face, plus living depth behind a non-hangar garage. */
export function fleetNeed(
  vehicles: ParkVehicleId[],
  hangar: boolean,
  shareFace: boolean,
  opts?: FleetOpts,
): { along: number; depth: number; stalls: PackedStall[]; rigid: boolean } {
  const stalls = fleetStalls(vehicles, hangar, opts);
  if (!stalls.length) return { along: 0, depth: 0, stalls, rigid: false };
  const ext = packExtent(stalls);
  const stacked = stalls.some((s) => s.story >= 2) && stalls.some((s) => s.story === 0);
  const living = hangar || stacked ? 0 : 2;
  const rigid =
    hangar ||
    stalls.length > 1 ||
    stalls.some((s) => s.vehicle === "carrier" || s.vehicle === "crawler" || s.vehicle === "assault");
  return {
    along: ext.along + (shareFace ? 1 : 0),
    depth: ext.depth + living,
    stalls,
    rigid,
  };
}

function countLabel(id: ParkVehicleId, n: number): string {
  const one = PARK_LABELS[id].toLowerCase();
  if (n <= 1) return one;
  if (id === "scout") return `${n} scout ornithopters`;
  if (id === "assault") return `${n} assault ornithopters`;
  if (id === "bike") return `${n} sandbikes`;
  if (id === "buggy") return `${n} buggies`;
  if (id === "carrier") return `${n} carriers`;
  return `${n} crawlers`;
}

export function describeFleet(
  vehicles: ParkVehicleId[],
  counts?: VehicleCounts | Record<string, number>,
): string {
  const u = uniqueVehicles(vehicles);
  if (!u.length) return "no vehicles";
  const names = u.map((v) => countLabel(v, countOf(v, u, counts)));
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function neededStoriesFor(stalls: PackedStall[]): number {
  if (!stalls.length) return 1;
  return Math.max(1, ...stalls.map((s) => s.story + s.rise));
}
