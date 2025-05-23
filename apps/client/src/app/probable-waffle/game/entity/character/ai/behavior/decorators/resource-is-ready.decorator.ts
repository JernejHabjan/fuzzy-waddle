import { DecoratorData_old, IDecorator } from "./decorator.interface";
import { ResourceSourceComponent } from "../../../../economy/resource/resource-source-component";

export class ResourceIsReadyDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData_old): boolean {
    const owner = decoratorData.owner;
    const targetActor = decoratorData.blackboard.targetGameObject;
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
