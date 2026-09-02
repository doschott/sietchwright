import type { Bounds } from "./plan.ts";

export type ViewId = "iso" | "top" | "south";
export type ZoomAction = "in" | "out" | "fit";

export const MIN_DISTANCE = 5;
export const MAX_DISTANCE = 48;
export const ZOOM_IN = 0.82;
export const ZOOM_OUT = 1.22;

export function clampDistance(n: number): number {
  return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, n));
}

/** Default camera position for a view, aimed at the yard center. */
export function framedPosition(
  view: ViewId,
  b: Bounds,
  distanceScale = 1,
): [number, number, number] {
  const s = clampDistance(12 * distanceScale) / 12;
  const tx = b.cx;
  const tz = b.cz;
  if (view === "top") return [tx, 16 * s, tz + 0.18];
  if (view === "south") return [tx, Math.max(2.4, 3.1 * s), b.maxZ + 11 * s];
  return [tx + 9 * s, 7.6 * s, tz + 12 * s];
}

export function scaleOffset(
  dx: number,
  dy: number,
  dz: number,
  factor: number,
): { x: number; y: number; z: number; length: number } {
  const x = dx * factor;
  const y = dy * factor;
  const z = dz * factor;
  const length = Math.hypot(x, y, z);
  return { x, y, z, length };
}

/** Compass widget rotation in radians. 0 = N points up (camera is south of the pad). */
export function compassYaw(
  camX: number,
  camZ: number,
  targetX: number,
  targetZ: number,
): number {
  return Math.atan2(camX - targetX, camZ - targetZ);
}

export function zoomOffset(
  dx: number,
  dy: number,
  dz: number,
  action: Exclude<ZoomAction, "fit">,
): { x: number; y: number; z: number } {
  const factor = action === "in" ? ZOOM_IN : ZOOM_OUT;
  const next = scaleOffset(dx, dy, dz, factor);
  const length = clampDistance(next.length || MIN_DISTANCE);
  const k = length / (next.length || 1);
  return { x: next.x * k, y: next.y * k, z: next.z * k };
}
