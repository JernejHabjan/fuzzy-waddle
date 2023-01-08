import { BehaviorTree } from '../BehaviorTree';

export class DefaultPlayerAiBehaviorTree extends BehaviorTree {
  name: string;
  constructor() {
    super();
    this.name = 'DefaultPlayerAiBehaviorTree';
  }

  protected runDecisionTree(): void {
    // todo
  }
}
