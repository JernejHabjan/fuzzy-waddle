import { Actor } from '../actor';
import { OwnerComponent } from '../characters/owner-component';
import { ActorsAbleToBeBuiltClass } from '../characters/builder-component';

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
}
