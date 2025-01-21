import { DecoratorData_old, IDecorator } from "./decorator.interface";

export class TargetIsAliveDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData_old): boolean {
    const targetActor = decoratorData.blackboard.targetGameObject;
    if (!targetActor) {
      return false;
    }
    return !targetActor.killed;
  }
}
