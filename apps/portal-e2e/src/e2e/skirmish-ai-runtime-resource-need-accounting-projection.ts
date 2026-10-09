import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";
import type { RuntimeResourceCreditV1 } from "./skirmish-ai-runtime-resource-credit";
import type { RuntimeResourceNeedAccountingV1 } from "./skirmish-ai-runtime-resource-need-accounting";
import type { RuntimeResourceLiabilityFramesV1 } from "./skirmish-ai-runtime-resource-liability-frames";
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
    const liabilityFrames = projectLiabilityFrames(capture, need, read, selected, type, ledger, local);
    if (liabilityFrames.gaps.some((gap) => gap === "liability_frame_value_invalid")) {
      failures.push("production_need_liability_frame_value_invalid");
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
    if (records.length < 256) records.push({ need, closedSequence, frame, liabilityFrames, applications,
      gaps: [...local, ...gaps] });
  }
  if (needs.length > 256 || credits.length > 256) failures.push("production_need_accounting_overflow");
  return { records: failures.length ? [] : records, failures: [...new Set(failures)], gaps: [...gaps] };
}

function projectLiabilityFrames(capture: AiRuntimeProductionCaptureV1, need: RuntimeResourceNeedV1,
  read: AiRuntimeProductionCaptureV1["facts"][number] | undefined,
  selected: AiRuntimeProductionCaptureV1["facts"][number] | undefined,
  type: RuntimeResourceNeedV1["selection"]["resourceType"], ledger: RuntimeResourceNeedV1["selection"]["ledger"],
  scopeGaps: ReadonlySet<string>)
  : RuntimeResourceLiabilityFramesV1 {
  const gaps = new Set<string>();
  const consumed = read?.kind === "resource_input_read" ? read.unspentClaimsAtRead : undefined;
  const before = selected?.kind === "decision_selected" ? selected.unspentClaimsBeforeSelection : undefined;
  const accepting = selected?.kind === "decision_selected" ? selected.boundaryState?.unspentClaims : undefined;
  const values = [consumed?.resources?.[type], before?.resources?.[type], accepting?.resources?.[type]];
  const amounts = values.map((amount) => typeof amount === "number" ? amount : null);
  if (values.some((amount) => amount !== undefined && (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0)) ||
    [ledger?.reservedUnspent].some((amount) => amount !== undefined && (!Number.isFinite(amount) || amount < 0))) {
    gaps.add("liability_frame_value_invalid");
  }
  if (!need.selection.resourceInputRead || read?.kind !== "resource_input_read" ||
    read.sequence !== need.selection.resourceInputRead.sequence || read.playerNumber !== need.selection.playerNumber ||
    !read.unspentClaimsAtRead) gaps.add("liability_consumed_frame_unavailable");
  if (selected?.kind !== "decision_selected" || selected.playerNumber !== need.selection.playerNumber ||
    selected.decision.identity.playerNumber !== need.selection.playerNumber ||
    selected.decision.identity.tick !== need.selection.tick ||
    selected.decision.identity.generation !== need.selection.observationGeneration ||
    !selected.unspentClaimsBeforeSelection) gaps.add("liability_before_selection_frame_unavailable");
  if (consumed?.gaps.length || before?.gaps.length || accepting?.gaps.length || capture.resourceCoverage?.lost ||
    !capture.resourceCoverage || selected?.boundaryState?.snapshotRestoreInProgress ||
    scopeGaps.has("production_need_input_liabilities_changed_before_acceptance")) {
    gaps.add("liability_capture_or_snapshot_gap");
  }
  if (scopeGaps.has("production_need_exact_input_read_missing")) gaps.add("liability_consumed_input_mismatch");
  const [consumedReserved, beforeSelectionReserved, acceptingReserved] = amounts;
  if (consumedReserved === null || beforeSelectionReserved === null || acceptingReserved === null ||
    ledger?.reservedUnspent === undefined || gaps.size) {
    if (beforeSelectionReserved !== null && ledger?.reservedUnspent !== undefined &&
      beforeSelectionReserved !== ledger.reservedUnspent) gaps.add("liability_before_selection_mismatch");
    return { consumedReserved, beforeSelectionReserved, acceptingReserved, status: "unavailable", gaps: [...gaps] };
  }
  if (consumedReserved !== ledger.reservedUnspent || beforeSelectionReserved !== ledger.reservedUnspent) {
    gaps.add("liability_before_selection_mismatch");
    return { consumedReserved, beforeSelectionReserved, acceptingReserved, status: "unavailable", gaps: [...gaps] };
  }
  return acceptingReserved === consumedReserved
    ? { consumedReserved, beforeSelectionReserved, acceptingReserved, status: "matching", gaps: [] }
    : { consumedReserved, beforeSelectionReserved, acceptingReserved, status: "accepting_changed", gaps: [] };
}
