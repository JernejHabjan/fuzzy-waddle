import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { isRuntimeQueueCommand, validateRuntimeProductionCommandLineage } from
  "./skirmish-ai-runtime-production-command-lineage";
import { normalizeRuntimeScopedQueuePayments, sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * Pure, bounded by the raw capture limits. Links real dispatch scope to stamped queue authority; no nearest
 * checkpoint, reason string or fixture expectation can supply missing accepted-intent or payment lineage.
 */
export function normalizeRuntimeProductionCausality(capture: AiRuntimeProductionCaptureV1): RuntimeProductionCausalityV1 {
  const failures: string[] = [];
  const gaps = new Set(capture.gaps);
  gaps.add("production_ai_event_liabilities_missing");
  gaps.add("production_ai_committed_decision_link_missing");
  gaps.add("production_ai_definition_catalog_missing");
  gaps.add("production_ai_paired_setup_missing");
  if (capture.droppedFactCount || capture.droppedSnapshotCount) failures.push("production_ai_capture_dropped");
  if (capture.facts.some((fact, index) => fact.playerNumber !== capture.playerNumber ||
    !Number.isSafeInteger(fact.tick) || fact.tick < capture.startedTick ||
    !Number.isSafeInteger(fact.sequence) || fact.sequence <= 0 ||
    (index > 0 && (fact.sequence <= capture.facts[index - 1].sequence || fact.tick < capture.facts[index - 1].tick)))) {
    failures.push("production_ai_capture_order");
  }
  const dispatches = capture.facts.filter((fact) => fact.kind === "intent_dispatch");
  const deliveries = capture.facts.filter((fact) => fact.kind === "command_delivered");
  const outcomes = capture.facts.filter((fact) => fact.kind === "outcome");
  const commands: RuntimeProductionCausalityV1["commands"][number][] = [];
  const matchedReceipts = new Set<number>();
  const commandIds = new Set<string>();
  for (const request of dispatches) {
    if (request.event.kind !== "requested" || !isRuntimeQueueCommand(request.event.command)) continue;
    const event = request.event;
    // Repeated effect retries are separate scopes, fenced by the next request with the same correlation.
    const sameCorrelation = (fact: typeof request) => fact.event.playerNumber === event.playerNumber &&
      fact.event.correlation.intentId === event.correlation.intentId &&
      fact.event.correlation.effectId === event.correlation.effectId &&
      fact.event.correlation.commitmentKey === event.correlation.commitmentKey;
    const next = dispatches.find((fact) => fact.sequence > request.sequence &&
      fact.event.kind === "requested" && sameCorrelation(fact));
    const finishes = dispatches.filter((fact) => fact.sequence > request.sequence &&
      (!next || fact.sequence < next.sequence) && fact.event.kind !== "requested" && sameCorrelation(fact));
    if (finishes.length !== 1) { failures.push("production_ai_dispatch_scope_incomplete"); continue; }
    const receipt = finishes[0];
    matchedReceipts.add(receipt.sequence);
    if (receipt.event.kind === "threw") { failures.push("production_ai_dispatch_threw"); continue; }
    if (receipt.event.kind !== "finished") continue;
    if (receipt.event.receipt.status === "rejected") {
      // Rejected admission has no stamped item; retain a gap rather than pretending it was enqueued.
      gaps.add("production_ai_rejected_admission");
      continue;
    }
    const command = receipt.event.receipt.command;
    const commandId = command.execution?.commandId;
    if (!commandId || commandIds.has(commandId)) {
      failures.push("production_ai_duplicate_or_missing_command"); continue;
    }
    commandIds.add(commandId);
    const observedDeliveries = deliveries.filter((fact) => fact.command.execution?.commandId === commandId);
    const observedOutcomes = outcomes.filter((fact) => fact.outcome.commandId === commandId);
    const lineageFailures = validateRuntimeProductionCommandLineage(request, receipt, command,
      observedDeliveries, observedOutcomes);
    failures.push(...lineageFailures);
    if (!lineageFailures.length && event.acceptedIntent) commands.push({
      requestedSequence: request.sequence, requestedTick: request.tick, receiptSequence: receipt.sequence,
      acceptedIntent: event.acceptedIntent, command, deliveries: observedDeliveries, outcomes: observedOutcomes
    });
  }
  for (const delivery of deliveries) {
    if (isRuntimeQueueCommand(delivery.command) && delivery.command.execution?.source === "ai" &&
      !commands.some((entry) => entry.command.execution?.commandId === delivery.command.execution?.commandId)) {
      failures.push("production_ai_unattributed_delivery");
    }
  }
  for (const receipt of dispatches) {
    if (receipt.event.kind === "finished" && receipt.event.receipt.status === "dispatched" &&
      isRuntimeQueueCommand(receipt.event.receipt.command) && !matchedReceipts.has(receipt.sequence)) {
      failures.push("production_ai_unattributed_receipt");
    }
  }
  const queueFacts = capture.facts.filter((fact) => fact.kind === "queue_resource");
  const scoped = queueFacts.filter((fact) => {
    const value = fact.resource;
    if (value.originatingCommandContext?.execution.source !== "ai") return false;
    if (!commands.some((entry) => entry.command.execution?.commandId ===
      value.originatingCommandContext?.execution.commandId)) {
      failures.push("production_ai_unattributed_payment"); return false;
    }
    if (value.payment !== "immediate") {
      gaps.add(value.payment === "unknown" ? "production_ai_payment_mode_unknown" : "production_ai_per_tick_liability_missing");
      return false;
    }
    if (value.emission.phase === "denied") { gaps.add("production_ai_denied_payment"); return false; }
    return true;
  });
  const payments = normalizeRuntimeScopedQueuePayments({ ...capture, facts: scoped },
    commands.map((entry) => entry.command));
  failures.push(...payments.failures);
  for (const payment of payments.payments) {
    const value = payment.resource;
    if (value.operation === "immediate_charge" && !sameRuntimeQueueVector(value.storedPrice, value.emission.requested)) {
      failures.push("production_ai_charge_stored_price_mismatch");
    }
    if (value.operation === "cancellation_refund") {
      if (value.refundFactor === null || !Number.isFinite(value.refundFactor) ||
        value.refundFactor < 0 || value.refundFactor > 1 || value.totalTimeMs === null || value.remainingTimeMs === null ||
        Object.values(ResourceType).some((resource) => (value.emission.requested?.[resource] ?? 0) !==
          Math.floor((value.storedPrice?.[resource] ?? 0) * (value.refundFactor ?? 0) *
            (1 - ((value.totalTimeMs ?? 0) - (value.remainingTimeMs ?? 0)) / (value.totalTimeMs ?? 0))))) {
        failures.push("production_ai_refund_progress_mismatch");
      }
    }
  }
  for (const entry of commands) {
    const id = entry.command.execution?.commandId;
    const purchasing = entry.command.type === "PRODUCTION" || entry.command.type === "RESEARCH";
    const applied = entry.outcomes.some((fact) => fact.outcome.kind === "applied");
    const cancelled = entry.outcomes.some((fact) => fact.outcome.kind === "cancelled");
    if (purchasing && applied && !payments.payments.some((payment) =>
      payment.resource.operation === "immediate_charge" &&
      payment.resource.originatingCommandContext?.execution.commandId === id)) {
      gaps.add("production_ai_applied_payment_missing");
    }
    if (!purchasing && cancelled && !payments.payments.some((payment) =>
      payment.resource.operation === "cancellation_refund" && payment.resource.cancellationCommand?.execution?.commandId === id)) {
      gaps.add("production_ai_cancel_refund_missing");
    }
  }
  // Invalid operations remain in the raw diagnostic; only a sound group is exposed as normalized money.
  return structuredClone({
    schemaVersion: 1, failures: [...new Set(failures)], gaps: [...gaps].sort(), commands,
    payments: failures.length ? [] : payments.payments
  } satisfies RuntimeProductionCausalityV1);
}
