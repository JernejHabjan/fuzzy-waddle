import { NavigablePathDirection } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/navigable-path-direction";
import { buildHeightNavigationEdges, HEIGHT_NAVIGATION_DIRECTIONS, type HeightNavigationCell } from
  "../../../world/services/height-navigation-graph-builder";
import { findAiRuntimeClearancePath } from "./find-ai-runtime-clearance-path";

function graph(width: number, height: number, blocked: readonly string[] = []) {
  const cells: HeightNavigationCell[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({ x, y, navigableHeight: 0, isNavigable: !blocked.includes(`${x},${y}`),
      ports: Object.fromEntries(HEIGHT_NAVIGATION_DIRECTIONS.map(({ direction }) => [direction, { enterHeight: 0, exitHeight: 0 }]))
    }))
  );
  return { cells, edgesByTileKey: buildHeightNavigationEdges(cells) };
}

describe("native placement-prefix static clearance", () => {
  it("keeps the actual directed path and refuses the next sealing prefix even if a later layout reopens", () => {
    const from = { x: 0, y: 1 }, to = { x: 4, y: 1 };
    const first = graph(5, 3, ["2,0"]), sealed = graph(5, 3, ["2,0", "2,1", "2,2"]);
    expect(findAiRuntimeClearancePath(first, from, to, 0).status).toBe("path");
    expect(findAiRuntimeClearancePath(sealed, from, to, 0).status).toBe("blocked");
    expect(findAiRuntimeClearancePath(first, from, to, 0).status).toBe("path");
  });

  it("distinguishes a one-tile passage from a wider reserved envelope and rejects diagonal squeezing", () => {
    const narrow = graph(7, 5, ["3,0", "3,1", "3,3", "3,4"]);
    expect(findAiRuntimeClearancePath(narrow, { x: 1, y: 2 }, { x: 5, y: 2 }, 0).status).toBe("path");
    expect(findAiRuntimeClearancePath(narrow, { x: 1, y: 2 }, { x: 5, y: 2 }, 1).status).toBe("blocked");
    expect(findAiRuntimeClearancePath(graph(2, 2, ["1,0", "0,1"]), { x: 0, y: 0 }, { x: 1, y: 1 }, 0).status)
      .toBe("blocked");
  });

  it("uses native exact-height ports and direction, including ground-to-stair-to-wall access", () => {
    const topology = graph(3, 1);
    const stair = topology.cells[0]?.[1], wall = topology.cells[0]?.[2];
    if (!stair || !wall) throw new Error("authored geometry missing");
    stair.navigableHeight = 24;
    stair.ports = {
      [NavigablePathDirection.Left]: { enterHeight: 0, exitHeight: 0 },
      [NavigablePathDirection.Right]: { enterHeight: 64, exitHeight: 64 }
    };
    wall.navigableHeight = 42;
    wall.ports = { [NavigablePathDirection.Left]: { enterHeight: 64, exitHeight: 64 } };
    topology.edgesByTileKey = buildHeightNavigationEdges(topology.cells);
    expect(findAiRuntimeClearancePath(topology, { x: 0, y: 0 }, { x: 2, y: 0 }, 0).status).toBe("path");
    stair.ports[NavigablePathDirection.Right] = { enterHeight: 64, exitHeight: 63 };
    topology.edgesByTileKey = buildHeightNavigationEdges(topology.cells);
    expect(findAiRuntimeClearancePath(topology, { x: 0, y: 0 }, { x: 2, y: 0 }, 0).status).toBe("blocked");
  });

  it("fails closed for invalid envelopes, coincident endpoints and bounded path loss", () => {
    expect(findAiRuntimeClearancePath(graph(3, 1), { x: 0, y: 0 }, { x: 2, y: 0 }, -1).status).toBe("unavailable");
    expect(findAiRuntimeClearancePath(graph(3, 1), { x: 1, y: 0 }, { x: 1, y: 0 }, 0).status).toBe("unavailable");
    expect(findAiRuntimeClearancePath(graph(514, 1), { x: 0, y: 0 }, { x: 513, y: 0 }, 0).gaps)
      .toEqual(["placement_route_path_overflow"]);
  });
});
