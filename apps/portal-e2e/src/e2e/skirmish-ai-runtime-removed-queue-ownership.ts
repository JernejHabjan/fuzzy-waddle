import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";
import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { validateRuntimeQueueMutationBoundaries } from "./skirmish-ai-runtime-queue-mutation-boundaries";

/**
 * Retires only the queue-claim subset using an exact native physical interval already in the observed prefix.
 * No old-head tombstone, later snapshot, global reservation, terminal or created actor substitutes for removal.
 */
export function hasRuntimeRemovedQueueOwnership(
  capture: AiRuntimeProductionCaptureV1, fact: AiRuntimeProductionFactV1,
  origin: RuntimeProductionCausalityV1["commands"][number], cutoff: number,
  commands: RuntimeProductionCausalityV1["commands"]
): boolean {
  const execution = origin.command.execution;
  const pairs = capture.facts.filter((entry): entry is Extract<AiRuntimeProductionFactV1, { kind: "queue_mutation" }> =>
    entry.kind === "queue_mutation" && entry.sequence <= cutoff && entry.mutation.operation !== "enqueue" &&
    entry.mutation.item?.commandId === execution?.commandId);
  const before = pairs.find((entry) => entry.mutation.phase === "before");
  const after = pairs.find((entry) => entry.mutation.phase === "after");
  if (!before || !after || pairs.length !== 2 || !execution || !before.mutation.item ||
    before.tick !== after.tick || after.sequence !== before.sequence + 1 ||
    before.mutation.mutationId <= 0 || !Number.isSafeInteger(before.mutation.mutationId) ||
    !isDeepStrictEqual({ ...before.mutation, phase: "after" }, after.mutation) ||
    before.mutation.snapshotRestoreInProgress || before.mutation.gaps.length ||
    before.boundaryState?.snapshotRestoreInProgress || after.boundaryState?.snapshotRestoreInProgress ||
    fact.boundaryState?.snapshotRestoreInProgress || !fact.boundaryState?.queues ||
    !isDeepStrictEqual(before.mutation.originatingCommandContext, {
      execution, playerNumber: origin.command.playerNumber, actorIds: origin.command.actorIds
    }) || !validateRuntimeQueueMutationBoundaries(before, after).boundary) return false;
  const value = before.mutation;
  const item = value.item;
  const price = Object.fromEntries(Object.values(ResourceType).map((type) => [type,
    origin.acceptedIntent.claims.reduce((sum, claim) => sum +
      (claim.kind === "resource" && claim.resourceType === type ? claim.amount : 0), 0)]));
  if (!item || !sameRuntimeQueueVector(item.charge, price) || item.payment !== "per_successful_tick" ||
    item.identitySource !== "command" ||
    item.itemId !== `queue:${value.actorId}:${execution.commandId}` || item.effectId !== execution.effectId ||
    origin.command.actorIds.length !== 1 || origin.command.actorIds[0] !== value.actorId ||
    origin.command.type !== "PRODUCTION" || item.objectName !== origin.command.actorName || item.researchType !== null ||
    origin.outcomes.some((entry) => entry.sequence < before.sequence &&
      ["completed", "cancelled", "failed", "rejected"].includes(entry.outcome.kind)) ||
    capture.facts.some((entry) => entry.sequence > after.sequence && entry.sequence <= cutoff &&
      entry.kind === "queue_mutation" && entry.mutation.item?.itemId === item.itemId)) return false;
  if (value.operation === "complete_remove") {
    const advanced = capture.facts.filter((entry) => entry.kind === "queue_progress" && entry.sequence < before.sequence &&
      entry.tick === before.tick && entry.progress.phase === "advanced" && entry.progress.actorId === value.actorId &&
      entry.progress.laneId === value.laneId && isDeepStrictEqual(entry.progress.item, item));
    if (item.remainingTimeMs !== 0 || value.itemIndex !== 0 || advanced.length !== 1 ||
      before.boundaryState?.exhaustedProgressItemId !== item.itemId || value.cancellationCommand !== null) return false;
  } else {
    const cancellation = value.cancellationCommand;
    const scope = commands.find((entry) => entry.command.execution?.commandId === cancellation?.execution?.commandId);
    if (!cancellation?.execution || cancellation.type !== "CANCEL_PRODUCTION" || !scope?.decision ||
      !sameRuntimeQueueCommand(cancellation, scope.command) ||
      cancellation.execution.commandId === execution.commandId || cancellation.tick !== before.tick ||
      cancellation.playerNumber !== capture.playerNumber || !isDeepStrictEqual(cancellation.actorIds, origin.command.actorIds) ||
      !scope.outcomes.some((entry) => entry.sequence < before.sequence && entry.outcome.kind === "dispatched") ||
      scope.outcomes.some((entry) => entry.sequence < before.sequence &&
        ["cancelled", "completed", "failed", "rejected"].includes(entry.outcome.kind))) return false;
  }
  return !fact.boundaryState.queues.some((queue) => queue.lanes.some((lane) =>
    lane.items.some((candidate) => candidate.itemId === item.itemId || candidate.commandId === execution.commandId)));
}
