import { DecoratorData, IDecorator } from "./decorator.interface";
import { GathererComponent } from "../../../../actor/components/gatherer-component";

export class IsGatheringResourcesDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const gathererComponent = decoratorData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return false;
    }
    return gathererComponent.isGathering;
  }
}
