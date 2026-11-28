import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFact } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { nativeScenarioContext } from "../../contracts/skirmish-ai-native-scenario-context";
import { evaluateNativeFrontProgression, evaluateNativeFronts } from "../effects/skirmish-ai-native-combat-evaluation";
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

function attackFacts(
  sequence: number,
  tick: number,
  targetId: string,
  sourceActorId = "attacker",
  healthAfter = 95
): AiRuntimeProductionFact[] {
  const source = actor(sourceActorId, 2),
    target = actor(targetId, 1);
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
        initiator: { actorId: sourceActorId, playerNumber: 2 },
        targetInCaptureScene: true,
        initiatorInCaptureScene: true,
        amount: 5,
        healthAfter,
        armourAfter: 0,
        damageType: "piercing",
        damageTick: tick + 10,
        sceneActive: true,
        snapshotRestoreInProgress: false
      }
    }
  ] as unknown as AiRuntimeProductionFact[];
}

function context(facts: AiRuntimeProductionFact[], frames: unknown[] = [], perturbations: unknown[] = []) {
  const roles = {
    "contact-group": "contact-group",
    "front-target-a": "front-target-a",
    "front-target-b": "front-target-b",
    "enemy-home": "enemy-home",
    "noise-scout": "noise-scout",
    "reinforcement-0": "reinforcement-0"
  };
  return {
    facts,
    frames,
    roles,
    role: (name: keyof typeof roles) => roles[name],
    result: { perturbations }
  } as unknown as ReturnType<typeof nativeScenarioContext>;
}

test("STRAT-04 counts progress on the committed objective and permits effect-backed deadline extension", () => {
  const mission = (dueTick: number, lastUsefulEffectTick: number | null) => ({
    squadId: "squad:attack:primary",
    role: "attack",
    state: "engage",
    objectiveId: "front-target-b",
    actorIds: ["attacker"],
    lifecycle: {
      createdTick: 20,
      lastUsefulEffectTick,
      effectDeadline: { dueTick }
    }
  });
  const frames = [
    {
      tick: 399,
      decision: {
        strategy: { goalId: "goal:attack" },
        missionState: { squads: [mission(2420, null)] },
        input: { observation: { actors: [] } }
      }
    },
    {
      tick: 400,
      decision: {
        strategy: { goalId: "goal:attack" },
        missionState: { squads: [mission(2420, null)] },
        input: { observation: { actors: [{ actorId: "noise-scout", visibility: "visible" }] } }
      }
    },
    {
      tick: 440,
      decision: {
        strategy: { goalId: "goal:attack" },
        missionState: { squads: [mission(2820, 400)] },
        input: { observation: { actors: [{ actorId: "noise-scout", visibility: "visible" }] } }
      }
    }
  ];
  const effects = attackFacts(1, 380, "front-target-b");

  expect(evaluateNativeStrategy("STRAT-04", "noise", context(effects, frames))).toEqual([]);
});

test("FIGHT-03 accepts separate useful native groups when the first front closes before the second is served", () => {
  const frames = [
    {
      tick: 100,
      decision: {
        missionState: {
          squads: [{ role: "attack", tactics: { targetActorId: "front-target-a" }, actorIds: ["attacker-a"] }]
        }
      }
    },
    {
      tick: 200,
      decision: {
        missionState: {
          squads: [{ role: "attack", tactics: { targetActorId: "front-target-b" }, actorIds: ["attacker-b"] }]
        }
      }
    }
  ];
  const facts = [
    ...attackFacts(1, 120, "front-target-a", "attacker-a"),
    ...attackFacts(4, 220, "front-target-b", "attacker-b")
  ];

  expect(evaluateNativeFrontProgression("equal", context(facts, frames))).toEqual([]);
  expect(evaluateNativeFronts("equal", context(facts, frames))).toContain(
    "combat_independent_physically_useful_fronts_missing"
  );
});

test("FIGHT-03 does not credit stale damage after its actor has switched fronts", () => {
  const frames = [
    {
      tick: 100,
      decision: {
        missionState: {
          squads: [{ role: "attack", tactics: { targetActorId: "front-target-a" }, actorIds: ["attacker-a"] }]
        }
      }
    },
    {
      tick: 200,
      decision: {
        missionState: {
          squads: [{ role: "attack", tactics: { targetActorId: "front-target-b" }, actorIds: ["attacker-b"] }]
        }
      }
    }
  ];
  const facts = [
    ...attackFacts(1, 220, "front-target-a", "attacker-a"),
    ...attackFacts(4, 230, "front-target-b", "attacker-b")
  ];

  expect(evaluateNativeFrontProgression("equal", context(facts, frames)).at(0)).toBe(
    "combat_front_assignment_native_damage_missing:a"
  );
});

