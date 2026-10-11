import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { resourceServiceFixture } from "./skirmish-ai-runtime-resource-service-fixture";
import { normalizeRuntimeNativeServices } from "./skirmish-ai-runtime-native-service-normalization";
import { normalizeRuntimeResourceNeeds } from "./skirmish-ai-runtime-resource-need-normalization";
import { projectRuntimeResourceServices } from "./skirmish-ai-runtime-resource-service-projection";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

test("actual null-demand selection and a pulse/empty window retain income but never certify useful throughput", () => {
  const { capture } = resourceServiceFixture(),
    result = normalizeRuntimeNativeServices(capture);
  expect(result.failures).toEqual([]);
  expect(requireAiTestEntry(result.resourceServices.needs, 0)).toMatchObject({
    grossUnmet: 2,
    selection: { forecast: { amount: 102 } }
  });
  expect(requireAiTestEntry(result.resourceServices.intervals, 0)).toMatchObject({
    observedIncome: 3,
    eligibleIncome: 3,
    potentialContribution: 2,
    usefulContribution: null,
    retainedUsefulThroughput: null,
    continuousUsefulCapacity: null,
    windows: [
      { observedIncome: 3, potentialContribution: 2, meetsUsefulFloor: null },
      { observedIncome: 0, potentialContribution: 0, meetsUsefulFloor: null }
    ]
  });
  expect(requireAiTestEntry(result.service.attempts, 0).selectedDemand).toBeNull();
  expect(result.gaps).toContain("resource_beneficiary_need_history_missing");
});

for (const invalid of ["duplicate_intent", "wrong_intent_kind"] as const) {
  test(`${invalid} cannot supply the selected gathering need or any parent service quantity`, () => {
    const f = resourceServiceFixture();
    const facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 => {
      if (fact.kind !== "decision_selected" || !fact.decision.gatheringSelections?.length) return fact;
      const intent = requireAiTestEntry(fact.decision.acceptedIntents, 0);
      const acceptedIntents =
        invalid === "duplicate_intent"
          ? [intent, intent]
          : [{ ...intent, kind: "concede" as const, reason: "synthetic_control" }];
      return { ...fact, decision: { ...fact.decision, acceptedIntents } };
    });
    const capture = { ...f.capture, facts };
    const needs = normalizeRuntimeResourceNeeds(capture);
    expect(needs.failures).toContain("production_resource_selection_invalid");
    expect(needs.needs).toEqual([]);
    const parent = normalizeRuntimeProductionCausality(capture);
    expect(parent.failures).toContain("production_resource_selection_invalid");
    expect(parent.resourceCredits).toEqual([]);
    expect(parent.resourceServices.intervals).toEqual([]);
  });
}

for (const state of ["fallback", "expired", "zero_confidence", "nonpositive", "missing_ledger", "rejected"] as const) {
  test(`${state} cannot supply a dated quantitative need`, () => {
    const { capture, selection } = resourceServiceFixture();
    const changed =
      state === "fallback"
        ? { ...selection, branch: "stockpile_fallback" as const, forecast: null, plannerDeficit: null }
        : state === "missing_ledger"
          ? { ...selection, ledger: null }
          : state === "expired"
            ? { ...selection, forecast: { ...selection.forecast, horizonTick: 10 } }
            : state === "zero_confidence"
              ? { ...selection, forecast: { ...selection.forecast, confidencePermille: 0 } }
              : state === "nonpositive"
                ? { ...selection, forecast: { ...selection.forecast, amount: 100 }, plannerDeficit: 0 }
                : selection;
    const facts = capture.facts.map(
      (fact): AiRuntimeProductionFactV1 =>
        fact.kind === "decision_selected" && fact.decision.gatheringSelections?.length
          ? {
              ...fact,
              decision: {
                ...fact.decision,
                gatheringSelections: [changed],
                ...(state === "rejected" ? { acceptedIntents: [] } : {})
              }
            }
          : fact
    );
    const result = normalizeRuntimeResourceNeeds({ ...capture, facts });
    if (state === "rejected") expect(result.failures).toContain("production_resource_selection_invalid");
    else {
      expect(result.failures).toEqual([]);
      expect(requireAiTestEntry(result.needs, 0).grossUnmet).toBeNull();
    }
  });
}

