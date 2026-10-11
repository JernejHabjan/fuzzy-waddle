import { NavigationProvenance } from "./navigation-provenance";
import { GroundNavigationPathfinder } from "./ground-navigation-pathfinder";
import { WaterNavigationHelper } from "./water-navigation.helper";
import { NavigationPathfinderDouble } from "./navigation-pathfinder-double";
import { TerrainGridBuilder } from "./terrain-grid-builder";
import type { NavigationNativeQuery } from "./navigation-native-query";

jest.mock("easystarjs", () => ({
  js: jest.requireActual<typeof import("./navigation-pathfinder-double")>("./navigation-pathfinder-double")
    .NavigationPathfinderDouble
}));

/** Explicit native callbacks, not a real topology, movement or useful arrival fixture. */
function fixture() {
  const provenance = new NavigationProvenance();
  const height = { configureStatic: jest.fn(), configureOverlay: jest.fn() };
  const ground = new GroundNavigationPathfinder(height, false, jest.fn(), provenance);
  const water = new WaterNavigationHelper(provenance);
  const queries: NavigationNativeQuery[] = [];
  const invoke = <T>(call: () => T) => provenance.observe(call, (query) => queries.push(query));
  const rebuild = () => {
    provenance.beginRebuild();
    ground.setup([[0]]);
    ground.clearCache();
    water.clearCache();
    provenance.completeRebuild();
  };
  jest.spyOn(TerrainGridBuilder, "buildWaterGrid").mockReturnValue([[0]]);
  water.setup([]);
  rebuild();
  const groundEngine = NavigationPathfinderDouble.instances[0],
    waterEngine = NavigationPathfinderDouble.instances[1];
  if (!groundEngine || !waterEngine) throw new Error("native_navigation_fixture_missing");
  return { provenance, ground, water, height, queries, invoke, rebuild, groundEngine, waterEngine };
}

