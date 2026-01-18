# #215 - High Ground Advantage Implementation Plan

## Overview
Implement high ground advantage for ranged units based on z-coordinate elevation. Units on high ground (z >= 64) gain extended attack range instead of damage bonus.

## Constants Definition

### 1.1 High Ground Constants
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/high-ground-constants.ts`
- [ ] Define `HIGH_GROUND_THRESHOLD = 64` (z-coordinate threshold)
- [ ] Export constant for use across combat system

### 1.2 AttackData Interface Update
**File**: `apps/client/src/app/probable-waffle/game/entity/components/combat/attack-data.ts`
- [ ] Add optional property `highGroundRangeBonus?: number` to AttackData interface
- [ ] Document: bonus range (in tiles) granted when attacker has high ground advantage

### 1.3 Weapon Definitions Update
**File**: `apps/client/src/app/probable-waffle/game/entity/components/combat/weapon-definitions.ts`
- [ ] Add `highGroundRangeBonus` to each weapon definition:
  - **Bow**: 2
  - **BowTower**: 2
  - **FrostSpell**: 2
  - **Slingshot**: 1
  - **Furball**: 1
  - **Spear**: 0
  - **Sword**: 0
  - **Axe**: 0
  - **Staff**: 0
  - **Hands**: 0
  - **WolfBite**: 0
  - All other melee weapons: 0
  - Any new ranged weapons: 1 (default)

## Phase 1: Core High Ground Detection

### 1.4 High Ground Helper
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/combat/high-ground.helper.ts`
- [ ] Implement `hasHighGroundAdvantage(attacker: GameObject, target: GameObject): boolean`
  - Get attacker z from RepresentableComponent.logicalWorldTransform.z
  - Get target z from RepresentableComponent.logicalWorldTransform.z
  - Return true if attacker.z >= target.z + HIGH_GROUND_THRESHOLD
- [ ] Implement `getHighGroundRangeBonus(attacker: GameObject, target: GameObject, attack: AttackData): number`
  - Check hasHighGroundAdvantage first
  - If false, return 0
  - If true, return attack.highGroundRangeBonus ?? 0
- [ ] Implement `getActorElevation(actor: GameObject): number`
  - Get RepresentableComponent from actor
  - Return logicalWorldTransform.z or 0 if not found

## Phase 2: Attack Component Integration

### 2.1 AttackComponent - getMaximumRange
**File**: `apps/client/src/app/probable-waffle/game/entity/components/combat/components/attack-component.ts`
- [ ] Import high ground helper
- [ ] Modify `getMaximumRange()` method
- [ ] Add optional `targetGameObject?: GameObject` parameter
- [ ] If target provided, calculate bonus per attack: `attack.range + getHighGroundRangeBonus(this.gameObject, targetGameObject, attack)`
- [ ] Return maximum of all attacks with their individual bonuses

