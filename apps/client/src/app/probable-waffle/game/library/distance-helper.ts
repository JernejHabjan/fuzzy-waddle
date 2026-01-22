import { getGameObjectCurrentTile } from "../data/game-object-helper";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../world/services/scene-component-helpers";
import { NavigationService } from "../world/services/navigation.service";
import GameObject = Phaser.GameObjects.GameObject;

export class DistanceHelper {
  static distance3D(a: Vector3Simple, b: Vector3Simple): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  static getTileDistanceBetweenGameObjects(actor1: GameObject, actor2: GameObject): number | null {
    const actor1Tile = getGameObjectCurrentTile(actor1);
    if (!actor1Tile) return null;
    const actor2Tile = getGameObjectCurrentTile(actor2);
    if (!actor2Tile) return null;

    // noinspection UnnecessaryLocalVariableJS
    const distance = Math.sqrt(Math.pow(actor1Tile.x - actor2Tile.x, 2) + Math.pow(actor1Tile.y - actor2Tile.y, 2));
    return Math.floor(distance);
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
    const navigationService = getSceneService(actor.scene, NavigationService);
    if (!navigationService) return null;

    const path = await navigationService.findPathFromGameObjectToTile(actor, tile);
    if (!path) return null;
    return path.length;
  }
}
