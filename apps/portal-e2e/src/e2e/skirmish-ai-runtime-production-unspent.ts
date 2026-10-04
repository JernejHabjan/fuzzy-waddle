import { matchRuntimeRejectedAdmission } from "./skirmish-ai-runtime-rejected-admission";
import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Full shared balances require every resource and reject unknown fields; sparse stored prices are separate. */
export function isRuntimeProductionBalance(value: Readonly<Partial<Record<ResourceType, number>>> | null | undefined) {
  return !!value && Object.keys(value).length === Object.values(ResourceType).length &&
    Object.values(ResourceType).every((type) => typeof value[type] === "number" &&
      Number.isFinite(value[type]) && (value[type] ?? -1) >= 0);
}

/**
 * Independently reconciles the captured queue-claim subset at one exact callback. Native accepted leases, admission,
 * completed scoped payment and physical liability transfer justify each state. Missing global/non-queue ownership
 * remains null; this does not replace the full production reservation/cadence authority. beforeCallback excludes
 * the enclosing event from lifecycle reconciliation while retaining its real sampled physical state and sequence.
 */
export function reconcileRuntimeProductionUnspent(
  capture: AiRuntimeProductionCaptureV1,
  fact: AiRuntimeProductionFactV1,
  commands: RuntimeProductionCausalityV1["commands"],
  payments: RuntimeProductionCausalityV1["payments"],
  beforeCallback = false
) {
  const ledger = fact.boundaryState?.unspentClaims;
  const failures: string[] = [];
  const gaps: string[] = [];
  const missing = () => ({ resources: null, failures, gaps: [...gaps, "production_ai_operation_unspent_missing"] });
  if (!ledger?.resources || ledger.gaps.length) return missing();
  const cutoff = fact.sequence - (beforeCallback ? 1 : 0);
  const prefix = capture.facts.filter((entry) => entry.sequence <= cutoff);
  const decisions = prefix.filter((entry) => entry.kind === "decision_selected");
  const latest = decisions[decisions.length - 1];
  if (!latest) return missing();
  if (ledger.entries.length > 512 || !isRuntimeProductionBalance(ledger.resources) ||
    new Set(ledger.entries.map((entry) => entry.intent.effectId)).size !== ledger.entries.length) {
    failures.push("production_ai_operation_unspent_shape_invalid");
  }
  const resources: Record<ResourceType, number> = { food: 0, wood: 0, stone: 0, minerals: 0 };
  for (const entry of ledger.entries) {
    const selections = decisions.filter((decision) => isDeepStrictEqual(decision.decision.identity, entry.identity));
    const selected = selections[0];
    const intent = entry.intent;
    const claims = intent.claims.filter((claim) => claim.kind === "resource");
    if (intent.kind !== "produce" && intent.kind !== "research") {
      gaps.push("production_ai_operation_non_queue_unspent_missing"); continue;
    }
    if (selections.length !== 1 || !selected || entry.identity.playerNumber !== capture.playerNumber ||
      entry.identity.tick !== selected.tick || intent.proposedTick > entry.identity.tick ||
      [entry.identity.tick, entry.identity.generation, entry.identity.decisionSequence, entry.identity.authorityEpoch]
        .some((value) => !Number.isSafeInteger(value) || value < 0) ||
      selected.decision.acceptedIntents.filter((candidate) => isDeepStrictEqual(candidate, intent)).length !== 1 ||
      selected.decision.decisions.filter((candidate) => candidate.outcome === "accepted" && candidate.reason === "accepted" &&
        isDeepStrictEqual(candidate.intent, intent)).length !== 1 ||
      new Set(claims.map((claim) => claim.claimId)).size !== claims.length ||
      claims.some((claim) => !Object.values(ResourceType).includes(claim.resourceType) ||
        !Number.isFinite(claim.amount) || claim.amount < 0 || selected.decision.reservations.filter((lease) =>
          lease.claimId === claim.claimId && lease.ownerPlanId === intent.planId &&
          lease.subjectKey === `resource:${claim.resourceType}` && lease.createdTick === entry.identity.tick &&
          lease.state.kind === "provisional" && lease.state.expiresAt.clock === "simulation" &&
          lease.state.expiresAt.unit === "tick" && lease.state.expiresAt.persistence === "save" &&
          Number.isSafeInteger(lease.state.expiresAt.dueTick) && lease.state.expiresAt.dueTick > entry.identity.tick).length !== 1)) {
      failures.push("production_ai_operation_unspent_selection_invalid"); continue;
    }
    if (entry.state === "released" && entry.commandId === null) {
      const requests = prefix.filter((candidate) => candidate.kind === "intent_dispatch" &&
        candidate.event.kind === "requested" && isDeepStrictEqual(candidate.event.acceptedIntent, intent) &&
        isDeepStrictEqual(candidate.event.decisionIdentity, entry.identity));
      const releases = requests.flatMap((request) => prefix.flatMap((receipt) => {
        if (request.kind !== "intent_dispatch" || receipt.kind !== "intent_dispatch" || receipt.event.kind !== "finished" ||
          receipt.event.receipt.status !== "rejected" || !isDeepStrictEqual(receipt.event.correlation, request.event.correlation) ||
          receipt.sequence <= request.sequence) return [];
        const matched = matchRuntimeRejectedAdmission(capture, request, receipt);
        return matched.scope ? [matched.scope] : [];
      }));
      if (releases.length !== 1) gaps.push("production_ai_operation_rejected_admission_unspent_missing");
      continue;
    }
    const scope = commands.find((command) => isDeepStrictEqual(command.acceptedIntent, intent) &&
      isDeepStrictEqual(command.decision?.decision.identity, entry.identity));
    const admitted = scope?.outcomes.some((outcome) => outcome.sequence <= cutoff && outcome.outcome.kind === "dispatched");
    const terminal = scope?.outcomes.some((outcome) => outcome.sequence <= cutoff &&
      ["failed", "rejected", "cancelled", "completed"].includes(outcome.outcome.kind));
    const payment = payments.find((payment) => payment.sequence <= cutoff &&
      payment.resource.operation === "immediate_charge" &&
      payment.resource.originatingCommandContext?.execution.commandId === entry.commandId);
    const price = Object.fromEntries(Object.values(ResourceType).map((type) => [type, claims.reduce((sum, claim) =>
      sum + (claim.resourceType === type ? claim.amount : 0), 0)]));
    const paid = !!payment && sameRuntimeQueueVector(payment.resource.storedPrice, price);
    const items = fact.boundaryState?.queues?.flatMap((queue) => queue.lanes.flatMap((lane) => lane.items
      .filter((item) => item.commandId === entry.commandId).map((item) => ({ queue, item })))) ?? [];
    const insertions = prefix.flatMap((candidate) => candidate.kind === "queue_changed" ? [{
      sequence: candidate.sequence, tick: candidate.tick, queue: candidate.queue
    }] :
      candidate.kind === "queue_mutation" && candidate.mutation.operation === "enqueue" &&
      candidate.mutation.phase === "after" && candidate.mutation.actorId === intent.producerId &&
      candidate.mutation.item?.commandId === entry.commandId &&
      isDeepStrictEqual(candidate.mutation.originatingCommandContext?.execution, scope?.command.execution)
        ? (candidate.boundaryState?.queues ?? []).filter((queue) => queue.actorId === intent.producerId).map((queue) => ({
        sequence: candidate.sequence, tick: candidate.tick, queue
      })) : []);
    const inserted = insertions.some((candidate) =>
      !!scope && candidate.tick === scope.command.tick && scope.outcomes.some((outcome) =>
        outcome.sequence < candidate.sequence && outcome.outcome.kind === "dispatched") &&
      candidate.queue.actorId === intent.producerId && candidate.queue.lanes.some((lane) => lane.items.some((item) =>
        item.commandId === entry.commandId && item.identitySource === "command" &&
        item.itemId === `queue:${intent.producerId}:${entry.commandId}` && item.payment === "per_successful_tick" &&
        item.effectId === scope?.command.execution?.effectId &&
        item.objectName === (intent.kind === "produce" ? intent.objectName : null) && item.researchType === null &&
        sameRuntimeQueueVector(item.charge, price))));
    const transferred = inserted && items.length === 1 && items[0].queue.actorId === intent.producerId &&
      items[0].item.identitySource === "command" && items[0].item.itemId === `queue:${intent.producerId}:${entry.commandId}` &&
      items[0].item.payment === "per_successful_tick" && items[0].item.effectId === scope?.command.execution?.effectId &&
      items[0].item.objectName === (intent.kind === "produce" ? intent.objectName : null) &&
      items[0].item.researchType === null && sameRuntimeQueueVector(items[0].item.charge, price);
    // Physical removal before a terminal callback needs a separate lifecycle interval; do not borrow an old head.
    if (entry.state === "queue_liability" && !transferred) gaps.push("production_ai_operation_queue_transfer_missing");
    if (entry.state === "selected" ? entry.commandId !== null || admitted :
      !scope?.decision || !admitted || scope.command.execution?.commandId !== entry.commandId ||
      (entry.state === "admitted" ? paid || transferred || terminal :
        entry.state === "paid" ? !paid || scope?.outcomes.some((outcome) => outcome.sequence <= cutoff &&
          ["failed", "rejected", "cancelled"].includes(outcome.outcome.kind)) :
          entry.state === "queue_liability" ? terminal : !terminal)) {
      failures.push("production_ai_operation_unspent_state_invalid");
    }
    if (entry.state === "selected" || entry.state === "admitted") {
      for (const claim of claims) resources[claim.resourceType] += claim.amount;
    }
  }
  // Missing active admissions or retained provisional leases must not understate the absolute captured amount.
  for (const scope of commands) {
    if (scope.acceptedIntent.kind !== "produce" && scope.acceptedIntent.kind !== "research") continue;
    const admitted = scope.outcomes.some((outcome) => outcome.sequence <= cutoff && outcome.outcome.kind === "dispatched");
    const settled = scope.outcomes.some((outcome) => outcome.sequence <= cutoff &&
      ["failed", "rejected", "cancelled", "completed"].includes(outcome.outcome.kind)) ||
      payments.some((payment) => payment.sequence <= cutoff && payment.resource.operation === "immediate_charge" &&
        payment.resource.originatingCommandContext?.execution.commandId === scope.command.execution?.commandId);
    if (admitted && !settled && !ledger.entries.some((entry) => entry.commandId === scope.command.execution?.commandId)) {
      failures.push("production_ai_operation_unspent_admission_missing");
    }
  }
  for (const lease of latest.decision.reservations) {
    if (lease.subjectKey === undefined) gaps.push("production_ai_operation_migrated_unspent_missing");
    if (lease.subjectKey?.startsWith("resource:") && ["provisional", "dispatched"].includes(lease.state.kind) &&
      !ledger.entries.some((entry) => entry.intent.planId === lease.ownerPlanId &&
        entry.intent.claims.some((claim) => claim.claimId === lease.claimId))) {
      failures.push("production_ai_operation_unspent_lease_missing");
    }
  }
  if (latest.decision.acceptedIntents.some((intent) => intent.kind !== "produce" && intent.kind !== "research" &&
    intent.claims.some((claim) => claim.kind === "resource"))) gaps.push("production_ai_operation_non_queue_unspent_missing");
  if (!isRuntimeProductionBalance(resources) || !sameRuntimeQueueVector(resources, ledger.resources)) {
    failures.push("production_ai_operation_unspent_total_invalid");
  }
  return { resources: failures.length || gaps.length ? null : resources, failures: [...new Set(failures)], gaps: [...new Set(gaps)] };
}
