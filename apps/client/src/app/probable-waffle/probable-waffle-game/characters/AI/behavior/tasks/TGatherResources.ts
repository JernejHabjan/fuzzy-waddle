import { ITask, TaskData, TaskResultType } from './ITask';
import { GathererComponent } from '../../../gatherer-component';

export class TGatherResources implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const gathererComponent = taskData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return TaskResultType.Failure;
    }
    const targetResource = taskData.blackboard.targetActor;
    if (!targetResource) {
      return TaskResultType.Failure;
    }
    gathererComponent.startGatheringResources(targetResource);
    return TaskResultType.Success;
  }
}
