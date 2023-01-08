import { ITask, TaskData, TaskResultType } from './ITask';
import { BuilderComponent } from '../../../builder-component';
import { TransformComponent } from '../../../transformable-component';

export class TBeginConstruction implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const builderComponent  = taskData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return TaskResultType.Failure;
    }
    const target = taskData.blackboard.targetActor;
    if (!target) {
      return TaskResultType.Failure;
    }

    const transformComponent = target.components.findComponentOrNull(TransformComponent);
    if (!transformComponent) {
      return TaskResultType.Failure;
    }

    const targetLocation = taskData.blackboard.targetLocation;
    if (!targetLocation) {
      return TaskResultType.Failure;
    }
    const buildingType = taskData.blackboard.buildingType;
    if (!buildingType) {
      return TaskResultType.Failure;
    }

    builderComponent.beginConstruction(buildingType, targetLocation);
    return TaskResultType.Success;
  }
}
