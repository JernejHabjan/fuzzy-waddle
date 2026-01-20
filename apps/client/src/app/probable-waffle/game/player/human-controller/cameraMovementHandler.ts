import { Cameras, Geom, Input, type Types } from "phaser";
import GameProbableWaffleScene from "../../world/scenes/GameProbableWaffleScene";
import { Subscription } from "rxjs";
import { getSceneExternalComponent } from "../../world/services/scene-component-helpers";
import { OptionsService } from "../../../gui/options/options.service";
import { GameSettings } from "../../core/gameSettings";
import type { CameraStateData } from "@fuzzy-waddle/api-interfaces";

export interface CameraMovementHandlerConfig {
  cameraEdgeMovementSpeed: number;
  cameraKeyboardMovementSpeed: number;
  enabledMouseCornerMovement?: boolean;
}

export class CameraMovementHandler {
  private readonly input: Input.InputPlugin;
  private readonly mainCamera: Cameras.Scene2D.Camera;
  private cursorOverGameInstance = false;
  private keyboardMovementControls: Cameras.Controls.FixedKeyControl | null = null;
  private readonly cameraEdgeMargin = 30;
  private readonly cameraMinZoom = 30;
  private readonly cameraMaxZoom = 0.3;
  private optionsChangedSubscription?: Subscription;

