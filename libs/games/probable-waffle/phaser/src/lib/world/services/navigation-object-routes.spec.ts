import type Phaser from "phaser";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../data/actor-component";
import { getCenterTileCoordUnderObject, getTileCoordsUnderObject } from "../../library/tile-under-object";
import { isGameObjectActiveInActiveScene } from "../../data/game-object-helper";
import { getSceneService } from "./scene-component-helpers";
import { MovementOccupancyService } from "./movement-occupancy.service";
import { NavigationObjectRoutes } from "./navigation-object-routes";
import { NavigableComponent } from "../../entity/components/movement/navigable-component";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../library/tile-under-object", () => ({
  getCenterTileCoordUnderObject: jest.fn(),
  getTileCoordsUnderObject: jest.fn()
}));
jest.mock("../../data/game-object-helper", () => ({ isGameObjectActiveInActiveScene: jest.fn() }));
jest.mock("./scene-component-helpers", () => ({ getSceneService: jest.fn() }));

describe("navigation object route candidates", () => {
  beforeEach(() => jest.clearAllMocks());

  it("tries the next legal footprint endpoint when the closest has no native path", async () => {
    const actor = {} as Phaser.GameObjects.GameObject;
    const target = {} as Phaser.GameObjects.GameObject;
    const from = { x: 1, y: 1 };
    const primary = { x: 2, y: 1 };
    const alternate = { x: 1, y: 2 };
    const occupancy = {
      getDynamicBlockersForActor: jest.fn(() => []),
      getActorFootprintAtTile: jest.fn((_, tile: Vector2Simple) => [tile])
    };
    const findPath = jest.fn((_from: Vector2Simple, _to: Vector2Simple, _terrain: MovementTerrainType) =>
      Promise.resolve(null as Vector2Simple[] | null)
    );
    findPath.mockResolvedValueOnce(null).mockResolvedValueOnce([from, alternate]);
    jest.mocked(isGameObjectActiveInActiveScene).mockReturnValue(true);
    jest.mocked(getCenterTileCoordUnderObject).mockImplementation((_map, object) => (object === actor ? from : { x: 4, y: 4 }));
    jest.mocked(getTileCoordsUnderObject).mockReturnValue([{ x: 4, y: 4 }]);
    jest.mocked(getActorComponent).mockImplementation((_actor, component) =>
      component === IdComponent ? ({ id: "builder" } as never) : undefined
    );
    jest.mocked(getSceneService).mockReturnValue(occupancy as never);

    const routes = new NavigationObjectRoutes(
      {} as Phaser.Scene,
      {} as Phaser.Tilemaps.Tilemap,
      { closestNavigableTileBetweenGameObjectsInRadius: jest.fn(() => primary) },
      { getNavigableTilesAroundBlockedTilesInRadius: jest.fn(() => [primary, alternate]) } as never,
      { getNavigationCell: jest.fn(() => ({ navigableHeight: 0 })) } as never,
      () => MovementTerrainType.Ground,
      findPath,
      false
    );

    await expect(routes.findAndUseNavigablePathBetweenGameObjectsWithRadius(actor, target, 2)).resolves.toEqual([
      from,
      alternate
    ]);
    expect(findPath.mock.calls.map(([, to]) => to)).toEqual([primary, alternate]);
  });
});
