import type Phaser from "phaser";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import { getActorComponent } from "../../data/actor-component";
import { NavigationTileSelection } from "./navigation-tile-selection";

jest.mock("../../library/tile-under-object", () => ({ getTileCoordsUnderObject: jest.fn() }));
jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

function fixture() {
  let grid = [[0, 0], [0, 0]];
  const navigation = {
    isWithinGridBounds: jest.fn((tile: Vector2Simple) => tile.x >= 0 && tile.y >= 0 && tile.x < 2 && tile.y < 2),
    isTileNavigable: jest.fn((tile: Vector2Simple) => grid[tile.y]?.[tile.x] === 0)
  };
  const water = { getNavigableTilesInRadius: jest.fn(() => [{ x: 1, y: 1 }]) };
  const random = { between: jest.fn((_min: number, _max: number) => 0) };
  const index = { getAllIdActors: jest.fn(() => [] as Phaser.GameObjects.GameObject[]) };
  const query = jest.fn((_from: Vector2Simple, to: Vector2Simple, _terrain: MovementTerrainType) => Promise.resolve([to]));
  const selection = new NavigationTileSelection({} as Phaser.Tilemaps.Tilemap, navigation, () => grid,
    water, () => random, () => index, query);
  return { selection, navigation, water, random, index, query, replaceGrid: (value: number[][]) => { grid = value; } };
}

describe("native navigation candidate selection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retains one RNG sample per attempted candidate and removes the same failed candidate", async () => {
    const f = fixture(), from = { x: 1, y: 1 };
    // An empty successful native path still fails this radius selector's nonempty-path condition.
    f.query.mockResolvedValueOnce([]);
    expect(await f.selection.randomTileInNavigableRadius(from, 2)).toEqual({ x: 1, y: 0 });
    expect(f.query.mock.calls.map((call) => call[1])).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(f.random.between.mock.calls).toEqual([[0, 3], [0, 2]]);
    expect(f.index.getAllIdActors).not.toHaveBeenCalled();
  });

  it("uses the current replacement ground grid and native water candidates without new index scans", async () => {
    const f = fixture(), tile = { x: 1, y: 1 };
    f.replaceGrid([[1, 1], [1, 1]]);
    expect(f.selection.randomTileInRadius(tile, 1)).toBeUndefined();
    expect(f.random.between).not.toHaveBeenCalled();
    expect(await f.selection.randomTileInNavigableRadius(tile, 1, MovementTerrainType.Water)).toEqual(tile);
    expect(f.water.getNavigableTilesInRadius).toHaveBeenCalledWith(tile, 1);
    expect(f.query).toHaveBeenCalledWith(tile, tile, MovementTerrainType.Water);
    expect(f.index.getAllIdActors).not.toHaveBeenCalled();
  });

  it("chooses footprint candidates by distance then y/x and never adds a path query", () => {
    const f = fixture();
    expect(f.selection.getClosestNavigableTileAroundBlockedTilesInRadius(
      { x: 1, y: 1 }, [{ x: 0, y: 0 }], 1
    )).toEqual({ x: 1, y: 0 });
    expect(f.query).not.toHaveBeenCalled();
    expect(f.index.getAllIdActors).not.toHaveBeenCalled();
  });

  it("samples occupancy once, preserves bottom/right spawn preference, and retains the native exhaustion result", () => {
    const f = fixture(), actor = {} as Phaser.GameObjects.GameObject;
    jest.mocked(getTileCoordsUnderObject).mockReturnValue([{ x: 0, y: 0 }]);
    expect(f.selection.getSpawnPointAroundGameObject(actor, 0)).toEqual({ x: 1, y: 1 });
    expect(f.index.getAllIdActors).toHaveBeenCalledTimes(1);
    f.index.getAllIdActors.mockReturnValue([actor]);
    jest.mocked(getActorComponent).mockReturnValue({} as never);
    jest.mocked(getTileCoordsUnderObject).mockReturnValue([{ x: 0, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: 1 }, { x: 1, y: 1 }]);
    expect(f.selection.getSpawnPointAroundGameObject(actor, 1)).toBeUndefined();
    expect(f.index.getAllIdActors).toHaveBeenCalledTimes(2);
    expect(f.query).not.toHaveBeenCalled();
  });
});
