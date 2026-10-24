import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";

/** Keep the landed builder's deposit affordable; this is a spending policy, never another payment or authoritative escrow. */
export function aiIslandResourceReserve(
  observation: AiObservationV1, state: AiBrainStateV1, intent: AiIntentV1, accepted: readonly AiIntentV1[], type: ResourceType
): number {
  if (intent.spendingCategory === "survival") return 0;
  return state.transport.reduce((total, plan) => {
    const purpose = plan.lifecycle?.establishment;
    if (!purpose || ["cancelled", "failed"].includes(plan.phase)) return total;
    const planId = `plan:resource-service:${purpose.sourceActorId}`;
    const purchase = (candidate: AiIntentV1) => candidate.kind === "construct" && candidate.planId === planId &&
      candidate.objectName === purpose.serviceObjectName;
    const source = observation.actors.find((actor) => actor.actorId === purpose.sourceActorId);
    if (plan.phase === "completed" && !source || source?.resourceState.status === "known" &&
      source.resourceState.value.available.status === "known" && source.resourceState.value.available.value <= 0) return total;
    if (purchase(intent) || accepted.some(purchase) || state.pendingOutcomes.some((outcome) =>
      outcome.identity.intentId.startsWith(`intent:resource-service:${purpose.sourceActorId}:`) &&
      ["dispatched", "applied", "active", "completed"].includes(outcome.kind))) return total;
    if (observation.actors.some((actor) => actor.relation === "self" && actor.visibility === "owned" &&
      actor.objectName === purpose.serviceObjectName && actor.accessNodeId.status === "known" &&
      actor.accessNodeId.value === plan.lifecycle?.route.destinationNodeId)) return total;
    return total + (purpose.resourceCost[type] ?? 0);
  }, 0);
}
