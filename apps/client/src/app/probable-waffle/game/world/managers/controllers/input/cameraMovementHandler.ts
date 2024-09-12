import { Cameras, Geom, Input, Types } from "phaser";
import GameProbableWaffleScene from "../../../../scenes/GameProbableWaffleScene";

export class CameraMovementHandler {
  private readonly enabledMouseCornerMovement = false;
  private readonly lockToScreen = false; // todo could be enabled later - need to move cursor manually in phaser
  private readonly input: Input.InputPlugin;
  private readonly mainCamera: Cameras.Scene2D.Camera;
  private cursorOverGameInstance = false;
  private keyboardMovementControls: Cameras.Controls.FixedKeyControl | null = null;
  private readonly cameraEdgeMargin = 30;
  private readonly cameraMinZoom = 30;
  private readonly cameraMaxZoom = 0.3;
  private readonly recommendedZoom = 1;
  private readonly cameraZoomFactor = 0.1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: {
      cameraEdgeMovementSpeed: number;
      cameraKeyboardMovementSpeed: number;
    } = {
      cameraEdgeMovementSpeed: 5,
      cameraKeyboardMovementSpeed: 2
    }
  ) {
    this.mainCamera = scene.cameras.main;
    this.input = scene.input;
    this.createKeyboardControls();
    this.zoomListener();
    this.screenEdgeListener();
    this.lockCursorToScreen();
    this.scene.events.on(Phaser.Scenes.Events.CREATE, this.create, this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
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

  update(time: number, delta: number) {
    this.keyboardMovementControls?.update(delta);
    this.screenEdgeMovementUpdate();
  }

  destroy() {
    this.input.off(Input.Events.GAME_OUT);
    this.input.off(Input.Events.GAME_OVER);
    this.input.off(Input.Events.POINTER_WHEEL, this.zoomWithScrollHandler);
    this.keyboardMovementControls?.destroy();
  }

  private createKeyboardControls() {
    if (!this.input.keyboard) return;
    const cursors = this.input.keyboard.createCursorKeys();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const wasdKeys = this.input.keyboard.addKeys({
      up: Input.Keyboard.KeyCodes.W,
      left: Input.Keyboard.KeyCodes.A,
      down: Input.Keyboard.KeyCodes.S,
      right: Input.Keyboard.KeyCodes.D
    }) satisfies Partial<Types.Input.Keyboard.CursorKeys>;

    // wasdKey can also be used here
    const controlConfig: Types.Cameras.Controls.FixedKeyControlConfig = {
      camera: this.mainCamera,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      speed: this.config.cameraKeyboardMovementSpeed
    };

    this.keyboardMovementControls = new Cameras.Controls.FixedKeyControl(controlConfig);
  }

  private screenEdgeMovementUpdate() {
    if (!this.enabledMouseCornerMovement) return;
    if (!this.cursorOverGameInstance) return;

    const pointer = this.input.activePointer;
    if (pointer.x < this.cameraEdgeMargin) {
      this.mainCamera.scrollX -= this.config.cameraEdgeMovementSpeed;
    }
    if (pointer.x > this.mainCamera.width - this.cameraEdgeMargin) {
      this.mainCamera.scrollX += this.config.cameraEdgeMovementSpeed;
    }
    if (pointer.y < this.cameraEdgeMargin) {
      this.mainCamera.scrollY -= this.config.cameraEdgeMovementSpeed;
    }
    if (pointer.y > this.mainCamera.height - this.cameraEdgeMargin) {
      this.mainCamera.scrollY += this.config.cameraEdgeMovementSpeed;
    }
  }

  private zoomListener() {
    this.input.on(Input.Events.POINTER_WHEEL, this.zoomWithScrollHandler, this);
  }

  private zoomWithScrollHandler(
    pointer: Input.Pointer,
    gameObjects: unknown,
    deltaX: number,
    deltaY: number,
    deltaZ: number
  ) {
    if (deltaY > 0) {
      this.zoomOut();
    }

    if (deltaY < 0) {
      this.zoomIn();
    }
  }

  private zoomIn(): void {
    const newZoom = this.mainCamera.zoom * 2;
    const validZoom = this.findNearestValidZoom(newZoom);

    if (validZoom <= this.cameraMinZoom) {
      this.mainCamera.zoom = validZoom;
    }
  }

  private zoomOut(): void {
    const newZoom = this.mainCamera.zoom * 0.5;
    const validZoom = this.findNearestValidZoom(newZoom);

    if (validZoom >= this.cameraMaxZoom) {
      this.mainCamera.zoom = validZoom;
    }
    if (this.isCameraOutOfBounds) {
      this.zoomIn();
    }
  }

  private findNearestValidZoom(zoom: number): number {
    const powersOfTwo = [0.5, 1, 2, 4, 8];
    let nearest = powersOfTwo[0];
    for (const power of powersOfTwo) {
      if (Math.abs(zoom - power) < Math.abs(zoom - nearest)) {
        nearest = power;
      }
    }
    return nearest;
  }

  /**
   * Zoom related
   * So when the camera is zoomed out, we re-calc camera "worldView" so bounds can be checked.
   * This worldView is recalculated in Phaser.Cameras.Scene2D.Camera#preRender, but that is too late.
   * This is where the code is taken from.
   */
  private recalculateCameraWorldView(): Geom.Rectangle {
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

    return new Geom.Rectangle(midX - displayWidth / 2, midY - displayHeight / 2, displayWidth, displayHeight);
  }

  private screenEdgeListener() {
    this.input.on(Input.Events.GAME_OUT, () => {
      this.cursorOverGameInstance = false;
    });
    this.input.on(Input.Events.GAME_OVER, () => {
      this.cursorOverGameInstance = true;
    });
  }

  /**
   * https://phaser.io/examples/v3/view/input/mouse/pointer-lock
   * https://web.dev/articles/pointerlock-intro
   */
  private lockCursorToScreen() {
    if (!this.lockToScreen) return;
    if (this.input.keyboard && this.input.mouse) {
      this.input.on("pointerdown", () => {
        if (this.input.mouse && !this.input.mouse.locked) {
          this.input.mouse?.requestPointerLock();
        }
      });
      this.input.manager.events.on("pointerlockchange", (event: any) => {
        const pointerIsLocked = this.input.mouse?.locked;
        console.log("pointerIsLocked", pointerIsLocked);
      });

      // on esc, release pointer lock
      this.input.keyboard.on("keydown_ESC", () => {
        // todo maybe change this event
        if (this.input.mouse?.locked) {
          this.input.mouse.releasePointerLock();
        }
      });
    }
  }

  private create() {
    this.centerCamera();
  }

  private centerCamera() {
    // try to find current player
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    const initialWorldSpawnPosition =
      gameScene.player.playerController.data.playerDefinition?.initialWorldSpawnPosition;
    if (initialWorldSpawnPosition) {
      this.mainCamera.scrollX = initialWorldSpawnPosition.x;
      this.mainCamera.scrollY = initialWorldSpawnPosition.y;
      console.error("Todo not working fully because of some weird offset -.-");
    }
  }
}
