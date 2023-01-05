import { DecoratorData, IDecorator } from './IDecorator';
import { GameplayLibrary } from '../../../../library/gameplay-library';

export class DIsInRange implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const targetActor = decoratorData.blackboard.targetActor;
    if (!targetActor) {
      return false;
    }

    const distance = GameplayLibrary.getDistanceBetweenActors(decoratorData.owner, targetActor);
    if (distance === null) {
      return false;
    }
    const range = decoratorData.blackboard.range;
    const acceptanceRadius = decoratorData.blackboard.acceptanceRadius;
    if (!range || !acceptanceRadius) {
      return false;
    }
    const allowedDistance = range + acceptanceRadius;

    const isInRange = distance <= allowedDistance;
    return isInRange;
  }
}
