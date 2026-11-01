import { ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiObservedActor, AiObservation } from "../../../contracts/observation/ai-observation";
import { createAiProfileConfig } from "../../../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../coordination/ai-test-fixtures";
import { buildAiAccessGraph } from "../../../planning/access/ai-access-graph";
import { AiSkirmishManager } from "../../../planning/strategy/missions/ai-skirmish-manager";

const graphInput = buildAiAccessGraph({
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

export const homeNode = graphInput.groundNodeByTileKey.get("0,0")!;

export const enemyNode = graphInput.groundNodeByTileKey.get("1,0")!;

export const catalog: AiCapabilityCatalog = {
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

/** Supplies a ground combat contact at an explicit graph node and logical position. */
export function unit(actorId: string, accessNodeId: typeof homeNode, x: number): AiObservedActor {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 0 },
    accessNodeId: { status: "known", value: accessNodeId, observedTick: 0 },
    housingCost: { status: "known", value: 1, observedTick: 0 },
    capabilities: [
      {
        id: `${actorId}:attack`,
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 0 }
      }
    ],
    containedInActorId: null
  };
}

/** Separates authored graph/frontier facts from the planner's committed mission state. */
export function observation(
  tick: number,
  actors: readonly AiObservedActor[],
  frontiers: readonly (typeof homeNode)[] = [enemyNode],
  coverage: readonly (typeof homeNode)[] = []
): AiObservation {
  return {
    ...createAiTestObservation(),
    generation: 1,
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: frontiers,
      scoutCoverageAccessNodeIds: coverage,
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: graphInput.graph
    }
  };
}

export const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);

export const manager = new AiSkirmishManager(profile, () => catalog);
