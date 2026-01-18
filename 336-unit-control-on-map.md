# 336 - Take Control of Units on Map

## Overview
Implement a system where units on the map without a faction can be controlled by nearby players. When a player's unit gets close enough, ownership is assigned with a visual blink effect.

## Implementation Steps

### 1. Create ConvertibleComponent
- [ ] Create file: `apps/client/src/app/probable-waffle/game/entity/components/convertible-component.ts`
- [ ] Component tracks if actor can be converted (no owner set)
- [ ] Store detection range (default: 8 tiles)
- [ ] Store check interval for proximity checks (default: 500ms)
- [ ] Track accumulated delta time for interval checking
- [ ] Subscribe to scene UPDATE event with (time, delta) parameters
- [ ] Add component registration/unregistration logic
- [ ] Implement destroy/cleanup method
- [ ] Subscribe to OwnerComponent changes to self-remove when owner is assigned

### 2. Create ConvertibleDefinition Type
- [ ] Add to `libs/api-interfaces/src/lib/probable-waffle.ts` or create separate file
- [ ] Define interface with: `detectionRange: number`, `checkInterval: number`
- [ ] Export from api-interfaces index

### 3. Create EditorConvertible Component
- [ ] Create file: `apps/client/src/app/probable-waffle/game/world/scenes/editor-components/EditorConvertible.ts`
- [ ] Follow EditorOwner pattern structure
- [ ] Add property: `detection_range` (default: 8)
- [ ] Add property: `check_interval` (default: 500ms)
- [ ] In awake method: attach ConvertibleComponent to actor if no owner exists
- [ ] Use getActorComponent to add ConvertibleComponent
- [ ] Add START-USER-CODE/END-USER-CODE sections
- [ ] Add START OF COMPILED CODE/END OF COMPILED CODE sections

### 4. Create PhaserEditor Component Definition
- [ ] Create/update: `apps/client/src/app/probable-waffle/game/world/scenes/editor-components/EditorBehaviors.components`
- [ ] Add EditorConvertible component definition
- [ ] Set gameObjectType: "Phaser.GameObjects.GameObject"
- [ ] Add property: detection_range (type: number, default: 8)
- [ ] Add property: check_interval (type: number, default: 500)
- [ ] Ensure outputLang: "TYPE_SCRIPT"
- [ ] Ensure exportClass: true

### 5. Implement Proximity Detection System
- [ ] In ConvertibleComponent update method (called via scene UPDATE event with time and delta)
- [ ] Check if cooldown elapsed using real delta time (adjusted for scene.time.timeScale)
- [ ] Accumulate delta time: `lastCheckTime += delta`
- [ ] Compare against checkInterval: `if (lastCheckTime >= checkInterval)`
- [ ] Reset timer after check: `lastCheckTime = 0`
- [ ] Get actor current tile position
- [ ] Use ActorIndexSystem.getOwnedActors for each player number
- [ ] Filter actors with OwnerComponent within detection range
- [ ] Use DistanceHelper.getTileDistanceBetweenGameObjects for fast distance check
- [ ] No pathfinding needed - straight line distance only
- [ ] If any owned actor within range, trigger conversion
- [ ] Remove ConvertibleComponent after conversion

### 6. Implement Conversion Logic
- [ ] Create method in ConvertibleComponent: `convertToOwner(ownerNumber: number)`
- [ ] Get OwnerComponent from actor using getActorComponent
- [ ] Call OwnerComponent.setOwner(ownerNumber)
- [ ] Trigger blink effect
- [ ] Use removeActorComponent to remove ConvertibleComponent

### 7. Implement Blink Effect in OwnerComponent
- [ ] Add to OwnerComponent.setOwner method
- [ ] Check if oldOwner !== newOwner and oldOwner was undefined
- [ ] Create blink animation using Phaser tweens
- [ ] Blink twice quickly (duration: ~150ms per blink)
- [ ] Use tint property for visual feedback
- [ ] Tint values: alternate between 0xFFFFFF (white) and owner color
- [ ] Chain tweens: normal -> tint -> normal -> tint -> normal
- [ ] Total duration: ~600ms

### 8. Integration with ActorData
- [ ] Add convertible property to ActorDefinition type
- [ ] Update gatherCoreActorData or appropriate method
- [ ] Add ConvertibleComponent to components array if convertible definition exists
- [ ] Add to actor serialization/deserialization

### 9. Performance Optimization
- [ ] Ensure proximity check uses cooldown (not every frame)
- [ ] Use Set for tracking convertible actors if needed
- [ ] Consider spatial partitioning if many convertible units exist
- [ ] Profile update loop impact

### 10. Add to Example Map/Scene
- [ ] Open map in PhaserEditor
- [ ] Add EditorConvertible to test units
- [ ] Set detection_range to 8
- [ ] Verify component appears in editor
- [ ] Test in-game conversion

## File Structure
```
apps/client/src/app/probable-waffle/game/
├── entity/components/
│   └── convertible-component.ts                    [NEW]
├── world/scenes/editor-components/
│   ├── EditorBehaviors.components                  [UPDATE]
│   └── EditorConvertible.ts                        [NEW]
libs/api-interfaces/src/
└── lib/probable-waffle.ts                          [UPDATE]
```

## Technical Details

### Time Scale Handling
- Scene UPDATE event provides: `update(time: number, delta: number)`
- Delta is already scaled by `scene.time.timeScale` (1x, 3x, 10x, 100x)
- Accumulate delta: `this.accumulatedTime += delta`
- Check interval: `if (this.accumulatedTime >= this.checkInterval)`
- Reset after check: `this.accumulatedTime = 0`
- This ensures checks happen at correct intervals regardless of game speed
- Blink animation uses `scene.tweens.timeScale` which is already set by GameSpeedModifier

### Distance Check
- Use `DistanceHelper.getTileDistanceBetweenGameObjects()`
- Fast sqrt calculation, no pathfinding
- Check all owned actors from ActorIndexSystem per player
- Range check: distance <= detectionRange

### Blink Animation
```typescript
// Pseudo-code for blink effect
scene.tweens.chain({
  targets: gameObject,
  tweens: [
    { tint: 0xFFFFFF, duration: 150 },
    { tint: ownerColor, duration: 150 },
    { tint: 0xFFFFFF, duration: 150 },
    { tint: ownerColor, duration: 150 }
  ]
});
```

### Component Lifecycle
1. EditorConvertible.awake() -> adds ConvertibleComponent if no owner
2. ConvertibleComponent subscribes to scene UPDATE event
3. ConvertibleComponent.update(time, delta) -> accumulates delta, checks proximity on interval
4. ConvertibleComponent.convertToOwner() -> assigns owner + blink
5. Component self-removes after conversion

## Dependencies
- ActorIndexSystem
- OwnerComponent
- DistanceHelper
- getActorComponent/removeActorComponent
- Phaser Tweens system

## Notes
- **No tests required** - testing steps removed from implementation plan
- Focus on performance: interval-based checks, no pathfinding
- Visual feedback essential: 2 quick blinks
- Component must not interfere with existing faction assignments
- Time scale (1x, 3x, 10x, 100x) handled automatically via delta accumulation
