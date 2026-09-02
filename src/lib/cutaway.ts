import type { PieceType } from "./pieces.ts";
import type { Bounds } from "./plan.ts";

const ENVELOPE_TYPES = new Set<PieceType>([
  "wall",
  "half_wall",
  "door",
  "window",
  "passageway",
  "garage_door",
]);

/** Roof and rails hide in Inside view so rooms read as a dollhouse. */
export function pieceHiddenInCutaway(
  type: PieceType,
  hatchAsRoof: boolean,
): boolean {
  if (type === "rooftop" || type === "railing") return true;
  if (type === "hatch" && hatchAsRoof) return true;
  return false;
}

/** Outer walls ghost so workshop, bay, and stairs stay solid. */
export function pieceGhostInCutaway(
  piece: { type: PieceType; x: number; z: number; rot: number },
  b: Bounds,
): boolean {
  if (!ENVELOPE_TYPES.has(piece.type)) return false;
  if (piece.rot === 0 && piece.z === b.maxZ) return true;
  if (piece.rot === 180 && piece.z === b.minZ) return true;
  if (piece.rot === 90 && piece.x === b.maxX) return true;
  if (piece.rot === 270 && piece.x === b.minX) return true;
  return false;
}
