import * as Phaser from 'phaser';

export class InputHandler {
  private readonly enabledMouseCornerMovement = false;
  private readonly input: Phaser.Input.InputPlugin;
  private readonly mainCamera: Phaser.Cameras.Scene2D.Camera;
  private cursorOverGameInstance = false;
  private keyboardMovementControls: Phaser.Cameras.Controls.FixedKeyControl | null = null;
  private readonly cameraEdgeMovementSpeed = 5;
  private readonly cameraEdgeMargin = 30;
  constructor(input: Phaser.Input.InputPlugin, mainCamera: Phaser.Cameras.Scene2D.Camera) {
    this.input = input;
    this.mainCamera = mainCamera;
    this.createKeyboardControls();
    this.zoomListener();
    this.screenEdgeListener();
  }


  private createKeyboardControls() {
    if (!this.input.keyboard) return;
    const cursors = this.input.keyboard.createCursorKeys();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as Phaser.Types.Input.Keyboard.CursorKeys;

    // wasdKey can also be used here
    const controlConfig: Phaser.Types.Cameras.Controls.FixedKeyControlConfig = {
      camera: this.mainCamera,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      speed: 1
    };

    this.keyboardMovementControls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);
  }

  private screenEdgeMovementUpdate() {
    if(!this.enabledMouseCornerMovement) return;
    if (!this.cursorOverGameInstance) return;

    const pointer = this.input.activePointer;
    if (pointer.x < this.cameraEdgeMargin) {
      this.mainCamera.scrollX -= this.cameraEdgeMovementSpeed;
    }
    if (pointer.x > this.mainCamera.width - this.cameraEdgeMargin) {
      this.mainCamera.scrollX += this.cameraEdgeMovementSpeed;
    }
    if (pointer.y < this.cameraEdgeMargin) {
      this.mainCamera.scrollY -= this.cameraEdgeMovementSpeed;
    }
    if (pointer.y > this.mainCamera.height - this.cameraEdgeMargin) {
      this.mainCamera.scrollY += this.cameraEdgeMovementSpeed;
    }
  }

  private zoomListener() {
    this.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (pointer: Phaser.Input.Pointer, gameObjects: unknown, deltaX: number, deltaY: number, deltaZ: number) => {
        if (deltaY > 0) {
          // zoom out
          const newZoom = this.mainCamera.zoom - 0.1;
          if (newZoom > 0.3) {
            this.mainCamera.zoom = newZoom;
          }
        }

        if (deltaY < 0) {
          // zoom in
          const newZoom = this.mainCamera.zoom + 0.1;
          if (newZoom < 30) {
            this.mainCamera.zoom = newZoom;
          }
        }
      }
    );
  }


  private screenEdgeListener() {
    this.input.on(Phaser.Input.Events.GAME_OUT, () => {
      this.cursorOverGameInstance = false;
    });
    this.input.on(Phaser.Input.Events.GAME_OVER, () => {
      this.cursorOverGameInstance = true;
    });
  }

  update(time: number, delta: number) {
    this.keyboardMovementControls?.update(delta);
    this.screenEdgeMovementUpdate();
  }

  destroy() {
    this.input.off(Phaser.Input.Events.POINTER_WHEEL);
    this.input.off(Phaser.Input.Events.GAME_OUT);
    this.input.off(Phaser.Input.Events.GAME_OVER);
    this.keyboardMovementControls?.destroy();
  }
}
