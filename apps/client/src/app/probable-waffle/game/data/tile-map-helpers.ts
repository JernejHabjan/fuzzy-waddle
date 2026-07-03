import { getActorComponent } from "./actor-component";
import { getGameObjectCurrentTile } from "./game-object-helper";
import { HealthComponent } from "../entity/components/combat/components/health-component";
import { getCenterTileCoordUnderObject } from "../library/tile-under-object";
import { getSceneComponent } from "../world/services/scene-component-helpers";
import { TilemapComponent } from "../world/tilemap/tilemap.component";

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
        tilemap.layers[0]!, // Use first layer as reference
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
  const directions = getNeighbourDirectionsByTypes(gameObject, neighbourTypes, tileWidth);
  return {
    topLeft: directions.topLeft,
    topRight: directions.topRight,
    bottomLeft: directions.bottomLeft,
    bottomRight: directions.bottomRight
  };
}

export function getIsometricNeighbourDirectionsByTypes(
  gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform,
  neighbourTypes: (new (scene: Phaser.Scene) => Phaser.GameObjects.GameObject)[],
  tileWidth: number
): {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
} {
  const tileHeight = tileWidth / 2;
  const allObjects = gameObject.scene.children.list.filter(
    (child) => child !== gameObject && isActiveLivingNeighbourOfType(child, neighbourTypes)
  ) as (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform)[];

  // Visual prefab art is authored in isometric world offsets. Tile-center
  // deltas can call a visually top-right neighbor "top", which breaks wall and
  // stair sprite selection even though navigation still needs tile deltas.
  const matchesWorldDirection = (dx: number, dy: number) =>
    allObjects.some(
      (child) => isSameWorldPosition(child.x, gameObject.x + dx) && isSameWorldPosition(child.y, gameObject.y + dy)
    );

  return {
    top: matchesWorldDirection(0, -tileHeight),
    bottom: matchesWorldDirection(0, tileHeight),
    left: matchesWorldDirection(-tileWidth, 0),
    right: matchesWorldDirection(tileWidth, 0),
    topLeft: matchesWorldDirection(-tileWidth / 2, -tileHeight / 2),
    topRight: matchesWorldDirection(tileWidth / 2, -tileHeight / 2),
    bottomLeft: matchesWorldDirection(-tileWidth / 2, tileHeight / 2),
    bottomRight: matchesWorldDirection(tileWidth / 2, tileHeight / 2)
  };
}

export function getNeighbourDirectionsByTypes(
  gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform,
  neighbourTypes: (new (scene: Phaser.Scene) => Phaser.GameObjects.GameObject)[],
  tileWidth: number
): {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
} {
  const allObjects = gameObject.scene.children.list.filter(
    (child) => child !== gameObject && isActiveLivingNeighbourOfType(child, neighbourTypes)
  ) as (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform)[];

  const tilemap = getSceneComponent(gameObject.scene, TilemapComponent)?.tilemap;
  const ownTile = tilemap ? getCenterTileCoordUnderObject(tilemap, gameObject) : undefined;
  if (tilemap && ownTile) {
    // Navigation uses logical tile adjacency, not art offsets. This is what
    // lets elevated surfaces connect through the height graph consistently.
    const matchesDirection = (dx: number, dy: number) =>
      allObjects.some((child) => {
        const tile = getCenterTileCoordUnderObject(tilemap, child);
        return !!tile && tile.x === ownTile.x + dx && tile.y === ownTile.y + dy;
      });

    return {
      top: matchesDirection(0, -1),
      bottom: matchesDirection(0, 1),
      left: matchesDirection(-1, 0),
      right: matchesDirection(1, 0),
      topLeft: matchesDirection(-1, -1),
      topRight: matchesDirection(1, -1),
      bottomLeft: matchesDirection(-1, 1),
      bottomRight: matchesDirection(1, 1)
    };
  }

  const tileHeight = tileWidth / 2;
  const matchesWorldDirection = (dx: number, dy: number) =>
    allObjects.some((child) => child.x === gameObject.x + dx && child.y === gameObject.y + dy);

  return {
    top: false,
    bottom: false,
    left: false,
    right: false,
    topLeft: matchesWorldDirection(-tileWidth / 2, -tileHeight / 2),
    topRight: matchesWorldDirection(tileWidth / 2, -tileHeight / 2),
    bottomLeft: matchesWorldDirection(-tileWidth / 2, tileHeight / 2),
    bottomRight: matchesWorldDirection(tileWidth / 2, tileHeight / 2)
  };
}

function isSameWorldPosition(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.001;
}

function isActiveLivingNeighbourOfType(
  child: Phaser.GameObjects.GameObject,
  neighbourTypes: (new (scene: Phaser.Scene) => Phaser.GameObjects.GameObject)[]
): boolean {
  if (!neighbourTypes.some((type) => child instanceof type && child.active)) return false;
  return getActorComponent(child, HealthComponent)?.killed !== true;
}
