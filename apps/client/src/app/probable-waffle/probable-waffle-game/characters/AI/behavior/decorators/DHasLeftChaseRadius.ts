import { DecoratorData, IDecorator } from './IDecorator';

export class DHasLeftChaseRadius implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    return false; // todo if needed
  }

}
