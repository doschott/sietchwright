import type { Rot } from "./grid.ts";

/** Conservative interior span vs the ~9-cell foundation rule. */
export const SUPPORT_SPAN = 5;

export type SupportPost = {
  x: number;
  z: number;
  rot: Rot;
  kind: "corner" | "center";
};

/** Outer-vertex rotation so a Corner Column sits in the wall corner, not the room. */
export function outerCornerRot(x: number, z: number, w: number, d: number): Rot {
  const west = x <= 0;
  const south = z <= 0;
  const east = x >= w - 1;
  const north = z >= d - 1;
  if (west && south) return 0;
  if (east && south) return 90;
  if (east && north) return 180;
  return 270;
}

/**
 * Posts for one story. Four Corner Columns always. Pads 8+ get Center Columns
 * on an interior grid so long halls still have something under the floor.
 */
export function supportPosts(w: number, d: number): SupportPost[] {
  const out: SupportPost[] = [];
  const seen = new Set<string>();
  const add = (p: SupportPost) => {
    const k = `${p.kind}:${p.x},${p.z}`;
    if (seen.has(k)) return;
    if (p.x < 0 || p.z < 0 || p.x >= w || p.z >= d) return;
    seen.add(k);
    out.push(p);
  };

  add({ x: 0, z: 0, rot: 0, kind: "corner" });
  add({ x: w - 1, z: 0, rot: 90, kind: "corner" });
  add({ x: w - 1, z: d - 1, rot: 180, kind: "corner" });
  add({ x: 0, z: d - 1, rot: 270, kind: "corner" });

  if (w >= 8 || d >= 8) {
    for (let x = SUPPORT_SPAN; x < w - 1; x += SUPPORT_SPAN) {
      for (let z = SUPPORT_SPAN; z < d - 1; z += SUPPORT_SPAN) {
        add({ x, z, rot: 0, kind: "center" });
      }
    }
  }
  return out;
}

export function cornerOffset(rot: Rot): { dx: number; dz: number } {
  if (rot === 0) return { dx: 0.08, dz: 0.08 };
  if (rot === 90) return { dx: 0.92, dz: 0.08 };
  if (rot === 180) return { dx: 0.92, dz: 0.92 };
  return { dx: 0.08, dz: 0.92 };
}
