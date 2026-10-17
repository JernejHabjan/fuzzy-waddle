// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { matchRuntimeRejectedAdmission } from "./skirmish-ai-runtime-rejected-admission";
import {
  isRuntimeQueueCommand,
  validateRuntimeProductionCommandLineage
} from "./skirmish-ai-runtime-production-command-lineage";
import { matchRuntimeProductionDecision } from "./skirmish-ai-runtime-production-decision-lineage";

/** Keeps each request/retry paired with its exact selected intent, receipt and stamped application outcomes. */
export function normalizeRuntimeProductionCommands(capture: AiRuntimeProductionCaptureV1) {
  const failures: string[] = [];
  const gaps = new Set<string>();
  const decisions = capture.facts.filter((fact) => fact.kind === "decision_selected");
  let missingDecision = false;
  const dispatches = capture.facts.filter((fact) => fact.kind === "intent_dispatch");
  const deliveries = capture.facts.filter((fact) => fact.kind === "command_delivered");
  const outcomes = capture.facts.filter((fact) => fact.kind === "outcome");
  const commands: RuntimeProductionCausalityV1["commands"][number][] = [];
  const admissions: NonNullable<ReturnType<typeof matchRuntimeRejectedAdmission>["scope"]>[] = [];
  const matchedReceipts = new Set<number>();
  const commandIds = new Set<string>();
  for (const request of dispatches) {
    if (request.event.kind !== "requested" || !isRuntimeQueueCommand(request.event.command)) continue;
    const event = request.event;
    // Repeated effect retries are separate scopes, fenced by the next request with the same correlation.
    const sameCorrelation = (fact: typeof request) =>
      fact.event.playerNumber === event.playerNumber &&
      fact.event.correlation.intentId === event.correlation.intentId &&
      fact.event.correlation.effectId === event.correlation.effectId &&
      fact.event.correlation.commitmentKey === event.correlation.commitmentKey;
    const next = dispatches.find(
      (fact) => fact.sequence > request.sequence && fact.event.kind === "requested" && sameCorrelation(fact)
    );
    const finishes = dispatches.filter(
      (fact) =>
        fact.sequence > request.sequence &&
        (!next || fact.sequence < next.sequence) &&
        fact.event.kind !== "requested" &&
        sameCorrelation(fact)
    );
    const receipt = finishes[0];
    if (finishes.length !== 1 || !receipt) {
      failures.push("production_ai_dispatch_scope_incomplete");
      continue;
    }
    matchedReceipts.add(receipt.sequence);
    if (receipt.event.kind === "threw") {
      failures.push("production_ai_dispatch_threw");
      continue;
    }
    if (receipt.event.kind !== "finished") continue;
    if (receipt.event.receipt.status === "rejected") {
      const matched = matchRuntimeRejectedAdmission(capture, request, receipt);
      failures.push(...matched.failures);
      if (matched.scope) admissions.push(matched.scope);
      else {
        missingDecision = true;
        gaps.add("production_ai_rejected_admission_authority_missing");
      }
      continue;
    }
    const command = receipt.event.receipt.command;
    const commandId = command.execution?.commandId;
    if (!commandId || commandIds.has(commandId)) {
      failures.push("production_ai_duplicate_or_missing_command");
      continue;
    }
    commandIds.add(commandId);
    const observedDeliveries = deliveries.filter((fact) => fact.command.execution?.commandId === commandId);
    const observedOutcomes = outcomes.filter((fact) => fact.outcome.commandId === commandId);
    const lineageFailures = validateRuntimeProductionCommandLineage(
      request,
      receipt,
      command,
      observedDeliveries,
      observedOutcomes
    );
    const decision = matchRuntimeProductionDecision(request, decisions, command.execution?.authorityEpoch);
    if (!decision.decision) missingDecision = true;
    lineageFailures.push(...decision.failures);
    failures.push(...lineageFailures);
    if (!lineageFailures.length && event.acceptedIntent)
      commands.push({
        requestedSequence: request.sequence,
        requestedTick: request.tick,
        receiptSequence: receipt.sequence,
        acceptedIntent: event.acceptedIntent,
        decision: decision.decision,
        requestBoundary: request.boundaryState ?? null,
        command,
        deliveries: observedDeliveries,
        outcomes: observedOutcomes
      });
  }
  if (missingDecision || (!commands.length && !admissions.length))
    gaps.add("production_ai_committed_decision_link_missing");
  for (const delivery of deliveries) {
    if (
      isRuntimeQueueCommand(delivery.command) &&
      delivery.command.execution?.source === "ai" &&
      !commands.some((entry) => entry.command.execution?.commandId === delivery.command.execution?.commandId)
    ) {
      failures.push("production_ai_unattributed_delivery");
    }
  }
  for (const receipt of dispatches) {
    if (
      receipt.event.kind === "finished" &&
      receipt.event.receipt.status === "dispatched" &&
      isRuntimeQueueCommand(receipt.event.receipt.command) &&
      !matchedReceipts.has(receipt.sequence)
    ) {
      failures.push("production_ai_unattributed_receipt");
    }
  }
  return { commands, admissions, failures, gaps: [...gaps] };
}
