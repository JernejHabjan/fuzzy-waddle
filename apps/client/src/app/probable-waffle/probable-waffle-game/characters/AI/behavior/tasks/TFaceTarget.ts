import { ITask, TaskData, TaskResultType } from './ITask';
import { TransformComponent } from '../../../transformable-component';

export class TFaceTarget implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const targetActor = taskData.blackboard.targetActor;
    if (!targetActor) {
      return TaskResultType.Failure;
    }
    // get target actor transform
    const targetTransformComponent = targetActor.components.findComponentOrNull(TransformComponent);
    if (!targetTransformComponent) {
      return TaskResultType.Failure;
    }
    // get owner transform
    const ownerTransformComponent = taskData.owner.components.findComponentOrNull(TransformComponent);
    if (!ownerTransformComponent) {
      return TaskResultType.Failure;
    }

    // face target
    ownerTransformComponent.face(targetTransformComponent.tilePlacementData); // todo rather call system to face target?

    return TaskResultType.Success;
  }
}
