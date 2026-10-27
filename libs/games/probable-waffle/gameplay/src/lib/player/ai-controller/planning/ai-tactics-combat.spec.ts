import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";

import { SpellType } from "../../../entity/components/combat/spell-type";

import { requireValue, combatActor, squad, fixtureState, observation, manager } from "./ai-tactics-test-fixtures";
import { canSeeTarget, estimateAiEngagementV1 } from "./ai-tactics-combat";

describe("AiTacticsManager", () => {
  it("uses an owned actor's native visibility evidence when it is available", () => {
    const attacker = {
      ...combatActor("attacker", "self", 0, "ground", 1000, { damage: 10 }),
      visibleEnemyActorIds: []
    };
    const enemy = combatActor("enemy", "enemy", 1, "ground", 1000, { damage: 1 });

    expect(canSeeTarget(attacker, enemy, undefined)).toBe(false);
    expect(canSeeTarget({ ...attacker, visibleEnemyActorIds: [enemy.actorId] }, enemy, undefined)).toBe(true);
  });

  it("keeps a scout searching instead of engaging a known harmless contact", () => {
    const recon = combatActor("recon", "self", 0, "ground", 1000, { damage: 10 });
    const harmless = combatActor("harmless", "enemy", 3, "ground", 1000, { damage: 1 });
    if (harmless.combatProfile?.status !== "known") throw new Error("missing_harmless_combat_profile");
    const harmlessWithoutWeapons = {
      ...harmless,
      combatProfile: {
        ...harmless.combatProfile,
        value: { ...harmless.combatProfile.value, attacks: [] }
      }
    };
    const mission = {
      ...squad("squad:scout:recon", "scout", [recon.actorId]),
      objectiveId: "question:search:ground:8:0:0"
    };

    const result = manager.propose(observation([recon, harmlessWithoutWeapons]), fixtureState([mission]));

    expect(result.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === harmless.actorId)).toBe(
      false
    );
    expect(
      result.intents.some((intent) => intent.kind === "move" && intent.actorIds.includes(recon.actorId))
    ).toBe(false);
  });

  it("moves a distant reinforcement while locally aware members continue fighting", () => {
    const front = combatActor("front", "self", 1, "ground", 1000, { damage: 100 });
    const reinforcement = combatActor("reinforcement", "self", 20, "ground", 1000, { damage: 100 });
    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 1 });
    const state = fixtureState([
      { ...squad("squad:attack", "attack", [front.actorId, reinforcement.actorId]), objectiveId: enemy.actorId }
    ]);
    const result = manager.propose(observation([front, reinforcement, enemy]), state);
    expect(result.intents).toContainEqual(
      expect.objectContaining({ kind: "attack", actorIds: [front.actorId], targetActorId: enemy.actorId })
    );
    expect(result.intents).toContainEqual(expect.objectContaining({ kind: "move", actorIds: [reinforcement.actorId] }));
    expect(result.intents.flatMap((intent) => (intent.kind === "move" ? intent.actorIds : []))).not.toContain(
      front.actorId
    );
    const attackingFront = {
      ...front,
      activeOrder: {
        status: "known" as const,
        observedTick: 100,
        value: { orderType: OrderType.Attack, targetActorId: enemy.actorId }
      }
    };
    const continuing = manager.propose(observation([attackingFront, reinforcement, enemy]), state);
    expect(continuing.intents).toContainEqual(
      expect.objectContaining({ kind: "move", actorIds: [reinforcement.actorId] })
    );
    expect(continuing.intents.flatMap((intent) => ("actorIds" in intent ? intent.actorIds : []))).not.toContain(
      front.actorId
    );
  });

  it("keeps an attack on a visible main building focused when a defender is nearby", () => {
    const attackers = Array.from({ length: 4 }, (_, index) =>
      combatActor(`attacker-${index}`, "self", 0, "ground", 1000, { damage: 40 })
    );
    const core = combatActor("enemy-core", "enemy", 15, "ground", 1000, {
      damage: 1,
      mainBuilding: true
    });
    const defender = combatActor("defender", "enemy", 3, "ground", 1000, { damage: 100 });
    const mission = {
      ...squad(
        "squad:attack",
        "attack",
        attackers.map((actor) => actor.actorId)
      ),
      objectiveId: core.actorId
    };

    const result = manager.propose(observation([...attackers, core, defender]), fixtureState([mission]));

    expect(result.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === defender.actorId)).toBe(
      false
    );
    expect(result.intents).toContainEqual(
      expect.objectContaining({ kind: "move", logicalPosition: { x: 15, y: 0, z: 0 } })
    );
  });

  it("keeps a committed attack focused when a harmless local contact appears", () => {
    const attackers = Array.from({ length: 4 }, (_, index) =>
      combatActor(`attacker-${index}`, "self", 0, "ground", 1000, { damage: 40 })
    );
    const objective = combatActor("front-objective", "enemy", 20, "ground", 1000, { damage: 1 });
    const harmlessScout = combatActor("harmless-scout", "enemy", 3, "ground", 1000, { damage: 1 });
    const mission = {
      ...squad("squad:attack", "attack", attackers.map((attacker) => attacker.actorId)),
      objectiveId: objective.actorId
    };

    const result = manager.propose(observation([...attackers, objective, harmlessScout]), fixtureState([mission]));

    expect(result.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        objectiveId: objective.actorId,
        tactics: expect.objectContaining({ targetActorId: objective.actorId })
      })
    );
    expect(result.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === harmlessScout.actorId)).toBe(
      false
    );
  });

  it("keeps a last-seen core hypothesis as the approach target when a different core is visible", () => {
    const attackers = Array.from({ length: 4 }, (_, index) =>
      combatActor(`attacker-${index}`, "self", 0, "ground", 1000, { damage: 40 })
    );
    const rememberedCore = {
      ...combatActor("remembered-core", "enemy", 15, "ground", 1000, { damage: 1, mainBuilding: true }),
      evidenceId: "evidence:sandhold" as const,
      visibility: "last_seen" as const
    };
    const visibleCore = combatActor("visible-core", "enemy", 14, "ground", 1000, {
      damage: 1,
      mainBuilding: true
    });
    const mission = {
      ...squad(
        "squad:attack",
        "attack",
        attackers.map((actor) => actor.actorId)
      ),
      objectiveId: `hypothesis:${rememberedCore.evidenceId}` as never
    };

    const result = manager.propose(observation([...attackers, rememberedCore, visibleCore]), fixtureState([mission]));

    expect(result.intents).not.toContainEqual(
      expect.objectContaining({ kind: "attack", targetActorId: visibleCore.actorId })
    );
    expect(result.intents).toContainEqual(
      expect.objectContaining({ kind: "move", logicalPosition: { x: 15, y: 0, z: 0 } })
    );
  });

  it("reissues a move when a committed core changes from visible to last-seen", () => {
    const attackers = Array.from({ length: 4 }, (_, index) =>
      combatActor(`attacker-${index}`, "self", 0, "ground", 1000, { damage: 40 })
    );
    const core = combatActor("enemy-core", "enemy", 25, "ground", 1000, {
      damage: 1,
      mainBuilding: true
    });
    const mission = {
      ...squad(
        "squad:attack",
        "attack",
        attackers.map((actor) => actor.actorId)
      ),
      objectiveId: core.actorId,
      state: "advance" as const
    };
    const first = manager.propose(observation([...attackers, core]), fixtureState([mission]));
    const previous = first.statePatch?.squadUpdates?.find((entry) => entry.role === "attack");
    if (!previous?.tactics) throw new Error("missing_initial_approach");
    const currentCore = { ...core, visibility: "last_seen" as const };
    const members = attackers.map((actor) => ({
      ...actor,
      activeOrder: {
        status: "known" as const,
        observedTick: 120,
        value: { orderType: OrderType.Attack, targetActorId: core.actorId }
      }
    }));

    const result = manager.propose(
      observation([...members, currentCore], 120),
      fixtureState([{ ...previous, state: "advance" }])
    );

    expect(result.intents).toContainEqual(expect.objectContaining({ kind: "move", actorIds: expect.any(Array) }));
    expect(result.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === core.actorId)).toBe(
      false
    );
  });

  it.each(["squad:attack:primary", "squad:attack:primary:domain:ground", "squad:attack:other"])(
    "shares only the mission family's launch permission: %s",
    (subjectId) => {
      const guard = combatActor("guard", "self", 0, "ground", 1000, { damage: 100 });
      const flyer = combatActor("flyer", "self", 0, "air", 1000, { damage: 100 });
      const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 1 });
      const base = fixtureState([
        { ...squad("squad:attack:primary", "attack", [flyer.actorId]), domain: "air", objectiveId: enemy.actorId },
        { ...squad("squad:attack:primary:domain:ground", "attack", [guard.actorId]), objectiveId: enemy.actorId }
      ]);
      const state = {
        ...base,
        strategy: {
          ...base.strategy,
          assessment: {
            choice: "pressure" as const,
            reason: "credible_force_and_route",
            targetActorId: enemy.actorId,
            readyForce: 2,
            requiredForce: 1,
            visibleThreatCount: 1,
            confidencePermille: 1000,
            expectedEffectTick: 120,
            reconsiderTick: 140,
            alternatives: []
          }
        },
        skirmish: {
          ...base.skirmish,
          timeline: [
            { eventId: `launch:${subjectId}`, tick: 80, kind: "mission" as const, subjectId, detail: "launch:direct" }
          ]
        }
      };
      const result = manager.propose(observation([guard, flyer, enemy]), state);
      expect(result.statePatch?.squadUpdates?.find((entry) => entry.actorIds.includes(guard.actorId))?.state).toBe(
        subjectId === "squad:attack:other" ? "assemble" : "engage"
      );
    }
  );

  it("keeps a native attack-move approach until the committed target enters the member's own vision", () => {
    const guard = {
      ...combatActor("guard", "self", 0, "ground", 1000, { damage: 100 }),
      activeOrder: {
        status: "known" as const,
        observedTick: 100,
        value: { orderType: OrderType.Attack, targetActorId: null }
      }
    };
    const enemy = combatActor("enemy", "enemy", 15, "ground", 1000, { damage: 1 });
    const state = fixtureState([{ ...squad("squad:defense", "defense", [guard.actorId]), objectiveId: enemy.actorId }]);
    expect(manager.propose(observation([guard, enemy]), state).intents).toHaveLength(0);
    const nearbyEnemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 1 });
    expect(manager.propose(observation([guard, nearbyEnemy]), state).intents).toContainEqual(
      expect.objectContaining({ kind: "attack", targetActorId: enemy.actorId })
    );
  });

  it("does not withdraw from a favorable fight merely because its last shot started the ordinary cooldown", () => {
    const guard = combatActor("guard", "self", 0, "ground", 1000, { damage: 100 });
    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 60 });
    if (guard.combatProfile?.status !== "known") throw new Error("missing_guard_profile");
    const coolingGuard = {
      ...guard,
      combatProfile: {
        ...guard.combatProfile,
        value: {
          ...guard.combatProfile.value,
          attacks: guard.combatProfile.value.attacks.map((attack) => ({
            ...attack,
            remainingCooldownTicks: attack.cooldownTicks
          }))
        }
      }
    };
    const state = fixtureState([
      { ...squad("squad:defense", "defense", [guard.actorId]), state: "engage", objectiveId: enemy.actorId }
    ]);
    expect(manager.propose(observation([coolingGuard, enemy]), state).statePatch?.squadUpdates?.[0]?.state).toBe(
      "engage"
    );
  });

  it("retains an existing domain child's members when newly staffed parent members split into that child", () => {
    const actors = [
      combatActor("flyer", "self", 0, "air", 1000, { damage: 100 }),
      combatActor("old-guard", "self", 0, "ground", 1000, { damage: 100 }),
      combatActor("new-guard", "self", 0, "ground", 1000, { damage: 100 }),
      combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 1 })
    ];
    const state = fixtureState([
      { ...squad("squad:defense", "defense", ["flyer", "new-guard"]), domain: "mixed", objectiveId: "enemy" },
      { ...squad("squad:defense:domain:ground", "defense", ["old-guard"]), objectiveId: "enemy" }
    ]);
    const result = manager.propose(observation(actors), state);
    const members = result.statePatch?.squadUpdates?.flatMap((entry) => entry.actorIds).sort();
    expect(members).toEqual(["flyer", "new-guard", "old-guard"]);
  });

  it.each([
    { siblingId: "squad:defense:domain:air", siblingX: 0, expected: "engage" },
    { siblingId: "squad:defense:domain:air", siblingX: 40, expected: "retreat" },
    { siblingId: "squad:other", siblingX: 0, expected: "retreat" }
  ])(
    "counts only nearby support from the same mission: $siblingId at $siblingX",
    ({ siblingId, siblingX, expected }) => {
      const guard = combatActor("guard", "self", 0, "ground", 1000, { damage: 40 });
      const flyer = combatActor("flyer", "self", siblingX, "air", 1000, { damage: 40 });
      const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 100 });
      const state = fixtureState([
        { ...squad("squad:defense", "defense", [guard.actorId]), state: "retreat", objectiveId: enemy.actorId },
        { ...squad(siblingId, "defense", [flyer.actorId]), domain: "air", state: "retreat", objectiveId: enemy.actorId }
      ]);
      const result = manager.propose(observation([guard, flyer, enemy]), state);
      expect(result.statePatch?.squadUpdates?.find((entry) => entry.squadId === "squad:defense")?.state).toBe(expected);
    }
  );

  it("compares combined damage and durability fairly against a single durable opponent", () => {
    const guards = Array.from({ length: 5 }, (_, index) => combatActor(`guard-${index}`, "self", 0));
    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 40 });
    if (enemy.combatProfile?.status !== "known") throw new Error("missing_enemy_profile");
    const durableEnemy = {
      ...enemy,
      combatProfile: {
        ...enemy.combatProfile,
        value: { ...enemy.combatProfile.value, maxHealth: 460 }
      }
    };
    expect(estimateAiEngagementV1(guards.slice(0, 4), [durableEnemy], 64).ratioPermille).toBe(1000);
    expect(estimateAiEngagementV1(guards, [durableEnemy], 64).ratioPermille).toBeGreaterThanOrEqual(1200);
  });

  it("keeps a retreat stable against its visible threat outside the local engagement radius", () => {
    const guard = combatActor("guard", "self", 0, "ground", 1000, { damage: 1 });
    const enemy = combatActor("enemy", "enemy", 25, "ground", 1000, { damage: 100 });
    let mission = {
      ...squad("squad:defense", "defense", [guard.actorId]),
      state: "retreat" as const,
      objectiveId: enemy.actorId
    };
    for (let tick = 100; tick <= 140; tick += 20) {
      const result = manager.propose(observation([guard, enemy], tick), fixtureState([mission]));
      const updated = requireValue(result.statePatch?.squadUpdates?.[0], "missing_defense_update");
      expect(updated.state).toBe("retreat");
      expect(result.intents.some((intent) => intent.kind === "attack")).toBe(false);
      mission = { ...updated, state: "retreat", objectiveId: enemy.actorId };
    }
  });

  it("requires a clearly favorable, well-supported force estimate to end retreat", () => {
    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 10 });
    const mission = {
      ...squad("squad:defense", "defense", ["guard"]),
      state: "retreat" as const,
      objectiveId: enemy.actorId
    };
    const state = fixtureState([mission]);
    const neutral = manager.propose(
      observation([combatActor("guard", "self", 0, "ground", 1000, { damage: 9 }), enemy]),
      state
    );
    expect(neutral.statePatch?.squadUpdates?.[0]?.state).toBe("retreat");
    const slightAdvantage = manager.propose(
      observation([combatActor("guard", "self", 0, "ground", 1000, { damage: 13 }), enemy]),
      state
    );
    expect(slightAdvantage.statePatch?.squadUpdates?.[0]?.state).toBe("retreat");
    const favorable = manager.propose(
      observation([combatActor("guard", "self", 0, "ground", 1000, { damage: 20 }), enemy]),
      state
    );
    expect(favorable.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
    expect(favorable.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: enemy.actorId }));
  });

  it("holds a safe retreat through its reconsideration window when the threat temporarily disappears", () => {
    const guard = combatActor("guard", "self", 0, "ground", 1000, { damage: 1 });
    const enemy = combatActor("enemy", "enemy", 25, "ground", 1000, { damage: 100 });
    const initial = manager.propose(
      observation([guard, enemy], 100),
      fixtureState([{ ...squad("squad:defense", "defense", [guard.actorId]), objectiveId: enemy.actorId }])
    );
    const retreated = requireValue(initial.statePatch?.squadUpdates?.[0], "missing_retreat_update");
    const quiet = manager.propose(observation([guard], 120), fixtureState([retreated]));

    expect(quiet.statePatch?.squadUpdates?.[0]?.state).toBe("retreat");
    const afterWindow = manager.propose(
      observation([guard], retreated.tactics?.nextReconsiderTick ?? 140),
      fixtureState([requireValue(quiet.statePatch?.squadUpdates?.[0], "missing_held_retreat_update")])
    );
    expect(afterWindow.statePatch?.squadUpdates?.[0]?.state).toBe("defend");
  });

  it("keeps a retreating squad in recovery until a local threat is clearly favorable", () => {
    const guard = combatActor("guard", "self", 0, "ground", 1000, { damage: 1 });
    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 10 });
    const initial = manager.propose(
      observation([guard, enemy], 100),
      fixtureState([squad("squad:attack", "attack", [guard.actorId])])
    );
    const retreating = requireValue(initial.statePatch?.squadUpdates?.[0], "missing_retreat_update");
    const safe = manager.propose(observation([guard], 120), fixtureState([retreating]));
    expect(safe.statePatch?.squadUpdates?.[0]?.state).toBe("retreat");
    const safeWindow = manager.propose(
      observation([guard], retreating.tactics?.nextReconsiderTick ?? 140),
      fixtureState([requireValue(safe.statePatch?.squadUpdates?.[0], "missing_held_retreat_update")])
    );
    const recovering = requireValue(safeWindow.statePatch?.squadUpdates?.[0], "missing_recovery_update");
    expect(recovering.state).toBe("recover");

    const contact = manager.propose(
      observation([combatActor("guard", "self", 0, "ground", 1000, { damage: 13 }), enemy], 160),
      fixtureState([recovering])
    );
    expect(contact.statePatch?.squadUpdates?.[0]?.state).toBe("retreat");
    expect(contact.intents.some((intent) => intent.kind === "attack")).toBe(false);

    const earlyReinforcements = manager.propose(
      observation([combatActor("guard", "self", 0, "ground", 1000, { damage: 20 }), enemy], 180),
      fixtureState([requireValue(contact.statePatch?.squadUpdates?.[0], "missing_held_retreat_update")])
    );
    expect(earlyReinforcements.statePatch?.squadUpdates?.[0]?.state).toBe("retreat");
    const reinforced = manager.propose(
      observation([combatActor("guard", "self", 0, "ground", 1000, { damage: 20 }), enemy], 240),
      fixtureState([requireValue(earlyReinforcements.statePatch?.squadUpdates?.[0], "missing_locked_retreat_update")])
    );
    expect(reinforced.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
  });

  it("FIGHT-04 reserves expected impact and spreads fire after lethal damage is covered", () => {
    const actors = [
      combatActor("archer-a", "self", 1, "ground", 1000, { damage: 30 }),
      combatActor("archer-b", "self", 2, "ground", 1000, { damage: 30 }),
      combatActor("archer-c", "self", 3, "ground", 1000, { damage: 30 }),
      combatActor("archer-d", "self", 4, "ground", 1000, { damage: 30 }),
      combatActor("enemy-a", "enemy", 5, "ground", 50),
      combatActor("enemy-b", "enemy", 6, "ground", 50)
    ];
    const proposal = manager.propose(
      observation(actors, 200),
      fixtureState([squad("squad:attack", "attack", ["archer-a", "archer-b", "archer-c", "archer-d"])])
    );
    const reservations = proposal.statePatch?.squadUpdates?.[0]?.tactics?.damageReservations ?? [];
    expect(new Set(reservations.map((entry) => entry.targetActorId)).size).toBe(2);
    expect(reservations.every((entry) => entry.impactTick === 204)).toBe(true);
  });

  it("FIGHT-02 keeps a valid committed target until an alternative improves useful score by 20 percent", () => {
    const guard = combatActor("guard", "self", 1, "ground", 1000, { damage: 30 });
    const firstEnemies = [
      combatActor("enemy-a", "enemy", 5, "ground", 1000, { capabilityFamilies: ["produce"] }),
      combatActor("enemy-b", "enemy", 6, "ground", 1000, { capabilityFamilies: ["produce"] })
    ];
    const initialState = fixtureState([squad("squad:attack", "attack", ["guard"])]);
    const first = manager.propose(observation([guard, ...firstEnemies]), initialState);
    const committed = requireValue(first.statePatch?.squadUpdates?.[0], "missing_target_squad_update");
    const guardStillAttacking = {
      ...guard,
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Attack, targetActorId: "enemy-a" },
        observedTick: 120
      }
    };
    const second = manager.propose(
      observation(
        [
          guardStillAttacking,
          combatActor("enemy-a", "enemy", 5, "ground", 1000, { capabilityFamilies: ["produce"] }),
          combatActor("enemy-b", "enemy", 4, "ground", 1000, { capabilityFamilies: ["produce"] })
        ],
        120
      ),
      { ...initialState, squads: [committed] }
    );
    expect(second.statePatch?.squadUpdates?.[0]?.tactics?.targetActorId).toBe("enemy-a");
    expect(second.intents).toHaveLength(0);
  });

  it("RAID-01/02 prioritizes an exposed economy or production objective over a generic combat contact", () => {
    const raider = combatActor("raider", "self", 1, "ground", 1000, { damage: 30 });
    const guard = combatActor("enemy-guard", "enemy", 4);
    const production = combatActor("enemy-production", "enemy", 6, "ground", 1000, {
      capabilityFamilies: ["produce", "drop_off"]
    });
    const proposal = manager.propose(
      observation([raider, guard, production]),
      fixtureState([squad("squad:raid", "attack", ["raider"])])
    );
    expect(proposal.statePatch?.squadUpdates?.[0]?.tactics?.targetActorId).toBe("enemy-production");
    expect(proposal.statePatch?.squadUpdates?.[0]?.tactics?.objectiveAlternatives[0]?.reason).toBe(
      "visible_value_route_not_recorded"
    );
  });

  it("RAID-02/FIGHT-01/H-25 retreats a losing squad and converts rapid relaunch oscillation to hold-front", () => {
    const friend = combatActor("guard", "self", 5, "ground", 200, { damage: 2 });
    const enemies = [
      combatActor("enemy-a", "enemy", 7, "ground", 1000, { damage: 30 }),
      combatActor("enemy-b", "enemy", 8, "ground", 1000, { damage: 30 })
    ];
    const initial = manager.propose(
      observation([friend, ...enemies]),
      fixtureState([squad("squad:attack", "attack", ["guard"])])
    );
    expect(initial.statePatch?.squadUpdates?.[0]).toEqual(expect.objectContaining({ state: "retreat" }));
    expect(initial.intents).toContainEqual(
      expect.objectContaining({ kind: "move", logicalPosition: { x: 0, y: 0, z: 0 } })
    );
    const retreated = requireValue(initial.statePatch?.squadUpdates?.[0], "missing_oscillation_retreat_update");
    const strongFriend = combatActor("guard", "self", 5, "ground", 1000, { damage: 100 });
    const weakEnemy = combatActor("enemy-a", "enemy", 7, "ground", 100, { damage: 1 });
    const relaunch = manager.propose(observation([strongFriend, weakEnemy], 110), {
      ...fixtureState([]),
      squads: [{ ...retreated, tactics: { ...retreated.tactics!, oscillationCount: 1 } }]
    });
    expect(relaunch.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        state: "regroup",
        tactics: expect.objectContaining({ script: "hold_front", oscillationCount: 2 })
      })
    );
    expect(relaunch.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("FIGHT-04 coordinates capped healing and manual spells while leaving autocast-owned spells alone", () => {
    const wounded = combatActor("wounded", "self", 2, "ground", 500);
    const healer = combatActor("healer", "self", 1, "ground", 1000, { heal: 80, spell: true, autocast: false });
    const enemy = combatActor("enemy", "enemy", 5);
    const proposal = manager.propose(
      observation([healer, wounded, enemy]),
      fixtureState([squad("squad:defense", "defense", ["healer", "wounded"])])
    );
    expect(proposal.intents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "heal", targetActorId: "wounded" }),
        expect.objectContaining({ kind: "cast", spellType: SpellType.Firestorm })
      ])
    );
    expect(proposal.statePatch?.support).toEqual(
      expect.arrayContaining([expect.objectContaining({ usefulCapacity: 50, reason: "bounded_missing_health" })])
    );

    const autocastHealer = combatActor("healer", "self", 1, "ground", 1000, { heal: 80, spell: true, autocast: true });
    const autocast = manager.propose(
      observation([autocastHealer, wounded, enemy]),
      fixtureState([squad("squad:defense", "defense", ["healer", "wounded"])])
    );
    expect(autocast.intents.some((intent) => intent.kind === "cast")).toBe(false);
  });

  it("DOMAIN-06 keeps domain-capable interceptors and does not count a ground-only weapon against air", () => {
    const groundOnly = combatActor("ground", "self", 1, "ground", 1000, { targetDomains: ["ground"] });
    const interceptor = combatActor("interceptor", "self", 2, "ground", 1000, { targetDomains: ["air"] });
    const airEnemy = combatActor("flyer", "enemy", 5, "air");
    const proposal = manager.propose(
      observation([groundOnly, interceptor, airEnemy], 200),
      fixtureState([squad("squad:defense", "defense", ["ground", "interceptor"])])
    );
    expect(proposal.statePatch?.squadUpdates?.[0]?.tactics?.script).toBe("intercept_air_transport");
    expect(proposal.statePatch?.squadUpdates?.[0]?.tactics?.damageReservations.map((entry) => entry.actorId)).toEqual([
      "interceptor"
    ]);
  });

  it("DOMAIN-06 separates naval and air members into domain squads with one owner each", () => {
    const ship = combatActor("ship", "self", 1, "water");
    const flyer = combatActor("flyer", "self", 2, "air");
    const enemy = combatActor("enemy", "enemy", 5, "water");
    const proposal = manager.propose(
      observation([ship, flyer, enemy]),
      fixtureState([squad("squad:mixed", "attack", ["ship", "flyer"])])
    );
    const updates = proposal.statePatch?.squadUpdates ?? [];
    expect(updates.map((entry) => entry.domain).sort()).toEqual(["air", "water"]);
    expect(updates.flatMap((entry) => entry.actorIds).sort()).toEqual(["flyer", "ship"]);
  });
});