test("same-tick effects before the start read are excluded and a later read cannot move the declared start", () => {
  const f = resourceServiceFixture();
  const capture = {
    ...f.capture,
    snapshots: f.capture.snapshots.map((snapshot) =>
      snapshot.tick === 10
        ? { ...snapshot, afterSequence: f.finalSequence, resourceCoverage: f.coverage(10, f.finalSequence) }
        : snapshot
    )
  };
  const result = normalizeRuntimeNativeServices(capture).resourceServices;
  expect(requireAiTestEntry(result.intervals, 0).observedIncome).toBe(0);
  const ambiguous = normalizeRuntimeNativeServices({
    ...f.capture,
    snapshots: [requireAiTestEntry(f.capture.snapshots, 0), ...f.capture.snapshots]
  }).resourceServices;
  expect(requireAiTestEntry(ambiguous.intervals, 0).observedIncome).toBeNull();
  expect(requireAiTestEntry(ambiguous.intervals, 0).gaps).toContain(
    "production_resource_interval_exact_reads_missing_or_ambiguous"
  );
});

for (const loss of ["missing_cohort", "lost", "missing_read", "legacy", "snapshot_drop"] as const) {
  test(`${loss} leaves the cohort interval unavailable while scoped credit remains visible`, () => {
    const f = resourceServiceFixture();
    const snapshots =
      loss === "missing_read"
        ? f.capture.snapshots.filter((snapshot) => snapshot.tick !== 20)
        : f.capture.snapshots.map((snapshot) => ({
            ...snapshot,
            resourceCoverage:
              loss === "legacy"
                ? undefined
                : {
                    ...f.coverage(snapshot.tick, snapshot.resourceCoverage.frontier.captureSequence),
                    ...(loss === "lost" ? { lost: true, lossEpoch: 1, losses: ["reader_failed"] } : {}),
                    ...(loss === "missing_cohort" ? { cohorts: [] } : {})
                  }
          }));
    const final =
      loss === "legacy"
        ? undefined
        : {
            ...f.capture.resourceCoverage,
            ...(loss === "lost" ? { lost: true, lossEpoch: 1, losses: ["reader_failed"] } : {}),
            ...(loss === "missing_cohort" ? { cohorts: [] } : {})
          };
    const result = normalizeRuntimeNativeServices({
      ...f.capture,
      snapshots,
      resourceCoverage: final,
      droppedSnapshotCount: loss === "snapshot_drop" ? 1 : 0
    });
    expect(requireAiTestEntry(result.resources.credits, 0).appliedAmount).toBe(3);
    expect(requireAiTestEntry(result.resourceServices.intervals, 0).eligibleIncome).toBeNull();
    expect(requireAiTestEntry(result.resourceServices.intervals, 0).usefulContribution).toBeNull();
  });
}

test("late component installation cannot backfill earlier native executions or the first window", () => {
  const f = resourceServiceFixture();
  const late = f.capture.resourceCoverage.cohorts.map((cohort) => ({
    ...cohort,
    installed: { tick: 11, captureSequence: f.finalSequence }
  }));
  const result = normalizeRuntimeNativeServices({
    ...f.capture,
    resourceCoverage: { ...f.capture.resourceCoverage, cohorts: late },
    snapshots: f.capture.snapshots.map((snapshot) => ({
      ...snapshot,
      resourceCoverage: { ...snapshot.resourceCoverage, cohorts: snapshot.tick === 10 ? [] : late }
    }))
  });
  expect(result.failures).toEqual([]);
  expect(requireAiTestEntry(result.resourceServices.intervals, 0)).toMatchObject({
    observedIncome: 3,
    eligibleIncome: null,
    potentialContribution: null,
    usefulContribution: null
  });
});

