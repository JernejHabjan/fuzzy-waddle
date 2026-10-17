import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionCancellationV1 } from "./skirmish-ai-runtime-production-cancellation";
import { matchRuntimeCancellationPaidLineage } from "./skirmish-ai-runtime-cancellation-paid-lineage";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Joins distinct accepted cancel execution to original paid item, exact removal/refund and both native terminals. */
export function projectRuntimeProductionCancellations(
  capture: AiRuntimeProductionCaptureV1, commands: RuntimeProductionCausalityV1["commands"],
  mutations: RuntimeProductionCausalityV1["queueMutations"], operations: RuntimeProductionCausalityV1["operations"]
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  const cancellations: RuntimeProductionCancellationV1[] = [];
  const usedRefunds = new Set<number>();
  for (const removal of mutations.filter((entry) => entry.operation === "cancel_remove")) {
    const origin = commands.find((entry) => entry.command.execution?.commandId === removal.originatingCommandId);
    const cancel = commands.find((entry) => entry.command.execution?.commandId === removal.commandId);
    if (!origin || !cancel) { gaps.push("production_ai_cancel_native_scope_missing"); continue; }
    const terminals = (scope: RuntimeProductionCausalityV1["commands"][number]) => scope.outcomes.filter((entry) =>
      ["completed", "cancelled", "failed", "rejected"].includes(entry.outcome.kind));
    const originalTerminals = terminals(origin);
    const cancelTerminals = terminals(cancel);
    // Inspect supplied contradictions before missing refund/payment/terminal gaps.
    if ([...originalTerminals, ...cancelTerminals].some((entry) => entry.outcome.kind !== "cancelled" ||
      entry.outcome.reason !== "cancelled" || entry.outcome.worldLinkIds.length || entry.tick !== removal.tick ||
      entry.sequence <= removal.sequence || entry.boundaryState?.snapshotRestoreInProgress) ||
      originalTerminals.length > 1 || cancelTerminals.length > 1 ||
      cancel.outcomes.some((entry) => ["applied", "active"].includes(entry.outcome.kind))) {
      failures.push("production_ai_cancel_terminal_conflict"); continue;
    }
    const refunds = operations.filter((entry) => entry.kind === "cancellation_refund" &&
      entry.originatingCommandId === removal.originatingCommandId && entry.commandId === removal.commandId);
    if (refunds.length > 1) { failures.push("production_ai_cancel_refund_reused"); continue; }
    const refund = refunds[0];
    const raw = capture.facts.find((entry) => entry.kind === "queue_resource" &&
      entry.resource.emission.operationId === refund?.operationId && entry.resource.emission.phase === "finished");
    if (refund && raw?.kind === "queue_resource" && (refund.itemId !== removal.item.itemId ||
      refund.actorId !== removal.actorId || refund.tick !== removal.tick ||
      raw.resource.payment !== removal.item.payment || raw.resource.totalTimeMs !== removal.item.totalTimeMs ||
      raw.resource.remainingTimeMs !== removal.item.remainingTimeMs ||
      raw.resource.objectName !== removal.item.objectName || raw.resource.researchType !== removal.item.researchType ||
      !sameRuntimeQueueVector(raw.resource.storedPrice, removal.item.charge))) {
      failures.push("production_ai_cancel_refund_item_mismatch"); continue;
    }
    const paid = matchRuntimeCancellationPaidLineage(capture, removal, mutations, operations);
    failures.push(...paid.failures); gaps.push(...paid.gaps);
    const originalTerminal = originalTerminals[0];
    const cancelTerminal = cancelTerminals[0];
    if (!originalTerminal || !cancelTerminal) gaps.push("production_ai_cancel_terminal_missing");
    if (!refund || !raw) gaps.push("production_ai_cancel_refund_authority_missing");
    if (!origin.outcomes.some((entry) => entry.outcome.kind === "applied" && entry.sequence < removal.boundarySequences[0])) {
      gaps.push("production_ai_cancel_purchase_application_missing"); continue;
    }
    const research = removal.item.researchType !== null;
    if (refund && originalTerminal && cancelTerminal && (usedRefunds.has(refund.operationId) ||
      cancelTerminal.sequence <= originalTerminal.sequence || cancelTerminal.sequence <= refund.sequence ||
      (research ? refund.sequence >= removal.boundarySequences[0] :
        refund.boundarySequences[0] <= originalTerminal.sequence))) {
      failures.push("production_ai_cancel_native_order_invalid"); continue;
    }
    if (!originalTerminal || !cancelTerminal || !refund || !raw || paid.sequences === null) continue;
    usedRefunds.add(refund.operationId);
    cancellations.push({ commandId: removal.commandId, originatingCommandId: removal.originatingCommandId,
      effectId: removal.effectId, planId: removal.planId, item: removal.item, actorId: removal.actorId, laneId: removal.laneId,
      requestedSequence: removal.requestedSequence, requestedTick: removal.requestedTick, scheduledTick: removal.scheduledTick,
      removal, refund, paidOperationSequences: paid.sequences, originatingTerminalSequence: originalTerminal.sequence,
      cancellationTerminalSequence: cancelTerminal.sequence, terminalTick: cancelTerminal.tick });
  }
  for (const scope of commands) {
    if (!["CANCEL_PRODUCTION", "CANCEL_RESEARCH"].includes(scope.command.type)) continue;
    if (scope.outcomes.some((entry) => ["applied", "active", "completed"].includes(entry.outcome.kind) ||
      (entry.outcome.kind === "cancelled" && (entry.outcome.reason !== "cancelled" || entry.outcome.worldLinkIds.length ||
        entry.tick !== scope.command.tick || entry.boundaryState?.snapshotRestoreInProgress))) ||
      (scope.outcomes.some((entry) => entry.outcome.kind === "cancelled") &&
        scope.outcomes.some((entry) => ["failed", "rejected"].includes(entry.outcome.kind)))) {
      failures.push("production_ai_cancel_terminal_conflict");
    }
    if (!scope.outcomes.some((entry) => entry.outcome.kind === "cancelled")) continue;
    if (!cancellations.some((entry) => entry.commandId === scope.command.execution?.commandId)) {
      gaps.push("production_ai_cancel_lifecycle_authority_missing");
    }
  }
  return structuredClone({ cancellations: failures.length ? [] : cancellations,
    failures: [...new Set(failures)], gaps: [...new Set(gaps)] });
}