describe("native navigation provenance", () => {
  beforeEach(() => {
    NavigationPathfinderDouble.instances = [];
    jest.spyOn(performance, "now").mockReturnValue(10);
  });
  afterEach(() => jest.restoreAllMocks());

  it("keeps update-entry, configurations, completed rebuild and actual clears distinct", () => {
    const f = fixture();
    expect(f.provenance.sample()).toEqual({
      completedRebuild: 1,
      rebuildInProgress: false,
      groundConfiguration: 1,
      waterConfiguration: 1,
      groundCacheClear: 1,
      waterCacheClear: 2
    });
    f.provenance.beginRebuild();
    const error = new Error("configuration");
    f.height.configureStatic.mockImplementationOnce(() => {
      throw error;
    });
    expect(() => f.ground.setup([[0]])).toThrow(error);
    f.provenance.failedRebuild();
    expect(f.provenance.sample()).toMatchObject({
      completedRebuild: 1,
      rebuildInProgress: true,
      groundConfiguration: 1
    });
    f.rebuild();
    expect(f.provenance.sample()).toMatchObject({ completedRebuild: 2, rebuildInProgress: false });
    f.ground.clearCache();
    expect(f.provenance.sample()).toMatchObject({ completedRebuild: 2, groundCacheClear: 3 });
  });

  it("keeps a reentrant outer rebuild pending after the inner native rebuild completes", () => {
    const f = fixture();
    f.provenance.beginRebuild();
    f.rebuild();
    expect(f.provenance.sample()).toMatchObject({ completedRebuild: 2, rebuildInProgress: true });
    f.ground.setup([[0]]);
    f.ground.clearCache();
    f.water.clearCache();
    f.provenance.completeRebuild();
    expect(f.provenance.sample()).toMatchObject({ completedRebuild: 3, rebuildInProgress: false });
  });

  it.each(["ground", "water"] as const)(
    "retains %s old request lineage when a pending callback refills a cleared cache",
    async (kind) => {
      const f = fixture(),
        tile = { x: 0, y: 0 },
        path = [tile];
      const owner = kind === "ground" ? f.ground : f.water,
        engine = kind === "ground" ? f.groundEngine : f.waterEngine;
      const pending = f.invoke(() => owner.findPath(tile, tile));
      const original = f.queries[0];
      expect(original).toMatchObject({ queryId: 1, cache: "miss", requestTimeMs: 10, completed: null });
      f.rebuild();
      engine.finish(0, path);
      expect(await pending).toBe(path);
      expect(original?.requested?.completedRebuild).toBe(1);
      expect(original?.completed?.completedRebuild).toBe(2);
      path.shift(); // Ground routes are isolated; the water owner still shares its cached array.
      jest.mocked(performance.now).mockReturnValue(999);
      const cached = await f.invoke(() => owner.findPath(tile, tile));
      if (kind === "ground") {
        expect(cached).toEqual([tile]);
        expect(cached).not.toBe(path);
      } else expect(cached).toBe(path);
      expect(f.queries[1]).toMatchObject({
        queryId: 2,
        cache: "hit",
        entry: { queryId: 1, requestTimeMs: 10, requested: { completedRebuild: 1 }, stored: { completedRebuild: 2 } }
      });
      jest.mocked(performance.now).mockReturnValue(1010);
      const expired = f.invoke(() => owner.findPath(tile, tile));
      expect(f.queries[2]).toMatchObject({ cache: "miss", entry: null });
      engine.finish(1, null);
      expect(await expired).toBeNull();
    }
  );

  it("records uncached overlays and shares query identity across native terrain owners", async () => {
    const f = fixture(),
      tile = { x: 0, y: 0 };
    const pending = f.invoke(() => f.ground.findPathWithGrid(tile, tile, [[0]], true));
    const engine = NavigationPathfinderDouble.instances[2];
    if (!engine) throw new Error("overlay_missing");
    expect(f.queries[0]).toMatchObject({
      queryId: 1,
      engine: "ground_overlay",
      cache: "bypass",
      requestTimeMs: null,
      entry: null
    });
    engine.finish(0, []);
    expect(await pending).toEqual([]);
    const water = f.invoke(() => f.water.findPath(tile, tile));
    expect(f.queries[1]).toMatchObject({ queryId: 2, engine: "water_static", cache: "miss" });
    f.waterEngine.finish(0, null);
    expect(await water).toBeNull();
  });

  it("preserves native Promise and error identity when an observer throws, and restores nested scopes", async () => {
    const f = fixture(),
      error = new Error("native");
    const promise = Promise.resolve([]);
    expect(
      f.provenance.observe(
        () => promise,
        () => {
          throw new Error("diagnostic");
        }
      )
    ).toBe(promise);
    const tile = { x: 0, y: 0 };
    f.groundEngine.findPath.mockImplementationOnce(() => {
      throw error;
    });
    const pending = f.provenance.observe(
      () => f.invoke(() => f.ground.findPath(tile, tile)),
      () => {
        throw error;
      }
    );
    await expect(pending).rejects.toBe(error);
    expect(f.queries).toHaveLength(1);
    expect(f.queries[0]?.completed).toBeNull();
    const next = f.ground.findPath(tile, tile);
    f.groundEngine.finish(1, []);
    await next;
    expect(f.queries).toHaveLength(1);
  });

  it("saturates query and milestone counters with terminal loss while native calls keep running", () => {
    const p = new NavigationProvenance(),
      tile = { x: 0, y: 0 };
    for (let index = 0; index < 8192; index++) p.query("ground_overlay", tile, tile, "bypass", null);
    expect(p.sample()).not.toBeNull();
    expect(p.query("ground_overlay", tile, tile, "bypass", null)).toBeNull();
    p.beginRebuild();
    p.completeRebuild();
    expect(p.sample()).toBeNull();
    const clears = new NavigationProvenance();
    for (let index = 0; index < 8193; index++) clears.cleared("water");
    expect(clears.sample()).toBeNull();
  });
});
