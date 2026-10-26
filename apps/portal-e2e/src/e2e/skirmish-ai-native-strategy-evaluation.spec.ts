import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { evaluateNativeStrategy } from "./skirmish-ai-native-strategy-evaluation";

const actor = (actorId: string, playerNumber: number) => ({
  actorId,
  objectName: actorId,
  canonicalObjectName: actorId,
  playerNumber,
  active: true,
  alive: true,
  finished: true,
  indexed: true
});

const weapon = {
  damageType: "piercing",
  damage: 5,
  minRange: 1,
  range: 4,
  canTargetAir: false,
  projectile: false,
  delays: { fire: 0, hit: 0 },
  cooldown: 1000
} as never;

function attackFacts(sequence: number, tick: number, targetId: string): AiRuntimeProductionFactV1[] {
  const source = actor("attacker", 2), target = actor(targetId, 1);
  const operation = (kind: "attack_requested" | "attack_committed") => ({
    kind,
    actor: source,
    target,
    actorTile: { x: 1, y: 1 },
    targetTile: { x: 3, y: 1 },
    clockTick: tick,
    sceneActive: true,
    snapshotRestoreInProgress: false,
    gaps: [],
    weapon,
    distance: 2,
    highGroundRangeBonus: 0,
    targetFlying: false,
    stunned: false
  });
  return [
    { sequence, tick, playerNumber: 2, kind: "native_combat", operation: operation("attack_requested") },
    { sequence: sequence + 1, tick, playerNumber: 2, kind: "native_combat", operation: operation("attack_committed") },
    {
      sequence: sequence + 2,
      tick: tick + 10,
      playerNumber: 1,
      kind: "native_damage",
      damage: {
        target: { actorId: targetId, playerNumber: 1 },
        initiator: { actorId: "attacker", playerNumber: 2 },
        targetInCaptureScene: true,
        initiatorInCaptureScene: true,
        amount: 5,
        healthAfter: 95,
        armourAfter: 0,
        damageType: "piercing",
        damageTick: tick + 10,
        sceneActive: true,
        snapshotRestoreInProgress: false
      }
    }
  ] as unknown as AiRuntimeProductionFactV1[];
}

function context(facts: AiRuntimeProductionFactV1[], frames: unknown[] = []) {
  const roles = {
    "contact-group": "contact-group",
    "front-target-a": "front-target-a",
    "front-target-b": "front-target-b",
    "reinforcement-0": "reinforcement-0"
  };
  return {
    facts,
    frames,
    roles,
    role: (name: keyof typeof roles) => roles[name]
  } as unknown as ReturnType<typeof nativeScenarioContext>;
}

test("STRAT-05 quiet control accepts physical damage on another authored front after the contact target is spent", () => {
  const facts = [...attackFacts(1, 200, "contact-group"), ...attackFacts(4, 450, "front-target-b")];

  expect(evaluateNativeStrategy("STRAT-05", "quiet", context(facts))).toEqual([]);
  expect(evaluateNativeStrategy("STRAT-05", "quiet", context(attackFacts(1, 200, "contact-group")))).toContain(
    "strategy_counterforce_reassessment_or_control_continuation_missing"
  );
});

test("STRAT-05 blocked-retreat accepts a bounded counterforce response when no retreat completes", () => {
  const frames = [
    {
      tick: 200,
      decision: { strategy: { objectiveId: "opening" }, missionState: { squads: [] }, acceptedIntents: [],
        input: { observation: { actors: [] } } }
    },
    {
      tick: 400,
      decision: { strategy: { objectiveId: "opening" }, missionState: { squads: [] }, acceptedIntents: [],
        input: { observation: { actors: [{ actorId: "reinforcement-0", relation: "enemy", visibility: "visible" }] } } }
    },
    {
      tick: 600,
      decision: { strategy: { objectiveId: "counterforce" }, missionState: { squads: [] }, acceptedIntents: [],
        input: { observation: { actors: [] } } }
    }
  ];
  const initial = attackFacts(1, 200, "front-target-b"), counterforce = attackFacts(4, 700, "reinforcement-0");

  expect(evaluateNativeStrategy("STRAT-05", "blocked_retreat", context([...initial, ...counterforce], frames))).toEqual([]);
  expect(evaluateNativeStrategy("STRAT-05", "blocked_retreat", context(initial, frames))).toContain(
    "strategy_counterforce_reassessment_or_control_continuation_missing"
  );
});
