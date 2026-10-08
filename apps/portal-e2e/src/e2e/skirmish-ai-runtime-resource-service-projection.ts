import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeResourceCreditV1 } from "./skirmish-ai-runtime-resource-credit";
import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";
import type { RuntimeResourceServiceIntervalV1 } from "./skirmish-ai-runtime-resource-service-interval";
import { normalizeRuntimeResourceNeeds } from "./skirmish-ai-runtime-resource-need-normalization";
import { validateRuntimeResourceCoverage } from "./skirmish-ai-runtime-resource-coverage-validation";
import { validateRuntimeResourceIntervals } from "./skirmish-ai-runtime-resource-interval-validation";
import { projectRuntimeResourceNeedAccounting } from "./skirmish-ai-runtime-resource-need-accounting-projection";
import { projectRuntimeResourceApplications } from "./skirmish-ai-runtime-resource-application-projection";

/** Compose fail-closed diagnostic quantities. Complete unresolved need, throughput and capacity authority are still unsupported. */
export function projectRuntimeResourceServices(capture: AiRuntimeProductionCaptureV1, credits: readonly RuntimeResourceCreditV1[]) {
  const selections = normalizeRuntimeResourceNeeds(capture), coverage = validateRuntimeResourceCoverage(capture);
  const declaration = validateRuntimeResourceIntervals(capture);
  const accounting = projectRuntimeResourceNeedAccounting(capture, selections.needs, credits);
  const applications = projectRuntimeResourceApplications(capture, declaration.declarations, credits, accounting.records);
  const failures = [...selections.failures, ...coverage.failures, ...declaration.failures, ...accounting.failures,
    ...applications.failures];
  const gaps = new Set([...selections.gaps, ...coverage.gaps, ...declaration.gaps, ...accounting.gaps, ...applications.gaps]);
  const intervals: RuntimeResourceServiceIntervalV1[] = [];
  const remaining = new Map<number, number>();
  const transfers = new Set<number>();
  for (const credit of credits) {
    const value = credit.fact.spatial;
    if (value.kind !== "resource_service" || value.phase !== "resource_credit") {
      failures.push("production_resource_interval_credit_invalid"); continue;
    }
    if (value.transferId !== null) {
      if (transfers.has(value.transferId)) failures.push("production_resource_interval_credit_reused");
      transfers.add(value.transferId);
    }
  }
  if (capture.facts.length > 8192 || capture.snapshots.length > 256 || credits.length > 256) {
    failures.push("production_resource_interval_capture_overflow");
  }
  for (const interval of [...declaration.declarations].sort((left, right) => left.startTick - right.startTick ||
    left.intervalId.localeCompare(right.intervalId))) {
    const intervalGaps = new Set<string>(coverage.gaps);
    const matches = selections.needs.filter((need) => need.selection.intentId === interval.need.intentId &&
      need.selection.effectId === interval.need.effectId && need.selection.tick === interval.need.selectedTick &&
      need.selection.playerNumber === interval.beneficiary && need.selection.resourceType === interval.resourceType);
    if (matches.length > 1) failures.push("production_resource_interval_need_ambiguous");
    const need = matches.length === 1 ? matches[0] : null;
    if (!need || need.grossUnmet === null) intervalGaps.add("production_resource_interval_dated_need_missing");
    if (need?.selection.forecast && interval.endTick > need.selection.forecast.horizonTick) {
      failures.push("production_resource_interval_horizon_exceeded");
    }
    const windows: RuntimeResourceServiceIntervalV1["windows"][number][] = [];
    let totalIncome: number | null = 0, totalEligible: number | null = 0, totalPotential: number | null = 0;
    if (need && !remaining.has(need.selectedSequence)) remaining.set(need.selectedSequence, need.grossUnmet ?? 0);
    for (let left = interval.startTick; left < interval.endTick; left += interval.windowTicks) {
      const right = Math.min(interval.endTick, left + interval.windowTicks);
      const startReads = capture.snapshots.filter((snapshot) => snapshot.tick === left);
      const endReads = capture.snapshots.filter((snapshot) => snapshot.tick === right);
      const start = startReads.length === 1 ? startReads[0].resourceCoverage : undefined;
      const end = endReads.length === 1 ? endReads[0].resourceCoverage : undefined;
      const read = !!start && !!end && start.captureEpoch === end.captureEpoch &&
        start.frontier.captureSequence <= end.frontier.captureSequence;
      if (!read) intervalGaps.add("production_resource_interval_exact_reads_missing_or_ambiguous");
      const scoped = read ? credits.filter((credit) => credit.beneficiary === interval.beneficiary &&
        credit.fact.spatial.kind === "resource_service" && credit.fact.spatial.phase === "resource_credit" &&
        credit.fact.spatial.resourceType === interval.resourceType && credit.appliedAmount !== null &&
        interval.actorIds.includes(credit.fact.spatial.source.actorId ?? "") &&
        credit.fact.sequence > start.frontier.captureSequence && credit.fact.sequence <= end.frontier.captureSequence &&
        credit.fact.tick >= left && credit.fact.tick <= right) : [];
      const unidentified = scoped.some((credit) => credit.fact.spatial.kind === "resource_service" &&
        credit.fact.spatial.transferId === null);
      if (unidentified) intervalGaps.add("production_resource_interval_transfer_identity_missing");
      const observedIncome = read && !unidentified ? scoped.reduce((total, credit) => total + (credit.appliedAmount ?? 0), 0) : null;
      const supported = read && !start.lost && !end.lost && start.lossEpoch === end.lossEpoch &&
        !capture.droppedFactCount && !capture.droppedSnapshotCount && interval.actorIds.every((actorId) => {
          const installed = start.cohorts.filter((cohort) => cohort.actorId === actorId &&
            cohort.playerNumber === interval.beneficiary);
          return installed.length === 1 && end.cohorts.filter((cohort) => cohort.actorId === actorId &&
            cohort.playerNumber === interval.beneficiary).length === 1;
        });
      const needAtStart = need && need.grossUnmet !== null && start && need.selectedSequence <= start.frontier.captureSequence;
      const eligible = supported && need && needAtStart && end
        ? scoped.filter((credit) => eligibleForNeed(capture, credit, need, end)) : [];
      const eligibleIncome = supported && needAtStart ? eligible.reduce((total, credit) =>
        total + (credit.appliedAmount ?? 0), 0) : null;
      if (scoped.some((credit) => (credit.appliedAmount ?? 0) > 0 && !eligible.includes(credit))) {
        intervalGaps.add("production_resource_whole_pile_selection_or_cohort_lineage_unavailable");
      }
      if (!supported) intervalGaps.add("production_resource_interval_channel_coverage_unavailable");
      if (!needAtStart) intervalGaps.add("production_resource_interval_need_not_present_at_start");
      const potentialContribution = eligibleIncome !== null && need
        ? Math.min(eligibleIncome, remaining.get(need.selectedSequence) ?? 0) : null;
      if ([observedIncome, eligibleIncome, potentialContribution].some((amount) =>
        amount !== null && (!Number.isFinite(amount) || amount < 0))) failures.push("production_resource_interval_amount_invalid");
      if (potentialContribution !== null && need) {
        remaining.set(need.selectedSequence, (remaining.get(need.selectedSequence) ?? 0) - potentialContribution);
      }
      windows.push({ startTick: left, endTick: right,
        minimumUsefulDelivery: right - left === interval.windowTicks ? interval.minimumUsefulDelivery :
          interval.finalWindow?.minimumUsefulDelivery ?? interval.minimumUsefulDelivery,
        observedIncome, eligibleIncome, potentialContribution, meetsUsefulFloor: null });
      totalIncome = totalIncome !== null && observedIncome !== null ? totalIncome + observedIncome : null;
      totalEligible = totalEligible !== null && eligibleIncome !== null ? totalEligible + eligibleIncome : null;
      totalPotential = totalPotential !== null && potentialContribution !== null ? totalPotential + potentialContribution : null;
    }
    if ([totalIncome, totalEligible, totalPotential].some((amount) => amount !== null && !Number.isFinite(amount))) {
      failures.push("production_resource_interval_amount_overflow");
    }
    intervalGaps.add("production_resource_actual_useful_contribution_unavailable");
    intervalGaps.add("production_resource_retained_useful_throughput_unavailable");
    intervalGaps.forEach((gap) => gaps.add(gap));
    intervals.push({ declaration: interval, need, observedIncome: totalIncome, eligibleIncome: totalEligible,
      potentialContribution: totalPotential, usefulContribution: null, retainedUsefulThroughput: null,
      continuousUsefulCapacity: null, windows, gaps: [...intervalGaps] });
  }
  return { needs: failures.length ? [] : selections.needs, coverage: failures.length ? null : coverage.coverage,
    needAccounting: failures.length ? [] : accounting.records,
    applicationIntervals: failures.length ? [] : applications.intervals,
    intervals: failures.length ? [] : structuredClone(intervals), failures: [...new Set(failures)], gaps: [...gaps] };
}

