import { SpritePlacementData } from '../sprite/sprite-helper';
import { CharacterMovementComponent, ICharacterMovable } from './character-movement-component';
import { AIPawnController, IAiPawnControllable } from '../controllers/ai-pawn-controller';
import { Blackboard } from './AI/blackboard';
import { BehaviorTree, BehaviorTreeNode } from './AI/BehaviorTree';
import { Pawn } from './pawn';

/*
 * pawn includes AI controller and move component, so it can move around
 */
export abstract class Character extends Pawn implements ICharacterMovable, IAiPawnControllable {
  characterMovementComponent: CharacterMovementComponent;
  aiPawnController: AIPawnController;

  protected constructor(scene: Phaser.Scene, spritePlacementData: SpritePlacementData) {
    super(scene, spritePlacementData);
    this.characterMovementComponent = this.components.addComponent(new CharacterMovementComponent(this));
    const blackboard = new Blackboard(); // todo
    const behaviorTree = new BehaviorTree('pawn', new BehaviorTreeNode('test')); // todo
    this.aiPawnController = new AIPawnController(blackboard, behaviorTree);
  }
}