test("FIGHT-03 infeasible front releases without requiring impact on the lost target", () => {
  const frames = [
    {
      tick: 300,
      decision: {
        missionState: {
          squads: [
            { role: "attack", tactics: { targetActorId: "front-target-a" }, actorIds: ["attacker-a"] },
            { role: "attack", tactics: { targetActorId: "front-target-b" }, actorIds: ["attacker-b"] }
          ]
        }
      }
    },
    {
      tick: 400,
      decision: {
        missionState: {
          squads: [{ role: "attack", tactics: { targetActorId: "front-target-b" }, actorIds: ["attacker-b"] }]
        }
      }
    },
    {
      tick: 800,
      decision: {
        missionState: {
          squads: [{ role: "attack", tactics: { targetActorId: "front-target-b" }, actorIds: ["attacker-b"] }]
        }
      }
    }
  ];
  const facts = attackFacts(1, 610, "front-target-b", "attacker-b"),
    loss = { id: "loss-front-target-a", tick: 400, affectedActorId: "front-target-a" };

  expect(evaluateNativeFrontProgression("infeasible", context(facts, frames, [loss]))).toEqual([]);
  expect(evaluateNativeFrontProgression("infeasible", context(facts, frames))).toContain(
    "combat_infeasible_front_not_released_independently"
  );
});

test("STRAT-04 preserves the attack mission across contact aliases and legitimate target progression", () => {
  const mission = (objectiveId: string, dueTick: number, lastUsefulEffectTick: number | null) => ({
    squadId: "squad:attack:primary",
    role: "attack",
    state: "engage",
    objectiveId,
    actorIds: ["attacker"],
    lifecycle: {
      createdTick: 20,
      lastUsefulEffectTick,
      effectDeadline: { dueTick }
    }
  });
  const frames = [
    {
      tick: 399,
      decision: {
        strategy: { goalId: "goal:attack" },
        missionState: { squads: [mission("front-target-b", 2420, null)] },
        input: { observation: { actors: [] } }
      }
    },
    {
      tick: 400,
      decision: {
        strategy: { goalId: "goal:attack" },
        missionState: { squads: [mission("hypothesis:evidence:contact:front-target-b", 2420, null)] },
        input: { observation: { actors: [{ actorId: "noise-scout", visibility: "visible" }] } }
      }
    },
    {
      tick: 840,
      decision: {
        strategy: { goalId: "goal:attack" },
        missionState: { squads: [mission("front-target-b", 2420, null)] },
        input: { observation: { actors: [] } }
      }
    },
    {
      tick: 900,
      decision: {
        strategy: { goalId: "goal:attack" },
        missionState: { squads: [mission("enemy-home", 2820, 850)] },
        input: { observation: { actors: [] } }
      }
    },
    {
      tick: 1200,
      decision: {
        strategy: { goalId: "goal:attack" },
        missionState: { squads: [mission("enemy-home", 2820, 850)] },
        input: { observation: { actors: [] } }
      }
    }
  ];
  const effects = [...attackFacts(1, 410, "front-target-b"), ...attackFacts(2, 840, "enemy-home")];

  expect(evaluateNativeStrategy("STRAT-04", "noise", context(effects, frames))).toEqual([]);
  expect(evaluateNativeStrategy("STRAT-04", "noise", context(attackFacts(1, 410, "noise-scout"), frames))).toContain(
    "strategy_minor_noise_reset_commitment_or_stopped_useful_offense"
  );
});

test("STRAT-05 quiet control accepts physical damage on another authored objective after the contact target is spent", () => {
  const facts = [...attackFacts(1, 100, "contact-group"), ...attackFacts(4, 450, "enemy-home")];

  expect(evaluateNativeStrategy("STRAT-05", "quiet", context(facts))).toEqual([]);
  expect(evaluateNativeStrategy("STRAT-05", "quiet", context(attackFacts(1, 100, "contact-group")))).toContain(
    "strategy_counterforce_reassessment_or_control_continuation_missing"
  );
});

