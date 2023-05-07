import LittleMuncherScene from './little-muncher-scene';
import { Subscription } from 'rxjs';

export class PlayerInputController {
  private subscriptions: Subscription[] = [];

  constructor(private readonly littleMuncherScene: LittleMuncherScene) {}

  private character!: Phaser.GameObjects.Sprite;

  init(character: Phaser.GameObjects.Sprite) {
    this.character = character;
    this.littleMuncherScene.subscribe(
      this.littleMuncherScene.communicator.key?.onWithInitial(
        this.setPosition,
        (position) => (this.littleMuncherScene.player.playerState.data.position = position)
      )
    );

    if (this.littleMuncherScene.input.keyboard == null) {
      return;
    }
    if (this.littleMuncherScene.isPlayer) {
      this.littleMuncherScene.input.keyboard.createCursorKeys();
      this.littleMuncherScene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        const validKeyboardEvent = this.manageKeyboardEvent(event.key);
        if (validKeyboardEvent) {
          this.littleMuncherScene.communicator.key?.sendWithStateChange(
            this.littleMuncherScene.player.playerState.data.position,
            this.setPosition
          );
        }
      });
    }
    this.registerEvents();
  }

  private registerEvents() {
    this.subscriptions = [
      this.littleMuncherScene.onDestroy.subscribe(this.destroy),
      this.littleMuncherScene.onResize.subscribe(this.setPosition)
    ];
  }

  private manageKeyboardEvent(key: string): boolean {
    const position = this.littleMuncherScene.player.playerState.data.position;
    switch (key) {
      case 'ArrowLeft':
        position.x = Phaser.Math.Clamp(position.x - 1, -1, 1);
        break;
      case 'ArrowRight':
        position.x = Phaser.Math.Clamp(position.x + 1, -1, 1);
        break;
      default:
        return false;
    }
    return true;
  }

  private setPosition = () => {
    const position = this.littleMuncherScene.player.playerState.data.position;

    const width = this.littleMuncherScene.game.scale.width;
    const height = this.littleMuncherScene.game.scale.height;
    // set y to first 1/8 from bottom up
    const y = height - height / 8;
    // if x is 0, set it to middle of screen
    // if -1 set it to 1/3 from left
    // if 1 set it to 2/3 from left
    const x = width / 2 + (position.x * width) / 6;

    // todo this.character.setPosition(x, y);
  };

  private destroy = () => {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  };
}
