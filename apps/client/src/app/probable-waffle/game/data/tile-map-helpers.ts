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
): Phaser.Tilemaps.Tile[] {
  const tilemapLayer = scene.children.getFirst("type", "TilemapLayer") as Phaser.Tilemaps.TilemapLayer | null;
  if (!tilemapLayer) return [];

  const tileXY = getGameObjectCurrentTile(gameObject);
  if (!tileXY) return [];

  const tiles: Phaser.Tilemaps.Tile[] = [];

  // Loop through the radius and gather tiles around the point

  if (shape === "square") {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const tile = tilemapLayer.getTileAt(tileXY.x + dx, tileXY.y + dy);
        if (tile) {
          tiles.push(tile);
        }
      }
    }
  } else if (shape === "circle") {
    // Loop through the radius and gather tiles around the point
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const distance = Math.sqrt(dx * dx + dy * dy); // Euclidean distance
        if (distance <= radius) {
          // Only select tiles within the circular area
          const tile = tilemapLayer.getTileAt(tileXY.x + dx, tileXY.y + dy);
          if (tile) {
            tiles.push(tile);
          }
        }
      }
    }
  } else {
    throw new Error("Invalid shape");
  }
  return tiles;
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
