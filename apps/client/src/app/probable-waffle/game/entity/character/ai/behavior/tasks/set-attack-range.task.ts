import { ITask, TaskData, TaskResultType } from './task.interface';
import { AttackComponent } from '../../../../combat/components/attack-component';

export class SetAttackRangeTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    const attackComponent = taskData.owner.components.findComponentOrNull(AttackComponent);
    if (!attackComponent) {
      return TaskResultType.Failure;
    }

    const actor = taskData.blackboard.targetActor;
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
