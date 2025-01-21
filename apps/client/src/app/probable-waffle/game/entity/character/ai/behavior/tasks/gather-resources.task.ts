import { ITask, TaskData_old, TaskResultType } from "./task.interface";
import { GathererComponent } from "../../../../actor/components/gatherer-component";

export class GatherResourcesTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    const gathererComponent = taskData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return TaskResultType.Failure;
    }
    const targetResource = taskData.blackboard.targetGameObject;
    if (!targetResource) {
      return TaskResultType.Failure;
    }
    gathererComponent.startGatheringResources(targetResource);
    return TaskResultType.Success;
  }
}
