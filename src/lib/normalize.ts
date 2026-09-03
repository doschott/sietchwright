import {
  edgeKey,
  garageEdgeKeys,
  garageFootprint,
  pentaEdgeKeys,
  pentaFootprint,
  ROTS,
  type Rot,
} from "./grid";
import {
  EDGE_PRIORITY,
  isPieceType,
  isSpanOpening,
  type PieceType,
} from "./pieces";
import type { Plan, PlacedPiece, Room } from "./plan";

const WALL_SLOT: PieceType[] = [
  "door",
  "passageway",
  "window",
  "wall",
  "half_wall",
];

function asRot(v: unknown): Rot {
  const n = Number(v);
  if (n === 90 || n === 180 || n === 270) return n;
  return 0;
}

function asInt(v: unknown, min: number, max: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

export function normalizePlan(
  raw: unknown,
  fallbackBrief: string,
  source: Plan["source"],
): Plan {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const roomsIn = Array.isArray(obj.rooms) ? obj.rooms : [];
  const rooms: Room[] = [];
  const roomIds = new Set<string>();
  for (const r of roomsIn) {
    if (!r || typeof r !== "object") continue;
    const rec = r as Record<string, unknown>;
    const id = String(rec.id ?? rec.name ?? "").trim().slice(0, 32);
    if (!id || roomIds.has(id)) continue;
    roomIds.add(id);
    rooms.push({
      id,
      name: String(rec.name ?? id).trim().slice(0, 40),
      purpose: String(rec.purpose ?? "").trim().slice(0, 140),
    });
  }

  const piecesIn = Array.isArray(obj.pieces) ? obj.pieces : [];
  const pieces: PlacedPiece[] = [];
  let i = 0;
  for (const p of piecesIn) {
    if (!p || typeof p !== "object") continue;
    const rec = p as Record<string, unknown>;
    const type = rec.t ?? rec.type;
    if (!isPieceType(type)) continue;
    const x = asInt(rec.x, -80, 80);
    const yMax = type === "pentashield" ? 6 : type === "garage_door" ? 2 : 8;
    const y = asInt(rec.y, 0, yMax);
    const z = asInt(rec.z, -80, 80);
    const rot = asRot(rec.r ?? rec.rot);
    const roomRaw = rec.room ? String(rec.room).slice(0, 32) : undefined;
    const room = roomRaw && roomIds.has(roomRaw) ? roomRaw : undefined;
    const alongRaw = rec.along != null ? asInt(rec.along, 1, 8) : undefined;
    const riseRaw = rec.rise != null ? asInt(rec.rise, 1, 6) : undefined;
    pieces.push({
      id: String(rec.id ?? `${type}-${i++}`),
      type,
      x,
      y,
      z,
      rot,
      room,
      along: alongRaw,
      rise: riseRaw,
    });
    if (pieces.length >= 8000) break;
  }

  const plan: Plan = {
    version: 1,
    name: String(obj.name ?? "Sietch").trim().slice(0, 48) || "Sietch",
    brief: String(obj.brief ?? fallbackBrief).trim().slice(0, 400),
    tips: Array.isArray(obj.tips)
      ? obj.tips
          .map((t) => String(t).trim().slice(0, 180))
          .filter(Boolean)
          .slice(0, 8)
      : [],
    rooms,
    pieces,
    source,
  };
  return dedupePlan(ensureFoundations(plan));
}

export function ensureFoundations(plan: Plan): Plan {
  const have = new Set(
    plan.pieces
      .filter((p) => p.type === "foundation")
      .map((p) => `${p.x},${p.z}`),
  );
  const extra: PlacedPiece[] = [];
  for (const p of plan.pieces) {
    const cells =
      p.type === "pentashield"
        ? pentaFootprint(p.x, p.z, p.rot, p.along)
        : p.type === "garage_door"
          ? garageFootprint(p.x, p.z, p.rot)
          : ([[p.x, p.z]] as Array<[number, number]>);
    for (const [x, z] of cells) {
      const k = `${x},${z}`;
      if (have.has(k)) continue;
      have.add(k);
      extra.push({
        id: `foundation-auto-${k}`,
        type: "foundation",
        x,
        y: 0,
        z,
        rot: 0,
      });
    }
  }
  return extra.length ? { ...plan, pieces: [...extra, ...plan.pieces] } : plan;
}

export function dedupePlan(plan: Plan): Plan {
  const spans: PlacedPiece[] = [];
  const spanKeys = new Set<string>();
  for (const p of plan.pieces) {
    if (!isSpanOpening(p.type)) continue;
    const keys =
      p.type === "pentashield"
        ? pentaEdgeKeys(p.x, p.y, p.z, p.rot, p.along, p.rise)
        : garageEdgeKeys(p.x, p.y, p.z, p.rot);
    const overlap = keys.some((k) => spanKeys.has(k));
    if (overlap) continue;
    spans.push(p);
    for (const k of keys) spanKeys.add(k);
  }

  const wallSlot = new Map<string, PlacedPiece>();
  const railSlot = new Map<string, PlacedPiece>();
  const ladderSlot = new Map<string, PlacedPiece>();
  const padSlot = new Map<string, PlacedPiece>();
  const other: PlacedPiece[] = [];

  for (const p of plan.pieces) {
    if (isSpanOpening(p.type)) continue;
    if (WALL_SLOT.includes(p.type)) {
      const k = edgeKey(p.y, p.x, p.z, p.rot);
      if (spanKeys.has(k)) continue;
      const prev = wallSlot.get(k);
      if (!prev) wallSlot.set(k, p);
      else {
        const a = EDGE_PRIORITY.indexOf(p.type);
        const b = EDGE_PRIORITY.indexOf(prev.type);
        if (a < b) wallSlot.set(k, p);
      }
      continue;
    }
    if (p.type === "railing") {
      const k = edgeKey(p.y, p.x, p.z, p.rot);
      if (spanKeys.has(k)) continue;
      railSlot.set(k, p);
      continue;
    }
    if (p.type === "ladder") {
      const k = edgeKey(p.y, p.x, p.z, p.rot);
      if (spanKeys.has(k)) continue;
      ladderSlot.set(k, p);
      continue;
    }
    if (
      p.type === "foundation" ||
      p.type === "floor" ||
      p.type === "rooftop" ||
      p.type === "hatch"
    ) {
      const k = `${p.type}:${p.y}:${p.x}:${p.z}`;
      if (!padSlot.has(k)) padSlot.set(k, p);
      continue;
    }
    other.push(p);
  }

  const floors = [...padSlot.values()].filter((p) => p.type === "floor");
  const roofs = [...padSlot.values()].filter((p) => p.type === "rooftop");
  const hatches = [...padSlot.values()].filter((p) => p.type === "hatch");
  const foundations = [...padSlot.values()].filter((p) => p.type === "foundation");
  const floorKeys = new Set(floors.map((p) => `${p.y}:${p.x}:${p.z}`));
  const hatchKeys = new Set(hatches.map((p) => `${p.y}:${p.x}:${p.z}`));
  const floorsKept = floors.filter((p) => !hatchKeys.has(`${p.y}:${p.x}:${p.z}`));
  const roofsKept = roofs.filter((p) => {
    const k = `${p.y}:${p.x}:${p.z}`;
    if (!hatchKeys.has(k)) return true;
    return floorKeys.has(k);
  });

  return {
    ...plan,
    pieces: [
      ...foundations,
      ...floorsKept,
      ...roofsKept,
      ...hatches,
      ...spans,
      ...wallSlot.values(),
      ...railSlot.values(),
      ...ladderSlot.values(),
      ...other,
    ],
  };
}

export function rotatePiece(p: PlacedPiece): PlacedPiece {
  const i = ROTS.indexOf(p.rot);
  return { ...p, rot: ROTS[(i + 1) % 4] ?? 0 };
}

export function parseJsonObject(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON in model output");
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}
