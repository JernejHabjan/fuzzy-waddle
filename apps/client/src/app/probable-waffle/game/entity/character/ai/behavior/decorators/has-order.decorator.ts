import { DecoratorData, IDecorator } from "./decorator.interface";

export class HasOrderDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    return !!decoratorData.blackboard.aiOrderType;
  }
}