test("STRAT-05 blocked-retreat accepts a bounded counterforce response when no retreat completes", () => {
  const frames = [
    {
      tick: 180,
      decision: {
        strategy: { objectiveId: "opening" },
        missionState: { squads: [] },
        acceptedIntents: [],
        input: { observation: { actors: [] } }
      }
    },
    {
      tick: 200,
      decision: {
        strategy: { objectiveId: "opening" },
        missionState: { squads: [] },
        acceptedIntents: [],
        input: { observation: { actors: [{ actorId: "reinforcement-0", relation: "enemy", visibility: "visible" }] } }
      }
    },
    {
      tick: 400,
      decision: {
        strategy: { objectiveId: "counterforce" },
        missionState: { squads: [] },
        acceptedIntents: [],
        input: { observation: { actors: [] } }
      }
    }
  ];
  const initial = attackFacts(1, 100, "front-target-b"),
    counterforce = attackFacts(4, 300, "reinforcement-0");

  expect(evaluateNativeStrategy("STRAT-05", "blocked_retreat", context([...initial, ...counterforce], frames))).toEqual(
    []
  );
  expect(evaluateNativeStrategy("STRAT-05", "blocked_retreat", context(initial, frames))).toContain(
    "strategy_counterforce_reassessment_or_control_continuation_missing"
  );
});

test("STRAT-05 accepts a local defense squad against discovered reinforcements as a future plan response", () => {
  const frames = [
    {
      tick: 180,
      decision: {
        strategy: { objectiveId: "opening" },
        missionState: { squads: [] },
        acceptedIntents: [],
        input: { observation: { actors: [] } }
      }
    },
    {
      tick: 200,
      decision: {
        strategy: { objectiveId: "opening" },
        missionState: { squads: [] },
        acceptedIntents: [],
        input: { observation: { actors: [{ actorId: "reinforcement-0", relation: "enemy", visibility: "visible" }] } }
      }
    },
    {
      tick: 400,
      decision: {
        strategy: { objectiveId: "opening" },
        acceptedIntents: [],
        input: { observation: { actors: [] } },
        missionState: {
          squads: [
            {
              role: "defense",
              state: "engage",
              objectiveId: "reinforcement-0",
              actorIds: ["defender"],
              tactics: { targetActorId: "reinforcement-0" }
            }
          ]
        }
      }
    }
  ];
  const initial = attackFacts(1, 100, "front-target-b"),
    counterforce = attackFacts(4, 300, "reinforcement-0");

  expect(evaluateNativeStrategy("STRAT-05", "blocked_retreat", context([...initial, ...counterforce], frames))).toEqual(
    []
  );
  expect(
    evaluateNativeStrategy(
      "STRAT-05",
      "blocked_retreat",
      context([...initial, ...counterforce], frames.slice(0, 2))
    ).join(",")
  ).toContain("strategy_counterforce_no_fair_future_plan_response");
  const earlyContact = frames.map((frame, index) => (index === 1 ? { ...frame, tick: 199 } : frame));
  expect(
    evaluateNativeStrategy("STRAT-05", "blocked_retreat", context([...initial, ...counterforce], earlyContact))
  ).toContain("strategy_counterforce_seen_before_authored_arrival");
});

test("STRAT-05 accepts initial attackers physically retargeting discovered counterforce", () => {
  const frames = [
    {
      tick: 180,
      decision: {
        strategy: { objectiveId: "opening" },
        missionState: { squads: [] },
        acceptedIntents: [],
        input: { observation: { actors: [] } }
      }
    },
    {
      tick: 200,
      decision: {
        strategy: { objectiveId: "opening" },
        missionState: { squads: [] },
        acceptedIntents: [],
        input: { observation: { actors: [{ actorId: "reinforcement-0", relation: "enemy", visibility: "visible" }] } }
      }
    },
    {
      tick: 400,
      decision: {
        strategy: { objectiveId: "opening" },
        acceptedIntents: [],
        missionState: {
          squads: [
            {
              role: "defense",
              state: "engage",
              objectiveId: "reinforcement-0",
              actorIds: ["attacker"],
              tactics: { targetActorId: "reinforcement-0" }
            }
          ]
        },
        input: { observation: { actors: [] } }
      }
    }
  ];
  const initialAttack = attackFacts(1, 100, "front-target-b"),
    retargetedAttack = attackFacts(4, 300, "reinforcement-0");
  expect(
    evaluateNativeStrategy("STRAT-05", "reinforced", context([...initialAttack, ...retargetedAttack], frames))
  ).toEqual([]);
  expect(evaluateNativeStrategy("STRAT-05", "reinforced", context(initialAttack, frames))).toContain(
    "strategy_counterforce_reassessment_or_control_continuation_missing"
  );
});

