import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";
import type { RuntimeResourceCreditV1 } from "./skirmish-ai-runtime-resource-credit";
import type { RuntimeResourceNeedAccountingV1 } from "./skirmish-ai-runtime-resource-need-accounting";
import { normalizeRuntimeRecipientMutations } from "./skirmish-ai-runtime-recipient-mutations";
import { calculateRuntimeResourceContribution } from "./calculate-runtime-resource-contribution";
import { runtimeNeedHasIncomingStart, runtimeNeedOwnAdmissionSequences } from "./skirmish-ai-runtime-resource-need-boundaries";
import { runtimeResourceCreditMatchesOperation } from "./skirmish-ai-runtime-resource-application-join";

/** Frozen inputs and disjoint liabilities, closed conservatively at actual known boundaries. No partial channel activates usefulness. */
export function projectRuntimeResourceNeedAccounting(capture: AiRuntimeProductionCaptureV1,
  needs: readonly RuntimeResourceNeedV1[], credits: readonly RuntimeResourceCreditV1[]) {
  const journal = normalizeRuntimeRecipientMutations(capture);
  const failures = [...journal.failures], records: RuntimeResourceNeedAccountingV1[] = [];
  const gaps = new Set<string>([...journal.gaps, "resource_recipient_mutable_alias_history_incomplete",
    "resource_need_lifecycle_routes_incomplete", "resource_reconciled_liability_routes_incomplete",
    "resource_service_lifetime_history_incomplete"]);
  const operations = new Map(journal.operations.map((operation) => [operation.terminal.mutation.operationId, operation]));
  if (journal.failures.length) return { records, failures: [...new Set(failures)], gaps: [...gaps] };
  const used = new Set<number>();
  for (const need of needs) {
    const selection = need.selection, type = selection.resourceType;
    const local = new Set<string>(journal.gaps);
    const selected = capture.facts.find((fact) => fact.sequence === need.selectedSequence && fact.kind === "decision_selected");
    const marker = selection.resourceInputRead;
    const read = marker ? capture.recipientResourceFacts?.find((fact) => fact.sequence === marker.sequence) : undefined;
    const input = read?.kind === "resource_input_read" ? read.resources.filter((entry) => entry.resourceType === type) : [];
    if (!marker || !read || read.kind !== "resource_input_read" || !isDeepStrictEqual(read.read, marker) ||
      marker.captureEpoch !== capture.resourceCoverage?.captureEpoch || marker.lossEpoch !== 0 ||
      marker.playerNumber !== selection.playerNumber || marker.generation !== selection.observationGeneration ||
      read.playerNumber !== selection.playerNumber || read.sequence >= need.selectedSequence || read.tick > selection.tick ||
      input.length !== 1 || !isDeepStrictEqual(input[0], selection.ledger)) local.add("production_need_exact_input_read_missing");
    const state = selected?.boundaryState;
    const ledger = selection.ledger, claims = state?.unspentClaims;
    const frame = ledger && claims?.resources && state?.obligations && state.resources &&
      !state.snapshotRestoreInProgress && Array.isArray(state.gaps) && !state.gaps.length &&
      Array.isArray(claims.gaps) && !claims.gaps.length &&
      [ledger.stockpile, ledger.reservedUnspent, ledger.obligationsDue].every((amount) => Number.isFinite(amount) && amount >= 0) &&
      claims.resources[type] === ledger.reservedUnspent && state.obligations[type] === ledger.obligationsDue
      ? { stockpile: ledger.stockpile, reservedUnspent: ledger.reservedUnspent, obligationsDue: ledger.obligationsDue } : null;
    if (!frame) local.add("production_need_reconciled_liability_frame_missing");
    const incomingStart = runtimeNeedHasIncomingStart(capture, need);
    if (!incomingStart) local.add("production_need_incoming_decision_scope_missing");
    if (marker && capture.facts.some((fact) => fact.playerNumber === selection.playerNumber &&
      fact.sequence > marker.sequence && fact.sequence < need.selectedSequence &&
      !(incomingStart && fact.kind === "resource_need_fence" && fact.reason === "controller_decision_started" &&
        isDeepStrictEqual(fact.incomingRead, marker)) &&
      ["decision_selected", "resource_need_fence", "queue_mutation", "queue_progress", "queue_changed", "outcome", "intent_dispatch",
        "actor_registered", "actor_unregistered", "construction_authority"].includes(fact.kind))) {
      local.add("production_need_input_liabilities_changed_before_acceptance");
    }
    const forecast = selection.forecast;
    const sameTarget = selected?.kind === "decision_selected" && forecast &&
      selected.decision.economyProduction.forecasts.filter((entry) => entry.resourceType === type).length === 1 &&
      selected.decision.economyProduction.forecasts.some((entry) => entry.resourceType === type &&
        entry.amount === forecast.amount && entry.horizonTick === forecast.horizonTick &&
        entry.confidencePermille === forecast.confidencePermille);
    const admission = runtimeNeedOwnAdmissionSequences(capture, need);
    const close = capture.facts.find((fact) => fact.playerNumber === selection.playerNumber &&
      !admission.has(fact.sequence) &&
      fact.sequence > need.selectedSequence && ["decision_selected", "resource_need_fence", "intent_dispatch", "outcome",
        "queue_changed", "queue_mutation", "queue_progress", "queue_completion", "construction_authority",
        "actor_registered", "actor_unregistered", "research_completed"].includes(fact.kind));
    const closedSequence = !sameTarget ? need.selectedSequence : close?.sequence ?? null;
    if (!sameTarget) local.add("production_need_accepting_result_replaced_target");
    const applications: RuntimeResourceNeedAccountingV1["applications"][number][] = [];
    for (const credit of credits) {
      const value = credit.fact.spatial;
      if (value.kind !== "resource_service" || value.phase !== "resource_credit" ||
        value.beneficiary !== selection.playerNumber || value.resourceType !== type) continue;
      // Every contributor must name the accepted original generation. Mixed/unknown cargo cannot allocate a partial pile.
      const own = credit.cargoAttributed && credit.contributions.length > 0 && credit.contributions.every((lot) => {
        const command = lot.gathering.serviceCommand;
        return command?.selectedDecision?.fact.sequence === need.selectedSequence &&
          command.acceptedIntent?.intentId === selection.intentId && command.acceptedIntent.effectId === selection.effectId;
      });
      if (own && credit.contributions.reduce((sum, lot) => sum + lot.amount, 0) !== credit.appliedAmount) {
        failures.push("production_need_whole_pile_amount_conflict"); continue;
      }
      if (!own) continue;
      const application = value.operationId == null ? undefined : operations.get(value.operationId);
      if (!application) { local.add("production_need_credit_operation_join_missing"); continue; }
      const terminal = application.terminal, mutation = terminal.mutation, entry = application.entry;
      if (!runtimeResourceCreditMatchesOperation(credit, application)) {
        failures.push("production_need_credit_operation_conflict"); continue;
      }
      if (used.has(mutation.operationId)) { failures.push("production_need_credit_operation_reused"); continue; }
      used.add(mutation.operationId);
      const applicationGaps = new Set(local);
      const active = closedSequence === null || terminal.sequence < closedSequence;
      if (!active || entry.sequence <= need.selectedSequence || !forecast || terminal.tick > forecast.horizonTick ||
        need.grossUnmet === null) {
        applicationGaps.add("production_need_generation_closed_or_expired");
      }
      const prior = marker ? journal.operations.filter((operation) => operation.terminal.playerNumber === selection.playerNumber &&
        operation.terminal.sequence > marker.sequence && operation.terminal.sequence < entry.sequence) : [];
      const positive = marker && !journal.gaps.length ? prior.reduce((sum, operation) => sum +
        (operation.terminal.mutation.action === "add" ? Math.max(0,
          (operation.terminal.mutation.after?.[type] ?? NaN) - (operation.terminal.mutation.before?.[type] ?? NaN)) : 0), 0) : null;
      const calculation = applicationGaps.size === 0 && active && frame && forecast && positive !== null &&
        mutation.before && mutation.after && credit.appliedAmount !== null
        ? calculateRuntimeResourceContribution({ forecast: forecast.amount, initialStock: frame.stockpile,
          reserved: frame.reservedUnspent, obligations: frame.obligationsDue, positiveIncomeBefore: positive,
          stockBefore: mutation.before[type], stockAfter: mutation.after[type], eligibleAmount: credit.appliedAmount }) : null;
      if (positive !== null && !Number.isFinite(positive)) failures.push("production_need_income_overflow");
      applications.push({ operationId: mutation.operationId, entrySequence: entry.sequence, terminalSequence: terminal.sequence,
        observedPositiveIncomeBefore: Number.isFinite(positive) ? positive : null,
        observedUnresolvedUpperBound: calculation?.unresolvedBefore ?? null,
        observedContributionUpperBound: calculation?.contribution ?? null, usefulContribution: null,
        gaps: [...applicationGaps, ...gaps] });
    }
    local.forEach((gap) => gaps.add(gap));
    if (records.length < 256) records.push({ need, closedSequence, frame, applications, gaps: [...local, ...gaps] });
  }
  if (needs.length > 256 || credits.length > 256) failures.push("production_need_accounting_overflow");
  return { records: failures.length ? [] : records, failures: [...new Set(failures)], gaps: [...gaps] };
}