/** Whole-pile provenance must name one earlier selected generation; a newer decision conservatively closes the old input. */
function eligibleForNeed(capture: AiRuntimeProductionCaptureV1, credit: RuntimeResourceCreditV1,
  need: RuntimeResourceNeedV1, end: NonNullable<AiRuntimeProductionCaptureV1["resourceCoverage"]>): boolean {
  const value = credit.fact.spatial;
  if (value.kind !== "resource_service" || value.phase !== "resource_credit" || !value.lifetimeValid ||
    value.transferId === null || !credit.offer || !credit.consumption ||
    !credit.cargoAttributed || !credit.contributions.length || credit.appliedAmount === null || credit.appliedAmount <= 0 ||
    credit.fact.tick > (need.selection.forecast?.horizonTick ?? -1) ||
    capture.facts.some((fact) => fact.kind === "decision_selected" && fact.playerNumber === need.selection.playerNumber &&
      fact.sequence > need.selectedSequence && fact.sequence < credit.fact.sequence)) return false;
  return credit.contributions.every((contribution) => {
    const gathering = contribution.gathering, command = gathering.serviceCommand;
    const source = gathering.started.spatial;
    return contribution.resourceType === need.selection.resourceType && gathering.callerAttributed &&
      command?.decision?.sequence === need.selectedSequence && command.acceptedIntent.kind === "assign_gatherers" &&
      command.acceptedIntent.intentId === need.selection.intentId && command.acceptedIntent.effectId === need.selection.effectId &&
      source.kind === "service_attempt" && source.operation === "gather" && source.source.playerNumber === credit.beneficiary &&
      command.acceptedIntent.actorIds.includes(source.source.actorId ?? "") &&
      end.cohorts.some((cohort) => cohort.actorId === source.source.actorId && cohort.playerNumber === credit.beneficiary &&
        cohort.installed.tick <= gathering.started.tick && cohort.installed.captureSequence < gathering.started.sequence);
  });
}
