import { ITask, TaskData_old, TaskResultType } from "./task.interface";
import { AttackComponent } from "../../../../combat/components/attack-component";
import { getActorComponent } from "../../../../../data/actor-component";

export class SetAttackRangeTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    const attackComponent = getActorComponent(taskData.owner, AttackComponent);
    if (!attackComponent) {
      return TaskResultType.Failure;
    }

    const actor = taskData.blackboard.targetGameObject;
    if (!actor) {
      return TaskResultType.Failure;
    }
    const attacks = attackComponent.getAttacks();
    if (attacks.length === 0) {
      return TaskResultType.Failure;
    }
    const range = attacks[0].range;

    if (range <= 0) {
      return TaskResultType.Failure;
    }
    taskData.blackboard.range = range;
    return TaskResultType.Success;
  }
}
