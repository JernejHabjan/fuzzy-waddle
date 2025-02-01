import { ITask, TaskData_old, TaskResultType } from "./task.interface";
import { BuilderComponent } from "../../../../actor/components/builder-component";
import { TransformComponent } from "../../../../actor/components/transformable-component";

export class BeginConstructionTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    const builderComponent = taskData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return TaskResultType.Failure;
    }
    const target = taskData.blackboard.targetGameObject;
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
