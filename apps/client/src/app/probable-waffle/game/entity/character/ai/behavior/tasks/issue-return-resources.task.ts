import { ITask, TaskData_old, TaskResultType } from "./task.interface";
import { GathererComponent } from "../../../../actor/components/gatherer-component";
import { PawnAiControllerComponentOld } from "../../../../../world/managers/controllers/pawn-ai-controller-component-old";

export class IssueReturnResourcesTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    const gathererComponent = taskData.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return TaskResultType.Failure;
    }
    const pawnAiController = taskData.owner.components.findComponentOrNull(PawnAiControllerComponentOld);
    if (!pawnAiController) {
      return TaskResultType.Failure;
    }
    pawnAiController.issueReturnResourcesOrder();
    return TaskResultType.Success;
  }
}
