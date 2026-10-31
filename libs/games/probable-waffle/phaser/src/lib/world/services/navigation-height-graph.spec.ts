import type Phaser from "phaser";
import { BOTTOM, RIGHT, js as EasyStar } from "easystarjs";
import { NavigablePathDirection } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/navigable-path-direction";
import { HeightNavigationGraphBuilder, type HeightNavigationGraph } from "./height-navigation-graph-builder";
import { NavigationHeightGraph } from "./navigation-height-graph";

/** Synthetic directed graph exercises mirroring/traversal; actual map construction remains separate evidence. */
function fixture() {
  const start = { x: 0, y: 0 }, right = { x: 1, y: 0 }, down = { x: 0, y: 1 };
  const graph = {
    cells: [
      [{ ...start, isNavigable: true, navigableHeight: 64, ports: {} },
        { ...right, isNavigable: true, navigableHeight: 64, ports: {} }],
      [{ ...down, isNavigable: true, navigableHeight: 0, ports: {} }]
    ],
    edgesByTileKey: new Map([
      ["0,0", [
        { from: start, to: right, direction: NavigablePathDirection.Right, enterHeight: 64, exitHeight: 64 },
        { from: start, to: down, direction: NavigablePathDirection.Bottom, enterHeight: 0, exitHeight: 0 }
      ]]
    ])
  } satisfies HeightNavigationGraph;
  const build = jest.spyOn(HeightNavigationGraphBuilder.prototype, "build").mockReturnValue(graph);
  const height = new NavigationHeightGraph({} as Phaser.Scene, {} as Phaser.Tilemaps.Tilemap, false);
  const grid = [[0, 0], [0]];
  return { start, right, down, graph, build, height, grid };
}

describe("native directed graph ownership", () => {
  afterEach(() => jest.restoreAllMocks());

  it("retains the exact built reference and preserves directed traversal and deterministic limits", () => {
    const f = fixture();
    expect(f.height.getHeightGraphDebugSnapshot()).toBeUndefined();
    f.height.build(f.grid);
    expect(f.build).toHaveBeenCalledWith(f.grid);
    expect(f.height.getHeightGraphDebugSnapshot()).toBe(f.graph);
    expect(f.height.canTraverseBetween(f.start, f.right)).toBe(true);
    expect(f.height.canTraverseBetween(f.right, f.start)).toBe(false);
    expect(f.height.getConnectedNavigableTiles(f.start)).toEqual([f.start, f.down, f.right]);
    expect(f.height.getConnectedNavigableTiles(f.start, { sameHeightOnly: true })).toEqual([f.start, f.right]);
    expect(f.height.getConnectedNavigableTiles(f.start, { maxTiles: 2 })).toEqual([f.start, f.down]);
    expect(f.height.getNavigableHeightAtTile(f.start)).toBe(64);
  });

  it("mirrors native static direction order and removes blocked destinations only in an overlay", () => {
    const f = fixture();
    f.height.build(f.grid);
    const engine = new EasyStar(), directions = jest.spyOn(engine, "setDirectionalCondition").mockImplementation(() => {});
    f.height.configureStatic(engine);
    expect(directions).toHaveBeenNthCalledWith(1, 0, 0, [BOTTOM, RIGHT]);
    directions.mockClear();
    const overlay = [[0, 1], [0]];
    f.height.configureOverlay(engine, overlay);
    expect(directions).toHaveBeenCalledWith(0, 0, [BOTTOM]);
    expect(directions).not.toHaveBeenCalledWith(1, 0, expect.anything());
    expect(f.graph.edgesByTileKey.get("0,0")).toHaveLength(2);
    expect(f.grid).toEqual([[0, 0], [0]]);
    expect(f.height.directionalConditions.size).toBe(0);
  });
});
