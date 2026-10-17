import { expect, test } from "@playwright/test";
import type { PressureVariant } from "./skirmish-ai-runtime-pressure-evaluation";
import { evaluateRuntimePressureResponse } from "./skirmish-ai-runtime-pressure-evaluation";

const balances = { 2: { food: 200, wood: 200, stone: 200, minerals: 200 } };
const command = { commandId: "first", effectId: "effect:first" };
const contact = {
  objectName: "Banshee", relation: "enemy", visibility: "visible",
  position: { x: 4, y: 8, z: 2 }, healthPermille: 900
};
const defender = {
  squadId: "defense", role: "defense", state: "engage", domain: "ground",
  actorNames: ["TivaraSlingshotFemale"], actorCount: 1, objectiveId: "raider",
  createdTick: 300, lastUsefulEffectTick: 500, terminalReason: null
};
const budget = {
  workers: 6, queuedWorkers: 0, desiredWorkers: 6, foodRunwayTicks: 180,
  economyPermille: 200, defensePermille: 800
};
const safeBudget = { ...budget, desiredWorkers: 8, economyPermille: 650, defensePermille: 350 };

const raid = {
  variantId: "raid", pressureBranch: "raid", initialWorldDigest: "same",
  presetResourceStartCount: 1, presetInitialResourceBalances: balances, initialWorkerCount: 6,
  perturbations: [{ id: "home-raid", tick: 100, dispatchedActors: 2, subjectName: "Banshee" }],
  checkpoints: [
    {
      tick: 20, visibleEnemyFacts: [], economyPosture: "safe", workforcePolicy: null,
      squads: [], appliedCommands: [], workerCount: 6, deliveredIncome: 0
    },
    {
      tick: 300, visibleEnemyFacts: [contact], economyPosture: "emergency", workforcePolicy: budget,
      squads: [], appliedCommands: [command], workerCount: 6, deliveredIncome: 5
    },
    {
      tick: 600, visibleEnemyFacts: [contact], economyPosture: "emergency", workforcePolicy: budget,
      squads: [defender], appliedCommands: [command, { commandId: "defend", effectId: "effect:defend" }],
      workerCount: 6, deliveredIncome: 5
    }
  ]
} as const satisfies PressureVariant;

const control = {
  variantId: "control", pressureBranch: "safe_control", initialWorldDigest: "same",
  presetResourceStartCount: 1, presetInitialResourceBalances: balances, initialWorkerCount: 6,
  perturbations: [],
  checkpoints: [
    {
      tick: 20, visibleEnemyFacts: [], economyPosture: "safe", workforcePolicy: null,
      squads: [], appliedCommands: [], workerCount: 6, deliveredIncome: 0
    },
    {
      tick: 600, visibleEnemyFacts: [], economyPosture: "safe", workforcePolicy: safeBudget,
      squads: [], appliedCommands: [command], workerCount: 7, deliveredIncome: 10
    }
  ]
} as const satisfies PressureVariant;

test.describe("paired low-resource pressure oracle", () => {
  test("requires a real dispatched contact, defensive budget, applied response, and safe growth", () => {
    expect(evaluateRuntimePressureResponse([raid, control])).toEqual([]);
    expect(evaluateRuntimePressureResponse([raid, raid, control, control])).toEqual([]);
    expect(evaluateRuntimePressureResponse([
      { ...raid, checkpoints: raid.checkpoints.map((checkpoint) => ({ ...checkpoint, squads: [] })) }, control
    ])).toContain("pressure_defense_not_applied");
    expect(evaluateRuntimePressureResponse([
      { ...raid, checkpoints: raid.checkpoints.map((checkpoint) => ({ ...checkpoint, visibleEnemyFacts: [] })) }, control
    ])).toContain("pressure_contact_not_observed");
    expect(evaluateRuntimePressureResponse([{ ...raid, perturbations: [] }, control])).toContain(
      "pressure_raid_not_dispatched"
    );
  });

  test("rejects mismatched worlds and an economy control that fails to grow", () => {
    expect(evaluateRuntimePressureResponse([raid, { ...control, initialWorldDigest: "other" }])).toContain(
      "pressure_initial_world_mismatch"
    );
    expect(evaluateRuntimePressureResponse([
      raid,
      { ...control, checkpoints: control.checkpoints.map((checkpoint) => ({ ...checkpoint, workerCount: 6 })) }
    ])).toContain("pressure_control_no_growth");
    expect(evaluateRuntimePressureResponse([raid, { ...control, presetResourceStartCount: 0 }])).toContain(
      "control:pressure_resource_start"
    );
    expect(evaluateRuntimePressureResponse([raid, control, { ...control, variantId: "control-repeat" }])).toContain(
      "pressure_repetition_count"
    );
  });
});
