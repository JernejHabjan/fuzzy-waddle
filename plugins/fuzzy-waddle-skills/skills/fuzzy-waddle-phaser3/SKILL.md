---
name: fuzzy-waddle-phaser3
description: Use for Phaser 3 gameplay, scene, system, prefab, manager, or GUI changes in this repository, especially when working under apps/client game folders and needing repo-specific structure, low-noise comments, and lightweight documentation for non-trivial classes and methods.
---

# Fuzzy Waddle Phaser 3

Use this skill for Phaser 3 implementation and review work in the client app.

## Where code lives

- Game logic: `apps/client/src/app/{game-name}/game/`
- GUI and overlays: `apps/client/src/app/{game-name}/gui/`
- Shared Phaser abstractions: `apps/client/src/app/shared/game/phaser/`
- Assets: `apps/client/src/assets/{game-name}/`
- Metadata: `apps/client/src/metadata/{game-name}/`

## Working rules

- Follow existing scene, system, prefab, manager, and service patterns before introducing new ones
- Keep gameplay code close to the relevant game area instead of creating new shared abstractions too early
- Prefer small targeted changes over broad framework refactors
- Prefer existing game architecture entry points such as `TechTreeService`, `pwActorDefinitions`, and `ActorIndexSystem` before inventing parallel lookup or inference paths
- Avoid hardcoded faction, building, unit, or resource defaults when the same choice can be inferred from definitions, metadata, or tech-tree data
- Prefer computed needs and planner outputs over brittle scalar state that drifts out of sync with the actual game model
- Keep planners, managers, and controllers separated by responsibility; if a class starts accumulating unrelated economy, combat, placement, and intel logic, split it
- Prefer per-resource, per-building-type, or per-player structures over flattened aggregate fields when the game logic depends on that distinction
- When extending blackboard-style state, treat god-object growth as a design smell and prefer narrower derived state owned by the relevant subsystem
- When scaling gameplay decisions, prefer throughput, queue saturation, current income, and map state over raw object counts
- For `agent-ready` issues, add meaningful tests and run the smallest relevant checks; follow the autonomous-delivery skill for branch and draft-PR authority.

## Documentation rules

- When changing a non-trivial service, manager, controller, or scene helper, add short documentation
- Prefer a brief class comment when the role is not obvious from the file name
- Add short method comments only for non-obvious lifecycle, timing, ownership, or synchronization logic
- Evaluate every created or changed public **and private** class, interface, type, enum, field, method, and helper for documentation. Review and improve existing docs whenever behavior or clarity changes. Explain behavior, ownership, lifecycle, deterministic ordering, persistence, side effects, and cleanup where the code is not self-evident; omit trivial constructors/getters/setters and never restate the symbol name.
- Treat interfaces, type aliases, enums, discriminated unions, and nested object members as documented APIs: explain non-trivial properties/members, their valid representation and lifecycle/persistence role, and link them to the owning contract with `{@link Symbol}`.
- Scale documentation to complexity: longer or branch-heavy code needs proportionally more explanation of state transitions, authority boundaries, failure behavior, recovery, and resource cleanup. Keep documentation updated with implementation changes, link related authorities with `{@link Symbol}` when useful, and migrate durable issue/design-brief decisions into the owning code. Use compact ASCII workflows for multi-stage scene or runtime flows when they make ownership clearer.
- When a scene consumes authored scenario data, document whether a marker/reference is executable, planned-only, or deferred. Do not let a schema-valid planning brief imply that map markers are authored or that the mission is launchable.
- Use `satisfies ExactContract` for inline scene data, payloads, action definitions, and configuration objects without a direct annotation when an exact contract exists; do not use an assertion to bypass that contract.
- Inline comments are acceptable when explaining tricky Phaser flow such as update loops, event cleanup, tween timing, or scene teardown

## Phaser-specific guidance

- Be explicit about ownership and cleanup of timers, tweens, event listeners, and scene subscriptions
- Keep state transitions readable and localized
- Prefer deterministic update flow over hidden side effects
- Reuse existing registries, event buses, and game-specific data patterns already present in the repo
- If gameplay logic depends on periodic recomputation, prefer explicit cadence-based updates over hidden one-off refresh paths
- When placement, targeting, or resource logic depends on world queries, prefer indexed/queryable structures such as `ActorIndexSystem` rather than repeated scene-wide scans
- For faction/gameplay inference, prefer definition-driven logic from metadata over special-casing one known object name
- Favor reusable scoring and selection helpers over scattered ad hoc conditionals when multiple systems must choose buildings, units, tiles, or targets

## Review focus

- Scene lifecycle leaks
- Event listener cleanup
- State desync between GUI and gameplay state
- Hidden timing assumptions
- Cross-scene coupling that can stay local
- Architecture drift where definitions/services already provide the needed source of truth
- Blackboard or controller growth that should be split into smaller planner/manager responsibilities
- Hardcoded gameplay decisions that should be inferred from tech tree, definitions, or indexed world state

## Output

- Keep responses short
- Use bullets by default
