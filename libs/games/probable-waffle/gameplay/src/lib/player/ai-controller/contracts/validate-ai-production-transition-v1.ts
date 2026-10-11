import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { assertAiNonNegativeInteger } from "./ai-core-types";
import { isRecord } from "./ai-validation-primitives";
import type { AiProductionTransitionV1 } from "./brain-state/ai-production-transition-v1";

/** Older V1 saves omit this field; a present future schedule must be complete and internally dated. */
export function assertAiProductionTransitionV1(value: unknown): asserts value is AiProductionTransitionV1 | undefined {
  if (value === undefined) return;
  if (!isRecord(value) || typeof value.planId !== "string" || !value.planId.startsWith("plan:production-transition:") ||
    value.demandId !== value.planId.replace("plan:", "demand:") ||
    typeof value.targetActorId !== "string" || !value.targetActorId || typeof value.reason !== "string" || !value.reason ||
    !["ground", "air"].includes(String(value.domain)) ||
    !["committed", "abandoned", "fulfilled", "expired"].includes(String(value.status)) ||
    !Object.values(ObjectNames).includes(value.producerObjectName as ObjectNames) ||
    !Object.values(ObjectNames).includes(value.productObjectName as ObjectNames)) {
    throw new Error("malformed_ai_production_transition");
  }
  for (const field of [
    "committedTick", "beginsTick", "forceDeadlineTick", "desiredForce", "desiredProducers", "unitDurationTicks"
  ]) {
    if (typeof value[field] !== "number") throw new Error(`invalid_ai_production_transition:${field}`);
    assertAiNonNegativeInteger(value[field], `productionTransition.${field}`);
  }
  if (Number(value.beginsTick) <= Number(value.committedTick) ||
    Number(value.forceDeadlineTick) <= Number(value.beginsTick) ||
    Number(value.desiredForce) < 1 || Number(value.desiredForce) > 24 ||
    Number(value.desiredProducers) < 1 || Number(value.desiredProducers) > 3 || Number(value.unitDurationTicks) < 1) {
    throw new Error("invalid_ai_production_transition:schedule");
  }
}
