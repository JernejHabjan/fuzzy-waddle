import { CharacterMovementComponent, ICharacterMovable } from './character-movement-component';
import { AiPawnControllerComponent, IAiPawnControllable } from '../controllers/ai-pawn-controller-component';
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
export abstract class MovableActor extends RepresentableActor implements ICharacterMovable, IAiPawnControllable {
  characterMovementComponent!: CharacterMovementComponent;
  aiPawnControllerComponent!: AiPawnControllerComponent;
  abstract behaviorTreeClass: BehaviorTreeClasses;
  abstract blackboardClass: typeof Blackboard;

  override init() {
    super.init();
    this.characterMovementComponent = this.components.addComponent(new CharacterMovementComponent(this));
    const blackboard = new this.blackboardClass();
    const behaviorTree = new this.behaviorTreeClass();
    this.aiPawnControllerComponent = this.components.addComponent(
      new AiPawnControllerComponent(blackboard, behaviorTree)
    );
  }
}
