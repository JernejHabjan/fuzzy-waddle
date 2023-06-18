import { LittleMuncherScene } from './little-muncher-scene';
import { Subscription } from 'rxjs';
import Swipe from 'phaser3-rex-plugins/plugins/input/gestures/swipe/Swipe';

export class PlayerInputController {
  private subscriptions: Subscription[] = [];
  private characterSpeed = 2; // the speed at which the character moves
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys; // variable to store the cursor keys
  private swipeInput!: Swipe & { left: boolean; right: boolean };
  private worldWidth = 0;

  constructor(private readonly littleMuncherScene: LittleMuncherScene) {
    this.swipeInput = new Swipe(littleMuncherScene, { velocityThreshold: 500, dir: 'left&right' }) as Swipe & {
      left: boolean;
      right: boolean;
    };
  }

  private character!: Phaser.GameObjects.Sprite;

  init(character: Phaser.GameObjects.Sprite) {
    this.character = character;
    this.resetPosition();
    this.littleMuncherScene.subscribe(
      this.littleMuncherScene.communicator.move?.onWithInitial(
        this.setPosition,
        (position) => (this.littleMuncherScene.player.playerState.data.position = position)
      )
    );

    this.registerEvents();

    // create the cursor keys
    if (this.littleMuncherScene.isPlayer && this.littleMuncherScene.input.keyboard) {
      this.cursors = this.littleMuncherScene.input.keyboard.createCursorKeys();
    }
  }

  private send() {
    if (!this.littleMuncherScene.isPlayer) {
      return;
    }
    this.littleMuncherScene.communicator.move?.sendWithStateChange(
      this.littleMuncherScene.player.playerState.data.position,
      this.setPosition
    );
  }

  handleCharacterMovement = (worldSpeed: number) => {
    if (!this.littleMuncherScene.isPlayer) {
      return;
    }
    if (!this.cursors || !this.littleMuncherScene.game.device.os.desktop) {
      this.handleSwipe();
      return;
    }
    const position = this.littleMuncherScene.player.playerState.data.position;
    // move the character left or right based on the arrow keys
    if (this.cursors.left.isDown) {
      // move left
      this.character.anims.play('character-walk-left', true);
      this.character.x -= this.characterSpeed * worldSpeed;
      position.x = this.character.x;
      this.send();
    } else if (this.cursors.right.isDown) {
      // move right
      this.character.anims.play('character-walk-right', true);
      this.character.x += this.characterSpeed * worldSpeed;
      position.x = this.character.x;
      this.send();
    } else {
      this.character.anims.play('character-walk-back', true);
    }
  };

  private handleSwipe() {
    if (!this.swipeInput.isSwiped) return;
    // https://codepen.io/rexrainbow/pen/joWZbw

    // check if character is on left or right side of screen or middle
    // if on left, only allow right swipe
    // if on right, only allow left swipe
    const x = Math.round(this.character.x);
    const isCharacterOnLeftSideOfScreen = x < Math.round(this.worldWidth / 2);
    const isCharacterOnRightSideOfScreen = x > Math.round(this.worldWidth / 2);

    const position = this.littleMuncherScene.player.playerState.data.position;
    if (this.swipeInput.right) {
      if (isCharacterOnRightSideOfScreen) return;
      // move character left by 1/3 of screen
      position.x += this.worldWidth / 3;
      this.send();
    } else if (this.swipeInput.left) {
      if (isCharacterOnLeftSideOfScreen) return;
      // move character right by 1/3 of screen
      position.x -= this.worldWidth / 3;
      this.send();
    }
  }

  private registerEvents() {
    this.subscriptions = [
      this.littleMuncherScene.onDestroy.subscribe(this.destroy),
      this.littleMuncherScene.onResize.subscribe(this.resetPosition)
    ];
  }

  private resetPosition = () => {
    const position = this.littleMuncherScene.player.playerState.data.position;
    const height = this.littleMuncherScene.game.scale.height;
    // set y to first 1/8 from bottom up
    this.character.y = height - height / 8;
    if (this.littleMuncherScene.isPlayer) {
      position.x = this.worldWidth / 2;
      this.send();
    } else {
      this.setPosition();
    }
  };

  private setPosition = () => {
    const position = this.littleMuncherScene.player.playerState.data.position;
    this.character.x = position.x;
  };

  private destroy = () => {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  };

  setWorldWidth(worldWidth: number) {
    this.worldWidth = worldWidth;
  }
}
