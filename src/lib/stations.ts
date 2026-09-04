import type { PieceType } from "./pieces.ts";

export const STORAGE_IDS = ["none", "chest", "small", "container", "medium"] as const;
export type StorageId = (typeof STORAGE_IDS)[number];

export const STORAGE_OPTS: { id: StorageId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "chest", label: "Chests" },
  { id: "small", label: "Small containers" },
  { id: "container", label: "Storage containers" },
  { id: "medium", label: "Medium containers" },
];

export function isStorage(v: unknown): v is StorageId {
  return (STORAGE_IDS as readonly string[]).includes(v as string);
}

/** Starter shops a new player actually unlocks. Not advanced fabs. */
export const STARTER_STATIONS: { type: PieceType; name: string }[] = [
  { type: "fabricator", name: "Fabricator" },
  { type: "vehicle_fabricator", name: "Vehicle Fabricator" },
  { type: "weapons_fabricator", name: "Weapons Fabricator" },
  { type: "survival_fabricator", name: "Survival Fabricator" },
  { type: "garment_fabricator", name: "Garment Fabricator" },
  { type: "small_chemical", name: "Small Chemical Refinery" },
  { type: "small_ore", name: "Small Ore Refinery" },
];

const STORAGE_PIECE: Record<Exclude<StorageId, "none">, PieceType> = {
  chest: "chest",
  small: "small_storage",
  container: "storage_container",
  medium: "medium_storage",
};

function storageCount(id: StorageId, cells: number): number {
  if (id === "none") return 0;
  if (id === "chest") return Math.max(4, Math.min(10, Math.round(cells * 0.45)));
  if (id === "small") return Math.max(4, Math.min(12, Math.round(cells * 0.55)));
  if (id === "container") return Math.max(2, Math.min(6, Math.round(cells * 0.22)));
  return Math.max(1, Math.min(3, Math.round(cells * 0.12)));
}

export type StationSpot = { type: PieceType; x: number; z: number };

/** Pack shops then storage onto free cells. Prefer walls (edges of the list). */
export function packStations(
  cells: { x: number; z: number }[],
  workshop: boolean,
  storage: StorageId,
): StationSpot[] {
  if (!cells.length) return [];
  const want: PieceType[] = [];
  if (workshop) {
    for (const s of STARTER_STATIONS) want.push(s.type);
  }
  if (storage !== "none") {
    const n = storageCount(storage, cells.length);
    const t = STORAGE_PIECE[storage];
    for (let i = 0; i < n; i++) want.push(t);
  }
  const out: StationSpot[] = [];
  for (let i = 0; i < want.length && i < cells.length; i++) {
    const c = cells[i]!;
    out.push({ type: want[i]!, x: c.x, z: c.z });
  }
  return out;
}

/** Sort so edge cells fill first (along the walls), then inward. */
export function orderShopCells(
  cells: { x: number; z: number }[],
  w: number,
  d: number,
): { x: number; z: number }[] {
  return [...cells].sort((a, b) => {
    const ae = Number(a.x === 0 || a.x === w - 1 || a.z === 0 || a.z === d - 1);
    const be = Number(b.x === 0 || b.x === w - 1 || b.z === 0 || b.z === d - 1);
    if (ae !== be) return be - ae;
    if (a.z !== b.z) return a.z - b.z;
    return a.x - b.x;
  });
}
