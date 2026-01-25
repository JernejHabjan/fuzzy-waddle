import { Input } from "phaser";
import { CursorHandler } from "./cursor.handler";
import { Subscription } from "rxjs";
import { getSceneExternalComponent } from "../../world/services/scene-component-helpers";
import { OptionsService } from "../../../gui/options/options.service";
import { GameSettings } from "../../core/gameSettings";

export class LockedCursorHandler {
  private lockToScreen: boolean;
  private readonly input: Input.InputPlugin;

  private customCursor: Phaser.GameObjects.Graphics | null = null;
  private cursorPosition = { x: 0, y: 0 };
  private optionsChangedSubscription?: Subscription;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cursorHandler: CursorHandler,
    lockToScreen: boolean = false
  ) {
    this.lockToScreen = lockToScreen;
    this.input = scene.input;
    this.setupListeners();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.subscribeToOptions();
  }

  setConfig(config: { lockToScreen: boolean }) {
    if (this.lockToScreen === config.lockToScreen) return;
    this.lockToScreen = config.lockToScreen;
    if (this.lockToScreen) {
      this.setupListeners();
    } else {
      this.removeListeners();
      if (this.input.mouse?.locked) {
        this.input.mouse.releasePointerLock();
      }
    }
  }

  /**
   * https://phaser.io/examples/v3/view/input/mouse/pointer-lock
   * https://web.dev/articles/pointerlock-intro
   */
  private setupListeners() {
    if (!this.lockToScreen) return;
    if (!this.input.keyboard || !this.input.mouse) return;
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.manager.events.on("pointerlockchange", this.pointerLockChangeHandler, this);
    this.input.keyboard.on("keydown_ESC", this.onEscKeyDown, this);
  }

  private removeListeners() {
    this.input.off("pointerdown", this.onPointerDown, this);
    this.input.off("pointermove", this.onPointerMove, this);
    this.input.manager.events.off("pointerlockchange", this.pointerLockChangeHandler, this);
    this.input.keyboard?.off("keydown_ESC", this.onEscKeyDown, this);
  }

  /**
   * On Esc, release pointer lock (browsers handle this automatically, but you can also use Q)
   */
  private onEscKeyDown() {
    LockedCursorHandler.releasePointerLock(this.input);
  }

  /**
   * Request pointer lock on pointer down
   */
  private onPointerDown() {
    if (!this.input.mouse || this.input.mouse.locked) return;
    this.input.mouse.requestPointerLock();
  }

  /**
   * Handle pointer movement while the mouse is locked
   * This updates the custom cursor position based on pointer movement deltas
   *
   * Note: Phaser's pointer position is automatically updated via the patched Pointer.move() method
   * (see apps/client/src/app/shared/game/phaser/patches/pointer-lock-patch.ts)
   * We only need to update the visual cursor position here
   */
  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.input.mouse?.locked || !this.customCursor) return;
    // Update cursor position using movement deltas
    this.cursorPosition.x += pointer.movementX;
    this.cursorPosition.y += pointer.movementY;

    // Clamp cursor position to screen bounds
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;

    this.cursorPosition.x = Phaser.Math.Clamp(this.cursorPosition.x, 0, gameWidth);
    this.cursorPosition.y = Phaser.Math.Clamp(this.cursorPosition.y, 0, gameHeight);

    // Update the visual cursor position
    this.customCursor.setPosition(this.cursorPosition.x, this.cursorPosition.y);
  }

  /**
   * Listen for pointer lock change event
   */
  private pointerLockChangeHandler() {
    const pointerIsLocked = this.input.mouse?.locked;

    if (pointerIsLocked) {
      this.createCustomCursor(); // Create the custom cursor when pointer is locked
    } else {
      this.destroyCustomCursor(); // Destroy the custom cursor when pointer is unlocked
    }
  }

  private destroyCustomCursor() {
    if (!this.customCursor) return;
    this.customCursor.destroy();
    this.customCursor = null;
  }

  private createCustomCursor() {
    if (!this.cursorHandler) return;
    this.destroyCustomCursor(); // Ensure we don't create multiple cursors

    const url = this.cursorHandler.getCurrentCursorUrl(); // todo - use this cursor instead - maybe you need to convert it to png first

    this.customCursor = this.scene.add.graphics({ fillStyle: { color: 0xffffff } });
    this.customCursor.fillCircle(0, 0, 5); // Draw a small white circle as the cursor
    this.customCursor.setDepth(100); // Ensure it's on top

    // Initialize cursor position to current pointer position
    const pointerX = this.input.activePointer.x;
    const pointerY = this.input.activePointer.y;

    this.cursorPosition = { x: pointerX, y: pointerY };
    this.customCursor.setPosition(this.cursorPosition.x, this.cursorPosition.y);
  }

  destroy() {
    this.destroyCustomCursor();
    this.removeListeners();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.optionsChangedSubscription?.unsubscribe();
  }

  private subscribeToOptions() {
    const optionsService = getSceneExternalComponent(this.scene, OptionsService);
    this.optionsChangedSubscription = optionsService?.settingsChanged.subscribe((change) => {
      if (change.type === "game") {
        const newGameSettings = change.payload as GameSettings;
        this.setConfig({
          lockToScreen: newGameSettings.lockToScreen
        });
      }
    });
  }

  static releasePointerLock(input: Input.InputPlugin) {
    if (!input.mouse?.locked) return;
    input.mouse.releasePointerLock();
  }
}
