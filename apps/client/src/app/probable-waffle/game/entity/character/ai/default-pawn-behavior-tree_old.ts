import { BehaviorTree } from "./behavior-tree";
import { DecoratorData_old } from "./behavior/decorators/decorator.interface";
import { TaskData_old } from "./behavior/tasks/task.interface";

export class DefaultPawnBehaviorTree_old extends BehaviorTree {
  name: string;
  private decoratorData: DecoratorData_old;
  private taskData: TaskData_old;

  constructor() {
    super();
    this.name = "DefaultPawnBehaviorTree";

    this.decoratorData = new DecoratorData_old(this.owner, this.blackboard);
    this.taskData = new TaskData_old(this.owner, this.blackboard);
  }

  protected runDecisionTree(): void {
    // todo
  }

  private attackOrder() {
    // todo
  }
}
