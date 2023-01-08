import { Actor } from '../../../../actor';
import { PawnAiBlackboard } from '../../pawn-ai-blackboard';

export class TaskData {
  constructor(public owner: Actor, public blackboard: PawnAiBlackboard) {
  }
}

export enum TaskResultType {
  Success = 0,
  Failure = 1,
}

export interface ITask {
  executeTask(taskData: TaskData): TaskResultType;
}
