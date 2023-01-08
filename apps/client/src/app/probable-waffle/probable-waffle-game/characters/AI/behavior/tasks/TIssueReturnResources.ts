import { ITask, TaskData, TaskResultType } from './ITask';
import { GathererComponent } from '../../../gatherer-component';
import { PawnAiControllerComponent } from '../../../../controllers/pawn-ai-controller-component';

export class TIssueReturnResources implements ITask {
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
