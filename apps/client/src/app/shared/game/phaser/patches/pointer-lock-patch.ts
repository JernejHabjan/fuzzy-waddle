import Phaser from "phaser";

/**
 * Patch Phaser's InputManager.transformPointer() to correctly handle pointer lock mode.
 *
 * Problem:
 * When pointer is locked, the browser freezes event.pageX/pageY but provides
 * movementX/movementY deltas. Phaser's transformPointer() always uses pageX/pageY,
 * which are frozen during pointer lock, causing the pointer position to get stuck.
 *
 * Solution:
 * This patch overrides InputManager.transformPointer() to:
 * - When locked: Accumulate position using movement deltas with proper scaling
 * - When unlocked: Use original Phaser behavior with pageX/pageY
 *
 * This is cleaner than patching individual methods (move, down, up) and automatically
 * handles all coordinate transformations and scaling via the scaleManager.
 *
 * Related: https://github.com/phaserjs/phaser/issues/7153
 */
export function applyPointerLockPatch(): void {
  // Runtime guards to ensure Phaser's internal structure matches expectations
  const phaserInput = (Phaser as unknown as { Input?: { InputManager?: { prototype?: unknown } } }).Input;
  if (!phaserInput || !phaserInput.InputManager || !phaserInput.InputManager.prototype) {
    console.error(
      "[PointerLockPatch] Unable to apply patch: Phaser.Input.InputManager.prototype is not available. " +
        "Phaser's internal structure may have changed."
    );
    return;
  }
  const InputManagerPrototype = phaserInput.InputManager.prototype as {
    transformPointer: (pointer: Phaser.Input.Pointer, pageX: number, pageY: number, wasMove: boolean) => void;
    _pointerLockPatched?: boolean;
    scaleManager: Phaser.Scale.ScaleManager;
    game: Phaser.Game;
  };
  const originalTransformPointer = InputManagerPrototype.transformPointer;
  if (typeof originalTransformPointer !== "function") {
    console.error(
      "[PointerLockPatch] Unable to apply patch: InputManager.prototype.transformPointer is not a function. " +
        "Phaser's internal structure may have changed."
    );
    return;
  }

  // Track if patch has already been applied
  if (InputManagerPrototype._pointerLockPatched) {
    console.warn("[PointerLockPatch] Patch already applied, skipping");
    return;
  }

  InputManagerPrototype.transformPointer = function (
    pointer: Phaser.Input.Pointer,
    pageX: number,
    pageY: number,
    wasMove: boolean
  ) {
    if (pointer.locked) {
      // Pointer is currently locked
      const p0 = pointer.position;
      const p1 = pointer.prevPosition;

      if (wasMove) {
        // Movement event - update position using deltas
        // Store previous position
        p1.x = p0.x;
        p1.y = p0.y;

        // Get movement deltas from the pointer (already set by Phaser)
        const deltaX = pointer.movementX || 0;
        const deltaY = pointer.movementY || 0;

        // Apply deltas to current position (already in game space)
        // Note: We need to account for scale - movement deltas are in screen pixels
        // but our position is in game space
        const scaleX = this.scaleManager.displayScale.x;
        const scaleY = this.scaleManager.displayScale.y;

        // Add scaled movement deltas to current position
        const newX = p0.x + deltaX / scaleX;
        const newY = p0.y + deltaY / scaleY;

        // Clamp to game bounds
        const gameWidth = this.game.config.width as number;
        const gameHeight = this.game.config.height as number;

        const a = pointer.smoothFactor;

        if (a === 0) {
          // Set immediately
          p0.x = Phaser.Math.Clamp(newX, 0, gameWidth);
          p0.y = Phaser.Math.Clamp(newY, 0, gameHeight);
        } else {
          // Apply smoothing
          const smoothX = newX * a + p1.x * (1 - a);
          const smoothY = newY * a + p1.y * (1 - a);
          p0.x = Phaser.Math.Clamp(smoothX, 0, gameWidth);
          p0.y = Phaser.Math.Clamp(smoothY, 0, gameHeight);
        }
      } else {
        // Non-movement event (down, up, wheel, etc.) - preserve current position
        // DO NOT update position from pageX/pageY as they are frozen
        // Just update prevPosition for consistency
        p1.x = p0.x;
        p1.y = p0.y;
      }
    } else {
      // Pointer is not locked - use original Phaser behavior
      originalTransformPointer.call(this, pointer, pageX, pageY, wasMove);
    }
  };

  // Mark that patch has been applied
  InputManagerPrototype._pointerLockPatched = true;

  console.log("[PointerLockPatch] Successfully applied pointer lock patch to Phaser.Input.InputManager");
}
