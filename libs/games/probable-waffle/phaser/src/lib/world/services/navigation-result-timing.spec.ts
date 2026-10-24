import { GroundNavigationPathfinder } from "./ground-navigation-pathfinder";
import { WaterNavigationHelper } from "./water-navigation.helper";
import { TerrainGridBuilder } from "./terrain-grid-builder";

describe("native path results do not depend on browser timer turns", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it.each(["ground", "overlay", "water"])("settles real EasyStar %s queries without a timer", async (kind) => {
    const grid = [
      [0, 0],
      [0, 0]
    ];
    const ground = new GroundNavigationPathfinder(
      { configureStatic: () => undefined, configureOverlay: () => undefined },
      false,
      () => undefined
    );
    ground.setup(grid);
    const water = new WaterNavigationHelper();
    jest.spyOn(TerrainGridBuilder, "buildWaterGrid").mockReturnValue(grid);
    water.setup([]);
    const from = { x: 0, y: 0 },
      to = { x: 1, y: 1 };
    const result =
      kind === "water"
        ? water.findPath(from, to)
        : kind === "overlay"
          ? ground.findPathWithGrid(from, to, grid, true)
          : ground.findPath(from, to);
    expect(jest.getTimerCount()).toBe(0);
    await expect(result).resolves.toEqual([from, to]);
    await expect(kind === "water" ? water.findPath(from, to) : ground.findPath(from, to)).resolves.toEqual([from, to]);
  });
});
