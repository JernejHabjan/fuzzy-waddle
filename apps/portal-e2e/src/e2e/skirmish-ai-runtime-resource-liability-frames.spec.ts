import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { resourceNeedAccountingFixture } from "./skirmish-ai-runtime-resource-need-accounting-fixture";
import { projectRuntimeResourceNeedAccounting } from "./skirmish-ai-runtime-resource-need-accounting-projection";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

/** Synthetic detached frames only; this never supplies a browser producer or complete useful authority. */
function fixture(beforeAmount = 0, acceptingAmount = 0) {
  const f = resourceNeedAccountingFixture(),
    type = f.need.selection.resourceType;
  const resources = { food: 0, wood: 0, stone: 0, minerals: 0 };
  const claims = { resources, entries: [], gaps: [] };
  const facts = f.capture.facts.map((fact) => {
    if (fact.kind === "resource_input_read") return { ...fact, unspentClaimsAtRead: claims };
    if (fact.kind === "decision_selected") {
      if (!fact.boundaryState) throw new Error("synthetic_accepting_state_missing");
      return {
        ...fact,
        unspentClaimsBeforeSelection: { ...claims, resources: { ...resources, [type]: beforeAmount } },
        boundaryState: {
          ...fact.boundaryState,
          unspentClaims: { ...claims, resources: { ...resources, [type]: acceptingAmount } }
        }
      };
    }
    return fact;
  });
  const capture = {
    ...f.capture,
    facts,
    recipientResourceFacts: f.capture.recipientResourceFacts.map(
      (fact) => facts.find((root) => root.sequence === fact.sequence) ?? fact
    )
  } satisfies AiRuntimeProductionCaptureV1;
  return { ...f, capture };
}

test("synthetic matching frames preserve the consumed calculation and leave useful contribution null", () => {
  const f = fixture(),
    result = projectRuntimeResourceNeedAccounting(f.capture, [f.need], [f.credit]);
  expect(result.failures).toEqual([]);
  expect(requireAiTestEntry(result.records, 0).liabilityFrames).toEqual({
    consumedReserved: 0,
    beforeSelectionReserved: 0,
    acceptingReserved: 0,
    status: "matching",
    gaps: []
  });
  expect(requireAiTestEntry(requireAiTestEntry(result.records, 0).applications, 0)).toMatchObject({
    observedContributionUpperBound: 3,
    usefulContribution: null
  });
});

test("synthetic new accepting claims explain unavailable bounds without replacing the consumed zero reservation", () => {
  const f = fixture(0, 5),
    result = projectRuntimeResourceNeedAccounting(f.capture, [f.need], [f.credit]);
  expect(result.failures).toEqual([]);
  expect(requireAiTestEntry(result.records, 0).liabilityFrames).toMatchObject({
    consumedReserved: 0,
    beforeSelectionReserved: 0,
    acceptingReserved: 5,
    status: "accepting_changed",
    gaps: []
  });
  expect(f.need.selection.ledger?.reservedUnspent).toBe(0);
  expect(requireAiTestEntry(result.records, 0)).toMatchObject({ frame: null });
  expect(requireAiTestEntry(requireAiTestEntry(result.records, 0).applications, 0)).toMatchObject({
    observedContributionUpperBound: null,
    usefulContribution: null
  });
});

test("synthetic before-selection mismatch and legacy missing snapshots remain explicit gaps", () => {
  const f = fixture(2, 0),
    result = projectRuntimeResourceNeedAccounting(f.capture, [f.need], []);
  expect(requireAiTestEntry(result.records, 0).liabilityFrames?.status).toBe("unavailable");
  expect(requireAiTestEntry(result.records, 0).liabilityFrames?.gaps).toContain("liability_before_selection_mismatch");
  const legacy = resourceNeedAccountingFixture();
  const old = projectRuntimeResourceNeedAccounting(legacy.capture, [legacy.need], [legacy.credit]);
  expect(old.failures).toEqual([]);
  expect(requireAiTestEntry(old.records, 0).liabilityFrames?.status).toBe("unavailable");
  expect(requireAiTestEntry(old.records, 0).liabilityFrames?.gaps).toContain("liability_consumed_frame_unavailable");
  expect(requireAiTestEntry(requireAiTestEntry(old.records, 0).applications, 0).observedContributionUpperBound).toBe(3);
});

for (const route of ["gap", "due", "restore", "unknown-restore", "lost", "initial-balance"] as const) {
  test(`synthetic ${route} accepting authority cannot report matching cash frames`, () => {
    const f = fixture();
    const capture = {
      ...f.capture,
      facts: f.capture.facts.map((fact) => {
        if (route === "initial-balance" && fact.kind === "recipient_resources_installed")
          return { ...fact, resources: null };
        if (fact.kind !== "decision_selected") return fact;
        if (!fact.boundaryState || !fact.boundaryState.obligations)
          throw new Error("synthetic_accepting_state_missing");
        return {
          ...fact,
          boundaryState: {
            ...fact.boundaryState,
            gaps: route === "gap" ? ["unknown_authority"] : [],
            obligations: {
              ...fact.boundaryState.obligations,
              [f.need.selection.resourceType]: route === "due" ? 1 : 0
            },
            snapshotRestoreInProgress: route === "unknown-restore" ? undefined : route === "restore"
          }
        };
      }),
      recipientResourceFacts: f.capture.recipientResourceFacts.map((fact) =>
        route === "initial-balance" && fact.kind === "recipient_resources_installed"
          ? { ...fact, resources: null }
          : fact
      ),
      resourceCoverage: {
        ...f.capture.resourceCoverage,
        lost: route === "lost",
        lossEpoch: route === "lost" ? 1 : 0,
        losses: route === "lost" ? ["named_mutation"] : []
      }
    } satisfies AiRuntimeProductionCaptureV1;
    const result = projectRuntimeResourceNeedAccounting(capture, [f.need], []);
    expect(result.failures).toEqual([]);
    expect(requireAiTestEntry(result.records, 0).liabilityFrames?.status).toBe("unavailable");
    expect(requireAiTestEntry(result.records, 0).liabilityFrames?.gaps.length).toBeGreaterThan(0);
  });
}

for (const value of [-1, NaN, Infinity]) {
  test(`synthetic malformed unselected-resource tail ${String(value)} fails the normalized parent with no selected need`, () => {
    const f = fixture();
    const capture = {
      ...f.capture,
      facts: f.capture.facts.map((fact) =>
        fact.kind === "decision_selected"
          ? {
              ...fact,
              unspentClaimsBeforeSelection: {
                resources: { food: 0, wood: 0, stone: value, minerals: 0 },
                entries: [],
                gaps: []
              }
            }
          : fact
      )
    } satisfies AiRuntimeProductionCaptureV1;
    expect(projectRuntimeResourceNeedAccounting(capture, [], []).failures).toContain(
      "production_need_liability_frame_value_invalid"
    );
    const parent = normalizeRuntimeProductionCausality(capture);
    expect(parent.failures).toContain("production_need_liability_frame_value_invalid");
    expect(parent.decisions).toEqual([]);
    expect(parent.resourceServices.needAccounting).toEqual([]);
  });
}
