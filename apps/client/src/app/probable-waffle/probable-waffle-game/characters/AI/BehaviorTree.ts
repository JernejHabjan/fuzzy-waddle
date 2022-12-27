export class BehaviorTree {
  constructor(public name: string, public rootNode: BehaviorTreeNode) {}

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
