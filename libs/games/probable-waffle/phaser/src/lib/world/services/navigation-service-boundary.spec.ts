import type Phaser from "phaser";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { ActorTranslateComponent } from "../../entity/components/movement/actor-translate-component";
import { getActorComponent } from "../../data/actor-component";
import { onSceneInitialized } from "../../data/game-object-helper";
import { getCenterTileCoordUnderObject } from "../../library/tile-under-object";
import { DistanceHelper } from "../../library/distance-helper";
import { getSceneComponent, getSceneService } from "./scene-component-helpers";
import { GroundNavigationPathfinder } from "./ground-navigation-pathfinder";
import { NavigationHeightGraph } from "./navigation-height-graph";
import { NavigationObjectGrid } from "./navigation-object-grid";
import { NavigationObjectRoutes } from "./navigation-object-routes";
import { NavigationTileSelection } from "./navigation-tile-selection";
import { TerrainGridBuilder } from "./terrain-grid-builder";
import { WaterNavigationHelper } from "./water-navigation.helper";
import { NavigationService, TerrainType } from "./navigation.service";
import { TerrainType as NativeTerrainType } from "./navigation-terrain-type";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({ onSceneInitialized: jest.fn() }));
jest.mock("../../library/tile-under-object", () => ({ getCenterTileCoordUnderObject: jest.fn() }));
jest.mock("../../library/distance-helper", () => ({ DistanceHelper: { clearNavigationCache: jest.fn() } }));
jest.mock("./scene-component-helpers", () => ({ getSceneComponent: jest.fn(), getSceneService: jest.fn() }));

function fixture() {
  const events = { on: jest.fn(), once: jest.fn(), off: jest.fn() };
  const scene = { events } as unknown as Phaser.Scene;
  const service = new NavigationService(scene, {} as Phaser.Tilemaps.Tilemap);
  const actor = { scene } as Phaser.GameObjects.GameObject;
  return { service, scene, actor, events };
}

describe("navigation facade extraction boundaries", () => {
  afterEach(() => jest.restoreAllMocks());
  beforeEach(() => jest.clearAllMocks());

  it("keeps the public terrain enum identity and directly returns native owner Promises", async () => {
    const f = fixture(), path = Promise.resolve<Vector2Simple[] | null>([]), tile = Promise.resolve({ x: 1, y: 1 });
    jest.spyOn(NavigationObjectRoutes.prototype, "findAndUseNavigablePathBetweenGameObjectsWithRadius").mockReturnValue(path);
    jest.spyOn(NavigationTileSelection.prototype, "randomTileInNavigableRadius").mockReturnValue(tile);
    jest.spyOn(NavigationTileSelection.prototype, "getClosestUnoccupiedTile").mockReturnValue(tile);
    expect(TerrainType).toBe(NativeTerrainType);
    expect(f.service.findAndUseNavigablePathBetweenGameObjectsWithRadius(f.actor, f.actor, 2)).toBe(path);
    expect(f.service.randomTileInNavigableRadius({ x: 0, y: 0 }, 2)).toBe(tile);
    expect(f.service.getClosestUnoccupiedTile({ x: 0, y: 0 }, 2)).toBe(tile);
    await path;
  });

  it("keeps static actor routing and water dynamic-blocker fallback on the native terrain owner", async () => {
    const f = fixture(), tile = { x: 1, y: 1 }, path = Promise.resolve<Vector2Simple[] | null>([tile]);
    jest.mocked(getCenterTileCoordUnderObject).mockReturnValue(tile);
    let terrain = MovementTerrainType.Ground;
    jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === ActorTranslateComponent
      ? { actorTranslateDefinition: { movementTerrainType: terrain } } as never : undefined);
    const ground = jest.spyOn(GroundNavigationPathfinder.prototype, "findPath").mockReturnValue(path);
    const water = jest.spyOn(WaterNavigationHelper.prototype, "findPath").mockReturnValue(path);
    const overlay = jest.spyOn(GroundNavigationPathfinder.prototype, "findPathWithGrid").mockReturnValue(path);
    expect(f.service.findPathFromGameObjectToTile(f.actor, tile)).toBe(path);
    expect(ground).toHaveBeenCalledWith(tile, tile);
    terrain = MovementTerrainType.Water;
    expect(await f.service.findPathFromGameObjectToTileAvoidingDynamicBlockers(f.actor, tile, [])).toEqual([tile]);
    expect(water).toHaveBeenCalledWith(tile, tile);
    expect(overlay).not.toHaveBeenCalled();
    jest.mocked(getCenterTileCoordUnderObject).mockReturnValue(undefined);
    expect(await f.service.findPathFromGameObjectToTile(f.actor, tile)).toEqual([]);
    expect(await f.service.findPathFromGameObjectToTileAvoidingDynamicBlockers(f.actor, tile, [])).toEqual([]);
    expect(ground).toHaveBeenCalledTimes(1);
    expect(water).toHaveBeenCalledTimes(1);
  });

  it("preserves initialization/rebuild/cache-clear order and the existing shutdown listener ownership", () => {
    const f = fixture(), order: string[] = [];
    jest.mocked(getSceneService).mockReturnValue({} as never);
    jest.mocked(getSceneComponent).mockReturnValue({ data: [] } as never);
    jest.spyOn(TerrainGridBuilder, "buildGroundGrid").mockImplementation(() => { order.push("terrain"); return [[0]]; });
    jest.spyOn(WaterNavigationHelper.prototype, "setup").mockImplementation(() => { order.push("water_setup"); });
    jest.spyOn(NavigationObjectGrid.prototype, "build").mockImplementation(() => { order.push("objects"); return [[undefined]]; });
    jest.spyOn(NavigationHeightGraph.prototype, "build").mockImplementation(() => { order.push("height"); });
    jest.spyOn(GroundNavigationPathfinder.prototype, "setup").mockImplementation(() => { order.push("ground_setup"); });
    jest.mocked(DistanceHelper.clearNavigationCache).mockImplementation(() => {
      expect(f.service.getNativeNavigationBoundary()).toMatchObject({ completedRebuild: 0, rebuildInProgress: true });
      order.push("distance_clear");
    });
    jest.spyOn(GroundNavigationPathfinder.prototype, "clearCache").mockImplementation(() => { order.push("ground_clear"); });
    jest.spyOn(WaterNavigationHelper.prototype, "clearCache").mockImplementation(() => { order.push("water_clear"); });
    const init = jest.mocked(onSceneInitialized).mock.calls[0];
    if (!init) throw new Error("navigation_test_init_missing");
    init[1].call(f.service);
    expect(f.service.getNativeNavigationBoundary()).toMatchObject({ completedRebuild: 1, rebuildInProgress: false });
    expect(order).toEqual(["terrain", "water_setup", "objects", "height", "ground_setup",
      "distance_clear", "ground_clear", "water_clear"]);
    expect(f.events.on).toHaveBeenCalledWith(NavigationService.UpdateNavigationEvent, expect.any(Function), f.service);
    const shutdown = f.events.once.mock.calls[0];
    if (!shutdown) throw new Error("navigation_test_shutdown_missing");
    shutdown[1].call(f.service);
    expect(f.events.off).toHaveBeenCalledWith(NavigationService.UpdateNavigationEvent, expect.any(Function), f.service);
    expect(order.slice(8)).toEqual(["ground_clear"]);
  });
});
