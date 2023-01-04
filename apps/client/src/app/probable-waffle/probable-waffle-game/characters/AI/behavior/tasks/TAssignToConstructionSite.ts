import { ITask, TaskData, TaskResultType } from './ITask';
import { BuilderComponent } from '../../../builder-component';

export class TAssignToConstructionSite implements ITask {
  executeTask(taskData: TaskData): TaskResultType {

    const builderComponent = taskData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return TaskResultType.Failure;
    }

    const constructionSite = taskData.blackboard.targetActor;
    if (!constructionSite) {
      return TaskResultType.Failure;
    }

    builderComponent.assignToConstructionSite(constructionSite);

    return TaskResultType.Success;

  }

}
