import { BehaviorTree } from "./behavior-tree";

export class DefaultPawnBehaviorTree_old extends BehaviorTree {
  name: string;

  constructor() {
    super();
    this.name = "DefaultPawnBehaviorTree";
  }

  protected runDecisionTree(): void {
    // todo
  }

  private attackOrder() {
    // todo
  }
}
