import { expect, test } from "@playwright/test";
import type { RuntimeAssertion } from "./skirmish-ai-runtime-assertion";
import type { RuntimeCheckpoint } from "./skirmish-ai-runtime-checkpoint";
import { evaluateRuntimeRaidRecovery } from "./skirmish-ai-runtime-raid-evaluation";
import type { RuntimeVariantResult } from "./skirmish-ai-runtime-variant-result";

function checkpoint(tick: number, strategyStance: string, recovering: boolean): RuntimeCheckpoint {
  return {
    tick,
    deliveredIncome: tick >= 3000 ? 100 : 0,
    strategyStance,
    scoreMetrics: { damage_dealt: 10, units_killed: 1, buildings_destroyed: 0 },
    squads: [
      ...(tick >= 3000 && recovering ? [{ role: "attack", actorCount: 4 }] : []),
      ...(tick >= 3000 ? [{ role: "defense", actorCount: 2 }] : [])
    ]
  } as unknown as RuntimeCheckpoint;
}

function variant(recoveryCheckpoints: readonly RuntimeCheckpoint[]): RuntimeVariantResult {
  return {
    variantId: "home-raid",
    perturbations: [{ id: "home-raid", tick: 2500, dispatchedActors: 1 }],
    checkpoints: [checkpoint(2000, "defend", false), ...recoveryCheckpoints]
  } as unknown as RuntimeVariantResult;
}

function finalCheckpoint(run: RuntimeVariantResult): RuntimeCheckpoint {
  const final = run.checkpoints.at(-1);
  if (!final) throw new Error("raid_evaluation_final_checkpoint_missing");
  return final;
}

const assertion = { requireRaidDefenseRecovery: true } as RuntimeAssertion;

test("accepts recovery before a later renewed threat returns strategy to defense", () => {
  const run = variant([checkpoint(3000, "pressure", true), checkpoint(12000, "defend", true)]);

  expect(evaluateRuntimeRaidRecovery(assertion, run, finalCheckpoint(run), false)).toEqual([]);
});

test("requires an observed post-raid recovery checkpoint", () => {
  const run = variant([checkpoint(12000, "defend", true)]);

  expect(evaluateRuntimeRaidRecovery(assertion, run, finalCheckpoint(run), false)).toContain(
    "home-raid:raid_recovery_not_observed"
  );
});
