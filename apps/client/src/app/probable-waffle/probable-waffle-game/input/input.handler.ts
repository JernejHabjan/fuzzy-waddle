import * as Phaser from 'phaser';

export class InputHandler {
  private readonly enabledMouseCornerMovement = false;
  private readonly input: Phaser.Input.InputPlugin;
  private readonly mainCamera: Phaser.Cameras.Scene2D.Camera;
  private cursorOverGameInstance = false;
  private keyboardMovementControls: Phaser.Cameras.Controls.FixedKeyControl | null = null;
  private readonly cameraEdgeMovementSpeed = 5;
  private readonly cameraEdgeMargin = 30;
  private readonly cameraMinZoom = 30;
  private readonly cameraMaxZoom = 0.3;
  private readonly recommendedZoom = 1;
  private readonly cameraZoomFactor = 0.1;

  constructor(input: Phaser.Input.InputPlugin, mainCamera: Phaser.Cameras.Scene2D.Camera) {
    this.input = input;
    this.mainCamera = mainCamera;
    this.createKeyboardControls();
    this.zoomListener();
    this.zoomToDefault();
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
    if (!this.enabledMouseCornerMovement) return;
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
          this.zoomOutByFactor();
        }

        if (deltaY < 0) {
          // zoom in
          const newZoom = this.mainCamera.zoom + this.cameraZoomFactor;
          if (newZoom < this.cameraMinZoom) {
            this.mainCamera.zoom = newZoom;
          }
        }
      }
    );
  }

  /**
   * @returns {boolean} true if camera is zoomed out
   */
  private zoomOutByFactor(): boolean {
    const newZoom = this.mainCamera.zoom - this.cameraZoomFactor;
    if (newZoom > this.cameraMaxZoom) {
      this.mainCamera.zoom = newZoom;
    }

    if (this.isCameraOutOfBounds) {
      // if out of bounds, zoom back in
      this.mainCamera.zoom += this.cameraZoomFactor;
      return false;
    }
    return true;
  }

  /**
   * Detect if camera is out of bounds
   */
  get isCameraOutOfBounds(): boolean {
    // detect if camera is out of bounds
    const cameraBounds = this.mainCamera.getBounds();
    const cameraWorldView = this.recalculateCameraWorldView();
    return (
      cameraWorldView.right > cameraBounds.right ||
      cameraWorldView.bottom > cameraBounds.bottom ||
      cameraWorldView.left < cameraBounds.left ||
      cameraWorldView.top < cameraBounds.top
    );
  }

  /**
   * Zoom related
   * So when the camera is zoomed out, we re-calc camera "worldView" so bounds can be checked.
   * This worldView is recalculated in Phaser.Cameras.Scene2D.Camera#preRender, but that is too late.
   * This is where the code is taken from.
   */
  private recalculateCameraWorldView(): Phaser.Geom.Rectangle {
    const width = this.mainCamera.width;
    const height = this.mainCamera.height;

    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;

    const zoomX = this.mainCamera.zoomX;
    const zoomY = this.mainCamera.zoomY;

    let sx = this.mainCamera.scrollX;
    let sy = this.mainCamera.scrollY;

    if (this.mainCamera.useBounds) {
      sx = this.mainCamera.clampX(sx);
      sy = this.mainCamera.clampY(sy);
    }

    const midX = sx + halfWidth;
    const midY = sy + halfHeight;

    const displayWidth = width / zoomX;
    const displayHeight = height / zoomY;

    return new Phaser.Geom.Rectangle(midX - displayWidth / 2, midY - displayHeight / 2, displayWidth, displayHeight);
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

  /**
   * Zooms to recommended zoom. It ensures that camera doesn't go out of bounds
   */
  private zoomToDefault() {
    this.mainCamera.setZoom(this.cameraMinZoom);
    while (this.mainCamera.zoom > this.recommendedZoom && this.zoomOutByFactor()) {
      // zoom out until camera is out of bounds or we reached recommended zoom
    }
  }
}
