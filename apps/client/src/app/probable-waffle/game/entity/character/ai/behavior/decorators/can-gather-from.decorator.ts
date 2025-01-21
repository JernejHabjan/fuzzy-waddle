import { DecoratorData_old, IDecorator } from "./decorator.interface";
import { GathererComponent } from "../../../../actor/components/gatherer-component";

export class CanGatherFromDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData_old): boolean {
    const target = decoratorData.blackboard.targetGameObject;
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
