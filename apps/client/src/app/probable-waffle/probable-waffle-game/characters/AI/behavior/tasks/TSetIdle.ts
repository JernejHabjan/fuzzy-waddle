import { ITask, TaskData, TaskResultType } from './ITask';
import { PawnAiControllerComponent } from '../../../../controllers/pawn-ai-controller-component';

export class TSetIdle implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const pawnAiControllerComponent = taskData.owner.components.findComponentOrNull(PawnAiControllerComponent);
    if (!pawnAiControllerComponent) {
      return TaskResultType.Failure;
    }
    pawnAiControllerComponent.issueStopOrder();
    return TaskResultType.Success;
  }
}
