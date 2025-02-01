import { ITask, TaskData_old, TaskResultType } from "./task.interface";

export class MoveInRangeTask implements ITask {
  executeTask(taskData: TaskData_old): TaskResultType {
    // actually inherits MoveTo
    return TaskResultType.Success;
  }
}
