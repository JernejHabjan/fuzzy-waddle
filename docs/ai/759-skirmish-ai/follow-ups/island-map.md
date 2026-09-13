# Island map and island AI scenarios — #822

## Outcome

A shipped representative island skirmish map makes disconnected-land expansion and transport-required combat testable in
the real runtime. This is an optional future content upgrade, not a #759/PR #814 dependency or merge gate. #825 owns all
domain and transport behavior that can be proven with current content.

Recommended agent: `gpt-5.6-terra`, high effort. Use the Phaser skill and preserve Phaser Editor authored/generated
boundaries. Ask for Sol or Astra only for a bounded unresolved topology/transport investigation.

Estimated effort: **XL content work**, about 3–8 engineering days after map requirements/assets are available.

Dependency: none for core #759 because this issue is optional. When selected later, use the then-current verified AI
tooling. Do not replace missing content with a synthetic runtime claim.

## Cold start

Read only:

1. Phaser `world/scenes/game-maps/MapRiverCrossing.*` and `MapEmberEnclave.*`
2. Phaser `src/assets/probable-waffle/tilemaps/` and `src/metadata/probable-waffle/tilemaps/`
3. the map enum/registration, asset packs, lobby browser, and thumbnail owners routed by the RTS source index
4. the access graph, transfer-point, container, CommonBoat, and navigation owners routed by the RTS source index
5. access/transport/island rows in `tools/ai/fixtures/skirmish-v1.json`

Do not duplicate an existing map and merely rename it. The topology must require transport for at least one meaningful
objective while leaving valid local openings and recovery options.

## Implementation order

1. Author symmetric spawns, local starter resources, expansion resources on disconnected land, navigable shorelines,
   legal transfer points, base footprints, and representative naval/air lanes.
2. Register the map end to end: enum/protocol, assets, scene, lobby metadata, thumbnail, and server/room filters.
3. Validate terrain, collision, navigation, placement, fog, spawn ownership, shore boarding/unloading, and match victory.
4. Reuse #825 pure/current-content coverage, then add island-specific Playwright recipes for transport acquisition,
   assembly, boarding, voyage, landing, handoff, expansion/attack, carrier loss, reroute, and recovery.
5. Cover both factions and representative mirrored sides. Test air/naval combat only where real registered units support
   it; a synthetic flying container is not shipping evidence.

## Completion

- The map is playable by a human and exposes deterministic transfer/access facts.
- Ground-only AI cannot reach all objectives and chooses a valid supported transport plan.
- Runtime scenarios pass for successful transfer plus loss/recovery cases.
- Editor/project/assets checks, focused tests, E2E, omission/closure audits pass; commit, push, and close #822.
