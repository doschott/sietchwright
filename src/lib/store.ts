import { create } from "zustand";
import { buildFromSpec } from "./build-from-spec.ts";
import { nextRot } from "./grid.ts";
import { normalizePlan } from "./normalize";
import { isEdgeType, type PieceType } from "./pieces";
import { emptyPlan, type Plan, type PlacedPiece } from "./plan.ts";
import {
  DEFAULT_SPEC,
  applyConstraints,
  describeSpec,
  isParkVehicle,
  normalizeSpec,
  type BriefSpec,
} from "./spec.ts";
import { primaryVehicle, uniqueVehicles } from "./vehicles.ts";
import { writeSave } from "./storage";
import type { ZoomAction } from "./camera";

export type View = "iso" | "top" | "south";

/** Only one overlay panel is open at a time so menus never stack over the yard. */
export type Overlay = "none" | "brief" | "kit" | "inspect";

type State = {
  plan: Plan;
  brief: string;
  spec: BriefSpec;
  builtSpec: BriefSpec | null;
  notes: string[];
  selectedId: string | null;
  placeType: PieceType | null;
  placeStory: number;
  showMarkers: boolean;
  showGrid: boolean;
  generating: boolean;
  error: string | null;
  view: View;
  camTick: number;
  history: Plan[];
  overlay: Overlay;
  chromeHidden: boolean;
  zoomPulse: number;
  zoomAction: ZoomAction;
  cutaway: boolean;
  camYaw: number;
  setSpec: (patch: Partial<BriefSpec>) => void;
  applySpec: (spec: BriefSpec) => void;
  setPlan: (plan: Plan) => void;
  select: (id: string | null) => void;
  setPlaceType: (t: PieceType | null) => void;
  setPlaceStory: (s: number) => void;
  toggleMarkers: () => void;
  toggleGrid: () => void;
  setView: (v: View) => void;
  setGenerating: (v: boolean) => void;
  setError: (v: string | null) => void;
  setOverlay: (overlay: Overlay) => void;
  toggleOverlay: (overlay: Exclude<Overlay, "none">) => void;
  toggleChrome: () => void;
  zoomBy: (action: ZoomAction) => void;
  toggleCutaway: () => void;
  setCamYaw: (yaw: number) => void;
  removeSelected: () => void;
  rotateSelected: () => void;
  placeAt: (x: number, z: number, rot: number, story: number) => void;
  undo: () => void;
  resetYard: () => void;
  raiseFromSpec: () => void;
};

function persist(
  partial: Partial<Pick<State, "plan" | "brief" | "showMarkers" | "spec" | "builtSpec">>,
) {
  const cur = useYard.getState();
  writeSave({
    version: 3,
    plan: partial.plan ?? cur.plan,
    brief: partial.brief ?? cur.brief,
    spec: partial.spec ?? cur.spec,
    builtSpec: partial.builtSpec === undefined ? cur.builtSpec : partial.builtSpec,
    showMarkers: partial.showMarkers ?? cur.showMarkers,
  });
}

function pushHistory(plan: Plan): Plan[] {
  const hist = useYard.getState().history;
  return [...hist.slice(-24), plan];
}

