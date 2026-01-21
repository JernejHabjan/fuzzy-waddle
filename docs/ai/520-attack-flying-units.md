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
| `apps/client/src/app/probable-waffle/game/prefabs/ai-agents/player-pawn-ai-controller.agent.ts` | AI movement to target |
| `apps/client/src/app/probable-waffle/game/entity/components/movement/flying-component.ts` | Flying unit height definition |

---

## Tasks

### Phase 1: Investigation & Verification
- [x] Reproduce the bug with a ranged unit attacking a flying unit (Skaduwee Owl)
- [x] Confirm ranged unit moves underneath instead of stopping at range
- [x] Identify exact point where incorrect distance is calculated

### Phase 2: Fix Distance Calculation
- [x] Add `getFlyingHeightInTiles()` helper to convert flying height from pixels to tiles
- [x] Add `getEffectiveHorizontalRangeForFlyingTarget()` to calculate horizontal stop distance
- [x] Add `getTileDistance3DBetweenGameObjects()` for 3D-aware distance checks

### Phase 3: Fix Attack Range Check
- [x] Update `AttackComponent.getAttackRange()` to return effective horizontal range for flying targets
- [x] Uses `DistanceHelper.getEffectiveHorizontalRangeForFlyingTarget()` when target is flying

### Phase 4: Fix Movement Stop Position
- [x] Movement uses range from `getAttackRange()` which now accounts for flying height
- [x] Ground units stop at horizontal distance where 3D distance equals attack range
- [x] Minimum horizontal distance of 1 tile enforced to prevent walking directly underneath

### Phase 5: Fix Projectile Targeting (if needed)
- [x] Verified projectiles target the flying unit's visual position
- [x] `RepresentableComponent.bounds` uses `renderedWorldTransform` which includes flying height offset

---

## Implementation Summary

### Files Modified

1. **distance-helper.ts** - Added 3 new methods:
   - `getFlyingHeightInTiles(gameObject)` - Converts flying height from pixels to tile units
   - `getEffectiveHorizontalRangeForFlyingTarget(attackRange, target)` - Calculates horizontal distance for 3D range
   - `getTileDistance3DBetweenGameObjects(actor1, actor2)` - 3D distance calculation

2. **attack-component.ts** - Modified `getAttackRange()`:
   - For flying targets, returns effective horizontal range instead of raw attack range
   - Formula: `horizontalRange = sqrt(attackRange² - flyingHeight²)`

3. **player-pawn-ai-controller.agent.ts** - Added import for `FlyingComponent`

### Formula Used
```
effectiveHorizontalRange = sqrt(attackRange² - flyingHeight²)
```

Where:
- `attackRange` = weapon's attack range in tiles
- `flyingHeight` = flying unit's height in tiles (pixels / tileWidth)
- Result clamped to minimum of 1 tile to prevent units going directly underneath

### Example Calculation
- Owl flying height: 128 pixels = 2 tiles (128/64)
- Attack range: 5 tiles
- Effective horizontal range: sqrt(25 - 4) = sqrt(21) ≈ 4.58 tiles

---

## Verification Checklist
- [x] Ranged unit stops at correct distance from flying unit
- [x] Ranged unit does NOT walk underneath flying unit
- [x] Projectiles hit the flying unit correctly
- [x] Melee units still behave correctly (they need to get close)
- [x] Ground-to-ground attacks unaffected
- [x] Flying-to-flying attacks unaffected
- [x] Flying-to-ground attacks unaffected
- [x] Lint passes
- [x] TypeScript compilation passes
