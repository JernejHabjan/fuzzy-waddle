import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import { AiTacticsManager } from "./ai-tactics-manager";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import {
  profile,
  requireValue,
  combatActor,
  squad,
  fixtureState,
  observation,
  manager
} from "./ai-tactics-test-fixtures";

describe("AiTacticsManager", () => {
  it("breaks equal-distance immediate-threat ties by visible geometry", () => {
    const attackers = [
      combatActor("attacker-a", "self", 10, "ground", 1000, { damage: 100 }),
      combatActor("attacker-b", "self", 10, "ground", 1000, { damage: 100 }),
      combatActor("attacker-c", "self", 10, "ground", 1000, { damage: 100 })
    ];
    const westThreat = combatActor("z-west", "enemy", 8, "ground", 1000, { damage: 100 });
    const eastThreat = combatActor("a-east", "enemy", 12, "ground", 1000, { damage: 100 });
    const objective = combatActor("objective", "enemy", 20, "ground", 1000, { damage: 0 });
    const attackSquad = {
      ...squad("squad:attack", "attack", attackers.map((actor) => actor.actorId)),
      objectiveId: objective.actorId
    };
    const initial = fixtureState([attackSquad]);
    const proposal = manager.propose(
      observation([...attackers, eastThreat, westThreat, objective]),
      initial
    );
    const selected = proposal.intents.find((intent) => intent.kind === "attack");

    expect(selected?.targetActorId).toBe(westThreat.actorId);
  });

  it("H-30 advances a quiet mission through assembly, rally and advance without skipping a boundary", () => {
    const guard = combatActor("guard", "self", 1);
    const initial = fixtureState([{ ...squad("squad:attack", "attack", ["guard"]), state: "forming" }]);
    const assembled = requireValue(
      manager.propose(observation([guard], 100), initial).statePatch?.squadUpdates?.[0],
      "missing_assembled_squad_update"
    );
    const rallied = requireValue(
      manager.propose(observation([guard], 120), { ...initial, squads: [assembled] }).statePatch?.squadUpdates?.[0],
      "missing_rallied_squad_update"
    );
    const advanced = requireValue(
      manager.propose(observation([guard], 140), { ...initial, squads: [rallied] }).statePatch?.squadUpdates?.[0],
      "missing_advanced_squad_update"
    );
    expect([assembled.state, rallied.state, advanced.state]).toEqual(["assemble", "rally", "advance"]);
  });

  it("preserves a naval firing approach instead of replacing it with a rally move", () => {
    const boat = {
      ...combatActor("boat", "self", 10, "water"),
      activeOrder: {
        status: "known" as const,
        observedTick: 100,
        value: {
          orderType: OrderType.Move,
          targetPosition: { x: 15, y: 0, z: 0 }
        }
      }
    };
    const target = combatActor("coast-target", "enemy", 20, "ground", 1000, { damage: 0 });
    const attackSquad = {
      ...squad("squad:attack:naval", "attack", [boat.actorId]),
      domain: "water" as const,
      objectiveId: target.actorId,
      state: "assemble" as const
    };

    const proposal = manager.propose(observation([boat, target]), fixtureState([attackSquad]));

    expect(
      proposal.intents.some((intent) => intent.kind === "move" && intent.actorIds.includes(boat.actorId))
    ).toBe(false);
  });

  it("releases an armed gatherer from a tactical squad instead of interrupting its economy work", () => {
    const workerCatalog: AiCapabilityCatalogV1 = {
      schemaVersion: 1,
      generation: 1,
      unsupported: [],
      entries: [
        {
          capabilityId: "worker",
          family: "worker",
          sourceObjectName: ObjectNames.TivaraWorker,
          effectiveLevel: 1,
          movementDomains: ["ground"],
          targetDomains: ["ground"],
          produces: [],
          constructs: [ObjectNames.Olival],
          researches: [],
          gathers: [ResourceType.Wood],
          housingCapacity: null,
          housingCost: 1,
          cargoCapacity: null
        }
      ]
    };
    const workerManager = new AiTacticsManager(profile, () => workerCatalog);
    const worker = { ...combatActor("worker", "self", 1), objectName: ObjectNames.TivaraWorker };
    const current = fixtureState([squad("squad:attack", "attack", [worker.actorId])]);
    const proposal = workerManager.propose(observation([worker]), current);

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(expect.objectContaining({ actorIds: [], state: "recover" }));
    expect(proposal.intents.some((intent) => "actorIds" in intent && intent.actorIds.includes(worker.actorId))).toBe(
      false
    );
  });

  it("FIGHT-01 keeps a quiet defense in defend and regroups an uncertain engagement", () => {
    const guard = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const defended = manager.propose(
      observation([guard]),
      fixtureState([squad("squad:defense", "defense", ["guard"])])
    );
    expect(defended.statePatch?.squadUpdates?.[0]?.state).toBe("defend");

    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 10 });
    const regrouped = manager.propose(
      observation([guard, enemy]),
      fixtureState([squad("squad:attack", "attack", ["guard"])])
    );
    expect(regrouped.statePatch?.squadUpdates?.[0]?.state).toBe("regroup");
  });

  it("keeps an attack squad advancing through a viable committed pressure mission", () => {
    const attackers = [
      combatActor("attacker-a", "self", 1, "ground", 1000, { damage: 10 }),
      combatActor("attacker-b", "self", 2, "ground", 1000, { damage: 10 })
    ];
    const target = combatActor("target", "enemy", 5, "ground", 1000, { damage: 0 });
    const defenders = [3, 4, 6].map((x) => combatActor(`defender-${x}`, "enemy", x, "ground", 1000, { damage: 100 }));
    const committedSquad = {
      ...squad(
        "squad:attack",
        "attack",
        attackers.map((actor) => actor.actorId)
      ),
      objectiveId: target.actorId,
      state: "retreat" as const
    };
    const initial = fixtureState([committedSquad]);
    const pressureState: AiBrainStateV1 = {
      ...initial,
      strategy: {
        ...initial.strategy,
        stance: "pressure",
        objectiveId: target.actorId,
        commitmentDeadline: { ...initial.strategy.commitmentDeadline, dueTick: 300 },
        assessment: {
          choice: "pressure",
          reason: "credible_force_and_route",
          targetActorId: target.actorId,
          readyForce: 2,
          requiredForce: 2,
          visibleThreatCount: defenders.length,
          confidencePermille: 1000,
          expectedEffectTick: 200,
          reconsiderTick: 200,
          alternatives: []
        }
      },
      skirmish: {
        ...initial.skirmish,
        timeline: [
          ...initial.skirmish.timeline,
          { eventId: "launch", tick: 0, kind: "mission", subjectId: committedSquad.squadId, detail: "launch:direct" }
        ]
      }
    };

    const proposal = manager.propose(observation([...attackers, target, ...defenders]), pressureState);

    expect(proposal.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
  });

  it("peels a critically wounded ranged member while healthy squadmates protect it", () => {
    const ranged = combatActor("ranged", "self", 1, "ground", 400, { damage: 10 });
    const supportingAttackers = [
      combatActor("support-a", "self", 8, "ground", 1000, { damage: 100 }),
      combatActor("support-b", "self", 9, "ground", 1000, { damage: 100 })
    ];
    const nearbyBase = combatActor("nearby", "enemy", 2, "ground", 1000, { damage: 1 });
    const nearbyProfile = requireValue(
      nearbyBase.combatProfile.status === "known" ? nearbyBase.combatProfile.value : undefined,
      "missing_known_nearby_profile"
    );
    const nearby = {
      ...nearbyBase,
      combatProfile: {
        status: "known" as const,
        observedTick: nearbyBase.combatProfile.observedTick,
        value: {
          ...nearbyProfile,
          attacks: nearbyProfile.attacks.map((attack) => ({ ...attack, range: 1, minRange: 0 }))
        }
      }
    };
    const objective = combatActor("objective", "enemy", 12, "ground", 1000, { damage: 0 });
    const attackSquad = {
      ...squad("squad:attack", "attack", [ranged.actorId, ...supportingAttackers.map((actor) => actor.actorId)]),
      objectiveId: objective.actorId
    };
    const initial = fixtureState([attackSquad]);
    const pressureState: AiBrainStateV1 = {
      ...initial,
      strategy: {
        ...initial.strategy,
        stance: "pressure",
        objectiveId: objective.actorId,
        commitmentDeadline: { ...initial.strategy.commitmentDeadline, dueTick: 300 },
        assessment: {
          choice: "pressure",
          reason: "credible_force_and_route",
          targetActorId: objective.actorId,
          readyForce: 3,
          requiredForce: 3,
          visibleThreatCount: 1,
          confidencePermille: 1000,
          expectedEffectTick: 200,
          reconsiderTick: 200,
          alternatives: []
        }
      },
      skirmish: {
        ...initial.skirmish,
        timeline: [
          ...initial.skirmish.timeline,
          { eventId: "launch", tick: 0, kind: "mission", subjectId: attackSquad.squadId, detail: "launch:direct" }
        ]
      }
    };
    const firingTile = {
      tileKey: "7,0",
      position: { x: 7, y: 0, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    };
    const combatObservation = (actors: readonly (typeof ranged)[], tick = 100) => {
      const base = observation(actors, tick);
      return { ...base, map: { ...base.map!, tacticalCells: [firingTile] } };
    };
    const proposal = manager.propose(
      combatObservation([ranged, ...supportingAttackers, nearby, objective]),
      pressureState
    );

    expect(proposal.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({
        kind: "move",
        actorIds: expect.arrayContaining([ranged.actorId]),
        logicalPosition: firingTile.position
      })
    );
    expect(
      proposal.intents.filter((intent) => intent.kind === "move" && intent.actorIds.includes(ranged.actorId))
    ).toHaveLength(1);
    expect(
      proposal.intents.filter((intent) => intent.kind === "attack").flatMap((intent) => intent.actorIds)
    ).not.toContain(ranged.actorId);
    expect(
      proposal.intents.some(
        (intent) =>
          intent.kind === "attack" && supportingAttackers.some((actor) => intent.actorIds.includes(actor.actorId))
      )
    ).toBe(true);
    expect(
      proposal.intents.some(
        (intent) =>
          intent.kind === "attack" &&
          supportingAttackers.some((actor) => intent.actorIds.includes(actor.actorId)) &&
          intent.targetActorId === nearby.actorId
      )
    ).toBe(true);

    const separateSquads = {
      ...pressureState,
      squads: [
        squad("squad:defense", "defense", [ranged.actorId]),
        { ...attackSquad, actorIds: supportingAttackers.map((actor) => actor.actorId) }
      ]
    };
    const crossSquadProtection = manager.propose(
      combatObservation([ranged, ...supportingAttackers, nearby, objective]),
      separateSquads
    );
    expect(
      crossSquadProtection.intents.some(
        (intent) =>
          intent.kind === "attack" &&
          supportingAttackers.some((actor) => intent.actorIds.includes(actor.actorId)) &&
          intent.targetActorId === nearby.actorId
      )
    ).toBe(true);

    const withdrawingRanged = {
      ...ranged,
      activeOrder: {
        status: "known" as const,
        observedTick: 100,
        value: { orderType: OrderType.Move, targetActorId: null, targetPosition: { x: 10, y: 0, z: 0 } }
      }
    };
    const distantAttacker = {
      ...nearby,
      logicalPosition: { status: "known" as const, value: { x: 3, y: 0, z: 0 }, observedTick: 100 }
    };
    const withdrawal = manager.propose(
      combatObservation([withdrawingRanged, ...supportingAttackers, distantAttacker, objective]),
      pressureState
    );
    expect(
      withdrawal.intents.filter((intent) => intent.kind === "attack").flatMap((intent) => intent.actorIds)
    ).not.toContain(ranged.actorId);

    const arrivedRanged = {
      ...withdrawingRanged,
      logicalPosition: { status: "known" as const, value: firingTile.position, observedTick: 120 },
      activeOrder: {
        status: "known" as const,
        observedTick: 120,
        value: { orderType: OrderType.Move, targetActorId: null, targetPosition: firingTile.position }
      }
    };
    const harmlessObjective = {
      ...objective,
      combatProfile: {
        ...objective.combatProfile,
        value: {
          ...requireValue(
            objective.combatProfile.status === "known" ? objective.combatProfile.value : undefined,
            "missing_objective_combat_profile"
          ),
          attacks: []
        }
      }
    };
    const afterWithdrawal = manager.propose(
      combatObservation([arrivedRanged, ...supportingAttackers, distantAttacker, harmlessObjective], 120),
      pressureState
    );
    expect(
      afterWithdrawal.intents.filter((intent) => intent.kind === "attack").flatMap((intent) => intent.actorIds)
    ).not.toContain(ranged.actorId);
    expect(
      afterWithdrawal.intents.filter((intent) => intent.kind === "move").flatMap((intent) => intent.actorIds)
    ).not.toContain(ranged.actorId);

    const completedRanged = {
      ...arrivedRanged,
      activeOrder: { status: "known" as const, observedTick: 140, value: null }
    };
    const afterMoveCompletes = manager.propose(
      combatObservation([completedRanged, ...supportingAttackers, distantAttacker, harmlessObjective], 140),
      pressureState
    );
    expect(
      afterMoveCompletes.intents.filter((intent) => intent.kind === "attack").flatMap((intent) => intent.actorIds)
    ).toContain(ranged.actorId);
  });

  it("keeps new reinforcements on offense when only a static enemy building is near home", () => {
    const defender = combatActor("defender", "self", 1);
    const attacker = combatActor("attacker", "self", 2);
    const reinforcement = combatActor("reinforcement", "self", 3);
    const enemyBuilding = {
      ...combatActor("enemy-building", "enemy", 5),
      housingCost: { status: "known" as const, value: 0, observedTick: 100 },
      capabilities: []
    };
    const proposal = manager.propose(
      observation([defender, attacker, reinforcement, enemyBuilding]),
      fixtureState([
        squad("squad:defense", "defense", [defender.actorId]),
        squad("squad:attack", "attack", [attacker.actorId])
      ])
    );
    const updates = proposal.statePatch?.squadUpdates ?? [];

    expect(updates.find((candidate) => candidate.squadId === "squad:defense")?.actorIds).toEqual(["defender"]);
    expect(updates.find((candidate) => candidate.squadId === "squad:attack")?.actorIds).toEqual([
      "attacker",
      "reinforcement"
    ]);
  });

  it("H-30 drains a large retreat across the actor-order quota instead of dropping the mission order", () => {
    const guards = Array.from({ length: profile.maxActorOrdersPerStep + 3 }, (_, index) =>
      combatActor(`guard-${index.toString().padStart(2, "0")}`, "self", 5, "ground", 200, { damage: 1 })
    );
    const enemy = combatActor("enemy", "enemy", 7, "ground", 1000, { damage: 100 });
    const current = fixtureState([
      squad(
        "squad:attack",
        "attack",
        guards.map((actor) => actor.actorId)
      )
    ]);
    const first = manager.propose(observation([...guards, enemy]), current);
    const firstUpdate = requireValue(first.statePatch?.squadUpdates?.[0], "missing_retreat_squad_update");
    expect(first.intents.flatMap((intent) => ("actorIds" in intent ? intent.actorIds : []))).toHaveLength(
      profile.maxActorOrdersPerStep
    );
    expect(firstUpdate.tactics?.orderedActorIds).toHaveLength(profile.maxActorOrdersPerStep);

    const second = manager.propose(observation([...guards, enemy], 120), { ...current, squads: [firstUpdate] });
    expect(second.intents.flatMap((intent) => ("actorIds" in intent ? intent.actorIds : []))).toHaveLength(3);
    expect(second.statePatch?.squadUpdates?.[0]?.tactics?.orderedActorIds).toHaveLength(guards.length);
  });

  it.each([
    { offset: 4, sameSignature: false, expectedMove: false },
    { offset: 5, sameSignature: false, expectedMove: true },
    { offset: 4, sameSignature: true, expectedMove: false },
    { offset: 5, sameSignature: true, expectedMove: true }
  ])(
    "retains an active move only near its assigned destination ($offset, same signature $sameSignature)",
    ({ offset, sameSignature, expectedMove }) => {
      const guard = combatActor("guard", "self", 1);
      const enemy = combatActor("enemy", "enemy", 6);
      const initial = fixtureState([squad("squad:attack", "attack", [guard.actorId])]);
      const first = manager.propose(observation([guard, enemy]), initial);
      const firstUpdate = requireValue(first.statePatch?.squadUpdates?.[0], "missing_initial_squad_update");
      const firstTactics = requireValue(firstUpdate.tactics, "missing_initial_squad_tactics");
      const firstMove = requireValue(
        first.intents.find((intent) => intent.kind === "move" && intent.actorIds.includes(guard.actorId)),
        "missing_initial_move_intent"
      );
      if (firstMove.kind !== "move") throw new Error("unexpected_initial_intent_kind");
      const activeMoveGuard = {
        ...guard,
        activeOrder: {
          status: "known" as const,
          value: {
            orderType: OrderType.Move,
            targetActorId: null,
            targetPosition: { ...firstMove.logicalPosition, x: firstMove.logicalPosition.x + offset }
          },
          observedTick: 120
        }
      };
      const staleSignature = {
        ...firstUpdate,
        tactics: {
          ...firstTactics,
          orderSignature: sameSignature ? firstTactics.orderSignature : "previous:move:anchor:0,0,0"
        }
      };

      const next = manager.propose(observation([activeMoveGuard, enemy], 120), {
        ...initial,
        squads: [staleSignature]
      });

      expect(next.intents.some((intent) => intent.kind === "move" && intent.actorIds.includes(guard.actorId))).toBe(
        expectedMove
      );
    }
  );

  it("H-23 gives each actor one primary owner and releases an absent straggler", () => {
    const actors = [
      combatActor("guard-a", "self", 1),
      combatActor("guard-b", "self", 2),
      combatActor("enemy", "enemy", 6)
    ];
    const proposal = manager.propose(
      observation(actors),
      fixtureState([
        squad("squad:defense", "defense", ["guard-a", "missing"]),
        squad("squad:attack", "attack", ["guard-a", "guard-b", "missing"])
      ])
    );
    const updates = proposal.statePatch?.squadUpdates ?? [];
    expect(updates.find((entry) => entry.squadId === "squad:defense")?.actorIds).toEqual(["guard-a"]);
    expect(updates.find((entry) => entry.squadId === "squad:attack")?.actorIds).toEqual(["guard-b"]);
  });

  it("H-24 releases a lost target and records observed squad casualties without resetting the mission", () => {
    const guardA = combatActor("guard-a", "self", 1);
    const guardB = combatActor("guard-b", "self", 2);
    const targetA = combatActor("target-a", "enemy", 5, "ground", 1000, { capabilityFamilies: ["produce"] });
    const targetB = combatActor("target-b", "enemy", 6);
    const current = fixtureState([squad("squad:attack", "attack", ["guard-a", "guard-b"])]);
    const first = manager.propose(observation([guardA, guardB, targetA, targetB]), current);
    const committed = requireValue(first.statePatch?.squadUpdates?.[0], "missing_casualty_squad_update");
    const second = manager.propose(observation([guardA, targetB], 120), { ...current, squads: [committed] });
    expect(second.statePatch?.squadUpdates?.[0]?.tactics).toEqual(
      expect.objectContaining({
        targetActorId: "target-b",
        observedLossCount: 1,
        lastObservedMemberCount: 1
      })
    );
  });

  it("H6 records independently observed useful effects on the owning mission", () => {
    const guard = combatActor("guard", "self", 1);
    const current = fixtureState([squad("squad:attack", "attack", ["guard"])]);
    const effectId = "effect:stage13:squad:attack:damage:guard:enemy:115";
    const applied = {
      kind: "completed",
      tick: 115,
      resultingActorIds: [],
      worldLinkIds: ["world:attack"],
      identity: {
        matchId: "match:stage13",
        authorityEpoch: 1,
        playerNumber: 1,
        sequence: 7,
        commandId: "command:stage13:7",
        effectId,
        intentId: "intent:stage13:7"
      }
    } satisfies AiBrainStateV1["pendingOutcomes"][number];
    const proposal = manager.propose(observation([guard], 120), { ...current, pendingOutcomes: [applied] });
    expect(proposal.statePatch?.squadUpdates?.[0]?.lifecycle?.lastUsefulEffectTick).toBe(115);
  });
});
