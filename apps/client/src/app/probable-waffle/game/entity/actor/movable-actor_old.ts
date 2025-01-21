import { CharacterMovementComponent } from "./components/character-movement-component";
import { PawnAiControllerComponentOld } from "../../world/managers/controllers/pawn-ai-controller-component-old";
import { Blackboard } from "../character/ai/blackboard";
import { RepresentableActor_old } from "./representable-actor_old";
import { PawnBehaviorTree, PawnBehaviorTreeClasses } from "../character/ai/behavior-trees";

/*
 * pawn includes AI controller and move component, so it can move around
 */
export abstract class MovableActor_old extends RepresentableActor_old {
  abstract behaviorTreeClass: PawnBehaviorTreeClasses;
  abstract blackboardClass: typeof Blackboard;
  private behaviorTree!: PawnBehaviorTree;
  private blackboard!: Blackboard;

  override init() {
    super.init();

    this.blackboard = new this.blackboardClass();
    this.behaviorTree = new this.behaviorTreeClass();
    this.behaviorTree.init(this as any, this.blackboard);
  }

  override initComponents() {
    super.initComponents();

    this.components.addComponent(new CharacterMovementComponent(this));
    this.components.addComponent(new PawnAiControllerComponentOld(this as any, this.blackboard, this.behaviorTree));
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.behaviorTree.update(time, delta);
  }

  override kill() {
    super.kill();
    this.behaviorTree.kill();
  }
}
