import { edgeKey, garageEdgeKeys, garageFootprint, type Rot } from "./grid.ts";
import { EDGE_PRIORITY, isEdgeType, type PieceType } from "./pieces.ts";
import type { Plan, PlacedPiece, Room } from "./plan.ts";

let seq = 0;
function nid(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq.toString(36)}`;
}

export class Yard {
  name = "Sietch";
  brief = "";
  tips: string[] = [];
  rooms: Room[] = [];
  pieces: PlacedPiece[] = [];
  source: Plan["source"] = "local";

  room(id: string, name: string, purpose: string): this {
    this.rooms.push({ id, name, purpose });
    return this;
  }

  add(
    type: PieceType,
    x: number,
    y: number,
    z: number,
    rot: Rot = 0,
    room?: string,
  ): this {
    this.pieces.push({
      id: nid(type),
      type,
      x,
      y,
      z,
      rot,
      room,
    });
    return this;
  }

  pad(x0: number, z0: number, x1: number, z1: number, room?: string): this {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        this.add("foundation", x, 0, z, 0, room);
      }
    }
    return this;
  }

  deck(
    story: number,
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    skip: Set<string> | null,
    type: "floor" | "rooftop" | "hatch",
    room?: string,
  ): this {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        if (skip?.has(`${x},${z}`)) continue;
        this.add(type, x, story, z, 0, room);
      }
    }
    return this;
  }

  /** Outer walls around inclusive cell rectangle. */
  wallRect(
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    story: number,
    type: PieceType = "wall",
    room?: string,
  ): this {
    for (let x = x0; x <= x1; x++) {
      this.add(type, x, story, z1, 0, room);
      this.add(type, x, story, z0, 180, room);
    }
    for (let z = z0; z <= z1; z++) {
      this.add(type, x1, story, z, 90, room);
      this.add(type, x0, story, z, 270, room);
    }
    return this;
  }

  replaceEdge(
    x: number,
    y: number,
    z: number,
    rot: Rot,
    type: PieceType,
    room?: string,
  ): this {
    const key = edgeKey(y, x, z, rot);
    this.pieces = this.pieces.filter(
      (p) => !(isEdgeType(p.type) && p.type !== "garage_door" && edgeKey(p.y, p.x, p.z, p.rot) === key),
    );
    this.add(type, x, y, z, rot, room);
    return this;
  }

  /** Two-wide, two-high garage door. Origin is the −X/−Z cell on the bottom story. */
  punchGarage(
    x: number,
    y: number,
    z: number,
    rot: Rot,
    room?: string,
  ): this {
    const keys = new Set(garageEdgeKeys(x, y, z, rot));
    this.pieces = this.pieces.filter((p) => {
      if (p.type === "garage_door") return true;
      if (!isEdgeType(p.type)) return true;
      return !keys.has(edgeKey(p.y, p.x, p.z, p.rot));
    });
    this.add("garage_door", x, y, z, rot, room);
    return this;
  }

  columnsAt(
    cells: Array<[number, number]>,
    story: number,
    room?: string,
  ): this {
    for (const [x, z] of cells) {
      this.add("center_column", x, story, z, 0, room);
    }
    return this;
  }

  settle(): Plan {
    const garages: PlacedPiece[] = [];
    const garageKeys = new Set<string>();
    for (const p of this.pieces) {
      if (p.type !== "garage_door") continue;
      const keys = garageEdgeKeys(p.x, p.y, p.z, p.rot);
      if (keys.some((k) => garageKeys.has(k))) continue;
      garages.push(p);
      for (const k of keys) garageKeys.add(k);
    }

    const seenPad = new Set<string>();
    const edgeBest = new Map<string, PlacedPiece>();
    const railBest = new Map<string, PlacedPiece>();
    const rest: PlacedPiece[] = [];

    for (const p of this.pieces) {
      if (p.type === "garage_door") continue;
      if (p.type === "foundation" || p.type === "floor" || p.type === "rooftop") {
        const k = `${p.type}:${p.y}:${p.x}:${p.z}`;
        if (seenPad.has(k)) continue;
        seenPad.add(k);
        rest.push(p);
        continue;
      }
      if (p.type === "railing") {
        const k = edgeKey(p.y, p.x, p.z, p.rot);
        if (garageKeys.has(k)) continue;
        railBest.set(k, p);
        continue;
      }
      if (isEdgeType(p.type)) {
        const k = edgeKey(p.y, p.x, p.z, p.rot);
        if (garageKeys.has(k)) continue;
        const prev = edgeBest.get(k);
        if (!prev) {
          edgeBest.set(k, p);
        } else {
          const a = EDGE_PRIORITY.indexOf(p.type);
          const b = EDGE_PRIORITY.indexOf(prev.type);
          if (a !== -1 && (b === -1 || a < b)) edgeBest.set(k, p);
        }
        continue;
      }
      rest.push(p);
    }

    const pads = new Set<string>();
    for (const p of rest) {
      if (p.type === "foundation") pads.add(`${p.x},${p.z}`);
    }
    const extras: PlacedPiece[] = [];
    const needPad = [...rest, ...garages, ...edgeBest.values(), ...railBest.values()];
    for (const p of needPad) {
      const cells =
        p.type === "garage_door"
          ? garageFootprint(p.x, p.z, p.rot)
          : ([[p.x, p.z]] as Array<[number, number]>);
      for (const [x, z] of cells) {
        if (p.y === 0 && !pads.has(`${x},${z}`)) {
          pads.add(`${x},${z}`);
          extras.push({
            id: nid("foundation"),
            type: "foundation",
            x,
            y: 0,
            z,
            rot: 0,
          });
        }
      }
    }

    return {
      version: 1,
      name: this.name,
      brief: this.brief,
      tips: this.tips,
      rooms: this.rooms,
      pieces: [...extras, ...rest, ...garages, ...edgeBest.values(), ...railBest.values()],
      source: this.source,
    };
  }
}

export function skipSet(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
): Set<string> {
  const s = new Set<string>();
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) s.add(`${x},${z}`);
  }
  return s;
}
