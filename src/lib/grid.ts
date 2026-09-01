export const FOUND_H = 0.16;
export const WALL_H = 1.08;
export const WALL_T = 0.11;
export const FLOOR_H = 0.08;
export const ROOF_H = 0.07;

/** New CHOAM garage door: two cells along the wall, two stories tall. */
export const GARAGE_W = 2;
export const GARAGE_H = 2;

/** Top of the walkable deck at a given story (0 = foundation top). */
export function deckY(story: number): number {
  if (story <= 0) return FOUND_H;
  return FOUND_H + story * (WALL_H + FLOOR_H);
}

export function wallCenterY(story: number): number {
  return deckY(story) + WALL_H / 2;
}

export function floorCenterY(story: number): number {
  return deckY(story) - FLOOR_H / 2;
}

export function roofCenterY(story: number): number {
  return deckY(story) + WALL_H + ROOF_H / 2;
}

/** Full height of a two-story garage door, including the floor band between stories. */
export function garageHeight(): number {
  return WALL_H * GARAGE_H + FLOOR_H * (GARAGE_H - 1);
}

export function garageCenterY(story: number): number {
  return deckY(story) + garageHeight() / 2;
}

export type Rot = 0 | 90 | 180 | 270;

export const ROTS: Rot[] = [0, 90, 180, 270];

export function nextRot(r: Rot): Rot {
  return ((r + 90) % 360) as Rot;
}

/** Wall/door sits on a cell edge. rot 0 = south (+Z) face of the cell. */
export function edgeWorld(x: number, z: number, rot: Rot): [number, number] {
  const cx = x + 0.5;
  const cz = z + 0.5;
  switch (rot) {
    case 0:
      return [cx, z + 1 - WALL_T / 2];
    case 90:
      return [x + 1 - WALL_T / 2, cz];
    case 180:
      return [cx, z + WALL_T / 2];
    case 270:
      return [x + WALL_T / 2, cz];
  }
}

/** Canonical key so south-of-A and north-of-B collapse to one edge. */
export function edgeKey(story: number, x: number, z: number, rot: Rot): string {
  if (rot === 0) return `h:${story}:${x}:${z + 1}`;
  if (rot === 180) return `h:${story}:${x}:${z}`;
  if (rot === 90) return `v:${story}:${x + 1}:${z}`;
  return `v:${story}:${x}:${z}`;
}

export function cellKey(story: number, x: number, z: number): string {
  return `c:${story}:${x}:${z}`;
}

export function yaw(rot: Rot): number {
  return (rot * Math.PI) / 180;
}

/** Along-wall step for a garage door origin (toward +X or +Z). */
export function garageAlong(rot: Rot): { dx: 0 | 1; dz: 0 | 1 } {
  if (rot === 0 || rot === 180) return { dx: 1, dz: 0 };
  return { dx: 0, dz: 1 };
}

export type EdgeCell = { x: number; y: number; z: number; rot: Rot };

/** Wall slots covered by a two-wide, two-high garage door. */
export function garageCells(
  x: number,
  y: number,
  z: number,
  rot: Rot,
): EdgeCell[] {
  const { dx, dz } = garageAlong(rot);
  const out: EdgeCell[] = [];
  for (let s = 0; s < GARAGE_H; s++) {
    for (let i = 0; i < GARAGE_W; i++) {
      out.push({ x: x + dx * i, y: y + s, z: z + dz * i, rot });
    }
  }
  return out;
}

export function garageEdgeKeys(
  x: number,
  y: number,
  z: number,
  rot: Rot,
): string[] {
  return garageCells(x, y, z, rot).map((c) => edgeKey(c.y, c.x, c.z, c.rot));
}

export function garageFootprint(
  x: number,
  z: number,
  rot: Rot,
): Array<[number, number]> {
  const { dx, dz } = garageAlong(rot);
  return [
    [x, z],
    [x + dx, z + dz],
  ];
}
