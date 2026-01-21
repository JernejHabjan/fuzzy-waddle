# 520 - Attack Flying Units Fix

## Problem
Ranged units move underneath flying units before attacking them instead of stopping at attack range.

## Root Cause
Distance calculations in `DistanceHelper` only consider X,Y coordinates, ignoring the flying unit's Z height. When a ground unit tries to attack a flying unit, it pathfinds to the ground position directly below the target instead of stopping at proper attack range.

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/client/src/app/probable-waffle/game/library/distance-helper.ts` | Distance calculations (2D only) |
| `apps/client/src/app/probable-waffle/game/entity/components/combat/components/attack-component.ts` | Attack logic, range checking, projectile spawning |
| `apps/client/src/app/probable-waffle/game/entity/systems/movement.system.ts` | Movement handling |
| `apps/client/src/app/probable-waffle/game/entity/actor/player-pawn-ai-controller.agent.ts` | AI movement to target |
| `apps/client/src/app/probable-waffle/game/entity/components/movement/flying-component.ts` | Flying unit height definition |

---

## Tasks

### Phase 1: Investigation & Verification
- [ ] Reproduce the bug with a ranged unit attacking a flying unit (Skaduwee Owl)
- [ ] Confirm ranged unit moves underneath instead of stopping at range
- [ ] Identify exact point where incorrect distance is calculated

### Phase 2: Fix Distance Calculation
- [ ] Modify `DistanceHelper.getTileDistanceBetweenGameObjects()` to account for flying height
- [ ] Create helper to get effective attack position for flying units
- [ ] Ensure distance calculation uses 3D distance when target is flying

### Phase 3: Fix Attack Range Check
- [ ] Update `AttackComponent.isTargetWithinAttackRange()` to use 3D distance for flying targets
- [ ] Verify `getAttackRange()` returns correct range for air attacks

### Phase 4: Fix Movement Stop Position
- [ ] Update `PlayerPawnAiController` to calculate correct stop distance for flying targets
- [ ] Ensure `radiusTilesAroundDestination` accounts for vertical distance
- [ ] Ground units should stop at horizontal distance where 3D distance equals attack range

### Phase 5: Fix Projectile Targeting (if needed)
- [ ] Verify projectiles target the flying unit's visual position (not ground position)
- [ ] Check `spawnProjectileAndFire()` uses correct target Y coordinate

---

## Implementation Details

### Distance Calculation Fix
Location: `distance-helper.ts:14-31`

Current (2D only):
```typescript
const distance = Math.sqrt(
  Math.pow(actor1Tile.x - actor2Tile.x, 2) +
  Math.pow(actor1Tile.y - actor2Tile.y, 2)
);
```

Required (3D with flying height):
```typescript
const flyingHeight = getFlyingHeightInTiles(actor2); // Convert pixels to tiles
const distance = Math.sqrt(
  Math.pow(actor1Tile.x - actor2Tile.x, 2) +
  Math.pow(actor1Tile.y - actor2Tile.y, 2) +
  Math.pow(flyingHeight, 2)
);
```

### Attack Range Check
Location: `attack-component.ts` - `isTargetWithinAttackRange()`

Need to check if unit is within attack range considering the flying unit's height.

### Movement Stop Distance
Location: `player-pawn-ai-controller.agent.ts:160`

When attacking flying unit:
- Calculate horizontal distance needed such that 3D distance = attack range
- `horizontalRange = sqrt(attackRange^2 - flyingHeight^2)`
- Use this as `radiusTilesAroundDestination`

---

## Verification Checklist
- [ ] Ranged unit stops at correct distance from flying unit
- [ ] Ranged unit does NOT walk underneath flying unit
- [ ] Projectiles hit the flying unit correctly
- [ ] Melee units still behave correctly (they need to get close)
- [ ] Ground-to-ground attacks unaffected
- [ ] Flying-to-flying attacks unaffected
- [ ] Flying-to-ground attacks unaffected
