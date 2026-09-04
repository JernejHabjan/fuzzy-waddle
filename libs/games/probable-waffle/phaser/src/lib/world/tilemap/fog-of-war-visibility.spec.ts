import { isAnyActorBaseTileVisible } from "./fog-of-war-visibility";

const toTileKey = (x: number, y: number) => y * 1000 + x;

describe("fog-of-war actor base visibility", () => {
  it("keeps a tall actor hidden when only a rendered-center tile is visible", () => {
    const logicalBaseTiles = [{ x: 8, y: 12 }];
    const visibleTiles = new Set([toTileKey(8, 9)]);

    expect(isAnyActorBaseTileVisible(logicalBaseTiles, visibleTiles, toTileKey)).toBe(false);
  });

  it("reveals a wide actor when any edge tile of its logical base is visible", () => {
    const logicalBaseTiles = [
      { x: 9, y: 12 },
      { x: 10, y: 12 },
      { x: 11, y: 12 }
    ];
    const visibleTiles = new Set([toTileKey(9, 12)]);

    expect(isAnyActorBaseTileVisible(logicalBaseTiles, visibleTiles, toTileKey)).toBe(true);
    visibleTiles.clear();
    expect(isAnyActorBaseTileVisible(logicalBaseTiles, visibleTiles, toTileKey)).toBe(false);
  });
});
