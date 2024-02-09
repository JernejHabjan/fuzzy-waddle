import { DecoratorData, IDecorator } from "./decorator.interface";

export class TargetIsAliveDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const targetActor = decoratorData.blackboard.targetGameObject;
    if (!targetActor) {
      return false;
    }
    return !targetActor.killed;
  }
}
