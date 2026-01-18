# #347 - Building Collapse Rubble System

## Overview
Implement building destruction visual feedback with rubble spawning and smoke effects when buildings are destroyed.

## Assets
- **Rubble sprites**: `apps/client/src/metadata/probable-waffle/sprites/factions/buildings/misc/ruins-flat/ruins-flat-1.png` and `ruins-flat-2.png`
- **Smoke sprite**: `apps/client/src/metadata/probable-waffle/sprites/factions/buildings/skaduwee/infantry_inn/cloud-vertical.png`

## Implementation Steps

### 1. Create Rubble Component
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/building/rubble-component.ts`
  - Component to manage rubble lifecycle
  - Track fade-out state and timing
  - Handle rubble destruction after delay

### 2. Create Rubble Definition
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/building/rubble-definition.ts`
  - Define rubble duration (how long before fade starts)
  - Define fade-out duration
  - Configure sprite paths for rubble variations

### 3. Create Building Destruction Effect System
- [ ] Create `apps/client/src/app/probable-waffle/game/entity/components/building/building-destruction-effect.ts`
  - Static method to spawn rubble at building position
  - Static method to spawn smoke clouds
  - Scale rubble to match building size
  - Randomize rubble variation (1 or 2)
  - Spawn 2-4 smoke clouds with random offsets

### 4. Update Health Component
- [ ] Modify `apps/client/src/app/probable-waffle/game/entity/components/combat/components/health-component.ts`
  - In `killActor()` method, detect if actor has `ConstructionSiteComponent` (is a building)
  - Call building destruction effect before hiding the building
  - Get building bounds for proper rubble scaling
  - Use `ActorPhysicalType.Structural` check

### 5. Implement Rubble Spawning Logic
- [ ] In `building-destruction-effect.ts`:
  - Create container for rubble sprite
  - Position at building center
  - Scale based on building bounds (width and height)
  - Set proper depth (slightly below destroyed building)
  - Add to scene

### 6. Implement Smoke Effect
- [ ] In `building-destruction-effect.ts`:
  - Spawn 2-4 smoke cloud images
  - Position with random offsets around building center
  - Rotate cloud sprite 90 degrees (horizontal orientation)
  - Apply upward tween animation (rising smoke)
  - Apply alpha fade tween (0 to 0.5 then to 0)
  - Scale appropriately to building size
  - Set high depth (above everything)
  - Auto-destroy after animation completes

### 7. Implement Rubble Fade-Out
- [ ] In `rubble-component.ts`:
  - After `durationMs` (e.g., 30000ms), start fade-out
  - Use Phaser tween to fade alpha from 1 to 0 over `fadeOutDurationMs` (e.g., 5000ms)
  - Destroy rubble game object on tween complete
  - Clean up component references

### 8. Register Rubble Component in Actor System
- [ ] Update `apps/client/src/app/probable-waffle/game/data/actor-component.ts`
  - Add `RubbleComponent` import
  - Add component registration mapping

### 9. Edge Cases
- [ ] Handle building destruction during fog of war
- [ ] Handle rapid multiple building destructions
- [ ] Ensure rubble doesn't block pathfinding (rubble is visual only, no collider)
- [ ] Handle scene shutdown while rubble is active
- [ ] Rubble visibility should respect fog of war if building was visible when destroyed

## Technical Details

### Isometric RTS Considerations
- Use `RepresentableComponent` to get proper isometric world position
- Use `ActorTranslateComponent.renderedTransform` for screen position (not logical position)
- Rubble depth must be calculated using `DepthHelper` to maintain proper isometric layering
- Position rubble at building's rendered position, not logical grid position
- Scale should account for isometric perspective

### Rubble Scaling
```typescript
// Get building bounds and position
const bounds = getGameObjectBounds(buildingGameObject);
const actorTranslateComponent = getActorComponent(buildingGameObject, ActorTranslateComponent);
const renderedTransform = actorTranslateComponent?.renderedTransform;

// Scale rubble to match building footprint
const scaleX = bounds.width / rubbleSprite.width;
const scaleY = bounds.height / rubbleSprite.height;

// Position at rendered (screen) position
rubble.setPosition(renderedTransform.x, renderedTransform.y);
```

### Smoke Animation
```typescript
// Multiple clouds with offset positions
const cloudCount = Phaser.Math.Between(2, 4);
for (let i = 0; i < cloudCount; i++) {
  const offsetX = Phaser.Math.Between(-bounds.width / 2, bounds.width / 2);
  const offsetY = Phaser.Math.Between(-bounds.height / 2, bounds.height / 2);
  
  const cloud = scene.add.image(
    renderedTransform.x + offsetX, 
    renderedTransform.y + offsetY, 
    'factions', 
    'buildings/skaduwee/infantry_inn/cloud-vertical.png'
  );
  cloud.setAngle(90); // Horizontal
  cloud.setAlpha(0);
  
  // High depth for smoke (above everything)
  cloud.setDepth(1000000);
  
  scene.tweens.add({
    targets: cloud,
    y: cloud.y - 100, // Rise up
    alpha: 0.5,
    duration: 2000,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: cloud,
        alpha: 0,
        duration: 1000,
        onComplete: () => cloud.destroy()
      });
    }
  });
}
```

### Depth Calculation for Isometric
```typescript
// Use DepthHelper to calculate proper isometric depth
const buildingDepth = getGameObjectDepth(buildingGameObject);
// Rubble should be at same or slightly lower depth
rubble.setDepth(buildingDepth ? buildingDepth - 1 : 0);
```

### Rubble Lifecycle
1. Building health reaches 0
2. Rubble spawns at building position with proper scale
3. Smoke clouds spawn and animate (2-3 seconds)
4. Rubble remains visible (configurable, e.g., 30 seconds)
5. Rubble fades out (5 seconds)
6. Rubble destroyed

## Files to Create
- `apps/client/src/app/probable-waffle/game/entity/components/building/rubble-component.ts`
- `apps/client/src/app/probable-waffle/game/entity/components/building/rubble-definition.ts`
- `apps/client/src/app/probable-waffle/game/entity/components/building/building-destruction-effect.ts`

## Files to Modify
- `apps/client/src/app/probable-waffle/game/entity/components/combat/components/health-component.ts`
- `apps/client/src/app/probable-waffle/game/data/actor-component.ts` (component registration)

## Dependencies
- Phaser tweens system
- Existing game object bounds calculation
- Existing depth helper
- Scene time events
