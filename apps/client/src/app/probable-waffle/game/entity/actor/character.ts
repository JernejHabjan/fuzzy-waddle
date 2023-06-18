import {
  AnimDirection,
  AnimDirectionEnum,
  IsoAngleToAnimDirectionEnum,
  LPCAnimTypeEnum
} from '../character/animation/lpc-animation-helper';
import { HealthComponent, HealthDefinition } from '../combat/components/health-component';
import { StateMachine } from '../character/animation/state-machine';
import { CharacterMovementComponent, MoveEventTypeEnum } from './components/character-movement-component';
import { CharacterSoundComponent, SoundDefinition } from './components/character-sound-component';
import { MovableActor } from './movable-actor';
import { Blackboard } from '../character/ai/blackboard';
import { DefaultPawnBehaviorTree } from '../character/ai/default-pawn-behavior-tree';
import { PawnBehaviorTreeClasses } from '../character/ai/behavior-trees';
import { SpriteAnimationHelper } from '../character/animation/sprite-animation-helper';
import { TilePlacementData } from '../../world/managers/controllers/input/tilemap/tilemap-input.handler';
import { CostData } from '../building/production/production-cost-component';
import { RepresentableActorDefinition } from './representable-actor';
import { Animations, Scene, Scenes } from 'phaser';
import { SpriteRepresentationComponent } from './components/sprite-representable-component';

export type PawnInfoDefinition = RepresentableActorDefinition & {
  healthDefinition: HealthDefinition;
  soundDefinition: SoundDefinition;
  cost?: CostData;
};

export abstract class Character extends MovableActor {
  behaviorTreeClass: PawnBehaviorTreeClasses = DefaultPawnBehaviorTree;
  blackboardClass: typeof Blackboard = Blackboard;
  currentDir = AnimDirectionEnum.south;
  currentAnimGroup = LPCAnimTypeEnum.walk;
  private healthComponent!: HealthComponent;
  abstract pawnDefinition: PawnInfoDefinition;
  representableActorDefinition!: RepresentableActorDefinition;
  private warriorStateMachine!: StateMachine;
  private characterSoundComponent!: CharacterSoundComponent;
  private spriteRepresentationComponent!: SpriteRepresentationComponent;
  private characterMovementComponent!: CharacterMovementComponent;

  protected constructor(scene: Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }

  override init() {
    super.init();

    this.representableActorDefinition = this.pawnDefinition;
  }

  override initComponents() {
    super.initComponents();

    this.spriteRepresentationComponent = this.components.findComponent(SpriteRepresentationComponent);
    this.spriteRepresentationComponent.sprite.setInteractive();
    this.characterMovementComponent = this.components.findComponent(CharacterMovementComponent);
    this.healthComponent = this.components.addComponent(
      new HealthComponent(this, this.pawnDefinition.healthDefinition)
    );
    this.characterSoundComponent = this.components.addComponent(
      new CharacterSoundComponent(this.spriteRepresentationComponent.sprite)
    );
  }

  override postStart() {
    super.postStart();

    this.initStateMachine();
    this.subscribeToEvents();
  }

  override update(t: number, dt: number) {
    super.update(t, dt);
    if (!this.destroyed) {
      this.warriorStateMachine.update(dt);
    }
  }

  override kill() {
    this.warriorStateMachine.setState('dead');
    super.kill();
  }

  playMoveAnim(dir: AnimDirection) {
    const prevDir = this.currentDir;
    this.currentDir = dir;
    // if state is "run" and currentDir is different, then change direction
    if (this.warriorStateMachine.isCurrentState('run') && prevDir !== dir) {
      this.warriorRunEnter();
    }
    this.warriorStateMachine.setState('run');
  }

  private subscribeToEvents() {
    const scene = this.spriteRepresentationComponent.scene;
    this.characterMovementComponent.moveEventEmitter.on(MoveEventTypeEnum.MOVE_PROGRESS, this.onMoveProgress, this);
    scene.events.on(Scenes.Events.SHUTDOWN, () => {
      this.characterMovementComponent.moveEventEmitter.off(MoveEventTypeEnum.MOVE_PROGRESS, this.onMoveProgress, this);
      this.destroy();
    });
  }