export const useYard = create<State>((set, get) => ({
  plan: emptyPlan(),
  brief: describeSpec(DEFAULT_SPEC),
  spec: DEFAULT_SPEC,
  builtSpec: null,
  notes: [],
  selectedId: null,
  placeType: null,
  placeStory: 0,
  showMarkers: false,
  showGrid: true,
  generating: false,
  error: null,
  view: "iso",
  camTick: 0,
  history: [],
  overlay: "brief",
  chromeHidden: false,
  zoomPulse: 0,
  zoomAction: "fit",
  cutaway: false,
  camYaw: 0,
  setSpec: (patch) => {
    const cur = get().spec;
    const merged: BriefSpec = { ...cur, ...patch };
    if (Object.prototype.hasOwnProperty.call(patch, "vehicles")) {
      merged.vehicles = uniqueVehicles(patch.vehicles);
      merged.vehicle = primaryVehicle(merged.vehicles);
    } else if (Object.prototype.hasOwnProperty.call(patch, "vehicle") && patch.vehicle !== undefined) {
      merged.vehicles =
        patch.vehicle === "none" || !isParkVehicle(patch.vehicle) ? [] : [patch.vehicle];
      merged.vehicle = primaryVehicle(merged.vehicles);
    }
    const { spec, notes } = applyConstraints(merged);
    const brief = describeSpec(spec);
    set({ spec, brief, notes });
    persist({ spec, brief });
  },
  applySpec: (next) => {
    const { spec, notes } = applyConstraints(next);
    const brief = describeSpec(spec);
    set({ spec, brief, notes });
    persist({ spec, brief });
  },
  setPlan: (plan) => {
    const prev = get().plan;
    set({
      plan,
      selectedId: null,
      history: pushHistory(prev),
      error: null,
      camTick: get().camTick + 1,
    });
    persist({ plan });
  },
  select: (selectedId) =>
    set({
      selectedId,
      placeType: null,
      overlay: selectedId ? "inspect" : get().overlay === "inspect" ? "none" : get().overlay,
      chromeHidden: selectedId ? false : get().chromeHidden,
    }),
  setPlaceType: (placeType) =>
    set({
      placeType,
      selectedId: null,
      overlay: placeType ? "kit" : get().overlay === "kit" ? "none" : get().overlay,
      chromeHidden: false,
    }),
  setPlaceStory: (placeStory) => set({ placeStory }),
  setOverlay: (overlay) => set({ overlay, chromeHidden: false }),
  toggleOverlay: (overlay) =>
    set({
      overlay: get().overlay === overlay ? "none" : overlay,
      chromeHidden: false,
    }),
  toggleChrome: () =>
    set({
      chromeHidden: !get().chromeHidden,
      overlay: !get().chromeHidden ? "none" : get().overlay,
    }),
  zoomBy: (zoomAction) =>
    set({ zoomAction, zoomPulse: get().zoomPulse + 1, chromeHidden: false }),
  toggleCutaway: () => set({ cutaway: !get().cutaway }),
  setCamYaw: (camYaw) => {
    if (Math.abs(camYaw - get().camYaw) < 0.03) return;
    set({ camYaw });
  },
  toggleMarkers: () => {
    const showMarkers = !get().showMarkers;
    set({ showMarkers });
    persist({ showMarkers });
  },
  toggleGrid: () => set({ showGrid: !get().showGrid }),
  setView: (view) => set({ view, camTick: get().camTick + 1 }),
  setGenerating: (generating) => set({ generating }),
  setError: (error) => set({ error }),
  removeSelected: () => {
    const { selectedId, plan } = get();
    if (!selectedId) return;
    const next = {
      ...plan,
      pieces: plan.pieces.filter((p) => p.id !== selectedId),
      source: "hand" as const,
    };
    set({
      plan: next,
      selectedId: null,
      history: pushHistory(plan),
    });
    persist({ plan: next });
  },
  rotateSelected: () => {
    const { selectedId, plan } = get();
    if (!selectedId) return;
    const next = {
      ...plan,
      pieces: plan.pieces.map((p) =>
        p.id === selectedId ? { ...p, rot: nextRot(p.rot) } : p,
      ),
      source: "hand" as const,
    };
    set({ plan: next, history: pushHistory(plan) });
    persist({ plan: next });
  },
  placeAt: (x, z, rot, story) => {
    const { placeType, plan } = get();
    if (!placeType) return;
    const piece: PlacedPiece = {
      id: `${placeType}-${Date.now().toString(36)}`,
      type: placeType,
      x,
      y: placeType === "foundation" ? 0 : story,
      z,
      rot: (rot === 90 || rot === 180 || rot === 270 ? rot : 0) as 0 | 90 | 180 | 270,
    };
    if (!isEdgeType(placeType) && placeType !== "stairs" && placeType !== "ramp") {
      piece.rot = 0;
    }
    if (placeType === "foundation") piece.y = 0;
    if (placeType === "garage_door") piece.y = Math.min(piece.y, 2);
    const next = normalizePlan(
      {
        ...plan,
        pieces: [...plan.pieces, piece],
        source: "hand",
      },
      plan.brief,
      "hand",
    );
    set({ plan: next, history: pushHistory(plan) });
    persist({ plan: next });
  },
  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const plan = history[history.length - 1]!;
    set({ history: history.slice(0, -1), plan, selectedId: null });
    persist({ plan });
  },
  resetYard: () => {
    const plan = emptyPlan();
    const spec = DEFAULT_SPEC;
    const brief = describeSpec(spec);
    set({
      plan,
      brief,
      spec,
      builtSpec: null,
      notes: [],
      selectedId: null,
      history: pushHistory(get().plan),
      error: null,
      camTick: get().camTick + 1,
      placeType: null,
      overlay: "brief",
      chromeHidden: false,
      zoomAction: "fit",
      zoomPulse: get().zoomPulse + 1,
      cutaway: false,
    });
    persist({ plan, brief, spec, builtSpec: null });
  },
  raiseFromSpec: () => {
    const spec = normalizeSpec(get().spec);
    const brief = describeSpec(spec);
    const plan = buildFromSpec(spec);
    plan.brief = brief;
    const prev = get().plan;
    set({
      spec,
      brief,
      builtSpec: spec,
      notes: [],
      plan,
      selectedId: null,
      placeType: null,
      history: pushHistory(prev),
      error: null,
      camTick: get().camTick + 1,
      overlay: "none",
      chromeHidden: false,
      zoomAction: "fit",
      zoomPulse: get().zoomPulse + 1,
    });
    persist({ spec, brief, plan, builtSpec: spec });
  },
}));
