import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

import { combatActor, squad, fixtureState, observation, manager } from "./ai-tactics-test-fixtures";

describe("AiTacticsManager", () => {
  it("withdraws a scout from a sustained low-damage attacker when a legal retreat exists", () => {
    const scout = combatActor("scout", "self", 0, "ground", 750, { damage: 6 });
    const pursuer = combatActor("pursuer", "enemy", 3, "ground", 1000, { damage: 6 });
    if (pursuer.combatProfile?.status !== "known") throw new Error("Expected known pursuer combat profile");
    const durablePursuer = {
      ...pursuer,
      combatProfile: { ...pursuer.combatProfile, value: { ...pursuer.combatProfile.value, maxHealth: 150 } }
    };
    const scoutSquad = squad("squad:scout", "scout", [scout.actorId]);

    const proposal = manager.propose(observation([scout, durablePursuer]), fixtureState([scoutSquad]));

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        role: "scout",
        state: "retreat",
        tactics: expect.objectContaining({ script: "protected_retreat" })
      })
    );
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "move", actorIds: [scout.actorId] }));
  });

  it("does not issue a scout retreat toward an unobserved or unreachable tile", () => {
    const scout = combatActor("scout", "self", 0, "ground", 750, { damage: 6 });
    const pursuer = combatActor("pursuer", "enemy", 3, "ground", 1000, { damage: 6 });
    const scoutSquad = squad("squad:scout", "scout", [scout.actorId]);
    const withoutPassableRetreat = observation([scout, pursuer]);
    const map = withoutPassableRetreat.map;
    if (!map) throw new Error("Expected test map");

    const proposal = manager.propose(
      { ...withoutPassableRetreat, map: { ...map, constructionCells: [] } },
      fixtureState([scoutSquad])
    );

    expect(proposal.statePatch?.squadUpdates?.[0]?.state).not.toBe("retreat");
    expect(proposal.intents.some((intent) => intent.reasonCode.includes("protected_retreat"))).toBe(false);
  });

  it("keeps a scout's escape destination stable while a visible pursuer moves", () => {
    const scout = combatActor("scout", "self", 3, "ground", 750, { damage: 6 });
    const pursuer = combatActor("pursuer", "enemy", 4, "ground", 1000, { damage: 6 });
    const base = observation([scout, pursuer]);
    if (!base.map) throw new Error("Expected test map");
    const cells = Array.from({ length: 101 }, (_, x) => ({
      tileKey: `${x},0`,
      position: { x, y: 0, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }));
    const world = {
      ...base,
      map: { ...base.map, bounds: { ...base.map.bounds, value: { width: 128, height: 32 } }, constructionCells: cells }
    };
    const first = manager.propose(world, fixtureState([squad("squad:scout", "scout", [scout.actorId])]));
    const updated = first.statePatch?.squadUpdates?.[0];
    expect(updated?.state).toBe("retreat");
    if (!updated) throw new Error("Expected updated scout squad");
    const originalDestination = updated.tactics?.assignedPositions[0]?.position;
    expect(originalDestination).toEqual({ x: 100, y: 0, z: 0 });
    const scoutAfterProgress = {
      ...scout,
      logicalPosition: { status: "known" as const, value: { x: 90, y: 0, z: 0 }, observedTick: 120 }
    };

    const second = manager.propose(
      {
        ...world,
        tick: 120,
        actors: [
          scoutAfterProgress,
          { ...pursuer, logicalPosition: { status: "known", value: { x: 98, y: 0, z: 0 }, observedTick: 120 } }
        ]
      },
      fixtureState([
        {
          ...updated,
          tactics: { ...updated.tactics, script: "land_regroup" }
        }
      ])
    );

    expect(second.intents).toContainEqual(
      expect.objectContaining({ kind: "move", actorIds: [scout.actorId], logicalPosition: originalDestination })
    );
  });

  it("keeps a defense squad on its committed worker threat instead of switching to a nearer bystander", () => {
    const defender = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const committedRaider = combatActor("committed-raider", "enemy", 5, "ground", 1000, { damage: 10 });
    const nearerBystander = combatActor("nearer-bystander", "enemy", 2, "ground", 1000, { damage: 10 });
    const defense = {
      ...squad("squad:defense:home", "defense", [defender.actorId]),
      objectiveId: committedRaider.actorId
    };

    const proposal = manager.propose(
      observation([defender, committedRaider, nearerBystander]),
      fixtureState([defense])
    );

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({ role: "defense", objectiveId: committedRaider.actorId })
    );
    expect(
      proposal.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === nearerBystander.actorId)
    ).toBe(false);
  });

  it("moves toward a player-visible target until the member has local vision to attack", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const enemy = combatActor("enemy", "enemy", 20, "ground", 1000, { damage: 10 });
    const current = fixtureState([squad("squad:attack", "attack", [friend.actorId])]);

    const proposal = manager.propose(observation([friend, enemy], 200), current);

    expect(proposal.intents.some((intent) => intent.kind === "attack")).toBe(false);
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "move", actorIds: [friend.actorId] }));
  });

  it("continues advancing toward a remembered objective while it is outside current vision", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const rememberedEnemy = {
      ...combatActor("enemy", "enemy", 8, "ground", 1000, { damage: 10 }),
      visibility: "last_seen" as const
    };
    const attack = { ...squad("squad:attack", "attack", [friend.actorId]), objectiveId: rememberedEnemy.actorId };

    const proposal = manager.propose(observation([friend, rememberedEnemy], 300), fixtureState([attack]));

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({ state: "advance", objectiveId: rememberedEnemy.actorId })
    );
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "move" }));
    expect(proposal.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("releases a mission whose last-known objective has remained stale past its pursuit bound", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const staleEnemy = {
      ...combatActor("enemy", "enemy", 8, "ground", 1000, { damage: 10 }),
      visibility: "last_seen" as const,
      observedTick: 1400,
      logicalPosition: { status: "known" as const, value: { x: 8, y: 0, z: 0 }, observedTick: 100 }
    };
    const attack = { ...squad("squad:attack", "attack", [friend.actorId]), objectiveId: staleEnemy.actorId };

    const proposal = manager.propose(observation([friend, staleEnemy], 1400), fixtureState([attack]));

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        actorIds: [],
        state: "completed",
        lifecycle: expect.objectContaining({ terminalReason: "stale_contact_released" })
      })
    );
    expect(proposal.intents).toEqual([]);
  });

  it("releases a mission after its concrete objective disappears from permitted observation", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const attack = { ...squad("squad:attack", "attack", [friend.actorId]), objectiveId: "missing-enemy" };

    const proposal = manager.propose(observation([friend], 1400), fixtureState([attack]));

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({ actorIds: [], state: "completed" })
    );
    expect(proposal.intents).toEqual([]);
  });

  it("WALL-03 assigns reachable rampart posts while retaining a mobile reserve", () => {
    const defenders = [0, 1, 2, 3].map((index) => combatActor(`guard-${index}`, "self", index));
    const enemy = combatActor("enemy", "enemy", 6);
    const current = fixtureState([
      squad(
        "squad:defense",
        "defense",
        defenders.map((actor) => actor.actorId)
      )
    ]);
    const fortified: AiBrainStateV1 = {
      ...current,
      fortifications: [
        {
          planId: "fortification:home",
          nodeIds: ["post:1"],
          completedNodeIds: ["post:1"],
          protectedBaseIds: ["base:home"],
          lifecycle: "active",
          graph: {
            baseId: "base:home",
            createdTick: 0,
            terrainAnchorTileKeys: ["0,0", "2,0"],
            openingNodeId: "opening",
            protectedAssetIds: ["main"],
            wholeConnectivity: "preserved",
            incrementalConnectivity: "preserved",
            budget: { spendPermille: 100, committedByResource: {}, remainingByResource: {} },
            nodes: [
              {
                nodeId: "post:1",
                kind: "tower",
                objectName: null,
                position: { x: 0, y: 0, z: 1 },
                footprintTileKeys: ["0,0"],
                navigation: null,
                componentId: "front",
                dependsOnNodeId: null,
                lifecycle: "finished",
                completedActorId: null,
                attempt: 0,
                effectId: null,
                retryAfterTick: 0,
                marginalCoverage: 10,
                targetDomains: ["ground"],
                defenderPostReachable: true
              }
            ],
            constructionSequenceNodeIds: ["post:1"],
            defenderPosts: [{ nodeId: "post:1", assignedActorIds: [], reachable: true }],
            breach: { missingNodeIds: [], reason: null, risk: "none", responseEffectId: null, recoveryAttempts: 0 }
          }
        }
      ]
    };
    const proposal = manager.propose(observation([...defenders, enemy]), fortified);
    const tactics = proposal.statePatch?.squadUpdates?.[0]?.tactics;
    expect(tactics).toEqual(expect.objectContaining({ script: "rampart_defend", mobileReserveActorIds: ["guard-3"] }));
    expect(
      tactics?.assignedPositions.some((assignment) => tactics.mobileReserveActorIds.includes(assignment.actorId))
    ).toBe(false);

    const breached = manager.propose(observation([...defenders, enemy], 120), {
      ...fortified,
      fortifications: fortified.fortifications.map((plan) => ({
        ...plan,
        graph: plan.graph ? { ...plan.graph, breach: { ...plan.graph.breach, missingNodeIds: ["post:2"] } } : plan.graph
      }))
    });
    expect(breached.statePatch?.squadUpdates?.[0]?.tactics?.script).toBe("rampart_reinforce");

    const topologyLost = manager.propose(observation([...defenders, enemy], 140), {
      ...fortified,
      fortifications: fortified.fortifications.map((plan) => ({
        ...plan,
        graph: plan.graph
          ? {
              ...plan.graph,
              defenderPosts: plan.graph.defenderPosts.map((post) => ({ ...post, reachable: false }))
            }
          : plan.graph
      }))
    });
    expect(topologyLost.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        state: "retreat",
        tactics: expect.objectContaining({ script: "rampart_withdraw" })
      })
    );
  });
});
