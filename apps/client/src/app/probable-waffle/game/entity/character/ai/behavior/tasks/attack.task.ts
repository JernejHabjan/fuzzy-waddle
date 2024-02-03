import { ITask, TaskData, TaskResultType } from "./task.interface";
import { AttackComponent } from "../../../../combat/components/attack-component";
import { getActorComponent } from "../../../../../data/actor-component";

export class AttackTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const attackComponent = getActorComponent(taskData.owner, AttackComponent);
    if (!attackComponent) {
      return TaskResultType.Failure;
    }
    const target = taskData.blackboard.targetGameObject;
    if (!target) {
      return TaskResultType.Failure;
    }

    attackComponent.useAttack(0, target);
    return TaskResultType.Success;
  }
}
