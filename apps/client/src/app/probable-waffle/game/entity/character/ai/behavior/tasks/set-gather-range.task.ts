import { ITask, TaskData, TaskResultType } from "./task.interface";
import { GathererComponent } from "../../../../actor/components/gatherer-component";

export class SetGatherRangeTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const gathererComponent = taskData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return TaskResultType.Failure;
    }

    const resourceSource = taskData.blackboard.targetActor;
    if (!resourceSource) {
      return TaskResultType.Failure;
    }
    const range = gathererComponent.getGatherRange(resourceSource);

    if (range <= 0) {
      return TaskResultType.Failure;
    }
    taskData.blackboard.range = range;
    return TaskResultType.Success;
  }
}
