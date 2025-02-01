import { DecoratorData_old, IDecorator } from "./decorator.interface";

export class HasLeftChaseRadiusDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData_old): boolean {
    return false;
  }
}
