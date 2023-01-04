import { DecoratorData, IDecorator } from './IDecorator';
import { GathererComponent } from '../../../gatherer-component';

export class DIsGatheringResources implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const gathererComponent = decoratorData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return false;
    }
    return gathererComponent.isGathering();
  }
}
