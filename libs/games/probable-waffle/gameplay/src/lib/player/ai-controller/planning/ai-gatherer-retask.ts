import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";

/** Only an unloaded gatherer with no conflicting pending order can be safely reassigned. */
export function isSafeAiGathererRetask(actor: AiObservedActorV1): boolean {
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
