import { DecoratorData, IDecorator } from './IDecorator';
import { BuilderComponent } from '../../../builder-component';

export class DIsAtConstructionSite implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const builderComponent = decoratorData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return false;
    }
    return !!builderComponent.getAssignedConstructionSite();
  }
}
