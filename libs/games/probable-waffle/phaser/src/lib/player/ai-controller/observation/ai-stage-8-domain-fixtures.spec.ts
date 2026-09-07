import { buildAiAccessGraphV1, queryAiAccessRouteV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { commonBoatDefinition } from "../../../prefabs/characters/shared/CommonBoat/common_boat.definition";

/** Test-only future capability; it is deliberately not registered in either faction roster. */
const SYNTHETIC_FLYING_CONTAINER = {
  fixtureKind: "synthetic_flying_container",
  containerCapacity: 3,
  movementDomain: "air",
  pickupDomain: "ground",
  dropDomain: "ground"
} as const;

describe("Stage 8 runtime domain fixtures", () => {
  it("pins the actual CommonBoat as a mobile water container", () => {
    expect(commonBoatDefinition.components.container.capacity).toBeGreaterThan(0);
    expect(commonBoatDefinition.components.translatable.movementTerrainType).toBe(MovementTerrainType.Water);
  });

  it("routes a synthetic flying container without a shore-only assumption", () => {
    const built = buildAiAccessGraphV1({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 0,
      builtTick: 0,
      continuationCursor: 0,
      includeAirRegion: true,
      cells: [
        { x: 0, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: [], knowledge: "known_static", clearance: 2 },
        { x: 4, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: [], knowledge: "known_static", clearance: 2 }
      ]
    });
    const result = queryAiAccessRouteV1(built.graph, {
      queryId: "query:synthetic-air-container",
      kind: "movement",
      fromNodeId: built.groundNodeByTileKey.get("0,0")!,
      toNodeId: built.groundNodeByTileKey.get("4,0")!,
      capabilities: {
        moverDomains: [SYNTHETIC_FLYING_CONTAINER.pickupDomain],
        targetDomains: [],
        waterTransportSeats: 0,
        airTransportSeats: SYNTHETIC_FLYING_CONTAINER.containerCapacity,
        requiredPassengerSeats: 2,
        requiredClearance: 1
      },
      firingNodeIds: []
    });

    expect(result).toEqual(expect.objectContaining({ kind: "air_transport" }));
    if (result.kind !== "air_transport") throw new Error("synthetic_air_route_missing");
    expect(result.pickupCandidates[0]?.kind).toBe("air_pickup");
    expect(result.landingCandidates[0]?.kind).toBe("air_drop");
    expect(result.pickupCandidates.some((point) => point.kind === "shore")).toBe(false);
  });
});