test("loss revival, deadline extension, overlap and duplicate credit suppress the entire report group", () => {
  const f = resourceServiceFixture(),
    native = normalizeRuntimeNativeServices(f.capture);
  const revived = {
    ...f.capture,
    snapshots: f.capture.snapshots.map((snapshot, index) =>
      index === 0
        ? {
            ...snapshot,
            resourceCoverage: { ...snapshot.resourceCoverage, lost: true, lossEpoch: 1, losses: ["append_failed"] }
          }
        : snapshot
    )
  };
  expect(projectRuntimeResourceServices(revived, native.resources.credits).failures).toContain(
    "production_resource_coverage_revived_or_regressed"
  );
  const horizon = {
    ...f.capture,
    resourceIntervalDeclaration: {
      ...f.capture.resourceIntervalDeclaration,
      intervals: [{ ...f.interval, endTick: 40, runCeilingTick: 40 }]
    }
  };
  expect(projectRuntimeResourceServices(horizon, native.resources.credits).failures).toContain(
    "production_resource_interval_horizon_exceeded"
  );
  const overlap = {
    ...f.capture,
    resourceIntervalDeclaration: {
      ...f.capture.resourceIntervalDeclaration,
      intervals: [f.interval, { ...f.interval, intervalId: "overlap" }]
    }
  };
  expect(projectRuntimeResourceServices(overlap, native.resources.credits).intervals).toEqual([]);
  expect(
    projectRuntimeResourceServices(f.capture, [...native.resources.credits, ...native.resources.credits]).failures
  ).toContain("production_resource_interval_credit_reused");
});

test("newer decisions close old potential credit without changing historical income", () => {
  const f = resourceServiceFixture(),
    native = normalizeRuntimeNativeServices(f.capture);
  const old = f.capture.facts.find(
    (fact) => fact.kind === "decision_selected" && fact.decision.gatheringSelections?.length
  );
  if (!old || old.kind !== "decision_selected") throw new Error("resource_service_selection_missing");
  const credit = requireAiTestEntry(native.resources.credits, 0);
  const decision = {
    ...old,
    sequence: credit.fact.sequence,
    decision: { ...old.decision, gatheringSelections: [], acceptedIntents: [], decisions: [] }
  };
  const facts = [
    ...f.capture.facts.map((fact) =>
      fact.sequence >= credit.fact.sequence ? { ...fact, sequence: fact.sequence + 1 } : fact
    ),
    decision
  ].sort((left, right) => left.sequence - right.sequence);
  const capture = {
    ...f.capture,
    facts,
    resourceCoverage: f.coverage(30, f.finalSequence + 1),
    snapshots: f.capture.snapshots.map((snapshot) =>
      snapshot.tick > 10
        ? {
            ...snapshot,
            afterSequence: f.finalSequence + 1,
            resourceCoverage: f.coverage(snapshot.tick, f.finalSequence + 1)
          }
        : snapshot
    )
  };
  const result = projectRuntimeResourceServices(capture, [
    { ...credit, fact: { ...credit.fact, sequence: credit.fact.sequence + 1 } }
  ]);
  expect(requireAiTestEntry(result.intervals, 0)).toMatchObject({
    observedIncome: 3,
    eligibleIncome: 0,
    potentialContribution: 0,
    usefulContribution: null,
    retainedUsefulThroughput: null
  });
  expect(requireAiTestEntry(native.resourceServices.intervals, 0).usefulContribution).toBeNull();
});

test("mixed selection generations keep observed income without assigning one whole pile to either need", () => {
  const f = resourceServiceFixture(),
    native = normalizeRuntimeNativeServices(f.capture),
    credit = requireAiTestEntry(native.resources.credits, 0);
  const first = requireAiTestEntry(credit.contributions, 0),
    second = requireAiTestEntry(credit.contributions, 1);
  const command = second.gathering.serviceCommand;
  if (!command?.decision) throw new Error("resource_service_contribution_missing");
  const result = projectRuntimeResourceServices(f.capture, [
    {
      ...credit,
      contributions: [
        first,
        {
          ...second,
          gathering: {
            ...second.gathering,
            serviceCommand: { ...command, decision: { ...command.decision, sequence: command.decision.sequence + 1 } }
          }
        }
      ]
    }
  ]);
  expect(requireAiTestEntry(result.intervals, 0)).toMatchObject({
    observedIncome: 3,
    eligibleIncome: 0,
    potentialContribution: 0
  });
});

