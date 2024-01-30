import { ITask, TaskData, TaskResultType } from "./task.interface";
import { GathererComponent } from "../../../../actor/components/gatherer-component";
import { getActorComponent } from "../../../../../data/actor-component";

export class ReturnResourcesTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const resourceDrain = taskData.blackboard.targetGameObject;
    if (!resourceDrain) {
      return TaskResultType.Failure;
    }
    const gathererComponent = getActorComponent(taskData.owner, GathererComponent);
    if (!gathererComponent) {
      return TaskResultType.Failure;
    }
    gathererComponent.returnResources(resourceDrain);
    return TaskResultType.Success;
  }
}
