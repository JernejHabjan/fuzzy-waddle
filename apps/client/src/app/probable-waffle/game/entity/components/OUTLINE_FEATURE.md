# Sprite Outline Feature

## Overview

The sprite outline feature provides a visual glow effect for selected game objects that remains visible even when the actor is behind other objects like trees or buildings. This is particularly useful in isometric RTS games where units can move behind terrain features.

**Supports:**
- Simple sprites and images (e.g., SkaduweeWorkerMale)
- Containers with multiple child sprites (e.g., SkaduweeMagicianFemale, SkaduweeWarriorMale)
- Complex animated prefabs with composition patterns

## Implementation

The feature consists of two main components:

### 1. OutlineComponent

Located at: `apps/client/src/app/probable-waffle/game/entity/components/outline-component.ts`

**How it works:**
- For **simple sprites/images**: Creates a duplicate sprite at very high depth
- For **containers**: Creates a container with duplicate sprites for all child sprites
- Positions duplicates at `Number.MAX_SAFE_INTEGER` depth to ensure they're always rendered on top
- Applies Phaser's built-in glow effect using `postFX.addGlow()`
- Synchronizes position, animation, rotation, scale, and flip state with the original sprite(s) every frame
- Automatically cleans up when the game object is destroyed

**Key features:**
- White glow effect with customizable parameters (color: 0xffffff, outerStrength: 4)
- Semi-transparent outline sprite (alpha: 0.3) to create a "knockout" effect
- Frame-by-frame synchronization via scene update event
- Support for animated sprites, static images, and container compositions

### 2. SelectableComponent Integration

Located at: `apps/client/src/app/probable-waffle/game/entity/components/selectable-component.ts`

**Changes:**
- Added `enableOutline` option to `SelectableDefinition` (enabled by default)
- Automatically creates an `OutlineComponent` when the selectable component is initialized
- Shows outline when actor is selected
- Hides outline when actor is deselected
- Updates outline position when actor moves

## Usage

### Default Behavior

By default, all selectable game objects will have the outline feature enabled. No code changes are required to enable it for existing selectable objects.

### Disabling Outline for Specific Objects

If you want to disable the outline for a specific game object, you can pass `enableOutline: false` in the `SelectableDefinition`:

```typescript
const selectableComponent = new SelectableComponent(gameObject, {
  enableOutline: false,
  offsetY: 10
});
```

### Customizing Outline Appearance

To customize the glow effect parameters, you can modify the values in `outline-component.ts`:

```typescript
// In createOutlineSprite method:
this.glowFX = this.outlineSprite.postFX.addGlow(
  0xffffff,  // color (white)
  4,         // outerStrength
  0,         // innerStrength
  false,     // knockout (not used in Phaser 4)
  0.1,       // quality
  10         // distance
);

// Adjust transparency:
this.outlineSprite.setAlpha(0.3);  // Lower = more transparent
```

## Technical Details

### Performance Considerations

- Outline sprites are only created when needed (when an object is selected)
- For containers, one outline sprite is created per child sprite
- All outline sprites are destroyed when the game object is destroyed
- Updates occur every frame, but only for selected objects
- The glow effect is a shader-based post-processing effect, which is GPU-accelerated

### Compatibility

- ✅ Works with `Phaser.GameObjects.Sprite` (animated sprites)
- ✅ Works with `Phaser.GameObjects.Image` (static images)
- ✅ Works with `Phaser.GameObjects.Container` (complex prefab compositions)
- ✅ Supports containers with multiple child sprites
- ✅ Synchronizes animations for all child sprites in containers

### Depth Ordering

The outline sprites are rendered at `Number.MAX_SAFE_INTEGER` depth, ensuring they're always visible on top of all other game objects, including:
- Terrain tiles
- Trees and foliage
- Buildings
- Other actors

For containers, a high-depth container is created to hold all child outline sprites, maintaining proper relative positioning.

## References

This implementation is based on advice from Rex (rexrainbow), the author of phaser3-rex-plugins:

- Rex's outline example: https://codepen.io/rexrainbow/pen/dyGNrqa
- Rex's documentation: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-builtin/#glow
- Discord conversation: Rex suggested creating a duplicate sprite at top depth with built-in glow effect and knockout parameter

## Future Improvements

Potential enhancements:

1. **Configurable colors**: Allow different outline colors for different teams/players
2. **Animated glow**: Add pulsing or breathing effects to the outline
3. **Performance optimization**: Implement object pooling for outline sprites
4. **Customizable per-object**: Allow each object to have custom outline settings
5. **Nested container support**: Handle deeply nested container hierarchies

## Troubleshooting

### Outline not visible

- Ensure the game object is a `Sprite`, `Image`, or `Container` instance
- Check that `enableOutline` is not set to `false`
- Verify that the object is being selected (check `SelectableComponent.setSelected(true)`)
- For containers, ensure child sprites are actually `Sprite` or `Image` instances

### Outline position out of sync

- The outline position is updated every frame via the scene update event
- If you're manually changing the object's position outside of the normal update cycle, ensure you call `outlineComponent.update()`
- For containers, child sprite positions are relative to the container

### Performance issues with containers

- Complex containers with many child sprites will create multiple outline sprites
- Consider disabling outlines for objects that are frequently selected/deselected
- Reduce the number of simultaneously selected objects
- Lower the glow quality parameter if needed
