import { getGameObjectCurrentTile } from "./game-object-helper";

/**
 * using own implementation - https://github.com/phaserjs/phaser/issues/6671
 * const tiles = tilemapLayer.getTilesWithinShape(new Phaser.Geom.Circle(transform.x, transform.y, radius));
 */
export function getTilesAroundGameObjectsOfShape(
  gameObject: Phaser.GameObjects.GameObject,
  scene: Phaser.Scene,
  radius: number,
  shape: "circle" | "square"
): {
  tiles: Phaser.Tilemaps.Tile[];
  tilesWithOutBounds: Phaser.Tilemaps.Tile[];
} {
  const tilemapLayer = scene.children.getFirst("type", "TilemapLayer") as Phaser.Tilemaps.TilemapLayer | null;
  if (!tilemapLayer) return { tiles: [], tilesWithOutBounds: [] };

  const tileXY = getGameObjectCurrentTile(gameObject);
  if (!tileXY) return { tiles: [], tilesWithOutBounds: [] };

  const tiles: Phaser.Tilemaps.Tile[] = [];
  const tilemap = tilemapLayer.tilemap;
  const virtualTiles: { x: number; y: number }[] = [];

  // Loop through the radius and gather tiles
  if (shape === "square") {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = tileXY.x + dx;
        const y = tileXY.y + dy;

        // Get real tile if within bounds
        const tile = tilemapLayer.getTileAt(x, y);
        if (tile) {
          tiles.push(tile);
        }
        // Track virtual tiles outside bounds
        else if (x < 0 || y < 0 || x >= tilemap.width || y >= tilemap.height) {
          virtualTiles.push({ x, y });
        }
      }
    }
  } else if (shape === "circle") {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const distance = Math.sqrt(dx * dx + dy * dy); // Euclidean distance
        if (distance <= radius) {
          const x = tileXY.x + dx;
          const y = tileXY.y + dy;

          // Get real tile if within bounds
          const tile = tilemapLayer.getTileAt(x, y);
          if (tile) {
            tiles.push(tile);
          }
          // Track virtual tiles outside bounds
          else if (x < 0 || y < 0 || x >= tilemap.width || y >= tilemap.height) {
            virtualTiles.push({ x, y });
          }
        }
      }
    }
  } else {
    throw new Error("Invalid shape");
  }

  // Create synthetic tile objects for virtual tiles
  const virtualTileObjects = createVirtualTiles(virtualTiles, tilemap);

  return {
    tiles: tiles,
    tilesWithOutBounds: [...tiles, ...virtualTileObjects]
  };
}

/**
 * Creates virtual tile objects for positions outside the tilemap boundaries
 */
function createVirtualTiles(
  virtualPositions: { x: number; y: number }[],
  tilemap: Phaser.Tilemaps.Tilemap
): Phaser.Tilemaps.Tile[] {
  const virtualTiles: Phaser.Tilemaps.Tile[] = [];

  for (const pos of virtualPositions) {
    // Create a synthetic tile object with required properties
    const worldXY = tilemap.tileToWorldXY(pos.x, pos.y);

    if (worldXY) {
      // Create a virtual tile that mimics the structure of a real tile
      const virtualTile = new Phaser.Tilemaps.Tile(
        tilemap.layers[0], // Use first layer as reference
        -1, // No real tile index
        pos.x,
        pos.y,
        tilemap.tileWidth,
        tilemap.tileHeight,
        tilemap.tileWidth,
        tilemap.tileHeight
      );

      // Set worldX and worldY properties
      virtualTile.pixelX = worldXY.x;
      virtualTile.pixelY = worldXY.y;

      virtualTiles.push(virtualTile);
    }
  }

  return virtualTiles;
}

export function getNeighboursByTypes(
  gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform,
  neighbourTypes: (new (scene: Phaser.Scene) => Phaser.GameObjects.GameObject)[],
  tileWidth: number
): {
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
} {
  const tileHeight = tileWidth / 2;

  const allObjects = gameObject.scene.children.list.filter(
    (child) => child !== gameObject && neighbourTypes.some((type) => child instanceof type && child.active)
  ) as (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform)[];

  const topLeftObject = allObjects.find(
    (wall) => wall.x === gameObject.x - tileWidth / 2 && wall.y === gameObject.y - tileHeight / 2
  );
  const topRightObject = allObjects.find(
    (wall) => wall.x === gameObject.x + tileWidth / 2 && wall.y === gameObject.y - tileHeight / 2
  );
  const bottomLeftObject = allObjects.find(
    (wall) => wall.x === gameObject.x - tileWidth / 2 && wall.y === gameObject.y + tileHeight / 2
  );
  const bottomRightObject = allObjects.find(
    (wall) => wall.x === gameObject.x + tileWidth / 2 && wall.y === gameObject.y + tileHeight / 2
  );

  return {
    topLeft: !!topLeftObject,
    topRight: !!topRightObject,
    bottomLeft: !!bottomLeftObject,
    bottomRight: !!bottomRightObject
  };
}
