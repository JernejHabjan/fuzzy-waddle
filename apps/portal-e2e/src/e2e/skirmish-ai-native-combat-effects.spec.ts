import { test as it, expect } from "@playwright/test";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { nativePhysicalDamageFromActor, nativeRetreats, nativeWeaponHits } from "./skirmish-ai-native-combat-effects";

const damage = (overrides: Partial<Extract<AiRuntimeProductionFactV1, { kind: "native_damage" }>> = {}) => ({
  sequence: 1,
  tick: 40,
  playerNumber: 1,
  kind: "native_damage",
  damage: {
    target: { actorId: "backline", playerNumber: 1 },
    initiator: { actorId: "air-output", playerNumber: 2 },
    targetInCaptureScene: true,
    initiatorInCaptureScene: true,
    amount: 9,
    healthAfter: 91,
    armourAfter: 0,
    damageTick: 40,
    sceneActive: true,
    snapshotRestoreInProgress: false
  },
  ...overrides
}) as Extract<AiRuntimeProductionFactV1, { kind: "native_damage" }>;

it.describe("native physical damage attribution", () => {
  it("matches only positive exact actor-to-target damage after the paid output", () => {
    const actual = damage();
    const context = { facts: [actual] } as ReturnType<typeof nativeScenarioContext>;

    expect(nativePhysicalDamageFromActor(context, "air-output", "backline", 40)).toEqual([actual]);
    expect(nativePhysicalDamageFromActor(context, "other-output", "backline")).toEqual([]);
    expect(nativePhysicalDamageFromActor(context, "air-output", "other-target")).toEqual([]);
    expect(nativePhysicalDamageFromActor(context, "air-output", "backline", 41)).toEqual([]);
    expect(nativePhysicalDamageFromActor(context, undefined, "backline")).toEqual([]);
  });

  it("rejects callback facts without a live physical damage event", () => {
    const context = {
      facts: [
        damage({ damage: { ...damage().damage, amount: 0 } }),
        damage({ damage: { ...damage().damage, damageTick: 39 } }),
        damage({ damage: { ...damage().damage, initiatorInCaptureScene: false } }),
        damage({ damage: { ...damage().damage, targetInCaptureScene: false } }),
        damage({ damage: { ...damage().damage, sceneActive: false } }),
        damage({ damage: { ...damage().damage, snapshotRestoreInProgress: true } })
      ]
    } as ReturnType<typeof nativeScenarioContext>;

    expect(nativePhysicalDamageFromActor(context, "air-output", "backline")).toEqual([]);
  });
});

it.describe("native weapon hits against building footprints", () => {
  const actor = (actorId: string, objectName: string, playerNumber: number) => ({
    actorId,
    objectName,
    canonicalObjectName: objectName as ObjectNames,
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
  const hitFacts = (targetName: string, distance: number) => [
    {
      sequence: 1,
      tick: 10,
      playerNumber: 2,
      kind: "native_combat",
      operation: {
        kind: "attack_requested",
        actor: actor("attacker", "TivaraMacemanMale", 2),
        target: actor("target", targetName, 1),
        weapon,
        distance,
        highGroundRangeBonus: 0,
        targetFlying: false,
        stunned: false,
        gaps: [],
        sceneActive: true,
        snapshotRestoreInProgress: false,
        clockTick: 10
      }
    },
    {
      sequence: 2,
      tick: 10,
      playerNumber: 2,
      kind: "native_combat",
      operation: {
        kind: "attack_committed",
        actor: actor("attacker", "TivaraMacemanMale", 2),
        target: actor("target", targetName, 1),
        weapon
      }
    },
    damage({
      sequence: 3,
      tick: 20,
      playerNumber: 1,
      damage: {
        ...damage().damage,
        target: actor("target", targetName, 1),
        initiator: actor("attacker", "TivaraMacemanMale", 2),
        amount: 6,
        damageType: 0,
        damageTick: 20
      }
    })
  ];
  const contextFor = (facts: readonly unknown[], targetName: string, footprintRadiusTiles: number) => ({
    facts,
    frames: [{
      decision: {
        input: {
          capabilityCatalog: {
            entries: [{
              sourceObjectName: targetName,
              constructionProfile: { footprintRadiusTiles }
            }]
          }
        }
      }
    }]
  }) as unknown as ReturnType<typeof nativeScenarioContext>;

  it("accepts a physical hit at a building's adjacent footprint edge", () => {
    const facts = hitFacts("FrostForge", 2);
    const context = contextFor(facts, "FrostForge", 1);

    expect(nativeWeaponHits(context, "target")).toHaveLength(1);
  });

  it("keeps the ordinary weapon range for units and targets beyond the footprint", () => {
    expect(nativeWeaponHits(contextFor(hitFacts("SkaduweeWorkerMale", 2), "SkaduweeWorkerMale", 0), "target"))
      .toEqual([]);
    expect(nativeWeaponHits(contextFor(hitFacts("FrostForge", 3), "FrostForge", 1), "target")).toEqual([]);
  });
});

it("matches an accepted retreat move to its native execution after normalizing the effect prefix", () => {
  const movement = {
    callerAttributed: true,
    gaps: [],
    returned: "true",
    arrival: "original_destination",
    started: { tick: 500 },
    observations: [
      {
        spatial: {
          source: { actorId: "retreating-unit" },
          caller: {
            order: {
              commandContext: { execution: { effectId: "stage13:retreat:retreating-unit:500" } }
            }
          }
        }
      }
    ]
  };
  const frame = {
    tick: 500,
    decision: {
      missionState: { squads: [{ state: "retreat", actorIds: ["retreating-unit"] }] },
      acceptedIntents: [
        { kind: "move", actorIds: ["retreating-unit"], effectId: "effect:stage13:retreat:retreating-unit:500" }
      ]
    }
  };
  const context = {
    frames: [frame],
    capture: { frontiers: { intervals: [{ actors: [{ identity: {
      actorId: "retreating-unit", active: true, alive: true, indexed: true, finished: true
    } }] }] } },
    arrived: () => [movement]
  } as unknown as ReturnType<typeof nativeScenarioContext>;

  expect(nativeRetreats(context, 400)).toEqual([movement]);
  const unrelatedContext = {
    ...context,
    frames: [{
      ...frame,
      decision: { ...frame.decision, acceptedIntents: [
        { kind: "move", actorIds: ["retreating-unit"], effectId: "effect:unrelated" }
      ] }
    }]
  } as unknown as ReturnType<typeof nativeScenarioContext>;
  expect(nativeRetreats(unrelatedContext, 400)).toEqual([]);
});
