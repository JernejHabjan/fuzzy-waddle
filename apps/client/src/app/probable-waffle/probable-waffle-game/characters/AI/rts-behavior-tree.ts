import { BehaviorTree } from './BehaviorTree';

export class RtsBehaviorTree extends BehaviorTree {
  name: string;

  constructor() {
    super();
    this.name = 'RtsBehaviorTree';
  }
}
