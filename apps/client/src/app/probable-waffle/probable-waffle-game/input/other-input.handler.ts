import * as Phaser from 'phaser';

export class OtherInputHandler {
  private input: Phaser.Input.InputPlugin;

  constructor(input: Phaser.Input.InputPlugin) {
    this.input = input;
  }

  bindOtherPossiblyUsefulInputHandlers() {
    this.input.on(
      Phaser.Input.Events.GAMEOBJECT_DOWN,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        console.log(Phaser.Input.Events.GAMEOBJECT_DOWN, pointer, gameObject);

        if (gameObject instanceof Phaser.GameObjects.Sprite || gameObject instanceof Phaser.GameObjects.Image) {
          gameObject.setTint(0xff0000);
        }
      }
    );

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        console.log('right pointer down');

        // this.cameras.main.stopFollow();
      }
    });

    this.input.on(
      Phaser.Input.Events.GAME_OUT,
      () => {
        // todo if (this.portalPlaceholder) {
        // todo   this.hidePortalPlaceholder();
        // todo }
      },
      this
    );
  }

  destroy() {
    this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN);
    this.input.off(Phaser.Input.Events.POINTER_DOWN);
    this.input.off(Phaser.Input.Events.GAME_OUT);
  }
}
