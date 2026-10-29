import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { selectConstructionPosition } from "./ai-construction-site-selector";

function fixture(positions: readonly (readonly [number, number])[]) {
  const builder = {
    ...createAiTestOwnedActor("builder"),
    logicalPosition: {
      status: "known" as const,
      value: { x: 0, y: 1, z: 0 },
      observedTick: 200
    }
  };
  const source = createAiProductionPolicyFixture().observation;
  const observation: AiObservationV1 = {
    ...source,
    actors: [builder],
    map: {
      ...source.map,
      bounds: { status: "known", value: { width: 12, height: 12 }, observedTick: 200 },
      staticRevision: 1,
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      constructionCells: positions.map(([x, y]) => ({
        tileKey: `${x},${y}`,
        position: { x, y, z: 0 },
        groundPassable: true,
        waterPassable: false,
        observedBlocked: false,
        elevation: 0
      }))
    }
  };
  return { observation, builder };
}

function rooms() {
  const positions: [number, number][] = [[3, 1]];
  for (const start of [0, 4])
    for (let y = 0; y < 3; y += 1) for (let x = start; x < start + 3; x += 1) positions.push([x, y]);
  return positions;
}

describe("observed construction access scenarios", () => {
  it("PLACE-03 preserves a single-tile work/army corridor and selects a useful alternative", () => {
    const { observation, builder } = fixture(rooms());
    const selected = selectConstructionPosition(
      observation,
      builder,
      1,
      0,
      new Set(),
      0,
      (cell) => cell.tileKey === "3,1" || cell.tileKey === "5,1"
    );
    expect(selected).toEqual({ x: 5, y: 1, z: 0 });
  });

  it("PLACE-03 rejects a disconnected footprint even when it is observed, empty and closest by Manhattan distance", () => {
    const { observation, builder } = fixture([
      [0, 1],
      [0, 0],
      [2, 1]
    ]);
    expect(
      selectConstructionPosition(observation, builder, 1, 0, new Set(), 0, (cell) => cell.tileKey === "2,1")
    ).toBeUndefined();
  });

  it("keeps a native-width transit route open when a large footprint would leave only a one-tile slit", () => {
    const positions: [number, number][] = [];
    for (let y = 0; y < 3; y += 1) for (let x = 0; x < 12; x += 1) positions.push([x, y]);
    const { observation, builder } = fixture(positions);
    builder.logicalPosition = { status: "known", value: { x: 1, y: 1, z: 0 }, observedTick: 200 };
    const selected = selectConstructionPosition(
      observation,
      builder,
      1,
      0,
      new Set(),
      1,
      (cell) => cell.tileKey === "6,1"
    );
    expect(selected).toBeUndefined();
  });

  it("preserves construction access around visible stationary buildings", () => {
    const positions: [number, number][] = [];
    for (let y = 0; y < 5; y += 1) for (let x = 0; x < 5; x += 1) positions.push([x, y]);
    const { observation, builder } = fixture(positions);
    const constructionCells = observation.map?.constructionCells?.map((cell) => ({
      ...cell,
      staticBlocked: cell.position.x === 2 && cell.position.y !== 2
    }));
    const selected = selectConstructionPosition(
      { ...observation, map: { ...observation.map!, constructionCells } },
      builder,
      1,
      0,
      new Set(),
      0,
      (cell) => cell.tileKey === "2,2"
    );
    expect(selected).toBeUndefined();
  });

  it("keeps an owned unit's active movement destination free even when the whole ground area stays connected", () => {
    const { observation, builder } = fixture(rooms());
    const mover = {
      ...createAiTestOwnedActor("mover"),
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Move, targetActorId: null, targetPosition: { x: 3, y: 1, z: 0 } },
        observedTick: 200
      }
    };
    const selected = selectConstructionPosition(
      { ...observation, actors: [builder, mover] },
      builder,
      1,
      0,
      new Set(),
      0,
      (cell) => cell.tileKey === "3,1" || cell.tileKey === "5,1"
    );
    expect(selected).toEqual({ x: 5, y: 1, z: 0 });
  });

  it("preserves one-tile maneuvering clearance around other owned workers", () => {
    const positions: [number, number][] = [];
    for (let y = 0; y < 9; y += 1) for (let x = 0; x < 9; x += 1) positions.push([x, y]);
    const { observation, builder } = fixture(positions);
    const worker = {
      ...createAiTestOwnedActor("service-worker"),
      logicalPosition: { status: "known" as const, value: { x: 4, y: 4, z: 0 }, observedTick: 200 },
      capabilities: [
        {
          id: "gather",
          family: "gather",
          level: 1,
          domains: ["ground" as const],
          targetDomains: ["ground" as const],
          capacity: { status: "known" as const, value: 1, observedTick: 200 }
        }
      ]
    };
    const selected = selectConstructionPosition(
      { ...observation, actors: [builder, worker] },
      builder,
      1,
      0,
      new Set(),
      0,
      (cell) => cell.tileKey === "4,3" || cell.tileKey === "7,7"
    );
    expect(selected).toEqual({ x: 7, y: 7, z: 0 });
  });

  it.each([OrderType.Gather, OrderType.ReturnResources])(
    "keeps an owned pending %s service target free",
    (orderType) => {
      const { observation, builder } = fixture(rooms());
      const worker = {
        ...createAiTestOwnedActor("worker"),
        pendingOrder: {
          status: "known" as const,
          value: { orderType, targetActorId: "service-target" },
          observedTick: 200
        }
      };
      const target = {
        ...createAiTestOwnedActor("service-target"),
        logicalPosition: { status: "known" as const, value: { x: 3, y: 1, z: 0 }, observedTick: 200 }
      };
      const selected = selectConstructionPosition(
        { ...observation, actors: [builder, worker, target] },
        builder,
        1,
        0,
        new Set(),
        0,
        (cell) => cell.tileKey === "3,1" || cell.tileKey === "5,1"
      );
      expect(selected).toEqual({ x: 5, y: 1, z: 0 });
    }
  );

  it("PLACE-03 checks each simultaneous footprint against the whole reserved prefix without overlap", () => {
    const positions: [number, number][] = [];
    for (let y = 0; y < 9; y += 1) for (let x = 0; x < 9; x += 1) positions.push([x, y]);
    const { observation, builder } = fixture(positions);
    const reserved = new Set<string>();
    const first = selectConstructionPosition(observation, builder, 1, 0, reserved, 1);
    const original = new Set(reserved);
    const second = selectConstructionPosition(observation, builder, 1, 1, reserved, 1);
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(second).not.toEqual(first);
    expect(original.size).toBe(9);
    expect(reserved.size).toBe(18);
  });

  it("retains current body occupancy for placement without falsely removing its travel corridor", () => {
    const { observation, builder } = fixture(rooms());
    const cells = observation.map?.constructionCells?.map((cell) => ({
      ...cell,
      observedBlocked: cell.tileKey === "3,1"
    }));
    const selected = selectConstructionPosition(
      { ...observation, map: { ...observation.map!, constructionCells: cells } },
      builder,
      1,
      0,
      new Set(),
      0,
      (cell) => cell.tileKey === "3,1" || cell.tileKey === "5,1"
    );
    expect(selected).toEqual({ x: 5, y: 1, z: 0 });
  });
});
