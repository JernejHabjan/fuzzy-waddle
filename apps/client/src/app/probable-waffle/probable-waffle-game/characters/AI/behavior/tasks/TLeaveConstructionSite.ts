import { ITask, TaskData, TaskResultType } from './ITask';
import { BuilderComponent } from '../../../builder-component';

export class TLeaveConstructionSite implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const builderComponent = taskData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return TaskResultType.Failure;
    }
    builderComponent.leaveConstructionSite();
    return TaskResultType.Success;
  }
}