  private onMoveProgress(isoAngleRounded: number) {
    if (this.killed) {
      return;
    }
    this.playMoveAnim(IsoAngleToAnimDirectionEnum[isoAngleRounded.toString()]);
  }

  private initStateMachine() {
    this.warriorStateMachine = new StateMachine(this, 'warrior') // todo some unique id?
      .addState('idle', {
        onEnter: this.warriorIdleEnter,
        onUpdate: this.warriorIdleUpdate
      })
      .addState('run', {
        onEnter: this.warriorRunEnter,
        onUpdate: this.warriorRunUpdate,
        onExit: this.warriorRunExit
      })
      .addState('attack', {
        onEnter: this.warriorAttackEnter
      })
      .addState('dead', {
        onEnter: this.warriorDeadEnter
      });

    this.warriorStateMachine.setState('idle');
  }

  private lateUpdate(time: number, delta: number) {
    this.components.update(time, delta);
  }

  private warriorIdleEnter() {
    const sprite = this.spriteRepresentationComponent.sprite;
    SpriteAnimationHelper.playAnimation(sprite, this.currentAnimGroup, this.currentDir, true);
    // this.setVelocityX(0) // todo remove navigation tween
  }

  private warriorIdleUpdate() {
    if (this.killed) {
      return;
    }
    const sprite = this.spriteRepresentationComponent.sprite;
    SpriteAnimationHelper.playAnimation(sprite, this.currentAnimGroup, this.currentDir, true);
  }

  private warriorRunEnter() {
    const sprite = this.spriteRepresentationComponent.sprite;
    this.currentAnimGroup = LPCAnimTypeEnum.walk;
    SpriteAnimationHelper.playAnimation(sprite, this.currentAnimGroup, this.currentDir, false);
    this.playRunSound();
  }

  private playRunSound() {
    const move = this.pawnDefinition.soundDefinition.move;
    if (!move) return;
    this.characterSoundComponent.play(move, true);
  }

  private warriorRunUpdate() {
    if (this.characterMovementComponent.isMoving || this.killed) {
      return;
    }
    const isAttacking = false; // todo
    if (isAttacking) {
      this.warriorStateMachine.setState('attack');
    } else {
      this.warriorStateMachine.setState('idle');
    }
  }

  private warriorRunExit() {
    const move = this.pawnDefinition.soundDefinition.move;
    if (!move) return;
    this.characterSoundComponent.stop(move);
  }

  private warriorAttackEnter() {
    const sprite = this.spriteRepresentationComponent.sprite;
    this.currentAnimGroup = LPCAnimTypeEnum.thrust; // todo thrust
    SpriteAnimationHelper.playAnimation(sprite, this.currentAnimGroup, this.currentDir, false);

    // todo this.setVelocityX(0)

    // TODO: move sword swing hitbox into place
    // does it need to start part way into the animation?
    const startHit = (anim: Animations.Animation, frame: Animations.AnimationFrame) => {
      if (frame.index != 5) {
        // todo
        return;
      }

      sprite.off(Animations.Events.ANIMATION_UPDATE, startHit);

      console.log('attacked');
    };

    sprite.on(Animations.Events.ANIMATION_UPDATE, startHit);

    sprite.once(Animations.Events.ANIMATION_COMPLETE_KEY, (a: unknown, b: unknown) => {
      // todo
      console.log('animation complete', a, b);
      this.warriorStateMachine.setState('idle');

      // TODO: hide and remove the sword swing hitbox
      // this.swordHitbox.body.enable = false;
      // this.physics.world.remove(this.swordHitbox.body);
    });
  }

  private warriorDeadEnter() {
    const sprite = this.spriteRepresentationComponent.sprite;
    this.currentAnimGroup = LPCAnimTypeEnum.hurt;
    SpriteAnimationHelper.playAnimation(sprite, this.currentAnimGroup, this.currentDir, false);
    this.playDeathSound();
  }

  private playDeathSound() {
    const death = this.pawnDefinition.soundDefinition.death;
    if (!death) return;
    this.characterSoundComponent.play(death);
  }
}
