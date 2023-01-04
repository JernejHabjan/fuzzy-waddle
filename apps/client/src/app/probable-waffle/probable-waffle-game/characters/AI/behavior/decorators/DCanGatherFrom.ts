import { DecoratorData, IDecorator } from './IDecorator';
import { GathererComponent } from '../../../gatherer-component';

export class DCanGatherFrom implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const target = decoratorData.blackboard.targetActor;
    if (!target) {
      return false;
    }
    const gathererComponent = decoratorData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return false;
    }

    // if gathererComponent can gather from target, return true
    return gathererComponent.canGatherFrom(target) && !gathererComponent.isCapacityFull();
  }

}
