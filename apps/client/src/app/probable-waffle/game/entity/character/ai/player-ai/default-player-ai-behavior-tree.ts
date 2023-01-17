import { BehaviorTree } from '../behavior-tree';

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
