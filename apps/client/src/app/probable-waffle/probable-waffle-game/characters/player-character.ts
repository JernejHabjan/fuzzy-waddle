import * as Phaser from 'phaser';
import {
  AnimDirection,
  AnimDirectionEnum,
  IsoAngleToAnimDirectionEnum,
  LPCAnimTypeEnum
} from '../animation/lpc-animation-helper';
import HealthComponent, { HealthDefinition } from './combat/health-component';
import { StateMachine } from '../animation/state-machine';
import { MoveEventTypeEnum } from './character-movement-component';
import { CharacterSoundComponent, SoundDefinition } from './character-sound-component';
import { MovableActor, TextureMapDefinition } from './movable-actor';
import { Blackboard } from './AI/blackboard';
import { RtsBehaviorTree } from './AI/rts-behavior-tree';
import { BehaviorTreeClasses } from './AI/behavior-trees';
import { SpriteAnimationHelper } from '../animation/sprite-animation-helper';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';

export type PlayerCharacterDefinition = {
  healthDefinition: HealthDefinition;
  soundDefinition: SoundDefinition;
  textureMapDefinition: TextureMapDefinition;
};

export abstract class PlayerCharacter extends MovableActor {
  behaviorTreeClass: BehaviorTreeClasses = RtsBehaviorTree;
  blackboardClass: typeof Blackboard = Blackboard;
  currentDir = AnimDirectionEnum.south;
  currentAnimGroup = LPCAnimTypeEnum.walk;
  private warriorStateMachine!: StateMachine;
  private characterSoundComponent!: CharacterSoundComponent;
  abstract playerCharacterDefinition: PlayerCharacterDefinition;
  textureMapDefinition!: TextureMapDefinition;

  // making constructor public
  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }

  override init() {
    // set this before calling super.init()
    this.textureMapDefinition = this.playerCharacterDefinition.textureMapDefinition;

    super.init();
    this.spriteRepresentationComponent.sprite.setInteractive();
    this.initStateMachine();
    this.initComponents();
    this.subscribeToEvents();
  }

  private initComponents() {
    this.components.addComponent(new HealthComponent(this.sprite, this.playerCharacterDefinition.healthDefinition));
    this.characterSoundComponent = this.components.addComponent(new CharacterSoundComponent(this.sprite));
  }

  private subscribeToEvents() {
    this.characterMovementComponent.moveEventEmitter.on(MoveEventTypeEnum.MOVE_PROGRESS, this.onMoveProgress, this);
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.characterMovementComponent.moveEventEmitter.off(MoveEventTypeEnum.MOVE_PROGRESS, this.onMoveProgress, this);
      this.destroy();
    });
  }

  private onMoveProgress(isoAngleRounded: number) {
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
      });

    this.warriorStateMachine.setState('idle');
  }

  private lateUpdate(time: number, delta: number) {
    this.components.update(time, delta);
  }

  override update(t: number, dt: number) {
    super.update(t, dt);
    this.warriorStateMachine.update(dt);
  }

  private warriorIdleEnter() {
    SpriteAnimationHelper.playAnimation(this.sprite, this.currentAnimGroup, this.currentDir, true);
    // this.setVelocityX(0) // todo remove navigation tween
  }

  private warriorIdleUpdate() {
    SpriteAnimationHelper.playAnimation(this.sprite, this.currentAnimGroup, this.currentDir, true);
  }

  private warriorRunEnter() {
    this.currentAnimGroup = LPCAnimTypeEnum.walk;
    SpriteAnimationHelper.playAnimation(this.sprite, this.currentAnimGroup, this.currentDir, false);
    this.playRunSound();
  }

  private playRunSound() {
    const move = this.playerCharacterDefinition.soundDefinition.move;
    if (!move) return;
    this.characterSoundComponent.play(move, true);
  }

  private warriorRunUpdate() {
    if (this.characterMovementComponent.isMoving) {
      return;
    }
    const isAttacking = false; // todo
    if (isAttacking) {
      this.warriorStateMachine.setState('attack');
    }
    // todo else if (isMoving)
    // todo {
    // todo   this.warrior.setVelocityX(-300)
    // todo   this.warrior.flipX = true
    // todo }
    // todo else if (isMoving)
    // todo {
    // todo   this.warrior.flipX = false
    // todo   this.warrior.setVelocityX(300)
    // todo }
    else {
      this.warriorStateMachine.setState('idle');
    }
  }

  private warriorRunExit() {
    const move = this.playerCharacterDefinition.soundDefinition.move;
    if (!move) return;
    this.characterSoundComponent.stop(move);
  }

  private warriorAttackEnter() {
    this.currentAnimGroup = LPCAnimTypeEnum.thrust; // todo thrust
    SpriteAnimationHelper.playAnimation(this.sprite, this.currentAnimGroup, this.currentDir, false);

    // todo this.setVelocityX(0)

    // TODO: move sword swing hitbox into place
    // does it need to start part way into the animation?
    const startHit = (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (frame.index != 5) {
        // todo
        return;
      }

      this.sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit);

      console.log('attacked');
    };

    this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, startHit);

    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY, (a: unknown, b: unknown) => {
      // todo
      console.log('animation complete', a, b);
      this.warriorStateMachine.setState('idle');

      // TODO: hide and remove the sword swing hitbox
      // this.swordHitbox.body.enable = false;
      // this.physics.world.remove(this.swordHitbox.body);
    });
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
}
