import { expect, test } from "@playwright/test";
import { checkRuntimeProductionReportBridge } from "./skirmish-ai-runtime-production-report";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

function variant(overrides: Partial<RuntimeVariantResultV1> = {}): RuntimeVariantResultV1 {
  return {
    variantId: "marked",
    mapLabel: "fixture",
    stopReason: "checkpoint_ceiling",
    seed: 1,
    aiFaction: "tivara" as never,
    initialOwnedActorCount: 1,
    initialWorkerCount: 1,
    presetFixtureId: null,
    presetCreatedActorNames: [],
    presetCreatedActorIds: {},
    presetResourceGrantCount: 0,
    presetResourceStartCount: 0,
    presetInitialResourceBalances: {},
    presetQueuedItemCount: 0,
    presetInitialQueueItems: [],
    presetInitialOrderCount: 0,
    determinismGroup: null,
    initialWorldDigest: "world",
    outcomeDigest: "outcome",
    checkpoints: [],
    perturbations: [],
    aiErrors: [],
    ...overrides
  };
}

test("marked runtime report bridge rejects missing raw or normalized production evidence", () => {
  expect(checkRuntimeProductionReportBridge("PRO-03", variant())).toEqual([
    "runtime_production_report_missing:PRO-03:marked"
  ]);
  expect(
    checkRuntimeProductionReportBridge(
      "PRO-03",
      variant({
        productionCapture: { facts: [{ kind: "decision_selected" }] } as never
      })
    )
  ).toEqual(["runtime_production_report_missing:PRO-03:marked"]);
});

test("marked runtime bridge requires selected decisions to survive normalization", () => {
  const identity = { playerNumber: 2, tick: 10, generation: 3, decisionSequence: 4, authorityEpoch: 5 };
  const capture = { facts: [{ kind: "decision_selected", sequence: 8, tick: 10, decision: { identity } }] };
  const report = {
    decisions: [{ selectedSequence: 8, selectedTick: 10, identity }],
    resourceServices: { needAccounting: [], applicationIntervals: [] }
  };
  expect(
    checkRuntimeProductionReportBridge(
      "PRO-06",
      variant({
        productionCapture: capture as never,
        productionCausality: report as never
      })
    )
  ).toEqual([]);
  expect(
    checkRuntimeProductionReportBridge(
      "PRO-06",
      variant({
        productionCapture: capture as never,
        productionCausality: {
          ...report,
          decisions: [{ ...report.decisions[0], identity: { ...identity, tick: 9 } }]
        } as never
      })
    )
  ).toEqual(["runtime_production_decision_bridge_identity_mismatch:PRO-06:marked"]);
});

test("production report bridge remains scoped and rejects useful quantities before authority is complete", () => {
  expect(checkRuntimeProductionReportBridge("OTHER", variant())).toEqual([]);
  expect(
    checkRuntimeProductionReportBridge(
      "PRO-07",
      variant({
        productionCapture: { facts: [] } as never,
        productionCausality: {
          decisions: [],
          resourceServices: {
            needAccounting: [{ applications: [{ usefulContribution: 1 }] }],
            applicationIntervals: []
          }
        } as never
      })
    )
  ).toEqual([
    "runtime_production_decision_bridge_incomplete:PRO-07:marked",
    "runtime_production_partial_channel_activated:PRO-07:marked"
  ]);
});
