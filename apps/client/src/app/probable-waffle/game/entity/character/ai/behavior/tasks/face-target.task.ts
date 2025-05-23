import { ITask, TaskData_old, TaskResultType } from "./task.interface";
import { TransformComponent } from "../../../../actor/components/transformable-component";

export class FaceTargetTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    const targetActor = taskData.blackboard.targetGameObject;
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
