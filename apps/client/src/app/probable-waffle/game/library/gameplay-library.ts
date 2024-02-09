import { Actor } from "../entity/actor/actor";
import { TransformComponent } from "../entity/actor/components/transformable-component";
import { getActorComponent } from "../data/actor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";
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

  static getDistanceBetweenActors(actor1: Actor, actor2: Actor): number | null {
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

  static getDistanceBetweenGameObjects(gameObject1: GameObject, gameObject2: GameObject): number | null {
    const transform1 = gameObject1 as unknown as Phaser.GameObjects.Components.Transform;
    const transform2 = gameObject2 as unknown as Phaser.GameObjects.Components.Transform;
    if (
      transform1.x === undefined ||
      transform1.y === undefined ||
      transform2.x === undefined ||
      transform2.y === undefined
    ) {
      return null;
    }
    // also check z
    const distance = Math.sqrt(
      Math.pow(transform1.x - transform2.x, 2) +
        Math.pow(transform1.y - transform2.y, 2) +
        Math.pow(transform1.z - transform2.z, 2)
    );
    return distance;
  }
}
