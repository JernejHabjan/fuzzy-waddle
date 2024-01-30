import { DecoratorData, IDecorator } from "./decorator.interface";
import { GameplayLibrary } from "../../../../../library/gameplay-library";

export class IsInRangeDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const targetActor = decoratorData.blackboard.targetGameObject;
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
