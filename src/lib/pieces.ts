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
  "chest",
  "small_storage",
  "storage_container",
  "medium_storage",
  "fabricator",
  "vehicle_fabricator",
  "weapons_fabricator",
  "survival_fabricator",
  "garment_fabricator",
  "small_chemical",
  "small_ore",
] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

export type PieceKind =
  | "pad"
  | "deck"
  | "edge"
  | "rise"
  | "cap"
  | "post"
  | "climb"
  | "placeable";

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
  chest: {
    type: "chest",
    code: "CH",
    name: "Chest",
    inGame: "Chest",
    hint: "20 slots, 750v. Iron. What most new players actually place.",
    kind: "placeable",
    granite: 0,
    marker: "#8a6238",
    stone: "#a07040",
    letter: "C",
  },
  small_storage: {
    type: "small_storage",
    code: "SS",
    name: "Small Storage",
    inGame: "Small Storage Container",
    hint: "10 slots, 250v. Salvaged metal. The first box you can build.",
    kind: "placeable",
    granite: 0,
    marker: "#6a5848",
    stone: "#7a6858",
    letter: "S",
  },
  storage_container: {
    type: "storage_container",
    code: "SC",
    name: "Storage Container",
    inGame: "Storage Container",
    hint: "45 slots, 1,750v. Aluminum. Mid-game crate.",
    kind: "placeable",
    granite: 0,
    marker: "#5a6a70",
    stone: "#6a7a80",
    letter: "B",
  },
  medium_storage: {
    type: "medium_storage",
    code: "MS",
    name: "Medium Storage",
    inGame: "Medium Storage Container",
    hint: "100 slots, 3,500v. Plastanium. Late crate.",
    kind: "placeable",
    granite: 0,
    marker: "#4a5a88",
    stone: "#5a6a98",
    letter: "M",
  },
  fabricator: {
    type: "fabricator",
    code: "FB",
    name: "Fabricator",
    inGame: "Fabricator",
    hint: "Basic bench. Salvaged metal. First real crafting table.",
    kind: "placeable",
    granite: 0,
    marker: "#c4a05a",
    stone: "#d4b06a",
    letter: "F",
  },
  vehicle_fabricator: {
    type: "vehicle_fabricator",
    code: "VF",
    name: "Vehicle Fab",
    inGame: "Vehicles Fabricator",
    hint: "Buggy and 'thopter parts. Steel + complex machinery.",
    kind: "placeable",
    granite: 0,
    marker: "#4a7a9a",
    stone: "#5a8aaa",
    letter: "V",
  },
  weapons_fabricator: {
    type: "weapons_fabricator",
    code: "WF",
    name: "Weapons Fab",
    inGame: "Weapons Fabricator",
    hint: "Guns and blades. Steel + complex machinery.",
    kind: "placeable",
    granite: 0,
    marker: "#8a4a4a",
    stone: "#9a5a5a",
    letter: "W",
  },
  survival_fabricator: {
    type: "survival_fabricator",
    code: "SF",
    name: "Survival Fab",
    inGame: "Survival Fabricator",
    hint: "Tools and stillsuit gear. Steel + complex machinery.",
    kind: "placeable",
    granite: 0,
    marker: "#4a8a5a",
    stone: "#5a9a6a",
    letter: "U",
  },
  garment_fabricator: {
    type: "garment_fabricator",
    code: "GF",
    name: "Garment Fab",
    inGame: "Garment Fabricator",
    hint: "Clothes and armor cloth. Steel + complex machinery.",
    kind: "placeable",
    granite: 0,
    marker: "#7a5a8a",
    stone: "#8a6a9a",
    letter: "G",
  },
  small_chemical: {
    type: "small_chemical",
    code: "CR",
    name: "Small Chemical",
    inGame: "Small Chemical Refinery",
    hint: "Fuel cells, silicone, cobalt paste. Copper.",
    kind: "placeable",
    granite: 0,
    marker: "#3a7a6a",
    stone: "#4a8a7a",
    letter: "Y",
  },
  small_ore: {
    type: "small_ore",
    code: "OR",
    name: "Small Ore",
    inGame: "Small Ore Refinery",
    hint: "Copper, iron, steel. Salvaged metal.",
    kind: "placeable",
    granite: 0,
    marker: "#8a6a3a",
    stone: "#9a7a4a",
    letter: "O",
  },
};

export const PIECE_LIST: PieceDef[] = PIECE_TYPES.map((t) => PIECES[t]);

/** CHOAM structure only. Placeables stay off the kit so the sheet stays short. */
export const KIT_LIST: PieceDef[] = PIECE_LIST.filter((p) => p.kind !== "placeable");

export function isPlaceable(t: PieceType): boolean {
  return PIECES[t].kind === "placeable";
}

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