test("STRAT-13 measures response to the arriving enemy wave and maintains alternate-front pressure", () => {
  const evaluate = (responds: boolean, alternateFront: "continued" | "destroyed" | "abandoned") => {
    const reinforcementIds = ["reinforcement-0", "reinforcement-1", "reinforcement-2"],
      roles = {
        ...context([], []).roles,
        ...Object.fromEntries(reinforcementIds.map((id) => [id, id]))
      },
      firstFronts = [
        {
          tick: 100,
          decision: {
            missionState: {
              squads: [
                { actorIds: ["front-a-unit"], tactics: { targetActorId: "front-target-a" } },
                { actorIds: ["front-b-unit"], tactics: { targetActorId: "front-target-b" } }
              ]
            }
          }
        }
      ],
      response = responds
        ? [
            {
              tick: 600,
              decision: {
                missionState: {
                  squads: reinforcementIds.map((id, index) => ({
                    actorIds: [`response-${index}`],
                    tactics: { targetActorId: id }
                  }))
                }
              }
            }
          ]
        : [],
      facts = [
        ...attackFacts(1, 120, "front-target-a", "front-a-unit"),
        ...attackFacts(4, 120, "front-target-b", "front-b-unit"),
        ...(responds
          ? reinforcementIds.flatMap((id, index) =>
              attackFacts(7 + index * 3, 500 + index * 10, id, `response-${index}`)
            )
          : []),
        ...(alternateFront === "continued" ? attackFacts(20, 1100, "front-target-b", "front-b-late") : []),
        ...(alternateFront === "destroyed" ? attackFacts(30, 760, "front-target-b", "front-b-finisher", 0) : [])
      ];
    const base = context(facts, [...firstFronts, ...response]);
    return evaluateNativeFronts("escalated", {
      ...base,
      roles,
      role: (name: string) => roles[name as keyof typeof roles]
    } as ReturnType<typeof nativeScenarioContext>);
  };

  expect(evaluate(true, "continued")).toEqual([]);
  expect(evaluate(true, "destroyed")).toEqual([]);
  expect(evaluate(false, "continued")).toContain("combat_reinforcements_not_proportionally_engaged");
  expect(evaluate(true, "abandoned")).toContain("combat_escalation_abandoned_alternate_front");
});

test("STRAT-13 does not require a generic contact target outside its authored fronts", () => {
  const base = context([], []);
  const focused = {
    ...base,
    roles: Object.fromEntries(Object.entries(base.roles).filter(([role]) => role !== "contact-group")),
    role: (name: string) => (name === "contact-group" ? undefined : base.roles[name as keyof typeof base.roles])
  } as ReturnType<typeof nativeScenarioContext>;

  expect(() => evaluateNativeStrategy("STRAT-13", "equal", focused)).not.toThrow();
  expect(evaluateNativeStrategy("STRAT-13", "equal", focused)).toContain(
    "combat_independent_physically_useful_fronts_missing"
  );
});

test("STRAT-13 infeasible control releases an assigned lost front and keeps attacking the remaining front", () => {
  const frames = [
    {
      tick: 200,
      decision: {
        missionState: {
          squads: [
            { actorIds: ["attacker-a"], tactics: { targetActorId: "front-target-a" } },
            { actorIds: ["attacker-b"], tactics: { targetActorId: "front-target-b" } }
          ]
        }
      }
    },
    {
      tick: 420,
      decision: {
        missionState: {
          squads: [{ actorIds: ["attacker-b"], tactics: { targetActorId: "front-target-b" } }]
        }
      }
    },
    {
      tick: 1000,
      decision: {
        missionState: {
          squads: [{ actorIds: ["attacker-b"], tactics: { targetActorId: "front-target-b" } }]
        }
      }
    }
  ];
  const facts = attackFacts(1, 450, "front-target-b", "attacker-b"),
    appliedLoss = [{ id: "loss-front-target-a", tick: 400, affectedActorId: "front-target-a" }];

  expect(evaluateNativeFronts("infeasible", context(facts, frames, appliedLoss))).toEqual([]);
  expect(evaluateNativeFronts("infeasible", context(facts, frames))).toContain(
    "combat_infeasible_front_not_released_independently"
  );
  expect(
    evaluateNativeFronts(
      "infeasible",
      context(attackFacts(20, 250, "front-target-b", "attacker-b"), frames, appliedLoss)
    )
  ).toContain("combat_infeasible_front_not_released_independently");
});
