import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeResourceCreditV1 } from "./skirmish-ai-runtime-resource-credit";
import type { RuntimeResourceNeedAccountingV1 } from "./skirmish-ai-runtime-resource-need-accounting";
import type { RuntimeResourceApplicationIntervalV1 } from "./skirmish-ai-runtime-resource-application-interval";
import { normalizeRuntimeRecipientMutations } from "./skirmish-ai-runtime-recipient-mutations";
import { runtimeResourceCreditMatchesOperation } from "./skirmish-ai-runtime-resource-application-join";

/** Called with validated declarations by the service projection; inspect the complete supplied journal and credit tail. */
export function projectRuntimeResourceApplications(
  capture: AiRuntimeProductionCaptureV1,
  declarations: readonly RuntimeResourceApplicationIntervalV1["declaration"][],
  credits: readonly RuntimeResourceCreditV1[],
  accounting: readonly RuntimeResourceNeedAccountingV1[]
) {
  const journal = normalizeRuntimeRecipientMutations(capture),
    failures = [...journal.failures];
  const gaps = new Set(journal.gaps),
    intervals: RuntimeResourceApplicationIntervalV1[] = [];
  const operations = new Map(
    journal.operations.map((operation) => [operation.terminal.mutation.operationId, operation])
  );
  const facts = new Map(capture.facts.map((fact) => [fact.sequence, fact]));
  const joins = new Map<RuntimeResourceCreditV1, (typeof journal.operations)[number]>(),
    used = new Set<number>();
  if (credits.length > 256 || capture.snapshots.length > 256) failures.push("production_resource_application_overflow");
  for (const credit of credits) {
    const value = credit.fact.spatial;
    if (
      value.kind !== "resource_service" ||
      value.phase !== "resource_credit" ||
      !isDeepStrictEqual(facts.get(credit.fact.sequence), credit.fact)
    ) {
      failures.push("production_resource_application_credit_tail_conflict");
      continue;
    }
    const operation = value.operationId == null ? undefined : operations.get(value.operationId);
    if (!operation) continue; // Legacy/partial joins remain unavailable below, without invalidating old diagnostics.
    if (!runtimeResourceCreditMatchesOperation(credit, operation)) {
      failures.push("production_resource_application_join_conflict");
      continue;
    }
    if (used.has(value.operationId ?? -1)) {
      failures.push("production_resource_application_join_reused");
      continue;
    }
    used.add(operation.terminal.mutation.operationId);
    joins.set(credit, operation);
  }
  for (const declaration of declarations) {
    const scoped = credits.filter(
      (credit) =>
        credit.fact.spatial.kind === "resource_service" &&
        credit.fact.spatial.phase === "resource_credit" &&
        credit.beneficiary === declaration.beneficiary &&
        credit.fact.spatial.resourceType === declaration.resourceType &&
        declaration.actorIds.includes(credit.fact.spatial.source.actorId ?? "")
    );
    const selected = accounting.filter(
      (record) =>
        record.need.selection.intentId === declaration.need.intentId &&
        record.need.selection.effectId === declaration.need.effectId &&
        record.need.selection.tick === declaration.need.selectedTick &&
        record.need.selection.playerNumber === declaration.beneficiary &&
        record.need.selection.resourceType === declaration.resourceType
    );
    const need = selected.length === 1 ? selected[0] : undefined;
    const intervalGaps = new Set<string>([
      ...(need?.gaps ?? []),
      "production_resource_application_usefulness_unavailable"
    ]);
    const windows: RuntimeResourceApplicationIntervalV1["windows"][number][] = [];
    let totalIncome: number | null = 0,
      totalBound: number | null = 0;
    for (let left = declaration.startTick; left < declaration.endTick; left += declaration.windowTicks) {
      const right = Math.min(declaration.endTick, left + declaration.windowTicks);
      const startReads = capture.snapshots.filter((snapshot) => snapshot.tick === left);
      const endReads = capture.snapshots.filter((snapshot) => snapshot.tick === right);
      const start = startReads.length === 1 ? startReads[0]?.resourceCoverage : undefined;
      const end = endReads.length === 1 ? endReads[0]?.resourceCoverage : undefined;
      const local = new Set<string>(journal.gaps);
      const read =
        !!start &&
        !!end &&
        !start.lost &&
        !end.lost &&
        start.captureEpoch === end.captureEpoch &&
        start.lossEpoch === end.lossEpoch &&
        start.frontier.captureSequence <= end.frontier.captureSequence &&
        !capture.droppedFactCount &&
        !capture.droppedSnapshotCount;
      if (!read) local.add("production_resource_application_exact_reads_unavailable");
      if (
        read &&
        !declaration.actorIds.every((actorId) => {
          const installed = start.cohorts.filter(
            (cohort) => cohort.actorId === actorId && cohort.playerNumber === declaration.beneficiary
          );
          const retained = end.cohorts.filter(
            (cohort) => cohort.actorId === actorId && cohort.playerNumber === declaration.beneficiary
          );
          return installed.length === 1 && retained.length === 1 && isDeepStrictEqual(installed[0], retained[0]);
        })
      )
        local.add("production_resource_application_cohort_unavailable");
      if (scoped.some((credit) => !joins.has(credit))) local.add("production_resource_application_join_missing");
      const inWindow: RuntimeResourceCreditV1[] = [];
      if (read)
        for (const credit of scoped) {
          const operation = joins.get(credit);
          if (!operation) continue;
          const { entry, terminal } = operation,
            begin = start.frontier.captureSequence,
            finish = end.frontier.captureSequence;
          if (
            (entry.sequence <= begin && terminal.sequence > begin) ||
            (entry.sequence <= finish && terminal.sequence > finish)
          ) {
            local.add("production_resource_application_straddles_read");
            continue;
          }
          if (entry.sequence <= begin || entry.sequence > finish) continue;
          if (entry.tick < left || terminal.tick > right) {
            local.add("production_resource_application_clock_conflict");
            continue;
          }
          inWindow.push(credit);
        }
      const observedIncome = local.size ? null : inWindow.reduce((sum, credit) => sum + (credit.appliedAmount ?? 0), 0);
      const bounds = inWindow.map((credit) => {
        const operation = joins.get(credit);
        const matches = need?.applications.filter(
          (application) => application.operationId === operation?.terminal.mutation.operationId
        );
        return matches?.length === 1 ? (matches[0]?.observedContributionUpperBound ?? null) : null;
      });
      const needAtStart = !!need?.frame && start && need.need.selectedSequence <= start.frontier.captureSequence;
      const observedContributionUpperBound =
        observedIncome !== null && needAtStart && bounds.every((bound) => bound !== null)
          ? bounds.reduce<number>((sum, bound) => sum + (bound ?? 0), 0)
          : null;
      if (observedContributionUpperBound === null) local.add("production_resource_application_need_bound_unavailable");
      if (
        [observedIncome, observedContributionUpperBound].some(
          (amount) => amount !== null && (!Number.isFinite(amount) || amount < 0)
        )
      )
        failures.push("production_resource_application_amount_overflow");
      local.forEach((gap) => intervalGaps.add(gap));
      windows.push({
        startTick: left,
        endTick: right,
        operationIds:
          observedIncome !== null
            ? inWindow.map((credit) => joins.get(credit)?.terminal.mutation.operationId ?? -1)
            : [],
        observedIncome,
        observedContributionUpperBound,
        usefulContribution: null,
        meetsUsefulFloor: null,
        gaps: [...local]
      });
      totalIncome = totalIncome !== null && observedIncome !== null ? totalIncome + observedIncome : null;
      totalBound =
        totalBound !== null && observedContributionUpperBound !== null
          ? totalBound + observedContributionUpperBound
          : null;
    }
    if ([totalIncome, totalBound].some((amount) => amount !== null && !Number.isFinite(amount))) {
      failures.push("production_resource_application_amount_overflow");
    }
    intervalGaps.forEach((gap) => gaps.add(gap));
    intervals.push({
      declaration,
      positionBasis: "native_operation_entry",
      observedIncome: totalIncome,
      observedContributionUpperBound: totalBound,
      usefulContribution: null,
      retainedUsefulThroughput: null,
      continuousUsefulCapacity: null,
      windows,
      gaps: [...intervalGaps]
    });
  }
  return { intervals: failures.length ? [] : intervals, failures: [...new Set(failures)], gaps: [...gaps] };
}
