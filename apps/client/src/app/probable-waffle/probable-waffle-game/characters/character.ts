import { SpritePlacementData } from '../sprite/sprite-helper';
import { CharacterMovementComponent, ICharacterMovable } from './character-movement-component';
import { AiPawnControllerComponent, IAiPawnControllable } from '../controllers/ai-pawn-controller-component';
import { Blackboard } from './AI/blackboard';
import { Pawn } from './pawn';
import { BehaviorTreeClasses } from './AI/behavior-trees';

/*
 * pawn includes AI controller and move component, so it can move around
 */
export abstract class Character extends Pawn implements ICharacterMovable, IAiPawnControllable {
  characterMovementComponent!: CharacterMovementComponent;
  aiPawnControllerComponent!: AiPawnControllerComponent;
  abstract behaviorTreeClass: BehaviorTreeClasses;
  abstract blackboardClass: typeof Blackboard;

  protected constructor(scene: Phaser.Scene, spritePlacementData: SpritePlacementData) {
    super(scene, spritePlacementData);
  }

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
