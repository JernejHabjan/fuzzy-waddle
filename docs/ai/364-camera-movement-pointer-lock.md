# Issue #364: Camera Movement with Pointer Lock Support

## Problem Statement
Implement camera keyboard/click scrolling for players who prefer these input methods. Currently blocked by Phaser issue #7153 where Phaser's `Pointer.move()` method calls `transformPointer()` which overrides any manual pointer position updates.

## Root Cause
In Phaser's `Pointer.js`, the `move()` method is called on every mouse move event:
```javascript
move: function (event) {
    // ...
    this.manager.transformPointer(this, event.pageX, event.pageY, true);
    
    if (this.locked) {
        this.movementX = event.movementX || ...;
        this.movementY = event.movementY || ...;
    }
    // ...
}
```

The `transformPointer()` call updates `pointer.x` and `pointer.y` from `event.pageX/pageY`, which are frozen when pointer is locked. Any manual position updates are immediately overridden.

## Solution: Monkey Patch Phaser's Pointer Class

Instead of working around the issue, we'll override Phaser's `Pointer.prototype.move` method to:
1. Detect when pointer is locked
2. When locked: Skip `transformPointer()` call and manually update position using movement deltas
3. When unlocked: Use original Phaser behavior

This ensures ALL Phaser input events receive correct pointer positions automatically.

## Implementation Plan

### Phase 1: Create Phaser Pointer Patch
- [ ] Create new file `apps/client/src/app/shared/game/phaser/patches/pointer-lock-patch.ts`
- [ ] Save reference to original `Phaser.Input.Pointer.prototype.move` method
- [ ] Create replacement `move()` method that:
  - Checks if `this.locked` is true
  - When locked: Updates position using `movementX/Y` and clamps to bounds
  - When locked: Skips `transformPointer()` call
  - When unlocked: Calls original `move()` method
- [ ] Export patch function that applies the override

### Phase 2: Apply Patch at Application Startup
- [ ] Import patch in `apps/client/src/main.ts` or game initialization
- [ ] Call patch function BEFORE Phaser game is created
- [ ] Ensure patch is applied only once

### Phase 3: Update LockedCursorHandler
- [ ] Remove `updateInputPointerPosition()` method (no longer needed)
- [ ] Remove call to `updateInputPointerPosition()` from `onPointerMove()`
- [ ] Remove TODOs about Phaser issue #7153
- [ ] Update comment: "Phaser now handles position updates via patched Pointer.move()"
- [ ] Keep custom cursor visual tracking
- [ ] Simplify `onPointerMove()` to only update custom cursor graphics

### Phase 4: Verify CameraMovementHandler Works
- [ ] Confirm `screenEdgeMovementUpdate()` works with locked pointer
- [ ] No changes needed - reads `input.activePointer.x/y` which now has correct values
- [ ] Test edge scrolling in both locked and unlocked modes

### Phase 5: Code Cleanup
- [ ] Remove debug console.log statements
- [ ] Update comments explaining the patch
- [ ] Document why patching was necessary
- [ ] Ensure patch is well-commented for future maintainers

## File Changes

### New File: `apps/client/src/app/shared/game/phaser/patches/pointer-lock-patch.ts`
**Purpose:** Monkey patch Phaser's Pointer class to handle locked pointer correctly

**Implementation:**
```typescript
/**
 * Patch Phaser's Pointer.move() to correctly handle pointer lock mode
 * Fixes: https://github.com/phaserjs/phaser/issues/7153
 */
export function applyPointerLockPatch() {
  const PointerPrototype = Phaser.Input.Pointer.prototype as any;
  const originalMove = PointerPrototype.move;
  
  PointerPrototype.move = function(event: MouseEvent) {
    if (this.locked) {
      // Handle locked pointer manually
      // Update buttons state
      if ('buttons' in event) {
        this.buttons = event.buttons;
      }
      this.event = event;
      
      // Get movement deltas
      this.movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      this.movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      
      // Update position using deltas (maintain cursor within bounds)
      this.x = Phaser.Math.Clamp(this.x + this.movementX, 0, this.manager.game.canvas.width);
      this.y = Phaser.Math.Clamp(this.y + this.movementY, 0, this.manager.game.canvas.height);
      
      // Update world position
      this.updateWorldPoint(this.camera);
      
      // Update timestamp
      this.moveTime = event.timeStamp;
      this.wasTouch = false;
    } else {
      // Use original Phaser behavior when not locked
      originalMove.call(this, event);
    }
  };
}
```

