import { expect, test } from "@playwright/test";
import { resourceApplicationFixture } from "./skirmish-ai-runtime-resource-application-fixture";
import { projectRuntimeResourceServices } from "./skirmish-ai-runtime-resource-service-projection";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

test("native application stays in its window when publication arrives later; grant/spend cannot reopen need", () => {
  const f = resourceApplicationFixture(), result = projectRuntimeResourceServices(f.capture, [f.credit]);
  expect(result.failures).toEqual([]);
  expect(result.intervals[0].windows).toMatchObject([{ observedIncome: 0 }, { observedIncome: 7 }, { observedIncome: 0 }]);
  expect(result.applicationIntervals[0]).toMatchObject({ positionBasis: "native_operation_entry", observedIncome: 7,
    observedContributionUpperBound: 3, usefulContribution: null, retainedUsefulThroughput: null, continuousUsefulCapacity: null,
    windows: [{ operationIds: [3], observedIncome: 7, observedContributionUpperBound: 3, meetsUsefulFloor: null },
      { operationIds: [], observedIncome: 0 }, { operationIds: [], observedIncome: 0 }] });
});

for (const missing of ["read", "ambiguous_read", "join", "terminal", "publication", "loss", "cohort", "straddle", "drop"] as const) {
  test(`${missing} cannot supply a native application window quantity`, () => {
    const f = resourceApplicationFixture();
    const credit = missing === "join" ? { ...f.credit, fact: { ...f.credit.fact,
      spatial: { ...f.credit.fact.spatial, operationId: undefined } } } : f.credit;
    const facts = f.capture.facts.filter((fact) => !(missing === "terminal" && fact.sequence === 14) &&
      !(missing === "publication" && fact.sequence === 15)).map((fact) => fact.sequence === 15 ? credit.fact : fact);
    const snapshots = missing === "read" ? f.capture.snapshots.filter((snapshot) => snapshot.tick !== 10) :
      missing === "ambiguous_read" ? [...f.capture.snapshots.slice(0, 2), f.capture.snapshots[1], ...f.capture.snapshots.slice(2)] :
        missing === "straddle" ? f.capture.snapshots.map((snapshot) => snapshot.tick === 10 ?
          { ...snapshot, afterSequence: 13, resourceCoverage: f.coverage(10, 13) } : snapshot) :
          missing === "terminal" ? f.capture.snapshots.map((snapshot) => snapshot.tick === 10 ?
            { ...snapshot, afterSequence: 13 } : snapshot) : f.capture.snapshots;
    const capture = { ...f.capture, facts, snapshots: missing === "cohort" ? snapshots.map((snapshot) => ({ ...snapshot,
      resourceCoverage: { ...snapshot.resourceCoverage, cohorts: [] } })) : snapshots,
      recipientResourceFacts: f.capture.recipientResourceFacts.filter((fact) => !(missing === "terminal" && fact.sequence === 14)),
      droppedSnapshotCount: missing === "drop" ? 1 : 0,
      ...(missing === "cohort" ? { resourceCoverage: { ...f.capture.resourceCoverage, cohorts: [] } } : {}),
      ...(missing === "loss" ? { resourceCoverage: { ...f.capture.resourceCoverage,
        lost: true, lossEpoch: 1, losses: ["reader_failed"] } } : {}) };
    const result = projectRuntimeResourceServices(capture, [credit]);
    if (missing === "publication") expect(result.applicationIntervals).toEqual([]);
    else expect(result.applicationIntervals[0].windows[0].observedIncome).toBeNull();
  });
}

test("an endpoint frontier cannot borrow a native entry from a later tick", () => {
  const f = resourceApplicationFixture();
  const snapshots = f.capture.snapshots.map((snapshot) => snapshot.tick === 1 ?
    { ...snapshot, afterSequence: 13, resourceCoverage: f.coverage(1, 13) } : snapshot);
  // A tick-one frontier cannot contain a tick-three entry; the enclosing coverage validator rejects this clock fiction.
  expect(projectRuntimeResourceServices({ ...f.capture, snapshots }, [f.credit]).failures)
    .toContain("production_resource_coverage_read_mismatch");
});

test("duplicate joins, conflicting supplied tail and overflow clear application diagnostics with the parent", () => {
  const f = resourceApplicationFixture();
  expect(projectRuntimeResourceServices(f.capture, [f.credit, f.credit]).failures)
    .toContain("production_resource_application_join_reused");
  const contradictory = { ...f.capture, recipientResourceFacts: [...f.capture.recipientResourceFacts,
    { ...f.capture.recipientResourceFacts[0], sequence: 16 }],
    resourceCoverage: f.coverage(20, 16) };
  expect(projectRuntimeResourceServices(contradictory, [f.credit]).applicationIntervals).toEqual([]);
  const overflow = { ...f.capture, resourceIntervalDeclaration: { ...f.capture.resourceIntervalDeclaration,
    overflow: true } };
  expect(normalizeRuntimeProductionCausality(overflow).resourceServices.applicationIntervals).toEqual([]);
});

test("an unrelated recipient's exact native credit cannot become this cohort's income", () => {
  const f = resourceApplicationFixture();
  const credit = { ...f.credit, beneficiary: 2, fact: { ...f.credit.fact, sequence: 16,
    spatial: { ...f.credit.fact.spatial, beneficiary: 2, ownerArgument: 2 } } };
  const facts = f.capture.facts.filter((fact) => fact.sequence < 13).concat(credit.fact);
  const recipient = f.capture.recipientResourceFacts.map((fact) => fact.kind === "recipient_resource_mutation" &&
    fact.mutation.operationId === 3 ? { ...fact, playerNumber: 2, sequence: fact.sequence + 1,
      mutation: { ...fact.mutation, entrySequence: fact.mutation.entrySequence + 1 } } : fact);
  const installed = { kind: "recipient_resources_installed", sequence: 13, tick: 3, playerNumber: 2,
    resources: { food: 0, wood: 0, stone: 0, minerals: 0 } } satisfies AiRuntimeProductionFactV1;
  const journal = [...recipient, installed].sort((left, right) => left.sequence - right.sequence);
  const snapshots = f.capture.snapshots.map((snapshot) => snapshot.tick >= 10 ? { ...snapshot,
    afterSequence: snapshot.tick < 15 ? 12 : 16,
    resourceCoverage: f.coverage(snapshot.tick, snapshot.tick < 15 ? 15 : 16) } : snapshot);
  const result = projectRuntimeResourceServices({ ...f.capture, facts, snapshots, recipientResourceFacts: journal,
    resourceCoverage: f.coverage(20, 16) }, [credit]);
  expect(result.failures).toEqual([]);
  expect(result.applicationIntervals[0].observedIncome).toBe(0);
});
