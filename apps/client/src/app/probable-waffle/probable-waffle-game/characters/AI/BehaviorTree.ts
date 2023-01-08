import { Blackboard } from './blackboard';
import { Actor } from '../../actor';

export abstract class BehaviorTree {
  abstract name: string;
  private owner!: Actor;
  private blackboard!: Blackboard;
  private running = false;

  public tick(): void {
    if (!this.running) {
      return;
    }

    // todo
  }

  public init(owner: Actor, blackboard: Blackboard): void {
    this.owner = owner;
    this.blackboard = blackboard;
  }

  run(): void {
    this.running = true;
  }
}
