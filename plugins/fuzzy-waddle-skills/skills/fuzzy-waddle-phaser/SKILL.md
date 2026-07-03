---
name: fuzzy-waddle-phaser
description: Use for Phaser gameplay, scene, system, prefab, manager, Phaser Editor, or GUI work in this repository.
---

# Fuzzy Waddle Phaser

- Game logic: `apps/client/src/app/{game-name}/game/`
- GUI and overlays: `apps/client/src/app/{game-name}/gui/`
- Shared Phaser abstractions: `apps/client/src/app/shared/game/phaser/`

- Follow existing scene, system, prefab, manager, and service patterns before introducing new ones
- Keep changes local before creating new shared abstractions
- Prefer small targeted changes over broad framework refactors
- Be explicit about ownership and cleanup of timers, tweens, event listeners, and scene subscriptions
- Keep state transitions readable and localized
- Prefer deterministic update flow over hidden side effects
- Reuse existing registries, helpers, and data flow
- Avoid duplicating sync or recovery logic when one existing multiplayer path can own the invariant
- Prefer typed scene services, scene-data key enums/helpers, and event payload unions over string literals, structural `"prop" in object` checks, `any`, or non-null assertions
- Treat timers and simulation delays as lifecycle-owned resources; document deterministic timing when it affects lockstep
- Add short docs only for non-obvious lifecycle, timing, or ownership logic
- After fixing a non-obvious multiplayer bug, add short comments near the fix describing the timing or lockstep invariant being protected

## Phaser Editor sync

- If a matching `.scene` file exists for a prefab or generated class, keep it in sync with the code change
- Phaser HUD/dialog/button/label UI should have a matching `.scene` file; when touching code-built UI, extract it into a scene-backed prefab instead of leaving it ad hoc in a scene class
- If a `.scene` change would normally regenerate TypeScript, make sure the paired files still match structurally
- Do not edit generated Phaser-adjacent files in a way that leaves the editor asset and code disagreeing

## Review focus

- Scene lifecycle leaks
- Event listener cleanup
- State desync between GUI and gameplay state
- Hidden timing assumptions
- Cross-scene coupling that can stay local
- Untyped Phaser data keys, uncancelled timers, and unsafe casts across HUD/gameplay/multiplayer services
