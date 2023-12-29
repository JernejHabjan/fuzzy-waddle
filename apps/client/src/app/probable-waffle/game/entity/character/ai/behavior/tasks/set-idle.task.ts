import { ITask, TaskData, TaskResultType } from "./task.interface";
import { PawnAiControllerComponent } from "../../../../../world/managers/controllers/pawn-ai-controller-component";

export class SetIdleTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const pawnAiControllerComponent = taskData.owner.components.findComponentOrNull(PawnAiControllerComponent);
    if (!pawnAiControllerComponent) {
      return TaskResultType.Failure;
    }
    pawnAiControllerComponent.issueStopOrder();
    return TaskResultType.Success;
  }
}
