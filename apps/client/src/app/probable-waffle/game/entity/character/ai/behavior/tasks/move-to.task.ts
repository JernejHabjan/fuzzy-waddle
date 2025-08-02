import { ITask, TaskData_old, TaskResultType } from "./task.interface";
import { PawnAiControllerComponentOld } from "../../../../../world/managers/controllers/pawn-ai-controller-component-old";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../../../../data/actor-component";
import { getGameObjectRenderedTransform } from "../../../../../data/game-object-helper";

export class MoveToTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    const targetActor = taskData.blackboard.targetGameObject;
    let targetLocation = taskData.blackboard.targetLocation;
    if (targetActor) {
      const transform = getGameObjectRenderedTransform(targetActor);
      if (!transform) throw new Error("Transform not found");
      targetLocation = { x: transform.x, y: transform.y, z: transform.z } satisfies Vector3Simple;
    }
    if (!targetLocation) {
      return TaskResultType.Failure;
    }

    // issue move order
    const pawnAiControllerComponent = getActorComponent(taskData.owner, PawnAiControllerComponentOld);
    if (!pawnAiControllerComponent) {
      return TaskResultType.Failure;
    }
    pawnAiControllerComponent.issueMoveOrder(targetLocation);

    return TaskResultType.Success;
  }
}
