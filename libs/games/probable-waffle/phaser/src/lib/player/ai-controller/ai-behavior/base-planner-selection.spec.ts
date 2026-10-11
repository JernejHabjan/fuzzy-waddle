import { compareScoredBuildSpots, filterReachableBuildSpots } from "./base-planner-selection";

describe("base planner candidate selection", () => {
  it("waits for path queries and removes unreachable candidates", async () => {
    const origin = { x: 0, y: 0 };
    const reachable = { x: 2, y: 3 };
    const blocked = { x: 4, y: 5 };
    const emptyPath = { x: 6, y: 7 };
    const findPath = jest.fn(async (_from: typeof origin, to: typeof origin) => {
      if (to === reachable) return [origin, reachable];
      if (to === emptyPath) return [];
      return null;
    });

    await expect(filterReachableBuildSpots([blocked, reachable, emptyPath], origin, findPath)).resolves.toEqual([
      reachable
    ]);
    expect(findPath).toHaveBeenCalledTimes(3);
  });

  it("uses coordinates to resolve equal scores independently of input order", () => {
    const candidates = [
      { tile: { x: 4, y: 2 }, score: 10 },
      { tile: { x: 1, y: 5 }, score: 10 },
      { tile: { x: 1, y: 3 }, score: 10 },
      { tile: { x: 9, y: 9 }, score: 11 }
    ];

    const expected = [
      { x: 9, y: 9 },
      { x: 1, y: 3 },
      { x: 1, y: 5 },
      { x: 4, y: 2 }
    ];
    expect([...candidates].sort(compareScoredBuildSpots).map(({ tile }) => tile)).toEqual(expected);
    expect(
      [...candidates]
        .reverse()
        .sort(compareScoredBuildSpots)
        .map(({ tile }) => tile)
    ).toEqual(expected);
  });
});
