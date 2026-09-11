# Probable Waffle runtime source routes

All paths in the following table are relative to libs/games/probable-waffle/phaser/src/lib/. Existing entry points, verified 2026-09-09; inspect current implementations before changing behavior.

| Responsibility                                      | Existing entry point / local search anchor                                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| AI cadence and ownership                            | player/ai-controller/player-ai-controller.agent.ts                                                                                              |
| Pure planner runtime bridge                         | player/ai-controller/player-ai-controller.ts ; player/ai-controller/observation/ai-observation-pipeline.ts                                      |
| Planner prerequisite (#759 Stage 0)                 | player/ai-controller/ai-behavior/base-planner.ts ; player/ai-controller/ai-behavior/map-analyzer.ts                                             |
| AI order dispatch                                   | player/ai-controller/dispatch-ai-order.ts                                                                                                       |
| Shared applied orders                               | world/services/multiplayer/command-bus.service.ts ; entity/systems/queue-command.system.ts ; entity/systems/action.system.ts                    |
| Actor capabilities and faction tech                 | prefabs/definitions/actor-definitions.ts ; prefabs/definitions/prefab-definition.ts ; data/tech-tree/tech-tree.service.ts                       |
| Indexed actors / fixed clock                        | world/services/ActorIndexSystem.ts ; world/services/simulation-tick.service.ts                                                                  |
| Access and topology                                 | world/services/navigation.service.ts ; player/ai-controller/observation/ai-access-graph.adapter.ts                                              |
| Cargo and transport runtime                         | entity/components/building/container-component.ts ; entity/components/building/containable-component.ts ; prefabs/characters/shared/CommonBoat/ |
| Save/load and authoritative hash                    | data/save-game.ts ; data/load-game.ts ; world/services/recovery/state-hash.service.ts                                                           |
| Match end conditions                                | world/state/GameModeConditionChecker.ts                                                                                                         |
| Purposeful skirmish loop                            | player/ai-controller/player-ai-controller.ts                                                                                                    |
| Stable bases and expansion candidates               | player/ai-controller/observation/ai-observation-pipeline.ts ; world/services/multiplayer/shared-command-application.service.ts                  |
| Fortification graph planning                        | prefabs/buildings/tivara/navigation-topology.events.ts ; world/services/height-navigation-graph-builder.ts                                      |
| Causal recovery / anti-blocking                     | player/ai-controller/observation/ai-observation-pipeline.ts ; world/services/multiplayer/command-bus.service.ts                                 |
| Tactical squads, combat estimates and support       | player/ai-controller/observation/ai-observation-pipeline.ts ; player/ai-controller/player-ai-controller.ts                                      |
| Adaptive counters, research and archetype rationale | player/ai-controller/observation/ai-observation-pipeline.ts ; player/ai-controller/player-ai-controller.ts                                      |
| AI incident capture and offline investigation       | player/ai-controller/testing/ai-runtime-scenario-bridge.ts                                                                                      |
| In-game AI panel                                    | prefabs/gui/debug/ai-controller/AiControllerDebugPanel.ts                                                                                       |

Cross-library paths (repository-relative):

- Pure AI interfaces: libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/
- Pure managers for stages 9–14: libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/planning/
- Wire commands: libs/games/probable-waffle/protocol/src/lib/game-instance/probable-waffle/game-command.ts
- Server authorization: libs/games/probable-waffle/server/src/lib/probable-waffle/game-instance/multiplayer/game-command-validator.service.ts
- Browser harness host: apps/portal-e2e/
- AI matrix manifest, release runner and compact report: tools/ai/fixtures/ ; tools/ai/run-skirmish-matrix.mjs ; tools/ai/summarize-skirmish-report.mjs

Read adjacent specs and follow imports for the next consumer. For spells, containers, gathering, housing or target-domain changes, start at the definition registry, then follow the specific component implementation; do not infer behavior from a familiar RTS name.

## Proven discovery traps

- Resource-drain/drop-off capacity is not mobile troop transport. Housing is positive housingCapacity, not an “economic building” label.
- Same-type capacity may be useful. Count causal commitments through dispatch/queue/site/completion, not just visible actors.
- Ranged is not necessarily anti-air; component flags and effective runtime level matter.
- Debug projection is not gameplay authority. StateHashService is a multiplayer world projection, not an already-built AI evaluation harness.
- Navigation height/edge snapshots include runtime surfaces from the whole scene. Player-fair AI topology must gate those cells through the committed observation policy; do not copy the global height graph directly into an AI observation.
- The current plan's new pure brain, harness and debug workbench are destinations, not existing APIs.
- Stage 9 may propose movement, attacks, transport children and concession, but each must travel through `CommandBusService.dispatchAi`; do not restore the legacy controller's direct actor mutation path.
- Base identity is definition-backed by an owned main structure, never an average of mobile actors. Candidate sites are advisory persisted facts; `SharedCommandApplicationService` owns final footprint, navigation, collision, resource and builder validation.
- Combat estimates must consume effective component/definition facts from the committed observation. Keep current opponent cooldowns private, filter weapons by actual target domain, and retain accepted damage/heal/effect reservations only through their bounded impact or terminal outcome.
- In-game AI diagnostics may navigate committed history and saved overlays, but must not call a planner, mutable legacy strategy calculation or live pathfinder to fill a panel row.
- Pure and legacy planners are alternative command authorities. A tick may run one or the other, never both; keep legacy behavior only as an explicit fallback when the pure brain is unavailable.
- Actor indexes can temporarily contain destroyed, cross-scene or incompletely initialized objects. Filter for a stable numeric actor id and the owning scene before deterministic sorting or component projection.
- Project catalog capabilities from definition components. Select workers, transports and combat variants by capability; exact prefab names and human-readable labels are not stable contracts.
- A browser console without `error` events is insufficient AI evidence: accelerated-match smoke must also inspect game log entries such as `Error stepping AI controller`, planner tick progress and accepted production/build-order transitions.

For #759 only, read docs/ai/759-skirmish-ai/00-start-here.md and its current stage. Its shared-decisions source/destination map owns planned additions and its ledger owns implementation status. Keep generic skills free of issue-specific tuning constants and model assignments.
