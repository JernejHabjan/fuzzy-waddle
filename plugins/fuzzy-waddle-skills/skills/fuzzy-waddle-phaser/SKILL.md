---
name: fuzzy-waddle-phaser
description: Use for Phaser gameplay, scene, system, prefab, manager, Phaser Editor, or GUI work in this repository.
---

# Fuzzy Waddle Phaser

- Game logic: `apps/client/src/app/{game-name}/game/`
- GUI and overlays: `apps/client/src/app/{game-name}/gui/`
- Shared Phaser abstractions: `apps/client/src/app/shared/game/phaser/`
- Assets: `apps/client/src/assets/{game-name}/`
- Metadata: `apps/client/src/metadata/{game-name}/`

- Follow existing scene, system, prefab, manager, and service patterns before introducing new ones
- Keep changes local before creating new shared abstractions
- Prefer small targeted changes over broad framework refactors
- Prefer existing game architecture entry points such as `TechTreeService`, `pwActorDefinitions`, and `ActorIndexSystem` before inventing parallel lookup or inference paths
- Infer faction, building, unit, and resource choices from definitions, metadata, or tech-tree data instead of hardcoding defaults
- Prefer computed needs and planner outputs over scalar state that can drift from the game model
- Keep planners, managers, and controllers separated by responsibility; split classes that accumulate unrelated economy, combat, placement, and intel logic
- Prefer per-resource, per-building-type, or per-player structures when gameplay depends on those distinctions
- Treat blackboard-style state growth as a design smell and prefer narrower derived state owned by the relevant subsystem
- Scale gameplay decisions using throughput, queue saturation, current income, and map state instead of raw object counts
- Be explicit about ownership and cleanup of timers, tweens, event listeners, and scene subscriptions
- Keep state transitions readable and localized
- Prefer deterministic update flow over hidden side effects
- Reuse existing registries, helpers, and data flow
- Prefer explicit cadence-based updates when gameplay logic requires periodic recomputation
- Use indexed or queryable structures such as `ActorIndexSystem` for repeated world queries instead of repeated scene-wide scans
- Prefer reusable scoring and selection helpers when multiple systems choose buildings, units, tiles, or targets
- Avoid duplicating sync or recovery logic when one existing multiplayer path can own the invariant
- Prefer typed scene services, scene-data key enums/helpers, and event payload unions over string literals, structural `"prop" in object` checks, `any`, or non-null assertions
- Strongly type identifiers and links between scenes, maps, missions, actors, and saved records with shared types or enums
- Add concise class/member/method docs for non-trivial lifecycle, persistence, and orchestration code
- Evaluate every created or changed public **and private** scene, prefab, system, manager, service, component, enum, field, method, and helper for documentation. Review and improve existing docs whenever behavior or clarity changes. Explain non-obvious lifecycle ownership, event/timer cleanup, deterministic ordering, scene boundaries, persistence, and world side effects; omit trivial constructors/getters/setters and never restate the symbol name.
- Document changed interfaces, type aliases, enums, discriminated-union variants, and nested object members as contracts too. Explain each non-trivial property/member’s scene authority, lifecycle, deterministic/persistence role, and linked owner with `{@link Symbol}`.
- Scale documentation with complexity: longer or branch-heavy methods must describe ordering, authority, observable effects, recovery behavior, and cleanup responsibilities. Keep docs updated with implementation changes, use `{@link Symbol}` links for related code authorities, and add compact ASCII flows when scene bootstrap, restore, or event ownership crosses three or more stages.
- When an authored scenario carries planning notes, document whether each reference is executable, planned-only, or deferred. Keep planned markers out of launch-time resolution and make validation gaps visible rather than treating a schema-valid map brief as playable.
- Use `satisfies ExactContract` for inline scene data, event payloads, action definitions, and configuration objects without a direct annotation when an exact contract exists. Do not rely on an assertion that suppresses contract checking.
- Prefer one exported class, interface, or substantial type per file; colocate only tiny, tightly coupled contracts
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
- Architecture drift where definitions, metadata, services, or indexes already provide the source of truth
- Blackboard or controller growth that should be split into narrower planner or manager responsibilities
- Hardcoded decisions that should be definition-driven or derived from indexed world state
