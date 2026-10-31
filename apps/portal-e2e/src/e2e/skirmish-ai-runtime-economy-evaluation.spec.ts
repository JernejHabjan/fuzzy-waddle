import { expect, test } from "@playwright/test";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiTestObservation } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { resourceServiceFixture } from "./skirmish-ai-runtime-resource-service-fixture";
import { evaluateRuntimeEconomy } from "./skirmish-ai-runtime-economy-evaluation";
import { evaluateRuntimeResourceRecovery } from "./skirmish-ai-runtime-resource-recovery-evaluation";
import type { RuntimeEconomyContract } from "./skirmish-ai-runtime-economy-contract";

/** Typed synthetic reader controls only; real gameplay acceptance comes from the declared native recipes. */
function fixture() {
  const f = resourceServiceFixture();
  const selected = f.capture.facts.find(
    (fact) => fact.kind === "decision_selected" && fact.decision.gatheringSelections?.length
  );
  if (!selected || selected.kind !== "decision_selected") throw new Error("economy_fixture_selection_missing");
  const observation = { ...createAiTestObservation(), tick: 10, generation: 1 };
  const read = {
    kind: "resource_input_read",
    sequence: 1,
    tick: 10,
    playerNumber: 1,
    read: { captureEpoch: 1, lossEpoch: 0, sequence: 1, playerNumber: 1, generation: 1 },
    resources: [f.selection.ledger]
  } satisfies AiRuntimeProductionFactV1;
  const selection = {
    ...selected,
    sequence: 2,
    tick: 10,
    decision: {
      ...selected.decision,
      input: {
        observation,
        resources: [f.selection.ledger],
        capabilityCatalog: null,
        accessGraph: null,
        cadence: { clock: "simulation", tick: 10, configuredIntervalTicks: 20, completedBefore: 0 },
        snapshotRestoreInProgress: false,
        gaps: []
      },
      acceptedIntents: selected.decision.acceptedIntents.map((intent) => ({
        ...intent,
        reasonCode: "economy:surplus_transfer:1:wood"
      }))
    }
  } satisfies AiRuntimeProductionFactV1;
  const capture = {
    ...f.capture,
    gaps: [],
    droppedFactCount: 0,
    droppedSnapshotCount: 0,
    frontiers: { latestTick: 30, closedThroughTick: 30, requiredTicks: [30], intervals: [], gaps: [] },
    facts: [read, selection, ...f.capture.facts.filter((fact) => fact.kind === "spatial_authority")]
  };
  const variant = { productionCapture: capture, presetInitialOrderCount: 2, presetResourceGrantCount: 1 };
  return { variant, read };
}
const contract = {
  latestTick: 30,
  branch: "surplus_transfer",
  resourceType: "wood",
  minimumDelivered: 3,
  requireZeroIncomeBeforeReceipt: true
} satisfies RuntimeEconomyContract;

test("economy reader accepts native receipt shapes and rejects promised cash, missing credit and inflated income", () => {
  const f = fixture();
  expect(evaluateRuntimeEconomy(contract, f.variant)).toEqual([]);
  const capture = f.variant.productionCapture;
  const withoutCredit = {
    ...capture,
    facts: capture.facts.filter(
      (fact) =>
        !(
          fact.kind === "spatial_authority" &&
          fact.spatial.kind === "resource_service" &&
          fact.spatial.phase === "resource_credit"
        )
    )
  };
  expect(evaluateRuntimeEconomy(contract, { ...f.variant, productionCapture: withoutCredit })).toContain(
    "economy_useful_delivery_missing"
  );
  const inflated = {
    ...capture,
    facts: capture.facts.map((fact) =>
      fact.kind === "decision_selected" && fact.decision.input
        ? {
            ...fact,
            decision: {
              ...fact.decision,
              input: {
                ...fact.decision.input,
                resources: [
                  {
                    ...{ resourceType: ResourceType.Wood, stockpile: 100, reservedUnspent: 0, obligationsDue: 0 },
                    deliveredIncomePerMinute: { status: "known" as const, value: 600, observedTick: 10 }
                  }
                ]
              }
            }
          }
        : fact
    )
  };
  expect(evaluateRuntimeEconomy(contract, { ...f.variant, productionCapture: inflated })).toContain(
    "economy_grant_inflated_delivered_income"
  );
  const overspent = {
    ...capture,
    facts: capture.facts.map(
      (fact): AiRuntimeProductionFactV1 =>
        fact.kind === "decision_selected"
          ? {
              ...fact,
              decision: {
                ...fact.decision,
                acceptedIntents: fact.decision.acceptedIntents.map((intent) => ({
                  ...intent,
                  claims: [
                    ...intent.claims,
                    { kind: "resource", claimId: "claim:overspend", resourceType: ResourceType.Wood, amount: 101 }
                  ]
                }))
              }
            }
          : fact
    )
  };
  expect(evaluateRuntimeEconomy(contract, { ...f.variant, productionCapture: overspent })).toContain(
    "economy_aggregate_cash_overpromised"
  );
});

