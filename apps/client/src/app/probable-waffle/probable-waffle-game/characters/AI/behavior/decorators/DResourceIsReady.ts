import { DecoratorData, IDecorator } from './IDecorator';
import { ResourceSourceComponent } from '../../../../buildings/resource-source-component';

export class DResourceIsReady implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const owner = decoratorData.owner;
    const targetActor = decoratorData.blackboard.targetActor;
    if (!targetActor) {
      return false;
    }
    const resourceSourceComponent = targetActor.components.findComponentOrNull(ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return false;
    }
    return resourceSourceComponent.mustGathererEnter() || resourceSourceComponent.canGathererEnter(owner);
  }
}
