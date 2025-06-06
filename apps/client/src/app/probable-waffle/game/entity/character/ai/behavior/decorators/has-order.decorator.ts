import { DecoratorData_old, IDecorator } from "./decorator.interface";

export class HasOrderDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData_old): boolean {
    return !!decoratorData.blackboard.aiOrderType;
  }
}
