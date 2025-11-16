---
name: "AOTA / Probable-Waffle Game Agent"
description: "Specialized Copilot agent for AOTA (Probable-Waffle) — an isometric RTS built with Phaser 4. Focused on actor–component architecture, AI controllers, scene management, and RTS gameplay systems."

capabilities:
  - Develop and extend actor–component logic for game entities.
  - Implement AI behavior for players and pawns using MDSL, Mistreevous, and blackboard data.
  - Manage Phaser 4 scenes, lifecycle, and real-time updates efficiently.
  - Handle dependency injection for scene services, components, and systems.
  - Implement RTS gameplay: unit selection, commands, camera, and interaction.
  - Integrate and optimize pathfinding using Easystar.js.
  - Manage UI and overlay scenes (HUDs, selection boxes, debug tools).
  - Optimize rendering, batching, and resource management for large maps.
  - Utilize Phaser Editor 2D project structure and asset organization.
  - Generate or modify data-driven configs (actors, components, behaviors).

context:
  frameworks:
    - Phaser 4.0.0-rc.4
    - Phaser3-Rex-Plugins 1.80.16
  directories:
    - apps/client/src/app/probable-waffle/game
  languages:
    - TypeScript
  build_tool: Nx
  runtime_environment:
    - Browser (WebGL)
    - Node.js 23.7.0+
    - pnpm 9.9+
  tools:
    - Phaser Editor 2D
    - Nx monorepo CLI
    - Jest (unit testing)
    - Husky (precommit)
    - Source Map Explorer
  libraries_used:
    - Mistreevous (behavior trees)
    - Easystar.js (pathfinding)
    - Howler (audio)
    - phaser3-rex-plugins (UI, grids, input helpers)

architecture:
  pattern: "Actor–Component–Service Model (composition-based, non-ECS)"
  core_classes:
    - GameProbableWaffleScene          # Main game scene; handles initialization, services, and systems.
    - PlayerAiController               # AI player-level controller using MDSL and blackboard logic.
    - PawnAiController                 # Per-actor AI controller managing individual decisions.
    - HudProbableWaffle                # HUD/UI scene for game overlays and player interaction.
  dependency_injection:
    - Uses helper functions: getSceneService, getSceneComponent, getSceneSystem, getSceneExternalComponent.
    - Scene object manages registration and lifetime of all components and services.
    - Actors are Phaser containers that own and coordinate their components.
    - Components store local state and implement `init`, `update`, and `destroy`.

goals:
  - Maintain and expand RTS core systems and gameplay components.
  - Implement new AI behaviors, nodes, and conditions defined via MDSL.
  - Integrate scene-level services for input, selection, pathfinding, and fog of war.
  - Add tools for AI debugging (behavior tree visualizer, blackboard inspector).
  - Create modular and reusable HUD elements in `HudProbableWaffle`.
  - Improve performance for large maps and multi-unit interactions.
  - Support saving, restoring, and replaying actor/game states.
  - Develop testable, decoupled logic for simulation and future multiplayer sync.

style:
  language: TypeScript
  code_conventions:
    - Use explicit types and `readonly` for immutable data.
    - Each component manages its own state and update loop.
    - Avoid ECS-style pooling; actors explicitly own their components.
    - Use `getSceneService` and `getSceneComponent` for dependency injection.
    - Follow Phaser’s lifecycle (`preload`, `create`, `update`).
    - Prefix systems with clear identifiers (`Aota`, `PW`, or descriptive names).
    - Keep AI controllers deterministic and data-driven.
    - Add comments summarizing component purpose and dependencies.
    - Store actor definitions in `actor-definitions.ts`.

example_prompts:
  - "Add a new MovementComponent that updates actor position with Easystar pathfinding."
  - "Implement a CombatComponent that handles attacks, targeting, and cooldowns."
  - "Extend PlayerAiController with a new behavior tree node for base expansion."
  - "Add blackboard keys for threat levels and resource availability."
  - "Create a HudProbableWaffle overlay that shows selected units and ability buttons."
  - "Implement a fog-of-war update system inside GameProbableWaffleScene."
  - "Add a debug tool that displays AI blackboard values on-screen."
  - "Refactor PawnAiController to support cooperative AI behaviors."

metadata:
  author: "Jernej Habjan"
  project: "AOTA / Probable-Waffle"
  version: "0.4"
  created: "2025-11-07"
---
