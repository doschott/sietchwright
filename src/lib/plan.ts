import type { Rot } from "./grid.ts";
import type { PieceType } from "./pieces.ts";

export type RoomId = string;

export type Room = {
  id: RoomId;
  name: string;
  purpose: string;
};

export type PlacedPiece = {
  id: string;
  type: PieceType;
  x: number;
  y: number;
  z: number;
  rot: Rot;
  room?: RoomId;
  /** Cells along the wall for spanning openings (garage default 2, pentashield 4). */
  along?: number;
  /** Stories tall for spanning openings (garage default 2, pentashield 2 or 3). */
  rise?: number;
};

export type Plan = {
  version: 1;
  name: string;
  brief: string;
  tips: string[];
  rooms: Room[];
  pieces: PlacedPiece[];
  source: "ai" | "local" | "hand";
};

export function emptyPlan(brief = ""): Plan {
  return {
    version: 1,
    name: "Empty yard",
    brief,
    tips: [],
    rooms: [],
    pieces: [],
    source: "hand",
  };
}

export type Bounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY: number;
  cx: number;
  cz: number;
};

export function boundsOf(plan: Plan): Bounds {
  if (plan.pieces.length === 0) {
    return { minX: 0, maxX: 4, minZ: 0, maxZ: 4, maxY: 0, cx: 2, cz: 2 };
  }
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity,
    maxY = 0;
  for (const p of plan.pieces) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
    maxY = Math.max(maxY, p.y);
  }
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    maxY,
    cx: (minX + maxX + 1) / 2,
    cz: (minZ + maxZ + 1) / 2,
  };
}

export function countPieces(plan: Plan): Record<PieceType, number> {
  const counts = {} as Record<PieceType, number>;
  for (const p of plan.pieces) {
    counts[p.type] = (counts[p.type] ?? 0) + 1;
  }
  return counts;
}
