# Probable Waffle runtime source routes

All paths in the following table are relative to libs/games/probable-waffle/phaser/src/lib/. Existing entry points, verified 2026-09-05; inspect current implementations before changing behavior.

| Responsibility | Existing entry point / local search anchor |
| --- | --- |
| AI cadence and ownership | player/ai-controller/player-ai-controller.agent.ts |
| Planner prerequisite (#759 Stage 0) | player/ai-controller/ai-behavior/base-planner.ts ; player/ai-controller/ai-behavior/map-analyzer.ts |
| AI order dispatch | player/ai-controller/dispatch-ai-order.ts |
| Shared applied orders | world/services/multiplayer/command-bus.service.ts ; entity/systems/queue-command.system.ts ; entity/systems/action.system.ts |
| Actor capabilities and faction tech | prefabs/definitions/actor-definitions.ts ; prefabs/definitions/prefab-definition.ts ; data/tech-tree/tech-tree.service.ts |
| Indexed actors / fixed clock | world/services/ActorIndexSystem.ts ; world/services/simulation-tick.service.ts |
| Access and topology | world/services/navigation.service.ts |
| Save/load and authoritative hash | data/save-game.ts ; data/load-game.ts ; world/services/recovery/state-hash.service.ts |
| Match end conditions | world/state/GameModeConditionChecker.ts |
| In-game AI panel | prefabs/gui/debug/ai-controller/AiControllerDebugPanel.ts |

Cross-library paths (repository-relative):

- Pure AI interfaces: libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/
- Wire commands: libs/games/probable-waffle/protocol/src/lib/game-instance/probable-waffle/game-command.ts
- Server authorization: libs/games/probable-waffle/server/src/lib/probable-waffle/game-instance/multiplayer/game-command-validator.service.ts
- Browser harness host: apps/portal-e2e/

Read adjacent specs and follow imports for the next consumer. For spells, containers, gathering, housing or target-domain changes, start at the definition registry, then follow the specific component implementation; do not infer behavior from a familiar RTS name.

## Proven discovery traps

- Resource-drain/drop-off capacity is not mobile troop transport. Housing is positive housingCapacity, not an “economic building” label.
- Same-type capacity may be useful. Count causal commitments through dispatch/queue/site/completion, not just visible actors.
- Ranged is not necessarily anti-air; component flags and effective runtime level matter.
- Debug projection is not gameplay authority. StateHashService is a multiplayer world projection, not an already-built AI evaluation harness.
- The current plan's new pure brain, harness and debug workbench are destinations, not existing APIs.

For #759 only, read docs/ai/759-skirmish-ai/00-start-here.md and its current stage. Its shared-decisions source/destination map owns planned additions and its ledger owns implementation status. Keep generic skills free of issue-specific tuning constants and model assignments.
