import LittleMuncherScene from './little-muncher-scene';

export class PlayerInputController {
  constructor(private readonly littleMuncherScene: LittleMuncherScene) {}

  init(character: any) {
    // todo restrict to type
    this.littleMuncherScene.subscribe(
      this.littleMuncherScene.communicator.key?.onWithInitial(
        () => this.setPosition(character),
        (position) => (this.littleMuncherScene.player.playerState.position = position)
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
            this.littleMuncherScene.player.playerState.position,
            () => this.setPosition(character)
          );
        }
      });
    }
  }

  private manageKeyboardEvent(key: string): boolean {
    const position = this.littleMuncherScene.player.playerState.position;
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

  private setPosition = (character: any) => {
    // todo restrict to type
    const position = this.littleMuncherScene.player.playerState.position;

    const width = this.littleMuncherScene.game.scale.width;
    const height = this.littleMuncherScene.game.scale.height;
    // set y to first 1/8 from bottom up
    const y = height - height / 8;
    // if x is 0, set it to middle of screen
    // if -1 set it to 1/3 from left
    // if 1 set it to 2/3 from left
    const x = width / 2 + (position.x * width) / 6;

    character.setPosition(x, y);
  };
}
