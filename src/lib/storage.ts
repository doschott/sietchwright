import { normalizePlan } from "./normalize";
import { emptyPlan, type Plan } from "./plan.ts";
import { DEFAULT_SPEC, describeSpec, parseSpec, type BriefSpec } from "./spec.ts";

const KEY = "sietchwright:v3";
const SAVE_VERSION = 3;

type Save = {
  version: number;
  plan: Plan;
  brief: string;
  spec: BriefSpec;
  builtSpec: BriefSpec | null;
  showMarkers: boolean;
};

export function loadSave(): Save {
  const defaults: Save = {
    version: SAVE_VERSION,
    plan: emptyPlan(),
    brief: describeSpec(DEFAULT_SPEC),
    spec: DEFAULT_SPEC,
    builtSpec: null,
    showMarkers: false,
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Save>;
    const spec = parseSpec(parsed.spec);
    const plan = parsed.plan
      ? normalizePlan(
          parsed.plan,
          parsed.brief ?? describeSpec(spec),
          parsed.plan.source ?? "hand",
        )
      : defaults.plan;
    const builtSpec = parsed.builtSpec
      ? parseSpec(parsed.builtSpec)
      : plan.pieces.length
        ? spec
        : null;
    return {
      version: SAVE_VERSION,
      plan,
      brief: String(parsed.brief ?? plan.brief ?? describeSpec(spec)),
      spec,
      builtSpec,
      showMarkers: parsed.showMarkers === true,
    };
  } catch {
    return defaults;
  }
}

export function writeSave(save: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...save, version: SAVE_VERSION }));
  } catch {
    // private mode / quota — keep going in memory
  }
}
