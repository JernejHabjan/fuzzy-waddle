import { ITask, TaskData, TaskResultType } from './ITask';
import { TransformComponent } from '../../../transformable-component';
import { PawnAiControllerComponent } from '../../../../controllers/pawn-ai-controller-component';

export class TMoveTo implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const targetActor = taskData.blackboard.targetActor;
    let targetLocation =taskData.blackboard.targetLocation;
    if(targetActor){
      const  targetActorTransformComponent = targetActor.components.findComponentOrNull(TransformComponent);
      if(targetActorTransformComponent){
        targetLocation = targetActorTransformComponent.tilePlacementData;
      }
    }
    if(!targetLocation){
      return TaskResultType.Failure;
    }

    // issue move order
    const pawnAiControllerComponent = taskData.owner.components.findComponentOrNull(PawnAiControllerComponent);
    if (!pawnAiControllerComponent) {
      return TaskResultType.Failure;
    }
    pawnAiControllerComponent.issueMoveOrder(targetLocation);


    return TaskResultType.Success;
  }
}
