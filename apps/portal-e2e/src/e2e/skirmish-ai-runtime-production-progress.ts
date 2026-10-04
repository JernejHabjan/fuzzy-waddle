import { isDeepStrictEqual } from "node:util";
import { ResourceType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Checks actual attempt/payment/progress order. This narrow diagnostic does not supply full production evidence. */
export function validateRuntimeProductionProgress(capture: AiRuntimeProductionCaptureV1, commands: readonly GameCommand[]) {
  const failures: string[] = [];
  const gaps: string[] = [];
  const operations = new Set<number>();
  const attempts = capture.facts.filter((fact) => fact.kind === "queue_progress");
  if (!attempts.length) gaps.push("production_ai_post_progress_authority_missing");
  for (const id of new Set(attempts.map((fact) => fact.progress.attemptId))) {
    const group = attempts.filter((fact) => fact.progress.attemptId === id);
    const start = group.find((fact) => fact.progress.phase === "started");
    const end = group.find((fact) => fact.progress.phase !== "started");
    if (!Number.isSafeInteger(id) || id <= 0 || group.length !== 2 || !start || !end ||
      start.sequence >= end.sequence || start.tick !== end.tick) {
      failures.push("production_ai_progress_scope_invalid"); continue;
    }
    const before = start.progress;
    const after = end.progress;
    const item = before.item;
    const next = after.item;
    const command = commands.find((entry) => entry.execution?.commandId === item?.commandId);
    if (!command) { gaps.push("production_ai_progress_command_missing"); continue; }
    if (!item || !next || before.gaps.length || after.gaps.length || before.snapshotRestoreInProgress ||
      after.snapshotRestoreInProgress || before.actorId !== after.actorId || before.laneId !== after.laneId ||
      !before.actorId || !before.laneId || item.identitySource !== "command" || command.execution?.source !== "ai" ||
      command.playerNumber !== capture.playerNumber || command.actorIds.length !== 1 || command.actorIds[0] !== before.actorId ||
      item.itemId !== `queue:${before.actorId}:${command.execution.commandId}` ||
      item.effectId !== command.execution.effectId || command.tick > start.tick ||
      (command.type === "PRODUCTION" ? item.objectName !== command.actorName || item.researchType !== null :
        command.type !== "RESEARCH" || item.researchType !== command.researchType || item.objectName !== null) ||
      !Number.isFinite(item.totalTimeMs) || item.totalTimeMs < 0 || !Number.isFinite(item.remainingTimeMs) ||
      item.remainingTimeMs < 0 || item.remainingTimeMs > item.totalTimeMs ||
      before.remainingBeforeMs !== item.remainingTimeMs || after.remainingBeforeMs !== item.remainingTimeMs ||
      // The shared queue consumes one fixed 50 ms simulation step, independent of render/time scale.
      before.deltaMs !== 50 || after.deltaMs !== before.deltaMs || item.payment === "unknown" ||
      !isDeepStrictEqual({ ...item, remainingTimeMs: next.remainingTimeMs }, next) || after.phase === "threw") {
      failures.push("production_ai_progress_lineage_invalid"); continue;
    }
    const expectedRemaining = after.phase === "advanced" ? Math.max(0, item.remainingTimeMs - before.deltaMs) : item.remainingTimeMs;
    if (next.remainingTimeMs !== expectedRemaining || (after.phase === "denied" && item.payment !== "per_successful_tick")) {
      failures.push("production_ai_progress_remaining_invalid");
    }
    const stateBefore = start.boundaryState;
    const stateAfter = end.boundaryState;
    if (!stateBefore?.queues || !stateAfter?.queues || !stateBefore.resources || !stateAfter.resources ||
      !stateBefore.obligations || !stateAfter.obligations) {
      gaps.push("production_ai_progress_boundary_missing"); continue;
    }
    if (!sameRuntimeQueueVector(calculateRuntimeQueueLiabilities(stateBefore.queues), stateBefore.obligations) ||
      !sameRuntimeQueueVector(calculateRuntimeQueueLiabilities(stateAfter.queues, stateAfter.exhaustedProgressItemId),
        stateAfter.obligations)) failures.push("production_ai_progress_absolute_liability_invalid");
    const expectedQueues = structuredClone(stateBefore.queues);
    const head = expectedQueues.find((queue) => queue.actorId === before.actorId)?.lanes
      .find((lane) => lane.laneId === before.laneId)?.items[0];
    if (!head || !isDeepStrictEqual(head, item)) failures.push("production_ai_progress_before_head_invalid");
    const updatedQueues = expectedQueues.map((queue) => ({ ...queue, lanes: queue.lanes.map((lane) => ({
      ...lane, items: lane.items.map((entry, index) =>
        queue.actorId === before.actorId && lane.laneId === before.laneId && index === 0 ? next : entry)
    })) }));
    if (!isDeepStrictEqual(updatedQueues, stateAfter.queues) ||
      stateBefore.exhaustedProgressItemId !== undefined || stateAfter.exhaustedProgressItemId !==
        (after.phase === "advanced" && next.remainingTimeMs === 0 ? next.itemId : undefined)) {
      failures.push("production_ai_progress_after_head_invalid");
    }
    const resources = capture.facts.filter((fact) => fact.kind === "queue_resource" &&
      fact.sequence > start.sequence && fact.sequence < end.sequence);
    const charged = item.payment === "per_successful_tick" && after.phase === "advanced";
    if (item.payment === "per_successful_tick") {
      const finished = resources.find((fact) => fact.resource.emission.phase === "finished");
      const emission = finished?.resource.emission;
      const resourceStart = resources.find((fact) => fact.resource.emission.phase === "started");
      const callback = resources.find((fact) => fact.resource.emission.phase === "callback");
      if (charged ? resources.length !== 3 || !resourceStart || !callback || !finished ||
        resourceStart.sequence >= callback.sequence || callback.sequence >= finished.sequence ||
        emission?.phase !== "finished" || emission.status !== "returned" || emission.callbackCount !== 1 ||
        emission.callbackLimitExceeded || emission.nestedEmission || !emission.balanceMatches ||
        !sameRuntimeQueueVector(emission.before, stateBefore.resources) ||
        !sameRuntimeQueueVector(emission.after, stateAfter.resources) : resources.length !== 1 ||
        resources[0].resource.emission.phase !== "denied") failures.push("production_ai_progress_payment_invalid");
      const operationId = resources[0]?.resource.emission.operationId;
      if (operationId !== undefined) {
        if (operations.has(operationId)) failures.push("production_ai_progress_payment_operation_reused");
        operations.add(operationId);
      }
      if (!Number.isSafeInteger(operationId) || (operationId ?? 0) <= 0 || resources.some((fact) => {
        const value = fact.resource;
        const context = value.originatingCommandContext;
        return fact.tick !== start.tick || value.gaps.length || value.operation !== "tick_charge" ||
          value.actorId !== before.actorId || value.ownerNumber !== capture.playerNumber || value.itemId !== item.itemId ||
          value.identitySource !== "command" || value.cancellationCommand !== null || value.payment !== item.payment ||
          value.totalTimeMs !== item.totalTimeMs || value.remainingTimeMs !== item.remainingTimeMs ||
          value.objectName !== item.objectName || value.researchType !== item.researchType ||
          value.emission.operationId !== operationId || value.emission.snapshotRestoreInProgress ||
          !isDeepStrictEqual(context?.execution, command.execution) || context?.playerNumber !== capture.playerNumber ||
          !isDeepStrictEqual(context?.actorIds, command.actorIds) || !sameRuntimeQueueVector(value.storedPrice, item.charge) ||
          !sameRuntimeQueueVector(value.emission.requested, item.charge) ||
          !sameRuntimeQueueVector(value.emission.before, stateBefore.resources) ||
          (value.emission.phase === "callback" && (value.emission.callbackOrdinal !== 1 ||
            !sameRuntimeQueueVector(value.emission.amounts, item.charge)));
      })) failures.push("production_ai_progress_payment_lineage_invalid");
    } else if (resources.length) failures.push("production_ai_progress_unexpected_payment");
    for (const type of Object.values(ResourceType)) {
      const amount = item.charge[type] ?? 0;
      if (!Number.isFinite(amount) || amount < 0 || stateAfter.resources[type] !== stateBefore.resources[type] -
        (charged ? amount : 0) || stateAfter.obligations[type] !== stateBefore.obligations[type] - (charged ? amount : 0)) {
        failures.push("production_ai_progress_cash_or_liability_invalid");
      }
    }
  }
  return { failures: [...new Set(failures)], gaps: [...new Set(gaps)] };
}
