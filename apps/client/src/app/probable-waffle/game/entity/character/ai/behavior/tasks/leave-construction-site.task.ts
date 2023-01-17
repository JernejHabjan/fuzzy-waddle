import { ITask, TaskData, TaskResultType } from './task.interface';
import { BuilderComponent } from '../../../../actor/components/builder-component';

export class LeaveConstructionSiteTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const builderComponent = taskData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return TaskResultType.Failure;
    }
    builderComponent.leaveConstructionSite();
    return TaskResultType.Success;
  }
}
