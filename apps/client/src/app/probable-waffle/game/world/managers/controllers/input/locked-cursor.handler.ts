import { Cameras, Input } from "phaser";

export class LockedCursorHandler {
  private readonly lockToScreen = false; // todo could be enabled later - need to move cursor manually in phaser
  private readonly input: Input.InputPlugin;
  private readonly mainCamera: Cameras.Scene2D.Camera;

  constructor(private readonly scene: Phaser.Scene) {
    this.mainCamera = scene.cameras.main;
    this.input = scene.input;
    this.lockCursorToScreen();
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private customCursor: Phaser.GameObjects.Graphics | null = null;
  private cursorPosition = { x: 0, y: 0 };

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

      // Listen for pointer lock change event
      this.input.manager.events.on("pointerlockchange", (event: any) => {
        const pointerIsLocked = this.input.mouse?.locked;
        console.log("pointerIsLocked", pointerIsLocked);

        if (pointerIsLocked) {
          this.scene.input.manager.game.canvas.addEventListener("mousemove", this.handleLockedPointerMove);
          this.createCustomCursor(); // Create the custom cursor when pointer is locked
        } else {
          this.scene.input.manager.game.canvas.removeEventListener("mousemove", this.handleLockedPointerMove);
          if (this.customCursor) this.customCursor.destroy(); // Destroy cursor when unlocked
        }
      });

      // On Esc, release pointer lock
      this.input.keyboard.on("keydown_ESC", () => {
        if (this.input.mouse?.locked) {
          this.input.mouse.releasePointerLock();
        }
      });
    }
  }

  private createCustomCursor() {
    this.customCursor = this.scene.add.graphics({ fillStyle: { color: 0xffffff } });
    this.customCursor.fillCircle(0, 0, 5); // Draw a small white circle as the cursor
    this.customCursor.setDepth(100); // Make sure the cursor is on top of other game elements

    const pointerX = this.input.activePointer.x;
    const pointerY = this.input.activePointer.y;

    this.cursorPosition = { x: pointerX, y: pointerY };
    this.customCursor.setPosition(this.cursorPosition.x, this.cursorPosition.y);
  }

  // Handle pointer movement and update cursor position
  // Handle pointer movement and update cursor position
  private handleLockedPointerMove = (event: MouseEvent) => {
    // Update the cursor's position based on mouse movement
    this.cursorPosition.x += event.movementX;
    this.cursorPosition.y += event.movementY;

    // Clamp cursor within screen bounds
    this.cursorPosition.x = Phaser.Math.Clamp(this.cursorPosition.x, 0, this.mainCamera.width);
    this.cursorPosition.y = Phaser.Math.Clamp(this.cursorPosition.y, 0, this.mainCamera.height);

    // Update the custom cursor position
    if (this.customCursor) {
      this.customCursor.setPosition(this.cursorPosition.x, this.cursorPosition.y);

      // Update activePointer position
      // todo - this now only sets the position of the cursor as we initially lock the screen with (for example when clicking on the canvas), but it doesn't change x,y coords when moving the cursor
    }
  };

  destroy() {
    this.customCursor?.destroy();
    this.scene.input.manager.game.canvas.removeEventListener("mousemove", this.handleLockedPointerMove);
    this.input.off("pointerdown");
    this.input.keyboard?.off("keydown_ESC");
    this.input.manager.events.off("pointerlockchange");
  }
}
