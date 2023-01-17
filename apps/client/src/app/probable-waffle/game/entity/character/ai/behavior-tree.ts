import { Blackboard } from './blackboard';
import { Actor } from '../../actor/actor';

export abstract class BehaviorTree {
  abstract name: string;
  protected owner!: Actor;
  protected blackboard!: Blackboard;
  private running = false;
  protected abstract runDecisionTree(): void;

  public update(time: number, delta: number): void {
    if (!this.running) {
      return;
    }

    this.runDecisionTree();
  }

  public init(owner: Actor, blackboard: Blackboard): void {
    this.owner = owner;
    this.blackboard = blackboard;
  }

  run(): void {
    this.running = true;
  }

  kill() {
    this.running = false;
  }
}
