import { Input } from "phaser";
import { CursorHandler } from "./cursor.handler";

export class LockedCursorHandler {
  private readonly lockToScreen = false;
  private readonly input: Input.InputPlugin;

  private customCursor: Phaser.GameObjects.Graphics | null = null;
  private cursorPosition = { x: 0, y: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cursorHandler: CursorHandler
  ) {
    this.input = scene.input;
    this.lockCursorToScreen();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /**
   * https://phaser.io/examples/v3/view/input/mouse/pointer-lock
   * https://web.dev/articles/pointerlock-intro
   */
  private lockCursorToScreen() {
    if (!this.lockToScreen) return;

    if (!this.input.keyboard || !this.input.mouse) return;
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.manager.events.on("pointerlockchange", this.pointerLockChangeHandler, this);
    this.input.keyboard.on("keydown_ESC", this.onEscKeyDown, this);
  }

  /**
   * On Esc, release pointer lock (browsers handle this automatically, but you can also use Q)
   */
  private onEscKeyDown() {
    if (!this.input.mouse?.locked) return;
    this.input.mouse.releasePointerLock();
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

    this.updateInputPointerPosition();
  }

  /**
   * Update the active pointer position so Phaser's input system knows where the cursor is
   * TODO - seems like there's still an issue with pointer position being automatically set by Phaser on move, overriding my manual updates.
   * TODO - see this: https://github.com/phaserjs/phaser/issues/7153
   */
  private updateInputPointerPosition() {
    if (!this.customCursor) return;
    this.input.activePointer.position.set(this.cursorPosition.x, this.cursorPosition.y);
    const camera = this.scene.cameras.main;
    this.input.activePointer.updateWorldPoint(camera);
  }

  /**
   * Listen for pointer lock change event
   */
  private pointerLockChangeHandler() {
    const pointerIsLocked = this.input.mouse?.locked;
    console.log("pointerIsLocked", pointerIsLocked);

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
    this.input.off("pointerdown");
    this.input.off("pointermove");
    this.input.keyboard?.off("keydown_ESC");
    this.input.manager.events.off("pointerlockchange");
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.input.manager.events.off("pointerlockchange", this.pointerLockChangeHandler, this);
    this.input.keyboard?.off("keydown_ESC", this.onEscKeyDown, this);
    this.input.off("pointermove", this.onPointerMove, this);
    this.input.off("pointerdown", this.onPointerDown, this);
  }
}
