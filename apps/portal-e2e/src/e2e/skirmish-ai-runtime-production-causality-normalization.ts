import { normalizeRuntimeProducerRoutes } from "./skirmish-ai-runtime-producer-route-normalization";
import { normalizeRuntimeNativeServices } from "./skirmish-ai-runtime-native-service-normalization";
import { projectRuntimeProductionCancellations } from "./skirmish-ai-runtime-production-cancellations";
import { validateRuntimeQueueRefundPolicy } from "./skirmish-ai-runtime-refund-policy";
import { projectRuntimeProductionCompletions } from "./skirmish-ai-runtime-production-completions";
import { matchRuntimeRejectedAdmission } from "./skirmish-ai-runtime-rejected-admission";
import { projectRuntimeProductionRejections } from "./skirmish-ai-runtime-production-rejections";
import { projectRuntimeProductionQueueMutations } from "./skirmish-ai-runtime-production-queue-mutations";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { isRuntimeQueueCommand, validateRuntimeProductionCommandLineage } from
  "./skirmish-ai-runtime-production-command-lineage";
import { normalizeRuntimeScopedQueuePayments, sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

import { projectRuntimeProductionOperations } from "./skirmish-ai-runtime-production-operation-projection";
import { validateRuntimeProductionProgress } from "./skirmish-ai-runtime-production-progress";
import { matchRuntimeProductionDecision } from "./skirmish-ai-runtime-production-decision-lineage";
import { normalizeRuntimeProductionWorld } from "./skirmish-ai-runtime-production-world-normalization";
import { normalizeRuntimeProductionDecisions } from "./skirmish-ai-runtime-production-decisions";
import { normalizeRuntimeProductionSpatial } from "./skirmish-ai-runtime-production-spatial-normalization";
import { projectRuntimeConstructionCatalog } from "./skirmish-ai-runtime-construction-catalog-projection";
import { normalizeRuntimeConstructionAuthority } from "./skirmish-ai-runtime-construction-authority";
import { projectRuntimeConstructionLineage } from "./skirmish-ai-runtime-construction-lineage-projection";
import { runtimeProductionApplicationGaps } from "./skirmish-ai-runtime-production-application-gaps";
import { projectRuntimeProductionEffectRetention } from "./skirmish-ai-runtime-production-effect-retention-projection";
import { normalizeRuntimeProductionInitialQueues } from "./skirmish-ai-runtime-production-initial-queue-normalization";
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";

/**
 * Pure, bounded by the raw capture limits. Links real dispatch scope to stamped queue authority; no nearest
 * checkpoint, reason string or fixture expectation can supply missing accepted-intent or payment lineage.
 */
export function normalizeRuntimeProductionCausality(
  capture: AiRuntimeProductionCaptureV1, setup?: AiRuntimePresetApplicationV1
): RuntimeProductionCausalityV1 {
  const failures: string[] = [];
  const gaps = new Set(capture.gaps);
  gaps.add("production_ai_event_liabilities_missing");
  gaps.add("production_ai_definition_catalog_missing");
  gaps.add("production_ai_paired_setup_missing");
  const world = normalizeRuntimeProductionWorld(capture);
  failures.push(...world.failures);
  world.gaps.forEach((gap) => gaps.add(gap));
  const initial = normalizeRuntimeProductionInitialQueues(capture, setup);
  failures.push(...initial.failures);
  initial.gaps.forEach((gap) => gaps.add(gap));
  const cadence = normalizeRuntimeProductionDecisions(capture);
  failures.push(...cadence.failures);
  cadence.gaps.forEach((gap) => gaps.add(gap));
  const spatial = normalizeRuntimeProductionSpatial(capture);
  failures.push(...spatial.failures);
  spatial.gaps.forEach((gap) => gaps.add(gap));
  const native = normalizeRuntimeNativeServices(capture), { movement, service, resources } = native;
  failures.push(...native.failures);
  native.gaps.forEach((gap) => gaps.add(gap));
  const construction = normalizeRuntimeConstructionAuthority(capture);
  failures.push(...construction.failures);
  construction.gaps.forEach((gap) => gaps.add(gap));
  const constructionLineage = projectRuntimeConstructionLineage(capture, spatial.authority, construction.records);
  failures.push(...constructionLineage.failures);
  constructionLineage.gaps.forEach((gap) => gaps.add(gap));
  const constructionCatalog = projectRuntimeConstructionCatalog(spatial.authority, constructionLineage.entries);
  failures.push(...constructionCatalog.failures);
  constructionCatalog.gaps.forEach((gap) => gaps.add(gap));
  if (capture.droppedFactCount || capture.droppedSnapshotCount || capture.facts.length > 8192 || capture.snapshots.length > 256) {
    failures.push("production_ai_capture_dropped");
  }
  if (capture.facts.some((fact, index) => fact.playerNumber !== capture.playerNumber ||
    !Number.isSafeInteger(fact.tick) || fact.tick < capture.startedTick ||
    !Number.isSafeInteger(fact.sequence) || fact.sequence <= 0 ||
    (index > 0 && (fact.sequence <= capture.facts[index - 1].sequence || fact.tick < capture.facts[index - 1].tick)))) {
    failures.push("production_ai_capture_order");
  }
  const decisions = capture.facts.filter((fact) => fact.kind === "decision_selected");
  const operationBoundaries = capture.facts.filter((fact) =>
    fact.kind === "queue_resource" || fact.kind === "queue_changed" || fact.kind === "queue_progress" || fact.kind === "queue_mutation");
  for (const fact of capture.facts) {
    if (fact.kind === "queue_completion") fact.completion.gaps.forEach((gap) => gaps.add(gap));
    if (fact.kind === "queue_mutation") fact.mutation.gaps.forEach((gap) => gaps.add(gap));
    if (fact.kind === "queue_progress") fact.progress.gaps.forEach((gap) => gaps.add(gap));
    fact.boundaryState?.gaps.forEach((gap) => gaps.add(gap));
    if (fact.kind === "outcome" || fact.kind === "intent_dispatch") fact.boundaryStateBefore?.gaps.forEach((gap) => gaps.add(gap));
  }
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
      const matched = matchRuntimeRejectedAdmission(capture, request, receipt);
      failures.push(...matched.failures);
      if (matched.scope) admissions.push(matched.scope);
      else { missingDecision = true; gaps.add("production_ai_rejected_admission_authority_missing"); }
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
    const decision = matchRuntimeProductionDecision(request, decisions, command.execution?.authorityEpoch);
    if (!decision.decision) missingDecision = true;
    lineageFailures.push(...decision.failures);
    failures.push(...lineageFailures);
    if (!lineageFailures.length && event.acceptedIntent) commands.push({
      requestedSequence: request.sequence, requestedTick: request.tick, receiptSequence: receipt.sequence,
      acceptedIntent: event.acceptedIntent, decision: decision.decision, requestBoundary: request.boundaryState ?? null,
      command, deliveries: observedDeliveries, outcomes: observedOutcomes
    });
  }
  if (missingDecision || (!commands.length && !admissions.length)) gaps.add("production_ai_committed_decision_link_missing");
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
  const progress = validateRuntimeProductionProgress(capture, commands.map((entry) => entry.command));
  failures.push(...progress.failures);
  progress.gaps.forEach((gap) => gaps.add(gap));
  const queueFacts = capture.facts.filter((fact) => fact.kind === "queue_resource");
  const scoped = queueFacts.filter((fact) => {
    const value = fact.resource;
    if (value.originatingCommandContext?.execution.source !== "ai") return false;
    if (!commands.some((entry) => entry.command.execution?.commandId ===
      value.originatingCommandContext?.execution.commandId)) {
      failures.push("production_ai_unattributed_payment"); return false;
    }
    if (value.payment !== "immediate" && value.operation !== "cancellation_refund") {
      if (value.payment === "unknown") gaps.add("production_ai_payment_mode_unknown");
      else if (value.operation !== "tick_charge") {
        gaps.add("production_ai_per_tick_liability_missing");
      }
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
    failures.push(...validateRuntimeQueueRefundPolicy(value));
  }
  const rejections = projectRuntimeProductionRejections(capture, commands, payments.payments, admissions);
  failures.push(...rejections.failures);
  rejections.gaps.forEach((gap) => gaps.add(gap));
  for (const outcome of outcomes) {
    if (outcome.outcome.kind !== "rejected" || !dispatches.some((request) => request.event.kind === "requested" &&
      isRuntimeQueueCommand(request.event.command) && request.event.correlation.intentId === outcome.outcome.intentId &&
      request.event.correlation.effectId === outcome.outcome.effectId &&
      request.event.correlation.commitmentKey === outcome.outcome.commitmentKey)) continue;
    if (!commands.some((entry) => entry.command.execution?.commandId === outcome.outcome.commandId) &&
      !admissions.some((entry) => entry.outcome?.sequence === outcome.sequence)) failures.push("production_ai_unattributed_rejection");
  }
  const operations = projectRuntimeProductionOperations(capture, commands, payments.payments, progress);
  failures.push(...operations.failures);
  operations.gaps.forEach((gap) => gaps.add(gap));
  const mutations = projectRuntimeProductionQueueMutations(capture, commands, payments.payments, operations.operations);
  failures.push(...mutations.failures);
  mutations.gaps.forEach((gap) => gaps.add(gap));
  const cancellations = projectRuntimeProductionCancellations(capture, commands, mutations.mutations, operations.operations);
  failures.push(...cancellations.failures);
  cancellations.gaps.forEach((gap) => gaps.add(gap));
  const completions = projectRuntimeProductionCompletions(capture, commands, mutations.mutations);
  failures.push(...completions.failures);
  completions.gaps.forEach((gap) => gaps.add(gap));
  const routes = normalizeRuntimeProducerRoutes(capture, commands, completions.completions, spatial.authority);
  failures.push(...routes.failures);
  routes.gaps.forEach((gap) => gaps.add(gap));
  const retention = projectRuntimeProductionEffectRetention(capture, commands, completions.completions, world.snapshots);
  failures.push(...retention.failures);
  retention.gaps.forEach((gap) => gaps.add(gap));
  for (const fact of queueFacts) {
    if (fact.resource.originatingCommandContext?.execution.source !== "ai" ||
      fact.resource.payment !== "per_successful_tick" || fact.resource.operation !== "tick_charge") continue;
    if (!operations.operations.some((operation) => operation.operationId === fact.resource.emission.operationId)) {
      gaps.add("production_ai_per_tick_liability_missing");
    }
  }
  runtimeProductionApplicationGaps(capture, commands, payments.payments, mutations.mutations).forEach((gap) => gaps.add(gap));
  // Invalid operations remain in the raw diagnostic; only a sound group is exposed as normalized money.
  return structuredClone({
    schemaVersion: 1, failures: [...new Set(failures)], gaps: [...gaps].sort(), commands, operationBoundaries,
    worldSnapshots: failures.length ? [] : world.snapshots,
    initialQueues: failures.length ? [] : initial.items,
    decisions: failures.length ? [] : cadence.decisions,
    spatialAuthority: failures.length ? { placements: [], spawns: [], paths: [] } : spatial.authority,
    producerRoutes: failures.length ? { outputs: [], paths: [] } : routes.routes,
    movements: failures.length ? [] : movement.movements,
    serviceAttempts: failures.length ? [] : service.attempts,
    resourceCredits: failures.length ? [] : resources.credits,
    resourceServices: failures.length ? { ...native.resourceServices, needs: [], needAccounting: [], coverage: null, intervals: [] } :
      native.resourceServices,
    constructionAuthority: failures.length ? [] : construction.records,
    initialConstruction: failures.length ? null : constructionLineage.initial,
    constructionLineage: failures.length ? [] : constructionLineage.entries,
    constructionCatalog: failures.length ? [] : constructionCatalog.entries,
    payments: failures.length ? [] : payments.payments, operations: failures.length ? [] : operations.operations,
    completions: failures.length ? [] : completions.completions,
    effectRetention: failures.length ? [] : retention.effects,
    cancellations: failures.length ? [] : cancellations.cancellations,
    queueMutations: failures.length ? [] : mutations.mutations, rejections: failures.length ? [] : rejections.rejections
  } satisfies RuntimeProductionCausalityV1);
}
