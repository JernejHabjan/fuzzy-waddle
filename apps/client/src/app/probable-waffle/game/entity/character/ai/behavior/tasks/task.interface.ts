import { PawnAiBlackboard } from "../../pawn-ai-blackboard";
import GameObject = Phaser.GameObjects.GameObject;

export class TaskData_old {
  constructor(
    public owner: GameObject,
    public blackboard: PawnAiBlackboard
  ) {}
}

export enum TaskResultType {
  Success = 0,
  Failure = 1
}

export interface ITask {
  executeTask(taskData: TaskData_old): TaskResultType;
}
