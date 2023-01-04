import { DecoratorData, IDecorator } from './IDecorator';

export class DTargetIsAlive implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const targetActor = decoratorData.blackboard.targetActor;
    if (!targetActor) {
      return false;
    }
    return !targetActor.killed;
  }
}
