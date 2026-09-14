import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { AiSkirmishManager } from "./ai-skirmish-manager";

const graph = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 0,
  continuationCursor: 0,
  includeAirRegion: true,
  cells: [
    { x: 0, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["1,0"], knowledge: "known_static", clearance: 2 },
    { x: 1, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["0,0"], knowledge: "known_static", clearance: 1 }
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
});
