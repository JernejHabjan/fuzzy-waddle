import { ITask, TaskData, TaskResultType } from './ITask';

export class TMoveInRange implements ITask {
  executeTask(taskData: TaskData): TaskResultType {
    // actually inherits MoveTo - todo
    return TaskResultType.Success;
  }
}
