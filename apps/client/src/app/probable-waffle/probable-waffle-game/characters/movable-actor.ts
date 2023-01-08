import { CharacterMovementComponent, ICharacterMovable } from './character-movement-component';
import { IPawnAiControllable, PawnAiControllerComponent } from '../controllers/pawn-ai-controller-component';
import { Blackboard } from './AI/blackboard';
import { RepresentableActor } from './representable-actor';
import { PawnBehaviorTree, PawnBehaviorTreeClasses } from './AI/behavior-trees';


/*
 * pawn includes AI controller and move component, so it can move around
 */
export abstract class MovableActor extends RepresentableActor implements ICharacterMovable, IPawnAiControllable {
  characterMovementComponent!: CharacterMovementComponent;
  pawnAiControllerComponent!: PawnAiControllerComponent;
  abstract behaviorTreeClass: PawnBehaviorTreeClasses;
  abstract blackboardClass: typeof Blackboard;
  private behaviorTree!: PawnBehaviorTree;

  override init() {
    super.init();
    this.characterMovementComponent = this.components.addComponent(new CharacterMovementComponent(this));
    const blackboard = new this.blackboardClass();
    this.behaviorTree = new this.behaviorTreeClass();
    this.behaviorTree.init(this, blackboard);
    this.pawnAiControllerComponent = this.components.addComponent(
      new PawnAiControllerComponent(this,blackboard, this.behaviorTree)
    );
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
