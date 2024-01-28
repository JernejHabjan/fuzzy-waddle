import { DecoratorData, IDecorator } from "./decorator.interface";
import { CharacterMovementComponent } from "../../../../actor/components/character-movement-component";

export class CanMoveDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const movementComponent = decoratorData.owner.components.findComponentOrNull(CharacterMovementComponent);
    if (!movementComponent) {
      return false;
    }

    return movementComponent.canMove();
  }
}
