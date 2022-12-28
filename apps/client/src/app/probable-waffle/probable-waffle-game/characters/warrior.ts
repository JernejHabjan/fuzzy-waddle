import * as Phaser from 'phaser';
import {
  AnimDirection,
  AnimDirectionEnum,
  IsoAngleToAnimDirectionEnum,
  LPCAnimType,
  LPCAnimTypeEnum
} from '../animation/lpc-animation-helper';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import HealthComponent from './combat/health-component';
import { StateMachine } from '../animation/state-machine';
import { MoveEventTypeEnum } from './character-movement-component';
import { CharacterSoundComponent } from './character-sound-component';
import { Character } from './character';

export enum WarriorSoundEnum {
  'move' = 'move'
}

export const WarriorTextureMap = {
  // todo move this to a config file
  textureName: 'warrior',
  spriteSheet: {
    name: 'warrior',
    frameConfig: {
      frameWidth: 64,
      frameHeight: 64
    }
  }
};

export const WarriorDefinition = {
  // todo where to move this?
  health: 100
};

export class Warrior extends Character {
  currentDir = AnimDirectionEnum.south;
  currentAnimGroup = LPCAnimTypeEnum.walk;
  private warriorStateMachine!: StateMachine;
  private characterSoundComponent!: CharacterSoundComponent;

  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData) {
    super(scene, {
      textureName: WarriorTextureMap.textureName,
      tilePlacementData
    });
    this.spriteRepresentationComponent.sprite.setInteractive();
    this.initStateMachine();
    this.initComponents();
    this.subscribeToEvents();
  }

  static playAnimation(sprite: Phaser.GameObjects.Sprite, animName: LPCAnimType, dir: AnimDirection, idle: boolean) {
    sprite.play(`${animName}-${dir}` + (idle ? '-idle' : ''));
  }

  private initComponents() {
    this.components.addComponent(new HealthComponent(this.sprite, WarriorDefinition.health));
    this.characterSoundComponent = this.components.addComponent(new CharacterSoundComponent(this.sprite));
  }

  private subscribeToEvents() {
    this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
    this.characterMovementComponent.moveEventEmitter.on(MoveEventTypeEnum.MOVE_PROGRESS, this.onMoveProgress, this);
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
      this.components.destroy();
      this.characterMovementComponent.moveEventEmitter.off(MoveEventTypeEnum.MOVE_PROGRESS, this.onMoveProgress, this);
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
    this.warriorStateMachine.update(dt);
  }

  private warriorIdleEnter() {
    Warrior.playAnimation(this.sprite, this.currentAnimGroup, this.currentDir, true);
    // this.setVelocityX(0) // todo remove navigation tween
  }

  private warriorIdleUpdate() {
    Warrior.playAnimation(this.sprite, this.currentAnimGroup, this.currentDir, true);
  }

  private warriorRunEnter() {
    this.currentAnimGroup = LPCAnimTypeEnum.walk;
    Warrior.playAnimation(this.sprite, this.currentAnimGroup, this.currentDir, false);
    this.playRunSound();
  }

  private playRunSound() {
    this.characterSoundComponent.play(WarriorSoundEnum.move, true);
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
    this.characterSoundComponent.stop(WarriorSoundEnum.move);
  }

  private warriorAttackEnter() {
    this.currentAnimGroup = LPCAnimTypeEnum.thrust; // todo thrust
    Warrior.playAnimation(this.sprite, this.currentAnimGroup, this.currentDir, false);

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
