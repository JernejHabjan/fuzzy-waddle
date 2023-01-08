import { Actor } from '../actor';
import { OwnerComponent } from '../characters/owner-component';
import { ActorsAbleToBeBuiltClass } from '../characters/builder-component';
import { TransformComponent } from '../characters/transformable-component';
import { ConstructionSiteComponent } from '../buildings/construction-site-component';

export class GameplayLibrary {
  static getMissingRequirementsFor(ownedActor: Actor, desiredProduct: ActorsAbleToBeBuiltClass): Actor | false {
    const ownerComponent = ownedActor.components.findComponentOrNull(OwnerComponent);

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

  /**
   * Checks whether the specified actor is ready to use (e.g. finished construction).
   */
  static isReadyToUse(resourceDrain: Actor): boolean {
    const constructionSiteComponent = resourceDrain.components.findComponentOrNull(ConstructionSiteComponent);

    if (!constructionSiteComponent) {
      return true;
    }
    return constructionSiteComponent.isFinished();
  }
}
