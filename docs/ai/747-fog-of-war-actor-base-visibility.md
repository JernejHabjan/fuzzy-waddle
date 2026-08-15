# Fog-of-war actor base visibility plan

Tracks [#747](https://github.com/JernejHabjan/fuzzy-waddle/issues/747).

## Classification and scope

- **Lane:** research/plan; this PR documents the implementation path and does not change runtime behavior.
- **Goal:** reveal an actor only when the tile under its logical base is currently visible, regardless of rendered sprite height.
- **Out of scope:** changing vision radius, fog exploration state, actor footprints, multiplayer authority, minimap policy, or the existing hidden/contained actor overrides.

## Research findings

1. `FogOfWarComponent.updateActorsVisibility` currently derives the sampled tile from `getGameObjectBounds(actor).centerX/centerY` and `IsoHelper.isometricWorldToTileXY`. Rendered bounds include the full sprite height, so a tall actor's center can project onto a tile above its ground contact and become visible before its base tile is visible.
2. The same component already calls `getGameObjectCurrentTile` when tracking movement and accumulating player vision. That helper delegates to `NavigationService.getCenterTileCoordUnderObject`, making it the existing tile-position authority for actors.
3. `getCenterTileCoordUnderObject` derives the center of the actor's logical footprint. `getTileCoordsUnderObject` uses the logical transform's Y coordinate and the footprint width, not rendered sprite height; its comment identifies the Z-axis invariant explicitly. This matches the issue's requested base-of-actor semantics and also keeps flying actors anchored to their logical ground tile.
4. Actor fog visibility is propagated through `VisionComponent.visibilityByCurrentPlayer`. Selection, health/owner UI, containers, and the minimap consume that value, so the fix belongs at the fog component's single visibility decision rather than in those downstream consumers.
5. `FogOfWarMode.ALL_VISIBLE`, `HealthComponent.hidden`, and `ContainableComponent.isContained()` are independent overrides in `setActorVisibleByFow` and should remain unchanged.
6. There is no focused fog-of-war regression spec today. The Phaser library uses Jest with the repository Phaser mock, so a component-level regression spec can be added without starting the game runtime.

## Inputs and follow-up

- No third-party code, assets, datasets, or licensed inputs are needed.
- The implementation-ready follow-up is #747 itself using the checklist below; no additional GitHub issue is needed.

## Recommended implementation

- [ ] Replace rendered-bounds-center projection in `updateActorsVisibility` with `getGameObjectCurrentTile(actor)`.
- [ ] Remove the now-unused `getGameObjectBounds` and `IsoHelper` imports from the fog component.
- [ ] Keep an unresolved logical tile as a no-op for that update, matching the current unresolved-bounds behavior; do not fall back to rendered bounds because that restores the defect.
- [ ] Update the method documentation to state that visibility samples the logical footprint center/base tile and is independent of sprite height and render altitude.
- [ ] Add `fog-of-war.component.spec.ts` covering a tall actor whose rendered center lies on a visible tile while its logical base tile is hidden; assert the actor remains hidden until the base tile becomes visible.
- [ ] Cover both the `VisionComponent.visibilityByCurrentPlayer` value and the game object's visible state so downstream UI/minimap consumers cannot diverge.
- [ ] Preserve focused cases for `ALL_VISIBLE`, explicitly hidden actors, and contained actors if the component harness exposes those branches economically; otherwise record them as unchanged manual checks.

## Verification

- [ ] Run `NX_DAEMON=false npx nx test probable-waffle-phaser --runInBand` and confirm the focused spec is discovered.
- [ ] Run `NX_DAEMON=false npx nx lint probable-waffle-phaser`.
- [ ] Manually place a sprite taller than one tile just beyond a vision boundary and confirm its upper pixels do not reveal it while its logical base tile is hidden.
- [ ] Move vision onto and then away from the base tile; confirm actor, selection affordances, health/owner UI, and minimap visibility change together.
- [ ] Repeat with a multi-tile building and a flying actor to confirm footprint-center and Z-invariant behavior.
- [ ] Check `PRE_EXPLORED`, `FULL_EXPLORATION`, and `ALL_VISIBLE`, plus hidden and contained actors, for unchanged policy behavior.

## Acceptance criteria

- A tall actor is hidden whenever its logical base/footprint-center tile is not currently visible, even if part of its rendered sprite overlaps visible space.
- The actor becomes visible when that logical tile enters current vision and hides again when it leaves current vision.
- Sprite height and render altitude do not select the fog visibility tile.
- Existing omniscient, hidden, contained, selection, UI, and minimap behavior remains consistent.
- A focused automated regression test protects the logical-base invariant, and Phaser test/lint validation passes.

## Risks and deferred work

- This plan intentionally uses the existing footprint-center definition. Changing visibility to require any/all tiles of a multi-tile footprint is a separate gameplay-policy decision and is not required by #747.
- The actor visibility scan remains client-rendering state updated on the existing throttled cadence; simulation, networking, and persisted state are unaffected.

## Continuation prompt

```text
Implement #747 from docs/ai/747-fog-of-war-actor-base-visibility.md. Use getGameObjectCurrentTile as the fog visibility authority, add the focused tall-actor regression test, preserve all existing visibility overrides, run the listed Phaser test and lint checks, and complete the omission and closure audits.
```
