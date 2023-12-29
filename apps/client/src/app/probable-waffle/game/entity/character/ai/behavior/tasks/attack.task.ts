import { ITask, TaskData, TaskResultType } from "./task.interface";
import { AttackComponent } from "../../../../combat/components/attack-component";

export class AttackTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const attackComponent = taskData.owner.components.findComponentOrNull(AttackComponent);
    if (!attackComponent) {
      return TaskResultType.Failure;
    }
    const target = taskData.blackboard.targetActor;
    if (!target) {
      return TaskResultType.Failure;
    }

    attackComponent.useAttack(0, target);
    return TaskResultType.Success;
  }
}
