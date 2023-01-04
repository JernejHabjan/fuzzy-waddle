import { Blackboard } from './blackboard';
import { Actor } from '../../actor';

export abstract class BehaviorTree {
  abstract name: string;
  private owner!: Actor;
  private blackboard!: Blackboard;

  public tick(): void {
    // todo
  }

  public init(owner: Actor, blackboard: Blackboard): void {
    this.owner = owner;
    this.blackboard = blackboard;
  }
}
