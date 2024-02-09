import { ITask, TaskData, TaskResultType } from "./task.interface";

export class MoveInRangeTask implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    // actually inherits MoveTo - todo
    return TaskResultType.Success;
  }
}
