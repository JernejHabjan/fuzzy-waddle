import { ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { AiSkirmishManager } from "./ai-skirmish-manager";

const graphInput = buildAiAccessGraphV1({
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

export const catalog: AiCapabilityCatalogV1 = {
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
export function unit(actorId: string, accessNodeId: typeof homeNode, x: number): AiObservedActorV1 {
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
  actors: readonly AiObservedActorV1[],
  frontiers: readonly (typeof homeNode)[] = [enemyNode],
  coverage: readonly (typeof homeNode)[] = []
): AiObservationV1 {
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

export const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

export const manager = new AiSkirmishManager(profile, () => catalog);
