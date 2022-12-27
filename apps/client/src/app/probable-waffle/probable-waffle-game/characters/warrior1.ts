import * as Phaser from 'phaser';
import {
  AnimDirection,
  AnimDirectionEnum,
  IsoAngleToAnimDirectionEnum,
  LPCAnimType,
  LPCAnimTypeEnum
} from '../animation/lpc-animation-helper';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { SpriteHelper } from '../sprite/sprite-helper';
import ComponentService from '../services/component.service';
import UiBarComponent from '../hud/ui-bar-component';
import { StateMachine } from '../animation/state-machine';
import { CharacterNavigationComponent, MoveEventTypeEnum } from './character-navigation-component';
import { CharacterSoundComponent } from './character-sound-component';

export enum Warrior1SoundEnum {
  'move' = 'move'
}

export interface PlaceableCharacter {
  tilePlacementData: TilePlacementData;
}

export class Warrior1 extends Phaser.GameObjects.Sprite implements PlaceableCharacter {
  static readonly textureName = 'warrior1';
  static readonly spriteSheet = {
    name: Warrior1.textureName,
    frameConfig: {
      frameWidth: 64,
      frameHeight: 64
    }
  };

  currentDir = AnimDirectionEnum.south;
  currentAnimGroup = LPCAnimTypeEnum.walk;
  tilePlacementData!: TilePlacementData;

  components!: ComponentService;

  private knightStateMachine!: StateMachine;
  private characterSoundComponent!: CharacterSoundComponent;
  private characterNavComponent!: CharacterNavigationComponent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, Warrior1.textureName);
    this.components = new ComponentService(this);
    this.components.addComponent(new UiBarComponent());
    this.characterNavComponent = this.components.addComponent(new CharacterNavigationComponent());
    this.characterSoundComponent = this.components.addComponent(new CharacterSoundComponent());

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
      this.components.destroy();
    });
    this.characterNavComponent.moveEventEmitter.on(MoveEventTypeEnum.MOVE_PROGRESS, (isoAngleRounded: number) =>
      this.playMoveAnim(IsoAngleToAnimDirectionEnum[isoAngleRounded.toString()])
    );
  }

  static playAnimation(sprite: Phaser.GameObjects.Sprite, animName: LPCAnimType, dir: AnimDirection, idle: boolean) {
    sprite.play(`${animName}-${dir}` + (idle ? '-idle' : ''));
  }

  createCallback(tilePlacementData: TilePlacementData) {
    this.tilePlacementData = tilePlacementData;

    const spriteWorldPlacementInfo = SpriteHelper.getSpriteWorldPlacementInfo(tilePlacementData);
    this.depth = spriteWorldPlacementInfo.depth;

    this.setInteractive();

    this.knightStateMachine = new StateMachine(this, 'knight') // todo some unique id?
      .addState('idle', {
        onEnter: this.knightIdleEnter,
        onUpdate: this.knightIdleUpdate
      })
      .addState('run', {
        onEnter: this.knightRunEnter,
        onUpdate: this.knightRunUpdate,
        onExit: this.knightRunExit
      })
      .addState('attack', {
        onEnter: this.knightAttackEnter
      });

    this.knightStateMachine.setState('idle');
  }

  private lateUpdate(time: number, delta: number) {
    this.components.update(time, delta);
  }

  override update(t: number, dt: number) {
    this.knightStateMachine.update(dt);
  }

  private knightIdleEnter() {
    Warrior1.playAnimation(this, this.currentAnimGroup, this.currentDir, true);
    // this.setVelocityX(0) // todo remove navigation tween
  }

  private knightIdleUpdate() {
    Warrior1.playAnimation(this, this.currentAnimGroup, this.currentDir, true);
  }

  private knightRunEnter() {
    this.currentAnimGroup = LPCAnimTypeEnum.walk;
    Warrior1.playAnimation(this, this.currentAnimGroup, this.currentDir, false);
    this.playRunSound();
  }

  private playRunSound() {
    this.characterSoundComponent.play(Warrior1SoundEnum.move, true);
  }

  private knightRunUpdate() {
    if (this.characterNavComponent.isMoving) {
      return;
    }
    const isAttacking = false; // todo
    if (isAttacking) {
      this.knightStateMachine.setState('attack');
    }
    // todo else if (isMoving)
    // todo {
    // todo   this.knight.setVelocityX(-300)
    // todo   this.knight.flipX = true
    // todo }
    // todo else if (isMoving)
    // todo {
    // todo   this.knight.flipX = false
    // todo   this.knight.setVelocityX(300)
    // todo }
    else {
      this.knightStateMachine.setState('idle');
    }
  }

  private knightRunExit() {
    this.characterSoundComponent.stop(Warrior1SoundEnum.move);
  }

  private knightAttackEnter() {
    this.currentAnimGroup = LPCAnimTypeEnum.thrust; // todo thrust
    Warrior1.playAnimation(this, this.currentAnimGroup, this.currentDir, false);

    // todo this.setVelocityX(0)

    // TODO: move sword swing hitbox into place
    // does it need to start part way into the animation?
    const startHit = (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (frame.index != 5) {
        // todo
        return;
      }

      this.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit);

      console.log('attacked');
    };

    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, startHit);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY, (a: unknown, b: unknown) => {
      // todo
      console.log('animation complete', a, b);
      this.knightStateMachine.setState('idle');

      // TODO: hide and remove the sword swing hitbox
      // this.swordHitbox.body.enable = false;
      // this.physics.world.remove(this.swordHitbox.body);
    });
  }

  playMoveAnim(dir: AnimDirection) {
    const prevDir = this.currentDir;
    this.currentDir = dir;
    // if state is "run" and currentDir is different, then change direction
    if (this.knightStateMachine.isCurrentState('run') && prevDir !== dir) {
      this.knightRunEnter();
    }
    this.knightStateMachine.setState('run');
  }
}
