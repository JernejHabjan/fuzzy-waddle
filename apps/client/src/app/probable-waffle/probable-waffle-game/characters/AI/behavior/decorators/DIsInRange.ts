import { DecoratorData, IDecorator } from './IDecorator';
import { TransformComponent } from '../../../transformable-component';

export class DIsInRange implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const targetActor = decoratorData.blackboard.targetActor;
    if (!targetActor) {
      return false;
    }

    const transformComponentTarget = targetActor.components.findComponentOrNull(TransformComponent);
    const transformComponentOwner = decoratorData.owner.components.findComponentOrNull(TransformComponent);
    if (!transformComponentTarget || !transformComponentOwner) {
      return false;
    }

    const targetXYZ = {
      x: transformComponentTarget.tilePlacementData.tileXY.x,
      y: transformComponentTarget.tilePlacementData.tileXY.y,
      z: transformComponentTarget.tilePlacementData.z
    };
    const ownerXYZ = {
      x: transformComponentOwner.tilePlacementData.tileXY.x,
      y: transformComponentOwner.tilePlacementData.tileXY.y,
      z: transformComponentOwner.tilePlacementData.z
    };


    const distance = Math.sqrt(Math.pow(targetXYZ.x - ownerXYZ.x, 2) + Math.pow(targetXYZ.y - ownerXYZ.y, 2) + Math.pow(targetXYZ.z - ownerXYZ.z, 2));

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
