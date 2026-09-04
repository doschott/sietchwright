import {
  FACE_ROT,
  PARK_LABELS,
  describeSpec,
  nameFromSpec,
  normalizeSpec,
  padDims,
  parkedVehicles,
  type BriefSpec,
  type Facing,
} from "./spec.ts";
import { GARAGE_W, PENTA_H, PENTA_H_MIN, PENTA_W, garageAlong, type Rot } from "./grid.ts";
import { orderShopCells, packStations } from "./stations.ts";
import {
  fleetStalls,
  packExtent,
  type OpeningKind,
  type PackedStall,
  type ParkVehicleId,
} from "./vehicles.ts";
import { Yard } from "./yard.ts";
import { boundsOf, countPieces, type Plan } from "./plan.ts";

type Cell = { x: number; z: number };
type Rect = { x0: number; z0: number; x1: number; z1: number };

function key(x: number, z: number): string {
  return `${x},${z}`;
}

function inRect(r: Rect, x: number, z: number): boolean {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

function rectKeys(r: Rect): Set<string> {
  const s = new Set<string>();
  for (let x = r.x0; x <= r.x1; x++) {
    for (let z = r.z0; z <= r.z1; z++) s.add(key(x, z));
  }
  return s;
}

function faceCells(w: number, d: number, facing: Facing): { x: number; z: number; rot: Rot }[] {
  const rot = FACE_ROT[facing];
  const out: { x: number; z: number; rot: Rot }[] = [];
  if (facing === "south") {
    for (let x = 0; x < w; x++) out.push({ x, z: d - 1, rot });
  } else if (facing === "north") {
    for (let x = 0; x < w; x++) out.push({ x, z: 0, rot });
  } else if (facing === "east") {
    for (let z = 0; z < d; z++) out.push({ x: w - 1, z, rot });
  } else {
    for (let z = 0; z < d; z++) out.push({ x: 0, z, rot });
  }
  return out;
}

function centerIndex(n: number, span: number): number {
  if (n <= span) return 0;
  return Math.max(0, Math.floor((n - span) / 2));
}

function inward(facing: Facing): { dx: number; dz: number } {
  if (facing === "south") return { dx: 0, dz: -1 };
  if (facing === "north") return { dx: 0, dz: 1 };
  if (facing === "east") return { dx: -1, dz: 0 };
  return { dx: 1, dz: 0 };
}

function oppositeRot(rot: Rot): Rot {
  return ((rot + 180) % 360) as Rot;
}

function facingFromRot(rot: Rot): Facing {
  if (rot === 0) return "south";
  if (rot === 90) return "east";
  if (rot === 180) return "north";
  return "west";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function faceRect(
  w: number,
  d: number,
  facing: Facing,
  u0: number,
  u1: number,
  v0: number,
  v1: number,
): Rect {
  const uu0 = Math.min(u0, u1);
  const uu1 = Math.max(u0, u1);
  const vv0 = Math.min(v0, v1);
  const vv1 = Math.max(v0, v1);
  if (facing === "south") {
    return {
      x0: clamp(uu0, 0, w - 1),
      x1: clamp(uu1, 0, w - 1),
      z0: clamp(d - 1 - vv1, 0, d - 1),
      z1: clamp(d - 1 - vv0, 0, d - 1),
    };
  }
  if (facing === "north") {
    return {
      x0: clamp(uu0, 0, w - 1),
      x1: clamp(uu1, 0, w - 1),
      z0: clamp(vv0, 0, d - 1),
      z1: clamp(vv1, 0, d - 1),
    };
  }
  if (facing === "east") {
    return {
      x0: clamp(w - 1 - vv1, 0, w - 1),
      x1: clamp(w - 1 - vv0, 0, w - 1),
      z0: clamp(uu0, 0, d - 1),
      z1: clamp(uu1, 0, d - 1),
    };
  }
  return {
    x0: clamp(vv0, 0, w - 1),
    x1: clamp(vv1, 0, w - 1),
    z0: clamp(uu0, 0, d - 1),
    z1: clamp(uu1, 0, d - 1),
  };
}

export type WorldStall = {
  vehicle: ParkVehicleId;
  shared: ParkVehicleId[];
  rect: Rect;
  story: number;
  rise: number;
  opening: OpeningKind;
};

/** Map packed stalls onto the named pad face. */
export function stallsToWorld(
  w: number,
  d: number,
  facing: Facing,
  stalls: PackedStall[],
  shareFace: boolean,
): WorldStall[] {
  if (!stalls.length) return [];
  const along = facing === "south" || facing === "north" ? w : d;
  const deep = facing === "south" || facing === "north" ? d : w;
  const ext = packExtent(stalls);
  const minLivingAlong = shareFace ? 1 : 0;
  const availAlong = Math.max(GARAGE_W, along - minLivingAlong);
  const availDepth = Math.max(2, deep - 2);
  const alongFit = Math.min(ext.along, availAlong);
  const start = shareFace ? 0 : Math.max(0, Math.floor((along - alongFit) / 2));
  const alongScale = ext.along > availAlong ? availAlong / ext.along : 1;
  const depthScale = ext.depth > availDepth ? availDepth / ext.depth : 1;

  return stalls.map((s) => {
    const alongSize = Math.max(GARAGE_W, Math.round(s.along * alongScale));
    const depthSize = Math.max(2, Math.round(s.depth * depthScale));
    const u0 = start + Math.round(s.u0 * alongScale);
    const u1 = Math.min(along - 1 - minLivingAlong, u0 + alongSize - 1);
    const v0 = Math.round(s.v0 * depthScale);
    const v1 = Math.min(availDepth - 1, v0 + depthSize - 1);
    return {
      vehicle: s.vehicle,
      shared: s.shared,
      rect: faceRect(w, d, facing, u0, u1, v0, v1),
      story: s.story,
      rise: s.rise,
      opening: s.opening,
    };
  });
}

function unionRect(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  return rects.reduce(
    (acc, r) => ({
      x0: Math.min(acc.x0, r.x0),
      z0: Math.min(acc.z0, r.z0),
      x1: Math.max(acc.x1, r.x1),
      z1: Math.max(acc.z1, r.z1),
    }),
    rects[0]!,
  );
}

/** Vehicle bay sits on the named face. Centered unless the people door shares that face, then offset to leave a door cell. */
export function bayRect(
  w: number,
  d: number,
  facing: Facing,
  vehicle: BriefSpec["vehicle"],
  hangar: boolean,
  shareFace: boolean,
): Rect | null {
  if (vehicle === "none" && !hangar) return null;
  const parked: ParkVehicleId[] = vehicle === "none" ? ["scout"] : [vehicle as ParkVehicleId];
  const world = stallsToWorld(
    w,
    d,
    facing,
    fleetStalls(parked, hangar, {
      wrapAlong: facing === "south" || facing === "north" ? w : d,
    }),
    shareFace,
  );
  return world[0]?.rect ?? null;
}

export function courtRect(w: number, d: number): Rect | null {
  if (w < 5 || d < 5) return null;
  const cw = Math.max(1, Math.min(3, w - 4));
  const cd = Math.max(1, Math.min(3, d - 4));
  if (cw < 1 || cd < 1) return null;
  const x0 = Math.floor((w - cw) / 2);
  const z0 = Math.floor((d - cd) / 2);
  return { x0, z0, x1: x0 + cw - 1, z1: z0 + cd - 1 };
}

function shrinkCourtFromBay(court: Rect, bay: Rect, facing: Facing): Rect | null {
  const next = { ...court };
  if (facing === "south") next.z1 = Math.min(next.z1, bay.z0 - 1);
  else if (facing === "north") next.z0 = Math.max(next.z0, bay.z1 + 1);
  else if (facing === "east") next.x1 = Math.min(next.x1, bay.x0 - 1);
  else next.x0 = Math.max(next.x0, bay.x1 + 1);
  if (next.x1 < next.x0 || next.z1 < next.z0) return null;
  return next;
}

function openingOriginFromBay(
  bay: Rect,
  facing: Facing,
  width: number,
): { x: number; z: number; rot: Rot } {
  const rot = FACE_ROT[facing];
  const span =
    facing === "south" || facing === "north" ? bay.x1 - bay.x0 + 1 : bay.z1 - bay.z0 + 1;
  const start = Math.max(0, Math.floor((span - width) / 2));
  if (facing === "south") return { x: bay.x0 + start, z: bay.z1, rot };
  if (facing === "north") return { x: bay.x0 + start, z: bay.z0, rot };
  if (facing === "east") return { x: bay.x1, z: bay.z0 + start, rot };
  return { x: bay.x0, z: bay.z0 + start, rot };
}

function cornerOrder(w: number, d: number, prefer: Facing): Cell[] {
  const all: Cell[] = [
    { x: 0, z: 0 },
    { x: w - 1, z: 0 },
    { x: 0, z: d - 1 },
    { x: w - 1, z: d - 1 },
  ];
  const rank = (c: Cell): number => {
    if (prefer === "north") return c.z + (c.x === 0 ? 0 : 1);
    if (prefer === "south") return d - 1 - c.z + (c.x === w - 1 ? 0 : 1);
    if (prefer === "east") return w - 1 - c.x + (c.z === 0 ? 0 : 1);
    return c.x + (c.z === 0 ? 0 : 1);
  };
  return all.sort((a, b) => rank(a) - rank(b));
}

function pickFree(w: number, d: number, avoid: Set<string>, prefer: Facing): Cell {
  for (const c of cornerOrder(w, d, prefer)) {
    if (!avoid.has(key(c.x, c.z))) return c;
  }
  for (let z = 0; z < d; z++) {
    for (let x = 0; x < w; x++) {
      if (!avoid.has(key(x, z))) return { x, z };
    }
  }
  return { x: w - 1, z: d - 1 };
}

function pickShop(w: number, d: number, avoid: Set<string>): Rect | null {
  const tries: Rect[] = [
    { x0: 0, z0: 0, x1: Math.min(1, w - 1), z1: Math.min(1, d - 1) },
    { x0: Math.max(0, w - 2), z0: 0, x1: w - 1, z1: Math.min(1, d - 1) },
    { x0: 0, z0: Math.max(0, d - 2), x1: Math.min(1, w - 1), z1: d - 1 },
    { x0: Math.max(0, w - 2), z0: Math.max(0, d - 2), x1: w - 1, z1: d - 1 },
  ];
  if (w >= 3) {
    tries.push({
      x0: 0,
      z0: Math.max(0, Math.floor(d / 2) - 1),
      x1: 1,
      z1: Math.min(d - 1, Math.floor(d / 2)),
    });
    tries.push({
      x0: w - 2,
      z0: Math.max(0, Math.floor(d / 2) - 1),
      x1: w - 1,
      z1: Math.min(d - 1, Math.floor(d / 2)),
    });
  }
  const fits = (r: Rect) => {
    for (let x = r.x0; x <= r.x1; x++) {
      for (let z = r.z0; z <= r.z1; z++) {
        if (x < 0 || z < 0 || x >= w || z >= d) return false;
        if (avoid.has(key(x, z))) return false;
      }
    }
    return r.x1 >= r.x0 && r.z1 >= r.z0;
  };
  for (const t of tries) {
    if (fits(t)) return t;
  }
  for (const t of tries) {
    const skinny: Rect = { x0: t.x0, z0: t.z0, x1: t.x0, z1: t.z1 };
    if (fits(skinny)) return skinny;
  }
  return null;
}

function openingTowardCenter(rect: Rect, w: number, d: number): { x: number; z: number; rot: Rot } {
  const cx = (rect.x0 + rect.x1) / 2;
  const cz = (rect.z0 + rect.z1) / 2;
  const dx = (w - 1) / 2 - cx;
  const dz = (d - 1) / 2 - cz;
  if (Math.abs(dx) >= Math.abs(dz)) {
    if (dx >= 0) return { x: rect.x1, z: Math.round(cz), rot: 90 };
    return { x: rect.x0, z: Math.round(cz), rot: 270 };
  }
  if (dz >= 0) return { x: Math.round(cx), z: rect.z1, rot: 0 };
  return { x: Math.round(cx), z: rect.z0, rot: 180 };
}

function bayInteriorOpening(bay: Rect, facing: Facing): { x: number; z: number; rot: Rot } {
  if (facing === "south") {
    return { x: Math.floor((bay.x0 + bay.x1) / 2), z: bay.z0, rot: 180 };
  }
  if (facing === "north") {
    return { x: Math.floor((bay.x0 + bay.x1) / 2), z: bay.z1, rot: 0 };
  }
  if (facing === "east") {
    return { x: bay.x0, z: Math.floor((bay.z0 + bay.z1) / 2), rot: 270 };
  }
  return { x: bay.x1, z: Math.floor((bay.z0 + bay.z1) / 2), rot: 90 };
}

const CELL_EDGES: { rot: Rot; dx: number; dz: number }[] = [
  { rot: 0, dx: 0, dz: 1 },
  { rot: 90, dx: 1, dz: 0 },
  { rot: 180, dx: 0, dz: -1 },
  { rot: 270, dx: -1, dz: 0 },
];

function addRoomWalls(
  y: Yard,
  cells: Set<string>,
  w: number,
  d: number,
  storiesFrom: number,
  storiesTo: number,
  room: string,
  opening: { x: number; z: number; rot: Rot } | null,
) {
  for (const k of cells) {
    const [xs, zs] = k.split(",");
    const x = Number(xs);
    const z = Number(zs);
    for (const e of CELL_EDGES) {
      const nx = x + e.dx;
      const nz = z + e.dz;
      if (cells.has(key(nx, nz))) continue;
      if (nx < 0 || nx >= w || nz < 0 || nz >= d) continue;
      const isOpen = Boolean(
        opening && opening.x === x && opening.z === z && opening.rot === e.rot,
      );
      for (let s = storiesFrom; s <= storiesTo; s++) {
        y.add(isOpen && s === storiesFrom ? "passageway" : "wall", x, s, z, e.rot, room);
      }
    }
  }
}

function tipsFromSpec(spec: BriefSpec, w: number, d: number): string[] {
  const tips = [`Lay a ${w}×${d} foundation pad, then wall the perimeter.`];
  if (spec.layout === "courtyard") {
    tips.push("Leave the inner court open to the sky — no floors, no roofs.");
  }
  if (spec.airlock) {
    tips.push(
      `People enter ${spec.entrance}: Door into a one-cell foyer, Passageway into the hall.`,
    );
  } else {
    tips.push(`People door sits on the ${spec.entrance} wall.`);
  }
  const parked = parkedVehicles(spec);
  if (parked.length) {
    const names = parked.map((v) => PARK_LABELS[v].toLowerCase()).join(", ");
    if (parked.includes("assault") && !parked.includes("carrier")) {
      tips.push(
        `${spec.bay} assault opening is a three-high pentashield. Scout is two-high. Keep the ${names} bay clear.`,
      );
    } else {
      tips.push(
        `${spec.bay} Garage Door is two cells wide and two stories tall. Keep the ${names} bay clear.`,
      );
    }
  }
  if (spec.workshop) {
    tips.push("Starter shops (fabs and small refineries) sit on their own deck, not the garage floor.");
  }
  if (spec.storage && spec.storage !== "none") {
    tips.push("Storage markers show crate size. Chests are what most new players can place.");
  }
  if (spec.cistern) tips.push("Cistern hatch in a back corner. Ladder on that wall.");
  if (spec.stories > 1) tips.push("Stairs climb a back corner. Hatch and ladder share that stack.");
  if (spec.lookout) tips.push("Rail the roof so the lookout is walkable.");
  return tips.slice(0, 7);
}

export function buildFromSpec(raw: BriefSpec): Plan {
  const spec = normalizeSpec(raw);
  const { w, d } = padDims(spec);
  const top = spec.stories - 1;
  const y = new Yard();
  y.name = nameFromSpec(spec);
  y.brief = describeSpec(spec);
  y.tips = tipsFromSpec(spec, w, d);
  y.source = "local";

  y.room("live", "Shelter", "Sleep, craft, and hide from the storm.");
  if (spec.airlock) y.room("foyer", "Airlock", "One-cell sand lock so storms stay outside.");
  const parked = parkedVehicles(spec);
  if (parked.length === 1) {
    const only = parked[0]!;
    const how =
      only === "assault" || only === "carrier"
        ? "Fly-in volume behind a three-high pentashield"
        : "Double-height volume behind a two-high garage door";
    y.room("bay", "Vehicle bay", `${how} for a ${PARK_LABELS[only].toLowerCase()}.`);
  } else if (parked.length > 1) {
    y.room(
      "bay",
      "Vehicle hangar",
      "Double-height halls behind two-high garage doors. Smaller craft share a carrier hall; a crawler gets its own well.",
    );
  }
  if (spec.workshop) {
    y.room("shop", "Starter shops", "Fabricators and small refineries. Not the advanced benches.");
  }
  if (spec.storage && spec.storage !== "none") {
    y.room("store", "Storage", "Crates the player can actually build at this stage.");
  }
  if (spec.cistern) y.room("water", "Cistern", "Water tanks under a hatch.");
  if (spec.loft) y.room("loft", "Sleeping loft", "Beds on the upper deck.");
  if (spec.lookout) y.room("look", "Lookout", "Railed roof watch.");

  y.pad(0, 0, w - 1, d - 1);

  const shareFace = parked.length > 0 && spec.entrance === spec.bay;
  const worldStalls =
    parked.length > 0
      ? stallsToWorld(
          w,
          d,
          spec.bay,
          fleetStalls(parked, spec.layout === "hangar", {
            counts: spec.vehicleCounts,
            wrapAlong: spec.bay === "south" || spec.bay === "north" ? w : d,
            wrapDepth: spec.bay === "south" || spec.bay === "north" ? d : w,
            insertShops:
              (spec.workshop || (spec.storage && spec.storage !== "none")) &&
              parked.includes("scout") &&
              !parked.includes("assault") &&
              parked.some((v) => v === "bike" || v === "buggy"),
          }),
          shareFace,
        )
      : [];
  const bay = unionRect(worldStalls.map((s) => s.rect));
  let court = spec.layout === "courtyard" ? courtRect(w, d) : null;
  if (court && bay) court = shrinkCourtFromBay(court, bay, spec.bay);

  const openSky = new Set<string>();
  if (court) {
    for (const k of rectKeys(court)) openSky.add(k);
  }

  for (let s = 0; s <= top; s++) {
    const wallType = spec.lookout && s === top ? "half_wall" : "wall";
    const room = s === 0 ? "live" : spec.loft ? "loft" : spec.lookout && s === top ? "look" : "live";
    y.wallRect(0, 0, w - 1, d - 1, s, wallType, room);
  }

  if (court) {
    y.wallRect(court.x0, court.z0, court.x1, court.z1, 0, "wall", "live");
    if (top >= 1) {
      y.wallRect(court.x0, court.z0, court.x1, court.z1, 1, "half_wall", "look");
    }
  }

  const reserved = new Set<string>(openSky);
  if (bay) {
    for (const k of rectKeys(bay)) reserved.add(k);
  }

  const garageOrigins: { x: number; z: number; rot: Rot; stall: WorldStall; width: number; rise: number }[] =
    [];
  if (worldStalls.length) {
    for (const stall of worldStalls) {
      const alongSpan =
        spec.bay === "south" || spec.bay === "north"
          ? stall.rect.x1 - stall.rect.x0 + 1
          : stall.rect.z1 - stall.rect.z0 + 1;
      const width =
        stall.opening === "pentashield"
          ? Math.min(PENTA_W, Math.max(GARAGE_W, alongSpan))
          : GARAGE_W;
      const rise =
        stall.opening === "pentashield"
          ? Math.max(PENTA_H_MIN, Math.min(stall.rise || PENTA_H, top - stall.story + 1))
          : Math.min(stall.rise || 2, 2);
      const origin = openingOriginFromBay(stall.rect, spec.bay, width);
      garageOrigins.push({ ...origin, stall, width, rise });
      reserved.add(key(origin.x, origin.z));
      const along = garageAlong(origin.rot);
      reserved.add(key(origin.x + along.dx, origin.z + along.dz));
    }
  }

  const doorFace = faceCells(w, d, spec.entrance).filter((c) => !reserved.has(key(c.x, c.z)));
  const doorCell = doorFace.length ? doorFace[centerIndex(doorFace.length, 1)]! : null;
  if (doorCell) reserved.add(key(doorCell.x, doorCell.z));

  if (doorCell && spec.airlock) {
    const inn = inward(spec.entrance);
    reserved.add(key(doorCell.x + inn.dx, doorCell.z + inn.dz));
  }

  if (doorCell) {
    y.replaceEdge(doorCell.x, 0, doorCell.z, doorCell.rot, "door", spec.airlock ? "foyer" : "live");
    if (spec.airlock) {
      y.replaceEdge(doorCell.x, 0, doorCell.z, oppositeRot(doorCell.rot), "passageway", "live");
    }
  }

  for (const origin of garageOrigins) {
    const room = worldStalls.length === 1 ? "bay" : `bay-${origin.stall.vehicle}`;
    if (origin.stall.opening === "pentashield") {
      y.punchPentashield(
        origin.x,
        origin.stall.story,
        origin.z,
        origin.rot,
        origin.width,
        origin.rise,
        room,
      );
    } else {
      y.punchGarage(origin.x, origin.stall.story, origin.z, origin.rot, room);
    }
  }

  if (worldStalls.length) {
    for (const stall of worldStalls) {
      const room = worldStalls.length === 1 ? "bay" : `bay-${stall.vehicle}`;
      if (worldStalls.length > 1) {
        const label =
          stall.shared.length > 1
            ? `${PARK_LABELS[stall.vehicle]} hall`
            : `${PARK_LABELS[stall.vehicle]} stall`;
        const extra =
          stall.shared.length > 1
            ? ` Also parks ${stall.shared
                .slice(1)
                .map((v) => PARK_LABELS[v].toLowerCase())
                .join(", ")}.`
            : "";
        const how =
          stall.opening === "pentashield"
            ? "Fly-in volume behind a vertical pentashield."
            : "Double-height volume behind a two-high garage door.";
        y.room(room, label, `${how}${extra}`);
      }
      const opening = bayInteriorOpening(stall.rect, spec.bay);
      const rise =
        stall.opening === "pentashield"
          ? Math.min(stall.rise || PENTA_H, top - stall.story + 1)
          : stall.rise || 2;
      addRoomWalls(
        y,
        rectKeys(stall.rect),
        w,
        d,
        stall.story,
        Math.min(top, stall.story + Math.max(1, rise) - 1),
        room,
        opening,
      );
    }
  }

  const stair =
    spec.stories > 1 ? pickFree(w, d, reserved, spec.entrance === "south" ? "north" : "south") : null;
  if (stair) reserved.add(key(stair.x, stair.z));

  const cisternCell = spec.cistern
    ? pickFree(w, d, reserved, spec.entrance === "south" ? "north" : "west")
    : null;
  if (cisternCell) reserved.add(key(cisternCell.x, cisternCell.z));

  if (spec.workshop && w >= 6 && d >= 5) {
    const shop = pickShop(w, d, reserved);
    if (shop) {
      for (const k of rectKeys(shop)) reserved.add(k);
      addRoomWalls(y, rectKeys(shop), w, d, 0, 0, "shop", openingTowardCenter(shop, w, d));
    } else {
      const c = pickFree(w, d, reserved, "west");
      const open = openingTowardCenter({ x0: c.x, z0: c.z, x1: c.x, z1: c.z }, w, d);
      y.add("passageway", open.x, 0, open.z, open.rot, "shop");
    }
  }

  const bayKeys = bay ? rectKeys(bay) : new Set<string>();

  for (let s = 1; s <= top; s++) {
    const skip = new Set(openSky);
    if (stair) skip.add(key(stair.x, stair.z));
    if (cisternCell && s === Math.min(1, top)) skip.add(key(cisternCell.x, cisternCell.z));
    for (const stall of worldStalls) {
      const rise =
        stall.opening === "pentashield"
          ? Math.min(stall.rise || PENTA_H, top - stall.story + 1)
          : stall.rise || 2;
      if (s > stall.story && s < stall.story + rise) {
        for (const k of rectKeys(stall.rect)) skip.add(k);
      }
    }
    const room = spec.loft ? "loft" : "live";
    y.deck(s, 0, 0, w - 1, d - 1, skip, "floor", room);
  }

  const skipRoof = new Set(openSky);
  if (stair) skipRoof.add(key(stair.x, stair.z));
  if (cisternCell) skipRoof.add(key(cisternCell.x, cisternCell.z));
  y.deck(top, 0, 0, w - 1, d - 1, skipRoof, "rooftop", spec.lookout ? "look" : "live");

  if (stair && spec.stories > 1) {
    for (let s = 0; s < top; s++) {
      const rot: Rot = stair.z === 0 ? 0 : stair.x === 0 ? 90 : 180;
      y.add("stairs", stair.x, s, stair.z, rot, "live");
    }
    const climbRot = FACE_ROT[spec.entrance === "south" ? "north" : "south"];
    y.add("ladder", stair.x, 0, stair.z, climbRot, "live");
    for (let s = 1; s <= top; s++) {
      y.add("hatch", stair.x, s, stair.z, 0, spec.lookout && s === top ? "look" : "live");
      if (s < top) y.add("ladder", stair.x, s, stair.z, climbRot, "live");
    }
  }

  if (cisternCell) {
    const hy = spec.stories === 1 ? 0 : Math.min(1, top);
    y.add("hatch", cisternCell.x, hy, cisternCell.z, 0, "water");
    y.add(
      "ladder",
      cisternCell.x,
      0,
      cisternCell.z,
      FACE_ROT[spec.entrance === "south" ? "north" : "west"],
      "water",
    );
  }

  const skipWin = new Set<string>();
  if (doorCell) skipWin.add(`${doorCell.x}:${doorCell.z}:${doorCell.rot}`);
  for (const origin of garageOrigins) {
    const along = garageAlong(origin.rot);
    skipWin.add(`${origin.x}:${origin.z}:${origin.rot}`);
    skipWin.add(`${origin.x + along.dx}:${origin.z + along.dz}:${origin.rot}`);
    if (origin.stall.opening === "pentashield") {
      for (let i = 0; i < origin.width; i++) {
        skipWin.add(
          `${origin.x + along.dx * i}:${origin.z + along.dz * i}:${origin.rot}`,
        );
      }
    }
  }

  for (const facing of ["south", "east", "north", "west"] as Facing[]) {
    const cells = faceCells(w, d, facing);
    cells.forEach((c, i) => {
      if (i % 2 === 0) return;
      if (skipWin.has(`${c.x}:${c.z}:${c.rot}`)) return;
      if (bay && spec.layout === "hangar" && inRect(bay, c.x, c.z) && facing === spec.bay) return;
      for (let s = 0; s <= top; s++) {
        if (spec.lookout && s === top) continue;
        let blocked = false;
        for (const stall of worldStalls) {
          const rise = stall.rise || 2;
          if (
            inRect(stall.rect, c.x, c.z) &&
            facing === spec.bay &&
            s >= stall.story &&
            s < stall.story + rise
          ) {
            blocked = true;
          }
        }
        if (blocked) continue;
        const room = s === 0 ? "live" : spec.loft ? "loft" : "live";
        y.replaceEdge(c.x, s, c.z, c.rot, "window", room);
      }
    });
  }

  if (spec.lookout) {
    const railStory = top;
    for (let x = 0; x < w; x++) {
      if (!openSky.has(key(x, 0))) y.add("railing", x, railStory, 0, 180, "look");
      if (!openSky.has(key(x, d - 1))) y.add("railing", x, railStory, d - 1, 0, "look");
    }
    for (let z = 0; z < d; z++) {
      if (!openSky.has(key(0, z))) y.add("railing", 0, railStory, z, 270, "look");
      if (!openSky.has(key(w - 1, z))) y.add("railing", w - 1, railStory, z, 90, "look");
    }
    if (court) {
      for (let x = court.x0; x <= court.x1; x++) {
        y.add("railing", x, Math.min(1, railStory), court.z0, 180, "look");
        y.add("railing", x, Math.min(1, railStory), court.z1, 0, "look");
      }
    }
  }

  const corners: Array<[number, number]> = [
    [0, 0],
    [w - 1, 0],
    [0, d - 1],
    [w - 1, d - 1],
  ];
  for (let s = 0; s <= top; s++) {
    if (spec.lookout && s === top) continue;
    y.columnsAt(corners, s);
  }

  const shopStory = worldStalls.some((s) => s.story >= 3)
    ? 2
    : spec.workshop || (spec.storage && spec.storage !== "none")
      ? Math.min(Math.max(worldStalls.some((s) => s.story >= 2) ? 2 : 0, 0), top)
      : 0;
  if ((spec.workshop || (spec.storage && spec.storage !== "none")) && top >= 0) {
    const voidKeys = new Set<string>();
    for (const stall of worldStalls) {
      const rise = stall.rise || 2;
      if (shopStory >= stall.story && shopStory < stall.story + rise) {
        for (const k of rectKeys(stall.rect)) voidKeys.add(k);
      }
    }
    const rawCells: { x: number; z: number }[] = [];
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        const k = key(x, z);
        if (openSky.has(k) || voidKeys.has(k)) continue;
        if (stair && stair.x === x && stair.z === z) continue;
        if (cisternCell && cisternCell.x === x && cisternCell.z === z) continue;
        rawCells.push({ x, z });
      }
    }
    let cells = orderShopCells(rawCells, w, d);
    if (!cells.length && bay) {
      const back =
        spec.bay === "south"
          ? bay.z0
          : spec.bay === "north"
            ? bay.z1
            : spec.bay === "east"
              ? bay.x0
              : bay.x1;
      for (let x = bay.x0; x <= bay.x1; x++) {
        for (let z = bay.z0; z <= bay.z1; z++) {
          if (spec.bay === "south" || spec.bay === "north") {
            if (z !== back) continue;
          } else if (x !== back) continue;
          if (stair && stair.x === x && stair.z === z) continue;
          cells.push({ x, z });
        }
      }
      cells = orderShopCells(cells, w, d);
    }
    const spots = packStations(cells, spec.workshop, spec.storage ?? "none");
    for (const sp of spots) {
      const room = spec.workshop ? "shop" : "store";
      y.add(sp.type, sp.x, shopStory, sp.z, 0, room);
    }
  }

  return y.settle();
}

