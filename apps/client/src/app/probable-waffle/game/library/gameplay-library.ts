import { Actor } from "../entity/actor/actor";
import { TransformComponent } from "../entity/actor/components/transformable-component";
import { getActorComponent } from "../data/actor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";
import { getGameObjectCurrentTile, getGameObjectTransform } from "../data/game-object-helper";
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

  static getWorldDistanceBetweenGameObjects(actor1: GameObject, actor2: GameObject): number | null {
    if (actor1 === actor2) return 0;
    const actor1Transform = getGameObjectTransform(actor1);
    if (!actor1Transform) return null;
    const actor1Position = {
      x: actor1Transform.x,
      y: actor1Transform.y,
      z: actor1Transform.z
    } satisfies Vector3Simple;

    const actor2Transform = getGameObjectTransform(actor2);
    if (!actor2Transform) return null;
    const actor2Position = {
      x: actor2Transform.x,
      y: actor2Transform.y,
      z: actor2Transform.z
    } satisfies Vector3Simple;

    // noinspection UnnecessaryLocalVariableJS
    const distance = Math.sqrt(
      Math.pow(actor1Position.x - actor2Position.x, 2) +
        Math.pow(actor1Position.y - actor2Position.y, 2) +
        Math.pow(actor1Position.z - actor2Position.z, 2)
    );

    return distance;
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
}
