import { expect, test } from "@playwright/test";
import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import { isEvidenceStopSafe, nextEvidenceStopState } from "./skirmish-ai-runtime-evidence-stop";
import { evaluateEvidenceStopAtCheckpoint } from "./skirmish-ai-runtime-evidence-stop-evaluation";
import { productionCheckpoint } from "./skirmish-ai-runtime-digest-fixtures";

const positive: RuntimeAssertionV1 = {
  maximumTick: 1000,
  minimumDecisions: 10,
  minimumAppliedCommands: 1,
  requiredAiFactions: ["Tivara"],
  minimumMilitaryCount: 3
};

function state(input: Partial<Parameters<typeof nextEvidenceStopState>[0]> = {}) {
  return nextEvidenceStopState({
    config: { earliestTick: 200, stableForTicks: 200 },
    role: "subject",
    assertions: [positive],
    tick: 200,
    pendingEventTicks: [],
    allPredicatesSatisfied: true,
    satisfiedSinceTick: null,
    ...input
  });
}

test("positive evidence needs a sustained interval, not one passing checkpoint", () => {
  expect(state()).toEqual({ satisfiedSinceTick: 200, stop: false });
  expect(state({ tick: 400, satisfiedSinceTick: 200 })).toEqual({ satisfiedSinceTick: 200, stop: true });
  expect(state({ tick: 300, satisfiedSinceTick: 200, allPredicatesSatisfied: false })).toEqual({
    satisfiedSinceTick: null,
    stop: false
  });
});

test("pending perturbations and paired controls cannot stop early", () => {
  expect(state({ tick: 400, satisfiedSinceTick: 200, pendingEventTicks: [500] }).stop).toBe(false);
  expect(state({ tick: 400, satisfiedSinceTick: 200, role: "control" }).stop).toBe(false);
});

test("absence, final-composition, temporal, terminal and lifecycle assertions retain the full horizon", () => {
  expect(isEvidenceStopSafe(positive)).toBe(true);
  for (const addition of [
    { maximumMilitaryProducerCount: 2 },
    { requireProductionStopsAtTarget: true },
    { minimumMilitaryTypeCount: 2 },
    { minimumRepeatedMilitaryTypeCount: 3 },
    { requireAiVictory: true },
    { requireProducerReplacementAfterLoss: true }
  ]) {
    expect(isEvidenceStopSafe({ ...positive, ...addition })).toBe(false);
    expect(
      state({ tick: 400, satisfiedSinceTick: 200, assertions: [{ ...positive, ...addition }] as RuntimeAssertionV1[] })
        .stop
    ).toBe(false);
  }
});

test("checkpoint evidence stopping requires every selected scenario assertion", () => {
  const variant = {
    id: "synthetic-stop",
    executionKind: "focused_natural",
    role: "subject",
    seed: 1,
    aiFaction: "Tivara",
    humanFaction: "Skaduwee",
    difficulty: "Normal",
    evidenceStop: { earliestTick: 0, stableForTicks: 0 }
  } satisfies Parameters<typeof evaluateEvidenceStopAtCheckpoint>[0]["variant"];
  const input = {
    variant,
    fixture: {
      schemaVersion: 1,
      evidenceKind: "runtime",
      scenarioIds: ["synthetic-present", "synthetic-missing"],
      recipe: {
        mapLabel: "synthetic",
        aiPlayerNumber: 1,
        simulationTimeScale: 1,
        checkpointTicks: [20],
        variants: [variant]
      },
      assertions: {
        "synthetic-present": { minimumDecisions: 1, minimumAppliedCommands: 0, requiredAiFactions: ["Tivara"] }
      }
    },
    scenarioIds: ["synthetic-present"],
    initialBoundary: {
      state: { ownedActorCount: 1, workerCount: 1, ownedActorNames: [] },
      presetApplication: null,
      initialResourceBalances: {}
    },
    effectiveSeed: 1,
    checkpoints: [{ ...productionCheckpoint(20, "synthetic-item"), workerCount: 1 }],
    perturbations: [],
    aiErrors: [],
    pendingEventTicks: [],
    satisfiedSinceTick: null
  } satisfies Parameters<typeof evaluateEvidenceStopAtCheckpoint>[0];
  expect(evaluateEvidenceStopAtCheckpoint(input)).toEqual({ satisfiedSinceTick: 20, stop: true });
  expect(
    evaluateEvidenceStopAtCheckpoint({
      ...input,
      scenarioIds: ["synthetic-present", "synthetic-missing"],
      satisfiedSinceTick: 10
    })
  ).toEqual({ satisfiedSinceTick: null, stop: false });
});
