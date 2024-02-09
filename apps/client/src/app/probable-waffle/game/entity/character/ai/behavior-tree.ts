import { Blackboard } from "./blackboard";
import GameObject = Phaser.GameObjects.GameObject;

export abstract class BehaviorTree {
  abstract name: string;
  protected owner!: GameObject;
  protected blackboard!: Blackboard;
  private running = false;

  public update(time: number, delta: number): void {
    if (!this.running) {
      return;
    }

    this.runDecisionTree();
  }

  public init(owner: GameObject, blackboard: Blackboard): void {
    this.owner = owner;
    this.blackboard = blackboard;
  }

  run(): void {
    this.running = true;
  }

  kill() {
    this.running = false;
  }

  protected abstract runDecisionTree(): void;
}
