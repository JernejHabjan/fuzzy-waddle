import { ITask, TaskData, TaskResultType } from "./task.interface";
import { TransformComponent } from "../../../../actor/components/transformable-component";
import { PawnAiControllerComponentOld } from "../../../../../world/managers/controllers/pawn-ai-controller-component-old";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../../../../data/actor-component";

export class MoveToTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const targetActor = taskData.blackboard.targetGameObject;
    let targetLocation = taskData.blackboard.targetLocation;
    if (targetActor) {
      const transform = targetActor as unknown as Phaser.GameObjects.Components.Transform;
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