### `main.ts` (or game initialization file)
**Changes needed:**
- Import `applyPointerLockPatch` 
- Call `applyPointerLockPatch()` BEFORE creating Phaser game
- Add comment explaining patch purpose

### `locked-cursor.handler.ts`
**Changes needed:**
- Remove `updateInputPointerPosition()` method completely
- Remove call to `updateInputPointerPosition()` from `onPointerMove()`
- Remove TODOs about Phaser issue #7153
- Update comment: "Phaser now handles position updates via patched Pointer.move()"
- Keep cursor position tracking for visual cursor only
- Simplify `onPointerMove()` to only update custom cursor graphics

### `cameraMovementHandler.ts`
**Changes needed:**
- NO CHANGES REQUIRED
- Works automatically because `input.activePointer.x/y` now has correct values
- Add comment that pointer lock is supported via Phaser patch

## Technical Details

### How Phaser's Original move() Works
```javascript
move: function (event) {
    this.buttons = event.buttons;
    this.event = event;
    
    // THIS CALL OVERRIDES POSITION - THE PROBLEM
    this.manager.transformPointer(this, event.pageX, event.pageY, true);
    
    if (this.locked) {
        this.movementX = event.movementX || ...;
        this.movementY = event.movementY || ...;
    }
    
    this.moveTime = event.timeStamp;
    this.wasTouch = false;
}
```

### How Patched move() Works
```javascript
move: function (event) {
    if (this.locked) {
        // Skip transformPointer, update position manually
        this.x += movementX;
        this.y += movementY;
        // Clamp to bounds
        // Update world point
    } else {
        // Call original Phaser logic
        originalMove.call(this, event);
    }
}
```

### Position Update Flow (After Patch)
1. Browser fires pointer move event with movementX/Y
2. Phaser receives event and calls `Pointer.move()`
3. **Patched** `move()` detects `this.locked === true`
4. Updates `this.x` and `this.y` using movement deltas
5. Clamps position to canvas bounds
6. Updates world position via `updateWorldPoint()`
7. All Phaser input events now have correct `pointer.x/y` values
8. `CameraMovementHandler.screenEdgeMovementUpdate()` reads correct position
9. Edge scrolling works automatically
10. Selection, clicks, hover all work automatically

## Advantages of Monkey Patching Approach

**vs Workaround Approach:**
- ✅ Single point of change (one patch function)
- ✅ Fixes issue for ALL code that reads pointer position
- ✅ No need to update every input handler
- ✅ No conditional logic scattered throughout codebase
- ✅ Works with existing code without modifications
- ✅ Easy to remove if Phaser fixes the issue upstream

**Disadvantages:**
- ⚠️ Modifies Phaser's prototype (monkey patching)
- ⚠️ Could break if Phaser changes internal API
- ⚠️ Must ensure patch is applied before game creation

## Implementation Order
1. Phase 1: Create pointer patch file with override logic
2. Phase 2: Apply patch at startup (before Phaser game creation)
3. Phase 3: Simplify LockedCursorHandler (remove manual updates)
4. Phase 4: Test camera movement (should work automatically)
5. Phase 5: Code cleanup and documentation

## Acceptance Criteria
- [ ] Patch is applied before Phaser game is created
- [ ] Edge scrolling works when pointer is locked
- [ ] Edge scrolling works when pointer is unlocked (existing behavior)
- [ ] Keyboard scrolling still works (WASD and arrow keys)
- [ ] No cursor position jumps during lock/unlock transitions
- [ ] Custom cursor is visible and accurate in locked mode
- [ ] All game object interactions work correctly in locked mode
- [ ] All event listeners properly cleaned up
- [ ] Patch is well-documented with references to Phaser issue

## Rollback Plan
If patching causes issues:
1. Remove patch application from main.ts
2. Revert LockedCursorHandler changes
3. Fall back to workaround approach (checking lock state in every handler)

## Future Considerations
- Monitor Phaser issue #7153 for official fix
- When Phaser fixes issue, remove patch and test
- Consider contributing patch to Phaser as PR if maintainers are interested

## Notes
- Monkey patching is acceptable here because:
  - It's a known bug in Phaser with no official fix
  - The patch is isolated and well-documented
  - It solves the problem comprehensively
  - Easy to remove when upstream fix arrives
- Patch must be applied synchronously before game creation
- Phaser's Pointer class is stable and unlikely to change drastically
- The patch preserves all original behavior when pointer is not locked
