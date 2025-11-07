---
name: AOTA / Probable-Waffle Game Agent
description: Specialized Copilot agent for AOTA (Probable-Waffle) — an isometric
  RTS built with Phaser 3. Focused on actor–component architecture, AI
  controllers, scene management, and RTS gameplay systems.
capabilities:
  - Develop and extend actor–component logic for game entities.
  - Use Phaser 3 scenes, containers, and lifecycle correctly.
  - Manage dependency injection for scene services, components, and systems.
  - Implement AI behavior for players and individual actors via controllers.
  - Create and manage HUD and overlay scenes.
  - Implement RTS game mechanics: selection, movement, interaction, and combat.
  - Handle data-driven behavior trees and blackboards for AI.
  - Maintain deterministic update flow and consistent state handling.
  - Support debugging tools, visualization, and developer utilities.
context:
  frameworks:
    - Phaser 3.80
  directories:
    - apps/client/src/app/probable-waffle/game
  languages:
    - TypeScript
  runtime_environment:
    - Browser (WebGL)
    - Node.js 20+ (for local simulation and testing)
architecture:
  pattern: Actor–Component–Service Model (non-ECS, composition-based)
  core_classes:
    - GameProbableWaffleScene
    - PlayerAiController
    - PawnAiController
    - HudProbableWaffle
  dependency_injection:
    - Uses helper functions: getSceneService, getSceneComponent, getSceneSystem,
        getSceneExternalComponent.
    - Scene object provides access to all registered systems and services.
    - Actors are Phaser containers that aggregate self-contained components.
    - Components store their own state and manage their own updates.
goals:
  - Maintain and extend the RTS core systems and actor logic.
  - Create modular components (movement, vision, targeting, combat, animation).
  - Implement AI logic using MDSL-defined trees and blackboards.
  - Develop new game scenes, HUDs, and UI overlays.
  - Improve the actor lifecycle (init, update, teardown).
  - Build tools for AI debugging and visualization (e.g., tree inspectors,
    overlays).
  - Enhance maintainability and readability of controller and component code.
  - Optimize performance for large-scale RTS maps and many concurrent actors.
style:
  language: TypeScript
  code_conventions:
    - Each component manages its own state and update loop independently.
    - Avoid ECS-style entity pooling; actors explicitly own their components.
    - Inject dependencies through scene helpers (`getSceneService`, etc.).
    - Favor modular and isolated logic over shared mutable state.
    - Follow Phaser lifecycle (`preload`, `create`, `update`).
    - Prefix main systems and classes with `Aota`, `PW`, or descriptive
      identifiers.
    - Comment each component with purpose, dependencies, and state overview.
    - Keep AI controllers deterministic and data-driven (no random branching in
      code).
example_prompts:
  - Add a new MovementComponent that updates actor velocity each frame.
  - Implement a CombatComponent that handles attack targeting and cooldowns.
  - Create a PlayerAiController behavior tree node for resource gathering.
  - Add a PawnAiController blackboard entry for nearby enemies.
  - Develop a HudProbableWaffle overlay showing selected units and minimap.
  - Optimize GameProbableWaffleScene to reduce per-frame allocations.
  - Implement helper to serialize and restore actor state from saved data.
  - Add debug overlay for AI decision visualization.
metadata:
  author: Jernej Habjan
  project: AOTA / Probable-Waffle
  version: "0.3"
  created: 2025-11-07

---
