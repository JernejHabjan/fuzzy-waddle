import { ITask, TaskData, TaskResultType } from "./task.interface";
import { PawnAiControllerComponentOld } from "../../../../../world/managers/controllers/pawn-ai-controller-component-old";

export class ObtainNextOrderTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const pawnAiControllerComponent = taskData.owner.components.findComponentOrNull(PawnAiControllerComponentOld);
    if (!pawnAiControllerComponent) {
      return TaskResultType.Failure;
    }
    pawnAiControllerComponent.obtainNextOrder();

    return TaskResultType.Success;
  }
}