export type SpecCheck = { label: string; ok: boolean };

function pieceOnFacing(
  p: { x: number; z: number; rot: Rot },
  facing: Facing,
  b: { minX: number; maxX: number; minZ: number; maxZ: number },
): boolean {
  if (p.rot !== FACE_ROT[facing]) return false;
  if (facing === "south") return p.z === b.maxZ;
  if (facing === "north") return p.z === b.minZ;
  if (facing === "east") return p.x === b.maxX;
  return p.x === b.minX;
}

function garageHasClearance(plan: Plan, garage: { x: number; z: number; rot: Rot }): boolean {
  const along = garageAlong(garage.rot);
  const inn = inward(facingFromRot(garage.rot));
  const cells: Array<[number, number]> = [
    [garage.x, garage.z],
    [garage.x + along.dx, garage.z + along.dz],
    [garage.x + inn.dx, garage.z + inn.dz],
    [garage.x + along.dx + inn.dx, garage.z + along.dz + inn.dz],
  ];
  const floor1 = new Set(
    plan.pieces.filter((p) => p.type === "floor" && p.y === 1).map((p) => key(p.x, p.z)),
  );
  return cells.some(([x, z]) => !floor1.has(key(x, z)));
}

function hasDoubleHeightBay(plan: Plan, spec: BriefSpec): boolean {
  const parked = parkedVehicles(spec);
  if (!parked.length) return true;
  const needsGarage = parked.some(
    (v) =>
      v === "bike" ||
      v === "buggy" ||
      v === "crawler" ||
      (v === "scout" && !parked.includes("assault") && !parked.includes("carrier")),
  );
  const garages = plan.pieces.filter((p) => p.type === "garage_door");
  if (!needsGarage) return true;
  if (!garages.length) return false;
  return garages.every((g) => garageHasClearance(plan, g));
}

