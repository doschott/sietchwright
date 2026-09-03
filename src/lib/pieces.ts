export const PIECE_TYPES = [
  "foundation",
  "floor",
  "wall",
  "half_wall",
  "door",
  "window",
  "passageway",
  "garage_door",
  "pentashield",
  "stairs",
  "ramp",
  "rooftop",
  "hatch",
  "center_column",
  "corner_column",
  "railing",
  "ladder",
] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

export type PieceKind =
  | "pad"
  | "deck"
  | "edge"
  | "rise"
  | "cap"
  | "post"
  | "climb";

export type PieceDef = {
  type: PieceType;
  code: string;
  name: string;
  inGame: string;
  hint: string;
  kind: PieceKind;
  granite: number;
  /** Marker plate color (3D + legend). */
  marker: string;
  /** Body stone color. */
  stone: string;
  letter: string;
};

export const PIECES: Record<PieceType, PieceDef> = {
  foundation: {
    type: "foundation",
    code: "FD",
    name: "Foundation",
    inGame: "Foundation",
    hint: "Ground pad. Place first. Any set's Foundation snaps here.",
    kind: "pad",
    granite: 15,
    marker: "#5c4634",
    stone: "#6b5340",
    letter: "F",
  },
  floor: {
    type: "floor",
    code: "FL",
    name: "Floor",
    inGame: "Floor",
    hint: "Upper deck. Sits on walls or columns of the story below.",
    kind: "deck",
    granite: 10,
    marker: "#8a7358",
    stone: "#9a8164",
    letter: "L",
  },
  wall: {
    type: "wall",
    code: "WL",
    name: "Wall",
    inGame: "Wall",
    hint: "Full-height enclosure on a cell edge. Swap in any faction Wall.",
    kind: "edge",
    granite: 10,
    marker: "#c4b49a",
    stone: "#cfc0a6",
    letter: "W",
  },
  half_wall: {
    type: "half_wall",
    code: "HW",
    name: "Half Wall",
    inGame: "Half Wall",
    hint: "Waist-high parapet. Use on roofs, balconies, and courtyards.",
    kind: "edge",
    granite: 10,
    marker: "#b09a7c",
    stone: "#bba688",
    letter: "H",
  },
  door: {
    type: "door",
    code: "DR",
    name: "Door",
    inGame: "Door",
    hint: "Wall slot with a person-sized door. Pedestrian airlocks, not vehicles.",
    kind: "edge",
    granite: 17,
    marker: "#3d4a52",
    stone: "#cfc0a6",
    letter: "D",
  },
  window: {
    type: "window",
    code: "WN",
    name: "Window",
    inGame: "Window",
    hint: "Wall slot with a window. Any set's Window fits this opening.",
    kind: "edge",
    granite: 10,
    marker: "#4a5560",
    stone: "#cfc0a6",
    letter: "N",
  },
  passageway: {
    type: "passageway",
    code: "PS",
    name: "Passageway",
    inGame: "Passageway",
    hint: "Open arch in a wall. Interior rooms and airlocks. Vehicles use the Garage Door.",
    kind: "edge",
    granite: 10,
    marker: "#5c5044",
    stone: "#cfc0a6",
    letter: "P",
  },
  garage_door: {
    type: "garage_door",
    code: "GD",
    name: "Garage Door",
    inGame: "Garage Door",
    hint: "Large CHOAM Facility door: two cells wide and two stories tall (working model, verify in-game). Vehicle bays, buggies, scout 'thopters.",
    kind: "edge",
    granite: 30,
    marker: "#2c3238",
    stone: "#4a4540",
    letter: "G",
  },
  pentashield: {
    type: "pentashield",
    code: "PSH",
    name: "Pentashield",
    inGame: "Pentashield Surface Vertical",
    hint: "Vertical energy field. Drag-sized hangar opening for a carrier. Not a garage door. Schematic stand-in; granite is not a Funcom table.",
    kind: "edge",
    granite: 20,
    marker: "#3a6a88",
    stone: "#5ec8e8",
    letter: "Y",
  },
  stairs: {
    type: "stairs",
    code: "ST",
    name: "Stairs",
    inGame: "Stairs",
    hint: "One-cell stair. Rotation is the uphill direction.",
    kind: "rise",
    granite: 10,
    marker: "#c47a4a",
    stone: "#b8895c",
    letter: "S",
  },
  ramp: {
    type: "ramp",
    code: "RP",
    name: "Ramp",
    inGame: "Ramp",
    hint: "One-cell slope. Same slot as Stairs, better for crates and bikes.",
    kind: "rise",
    granite: 10,
    marker: "#b86b3c",
    stone: "#b07a4e",
    letter: "R",
  },
  rooftop: {
    type: "rooftop",
    code: "RF",
    name: "Rooftop",
    inGame: "Rooftop",
    hint: "Flat roof cap. Use Rooftop, not angled or rounded roofs.",
    kind: "cap",
    granite: 10,
    marker: "#5a4a3a",
    stone: "#5e4c3c",
    letter: "T",
  },
  hatch: {
    type: "hatch",
    code: "HT",
    name: "Hatch",
    inGame: "Hatch",
    hint: "Floor or roof opening. Ladder or stairs should meet it.",
    kind: "cap",
    granite: 17,
    marker: "#6a5040",
    stone: "#7a5e48",
    letter: "X",
  },
  center_column: {
    type: "center_column",
    code: "CC",
    name: "Center Column",
    inGame: "Center Column",
    hint: "Support post in the middle of a cell. Holds floors and roofs.",
    kind: "post",
    granite: 10,
    marker: "#4a3c30",
    stone: "#4e4034",
    letter: "C",
  },
  corner_column: {
    type: "corner_column",
    code: "CN",
    name: "Corner Column",
    inGame: "Corner Column",
    hint: "Support post on the south-west corner of the cell.",
    kind: "post",
    granite: 10,
    marker: "#3f342a",
    stone: "#45382e",
    letter: "K",
  },
  railing: {
    type: "railing",
    code: "RL",
    name: "Railing",
    inGame: "Railing",
    hint: "Edge rail. Sit it on rooftops and open decks so nobody walks off.",
    kind: "edge",
    granite: 10,
    marker: "#2a2420",
    stone: "#3a342e",
    letter: "A",
  },
  ladder: {
    type: "ladder",
    code: "LD",
    name: "Ladder",
    inGame: "Ladder",
    hint: "Vertical climb on a cell edge. Pair with a Hatch on the deck above.",
    kind: "climb",
    granite: 10,
    marker: "#8a6040",
    stone: "#7a5a3c",
    letter: "E",
  },
};

export const PIECE_LIST: PieceDef[] = PIECE_TYPES.map((t) => PIECES[t]);

export const EDGE_PRIORITY: PieceType[] = [
  "pentashield",
  "garage_door",
  "door",
  "passageway",
  "window",
  "wall",
  "half_wall",
  "railing",
  "ladder",
];

export function isPieceType(v: unknown): v is PieceType {
  return typeof v === "string" && (PIECE_TYPES as readonly string[]).includes(v);
}

export function isEdgeType(t: PieceType): boolean {
  return PIECES[t].kind === "edge" || t === "ladder";
}

export function isSpanOpening(t: PieceType): boolean {
  return t === "garage_door" || t === "pentashield";
}

export function isPadType(t: PieceType): boolean {
  return t === "foundation" || t === "floor" || t === "rooftop" || t === "hatch";
}
