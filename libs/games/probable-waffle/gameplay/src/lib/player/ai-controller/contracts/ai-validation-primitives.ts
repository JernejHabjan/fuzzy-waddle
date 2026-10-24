import { assertAiNonNegativeInteger } from "./ai-core-types";

/** Accepts only ordinary non-array records at persisted-state trust boundaries. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Checks set-like identity arrays before duplicate IDs can enter saved state. */
export function assertUnique(values: readonly string[], field: string): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate_ai_identity:${field}`);
}

/** Enforces the simulation-tick deadline representation used by persisted plans. */
export function assertDeadline(value: unknown, field: string): void {
  if (!isRecord(value) || value.clock !== "simulation" || value.unit !== "tick" || value.persistence !== "save") {
    throw new Error(`invalid_ai_deadline:${field}`);
  }
  if (typeof value.dueTick !== "number") throw new Error(`invalid_ai_deadline:${field}`);
  assertAiNonNegativeInteger(value.dueTick, field);
}
