import { DecoratorData, IDecorator } from './IDecorator';

export class DIsOrderQueueEmpty implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    return decoratorData.aiPlayerController.hasOrderQueue();
  }
}
