---
name: fuzzy-waddle-phaser
description: Implement or review Fuzzy Waddle Phaser gameplay, scenes, entities and debug GUI. Use the current workspace libraries and package version, not historical client-app paths.
---

# Phaser ownership and discovery

Read [RTS source routes](references/rts-source-index.md) for Probable Waffle work. For another game, use the repo source index and its existing neighbours. Read package.json for the installed Phaser major; the former phaser3 skill name and apps/client paths are historical, not implementation guidance. No framework migration is implied.

## Runtime rules

- Keep pure gameplay/contracts separate from Phaser adapters and presentation. Follow existing scene/system/service ownership before adding another manager or shared abstraction.
- Reuse TechTreeService, pwActorDefinitions and ActorIndexSystem. Capabilities, costs, faction eligibility, housing, movement and weapon domains come from runtime definitions, not unit names or copied balance tables.
- Keep economy/production, targeting, intelligence and placement responsibilities narrow. Use per-player/resource/service/type accounting where needed; avoid a god blackboard or repeated whole-scene scans.
- Throughput, queue utilization, delivered income and useful demand justify capacity. Same-type units/buildings are legal; object-count uniqueness is not idempotence.
- Trace gameplay commands through their shared validation/application path. Dispatch acceptance does not prove application. Human and AI actions must obey the same applicable authority/rules.
- Use simulation time and deterministic ordering for gameplay. Rendering/tweens/debug UI must not decide outcomes. Save restartable phases and stable IDs, not live object references or Promises.
- Own and dispose timers, listeners, scene subscriptions, async generations and caches. Review restart, save/load, host replacement and hidden/shown debug where affected.
- Read [coding/documentation contracts](../fuzzy-waddle-repo-workflow/references/coding-contracts.md) for changed public/private contracts. Explain non-obvious ownership, persistence, ordering and cleanup; do not duplicate generic comments.

## Editor and validation boundaries

Inspect adjacent .scene and generated sections before editing GUI/prefabs. Preserve comments and authored/generated ownership. Use tools/phaser-editor/validate-project.mjs when editor wiring is affected, with verification authority from the task.

Pure fixtures do not prove movement/combat/topology or multiplayer correctness. Select affected runtime tests from the repo verification routes; use the browser-playtest skill when actual game UI/playtesting is requested. For #759 implementation, the plan runbook owns all proposed behavior and stage gates; the index is only a map of existing code.
