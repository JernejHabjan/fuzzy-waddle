import { reconcileRuntimeUnspentEntry } from "./skirmish-ai-runtime-unspent-entry";
import { isRuntimeProductionBalance } from "./skirmish-ai-runtime-production-balance";
import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type * as Capture from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type * as Facts from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

export { isRuntimeProductionBalance } from "./skirmish-ai-runtime-production-balance";

/**
 * Independently reconciles the captured queue-claim subset at one exact callback. Native accepted leases, admission,
 * completed scoped payment and physical liability transfer justify each state. Missing global/non-queue ownership
 * remains null; this does not replace the full production reservation/cadence authority. beforeCallback excludes
 * the enclosing event from lifecycle reconciliation while retaining its real sampled physical state and sequence.
 */
export function reconcileRuntimeProductionUnspent(
  capture: Capture.AiRuntimeProductionCaptureV1,
  fact: Facts.AiRuntimeProductionFactV1,
  commands: RuntimeProductionCausalityV1["commands"],
  payments: RuntimeProductionCausalityV1["payments"],
  beforeCallback = false
) {
  const ledger = fact.boundaryState?.unspentClaims;
  const failures: string[] = [];
  const gaps: string[] = [];
  const missing = () => ({ resources: null, failures, gaps: [...gaps, "production_ai_operation_unspent_missing"] });
  if (fact.boundaryState?.snapshotRestoreInProgress) {
    failures.push("production_ai_operation_unspent_restore_invalid");
    return missing();
  }
  if (!ledger?.resources || ledger.gaps.length) return missing();
  const cutoff = fact.sequence - (beforeCallback ? 1 : 0);
  const prefix = capture.facts.filter((entry) => entry.sequence <= cutoff);
  const decisions = prefix.filter((entry) => entry.kind === "decision_selected");
  const latest = decisions[decisions.length - 1];
  if (!latest) return missing();
  if (
    ledger.entries.length > 512 ||
    !isRuntimeProductionBalance(ledger.resources) ||
    new Set(ledger.entries.map((entry) => entry.intent.effectId)).size !== ledger.entries.length
  ) {
    failures.push("production_ai_operation_unspent_shape_invalid");
  }
  const resources: Record<ResourceType, number> = { food: 0, wood: 0, stone: 0, minerals: 0 };
  for (const entry of ledger.entries) {
    const selections = decisions.filter((decision) => isDeepStrictEqual(decision.decision.identity, entry.identity));
    const selected = selections[0];
    const intent = entry.intent;
    const claims = intent.claims.filter((claim) => claim.kind === "resource");
    if (intent.kind !== "produce" && intent.kind !== "research") {
      gaps.push("production_ai_operation_non_queue_unspent_missing");
      continue;
    }
    if (
      selections.length !== 1 ||
      !selected ||
      entry.identity.playerNumber !== capture.playerNumber ||
      // The identity dates consumed input; async planning can publish the exact selection on a later native tick.
      entry.identity.tick > selected.tick ||
      intent.proposedTick > entry.identity.tick ||
      [
        entry.identity.tick,
        entry.identity.generation,
        entry.identity.decisionSequence,
        entry.identity.authorityEpoch
      ].some((value) => !Number.isSafeInteger(value) || value < 0) ||
      selected.decision.acceptedIntents.filter((candidate) => isDeepStrictEqual(candidate, intent)).length !== 1 ||
      selected.decision.decisions.filter(
        (candidate) =>
          candidate.outcome === "accepted" &&
          candidate.reason === "accepted" &&
          isDeepStrictEqual(candidate.intent, intent)
      ).length !== 1 ||
      new Set(claims.map((claim) => claim.claimId)).size !== claims.length ||
      claims.some(
        (claim) =>
          !Object.values(ResourceType).includes(claim.resourceType) ||
          !Number.isFinite(claim.amount) ||
          claim.amount < 0 ||
          selected.decision.reservations.filter(
            (lease) =>
              lease.claimId === claim.claimId &&
              lease.ownerPlanId === intent.planId &&
              lease.subjectKey === `resource:${claim.resourceType}` &&
              lease.createdTick === entry.identity.tick &&
              lease.state.kind === "provisional" &&
              lease.state.expiresAt.clock === "simulation" &&
              lease.state.expiresAt.unit === "tick" &&
              lease.state.expiresAt.persistence === "save" &&
              Number.isSafeInteger(lease.state.expiresAt.dueTick) &&
              lease.state.expiresAt.dueTick > entry.identity.tick
          ).length !== 1
      )
    ) {
      failures.push("production_ai_operation_unspent_selection_invalid");
      continue;
    }
    const ownership = reconcileRuntimeUnspentEntry(capture, fact, entry, intent, prefix, cutoff, commands, payments);
    failures.push(...ownership.failures);
    gaps.push(...ownership.gaps);
    if (entry.state === "selected" || entry.state === "admitted") {
      for (const claim of claims) resources[claim.resourceType] += claim.amount;
    }
  }
  // Missing active admissions or retained provisional leases must not understate the absolute captured amount.
  for (const scope of commands) {
    if (scope.acceptedIntent.kind !== "produce" && scope.acceptedIntent.kind !== "research") continue;
    const admitted = scope.outcomes.some(
      (outcome) => outcome.sequence <= cutoff && outcome.outcome.kind === "dispatched"
    );
    const settled =
      scope.outcomes.some(
        (outcome) =>
          outcome.sequence <= cutoff && ["failed", "rejected", "cancelled", "completed"].includes(outcome.outcome.kind)
      ) ||
      payments.some(
        (payment) =>
          payment.sequence <= cutoff &&
          payment.resource.operation === "immediate_charge" &&
          payment.resource.originatingCommandContext?.execution.commandId === scope.command.execution?.commandId
      );
    if (
      admitted &&
      !settled &&
      !ledger.entries.some((entry) => entry.commandId === scope.command.execution?.commandId)
    ) {
      failures.push("production_ai_operation_unspent_admission_missing");
    }
  }
  for (const lease of latest.decision.reservations) {
    if (lease.subjectKey === undefined) gaps.push("production_ai_operation_migrated_unspent_missing");
    if (
      lease.subjectKey?.startsWith("resource:") &&
      ["provisional", "dispatched"].includes(lease.state.kind) &&
      !ledger.entries.some(
        (entry) =>
          entry.intent.planId === lease.ownerPlanId &&
          entry.intent.claims.some((claim) => claim.claimId === lease.claimId)
      )
    ) {
      failures.push("production_ai_operation_unspent_lease_missing");
    }
  }
  if (
    latest.decision.acceptedIntents.some(
      (intent) =>
        intent.kind !== "produce" &&
        intent.kind !== "research" &&
        intent.claims.some((claim) => claim.kind === "resource")
    )
  )
    gaps.push("production_ai_operation_non_queue_unspent_missing");
  if (!isRuntimeProductionBalance(resources) || !sameRuntimeQueueVector(resources, ledger.resources)) {
    failures.push("production_ai_operation_unspent_total_invalid");
  }
  return {
    resources: failures.length || gaps.length ? null : resources,
    failures: [...new Set(failures)],
    gaps: [...new Set(gaps)]
  };
}
