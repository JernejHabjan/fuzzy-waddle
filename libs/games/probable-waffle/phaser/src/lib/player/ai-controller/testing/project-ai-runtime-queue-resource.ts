import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { QueueItemType, type UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { getActorComponent } from "../../../data/actor-component";
import type { QueueResourceEmissionEvent } from "../../../data/queue-resource-emission-event";
import { sampleQueueResourceVector } from "../../../data/queue-resource-samples";
import { OwnerComponent } from "../../../entity/components/owner-component";
import type { AiRuntimeQueueResourceV1 } from "./ai-runtime-queue-resource-v1";

/** Project live handles immediately, including before first insertion/after removal; never search by equal amounts. */
export function projectAiRuntimeQueueResource(
  event: QueueResourceEmissionEvent,
  identify: (actorId: string, item: UnifiedQueueItem) => string,
  tick: number
): AiRuntimeQueueResourceV1 {
  const { scope, ...emission } = event;
  const { item, producer, playerNumber } = scope;
  const actorId = getActorComponent(producer, IdComponent)?.id ?? null;
  const ownerNumber = getActorComponent(producer, OwnerComponent)?.getOwner() ?? null;
  const cost = item.type === QueueItemType.Production ? item.productionData?.costData : undefined;
  const research = item.type === QueueItemType.Research && item.researchData
    ? researchDefinitions[item.researchData] : undefined;
  const price = cost?.resources ?? research?.cost;
  const storedPrice = price ? sampleQueueResourceVector(price) : null;
  const finiteNonnegative = (value: number | undefined): number | null =>
    value !== undefined && Number.isFinite(value) && value >= 0 ? value : null;
  const refundFactor = finiteNonnegative(cost?.refundFactor ?? research?.refundFactor);
  const totalTimeMs = finiteNonnegative(item.totalTime);
  const remainingTimeMs = finiteNonnegative(item.remainingTime);
  const context = item.commandContext ?? null;
  const cancellation = scope.cancellationCommand ?? null;
  const gaps: string[] = [];
  if (!actorId) gaps.push("queue_resource_actor_identity_missing");
  if (ownerNumber !== playerNumber) gaps.push("queue_resource_owner_mismatch");
  if (!context) gaps.push("queue_resource_originating_command_missing");
  else if (!context.execution.commandId || context.playerNumber !== playerNumber ||
    !actorId || !context.actorIds.includes(actorId)) gaps.push("queue_resource_originating_command_mismatch");
  if (scope.operation === "cancellation_refund") {
    const type = item.type === QueueItemType.Production ? "CANCEL_PRODUCTION" : "CANCEL_RESEARCH";
    if (!cancellation?.execution?.commandId) gaps.push("queue_resource_cancellation_command_missing");
    if (cancellation && (cancellation.type !== type || cancellation.playerNumber !== playerNumber ||
      !actorId || !cancellation.actorIds.includes(actorId))) gaps.push("queue_resource_cancellation_command_mismatch");
    if (cancellation && (!Number.isSafeInteger(cancellation.tick) || cancellation.tick < 0 || cancellation.tick > tick)) {
      gaps.push("queue_resource_cancellation_before_scheduled_tick");
    }
    if (cancellation?.execution?.commandId && cancellation.execution.commandId === context?.execution.commandId) {
      gaps.push("queue_resource_cancellation_reuses_purchase_command");
    }
  } else if (cancellation) gaps.push("queue_resource_unexpected_cancellation_command");
  if (!storedPrice || refundFactor === null) gaps.push("queue_resource_stored_price_missing");
  if (totalTimeMs === null || remainingTimeMs === null ||
    (totalTimeMs !== null && remainingTimeMs !== null && remainingTimeMs > totalTimeMs)) {
    gaps.push("queue_resource_progress_invalid");
  }
  if (!emission.requested || !emission.before) gaps.push("queue_resource_scoped_sample_missing");
  if (emission.phase === "callback" && !emission.amounts) gaps.push("queue_resource_callback_sample_missing");
  if (emission.phase === "finished") {
    if (!emission.after) gaps.push("queue_resource_scoped_sample_missing");
    if (emission.status === "threw") gaps.push("queue_resource_emission_threw");
    if (emission.callbackCount !== 1) gaps.push("queue_resource_callback_count_invalid");
    if (emission.callbackLimitExceeded) gaps.push("queue_resource_callback_limit_exceeded");
    if (emission.nestedEmission) gaps.push("queue_resource_nested_emission");
    if (!emission.balanceMatches) gaps.push("queue_resource_scoped_balance_mismatch");
  }
  return structuredClone({
    actorId, ownerNumber, itemId: actorId ? identify(actorId, item) : null,
    identitySource: context?.execution.commandId ? "command" : "capture_local",
    operation: scope.operation, objectName: item.productionData?.actorName ?? null, researchType: item.researchData ?? null,
    totalTimeMs, remainingTimeMs, storedPrice, refundFactor,
    payment: cost ? cost.costType === PaymentType.PayOverTime ? "per_successful_tick" : "immediate"
      : research ? "immediate" : "unknown",
    originatingCommandContext: context, cancellationCommand: cancellation, emission, gaps
  } satisfies AiRuntimeQueueResourceV1);
}
