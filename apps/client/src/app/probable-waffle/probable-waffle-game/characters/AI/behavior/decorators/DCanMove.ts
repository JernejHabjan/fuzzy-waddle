import { DecoratorData, IDecorator } from './IDecorator';
import { CharacterMovementComponent } from '../../../character-movement-component';

export class DCanMove implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const movementComponent = decoratorData.owner.components.findComponentOrNull(CharacterMovementComponent);
    if (!movementComponent) {
      return false;
    }

    return movementComponent.canMove();
  }
}