export function specChecks(plan: Plan, raw: BriefSpec): SpecCheck[] {
  const spec = normalizeSpec(raw);
  const { w, d } = padDims(spec);
  const b = boundsOf(plan);
  const counts = countPieces(plan);
  const padW = b.maxX - b.minX + 1;
  const padD = b.maxZ - b.minZ + 1;
  const door = plan.pieces.find((p) => p.type === "door");
  const garage = plan.pieces.find((p) => p.type === "garage_door");
  const hasGarage = Boolean(garage);

  const roofs = new Set(
    plan.pieces
      .filter((p) => p.type === "rooftop" || p.type === "floor")
      .map((p) => key(p.x, p.z)),
  );
  const innerOpen =
    spec.layout !== "courtyard" ||
    plan.pieces.some(
      (p) =>
        p.type === "foundation" &&
        p.x > b.minX &&
        p.x < b.maxX &&
        p.z > b.minZ &&
        p.z < b.maxZ &&
        !roofs.has(key(p.x, p.z)),
    );

  const checks: SpecCheck[] = [
    { label: `${w}×${d} pad`, ok: padW === w && padD === d },
    {
      label: `${spec.stories} stor${spec.stories === 1 ? "y" : "ies"}`,
      ok: spec.stories === 1 ? b.maxY === 0 : b.maxY >= spec.stories - 1,
    },
    {
      label: `${spec.entrance} people door`,
      ok: Boolean(door && pieceOnFacing(door, spec.entrance, b)),
    },
  ];
  if (spec.airlock) {
    checks.push({
      label: "Airlock (door + passageway)",
      ok: (counts.door ?? 0) >= 1 && (counts.passageway ?? 0) >= 1,
    });
  }
  const parked = parkedVehicles(spec);
  const needsGarage = parked.some(
    (v) =>
      v === "bike" ||
      v === "buggy" ||
      v === "crawler" ||
      (v === "scout" && !parked.includes("assault") && !parked.includes("carrier")),
  );
  const needsPenta = parked.includes("carrier") || parked.includes("assault");
  const pentas = plan.pieces.filter((p) => p.type === "pentashield");
  if (parked.length) {
    if (needsGarage) {
      const garages = plan.pieces.filter((p) => p.type === "garage_door");
      checks.push({
        label: `Two-high garage on ${spec.bay}`,
        ok: garages.length >= 1 && garages.every((g) => pieceOnFacing(g, spec.bay, b)),
      });
      checks.push({
        label: "Double-height vehicle bay",
        ok: hasDoubleHeightBay(plan, spec),
      });
    }
    if (needsPenta) {
      checks.push({
        label: `Pentashield on ${spec.bay}`,
        ok: pentas.length >= 1 && pentas.every((p) => pieceOnFacing(p, spec.bay, b)),
      });
      checks.push({
        label: "Carrier opening is not a garage door",
        ok: needsGarage || !hasGarage,
      });
    }
    if (needsPenta && parked.includes("crawler")) {
      const garage = plan.pieces.find((p) => p.type === "garage_door");
      const penta = pentas[0];
      checks.push({
        label: "Carrier hangar above crawler garage",
        ok: Boolean(garage && penta && penta.y > garage.y),
      });
    }
  } else {
    checks.push({ label: "No garage door", ok: !hasGarage });
  }
  if (spec.workshop) {
    const shops = plan.pieces.some(
      (p) =>
        p.type === "fabricator" ||
        p.type === "vehicle_fabricator" ||
        p.type === "small_ore" ||
        p.room === "shop",
    );
    checks.push({
      label: "Starter shops",
      ok: shops || (counts.passageway ?? 0) >= (spec.airlock ? 2 : 1),
    });
  }
  if (spec.storage && spec.storage !== "none") {
    checks.push({
      label: "Storage crates",
      ok: plan.pieces.some(
        (p) =>
          p.type === "chest" ||
          p.type === "small_storage" ||
          p.type === "storage_container" ||
          p.type === "medium_storage",
      ),
    });
  }
  if (parked.includes("assault")) {
    const penta = pentas[0];
    checks.push({
      label: "Assault hangar is three stories",
      ok: Boolean(penta && (penta.rise ?? 0) >= 3),
    });
  }
  if (spec.cistern) {
    checks.push({ label: "Cistern hatch", ok: (counts.hatch ?? 0) >= 1 });
  }
  if (spec.stories > 1) {
    checks.push({
      label: "Stairs between stories",
      ok: (counts.stairs ?? 0) >= spec.stories - 1,
    });
  }
  if (spec.lookout) {
    checks.push({ label: "Roof rails", ok: (counts.railing ?? 0) >= 4 });
  }
  if (spec.layout === "courtyard") {
    checks.push({ label: "Open courtyard", ok: innerOpen });
  }
  return checks;
}
