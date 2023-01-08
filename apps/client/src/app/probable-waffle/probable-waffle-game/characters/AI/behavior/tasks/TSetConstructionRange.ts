import { ITask, TaskData, TaskResultType } from './ITask';
import { BuilderComponent } from '../../../builder-component';

export class TSetConstructionRange implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
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
