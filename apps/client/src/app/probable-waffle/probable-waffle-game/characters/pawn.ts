import { Actor } from '../actor';
import { SpritePlacementData } from '../sprite/sprite-helper';
import { CharacterMovementComponent, IMovable } from './character-movement-component';
import { AIPawnController, IAiPawnControllable } from '../controllers/ai-pawn-controller';
import { Blackboard } from './AI/blackboard';
import { BehaviorTree, BehaviorTreeNode } from './AI/BehaviorTree';
import { ISpriteRepresentable, SpriteRepresentationComponent } from './sprite-representable-component';
import { ITransformable, TransformComponent } from './transformable-component';

/*
 * pawn includes AI controller and move component, so it can move around
 */
export abstract class Pawn
  extends Actor
  implements IMovable, IAiPawnControllable, ISpriteRepresentable, ITransformable
{
  characterMovementComponent: CharacterMovementComponent;
  aiPawnController: AIPawnController;
  spriteRepresentationComponent: SpriteRepresentationComponent;
  transformComponent: TransformComponent;
  protected sprite: Phaser.GameObjects.Sprite;
  protected scene: Phaser.Scene;

  protected constructor(scene: Phaser.Scene, spritePlacementData: SpritePlacementData) {
    super();
    this.transformComponent = new TransformComponent(spritePlacementData.tilePlacementData);
    this.spriteRepresentationComponent = new SpriteRepresentationComponent(scene, spritePlacementData);
    this.sprite = this.spriteRepresentationComponent.sprite;
    this.scene = scene;
    // todo dont? this.spriteRepresentationComponent.subscribeToTransformEvents(this.transformComponent);
    this.characterMovementComponent = this.components.addComponent(new CharacterMovementComponent(this));
    const blackboard = new Blackboard(); // todo
    const behaviorTree = new BehaviorTree('pawn', new BehaviorTreeNode('test')); // todo
    this.aiPawnController = new AIPawnController(blackboard, behaviorTree);
  }
}
