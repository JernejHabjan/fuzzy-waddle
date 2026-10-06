import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { NavigationHeightGraph } from "./navigation-height-graph";
import { GroundNavigationPathfinder } from "./ground-navigation-pathfinder";
import { NavigationPathfinderDouble } from "./navigation-pathfinder-double";

jest.mock("easystarjs", () => ({
  js: jest.requireActual<typeof import("./navigation-pathfinder-double")>(
    "./navigation-pathfinder-double"
  ).NavigationPathfinderDouble
}));

/** Native cache/callback characterization only; this double does not prove world reachability. */
function fixture() {
  const height = { configureStatic: jest.fn(), configureOverlay: jest.fn() } satisfies
    Pick<NavigationHeightGraph, "configureStatic" | "configureOverlay">;
  const draw = jest.fn();
  const paths = new GroundNavigationPathfinder(height, true, draw);
  const engine = NavigationPathfinderDouble.instances[0];
  if (!engine) throw new Error("navigation_test_engine_missing");
  return { paths, engine, height, draw };
}

describe("native ground path cache and overlays", () => {
  beforeEach(() => {
    NavigationPathfinderDouble.instances = [];
    jest.spyOn(performance, "now").mockReturnValue(0);
  });
  afterEach(() => jest.restoreAllMocks());

  it("retains the original mutable path until the exact one-second request-time expiry", async () => {
    const f = fixture();
    const from = { x: 1, y: 1 }, to = { x: 2, y: 2 };
    const path = [from, to];
    const first = f.paths.findPath(from, to);
    expect(f.engine.findPath).toHaveBeenCalledTimes(1);
    expect(f.engine.calculate).toHaveBeenCalledTimes(1);
    f.engine.finish(0, path);
    expect(await first).toBe(path);
    expect(f.draw).toHaveBeenCalledWith(path);
    path.shift();
    jest.mocked(performance.now).mockReturnValue(999);
    expect(await f.paths.findPath(from, to)).toBe(path);
    expect(f.engine.findPath).toHaveBeenCalledTimes(1);
    jest.mocked(performance.now).mockReturnValue(1000);
    const expired = f.paths.findPath(from, to);
    f.engine.finish(1, null);
    expect(await expired).toBeNull();
    expect(f.engine.findPath).toHaveBeenCalledTimes(2);
  });

  it.each([{ path: null }, { path: [] }] satisfies { path: Vector2Simple[] | null }[])(
    "caches null and empty results: %p", async ({ path }) => {
      const f = fixture(), tile = { x: 1, y: 1 };
      const pending = f.paths.findPath(tile, tile);
      f.engine.finish(0, path);
      const result = await pending;
      expect(result).toEqual(path);
      // Native EasyStar empty arrays become a fresh result array, then that result is cached by reference.
      if (path) expect(result).not.toBe(path);
      expect(await f.paths.findPath(tile, tile)).toBe(result);
      expect(f.engine.findPath).toHaveBeenCalledTimes(1);
    }
  );

  it("keeps native request-time TTL when a callback arrives much later", async () => {
    const f = fixture(), tile = { x: 1, y: 1 };
    const pending = f.paths.findPath(tile, tile);
    jest.mocked(performance.now).mockReturnValue(1500);
    f.engine.finish(0, []);
    await pending;
    const next = f.paths.findPath(tile, tile);
    expect(f.engine.findPath).toHaveBeenCalledTimes(2);
    f.engine.finish(1, []);
    await next;
  });

  it("preserves the existing ability of an older callback to refill a cleared cache", async () => {
    const f = fixture(), tile = { x: 1, y: 1 };
    const pending = f.paths.findPath(tile, tile), path = [tile];
    f.paths.clearCache();
    f.engine.finish(0, path);
    expect(await pending).toBe(path);
    expect(await f.paths.findPath(tile, tile)).toBe(path);
    expect(f.engine.findPath).toHaveBeenCalledTimes(1);
  });

  it("configures static directions and uses a separate uncached overlay instance", async () => {
    const f = fixture(), grid = [[0, 0]], overlay = [[0, 1]], tile = { x: 0, y: 0 };
    f.paths.setup(grid);
    expect(f.engine.setGrid).toHaveBeenCalledWith(grid);
    expect(f.height.configureStatic).toHaveBeenCalledWith(f.engine);
    const pending = f.paths.findPathWithGrid(tile, tile, overlay, true);
    const queryEngine = NavigationPathfinderDouble.instances[1];
    if (!queryEngine) throw new Error("navigation_test_overlay_engine_missing");
    expect(queryEngine.setGrid).toHaveBeenCalledWith(overlay);
    expect(f.height.configureOverlay).toHaveBeenCalledWith(queryEngine, overlay);
    queryEngine.finish(0, []);
    await pending;
    expect(grid).toEqual([[0, 0]]);
    const staticQuery = f.paths.findPath(tile, tile);
    expect(f.engine.findPath).toHaveBeenCalledTimes(1);
    f.engine.finish(0, null);
    await staticQuery;
  });

  it("rejects native findPath/calculate errors without retry or a cached replacement", async () => {
    const f = fixture(), tile = { x: 0, y: 0 }, error = new Error("native_query");
    f.engine.findPath.mockImplementationOnce(() => { throw error; });
    await expect(f.paths.findPath(tile, tile)).rejects.toBe(error);
    expect(f.engine.calculate).not.toHaveBeenCalled();
    f.engine.calculate.mockImplementationOnce(() => { throw error; });
    await expect(f.paths.findPath(tile, tile)).rejects.toBe(error);
    expect(f.engine.findPath).toHaveBeenCalledTimes(2);
    expect(f.engine.calculate).toHaveBeenCalledTimes(1);
  });
});
