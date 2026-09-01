import { emptyPlan, type Plan } from "./plan.ts";

export { PRESETS } from "./spec.ts";

export function defaultPlan(): Plan {
  return emptyPlan();
}