test("economy history and required branch controls fail closed", () => {
  const f = fixture();
  expect(evaluateRuntimeEconomy(contract, { ...f.variant, productionCapture: undefined })).toEqual([
    "economy_native_history_missing"
  ]);
  expect(evaluateRuntimeEconomy(contract, { ...f.variant, presetInitialOrderCount: 0 })).toContain(
    "economy_surplus_worker_transfer_missing"
  );
  expect(evaluateRuntimeEconomy({ ...contract, branch: "aggregate_budget" }, f.variant)).toContain(
    "economy_budget_contention_not_exercised"
  );
  expect(
    evaluateRuntimeEconomy(contract, {
      ...f.variant,
      productionCapture: { ...f.variant.productionCapture, droppedFactCount: 1 }
    })
  ).toEqual(["economy_native_history_missing"]);
});

test("recovery cannot accept a scheduled loss or bank balance without loaded-cargo native history", () => {
  const f = fixture();
  const requirement = {
    latestTick: 30,
    sourceFixtureActorId: "source",
    sourceStock: 3,
    workerFixtureActorId: "worker",
    fieldFixtureActorId: "field",
    dropOffFixtureActorId: "drain",
    lossEventId: "loss"
  };
  const variant = {
    ...f.variant,
    presetCreatedActorIds: { source: "s", worker: "w", field: "f", drain: "d" },
    perturbations: [{ id: "loss", tick: 15, dispatchedActors: 1, subjectName: "WorkMill", affectedActorId: "d" }],
    checkpoints: []
  };
  expect(evaluateRuntimeResourceRecovery(requirement, variant)).toContain(
    "resource_recovery_loaded_before_loss_missing"
  );
  expect(evaluateRuntimeResourceRecovery(requirement, { ...variant, perturbations: [] })).toEqual([
    "resource_recovery_setup_or_loss_missing"
  ]);
});

test("aggregate budget accepts a contended purchase suppressed before arbitration, while retaining the cash ceiling", () => {
  const f = fixture();
  const baseDemand = {
    demandId: "demand:budget:house" as const,
    purpose: "budget_control",
    capabilityOrRole: "housing",
    unit: "actor_count" as const,
    desired: 1,
    satisfiedActorIds: [],
    queuedIds: [],
    constructingIds: [],
    acceptedNotObservedEffectIds: [],
    preferredObjectNames: [],
    resourceObligations: { [ResourceType.Wood]: 60 }
  };
  const capture = {
    ...f.variant.productionCapture,
    facts: f.variant.productionCapture.facts.map(
      (fact): AiRuntimeProductionFactV1 =>
        fact.kind === "decision_selected"
          ? {
              ...fact,
              decision: {
                ...fact.decision,
                economyProduction: {
                  ...fact.decision.economyProduction,
                  demands: [baseDemand, { ...baseDemand, demandId: "demand:budget:field", capabilityOrRole: "food" }]
                },
                acceptedIntents: fact.decision.acceptedIntents.map((intent) => ({
                  ...intent,
                  claims: [
                    ...intent.claims,
                    { claimId: "claim:budget:wood", kind: "resource", resourceType: ResourceType.Wood, amount: 60 }
                  ]
                }))
              }
            }
          : fact
    )
  };
  expect(
    evaluateRuntimeEconomy({ ...contract, branch: "aggregate_budget" }, { ...f.variant, productionCapture: capture })
  ).toEqual([]);
});
