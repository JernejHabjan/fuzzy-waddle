import type { AiStrategyAssessment } from "../contracts/ai-strategy-assessment";

const MAX_PLANNED_FORCE = 24;
const UNITS_PER_PRODUCER_HORIZON = 8;

/** Converts the current evidenced offensive requirement into a bounded production target. */
export function plannedAiForceSize(
  openingComplete: boolean,
  domain: "ground" | "air" | "water",
  assessment: AiStrategyAssessment | undefined,
  currentForce: number,
  threatenedOpeningForce: number | null
): number {
  if (!openingComplete) return threatenedOpeningForce ?? currentForce;
  const standingTarget = domain === "air" ? 8 : 12;
  const required = assessment?.choice === "scout" ? 0 : (assessment?.requiredForce ?? 0);
  return Math.min(MAX_PLANNED_FORCE, Math.max(standingTarget, required));
}

/** Adds producer throughput only for an outstanding, dated force deficit. */
export function plannedAiProducerCount(targetForce: number, ownedForce: number, queuedForce: number): number {
  const missing = Math.max(0, targetForce - ownedForce - queuedForce);
  return Math.max(1, Math.min(3, Math.ceil(missing / UNITS_PER_PRODUCER_HORIZON)));
}