  constructor(
    private readonly scene: Phaser.Scene,
    private config: CameraMovementHandlerConfig = {
      cameraEdgeMovementSpeed: 30,
      cameraKeyboardMovementSpeed: 2
    }
  ) {
    this.mainCamera = scene.cameras.main;
    this.input = scene.input;
    this.createKeyboardControls();
    this.createPointerControls();
    this.zoomListener();
    this.screenEdgeListener();
    this.scene.events.on(Phaser.Scenes.Events.CREATE, this.create, this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.subscribeToOptions();
  }

  setConfig(config: Partial<CameraMovementHandlerConfig>) {
    this.config = { ...this.config, ...config };
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

  update(_: number, delta: number) {
    this.keyboardMovementControls?.update(delta);
    this.screenEdgeMovementUpdate();
  }

  destroy() {
    this.input.off(Input.Events.GAME_OUT);
    this.input.off(Input.Events.GAME_OVER);
    this.input.off(Input.Events.POINTER_WHEEL, this.zoomWithScrollHandler);
    this.input.on(Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.input.on(Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.keyboardMovementControls?.destroy();
    this.optionsChangedSubscription?.unsubscribe();
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

  /**
   * Creates pointer controls for camera movement (dragging) on mobile
   */
  private createPointerControls() {
    const isMobile = this.scene.game.device.os.android || this.scene.game.device.os.iOS;
    if (!isMobile) return;
    this.input.on(Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.input.on(Input.Events.POINTER_UP, this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Input.Pointer) {
    if (!pointer.leftButtonDown()) return;
    this.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
  }

  private handlePointerMove(pointer: Input.Pointer) {
    if (!pointer.isDown) return;

    // Calculate movement based on the difference between current and previous pointer positions
    const deltaX = pointer.x - pointer.prevPosition.x;
    const deltaY = pointer.y - pointer.prevPosition.y;

    // Adjust the scroll amount based on the camera's zoom level
    this.mainCamera.scrollX -= deltaX / this.mainCamera.zoom;
    this.mainCamera.scrollY -= deltaY / this.mainCamera.zoom;
  }

  private handlePointerUp(pointer: Input.Pointer) {
    if (pointer.primaryDown) return;
    this.input.off(Input.Events.POINTER_MOVE, this.handlePointerMove);
  }

  private screenEdgeMovementUpdate() {
    if (!this.config.enabledMouseCornerMovement || !this.cursorOverGameInstance) return;

    const pointer = this.input.activePointer;
    const margin = this.cameraEdgeMargin;
    const speed = this.config.cameraEdgeMovementSpeed;
    const { width, height } = this.mainCamera;

    // Left
    if (pointer.x < margin) {
      const factor = 1 - pointer.x / margin;
      this.mainCamera.scrollX -= speed * factor;
    }
    // Right
    if (pointer.x > width - margin) {
      const factor = (pointer.x - (width - margin)) / margin;
      this.mainCamera.scrollX += speed * factor;
    }
    // Top
    if (pointer.y < margin) {
      const factor = 1 - pointer.y / margin;
      this.mainCamera.scrollY -= speed * factor;
    }
    // Bottom
    if (pointer.y > height - margin) {
      const factor = (pointer.y - (height - margin)) / margin;
      this.mainCamera.scrollY += speed * factor;
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
    let nearest = powersOfTwo[0]!;
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
      this.input.off(Input.Events.POINTER_MOVE, this.handlePointerMove);
    });
    this.input.on(Input.Events.GAME_OVER, () => {
      this.cursorOverGameInstance = true;
    });
  }

  private subscribeToOptions() {
    const optionsService = getSceneExternalComponent(this.scene, OptionsService);
    this.optionsChangedSubscription = optionsService?.settingsChanged.subscribe((change) => {
      if (change.type === "game") {
        const newGameSettings = change.payload as GameSettings;
        this.setConfig({
          enabledMouseCornerMovement: newGameSettings.enabledMouseCornerMovement
        });
      }
    });
  }

  private create() {
    this.centerCameraOnSpawnPoint();
  }

  private centerCameraOnSpawnPoint() {
    // try to find current player
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    const initialWorldSpawnPosition =
      gameScene.player.playerController.data.playerDefinition?.initialWorldLogicalSpawnPosition;
    if (initialWorldSpawnPosition) {
      this.mainCamera.scrollX = initialWorldSpawnPosition.x - this.mainCamera.width / 2;
      this.mainCamera.scrollY = initialWorldSpawnPosition.y - this.mainCamera.height / 2;
      this.clampCameraToBounds();
    }
  }

  /**
   * Clamps the camera position to stay within the defined bounds.
   * Uses isCameraOutOfBounds to check if clamping is needed.
   */
  private clampCameraToBounds(): void {
    if (!this.mainCamera.useBounds) return;
    if (!this.isCameraOutOfBounds) return;

    const bounds = this.mainCamera.getBounds();
    const worldView = this.recalculateCameraWorldView();

    // Clamp camera position to bounds
    if (worldView.left < bounds.left) {
      this.mainCamera.scrollX = bounds.left + worldView.width / 2;
    }
    if (worldView.right > bounds.right) {
      this.mainCamera.scrollX = bounds.right - worldView.width / 2;
    }
    if (worldView.top < bounds.top) {
      this.mainCamera.scrollY = bounds.top + worldView.height / 2;
    }
    if (worldView.bottom > bounds.bottom) {
      this.mainCamera.scrollY = bounds.bottom - worldView.height / 2;
    }
  }

  /**
   * Get the current camera state for saving.
   */
  getCameraState(): CameraStateData {
    return {
      scrollX: this.mainCamera.scrollX,
      scrollY: this.mainCamera.scrollY,
      zoom: this.mainCamera.zoom
    };
  }

  /**
   * Set camera state from saved data.
   * Validates camera bounds to ensure the camera is within valid range.
   */
  setCameraState(state: CameraStateData): void {
    if (state.zoom !== undefined && state.zoom >= this.cameraMaxZoom && state.zoom <= this.cameraMinZoom) {
      this.mainCamera.zoom = this.findNearestValidZoom(state.zoom);
    }

    if (state.scrollX !== undefined) {
      this.mainCamera.scrollX = state.scrollX;
    }

    if (state.scrollY !== undefined) {
      this.mainCamera.scrollY = state.scrollY;
    }

    this.clampCameraToBounds();
  }
}
