import { Actor } from "../entity/actor/actor";
import { TransformComponent } from "../entity/actor/components/transformable-component";
import { getActorComponent } from "../data/actor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";
import { getGameObjectCurrentTile } from "../data/game-object-helper";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

export class GameplayLibrary {
  static getMissingRequirementsFor(ownedActor: GameObject, desiredProduct: string): Actor | false {
    const ownerComponent = getActorComponent(ownedActor, OwnerComponent);

    if (!ownerComponent) {
      return false;
    }
    // check if any requirements
    // todo const requirementsComponent = desiredProduct.components.findComponentOrNull(RequirementsComponent);

    return false;
  }

  /**
   * @deprecated
   * @param actor1
   * @param actor2
   * @returns {number | null}
   */
  static getDistanceBetweenActors_OLD(actor1: Actor, actor2: Actor): number | null {
    const transformComponentActor1 = actor1.components.findComponentOrNull(TransformComponent);
    const transformComponentActor2 = actor2.components.findComponentOrNull(TransformComponent);
    if (!transformComponentActor1 || !transformComponentActor2) {
      return null;
    }

    const actor1tXYZ = {
      x: transformComponentActor1.tilePlacementData.tileXY.x,
      y: transformComponentActor1.tilePlacementData.tileXY.y,
      z: transformComponentActor1.tilePlacementData.z
    };
    const Actor2XYZ = {
      x: transformComponentActor2.tilePlacementData.tileXY.x,
      y: transformComponentActor2.tilePlacementData.tileXY.y,
      z: transformComponentActor2.tilePlacementData.z
    };

    const distance = Math.sqrt(
      Math.pow(actor1tXYZ.x - Actor2XYZ.x, 2) +
        Math.pow(actor1tXYZ.y - Actor2XYZ.y, 2) +
        Math.pow(actor1tXYZ.z - Actor2XYZ.z, 2)
    );
    return distance;
  }

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
}
