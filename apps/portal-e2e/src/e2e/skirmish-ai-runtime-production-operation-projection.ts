import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionOperationV1 } from "./skirmish-ai-runtime-production-operation";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";
import { validateRuntimeProductionProgress } from "./skirmish-ai-runtime-production-progress";
import { isRuntimeProductionBalance, reconcileRuntimeProductionUnspent } from "./skirmish-ai-runtime-production-unspent";

/**
 * Projects actual complete payment/progress intervals. Raw gaps remain attached; a resolved callback interval is
 * recorded by sequence rather than deleting a global authority gap. Null unspent ownership never becomes zero.
 */
export function projectRuntimeProductionOperations(
  capture: AiRuntimeProductionCaptureV1,
  commands: RuntimeProductionCausalityV1["commands"],
  payments: RuntimeProductionCausalityV1["payments"],
  progress = validateRuntimeProductionProgress(capture, commands.map((scope) => scope.command))
) {
  const failures = [...progress.failures];
  const gaps: string[] = [];
  const operations: RuntimeProductionOperationV1[] = [];
  const used = new Set<number>();
  const zero: Record<ResourceType, number> = { food: 0, wood: 0, stone: 0, minerals: 0 };
  const interval = (before: AiRuntimeProductionFactV1, after: AiRuntimeProductionFactV1) => {
    const left = before.boundaryState;
    const right = after.boundaryState;
    if (!left?.resources || !right?.resources || !left.queues || !right.queues || !left.obligations || !right.obligations) {
      gaps.push("production_ai_operation_boundary_missing"); return null;
    }
    if (!isRuntimeProductionBalance(left.resources) || !isRuntimeProductionBalance(right.resources) ||
      !isRuntimeProductionBalance(left.obligations) || !isRuntimeProductionBalance(right.obligations) ||
      !sameRuntimeQueueVector(calculateRuntimeQueueLiabilities(left.queues, left.exhaustedProgressItemId), left.obligations) ||
      !sameRuntimeQueueVector(calculateRuntimeQueueLiabilities(right.queues, right.exhaustedProgressItemId), right.obligations)) {
      failures.push("production_ai_operation_absolute_boundary_invalid"); return null;
    }
    const unspentBefore = reconcileRuntimeProductionUnspent(capture, before, commands, payments);
    const unspentAfter = reconcileRuntimeProductionUnspent(capture, after, commands, payments);
    failures.push(...unspentBefore.failures, ...unspentAfter.failures);
    gaps.push(...unspentBefore.gaps, ...unspentAfter.gaps);
    return { resourcesBefore: left.resources, resourcesAfter: right.resources,
      obligationsDue: left.obligations, obligationsAfter: right.obligations,
      reservedUnspentBefore: unspentBefore.resources, reservedUnspentAfter: unspentAfter.resources,
      boundarySequences: [before.sequence, after.sequence] as const };
  };
  const claimInterval = (before: AiRuntimeProductionFactV1, after: AiRuntimeProductionFactV1,
    origin: RuntimeProductionCausalityV1["commands"][number], charging: boolean) => {
    const left = before.boundaryState?.unspentClaims;
    const right = after.boundaryState?.unspentClaims;
    if (!left?.resources || !right?.resources) return false;
    const expected = left.entries.map((entry) => charging && entry.commandId === origin.command.execution?.commandId
      ? { ...entry, state: "paid" as const } : entry);
    if (!isDeepStrictEqual(expected, right.entries) || (charging && !left.entries.some((entry) =>
      entry.commandId === origin.command.execution?.commandId && entry.state === "admitted"))) {
      failures.push("production_ai_operation_unspent_interval_invalid"); return false;
    }
    return true;
  };
  for (const payment of payments) {
    const value = payment.resource;
    const emission = value.emission;
    const group = capture.facts.filter((fact) => fact.kind === "queue_resource" &&
      fact.resource.emission.operationId === emission.operationId);
    const start = group.find((fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "started");
    const finish = group.find((fact) => fact.sequence === payment.sequence);
    const origin = commands.find((scope) => scope.command.execution?.commandId ===
      value.originatingCommandContext?.execution.commandId);
    const scope = value.operation === "cancellation_refund" ? commands.find((entry) =>
      entry.command.execution?.commandId === value.cancellationCommand?.execution?.commandId) : origin;
    if (!start || !finish || !origin?.decision || !scope?.decision || !scope.command.execution?.effectId ||
      !origin.command.execution || !value.actorId || !value.itemId || !emission.requested) {
      gaps.push("production_ai_operation_decision_or_scope_missing"); continue;
    }
    if ([value.storedPrice, emission.requested].some((vector) => !vector || Object.entries(vector).some(([key, amount]) =>
      !Object.values(ResourceType).some((type) => type === key) || typeof amount !== "number" ||
      !Number.isFinite(amount) || amount < 0))) {
      failures.push("production_ai_operation_stored_vector_invalid"); continue;
    }
    const sampled = interval(start, finish);
    if (!sampled) continue;
    if (used.has(emission.operationId) || !isDeepStrictEqual(start.boundaryState?.queues, finish.boundaryState?.queues) ||
      !sameRuntimeQueueVector(sampled.resourcesBefore, emission.before) ||
      !sameRuntimeQueueVector(sampled.resourcesAfter, emission.after) ||
      !sameRuntimeQueueVector(sampled.obligationsDue, sampled.obligationsAfter)) {
      failures.push("production_ai_operation_payment_boundary_invalid"); continue;
    }
    used.add(emission.operationId);
    const charging = value.operation === "immediate_charge";
    const claimsSettled = claimInterval(start, finish, origin, charging);
    const callback = group.find((fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "callback");
    // Only this complete immediate interval may explain its own transient ledger gap. Keep the raw gap unchanged.
    const callbackGaps = callback?.boundaryState?.unspentClaims?.gaps;
    const resolved = charging && claimsSettled && sampled.reservedUnspentBefore && sampled.reservedUnspentAfter &&
      callback && callback.boundaryState?.unspentClaims?.resources === null && callbackGaps?.length === 1 &&
      callbackGaps[0] === "unspent_payment_in_progress" &&
      sameRuntimeQueueVector(callback.boundaryState.resources, sampled.resourcesAfter) &&
      sameRuntimeQueueVector(callback.boundaryState.obligations, sampled.obligationsDue) &&
      isDeepStrictEqual(callback.boundaryState.queues, start.boundaryState?.queues) &&
      isDeepStrictEqual(callback.boundaryState.unspentClaims.entries, start.boundaryState?.unspentClaims?.entries)
      ? [callback.sequence] : [];
    const amounts = Object.fromEntries(Object.values(ResourceType).map((type) => [type, emission.requested?.[type] ?? 0]));
    operations.push({ ...sampled, sequence: finish.sequence, tick: finish.tick,
      kind: charging ? "immediate_charge" : "cancellation_refund", commandId: scope.command.execution.commandId,
      originatingCommandId: origin.command.execution.commandId, effectId: scope.command.execution.effectId,
      planId: scope.acceptedIntent.planId, actorId: value.actorId, itemId: value.itemId, operationId: emission.operationId,
      laneId: null, attemptId: null, remainingSuccessfulTicks: null,
      charged: charging ? { ...zero, ...amounts } : zero, refundAmounts: charging ? zero : { ...zero, ...amounts },
      reconciledCallbackSequences: resolved });
  }
  const attempts = capture.facts.filter((fact) => fact.kind === "queue_progress");
  for (const start of attempts.filter((fact) => fact.progress.phase === "started")) {
    const end = attempts.find((fact) => fact.progress.attemptId === start.progress.attemptId && fact.progress.phase !== "started");
    const item = start.progress.item;
    if (!end || !item || item.payment !== "per_successful_tick" || end.progress.phase === "threw") continue;
    const origin = commands.find((scope) => scope.command.execution?.commandId === item.commandId);
    if (!origin?.decision || !origin.command.execution?.effectId || !start.progress.actorId || !start.progress.laneId) {
      gaps.push("production_ai_operation_decision_or_scope_missing"); continue;
    }
    const resources = capture.facts.filter((fact) => fact.kind === "queue_resource" &&
      fact.sequence > start.sequence && fact.sequence < end.sequence);
    const operation = resources[0];
    if (!operation || operation.kind !== "queue_resource") continue;
    const sampled = interval(start, end);
    if (!sampled) continue;
    const id = operation.resource.emission.operationId;
    if (used.has(id)) { failures.push("production_ai_operation_id_reused"); continue; }
    used.add(id);
    claimInterval(start, end, origin, false);
    const charged = end.progress.phase === "advanced";
    operations.push({ ...sampled, sequence: end.sequence, tick: end.tick, kind: charged ? "tick_charge" : "tick_denied",
      commandId: origin.command.execution.commandId, originatingCommandId: origin.command.execution.commandId,
      effectId: origin.command.execution.effectId, planId: origin.acceptedIntent.planId, actorId: start.progress.actorId,
      itemId: item.itemId, laneId: start.progress.laneId, attemptId: start.progress.attemptId, operationId: id,
      remainingSuccessfulTicks: Math.max(1, Math.ceil(item.remainingTimeMs / 50)),
      charged: charged ? { ...zero, ...item.charge } : zero, refundAmounts: zero, reconciledCallbackSequences: [] });
  }
  return structuredClone({ operations: failures.length ? [] : operations.sort((left, right) => left.sequence - right.sequence),
    failures: [...new Set(failures)], gaps: [...new Set(gaps)] });
}
