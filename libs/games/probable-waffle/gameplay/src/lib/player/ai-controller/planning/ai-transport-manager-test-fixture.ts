import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1, queryAiAccessRouteV1 } from "./ai-access-graph-v1";

export const built = buildAiAccessGraphV1({
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
      groundNeighborKeys: [],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 1,
      y: 0,
      ground: false,
      water: true,
      elevation: 0,
      groundNeighborKeys: [],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 2,
      y: 0,
      ground: false,
      water: true,
      elevation: 0,
      groundNeighborKeys: [],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 3,
      y: 0,
      ground: false,
      water: true,
      elevation: 0,
      groundNeighborKeys: [],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 4,
      y: 0,
      ground: true,
      water: false,
      elevation: 0,
      groundNeighborKeys: [],
      knowledge: "known_static",
      clearance: 2
    }
  ]
});
export const fromNodeId = built.groundNodeByTileKey.get("0,0")!;
export const toNodeId = built.groundNodeByTileKey.get("4,0")!;
export const routeRequest = {
  queryId: "query:boat-fixture",
  kind: "movement" as const,
  fromNodeId,
  toNodeId,
  capabilities: {
    moverDomains: ["ground" as const],
    targetDomains: [],
    waterTransportSeats: 4,
    airTransportSeats: 0,
    requiredPassengerSeats: 2,
    requiredClearance: 1
  },
  firingNodeIds: []
};
export const route = queryAiAccessRouteV1(built.graph, routeRequest);
if (route.kind !== "water_transport") throw new Error("invalid_boat_fixture_route");

export const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "CommonBoat:level:1",
      family: "transport",
      sourceObjectName: ObjectNames.CommonBoat,
      effectiveLevel: 1,
      movementDomains: ["water"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: 4
    }
  ]
};

export function actor(
  actorId: string,
  objectName: ObjectNames,
  nodeId: typeof fromNodeId,
  x: number
): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    accessNodeId: { status: "known", value: nodeId, observedTick: 20 },
    housingCost: unknownAiValue
  };
}

export function observation(actors: readonly AiObservedActorV1[], tick: number): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 5, height: 1 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: built.graph
    }
  };
}
