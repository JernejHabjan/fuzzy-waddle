import { ResourceType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";

/** Numeric comparison accepts sparse definition costs and full authority balances, without accepting non-finite money. */
export function sameRuntimeQueueVector(
  left: Readonly<Partial<Record<ResourceType, number>>> | null | undefined,
  right: Readonly<Partial<Record<ResourceType, number>>> | null | undefined
): boolean {
  return (
    !!left &&
    !!right &&
    Object.values(ResourceType).every(
      (type) =>
        Number.isFinite(left[type] ?? 0) &&
        Number.isFinite(right[type] ?? 0) &&
        (left[type] ?? 0) >= 0 &&
        (right[type] ?? 0) >= 0 &&
        (left[type] ?? 0) === (right[type] ?? 0)
    )
  );
}

/** Actual immediate charges and either native refund policy; per-tick charges require their own progress interval. */
export function normalizeRuntimeScopedQueuePayments(
  capture: AiRuntimeProductionCaptureV1,
  commands: readonly GameCommand[]
) {
  const failures: string[] = [];
  const resources = capture.facts.filter((fact) => fact.kind === "queue_resource");
  const finished = resources.filter((fact) => fact.resource.emission.phase === "finished");
  if (resources.length !== finished.length * 3) failures.push("scoped_queue_operation_incomplete");
  const payments = finished.flatMap((fact) => {
    const value = fact.resource;
    const emission = value.emission;
    if (emission.phase !== "finished") return [];
    const context = value.originatingCommandContext;
    const origin = commands.find((command) => command.execution?.commandId === context?.execution.commandId);
    const cancellation = commands.find(
      (command) => command.execution?.commandId === value.cancellationCommand?.execution?.commandId
    );
    const group = resources.filter((entry) => entry.resource.emission.operationId === emission.operationId);
    const start = group.filter((entry) => entry.resource.emission.phase === "started");
    const callback = group.filter((entry) => entry.resource.emission.phase === "callback");
    const startFact = start[0];
    const callbackFact = callback[0];
    if (
      !Number.isSafeInteger(emission.operationId) ||
      emission.operationId <= 0 ||
      value.gaps.length ||
      !value.actorId ||
      value.ownerNumber !== capture.playerNumber ||
      !context ||
      !origin ||
      context.playerNumber !== capture.playerNumber ||
      context.actorIds.length !== 1 ||
      context.actorIds[0] !== value.actorId ||
      origin.playerNumber !== context.playerNumber ||
      origin.actorIds.length !== 1 ||
      origin.actorIds[0] !== value.actorId ||
      !(
        [
          "schemaVersion",
          "commandId",
          "commitmentKey",
          "source",
          "authorityEpoch",
          "sequence",
          "intentId",
          "effectId"
        ] as const
      ).every((key) => context.execution[key] === origin.execution?.[key]) ||
      value.identitySource !== "command" ||
      value.itemId !== `queue:${value.actorId}:${context.execution.commandId}` ||
      (value.payment !== "immediate" &&
        !(
          value.operation === "cancellation_refund" &&
          value.payment === "per_successful_tick" &&
          origin.type === "PRODUCTION"
        )) ||
      !value.storedPrice ||
      value.totalTimeMs === null ||
      value.totalTimeMs <= 0 ||
      value.remainingTimeMs === null ||
      value.remainingTimeMs < 0 ||
      value.remainingTimeMs > value.totalTimeMs ||
      (origin.type === "PRODUCTION"
        ? value.objectName !== origin.actorName || value.researchType !== null
        : origin.type !== "RESEARCH" || value.researchType !== origin.researchType || value.objectName !== null) ||
      (value.operation === "cancellation_refund"
        ? !value.cancellationCommand ||
          !cancellation ||
          !sameRuntimeQueueCommand(value.cancellationCommand, cancellation) ||
          cancellation.playerNumber !== capture.playerNumber ||
          cancellation.actorIds.length !== 1 ||
          cancellation.actorIds[0] !== value.actorId ||
          (origin.type === "RESEARCH"
            ? cancellation.type !== "CANCEL_RESEARCH"
            : cancellation.type !== "CANCEL_PRODUCTION") ||
          cancellation.execution?.commandId === origin.execution?.commandId ||
          cancellation.tick !== fact.tick
        : value.operation !== "immediate_charge" || value.cancellationCommand !== null || origin.tick !== fact.tick) ||
      emission.status !== "returned" ||
      emission.snapshotRestoreInProgress ||
      emission.nestedEmission ||
      emission.callbackCount !== 1 ||
      emission.callbackLimitExceeded ||
      !emission.balanceMatches ||
      !emission.before ||
      !emission.after ||
      !emission.requested ||
      group.length !== 3 ||
      start.length !== 1 ||
      callback.length !== 1 ||
      !startFact ||
      !callbackFact ||
      startFact.sequence >= callbackFact.sequence ||
      callbackFact.sequence >= fact.sequence ||
      group.some(
        (entry) =>
          entry.tick !== fact.tick ||
          entry.resource.gaps.length ||
          entry.boundaryState?.snapshotRestoreInProgress ||
          entry.resource.actorId !== value.actorId ||
          entry.resource.ownerNumber !== value.ownerNumber ||
          entry.resource.itemId !== value.itemId ||
          entry.resource.operation !== value.operation ||
          entry.resource.identitySource !== value.identitySource ||
          entry.resource.objectName !== value.objectName ||
          entry.resource.researchType !== value.researchType ||
          entry.resource.payment !== value.payment ||
          entry.resource.refundFactor !== value.refundFactor ||
          entry.resource.totalTimeMs !== value.totalTimeMs ||
          entry.resource.remainingTimeMs !== value.remainingTimeMs ||
          !sameRuntimeQueueVector(entry.resource.storedPrice, value.storedPrice) ||
          entry.resource.emission.snapshotRestoreInProgress ||
          entry.resource.originatingCommandContext?.execution.commandId !== context?.execution.commandId ||
          entry.resource.originatingCommandContext?.playerNumber !== context?.playerNumber ||
          entry.resource.originatingCommandContext?.actorIds.length !== 1 ||
          entry.resource.originatingCommandContext?.actorIds[0] !== value.actorId ||
          !(
            ["schemaVersion", "commitmentKey", "source", "authorityEpoch", "sequence", "intentId", "effectId"] as const
          ).every((key) => entry.resource.originatingCommandContext?.execution[key] === context?.execution[key]) ||
          entry.resource.cancellationCommand?.execution?.commandId !==
            value.cancellationCommand?.execution?.commandId ||
          (entry.resource.cancellationCommand &&
            !sameRuntimeQueueCommand(entry.resource.cancellationCommand, value.cancellationCommand ?? undefined)) ||
          !sameRuntimeQueueVector(entry.resource.emission.before, emission.before) ||
          !sameRuntimeQueueVector(entry.resource.emission.requested, emission.requested) ||
          (entry.resource.emission.phase === "callback" &&
            (entry.resource.emission.callbackOrdinal !== 1 ||
              !sameRuntimeQueueVector(entry.resource.emission.amounts, emission.requested)))
      )
    ) {
      failures.push("scoped_queue_payment_lineage_invalid");
    }
    for (const resource of Object.values(ResourceType)) {
      if (
        emission.after?.[resource] !==
        (emission.before?.[resource] ?? Number.NaN) +
          (value.operation === "cancellation_refund" ? 1 : -1) * (emission.requested?.[resource] ?? 0)
      ) {
        failures.push("scoped_queue_payment_balance_invalid");
      }
    }
    return [{ sequence: fact.sequence, tick: fact.tick, resource: { ...value, emission } }];
  });
  return { failures: [...new Set(failures)], payments };
}
