import { CharacterMovementComponent, ICharacterMovable } from './character-movement-component';
import { PawnAiControllerComponent, IPawnAiControllable } from '../controllers/pawn-ai-controller-component';
import { Blackboard } from './AI/blackboard';
import { RepresentableActor } from './representable-actor';
import { BehaviorTreeClasses } from './AI/behavior-trees';

export type TextureMapDefinition = {
  textureName: string;
  spriteSheet: {
    name: string;
    frameConfig: {
      frameWidth: number;
      frameHeight: number;
    };
  };
};

/*
 * pawn includes AI controller and move component, so it can move around
 */
export abstract class MovableActor extends RepresentableActor implements ICharacterMovable, IPawnAiControllable {
  characterMovementComponent!: CharacterMovementComponent;
  pawnAiControllerComponent!: PawnAiControllerComponent;
  abstract behaviorTreeClass: BehaviorTreeClasses;
  abstract blackboardClass: typeof Blackboard;

  override init() {
    super.init();
    this.characterMovementComponent = this.components.addComponent(new CharacterMovementComponent(this));
    const blackboard = new this.blackboardClass();
    const behaviorTree = new this.behaviorTreeClass();
    behaviorTree.init(this, blackboard);
    this.pawnAiControllerComponent = this.components.addComponent(
      new PawnAiControllerComponent(this,blackboard, behaviorTree)
    );
  }
}
