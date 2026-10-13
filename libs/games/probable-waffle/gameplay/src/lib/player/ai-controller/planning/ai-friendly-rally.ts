import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/** A current native Move to a live owned actor is already intake work; routine squads wait for its terminal state. */
export function preservesAiFriendlyRally(observation: AiObservationV1, intent: AiIntentV1): boolean {
  if (
    !["army_threat", "scouting"].includes(intent.lane) ||
    !("actorIds" in intent) ||
    intent.planId.startsWith("plan:squad:defense:")
  )
    return false;
  return intent.actorIds.some((id) => {
    const actor = observation.actors.find((candidate) => candidate.actorId === id && candidate.relation === "self");
    const order = actor?.activeOrder?.status === "known" ? actor.activeOrder.value : null;
    return (
      order?.orderType === OrderType.Move &&
      order.targetActorId !== null &&
      observation.actors.some(
        (target) =>
          target.actorId === order.targetActorId && target.relation === "self" && target.visibility === "owned"
      )
    );
  });
}
