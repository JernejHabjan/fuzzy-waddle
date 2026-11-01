import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntent } from "../contracts/ai-intent";
import type { AiObservation } from "../contracts/ai-observation";

/** Active or queued native Moves to live owned actors are intake work; routine squads wait for their terminal state. */
export function preservesAiFriendlyRally(observation: AiObservation, intent: AiIntent): boolean {
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
