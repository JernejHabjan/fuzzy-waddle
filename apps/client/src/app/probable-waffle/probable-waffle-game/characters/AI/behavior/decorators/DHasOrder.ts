import { DecoratorData, IDecorator } from './IDecorator';

export class DHasOrder implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    return !!decoratorData.blackboard.orderType;
  }
}
