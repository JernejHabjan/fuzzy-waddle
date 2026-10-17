import { expect, test } from "@playwright/test";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { evaluateScenario } from "./skirmish-ai-runtime-evaluation";
import { productionCheckpoint } from "./skirmish-ai-runtime-digest-fixtures";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

const fixture: RuntimeFixtureV1 = {
  schemaVersion: 1,
  evidenceKind: "runtime",
  scenarioIds: ["SCOUT-05"],
  recipe: {
    mapLabel: "test",
    aiPlayerNumber: 2,
    simulationTimeScale: 1,
    checkpointTicks: [20, 400],
    variants: ["west", "east"].map((id) => ({
      id,
      executionKind: "focused_preset",
      role: "standalone",
      seed: 1,
      aiFaction: "Tivara",
      humanFaction: "Skaduwee",
      difficulty: "Normal"
    }))
  },
  assertions: {
    "SCOUT-05": {
      minimumDecisions: 0,
      minimumAppliedCommands: 0,
      requiredAiFactions: ["Tivara"],
      requireHiddenStateParity: true,
      requiredHiddenActorName: "Banshee"
    }
  }
};
const intent: AiIntentV1 = {
  kind: "move",
  intentId: "intent:scout",
  effectId: "effect:scout",
  planId: "plan:scout",
  demandId: null,
  lane: "scouting",
  proposedTick: 20,
  urgencyClass: 1,
  utility: 700,
  preconditions: [],
  claims: [],
  reasonCode: "scout",
  actorIds: ["scout"],
  logicalPosition: { x: 2, y: 3, z: 0 }
};

/** Synthetic reader controls only; real hidden-world and decision parity come from the native paired recipe. */
function variant(id: string): RuntimeVariantResultV1 {
  return {
    variantId: id,
    mapLabel: "test",
    stopReason: "checkpoint_ceiling",
    seed: 1,
    aiFaction: "Tivara",
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
    initialWorldDigest: id,
    outcomeDigest: "same",
    perturbations: [],
    aiErrors: [],
    checkpoints: [20, 400].map((tick) => ({
      ...productionCheckpoint(tick, "queue"),
      workerCount: 1,
      decisionIntents: [intent],
      permittedObservationDigest: `same:${tick}`
    }))
  };
}

test("hidden-state parity compares exact later intents including destinations", () => {
  const left = variant("west"),
    right = variant("east");
  expect(evaluateScenario("SCOUT-05", fixture, [left, right])).toEqual([]);
  const late = right.checkpoints.map((checkpoint, index) =>
    index === 0
      ? checkpoint
      : {
          ...checkpoint,
          decisionIntents: [{ ...intent, logicalPosition: { x: 20, y: 3, z: 0 } }]
        }
  );
  expect(evaluateScenario("SCOUT-05", fixture, [left, { ...right, checkpoints: late }])).toContain(
    "hidden_state_decision_leak"
  );
});

test("hidden-state parity fails missing exact inputs, observations, and checkpoint pairing", () => {
  const left = variant("west"),
    right = variant("east");
  for (const field of ["decisionIntents", "permittedObservationDigest"] as const) {
    const changed = {
      ...right,
      checkpoints: right.checkpoints.map((checkpoint) => ({ ...checkpoint, [field]: undefined }))
    };
    expect(evaluateScenario("SCOUT-05", fixture, [left, changed])).not.toEqual([]);
  }
  expect(
    evaluateScenario("SCOUT-05", fixture, [left, { ...right, checkpoints: right.checkpoints.slice(0, 1) }])
  ).toContain("hidden_state_checkpoint_pair_missing");
});

test("a later legitimate contact difference permits changed decisions", () => {
  const left = variant("west"),
    right = variant("east");
  const checkpoints = right.checkpoints.map((checkpoint, index) =>
    index === 0
      ? checkpoint
      : {
          ...checkpoint,
          visibleEnemyFacts: [
            {
              objectName: "Banshee",
              relation: "enemy",
              visibility: "visible",
              position: { x: 3, y: 4, z: 0 },
              healthPermille: 1000
            }
          ],
          permittedObservationDigest: "newly-observed",
          decisionIntents: []
        }
  );
  expect(evaluateScenario("SCOUT-05", fixture, [left, { ...right, checkpoints }])).toEqual([]);
});
