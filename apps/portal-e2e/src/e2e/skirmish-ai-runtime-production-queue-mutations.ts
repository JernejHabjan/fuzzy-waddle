import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionQueueMutationV1 } from "./skirmish-ai-runtime-production-queue-mutation";
import { validateRuntimeQueueMutationBoundaries } from "./skirmish-ai-runtime-queue-mutation-boundaries";
import { reconcileRuntimeProductionUnspent } from "./skirmish-ai-runtime-production-unspent";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";
import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";

/** Native command scopes plus exact physical mutation callbacks; never promotes removal to useful completion evidence. */
export function projectRuntimeProductionQueueMutations(
  capture: AiRuntimeProductionCaptureV1,
  commands: RuntimeProductionCausalityV1["commands"],
  payments: RuntimeProductionCausalityV1["payments"],
  operations: RuntimeProductionCausalityV1["operations"]
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  const mutations: RuntimeProductionQueueMutationV1[] = [];
  const facts = capture.facts.filter((fact) => fact.kind === "queue_mutation");
  const ids = new Set(facts.map((fact) => fact.mutation.mutationId));
  const inserted = new Set<string>();
  const removed = new Set<string>();
  for (const id of ids) {
    const group = facts.filter((fact) => fact.mutation.mutationId === id);
    const before = group.find((fact) => fact.mutation.phase === "before");
    const after = group.find((fact) => fact.mutation.phase === "after");
    const relevant = group.some((fact) => fact.mutation.originatingCommandContext?.execution.source === "ai" ||
      fact.mutation.cancellationCommand?.execution?.source === "ai");
    if (!relevant) continue;
    if (!Number.isSafeInteger(id) || id <= 0 || group.length !== 2 || !before || !after ||
      after.sequence !== before.sequence + 1 || before.tick !== after.tick ||
      !["enqueue", "cancel_remove", "complete_remove"].includes(before.mutation.operation) ||
      !isDeepStrictEqual({ ...before.mutation, phase: "after" }, after.mutation)) {
      failures.push("production_ai_mutation_interval_invalid"); continue;
    }
    const value = before.mutation;
    const item = value.item;
    const origin = commands.find((scope) => scope.command.execution?.commandId === item?.commandId);
    const cancellation = value.cancellationCommand;
    const scope = value.operation === "cancel_remove" ? commands.find((entry) =>
      entry.command.execution?.commandId === cancellation?.execution?.commandId) : origin;
    if (!origin?.decision || !scope?.decision || !origin.command.execution?.effectId ||
      !scope.command.execution?.effectId || !item || !value.actorId || !value.laneId) {
      gaps.push("production_ai_mutation_native_scope_missing"); continue;
    }
    const command = origin.command;
    const execution = command.execution;
    const scopedExecution = scope.command.execution;
    if (!execution?.effectId || !scopedExecution?.effectId) continue;
    const context = value.originatingCommandContext;
    const purchasing = command.type === "PRODUCTION" || command.type === "RESEARCH";
    const price = Object.fromEntries(Object.values(ResourceType).map((type) => [type,
      origin.acceptedIntent.claims.reduce((sum, claim) => sum +
        (claim.kind === "resource" && claim.resourceType === type ? claim.amount : 0), 0)]));
    if (!purchasing || !context || !isDeepStrictEqual(context.execution, command.execution) ||
      context.playerNumber !== command.playerNumber || !isDeepStrictEqual(context.actorIds, command.actorIds) ||
      item.identitySource !== "command" || item.itemId !== `queue:${value.actorId}:${execution.commandId}` ||
      item.effectId !== execution.effectId || command.actorIds.length !== 1 || command.actorIds[0] !== value.actorId ||
      (command.type === "PRODUCTION" ? item.objectName !== command.actorName || item.researchType !== null :
        command.type !== "RESEARCH" || item.researchType !== command.researchType || item.objectName !== null) ||
      !sameRuntimeQueueVector(item.charge, price) || item.payment === "unknown" ||
      value.snapshotRestoreInProgress || value.gaps.length) {
      failures.push("production_ai_mutation_item_lineage_invalid"); continue;
    }
    if (value.operation === "cancel_remove" ? !cancellation ||
      !sameRuntimeQueueCommand(cancellation, scope.command) ||
      cancellation.execution?.commandId === execution.commandId ||
      (item.researchType !== null ? cancellation.type !== "CANCEL_RESEARCH" : cancellation.type !== "CANCEL_PRODUCTION") ||
      before.tick !== cancellation.tick || cancellation.actorIds.length !== 1 || cancellation.actorIds[0] !== value.actorId :
      cancellation !== null || (value.operation === "enqueue" ? before.tick !== command.tick : before.tick < command.tick)) {
      failures.push("production_ai_mutation_command_time_invalid"); continue;
    }
    if (!origin.outcomes.some((fact) => fact.outcome.kind === "dispatched" && fact.sequence < before.sequence) ||
      !scope.outcomes.some((fact) => fact.outcome.kind === "dispatched" && fact.sequence < before.sequence)) {
      failures.push("production_ai_mutation_admission_missing"); continue;
    }
    if ([origin, scope].some((entry) => entry.outcomes.some((fact) => fact.sequence < before.sequence &&
      ["completed", "cancelled", "rejected", "failed"].includes(fact.outcome.kind)))) {
      failures.push("production_ai_mutation_after_terminal"); continue;
    }
    if (value.operation === "complete_remove") {
      const advanced = capture.facts.filter((fact) => fact.kind === "queue_progress" &&
        fact.sequence < before.sequence && fact.tick === before.tick && fact.progress.phase === "advanced" &&
        fact.progress.actorId === value.actorId && fact.progress.laneId === value.laneId &&
        isDeepStrictEqual(fact.progress.item, item));
      if (value.itemIndex !== 0 || item.remainingTimeMs !== 0 || advanced.length !== 1 ||
        before.boundaryState?.exhaustedProgressItemId !== item.itemId) {
        failures.push("production_ai_mutation_completion_progress_missing"); continue;
      }
      gaps.push("production_ai_mutation_created_effect_authority_missing");
    }
    const repeated = value.operation === "enqueue" ? inserted.has(item.itemId) || removed.has(item.itemId) : removed.has(item.itemId);
    if (repeated) { failures.push("production_ai_mutation_item_reused"); continue; }
    (value.operation === "enqueue" ? inserted : removed).add(item.itemId);
    const interval = validateRuntimeQueueMutationBoundaries(before, after);
    failures.push(...interval.failures); gaps.push(...interval.gaps);
    if (!interval.boundary) continue;
    const left = reconcileRuntimeProductionUnspent(capture, before, commands, payments);
    const right = reconcileRuntimeProductionUnspent(capture, after, commands, payments);
    failures.push(...left.failures, ...right.failures); gaps.push(...left.gaps, ...right.gaps);
    const paidOperations = operations.filter((operation) => operation.kind === "immediate_charge" &&
      operation.originatingCommandId === execution.commandId && operation.itemId === item.itemId &&
      operation.sequence < before.sequence && operation.tick === command.tick && sameRuntimeQueueVector(operation.charged, item.charge));
    const refundOperations = operations.filter((operation) => operation.kind === "cancellation_refund" &&
      operation.originatingCommandId === execution.commandId && operation.commandId === scope.command.execution?.commandId &&
      operation.itemId === item.itemId && operation.tick === before.tick &&
      (item.researchType !== null ? operation.sequence < before.sequence : operation.boundarySequences[0] > after.sequence));
    if (paidOperations.length > 1 || refundOperations.length > 1) {
      failures.push("production_ai_mutation_money_scope_duplicate"); continue;
    }
    const payment = paidOperations[0];
    const refund = refundOperations[0];
    if (value.operation === "enqueue" && item.payment === "immediate" && !payment) {
      gaps.push("production_ai_mutation_enqueue_payment_missing");
    }
    if (value.operation === "cancel_remove") {
      if (!refund) gaps.push("production_ai_mutation_refund_missing");
      if (!origin.outcomes.some((fact) => fact.sequence > after.sequence && fact.tick === after.tick &&
        fact.outcome.kind === "cancelled") || !scope.outcomes.some((fact) => fact.sequence > after.sequence &&
        fact.tick === after.tick && fact.outcome.kind === "cancelled")) gaps.push("production_ai_mutation_cancel_terminal_missing");
    }
    mutations.push({ ...interval.boundary, mutationId: id, operation: value.operation, sequence: after.sequence, tick: after.tick,
      commandId: scopedExecution.commandId, originatingCommandId: execution.commandId,
      effectId: scopedExecution.effectId, planId: scope.acceptedIntent.planId,
      actorId: value.actorId, laneId: value.laneId, itemIndex: value.itemIndex, item,
      reservedUnspentBefore: left.resources, reservedUnspentAfter: right.resources,
      requestedSequence: scope.requestedSequence, requestedTick: scope.requestedTick, scheduledTick: scope.command.tick,
      paymentOperationId: payment?.operationId ?? null, refundOperationId: refund?.operationId ?? null });
  }
  return structuredClone({ mutations: failures.length ? [] : mutations.sort((left, right) => left.sequence - right.sequence),
    failures: [...new Set(failures)], gaps: [...new Set(gaps)] });
}
