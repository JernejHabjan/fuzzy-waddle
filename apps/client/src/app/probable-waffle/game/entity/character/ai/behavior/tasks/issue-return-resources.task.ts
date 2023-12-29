import { ITask, TaskData, TaskResultType } from "./task.interface";
import { GathererComponent } from "../../../../actor/components/gatherer-component";
import { PawnAiControllerComponent } from "../../../../../world/managers/controllers/pawn-ai-controller-component";

export class IssueReturnResourcesTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const gathererComponent = taskData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return TaskResultType.Failure;
    }
    const pawnAiController = taskData.owner.components.findComponentOrNull(PawnAiControllerComponent);
    if (!pawnAiController) {
      return TaskResultType.Failure;
    }
    pawnAiController.issueReturnResourcesOrder();
    return TaskResultType.Success;
  }
}
