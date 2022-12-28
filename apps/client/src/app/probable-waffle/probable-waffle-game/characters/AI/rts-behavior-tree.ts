import { BehaviorTree, BehaviorTreeNode } from './BehaviorTree';

export class RtsBehaviorTree extends BehaviorTree {
  name: string;
  rootNode: BehaviorTreeNode;
  constructor() {
    super();
    this.name = 'RtsBehaviorTree';
    this.rootNode = new BehaviorTreeNode('test');
  }
}
