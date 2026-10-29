import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { AiSkirmishManager } from "./ai-skirmish-manager";
import { ownedCombat } from "./ai-skirmish-support";

const graph = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 0,
  continuationCursor: 0,
  includeAirRegion: true,
  cells: [
    {
      x: 0,
      y: 0,
      ground: true,
      water: false,
      elevation: 0,
      groundNeighborKeys: ["1,0"],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 1,
      y: 0,
      ground: true,
      water: false,
      elevation: 0,
      groundNeighborKeys: ["0,0"],
      knowledge: "known_static",
      clearance: 1
    }
  ]
});
const homeNode = graph.groundNodeByTileKey.get("0,0")!;
const enemyNode = graph.groundNodeByTileKey.get("1,0")!;
const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "guard",
      family: "military",
      sourceObjectName: ObjectNames.TivaraMacemanMale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    }
  ]
};

function actor(actorId: string, nodeId: typeof homeNode, x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    accessNodeId: { status: "known", value: nodeId, observedTick: 20 },
    housingCost: { status: "known", value: 1, observedTick: 20 },
    capabilities: [
      {
        id: `${actorId}:attack`,
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 20 }
      }
    ],
    containedInActorId: null
  };
}

describe("AiSkirmishManager offense target selection", () => {
  it("orders combat force by visible geometry instead of run-local actor IDs", () => {
    const west = actor("z-west", homeNode, 8);
    const east = actor("a-east", homeNode, 12);
    const observation = createAiTestObservation();

    expect(ownedCombat({ ...observation, actors: [east, west] }, catalog).map((member) => member.actorId)).toEqual([
      "z-west",
      "a-east"
    ]);
    expect(ownedCombat({ ...observation, actors: [west, east] }, catalog).map((member) => member.actorId)).toEqual([
      "z-west",
      "a-east"
    ]);
  });

  it("reserves the best positioned scout for the primary information question before neutral scouting", () => {
    const frontierCandidate = actor("frontier-candidate", homeNode, 0);
    const neutralCandidate = actor("neutral-candidate", homeNode, 1);
    const resource: AiObservedActorV1 = {
      ...createAiTestOwnedActor("neutral-resource"),
      objectName: ObjectNames.Tree6,
      owner: null,
      relation: "neutral",
      visibility: "visible",
      logicalPosition: { status: "known", value: { x: 1, y: 0, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known", value: enemyNode, observedTick: 20 },
      capabilities: [],
      resourceState: {
        status: "known",
        observedTick: 20,
        value: {
          resourceType: ResourceType.Wood,
          available: { status: "known", value: 180, observedTick: 20 },
          carried: { status: "unknown", reason: "not_supported" },
          growthReadyTick: { status: "unknown", reason: "not_supported" },
          serviceCapacity: { status: "unknown", reason: "not_supported" }
        }
      }
    };
    const base = createAiTestObservation();
    const world = {
      ...base,
      tick: 20,
      actors: [frontierCandidate, neutralCandidate, resource],
      map: {
        bounds: { status: "known" as const, value: { width: 2, height: 1 }, observedTick: 20 },
        staticRevision: 1,
        frontierAccessNodeIds: [enemyNode],
        scoutCoverageAccessNodeIds: [],
        scoutSearchPoints: [
          { pointId: "search:front", accessNodeId: enemyNode, position: { x: 1, y: 0, z: 0 }, observed: false }
        ],
        dynamicObstacleActorIds: [],
        regionGeneration: { generation: 1, status: "ready" as const, continuationCursor: 0 },
        accessGraph: graph.graph
      }
    };
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const proposal = new AiSkirmishManager(profile, () => catalog).propose(world, initial);
    expect(proposal.statePatch?.squads?.find((squad) => squad.squadId === "squad:scout:primary")?.actorIds).toEqual([
      frontierCandidate.actorId
    ]);
    expect(proposal.statePatch?.squads?.find((squad) => squad.squadId === "squad:scout:neutral")?.actorIds).toEqual([
      neutralCandidate.actorId
    ]);
  });

  it("keeps an active frontier scout out of a newly formed attack force", () => {
    const scout = actor("frontier-scout", homeNode, 0);
    const guard = actor("guard", homeNode, 0);
    const enemy = {
      ...actor("enemy", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: []
    };
    const observation = createAiTestObservation();
    const world = {
      ...observation,
      tick: 20,
      actors: [scout, guard, enemy],
      map: {
        bounds: { status: "known" as const, value: { width: 2, height: 1 }, observedTick: 20 },
        staticRevision: 1,
        frontierAccessNodeIds: [enemyNode],
        scoutCoverageAccessNodeIds: [],
        scoutSearchPoints: [
          { pointId: "search:front", accessNodeId: enemyNode, position: { x: 1, y: 0, z: 0 }, observed: false }
        ],
        dynamicObstacleActorIds: [],
        regionGeneration: { generation: 1, status: "ready" as const, continuationCursor: 0 },
        accessGraph: graph.graph
      }
    };
    const baseState = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const state: AiBrainStateV1 = {
      ...baseState,
      squads: [
        {
          squadId: "squad:scout:neutral",
          role: "scout",
          domain: "ground",
          actorIds: [],
          objectiveId: "neutral:nearby",
          state: "recover"
        },
        {
          squadId: "squad:scout:primary",
          role: "scout",
          domain: "ground",
          actorIds: [scout.actorId],
          objectiveId: "question:search:front",
          state: "moving"
        }
      ]
    };

    const proposal = new AiSkirmishManager(profile, () => catalog).propose(world, state);
    const attack = proposal.statePatch?.squads?.find((squad) => squad.role === "attack");
    const frontierScout = proposal.statePatch?.squads?.find((squad) => squad.objectiveId === "question:search:front");

    expect(attack?.actorIds).toContain(guard.actorId);
    expect(attack?.actorIds).not.toContain(scout.actorId);
    expect(frontierScout?.actorIds).toEqual([scout.actorId]);
    for (const intent of proposal.intents) {
      if (intent.kind !== "attack" && intent.kind !== "scout") continue;
      expect(intent.claims.flatMap((claim) => (claim.kind === "actor" ? [claim.actorId] : [])).sort()).toEqual(
        [...intent.actorIds].sort()
      );
    }

    const neutralProposal = new AiSkirmishManager(profile, () => catalog).propose(world, {
      ...state,
      squads: state.squads
        .filter((squad) => squad.squadId !== "squad:scout:neutral")
        .map((squad) =>
          squad.squadId === "squad:scout:primary"
            ? { ...squad, squadId: "squad:scout:neutral", objectiveId: "neutral:nearby" }
            : squad
        )
    });
    const neutralAttack = neutralProposal.statePatch?.squads?.find((squad) => squad.role === "attack");
    expect(neutralAttack?.actorIds).not.toContain(scout.actorId);
  });

  it("prioritizes an observed enemy main building over a nearer non-terminal structure", () => {
    const guard = actor("guard", homeNode, 0);
    const enemyStructure = {
      ...actor("enemy-structure", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: []
    };
    const enemyMain = {
      ...actor("enemy-main", enemyNode, 2),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 }
    };
    const observation = createAiTestObservation();
    const proposal = new AiSkirmishManager(profile, () => catalog).propose(
      {
        ...observation,
        tick: 20,
        actors: [guard, enemyStructure, enemyMain],
        map: {
          bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: 20 },
          staticRevision: 1,
          frontierAccessNodeIds: [enemyNode],
          scoutCoverageAccessNodeIds: [],
          dynamicObstacleActorIds: [],
          regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
          accessGraph: graph.graph
        }
      },
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "balanced"
      })
    );

    expect(proposal.statePatch?.squads).toContainEqual(
      expect.objectContaining({ role: "attack", objectiveId: "enemy-main" })
    );
  });

  it("assigns a limited reserve squad to an exposed economic raid while the main force keeps its objective", () => {
    const army = Array.from({ length: 12 }, (_, index) => actor(`army-${index}`, homeNode, 0));
    const enemyMain = {
      ...actor("enemy-main", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 }
    };
    const enemyWorker = {
      ...actor("enemy-worker", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: [
        {
          id: "enemy-worker:gather",
          family: "gather" as const,
          level: 1,
          domains: ["ground" as const],
          targetDomains: [],
          capacity: { status: "known" as const, value: 1, observedTick: 20 }
        }
      ]
    };
    const observation = createAiTestObservation();
    const proposal = new AiSkirmishManager(profile, () => catalog).propose(
      {
        ...observation,
        tick: 20,
        actors: [...army, enemyMain, enemyWorker],
        map: {
          bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: 20 },
          staticRevision: 1,
          frontierAccessNodeIds: [enemyNode],
          scoutCoverageAccessNodeIds: [],
          dynamicObstacleActorIds: [],
          regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
          accessGraph: graph.graph
        }
      },
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "balanced"
      })
    );

    const attackSquads = proposal.statePatch?.squads?.filter((squad) => squad.role === "attack") ?? [];
    expect(attackSquads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ objectiveId: "enemy-main" }),
        expect.objectContaining({ objectiveId: "enemy-worker", actorIds: expect.arrayContaining([expect.any(String)]) })
      ])
    );
    const raid = attackSquads.find((squad) => squad.squadId.startsWith("squad:attack:raid:"));
    expect(raid?.actorIds).toHaveLength(3);
  });

  it("sends an idle naval attacker to a remembered coast target on a separate front", () => {
    const coastalGraph = buildAiAccessGraphV1({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 0,
      builtTick: 20,
      continuationCursor: 0,
      includeAirRegion: true,
      cells: [
        {
          x: 0,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: ["1,0"],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 1,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: ["0,0", "2,0"],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 2,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: ["1,0", "3,0"],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 3,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: ["2,0", "4,0"],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 4,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: ["3,0", "5,0"],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 5,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: ["4,0"],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 5,
          y: 1,
          ground: false,
          water: true,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 3,
          y: 2,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        }
      ]
    });
    const navalNode = coastalGraph.waterNodeByTileKey.get("5,1");
    const coastalNode = coastalGraph.groundNodeByTileKey.get("3,0");
    const misleadingNode = coastalGraph.groundNodeByTileKey.get("3,2");
    const homeGroundNode = coastalGraph.groundNodeByTileKey.get("0,0");
    if (!navalNode || !coastalNode || !misleadingNode || !homeGroundNode)
      throw new Error("test_coastal_mission_access_nodes_missing");
    const accessGraph = {
      ...coastalGraph.graph,
      nodes: coastalGraph.graph.nodes.map((node) =>
        node.nodeId === navalNode ? { ...node, representativePosition: { x: 5, y: 0, z: 0 } } : node
      ),
      links: [
        ...coastalGraph.graph.links,
        {
          linkId: "test:misleading-ground-route:outbound",
          fromNodeId: homeGroundNode,
          toNodeId: misleadingNode,
          domain: "ground" as const,
          clearance: 2,
          distanceCost: 1,
          knowledge: "known_static" as const,
          directional: true
        },
        {
          linkId: "test:misleading-ground-route:inbound",
          fromNodeId: misleadingNode,
          toNodeId: homeGroundNode,
          domain: "ground" as const,
          clearance: 2,
          distanceCost: 1,
          knowledge: "known_static" as const,
          directional: true
        }
      ]
    };
    const navalFiringPosition = accessGraph.transferPoints.find(
      (transfer) => transfer.kind === "shore" && transfer.toNodeId === navalNode && transfer.passengerPosition.x === 5
    )?.carrierPosition;
    const army = Array.from({ length: 12 }, (_, index) => actor(`army-${index}`, homeNode, 0));
    const boat: AiObservedActorV1 = {
      ...createAiTestOwnedActor("naval-boat"),
      objectName: ObjectNames.VikingBoat,
      housingCost: { status: "known", value: 1, observedTick: 20 },
      logicalPosition: { status: "known", value: { x: 5, y: 1, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known", value: navalNode, observedTick: 20 },
      combatProfile: {
        status: "known",
        observedTick: 20,
        value: {
          maxHealth: 240,
          maxArmour: 30,
          passiveRegenerationPerSecond: 0,
          armourPermille: 0,
          attacks: [
            {
              damage: 12,
              cooldownTicks: 60,
              remainingCooldownTicks: 0,
              range: 7,
              minRange: 2,
              highGroundRangeBonus: 1,
              impactDelayTicks: 0,
              areaRadius: 0,
              targetDomains: ["ground", "water"]
            }
          ],
          healing: null,
          spells: [],
          statuses: []
        }
      },
      capabilities: [
        {
          id: "naval-boat:attack",
          family: "naval",
          level: 1,
          domains: ["water"],
          targetDomains: ["ground", "water"],
          capacity: { status: "known", value: 0, observedTick: 20 }
        }
      ]
    };
    const coastalWorkmill = {
      ...actor("coastal-workmill", coastalNode, 2),
      objectName: ObjectNames.WorkMill,
      owner: 2,
      relation: "enemy" as const,
      visibility: "last_seen" as const,
      logicalPosition: { status: "known" as const, value: { x: 3, y: 0, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "unknown" as const, reason: "query_pending" as const },
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: []
    };
    const mixedCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries,
        {
          capabilityId: "viking-boat",
          family: "naval",
          sourceObjectName: ObjectNames.VikingBoat,
          effectiveLevel: 1,
          movementDomains: ["water"],
          targetDomains: ["ground", "water"],
          produces: [],
          constructs: [],
          researches: [],
          gathers: [],
          housingCapacity: null,
          housingCost: 1,
          cargoCapacity: null
        }
      ]
    };
    const observation = createAiTestObservation();
    const proposal = new AiSkirmishManager(profile, () => mixedCatalog).propose(
      {
        ...observation,
        tick: 20,
        actors: [...army, boat, coastalWorkmill],
        map: {
          bounds: { status: "known", value: { width: 6, height: 3 }, observedTick: 20 },
          staticRevision: 1,
          frontierAccessNodeIds: [coastalNode],
          scoutCoverageAccessNodeIds: [],
          dynamicObstacleActorIds: [],
          regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
          accessGraph
        }
      },
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "balanced"
      })
    );

    expect(proposal.statePatch?.squads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "attack",
          domain: "ground",
          objectiveId: "hypothesis:" + coastalWorkmill.evidenceId
        }),
        expect.objectContaining({
          role: "attack",
          domain: "water",
          objectiveId: "hypothesis:" + coastalWorkmill.evidenceId,
          actorIds: [boat.actorId]
        })
      ])
    );
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({
        kind: "move",
        actorIds: [boat.actorId],
        logicalPosition: navalFiringPosition
      })
    );

    const distantVisibleBoat: AiObservedActorV1 = {
      ...boat,
      actorId: "distant-visible-naval-boat",
      logicalPosition: { status: "known", value: { x: 5, y: 12, z: 0 }, observedTick: 20 },
      visibleEnemyActorIds: [coastalWorkmill.actorId]
    };
    const visibleCoastalWorkmill = {
      ...coastalWorkmill,
      visibility: "visible" as const,
      accessNodeId: { status: "known" as const, value: coastalNode, observedTick: 20 }
    };
    const distantVisibleProposal = new AiSkirmishManager(profile, () => mixedCatalog).propose(
      {
        ...observation,
        tick: 20,
        actors: [distantVisibleBoat, visibleCoastalWorkmill],
        map: {
          bounds: { status: "known", value: { width: 20, height: 20 }, observedTick: 20 },
          staticRevision: 1,
          frontierAccessNodeIds: [coastalNode],
          scoutCoverageAccessNodeIds: [],
          dynamicObstacleActorIds: [],
          regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
          accessGraph
        }
      },
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "balanced"
      })
    );
    expect(distantVisibleProposal.intents).toContainEqual(
      expect.objectContaining({
        kind: "move",
        actorIds: [distantVisibleBoat.actorId],
        logicalPosition: navalFiringPosition
      })
    );
  });

  it("keeps home defenders while splitting only surplus attackers onto a second front", () => {
    const army = Array.from({ length: 20 }, (_, index) => actor(`army-${index}`, homeNode, 0));
    const home = {
      ...actor("home", homeNode, 0),
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 }
    };
    const threat = {
      ...actor("home-threat", homeNode, 0),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const enemyMain = {
      ...actor("enemy-main", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 }
    };
    const enemyWorker = {
      ...actor("enemy-worker", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: [
        {
          id: "enemy-worker:gather",
          family: "gather" as const,
          level: 1,
          domains: ["ground" as const],
          targetDomains: [],
          capacity: { status: "known" as const, value: 1, observedTick: 20 }
        }
      ]
    };
    const observation = createAiTestObservation();
    const world = {
      ...observation,
      tick: 20,
      actors: [...army, home, threat, enemyMain, enemyWorker],
      map: {
        bounds: { status: "known" as const, value: { width: 2, height: 1 }, observedTick: 20 },
        staticRevision: 1,
        frontierAccessNodeIds: [enemyNode],
        scoutCoverageAccessNodeIds: [],
        dynamicObstacleActorIds: [],
        regionGeneration: { generation: 1, status: "ready" as const, continuationCursor: 0 },
        accessGraph: graph.graph
      }
    };
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const manager = new AiSkirmishManager(profile, () => catalog);
    const proposal = manager.propose(world, initial);

    const squads = proposal.statePatch?.squads ?? [];
    const defense = squads.find((entry) => entry.role === "defense");
    const primary = squads.find((entry) => entry.squadId === "squad:attack:primary");
    const raid = squads.find((entry) => entry.squadId.startsWith("squad:attack:raid:"));
    expect(defense?.actorIds.length).toBeGreaterThan(0);
    expect(primary?.objectiveId).toBe("enemy-main");
    expect(raid?.objectiveId).toBe("enemy-worker");
    if (!defense || !primary || !raid) throw new Error("missing_expected_fronts");
    const allMembers = [defense, primary, raid].flatMap((entry) => entry?.actorIds ?? []);
    expect(new Set(allMembers).size).toBe(allMembers.length);
    expect(primary.actorIds.length).toBeGreaterThan(raid.actorIds.length);

    const committedPrimary = { ...primary, actorIds: [...primary.actorIds, ...raid.actorIds] };
    const continued = manager.propose(world, { ...initial, squads: [defense, committedPrimary] });
    expect(continued.statePatch?.squads?.some((entry) => entry.squadId.startsWith("squad:attack:raid:"))).toBe(false);

    const understrength = manager.propose(
      { ...world, actors: [...army.slice(0, 8), home, threat, enemyMain, enemyWorker] },
      initial
    );
    expect(understrength.statePatch?.squads?.some((entry) => entry.squadId.startsWith("squad:attack:raid:"))).toBe(
      false
    );

    const enemyProducer = (id: string) => ({
      ...actor(id, enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: [
        {
          id: `${id}:produce`,
          family: "produce" as const,
          level: 1,
          domains: ["ground" as const],
          targetDomains: [],
          capacity: { status: "known" as const, value: 1, observedTick: 20 }
        }
      ]
    });
    const producers = [enemyProducer("producer-a"), enemyProducer("producer-b")];
    const nearProducers = manager.propose({ ...world, actors: [...world.actors, ...producers] }, initial);
    expect(
      nearProducers.statePatch?.squads?.some(
        (entry) => entry.squadId.startsWith("squad:attack:raid:") && entry.objectiveId === "enemy-worker"
      )
    ).toBe(true);

    const defenders = Array.from({ length: 4 }, (_, index) => ({
      ...actor(`enemy-defender-${index}`, enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    }));
    const defendedTarget = manager.propose({ ...world, actors: [...world.actors, ...defenders] }, initial);
    expect(defendedTarget.statePatch?.squads?.some((entry) => entry.squadId.startsWith("squad:attack:raid:"))).toBe(
      false
    );
  });

  it("assigns only anti-air combat actors to defend a protected base from an air raider", () => {
    const main = {
      ...actor("main", homeNode, 0),
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 }
    };
    const groundGuard = actor("ground-guard", homeNode, 0);
    const antiAirGuard = {
      ...actor("anti-air-guard", homeNode, 0),
      capabilities: [
        {
          id: "anti-air-guard:attack",
          family: "military" as const,
          level: 1,
          domains: ["ground"] as const,
          targetDomains: ["air"] as const,
          capacity: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const airRaider = {
      ...actor("air-raider", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      capabilities: [
        {
          id: "air-raider:attack",
          family: "military" as const,
          level: 1,
          domains: ["air"] as const,
          targetDomains: ["ground"] as const,
          capacity: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ],
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Attack, targetActorId: main.actorId },
        observedTick: 20
      }
    };
    const observation = createAiTestObservation();
    const proposal = new AiSkirmishManager(profile, () => catalog).propose(
      {
        ...observation,
        tick: 20,
        actors: [main, groundGuard, antiAirGuard, airRaider],
        map: {
          bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: 20 },
          staticRevision: 1,
          frontierAccessNodeIds: [enemyNode],
          scoutCoverageAccessNodeIds: [],
          dynamicObstacleActorIds: [],
          regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
          accessGraph: graph.graph
        }
      },
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "balanced"
      })
    );

    expect(proposal.statePatch?.squads).toContainEqual(
      expect.objectContaining({ role: "defense", objectiveId: "air-raider", actorIds: ["anti-air-guard"] })
    );
  });

  it("removes defense reassignees from the retained attack tactics ownership", () => {
    const home = {
      ...createAiTestOwnedActor("home"),
      objectName: ObjectNames.Sandhold,
      logicalPosition: { status: "known" as const, value: { x: 0, y: 0, z: 0 }, observedTick: 20 },
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 },
      housingCost: { status: "known" as const, value: 0, observedTick: 20 }
    };
    const members = Array.from({ length: 5 }, (_, index) => actor(`member-${index}`, homeNode, 0));
    const raider = {
      ...actor("raider", homeNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Attack, targetActorId: "home" },
        observedTick: 20
      }
    };
    const enemyMain = {
      ...actor("enemy-main", enemyNode, 8),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 },
      capabilities: []
    };
    const observation = createAiTestObservation();
    const baseState = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const tactics = {
      taskForceId: "task-force:1",
      script: "hold_front" as const,
      targetActorId: "enemy-main",
      targetScore: 900,
      engagementRatioPermille: 1000,
      confidencePermille: 1000,
      predictedFriendlyLossPermille: 0,
      predictedEnemyLossPermille: 0,
      lastObservedMemberCount: members.length,
      observedLossCount: 0,
      lastTransitionTick: 20,
      nextReconsiderTick: 100,
      oscillationCount: 0,
      orderSignature: "attack:enemy-main",
      orderedActorIds: members.map((member) => member.actorId),
      assignedPositions: [],
      damageReservations: [],
      protectedRouteNodeIds: [],
      mobileReserveActorIds: [],
      objectiveAlternatives: []
    };
    const state: AiBrainStateV1 = {
      ...baseState,
      squads: [
        {
          squadId: "squad:attack:primary",
          role: "attack",
          domain: "ground",
          actorIds: members.map((member) => member.actorId),
          objectiveId: "enemy-main",
          state: "engaged",
          lifecycle: {
            targetPlayerNumber: 2,
            targetRegionId: enemyNode,
            protectedBaseId: null,
            rallyNodeId: homeNode,
            retreatNodeId: homeNode,
            createdTick: 0,
            assemblyDeadline: { clock: "simulation", unit: "tick", dueTick: 1000, persistence: "save" },
            effectDeadline: { clock: "simulation", unit: "tick", dueTick: 1000, persistence: "save" },
            lastUsefulEffectTick: 20,
            recoveryAttempt: 0,
            terminalReason: null
          },
          tactics
        }
      ]
    };
    const proposal = new AiSkirmishManager(profile, () => catalog).propose(
      {
        ...observation,
        tick: 20,
        actors: [home, ...members, raider, enemyMain],
        threatSummary: { ...observation.threatSummary, visibleEnemyActorIds: [raider.actorId] },
        map: {
          bounds: { status: "known", value: { width: 10, height: 1 }, observedTick: 20 },
          staticRevision: 1,
          frontierAccessNodeIds: [enemyNode],
          scoutCoverageAccessNodeIds: [],
          dynamicObstacleActorIds: [],
          regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
          accessGraph: graph.graph
        }
      },
      state
    );
    const attack = proposal.statePatch?.squads?.find((squad) => squad.role === "attack");
    expect(attack).toBeDefined();
    expect(attack?.tactics?.orderedActorIds.every((actorId) => attack.actorIds.includes(actorId))).toBe(true);
  });
});
