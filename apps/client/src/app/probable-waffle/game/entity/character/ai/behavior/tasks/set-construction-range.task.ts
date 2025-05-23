import { ITask, TaskData_old, TaskResultType } from "./task.interface";
import { BuilderComponent } from "../../../../actor/components/builder-component";

export class SetConstructionRangeTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    const builderComponent = taskData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return TaskResultType.Failure;
    }

    const buildingType = taskData.blackboard.buildingType;
    if (!buildingType) {
      return TaskResultType.Failure;
    }
    const range = builderComponent.getConstructionRange(buildingType); // todo this doesn't work yet

    if (range <= 0) {
      return TaskResultType.Failure;
    }
    taskData.blackboard.range = range;
    return TaskResultType.Success;
  }
}
