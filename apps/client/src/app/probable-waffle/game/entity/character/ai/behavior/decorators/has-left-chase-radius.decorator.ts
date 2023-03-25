import { DecoratorData, IDecorator } from './decorator.interface';

export class HasLeftChaseRadiusDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    return false; // todo if needed
  }
}
