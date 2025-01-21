import { BehaviorTree } from "../behavior-tree";

export class DefaultPlayerAiBehaviorTree_old extends BehaviorTree {
  name: string;

  constructor() {
    super();
    this.name = "DefaultPlayerAiBehaviorTree";
  }

  protected runDecisionTree(): void {
    // todo
  }
}
