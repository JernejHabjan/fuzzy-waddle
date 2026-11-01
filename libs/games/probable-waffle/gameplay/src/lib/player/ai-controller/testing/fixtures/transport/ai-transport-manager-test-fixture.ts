import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiObservedActor, AiObservation } from "../../../contracts/observation/ai-observation";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../coordination/ai-test-fixtures";
import { buildAiAccessGraph, queryAiAccessRoute } from "../../../planning/access/ai-access-graph";

export const built = buildAiAccessGraph({
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
/** Preserve the checked transport discriminant for every importing lifecycle/route fixture. */
function fixtureRoute() {
  const result = queryAiAccessRoute(built.graph, routeRequest);
  if (result.kind !== "water_transport") throw new Error("invalid_boat_fixture_route");
  return result;
}

export const route = fixtureRoute();

export const catalog: AiCapabilityCatalog = {
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
): AiObservedActor {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    accessNodeId: { status: "known", value: nodeId, observedTick: 20 },
    housingCost: unknownAiValue
  };
}

export function observation(actors: readonly AiObservedActor[], tick: number): AiObservation {
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
