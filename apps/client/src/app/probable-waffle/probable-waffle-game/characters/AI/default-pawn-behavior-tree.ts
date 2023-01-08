import { BehaviorTree } from './BehaviorTree';
import { DecoratorData } from './behavior/decorators/IDecorator';
import { TaskData } from './behavior/tasks/ITask';

export class DefaultPawnBehaviorTree extends BehaviorTree {
  name: string;
  private decoratorData: DecoratorData;
  private taskData: TaskData;

  constructor() {
    super();
    this.name = 'DefaultPawnBehaviorTree';

    this.decoratorData = new DecoratorData(this.owner, this.blackboard);
    this.taskData = new TaskData(this.owner, this.blackboard);

  }

  protected runDecisionTree(): void {

    // todo


  }

  private attackOrder(){
    // todo
  }
}