test("other income can fulfill the need before a cohort credit; spending cannot reopen its useful generation", () => {
  const f = resourceServiceFixture(),
    native = normalizeRuntimeNativeServices(f.capture),
    credit = requireAiTestEntry(native.resources.credits, 0);
  const before = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const supplied: AiRuntimeProductionFactV1[] = [
    {
      sequence: credit.fact.sequence,
      tick: 10,
      playerNumber: 1,
      kind: "resources_applied",
      action: "resource.added",
      amounts: { wood: 2 },
      before,
      after: { ...before, wood: 102 },
      balanceMatches: true
    },
    {
      sequence: credit.fact.sequence + 1,
      tick: 10,
      playerNumber: 1,
      kind: "resources_applied",
      action: "resource.removed",
      amounts: { wood: 2 },
      before: { ...before, wood: 102 },
      after: before,
      balanceMatches: true
    }
  ];
  const facts = [
    ...f.capture.facts.map((fact) =>
      fact.sequence >= credit.fact.sequence ? { ...fact, sequence: fact.sequence + 2 } : fact
    ),
    ...supplied
  ].sort((left, right) => left.sequence - right.sequence);
  const capture = {
    ...f.capture,
    facts,
    resourceCoverage: f.coverage(30, f.finalSequence + 2),
    snapshots: f.capture.snapshots.map((snapshot) =>
      snapshot.tick > 10
        ? {
            ...snapshot,
            afterSequence: f.finalSequence + 2,
            resourceCoverage: f.coverage(snapshot.tick, f.finalSequence + 2)
          }
        : snapshot
    )
  };
  const result = projectRuntimeResourceServices(capture, [
    { ...credit, fact: { ...credit.fact, sequence: credit.fact.sequence + 2 } }
  ]);
  expect(requireAiTestEntry(result.intervals, 0)).toMatchObject({
    observedIncome: 3,
    potentialContribution: 2,
    usefulContribution: null
  });
  expect(requireAiTestEntry(result.intervals, 0).gaps).toContain("resource_beneficiary_need_history_missing");
});

test("overflow inspects the contradictory tail and parent causality suppresses all normalized groups", () => {
  const f = resourceServiceFixture();
  const invalid = {
    ...f.capture,
    resourceIntervalDeclaration: {
      ...f.capture.resourceIntervalDeclaration,
      intervals: [
        ...Array.from({ length: 256 }, (_, index) => ({ ...f.interval, intervalId: `interval:${index}` })),
        { ...f.interval, intervalId: "bad_tail", windowTicks: 0 }
      ]
    }
  };
  const result = normalizeRuntimeProductionCausality(invalid);
  expect(result.failures).toContain("production_resource_interval_invalid");
  expect(result.failures).toContain("production_resource_interval_overflow");
  expect(result.resourceCredits).toEqual([]);
  expect(result.resourceServices.intervals).toEqual([]);
});

test("a partial last window needs an independent exact duration and floor", () => {
  const f = resourceServiceFixture();
  const missing = {
    ...f.capture,
    resourceIntervalDeclaration: {
      ...f.capture.resourceIntervalDeclaration,
      intervals: [{ ...f.interval, windowTicks: 15 }]
    }
  };
  expect(normalizeRuntimeNativeServices(missing).resourceServices.failures).toContain(
    "production_resource_interval_invalid"
  );
  const declared = {
    ...f.capture,
    resourceIntervalDeclaration: {
      ...f.capture.resourceIntervalDeclaration,
      intervals: [{ ...f.interval, windowTicks: 15, finalWindow: { ticks: 5, minimumUsefulDelivery: 7 } }]
    },
    snapshots: f.capture.snapshots.map((snapshot) =>
      snapshot.tick === 20 ? { ...snapshot, tick: 25, resourceCoverage: f.coverage(25, f.finalSequence) } : snapshot
    )
  };
  const result = normalizeRuntimeNativeServices(declared).resourceServices;
  expect(result.failures).toEqual([]);
  expect(requireAiTestEntry(result.intervals, 0).windows).toMatchObject([
    { startTick: 10, endTick: 25, minimumUsefulDelivery: 1, observedIncome: 3 },
    { startTick: 25, endTick: 30, minimumUsefulDelivery: 7, observedIncome: 0, meetsUsefulFloor: null }
  ]);
});
