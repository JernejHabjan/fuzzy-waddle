import { ITask, TaskData, TaskResultType } from './task.interface';
import { GathererComponent } from '../../../../actor/components/gatherer-component';

export class ReturnResourcesTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const resourceDrain = taskData.blackboard.targetActor;
    if (!resourceDrain) {
      return TaskResultType.Failure;
    }
    const gathererComponent = taskData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return TaskResultType.Failure;
    }
    gathererComponent.returnResources(resourceDrain);
    return TaskResultType.Success;
  }
}
