import type Phaser from "phaser";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { AiAccessGraphAdapter } from "./ai-access-graph.adapter";

jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneComponent: jest.fn(),
  getSceneService: jest.fn()
}));

function fixture(side: number) {
  const terrain = jest.fn(({ x, y }: { x: number; y: number }) => x >= 0 && y >= 0 && x < side && y < side);
  const heightSnapshot = jest.fn(() => undefined);
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: { width: side, height: side } } as never);
  jest.mocked(getSceneService).mockReturnValue({
    getHeightGraphDebugSnapshot: heightSnapshot,
    isTileGridWithoutBlockingObjectsNavigable: terrain,
    isTileNavigable: () => false,
    getNavigableHeightAtTile: () => 0
  } as never);
  return { adapter: new AiAccessGraphAdapter({} as Phaser.Scene), heightSnapshot };
}

describe("bounded access graph progress", () => {
  it("completes current supported-map topology even when observed blockers change on every decision", () => {
    const { adapter } = fixture(50);
    for (let revision = 1; revision <= 3; revision++) {
      const blocked = revision % 2 === 0;
      const graph = adapter.advanceGraph(revision * 20, 0, {
        revision,
        blockedTileKeys: new Set(blocked ? ["25,25"] : []),
        navigableTileKeys: new Set()
      });
      expect(graph).toMatchObject({ status: "ready", dynamicRevision: revision });
      expect(adapter.resolveNodeId({ x: 49, y: 49 }, ["ground"])).toBeDefined();
      if (!blocked) expect(adapter.resolveNodeId({ x: 25, y: 25 }, ["ground"])).toBeDefined();
      expect(graph?.nodes.reduce((total, node) => total + (node.domain === "ground" ? node.tileCount : 0), 0)).toBe(
        2500 - Number(blocked)
      );
    }
  });

  it("keeps oversized-map work bounded and completes a stable generation across observations", () => {
    const { adapter, heightSnapshot } = fixture(100);
    const topology = { revision: 1, blockedTileKeys: new Set<string>(), navigableTileKeys: new Set<string>() };
    expect(adapter.advanceGraph(20, 0, topology)).toBeUndefined();
    const firstWork = heightSnapshot.mock.calls.length;
    expect(firstWork).toBeGreaterThan(0);
    expect(firstWork).toBeLessThan(10000);
    let completed = false;
    for (let tick = 40; tick <= 420 && !completed; tick += 20) {
      const before = heightSnapshot.mock.calls.length;
      completed = adapter.advanceGraph(tick, 0, topology)?.status === "ready";
      expect(heightSnapshot.mock.calls.length - before).toBeLessThanOrEqual(firstWork);
    }
    expect(completed).toBe(true);
    expect(heightSnapshot.mock.calls.length).toBe(10000);
  });

  it("does not connect same-height diagonal tiles through two blocked orthogonal corners", () => {
    const side = 2;
    jest.mocked(getSceneComponent).mockReturnValue({ tilemap: { width: side, height: side } } as never);
    jest.mocked(getSceneService).mockReturnValue({
      getHeightGraphDebugSnapshot: () => ({
        cells: [
          [{ isNavigable: true, navigableHeight: 0 }, { isNavigable: false, navigableHeight: 0 }],
          [{ isNavigable: false, navigableHeight: 0 }, { isNavigable: true, navigableHeight: 0 }]
        ],
        edgesByTileKey: new Map()
      }),
      isTileGridWithoutBlockingObjectsNavigable: ({ x, y }: { x: number; y: number }) => x === y,
      isTileNavigable: () => false,
      getNavigableHeightAtTile: () => 0
    } as never);
    const adapter = new AiAccessGraphAdapter({} as Phaser.Scene);
    const graph = adapter.advanceGraph(20, 0, {
      revision: 1,
      blockedTileKeys: new Set(),
      navigableTileKeys: new Set(["0,0", "1,1"])
    });

    expect(graph?.nodes.filter((node) => node.domain === "ground")).toHaveLength(2);
    expect(adapter.resolveNodeId({ x: 0, y: 0 }, ["ground"])).not.toBe(
      adapter.resolveNodeId({ x: 1, y: 1 }, ["ground"])
    );
  });
});
