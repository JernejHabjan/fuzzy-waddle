# Fog-of-war actor visibility plan

Tracks [#747](https://github.com/JernejHabjan/fuzzy-waddle/issues/747).

## Classification and scope

- **Lane:** implemented follow-up; this document preserves the approved implementation rationale.
- **Goal:** reveal an actor when at least one tile under its logical base is currently visible, regardless of rendered sprite height, and briefly reveal an otherwise unseen attacker when it fires a projectile at a current-player unit.
- **Out of scope:** changing vision radius, fog exploration state, actor footprints, multiplayer authority, minimap policy, or the existing hidden/contained actor overrides.

## Implementation status

The implementation now uses the complete logical base footprint, adds the local-only typed
projectile-fired temporary reveal path, and includes focused footprint regressions. The remaining
manual playtest items below remain useful release validation rather than unimplemented work.

## Research findings

1. `FogOfWarComponent.updateActorsVisibility` currently derives one sampled tile from `getGameObjectBounds(actor).centerX/centerY` and `IsoHelper.isometricWorldToTileXY`. Rendered bounds include the full sprite height, so a tall actor's center can project onto a tile above its ground contact and become visible before any tile under its base is visible.
2. Replacing that projection with `getGameObjectCurrentTile` would remove the sprite-height defect, but it would still sample only the logical footprint center. That is incorrect for wide buildings: the intended policy is **any visible logical base tile reveals the actor**.
3. `getTileCoordsUnderObject(tilemap, actor)` is the existing full-footprint authority. It uses the logical transform's Y coordinate and footprint width rather than rendered sprite height, so it keeps tall and flying actors anchored to their logical ground footprint while retaining every base tile of a multi-tile actor.
4. Actor fog visibility is propagated through `VisionComponent.visibilityByCurrentPlayer`. Selection, health/owner UI, containers, and the minimap consume that value, so both ordinary and temporary reveals belong at the fog component's single visibility decision rather than in those downstream consumers.
5. `AttackComponent.spawnProjectileAndFire` reaches the projectile-spawn boundary after the authored fire delay and validates both attacker and target. The notification must be published only after the first salvo projectile is successfully created; an attempted, cancelled, or failed-to-materialize attack must not reveal its source.
6. The projectile notification can carry attacker and target game objects. `FogOfWarComponent` can then apply the local-only policy by checking that the target is owned by the current player and that the attacker is not already visible from its base footprint.
7. `FogOfWarMode.ALL_VISIBLE`, `HealthComponent.hidden`, and `ContainableComponent.isContained()` are independent overrides in `setActorVisibleByFow` and must remain unchanged. Temporary reveal is an additional fog reason, not a bypass around explicit hidden/contained state.
8. There is no focused fog-of-war regression spec today. The Phaser library uses Jest with the repository Phaser mock, so component-level regression coverage can be added without starting the game runtime.

## Inputs and follow-up

- No third-party code, assets, datasets, or licensed inputs are needed.
- The implementation-ready follow-up is #747 itself using the checklist below; no additional GitHub issue is needed.

## Recommended implementation

### Logical base-footprint visibility

- [ ] Replace rendered-bounds-center projection in `updateActorsVisibility` with `getTileCoordsUnderObject(this.tilemap, actor)` and reveal the actor when `.some(...)` base-tile key is present in `visibleTiles`.
- [ ] Do not use `getGameObjectCurrentTile` for this decision; it returns only the footprint center and would hide a wide building whose edge base tile is visible.
- [ ] Remove the now-unused `getGameObjectBounds` and `IsoHelper` imports from the fog component and add the full-footprint helper import.
- [ ] Keep an unresolved or empty logical footprint as a no-op for that update, matching the current unresolved-bounds behavior; do not fall back to rendered bounds because that restores the defect.
- [ ] Update method documentation to state that ordinary fog visibility is true when any logical base tile is visible and is independent of sprite height and render altitude.

### Extensible temporary actor visibility

- [ ] Add a typed projectile-fired scene notification containing the attacker and intended target. Emit it once per attack, immediately after the first salvo projectile is successfully created, rather than once per salvo projectile; cancellation, activity, health, and projectile-factory failures must not publish it.
- [ ] Add a documented, typed temporary-visibility reason such as `TemporaryActorVisibilityReason.ProjectileFiredAtCurrentPlayer` and a reusable `FogOfWarComponent.requestTemporaryActorVisibility(actor, reason, durationMs)` entry point. Future reveal conditions must use this entry point instead of setting the game object or `VisionComponent` directly.
- [ ] Store active temporary reasons per actor ID with their expiry. Compute effective fog visibility as `baseFootprintVisible || hasActiveTemporaryReason`; repeated requests for the same actor/reason refresh or extend the expiry without creating competing timers.
- [ ] Subscribe `FogOfWarComponent` to the projectile-fired notification. When the projectile target is owned by the current player, the attacker is active, and the attacker is not already base-visible, request a brief reveal of the attacker. Ignore projectiles aimed at other players' units.
- [ ] Add a named temporary-visibility policy/configuration object with the projectile trigger hardcoded to `enabled: true` for now and a named reveal duration. Keep the check at the trigger boundary so disabling it later requires changing one value and leaves the generic temporary-reveal mechanism available to other conditions.
- [ ] On expiry, force an actor-visibility refresh so an attacker outside ordinary vision hides promptly even if no tile changed. If it enters ordinary vision during the temporary reveal, keep it visible through the normal base-footprint rule after expiry.
- [ ] Clean up the projectile notification listener and all expiry state/timers on scene shutdown. Remove expired entries when actors are destroyed or disappear from `playerActors`.
- [ ] Route temporary visibility through `setActorVisibleByFow` so `VisionComponent.visibilityByCurrentPlayer`, the game object's visible state, selection, health/owner UI, and minimap remain consistent. Explicitly hidden and contained actors must remain visually hidden even while a temporary reason is active.

### Automated coverage

- [ ] Add `fog-of-war.component.spec.ts` covering a tall actor whose rendered center lies on a visible tile while every logical base tile is hidden; assert the actor remains hidden until one logical base tile becomes visible.
- [ ] Add a wide-building case proving that one visible edge base tile reveals the building even when its center tile and remaining base tiles are hidden, and that it hides when no base tiles are visible.
- [ ] Cover both `VisionComponent.visibilityByCurrentPlayer` and the game object's visible state so downstream UI/minimap consumers cannot diverge.
- [ ] Cover an unseen attacker firing a projectile at a current-player unit: it becomes temporarily visible at actual spawn, repeated fire refreshes the duration, and it hides after expiry when no base tile is visible.
- [ ] Cover the negative cases: already base-visible attacker, cancelled or failed projectile before successful spawn, projectile aimed at another player's unit, disabled projectile-reveal policy, hidden actor, and contained actor.
- [ ] Preserve focused cases for `ALL_VISIBLE` if the component harness exposes that branch economically; otherwise record it as an unchanged manual check.

## Verification

- [ ] Run `NX_DAEMON=false npx nx test probable-waffle-phaser --runInBand` and confirm the focused specs are discovered.
- [ ] Run `NX_DAEMON=false npx nx lint probable-waffle-phaser`.
- [ ] Manually place a sprite taller than one tile just beyond a vision boundary and confirm its upper pixels do not reveal it while all logical base tiles are hidden.
- [ ] Move vision onto and then away from one base tile; confirm actor, selection affordances, health/owner UI, and minimap visibility change together.
- [ ] Repeat with a multi-tile building and a flying actor to confirm any-base-tile and Z-invariant behavior.
- [ ] Have an unseen enemy fire a projectile at a current-player unit; confirm the attacker appears briefly from projectile spawn, repeated fire refreshes the reveal, and it hides again unless ordinary footprint visibility applies.
- [ ] Disable the hardcoded projectile-reveal policy and confirm the same attack no longer reveals the attacker, while ordinary fog visibility remains unchanged.
- [ ] Check `PRE_EXPLORED`, `FULL_EXPLORATION`, and `ALL_VISIBLE`, plus hidden and contained actors, for unchanged policy behavior.

## Acceptance criteria

- A tall actor is hidden whenever none of its logical base tiles is currently visible, even if part of its rendered sprite overlaps visible space.
- An actor, including a wide building, becomes visible when any logical base tile enters current vision and hides again when all logical base tiles leave current vision.
- Sprite height and render altitude never select the fog visibility tiles.
- When enabled, an otherwise unseen enemy that actually fires a projectile at a current-player unit becomes visible for the configured brief duration; cancelled attacks and attacks on other players do not reveal it.
- Projectile-triggered reveal can be disabled with one named hardcoded policy value, which defaults to enabled.
- Temporary reveals use a reusable typed reason/request mechanism so future conditions can add reveal reasons without bypassing fog visibility ownership.
- Repeated reveal requests refresh or extend the duration, expiry promptly restores ordinary fog visibility, and scene/actor teardown leaves no listeners, timers, or stale entries.
- Existing omniscient, hidden, contained, selection, UI, and minimap behavior remains consistent.
- Focused automated regression tests protect the any-base-tile and temporary-reveal invariants, and Phaser test/lint validation passes.

## Risks and deferred work

- This plan intentionally uses the existing logical footprint definition and an `any`-tile visibility rule. Changing visibility to require the center or all footprint tiles would be a different gameplay policy.
- Temporary visibility is client-rendering state derived from deterministic projectile fire and local-player ownership. It must not enter snapshots, state hashes, commands, or other simulation/network persistence.
- The initial hardcoded policy controls only projectile-triggered reveals. A user-facing game option or per-scenario configuration can replace it later without changing the generic temporary-reveal API.
- The actor visibility scan remains client-rendering state updated on the existing throttled cadence; simulation, networking, and persisted state are otherwise unaffected.

## Continuation prompt

```text
Implement #747 from docs/ai/747-fog-of-war-actor-base-visibility.md. Use the full logical footprint and reveal actors when any base tile is visible. Add the typed, reusable temporary-visibility mechanism and the hardcoded-on projectile-at-current-player trigger, preserve all existing visibility overrides, add the focused regressions, run the listed Phaser test and lint checks, and complete the omission and closure audits.
```
