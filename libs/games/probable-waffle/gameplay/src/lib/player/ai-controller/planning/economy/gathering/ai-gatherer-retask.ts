import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActor } from "../../../contracts/observation/ai-observation";

/** Only an unloaded gatherer with no conflicting pending order can be safely reassigned. */
export function isSafeAiGathererRetask(actor: AiObservedActor): boolean {
  if (
    actor.activeOrder?.status !== "known" ||
    actor.activeOrder.value?.orderType !== OrderType.Gather ||
    actor.resourceTransferInFlight ||
    (actor.carriedResourceAmount ?? 0) > 0 ||
    (actor.resourceState.status === "known" &&
      actor.resourceState.value.carried.status === "known" &&
      actor.resourceState.value.carried.value > 0) ||
    (actor.pendingOrder?.status === "known" &&
      actor.pendingOrder.value !== null &&
      (actor.pendingOrder.value.orderType !== OrderType.Gather ||
        actor.pendingOrder.value.targetActorId !== actor.activeOrder.value.targetActorId))
  )
    return false;
  return true;
}
