export abstract class BehaviorTree {
  abstract name: string;
  abstract rootNode: BehaviorTreeNode;
  public tick(): void {
    this.rootNode.tick();
  }
}

export class BehaviorTreeNode {
  constructor(public name: string) {}

  public tick(): void {
    // pass
  }
}
