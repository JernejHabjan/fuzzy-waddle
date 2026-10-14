import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/** Active or queued native Moves to live owned actors are intake work; routine squads wait for their terminal state. */
export function preservesAiFriendlyRally(observation: AiObservationV1, intent: AiIntentV1): boolean {
  if (
    !["army_threat", "scouting"].includes(intent.lane) ||
    !("actorIds" in intent) ||
    intent.planId.startsWith("plan:squad:defense:")
  )
    return false;
  return intent.actorIds.some((id) => {
    const actor = observation.actors.find((candidate) => candidate.actorId === id && candidate.relation === "self");
    return [actor?.activeOrder, actor?.pendingOrder].some(
      (order) =>
        order?.status === "known" &&
        order.value?.orderType === OrderType.Move &&
        order.value.targetActorId !== null &&
        observation.actors.some(
          (target) =>
            target.actorId === order.value?.targetActorId && target.relation === "self" && target.visibility === "owned"
        )
    );
  });
}
