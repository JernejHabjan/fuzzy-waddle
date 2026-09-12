# Island map and island AI scenarios — #822

## Outcome

A shipped representative island skirmish map makes disconnected-land expansion and transport-required combat testable in
the real runtime. Until then, island-only rows remain explicitly content-blocked.

Recommended agent: `gpt-6-astra`, high effort for map/gameplay/test integration. Use the Phaser skill and preserve
Phaser Editor authored/generated boundaries.

## Cold start

Read only:

1. existing `MapRiverCrossing` and `MapEmberEnclave` scene/TypeScript pairs
2. tilemaps and metadata under `phaser/src/assets/probable-waffle/tilemaps/` and `src/metadata/.../tilemaps/`
3. map enum/registration, asset packs, lobby browser, and thumbnail registration
4. access graph, transfer-point, container, CommonBoat, and navigation owners from the RTS source index
5. access/transport/island rows in `tools/ai/fixtures/skirmish-v1.json`

Do not duplicate an existing map and merely rename it. The topology must require transport for at least one meaningful
objective while leaving valid local openings and recovery options.

## Implementation order

1. Author symmetric spawns, local starter resources, expansion resources on disconnected land, navigable shorelines,
   legal transfer points, base footprints, and representative naval/air lanes.
2. Register the map end to end: enum/protocol, assets, scene, lobby metadata, thumbnail, and server/room filters.
3. Validate terrain, collision, navigation, placement, fog, spawn ownership, shore boarding/unloading, and match victory.
4. Add pure topology/transport cases first, then real Playwright recipes for transport acquisition, assembly, boarding,
   voyage, landing, handoff, expansion/attack, carrier loss, reroute, and recovery.
5. Cover both factions and representative mirrored sides. Test air/naval combat only where real registered units support
   it; a synthetic flying container is not shipping evidence.

## Completion

- The map is playable by a human and exposes deterministic transfer/access facts.
- Ground-only AI cannot reach all objectives and chooses a valid supported transport plan.
- Runtime scenarios pass for successful transfer plus loss/recovery cases.
- Editor/project/assets checks, focused tests, E2E, omission/closure audits pass; commit, push, and close #822.