### 2.2 AttackComponent - getAttackRange
**File**: `apps/client/src/app/probable-waffle/game/entity/components/combat/components/attack-component.ts`
- [ ] Already has `targetGameObject` parameter
- [ ] Import high ground helper
- [ ] Add high ground bonus to returned range (use best attack's weapon type)
- [ ] Update line ~417: `return availableAttacks[0]!.range + getHighGroundRangeBonus(this.gameObject, targetGameObject, availableAttacks[0]!)`

### 2.3 AttackComponent - getAttack
**File**: `apps/client/src/app/probable-waffle/game/entity/components/combat/components/attack-component.ts`
- [ ] Review filtering logic that uses `attack.range`
- [ ] Calculate bonus per attack: `const effectiveRange = attack.range + getHighGroundRangeBonus(this.gameObject, enemy, attack)`
- [ ] Use effectiveRange when checking if target is in range during filtering

## Phase 3: UI Display Updates

### 3.1 ActorDetails - Range Display
**File**: `apps/client/src/app/probable-waffle/game/prefabs/gui/labels/ActorDetails.ts`
- [ ] Import high ground helper
- [ ] Modify `getActorAttributeIconsAndTexts` static method
- [ ] Line ~161: Update range text calculation
- [ ] If `actor` is provided, check for high ground advantage
- [ ] Get bonus from primaryAttack.highGroundRangeBonus ?? 0
- [ ] Display range as: `"7+2"` or `"5+1"` based on weapon's defined bonus
- [ ] If no actor provided or no bonus, display base range only

### 3.2 ActorDetails - Tooltip/Indicator
**File**: `apps/client/src/app/probable-waffle/game/prefabs/gui/labels/ActorDetails.ts`
- [ ] Consider adding visual indicator (icon/color) for high ground status
- [ ] Add text like "↑" or "⛰" symbol next to range when high ground active
- [ ] Optional: Add tooltip explaining high ground bonus

## Phase 4: Building Cursor Integration

### 4.1 Building Placement Range Visualization
**File**: `apps/client/src/app/probable-waffle/game/player/human-controller/building-cursor.ts`
- [ ] Import high ground helper
- [ ] Modify `drawAttackRange` method (line ~592)
- [ ] Get building z-coordinate from placement position
- [ ] Get potential bonus from primaryAttack.highGroundRangeBonus ?? 0
- [ ] Draw base range circle with base color
- [ ] If building will have high ground and bonus > 0, draw additional circle with (range + bonus)
- [ ] Use different color/style for bonus range (e.g., dashed line or lighter color)

## Phase 5: Tech Tree Service Updates

### 5.1 Ranged Units Detection
**File**: `apps/client/src/app/probable-waffle/game/data/tech-tree/tech-tree.service.ts`
- [ ] Review `getRangedInfantryUnits` method (line ~253)
- [ ] Verify range check `attackData.range > 2` still valid
- [ ] Consider if high ground affects ranged vs melee classification
- [ ] Update filtering logic if needed

### 5.2 Melee Units Detection
**File**: `apps/client/src/app/probable-waffle/game/data/tech-tree/tech-tree.service.ts`
- [ ] Review `getMeleeInfantryUnits` method (line ~280)
- [ ] Verify range check `attackData.range > 2` still valid
- [ ] Ensure melee units don't benefit from high ground (if intended)
- [ ] Document behavior in comments

## Phase 6: AI Controller Updates

### 6.1 AI Positioning
- [ ] Search for AI code that uses `getAttackRange` or `getMaximumRange`
- [ ] Ensure AI passes target to range calculation methods
- [ ] Update AI to consider high ground when positioning units
- [ ] AI should prefer high ground positions for ranged units

### 6.2 AI Target Selection
- [ ] Review AI target selection logic
- [ ] Ensure range checks include high ground bonus
- [ ] AI should account for elevation when determining attackable targets

## Phase 7: Combat System Updates

### 7.1 Range Validation in Attack Logic
**File**: `apps/client/src/app/probable-waffle/game/entity/components/combat/components/attack-component.ts`
- [ ] Review all methods that check `attack.range`
- [ ] Pass AttackData to getHighGroundRangeBonus for weapon-specific calculation
- [ ] Update `getAttack` method to calculate bonus per attack type
- [ ] Update any distance checks to include weapon-specific elevation bonus

### 7.2 Projectile Range
- [ ] Review projectile spawning and targeting
- [ ] Ensure projectiles can travel extended distance with high ground
- [ ] Verify projectile trajectories work correctly with elevation

## Phase 8: Edge Cases

### 8.1 Flying Units
- [ ] Check FlyingComponent interaction with high ground
- [ ] Use `RepresentableComponent.getActualLogicalZ()` for flying units
- [ ] Consider if flying units get/give high ground advantage
- [ ] Document flying unit behavior with elevation

### 8.2 Elevation Changes
- [ ] Handle units moving to/from high ground
- [ ] Update range when elevation changes
- [ ] Recalculate attack availability when z changes
- [ ] Ensure UI updates when elevation changes

### 8.3 Building Elevation
- [ ] Buildings on elevated terrain should benefit from high ground
- [ ] Tower placement on hills gets extended range
- [ ] Verify building z-coordinate is properly set
- [ ] Test range visualization during building placement

### 8.4 Multiple Attacks
- [ ] Units with multiple attack types get different bonuses per weapon
- [ ] Calculate bonus independently: `getHighGroundRangeBonus(attacker, target, attack)`
- [ ] Bow attack gets +2, Slingshot gets +1, etc.
- [ ] Melee attacks (range <= 2) configured with 0 bonus
- [ ] Verify each attack type uses its weapon-specific bonus

## Phase 9: Documentation

### 9.1 Code Documentation
- [ ] Add JSDoc comments to high ground helper functions
- [ ] Document HIGH_GROUND_THRESHOLD and bonus values
- [ ] Explain high ground mechanics in component comments
- [ ] Add usage examples in helper file

### 9.2 Game Design Documentation
- [ ] Document high ground mechanics for game designers
- [ ] List affected attack types and ranges
- [ ] Explain z-threshold and bonus calculation
- [ ] Note differences from Age of Mythology implementation

## Implementation Order

1. Update AttackData interface with highGroundRangeBonus property
2. Update all weapon definitions with appropriate bonus values
3. Create constants (HIGH_GROUND_THRESHOLD) and helper functions
4. Integrate into AttackComponent (getMaximumRange, getAttackRange, getAttack)
5. Update ActorDetails UI display
6. Update building cursor visualization
7. Update tech tree service if needed
8. Update AI controller
9. Handle edge cases (flying units, elevation changes, buildings)
10. Documentation

## Files to Create
- `apps/client/src/app/probable-waffle/game/entity/components/combat/high-ground-constants.ts`
- `apps/client/src/app/probable-waffle/game/entity/components/combat/high-ground.helper.ts`

## Files to Modify
- `apps/client/src/app/probable-waffle/game/entity/components/combat/attack-data.ts`
- `apps/client/src/app/probable-waffle/game/entity/components/combat/weapon-definitions.ts`
- `apps/client/src/app/probable-waffle/game/entity/components/combat/components/attack-component.ts`
- `apps/client/src/app/probable-waffle/game/prefabs/gui/labels/ActorDetails.ts`
- `apps/client/src/app/probable-waffle/game/player/human-controller/building-cursor.ts`
- `apps/client/src/app/probable-waffle/game/data/tech-tree/tech-tree.service.ts` (review/verify)
- AI controller files (to be identified during implementation)

## Key Design Decisions

### Z-Threshold: 64 units
- Actor must be 64+ z-units above target for advantage
- Matches isometric tile height scaling

### Range Bonus: Per-Weapon in AttackData
- **Stored in weapon definitions** as `highGroundRangeBonus` property
- **Bow**: 2 tiles (longest range weapon benefits more)
- **BowTower**: 2 tiles (defensive structure bonus)
- **FrostSpell**: 2 tiles (magic projectile)
- **Slingshot**: 1 tile (shorter range weapon)
- **Furball**: 1 tile (projectile)
- **Melee** (Sword, Axe, Spear, Hands, etc.): 0 tiles (no high ground benefit)
- New weapons can define their own bonus value

### Applies to Ranged Units Only
- Each weapon definition specifies its own bonus
- Melee weapons explicitly set to 0
- Towers and buildings benefit based on their weapon definition

### Detection Method
- Use RepresentableComponent.logicalWorldTransform.z
- Compare attacker.z vs (target.z + threshold)
- Bonus retrieved from attack.highGroundRangeBonus ?? 0
- Consider flying height via getActualLogicalZ() if needed

## Progress Tracking

**Status**: Not Started
**Last Updated**: 2026-01-18
**Completed Items**: 0/65
