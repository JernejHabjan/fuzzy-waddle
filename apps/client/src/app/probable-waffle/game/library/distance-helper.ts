import { getGameObjectCurrentTile } from "../data/game-object-helper";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../world/services/scene-component-helpers";
import { NavigationService } from "../world/services/navigation.service";
import { getActorComponent } from "../data/actor-component";
import { RepresentableComponent } from "../entity/components/representable-component";
import { TilemapComponent } from "../world/tilemap/tilemap.component";
import GameObject = Phaser.GameObjects.GameObject;

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

  static getTileDistanceBetweenPositions(pos1: Vector2Simple | Vector3Simple, pos2: Vector2Simple | Vector3Simple): number {
    const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
    return Math.floor(distance);
  }

  static async getTileDistanceBetweenGameObjectsNavigation(
    actor1: GameObject,
    actor2: GameObject
  ): Promise<number | null> {
    const navigationService = getSceneService(actor1.scene, NavigationService);
    if (!navigationService) return null;

    const path = await navigationService.findPathBetweenGameObjects(actor1, actor2);
    if (!path) return null;
    return path.length;
  }

  static async getTileDistanceBetweenGameObjectAndTileNavigation(
    actor: GameObject,
    tile: Vector3Simple
  ): Promise<number | null> {
    if (!actor.scene) {
      // happens when actor is being destroyed
      return null;
    }
    const navigationService = getSceneService(actor.scene, NavigationService);
    if (!navigationService) return null;

    const path = await navigationService.findPathFromGameObjectToTile(actor, tile);
    if (!path) return null;
    return path.length;
  }
}
