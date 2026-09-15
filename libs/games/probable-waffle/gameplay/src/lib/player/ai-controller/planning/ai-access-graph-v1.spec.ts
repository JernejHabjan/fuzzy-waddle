import { buildAiAccessGraphV1, queryAiAccessRouteV1, type AiAccessCellV1 } from "./ai-access-graph-v1";

const cells: readonly AiAccessCellV1[] = [
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
    ground: true,
    water: false,
    elevation: 0,
    groundNeighborKeys: [],
    knowledge: "known_static",
    clearance: 2
  }
];

const build = (inputCells: readonly AiAccessCellV1[]) =>
  buildAiAccessGraphV1({
    generation: 7,
    staticRevision: 1,
    dynamicRevision: 4,
    threatRevision: 2,
    builtTick: 100,
    continuationCursor: 0,
    includeAirRegion: true,
    cells: inputCells
  });

describe("Stage 8 access graph", () => {
  it("produces identical stable regions and shore transfers for permuted map input", () => {
    expect(build(cells).graph).toEqual(build([...cells].reverse()).graph);
  });

  it("never reports disconnected ground islands as a direct ground route", () => {
    const built = build(cells);
    const fromNodeId = built.groundNodeByTileKey.get("0,0")!;
    const toNodeId = built.groundNodeByTileKey.get("2,0")!;
    const request = {
      queryId: "query:island",
      kind: "movement" as const,
      fromNodeId,
      toNodeId,
      capabilities: {
        moverDomains: ["ground" as const],
        targetDomains: [],
        waterTransportSeats: 2,
        airTransportSeats: 0,
        requiredPassengerSeats: 2,
        requiredClearance: 1
      },
      firingNodeIds: []
    };

    expect(queryAiAccessRouteV1(built.graph, request)).toEqual(
      expect.objectContaining({ kind: "water_transport", minimumSeats: 2 })
    );
    expect(
      queryAiAccessRouteV1(built.graph, {
        ...request,
        capabilities: { ...request.capabilities, waterTransportSeats: 0 }
      })
    ).toEqual(expect.objectContaining({ kind: "impossible", reason: "no_executable_transfer" }));
  });

  it("keeps unknown regions pending and service failures technical", () => {
    const built = build([{ ...cells[0]!, knowledge: "unknown" }, ...cells.slice(1)]);
    const fromNodeId = built.groundNodeByTileKey.get("0,0")!;
    const toNodeId = built.groundNodeByTileKey.get("2,0")!;
    const request = {
      queryId: "query:unknown",
      kind: "movement" as const,
      fromNodeId,
      toNodeId,
      capabilities: {
        moverDomains: ["ground" as const],
        targetDomains: [],
        waterTransportSeats: 2,
        airTransportSeats: 0,
        requiredPassengerSeats: 1,
        requiredClearance: 1
      },
      firingNodeIds: []
    };
    expect(queryAiAccessRouteV1(built.graph, request)).toEqual(
      expect.objectContaining({ kind: "pending", reason: "unknown_region" })
    );
    expect(queryAiAccessRouteV1({ ...built.graph, status: "service_failed" }, request)).toEqual(
      expect.objectContaining({ kind: "impossible", reason: "service_failed" })
    );
    expect(queryAiAccessRouteV1({ ...built.graph, status: "pending" }, request)).toEqual(
      expect.objectContaining({ kind: "pending", reason: "graph_pending" })
    );
  });

  it("rejects a connected region that cannot clear the requested footprint", () => {
    const built = build(cells);
    const nodeId = built.groundNodeByTileKey.get("0,0")!;
    expect(
      queryAiAccessRouteV1(built.graph, {
        queryId: "query:formation-clearance",
        kind: "movement",
        fromNodeId: nodeId,
        toNodeId: nodeId,
        capabilities: {
          moverDomains: ["ground"],
          targetDomains: [],
          waterTransportSeats: 0,
          airTransportSeats: 0,
          requiredPassengerSeats: 1,
          requiredClearance: 3
        },
        firingNodeIds: []
      })
    ).toEqual(expect.objectContaining({ kind: "impossible", reason: "insufficient_clearance" }));
  });

  it("rejects a wide formation at a narrow connected corridor but admits a single-tile mover", () => {
    const corridor = build([
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
        clearance: 1
      },
      {
        x: 2,
        y: 0,
        ground: true,
        water: false,
        elevation: 0,
        groundNeighborKeys: ["1,0"],
        knowledge: "known_static",
        clearance: 2
      }
    ]);
    const fromNodeId = corridor.groundNodeByTileKey.get("0,0")!;
    const toNodeId = corridor.groundNodeByTileKey.get("2,0")!;
    const request = {
      queryId: "query:narrow-corridor",
      kind: "movement" as const,
      fromNodeId,
      toNodeId,
      capabilities: {
        moverDomains: ["ground" as const],
        targetDomains: [],
        waterTransportSeats: 0,
        airTransportSeats: 0,
        requiredPassengerSeats: 1,
        requiredClearance: 2
      },
      firingNodeIds: []
    };
    expect(queryAiAccessRouteV1(corridor.graph, request)).toEqual(
      expect.objectContaining({ kind: "impossible", reason: "insufficient_clearance" })
    );
    expect(
      queryAiAccessRouteV1(corridor.graph, {
        ...request,
        capabilities: { ...request.capabilities, requiredClearance: 1 }
      })
    ).toEqual(
      expect.objectContaining({ kind: "direct", routeNodeIds: expect.arrayContaining([fromNodeId, toNodeId]) })
    );
  });

  it("returns a transport route when legal carrier production can satisfy missing capacity", () => {
    const built = build(cells);
    const fromNodeId = built.groundNodeByTileKey.get("0,0")!;
    const toNodeId = built.groundNodeByTileKey.get("2,0")!;
    expect(
      queryAiAccessRouteV1(built.graph, {
        queryId: "query:producible-boat",
        kind: "movement",
        fromNodeId,
        toNodeId,
        capabilities: {
          moverDomains: ["ground"],
          targetDomains: [],
          waterTransportSeats: 0,
          airTransportSeats: 0,
          canProduceWaterTransport: true,
          requiredPassengerSeats: 2,
          requiredClearance: 1
        },
        firingNodeIds: []
      })
    ).toEqual(expect.objectContaining({ kind: "water_transport", minimumSeats: 2 }));
  });
});
