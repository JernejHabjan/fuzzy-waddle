import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { evaluateNativeRaidStrategy } from "./skirmish-ai-native-raid-strategy-evaluation";

const actor = (actorId: string, objectName: string, playerNumber: number) => ({
  actorId,
  objectName,
  canonicalObjectName: objectName,
  playerNumber,
  active: true,
  alive: true,
  finished: true,
  indexed: true
});

const weapon = {
  minRange: 0,
  range: 1,
  damage: 6,
  damageType: 0,
  cooldown: 1000,
  delays: { fire: 0, hit: 50 },
  projectile: null,
  canTargetAir: false
};

function raidContext(targetHealthAfter: number) {
  const roles = Object.fromEntries([
    ...Array.from({ length: 30 }, (_, index) => [`army-${index}`, `army-${index}`]),
    ["main-target", "main-target"],
    ...Array.from({ length: 4 }, (_, index) => [`raider-${index}`, `raider-${index}`])
  ]);
  const attacker = actor("army-0", "TivaraMacemanMale", 2), target = actor("main-target", "FrostForge", 1);
  const facts = [
    {
      sequence: 1,
      tick: 300,
      playerNumber: 2,
      kind: "native_combat",
      operation: {
        kind: "attack_requested",
        actor: attacker,
        target,
        weapon,
        distance: 2,
        highGroundRangeBonus: 0,
        targetFlying: false,
        stunned: false,
        gaps: [],
        sceneActive: true,
        snapshotRestoreInProgress: false,
        clockTick: 300
      }
    },
    {
      sequence: 2,
      tick: 300,
      playerNumber: 2,
      kind: "native_combat",
      operation: { kind: "attack_committed", actor: attacker, target, weapon }
    },
    {
      sequence: 3,
      tick: 310,
      playerNumber: 1,
      kind: "native_damage",
      damage: {
        target,
        initiator: attacker,
        targetInCaptureScene: true,
        initiatorInCaptureScene: true,
        amount: 6,
        healthAfter: targetHealthAfter,
        armourAfter: 0,
        damageType: 0,
        damageTick: 310,
        sceneActive: true,
        snapshotRestoreInProgress: false
      }
    }
  ] as unknown as AiRuntimeProductionFactV1[];
  const frames = [{
    tick: 800,
    decision: {
      missionState: { squads: [] },
      input: {
        observation: { actors: [{ actorId: "raider-0", visibility: "visible" }] },
        capabilityCatalog: { entries: [{ sourceObjectName: "FrostForge", constructionProfile: { footprintRadiusTiles: 1 } }] }
      }
    }
  }];
  return {
    facts,
    frames,
    roles,
    role: (name: string) => roles[name],
    arrived: () => []
  } as unknown as ReturnType<typeof nativeScenarioContext>;
}

test("STRAT-02 accepts a physically proven main-objective kill before the later raid contact", () => {
  expect(evaluateNativeRaidStrategy("STRAT-02", "quiet", raidContext(0))).toEqual([]);
  expect(evaluateNativeRaidStrategy("STRAT-02", "quiet", raidContext(1))).toContain(
    "raid_minor_threat_recalled_main_force_or_stopped_native_offense"
  );
});
