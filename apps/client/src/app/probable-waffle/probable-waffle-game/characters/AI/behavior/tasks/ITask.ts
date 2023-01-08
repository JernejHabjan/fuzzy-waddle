import { Actor } from '../../../../actor';
import { Blackboard } from '../../blackboard';
import { PlayerAiController } from '../../../../controllers/player-ai-controller';

export class TaskData {
  constructor(public owner: Actor, public blackboard: Blackboard, public playerAiController: PlayerAiController) {
  }
}

export enum TaskResultType {
  Success = 0,
  Failure = 1,
}

export interface ITask {
  executeTask(taskData: TaskData): TaskResultType;
}
