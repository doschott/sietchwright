import type { PieceType } from "./pieces.ts";
import type { Bounds } from "./plan.ts";

const ENVELOPE_TYPES = new Set<PieceType>([
  "wall",
  "half_wall",
  "door",
  "window",
  "passageway",
  "garage_door",
  "pentashield",
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

/** Outer walls and floor slabs ghost so every story reads, not only the top deck. */
export function pieceGhostInCutaway(
  piece: { type: PieceType; x: number; z: number; rot: number },
  b: Bounds,
): boolean {
  if (piece.type === "floor") return true;
  if (!ENVELOPE_TYPES.has(piece.type)) return false;
  if (piece.rot === 0 && piece.z === b.maxZ) return true;
  if (piece.rot === 180 && piece.z === b.minZ) return true;
  if (piece.rot === 90 && piece.x === b.maxX) return true;
  if (piece.rot === 270 && piece.x === b.minX) return true;
  return false;
}

/**
 * Material flags for Inside view. Applied as R3F material props, not a
 * post-pass `instanceof THREE.Mesh` walk (duplicate Three copies miss that).
 */
export function cutawayGhostStyle(
  ghost: boolean,
  type: PieceType,
): { transparent: boolean; opacity: number; depthWrite: boolean } {
  if (!ghost) return { transparent: false, opacity: 1, depthWrite: true };
  return {
    transparent: true,
    opacity: type === "floor" ? 0.07 : 0.18,
    depthWrite: false,
  };
}
