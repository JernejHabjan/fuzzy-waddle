import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

import { combatActor, squad, fixtureState, observation, manager } from "./ai-tactics-test-fixtures";

describe("AiTacticsManager", () => {
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
