# Issue #519: Flying Units Offset After Load Game

## Problem Summary

Flying units get vertically offset when:
1. Spawned from Phaser Editor placement
2. Loaded from a saved game

**Root Cause:** When `RepresentableComponent.setData()` is called during actor creation/load, `FlyingComponent` is not yet attached. The `getActualLogicalZ()` method returns 0 for flight height because `getActorComponent(FlyingComponent)` returns `undefined`. The rendered Y position is calculated without the flight offset and never recalculated.

## Relevant Files

| File | Purpose |
|------|---------|
| `apps/client/src/app/probable-waffle/game/entity/components/representable-component.ts` | Handles position rendering with Z-offset |
| `apps/client/src/app/probable-waffle/game/entity/components/movement/flying-component.ts` | Defines flight height for flying units |
| `apps/client/src/app/probable-waffle/game/data/game-object-helper.ts` | Contains `onObjectReady` hook |
| `apps/client/src/app/probable-waffle/game/data/actor-data.ts` | Sets up actor with all components |

## Solution

Use `onObjectReady` in `RepresentableComponent` to refresh the rendered position after all components are attached. This hook waits for scene initialization and game object to be added to scene, ensuring all components are available.

## Tasks

### Phase 1: Implement Fix

- [ ] Add `refreshRenderedPosition()` method to `RepresentableComponent`
- [ ] Register `onObjectReady` callback in `RepresentableComponent.setData()` to call `refreshRenderedPosition()`
- [ ] Ensure the refresh only happens once per setData call (avoid duplicate callbacks)

### Phase 2: Verification

- [ ] Place flying unit in Phaser Editor → launch game → verify correct height
- [ ] Save game with flying unit → load game → verify correct height
- [ ] Move flying unit → save → load → verify correct height
- [ ] Verify non-flying units are unaffected

## Code Changes

### `representable-component.ts`

**Add refresh method (after line ~133):**
```typescript
private refreshRenderedPosition(): void {
  if (!this._logicalWorldTransform) return;
  const transform = this._logicalWorldTransform;
  const transformComponent = this.gameObject as unknown as Phaser.GameObjects.Components.Transform;
  if (!transformComponent.hasTransformComponent) return;

  transformComponent.x = transform.x;
  transformComponent.y = transform.y - this.getActualLogicalZ(transform);
  DepthHelper.setActorDepth(this.gameObject);
  this.refreshBounds();
}
```

**Modify `setData()` method (around line 150):**
```typescript
setData(data: Partial<RepresentableComponentData>) {
  if (data.logicalWorldTransform) {
    this._logicalWorldTransform = data.logicalWorldTransform;
    // Defer rendered position calculation until all components are ready
    onObjectReady(this.gameObject, this.refreshRenderedPosition, this);
  }
  this.refreshBounds();
}
```

## Why This Works

1. `setData()` is called during actor creation/load
2. At this point, `FlyingComponent` may not be attached yet
3. `onObjectReady` defers the position refresh until:
   - Scene is initialized
   - Game object is added to scene
   - All components are attached (via setTimeout(0) queue)
4. When `refreshRenderedPosition()` runs, `getActorComponent(FlyingComponent)` returns the correct component
5. The flight height is applied correctly

## Flow Diagram

```
Actor Creation/Load
       │
       ▼
setData() called
       │
       ├─► Store _logicalWorldTransform (raw value)
       │
       ├─► Register onObjectReady callback
       │
       ▼
... other components attached (including FlyingComponent) ...
       │
       ▼
onObjectReady fires (setTimeout 0)
       │
       ▼
refreshRenderedPosition()
       │
       ├─► getActualLogicalZ() → returns z + flightHeight
       │
       ▼
Correct Y position rendered
```

## Edge Cases

- Non-flying units: `flightHeight` defaults to 0, no change in behavior
- Units without `setData()` call: Initial transform set via `setTransformInitially()` which already uses `onObjectReady`
- Multiple `setData()` calls: Each triggers a new `onObjectReady`, last one wins (acceptable)
