import { ITask, TaskData_old, TaskResultType } from "./task.interface";
import { BuilderComponent } from "../../../../actor/components/builder-component";

export class AssignToConstructionSiteTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    const builderComponent = taskData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return TaskResultType.Failure;
    }

    const constructionSite = taskData.blackboard.targetGameObject;
    if (!constructionSite) {
      return TaskResultType.Failure;
    }

    builderComponent.assignToConstructionSite(constructionSite);

    return TaskResultType.Success;
  }
}
