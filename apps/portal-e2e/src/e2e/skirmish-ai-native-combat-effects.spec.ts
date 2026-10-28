import { test as it, expect } from "@playwright/test";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { StatusEffectType } from "@fuzzy-waddle/probable-waffle-protocol";
import { nativePhysicalDamageFromActor, nativeRetreats, nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { evaluateNativeCombat, nativeRaidTargetRole, nativeSummonExpired, nativeTargetLossTick } from "./skirmish-ai-native-combat-evaluation";

it.describe("RAID-01 native target roles", () => {
  it("checks the authored economic target for each raid branch", () => {
    expect(["workers", "expansion", "unfinished", "protected"].map(nativeRaidTargetRole)).toEqual([
      "contact-group", "enemy-deposit", "contact-group", "contact-group"
    ]);
  });

  it("requires a dedicated raid squad to earn limited-harassment evidence", () => {
    const context = raidContext("squad:attack:primary", "worker");

    expect(evaluateNativeCombat("RAID-01", "workers", context as never)).toContain(
      "raid_limited_suitable_squad_has_no_native_harassment"
    );
    expect(evaluateNativeCombat("RAID-01", "workers",
      raidContext("squad:attack:raid:deposit", "contact", false) as never)).toContain(
        "raid_limited_suitable_squad_has_no_native_harassment"
      );
    expect(evaluateNativeCombat("RAID-01", "workers",
      raidContext("squad:attack:raid:deposit", "contact") as never)).toEqual([]);
    expect(evaluateNativeCombat("RAID-01", "expansion",
      raidContext("squad:attack:raid:expansion", "expansion", false) as never)).toContain(
        "raid_limited_suitable_squad_has_no_native_harassment"
      );
    expect(evaluateNativeCombat("RAID-01", "expansion",
      raidContext("squad:attack:raid:expansion", "expansion") as never)).toEqual([]);
    expect(evaluateNativeCombat("RAID-01", "expansion",
      raidContext("squad:attack:raid:worker", "worker", true, "deposit") as never)).toEqual([]);
    expect(evaluateNativeCombat("RAID-01", "workers",
      raidContext("squad:attack:raid:deposit", "contact", true, undefined, "main-objective-b") as never)).toEqual([]);
  });

  it("rejects any dedicated raid against the protected control target", () => {
    expect(evaluateNativeCombat("RAID-01", "protected",
      raidContext("squad:attack:raid:contact", "contact") as never)).toContain(
        "raid_protected_control_selected_for_harassment"
      );
  });
});

function raidContext(raidSquadId: string, raidTargetId: "worker" | "contact" | "expansion", includeWorkerDropOff = true,
  servingDeposit: "contact" | "deposit" = raidTargetId === "expansion" ? "deposit" : "contact",
  mainTarget = "main-objective") {
  const weapon = {
    weaponType: "test-sword", minRange: 0, range: 1, damage: 5, damageType: 0, cooldown: 1000,
    delays: { fire: 0, hit: 50 }, projectile: null, canTargetAir: false
  };
  const hit = (actorId: string, targetId: string, targetName: string, tick: number, sequence: number) => {
    const attack = (kind: "attack_requested" | "attack_committed") => ({
      sequence: sequence + (kind === "attack_committed" ? 1 : 0), tick, playerNumber: 2, kind: "native_combat",
      operation: {
        kind, actor: { actorId, playerNumber: 2, alive: true, indexed: true },
        target: { actorId: targetId, objectName: targetName, playerNumber: 1 },
        weapon, distance: 1, highGroundRangeBonus: 0, targetFlying: false, stunned: false,
        clockTick: tick, sceneActive: true, snapshotRestoreInProgress: false, gaps: []
      }
    });
    return [attack("attack_requested"), attack("attack_committed"), {
      sequence: sequence + 2, tick: tick + 1, playerNumber: 1, kind: "native_damage",
      damage: {
        initiator: { actorId, playerNumber: 2 }, target: { actorId: targetId, objectName: targetName, playerNumber: 1 },
        targetInCaptureScene: true, initiatorInCaptureScene: true, amount: 5, damageType: 0,
        healthAfter: 95, armourAfter: 0, damageTick: tick + 1, sceneActive: true, snapshotRestoreInProgress: false
      }
    }];
  };
  const raiderId = "raider";
  const targetId = raidTargetId === "worker" ? "worker" : raidTargetId === "expansion" ? "deposit" : "contact";
  const mainTargetId = mainTarget === "main-objective-b" ? "main-objective-b" : "main-objective";
  const workerDropOff = includeWorkerDropOff ? [{ sequence: 7, tick: 40, playerNumber: 1, kind: "spatial_authority",
    spatial: { clockTick: 40, snapshotRestoreInProgress: false, sceneActive: true, gaps: [], kind: "service_attempt",
      attemptId: 2, operation: "drop_off", phase: "resolved", amount: 10,
      source: { actorId: "worker", playerNumber: 1, alive: true, indexed: true },
      target: { actorId: servingDeposit, playerNumber: 1, alive: true, indexed: true },
      sourceInCaptureScene: true, targetInCaptureScene: true, lifetimeValid: true } }] : [];
  return {
    roles: { "enemy-worker": "worker", "contact-group": "contact", "enemy-deposit": "deposit",
      "front-target-a": "main-objective", "front-target-b": "main-objective-b" },
    facts: [...hit(raiderId, targetId, raidTargetId === "worker" ? "SkaduweeWorkerMale" : "WorkMill", 10, 1),
      ...hit("main-army", mainTargetId, "Sandhold", 20, 4), ...workerDropOff],
    frames: [{ tick: 10, decision: { input: { capabilityCatalog: { entries: [] } }, missionState: { squads: [
      { squadId: raidSquadId, role: "attack", actorIds: [raiderId], tactics: { targetActorId: targetId } },
      { squadId: "squad:attack:primary", role: "attack", actorIds: ["main-army"], tactics: { targetActorId: mainTargetId } }
    ] } } }],
    arrived: (actorId: string) => actorId === raiderId ? [{}] : []
  };
}

it.describe("FIGHT-05 target-loss timing", () => {
  it("uses the applied native loss event tick instead of assuming tick 400", () => {
    const context = { result: { perturbations: [{ id: "loss-contact-group", tick: 200, affectedActorId: "target" }] } };
    expect(nativeTargetLossTick(context as ReturnType<typeof nativeScenarioContext>, "target")).toBe(200);
    expect(nativeTargetLossTick(context as ReturnType<typeof nativeScenarioContext>, "other-target")).toBeUndefined();
  });
});

it.describe("temporary native support expiry", () => {
  it("requires the same owned summon to register and later unregister", () => {
    const registered = { kind: "actor_registered", tick: 10, actor: { actorId: "totem-a", objectName: "HealingTotem", playerNumber: 2 } };
    const removed = { kind: "actor_unregistered", tick: 410, actorId: "totem-a" };
    expect(nativeSummonExpired([registered, removed] as never, "HealingTotem", 2)).toBe(true);
    expect(nativeSummonExpired([registered, { ...removed, actorId: "totem-b" }] as never, "HealingTotem", 2)).toBe(false);
    expect(nativeSummonExpired([registered, { ...removed, tick: 10 }] as never, "HealingTotem", 2)).toBe(false);
  });

  it("accepts a real totem summon and expiry as the expiry branch effect", () => {
    const registered = { sequence: 1, tick: 10, playerNumber: 2, kind: "actor_registered",
      actor: { actorId: "totem-a", objectName: "HealingTotem", playerNumber: 2 } };
    const cooldown = { sequence: 2, tick: 10, playerNumber: 2, kind: "native_combat",
      operation: { kind: "spell_cooldown_started", actor: { actorId: "caster", playerNumber: 2 }, clockTick: 10,
        sceneActive: true, snapshotRestoreInProgress: false, gaps: [], spellType: "healingTotem" } };
    const removed = { sequence: 3, tick: 410, playerNumber: 2, kind: "actor_unregistered", actorId: "totem-a",
      objectName: "HealingTotem", actor: { actorId: "totem-a", objectName: "HealingTotem", playerNumber: 2 } };
    const context = { facts: [registered, cooldown, removed], frames: [], roles: { "support-probe": "caster" } };
    expect(evaluateNativeCombat("FIGHT-04", "support_expiry", context as never)).toEqual([]);
    expect(evaluateNativeCombat("FIGHT-04", "support_expiry", {
      ...context, facts: [registered, cooldown]
    } as never)).toContain("combat_support_has_no_native_applied_effect");
  });
});

it.describe("harmful persistent native zones", () => {
  const contextFor = (includeZone = true, includeDamage = true) => {
    const cooldown = {
      sequence: 1, tick: 10, playerNumber: 2, kind: "native_combat",
      operation: { kind: "spell_cooldown_started", actor: { actorId: "caster", playerNumber: 2 },
        clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false, gaps: [], spellType: "firestorm" }
    };
    const damage = {
      sequence: 2, tick: 30, playerNumber: 1, kind: "native_combat",
      operation: { kind: "status_applied", actor: { actorId: "enemy", playerNumber: 1 }, clockTick: 30,
        sceneActive: true, snapshotRestoreInProgress: false, gaps: [],
        effect: { type: StatusEffectType.Burning, damagePerTick: 5 } }
    };
    const frame = {
      tick: 20,
      decision: { input: { effects: includeZone ? [{ effectId: "zone:firestorm", owner: 2, relation: "self",
        position: { x: 5, y: 5, z: 0 }, targetDomains: ["ground"], expiresAt: { status: "known", value: 170 },
        radius: 4, influence: "mixed" }] : [] }, missionState: { support: [] } }
    };
    return {
      capture: { playerNumber: 2 }, opponent: { playerNumber: 1 }, roles: { "support-probe": "caster" },
      facts: includeDamage ? [cooldown, damage] : [cooldown], frames: [frame]
    };
  };

  it("accepts an owned observed zone with a native damaging status on the opposing faction", () => {
    expect(evaluateNativeCombat("FIGHT-04", "zone", contextFor() as never)).toEqual([]);
  });

  it("rejects a zone without captured opposing damage or an observed owned zone", () => {
    expect(evaluateNativeCombat("FIGHT-04", "zone", contextFor(true, false) as never))
      .toContain("combat_actual_harmful_zone_never_observed");
    expect(evaluateNativeCombat("FIGHT-04", "zone", contextFor(false, true) as never))
      .toContain("combat_support_has_no_native_applied_effect");
  });
});

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
    expect(nativePhysicalDamageFromActor(context, "air-output")).toEqual([actual]);
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

function fight02Context(uncommittedRequests = 0): ReturnType<typeof nativeScenarioContext> {
  const rangedId = "ranged-probe", targetId = "contact";
  const weapon = {
    weaponType: "test-bow", canTargetAir: false, damage: 5, damageType: 0, cooldown: 1000,
    minRange: 1, range: 5, highGroundRangeBonus: 0, projectile: null, delays: { fire: 0, hit: 200 }
  };
  const facts: unknown[] = Array.from({ length: 4 }, (_, index) => {
    const tick = 10 + index * 30;
    const operation = {
      actor: { actorId: rangedId, playerNumber: 2, alive: true, indexed: true },
      actorTile: { x: 2, y: 2 }, clockTick: tick, sceneActive: true,
      snapshotRestoreInProgress: false, gaps: [],
      target: { actorId: targetId, objectName: "Target", playerNumber: 1 },
      targetTile: { x: 5, y: 2 }, weapon, distance: 3, highGroundRangeBonus: 0, targetFlying: false, stunned: false
    };
    return [
      { sequence: index * 2 + 1, tick, kind: "native_combat", operation: { ...operation, kind: "attack_requested" } },
      { sequence: index * 2 + 2, tick, kind: "native_combat", operation: { ...operation, kind: "attack_committed" } }
    ];
  }).flat();
  for (let index = 0; index < uncommittedRequests; index += 1) {
    const tick = 200 + index * 30;
    facts.push({
      sequence: 20 + index, tick, kind: "native_combat",
      operation: {
        actor: { actorId: rangedId, playerNumber: 2, alive: true, indexed: true },
        actorTile: { x: 2, y: 2 }, clockTick: tick, sceneActive: true,
        snapshotRestoreInProgress: false, gaps: [],
        target: { actorId: targetId, objectName: "Target", playerNumber: 1 },
        targetTile: { x: 5, y: 2 }, weapon, distance: 3, highGroundRangeBonus: 0,
        targetFlying: false, stunned: false, kind: "attack_requested"
      }
    });
  }
  facts.push({
    sequence: 9, tick: 14, playerNumber: 2, kind: "native_damage",
    damage: {
      initiator: { actorId: rangedId, playerNumber: 2 },
      target: { actorId: targetId, objectName: "Target", playerNumber: 1 },
      targetInCaptureScene: true, initiatorInCaptureScene: true, amount: 5, damageType: 0,
      healthAfter: 95, armourAfter: 0, damageTick: 14, sceneActive: true, snapshotRestoreInProgress: false
    }
  });
  return {
    roles: { "ranged-probe": rangedId },
    facts,
    frames: [{ tick: 20, decision: { input: { capabilityCatalog: { entries: [] } } },
      tacticalBoundary: { actors: [{ identity: { actorId: rangedId }, health: 40,
        combat: { status: "known", value: { maxHealth: 100 } } }] } }],
    capture: { frontiers: { intervals: [{ actors: [{ identity: {
      actorId: rangedId, active: true, alive: true, indexed: true, finished: true
    } }] }] } },
    arrived: () => [{}]
  } as unknown as ReturnType<typeof nativeScenarioContext>;
}

it.describe("FIGHT-02 native attack outcomes", () => {
  it("does not infer cancelled windups from a low ratio of committed attacks to hits", () => {
    expect(evaluateNativeCombat("FIGHT-02", "escape", fight02Context()))
      .not.toContain("combat_excessive_cancelled_windups");
    expect(evaluateNativeCombat("FIGHT-02", "escape", fight02Context()))
      .not.toContain("combat_preserved_actor_no_useful_shot");
  });

  it("detects repeated ranged attack requests with no matching native commit", () => {
    expect(evaluateNativeCombat("FIGHT-02", "escape", fight02Context(3)))
      .toContain("combat_excessive_cancelled_windups");
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
