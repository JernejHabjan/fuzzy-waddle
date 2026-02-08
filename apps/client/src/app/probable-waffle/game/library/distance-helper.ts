import { getGameObjectCurrentTile } from "../data/game-object-helper";
import type { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../world/services/scene-component-helpers";
import { NavigationService } from "../world/services/navigation.service";
import { getActorComponent } from "../data/actor-component";
import { RepresentableComponent } from "../entity/components/representable-component";
import { TilemapComponent } from "../world/tilemap/tilemap.component";
import GameObject = Phaser.GameObjects.GameObject;

// Cache for navigation distances (key: "fromX,fromY->toX,toY,toZ", value: { distance, timestamp })
interface NavigationDistanceCache {
  distance: number;
  timestamp: number;
}
const navigationDistanceCache = new Map<string, NavigationDistanceCache>();
const navigationDistanceBetweenObjectsCache = new Map<string, NavigationDistanceCache>();
const CACHE_TTL_MS = 1000; // Cache entries for 1 second

export class DistanceHelper {
  /**
   * Gets the flying height of a game object in tile units.
   * Returns 0 if the object is not flying.
   */
  static getFlyingHeightInTiles(gameObject: GameObject): number {
    const representableComponent = getActorComponent(gameObject, RepresentableComponent);
    if (!representableComponent) return 0;
    const heightPixels = representableComponent.flyingHeightPixels;
    // Convert pixels to tile units (using tile width as the reference unit)
    return heightPixels / TilemapComponent.tileWidth;
  }

  /**
   * Calculates the effective horizontal range needed for a ground unit to attack a flying target.
   * Given an attack range and a flying target, returns the horizontal distance the attacker
   * should stop at so the 3D distance (including vertical) equals the attack range.
   *
   * Formula: horizontalRange = sqrt(attackRange² - flyingHeight²)
   *
   * @param attackRange The attack range in tiles
   * @param target The target game object
   * @returns The effective horizontal range in tiles, or 0 if the target is too high
   */
  static getEffectiveHorizontalRangeForFlyingTargetInTiles(attackRange: number, target: GameObject): number {
    const flyingHeight = DistanceHelper.getFlyingHeightInTiles(target);
    if (flyingHeight === 0) return attackRange;

    // If flying height exceeds attack range, we can't reach it - return minimum of 1 tile
    // to avoid pathfinding directly underneath
    if (flyingHeight >= attackRange) {
      return Math.max(1, Math.floor(attackRange * 0.5));
    }

    // Calculate horizontal distance: sqrt(range² - height²)
    const horizontalRange = Math.sqrt(attackRange * attackRange - flyingHeight * flyingHeight);
    // Ensure we don't go directly underneath (minimum 1 tile horizontal distance)
    return Math.max(1, Math.floor(horizontalRange));
  }
  static distance3D(a: Vector3Simple, b: Vector3Simple): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculates the 3D tile distance between two game objects, accounting for flying height.
   * This should be used when checking if a ground unit is within attack range of a flying target.
   */
  static getTileDistanceBetweenGameObjects(actor1: GameObject, actor2: GameObject): number | null {
    const actor1Tile = getGameObjectCurrentTile(actor1);
    if (!actor1Tile) return null;
    const actor2Tile = getGameObjectCurrentTile(actor2);
    if (!actor2Tile) return null;

    const horizontalDistance = Math.sqrt(
      Math.pow(actor1Tile.x - actor2Tile.x, 2) + Math.pow(actor1Tile.y - actor2Tile.y, 2)
    );

    // Get flying heights for both actors
    const actor1FlyingHeight = DistanceHelper.getFlyingHeightInTiles(actor1);
    const actor2FlyingHeight = DistanceHelper.getFlyingHeightInTiles(actor2);
    const verticalDistance = Math.abs(actor2FlyingHeight - actor1FlyingHeight);

    // Calculate 3D distance
    const distance3D = Math.sqrt(horizontalDistance * horizontalDistance + verticalDistance * verticalDistance);
    return Math.floor(distance3D);
  }

  static getTileDistanceBetweenGameObjectAndTile(actor: GameObject, tile: Vector3Simple): number | null {
    const actorTile = getGameObjectCurrentTile(actor);
    if (!actorTile) return null;

    // noinspection UnnecessaryLocalVariableJS
    const distance = Math.sqrt(Math.pow(actorTile.x - tile.x, 2) + Math.pow(actorTile.y - tile.y, 2));
    return Math.floor(distance);
  }

  static async getTileDistanceBetweenGameObjectsNavigation(
    actor1: GameObject,
    actor2: GameObject
  ): Promise<number | null> {
    if (!actor1.scene || !actor2.scene) {
      return null;
    }

    const actor1Tile = getGameObjectCurrentTile(actor1);
    const actor2Tile = getGameObjectCurrentTile(actor2);
    if (!actor1Tile || !actor2Tile) return null;

    // Create cache key (use sorted coordinates to make bidirectional)
    const cacheKey =
      actor1Tile.x <= actor2Tile.x
        ? `${actor1Tile.x},${actor1Tile.y}->${actor2Tile.x},${actor2Tile.y}`
        : `${actor2Tile.x},${actor2Tile.y}->${actor1Tile.x},${actor1Tile.y}`;
    const now = performance.now();

    // Check cache
    const cached = navigationDistanceBetweenObjectsCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      if (cached.distance === -1) {
        return null;
      } else {
        // console.log(`Cache hit for distance between ${actor1.name} and ${actor2.name}: ${cached.distance}`);
        return cached.distance;
      }
    }

    const navigationService = getSceneService(actor1.scene, NavigationService);
    if (!navigationService) return null;

    const path = await navigationService.findPathBetweenGameObjects(actor1, actor2);
    if (!path) {
      navigationDistanceBetweenObjectsCache.set(cacheKey, { distance: -1, timestamp: now });
      return null;
    }

    const distance = path.length;
    navigationDistanceBetweenObjectsCache.set(cacheKey, { distance, timestamp: now });

    // Periodically clean up old cache entries
    if (navigationDistanceBetweenObjectsCache.size > 1000) {
      DistanceHelper.cleanNavigationBetweenObjectsCache(now);
    }

    return distance;
  }

  static async getTileDistanceBetweenGameObjectAndTileNavigation(
    actor: GameObject,
    tile: Vector3Simple
  ): Promise<number | null> {
    if (!actor.scene) {
      // happens when actor is being destroyed
      return null;
    }

    const actorTile = getGameObjectCurrentTile(actor);
    if (!actorTile) return null;

    // Create cache key
    const cacheKey = `${actorTile.x},${actorTile.y}->${tile.x},${tile.y},${tile.z}`;
    const now = performance.now();

    // Check cache
    const cached = navigationDistanceCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      // console.log(
      //   `Cache hit for distance from ${actor.name} to tile (${tile.x},${tile.y},${tile.z}): ${cached.distance}`
      // );
      return cached.distance;
    }

    const navigationService = getSceneService(actor.scene, NavigationService);
    if (!navigationService) return null;

    const path = await navigationService.findPathFromGameObjectToTile(actor, tile);
    if (!path) {
      // Cache negative results too with a special marker
      navigationDistanceCache.set(cacheKey, { distance: -1, timestamp: now });
      return null;
    }

    const distance = path.length;

    // Update cache
    navigationDistanceCache.set(cacheKey, { distance, timestamp: now });

    // Periodically clean up old cache entries to prevent memory leaks
    if (navigationDistanceCache.size > 1000) {
      DistanceHelper.cleanNavigationCache(now);
    }

    return distance;
  }

  /**
   * Clean expired entries from the navigation distance cache
   */
  private static cleanNavigationCache(now: number = performance.now()): void {
    for (const [key, value] of navigationDistanceCache.entries()) {
      if (now - value.timestamp >= CACHE_TTL_MS) {
        navigationDistanceCache.delete(key);
      }
    }
  }

  /**
   * Clean expired entries from the GameObject-to-GameObject cache
   */
  private static cleanNavigationBetweenObjectsCache(now: number = performance.now()): void {
    for (const [key, value] of navigationDistanceBetweenObjectsCache.entries()) {
      if (now - value.timestamp >= CACHE_TTL_MS) {
        navigationDistanceBetweenObjectsCache.delete(key);
      }
    }
  }

  /**
   * Clear the entire navigation distance cache (useful when navigation grid changes)
   */
  static clearNavigationCache(): void {
    navigationDistanceCache.clear();
    navigationDistanceBetweenObjectsCache.clear();
  }

  /**
   * Batch calculate navigation distances from multiple actors to a single tile.
   * More efficient than calling getTileDistanceBetweenGameObjectAndTileNavigation in a loop
   * because it leverages caching and avoids redundant scene service lookups.
   *
   * @returns Array of distances in the same order as actors (null if distance cannot be calculated)
   */
  static async batchGetTileDistancesToTile(actors: GameObject[], tile: Vector3Simple): Promise<(number | null)[]> {
    if (actors.length === 0) return [];

    // Group by scene to minimize service lookups
    const actorsByScene = new Map<Phaser.Scene, GameObject[]>();
    const actorIndices = new Map<GameObject, number>();

    actors.forEach((actor, index) => {
      if (!actor.scene) return;
      actorIndices.set(actor, index);
      const sceneActors = actorsByScene.get(actor.scene) || [];
      sceneActors.push(actor);
      actorsByScene.set(actor.scene, sceneActors);
    });

    const results: (number | null)[] = new Array(actors.length).fill(null);

    for (const [scene, sceneActors] of actorsByScene) {
      const navigationService = getSceneService(scene, NavigationService);
      if (!navigationService) continue;

      const now = performance.now();

      for (const actor of sceneActors) {
        const actorTile = getGameObjectCurrentTile(actor);
        if (!actorTile) continue;

        const index = actorIndices.get(actor)!;
        const cacheKey = `${actorTile.x},${actorTile.y}->${tile.x},${tile.y},${tile.z}`;

        // Check cache first
        const cached = navigationDistanceCache.get(cacheKey);
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
          // console.log(
          //   `Cache hit for distance from ${actor.name} to tile (${tile.x},${tile.y},${tile.z}): ${cached.distance}`
          // );
          results[index] = cached.distance === -1 ? null : cached.distance;
          continue;
        }

        // Calculate path
        const path = await navigationService.findPathFromGameObjectToTile(actor, tile);

        if (!path) {
          navigationDistanceCache.set(cacheKey, { distance: -1, timestamp: now });
          results[index] = null;
        } else {
          const distance = path.length;
          navigationDistanceCache.set(cacheKey, { distance, timestamp: now });
          results[index] = distance;
        }
      }

      // Clean up cache if needed
      if (navigationDistanceCache.size > 1000) {
        DistanceHelper.cleanNavigationCache(now);
      }
    }

    return results;
  }

  /**
   * Batch calculate navigation distances between pairs of GameObjects.
   * More efficient than calling getTileDistanceBetweenGameObjectsNavigation in a loop.
   *
   * @param pairs Array of [actor1, actor2] pairs
   * @returns Array of distances in the same order as pairs (null if distance cannot be calculated)
   */
  static async batchGetDistancesBetweenGameObjects(pairs: [GameObject, GameObject][]): Promise<(number | null)[]> {
    if (pairs.length === 0) return [];

    // Group by scene to minimize service lookups
    const pairsByScene = new Map<Phaser.Scene, { pair: [GameObject, GameObject]; index: number }[]>();

    pairs.forEach((pair, index) => {
      const [actor1, actor2] = pair;
      if (!actor1.scene || !actor2.scene) return;
      // Use actor1's scene
      const scenePairs = pairsByScene.get(actor1.scene) || [];
      scenePairs.push({ pair, index });
      pairsByScene.set(actor1.scene, scenePairs);
    });

    const results: (number | null)[] = new Array(pairs.length).fill(null);

    for (const [scene, scenePairs] of pairsByScene) {
      const navigationService = getSceneService(scene, NavigationService);
      if (!navigationService) continue;

      const now = performance.now();

      for (const { pair, index } of scenePairs) {
        const [actor1, actor2] = pair;
        const actor1Tile = getGameObjectCurrentTile(actor1);
        const actor2Tile = getGameObjectCurrentTile(actor2);
        if (!actor1Tile || !actor2Tile) continue;

        // Create cache key (bidirectional)
        const cacheKey =
          actor1Tile.x <= actor2Tile.x
            ? `${actor1Tile.x},${actor1Tile.y}->${actor2Tile.x},${actor2Tile.y}`
            : `${actor2Tile.x},${actor2Tile.y}->${actor1Tile.x},${actor1Tile.y}`;

        // Check cache first
        const cached = navigationDistanceBetweenObjectsCache.get(cacheKey);
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
          // console.log(`Cache hit for distance between ${actor1.name} and ${actor2.name}: ${cached.distance}`);
          results[index] = cached.distance === -1 ? null : cached.distance;
          continue;
        }

        // Calculate path
        const path = await navigationService.findPathBetweenGameObjects(actor1, actor2);

        if (!path) {
          navigationDistanceBetweenObjectsCache.set(cacheKey, { distance: -1, timestamp: now });
          results[index] = null;
        } else {
          const distance = path.length;
          navigationDistanceBetweenObjectsCache.set(cacheKey, { distance, timestamp: now });
          results[index] = distance;
        }
      }

      // Clean up cache if needed
      if (navigationDistanceBetweenObjectsCache.size > 1000) {
        DistanceHelper.cleanNavigationBetweenObjectsCache(now);
      }
    }

    return results;
  }
}
