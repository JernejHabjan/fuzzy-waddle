# Content-independent domain and transport coverage — #825

## Outcome

Core skirmish AI understands and tests land, water, air, access queries, transport ownership, and recovery using current
registered game capabilities. A future island map improves runtime breadth but is not required for core #759 readiness.

Recommended agent: `gpt-5.6-sol`, high effort for the first cross-domain contract and runtime-ownership slice. Hand the
proven contract to `gpt-5.6-terra`, medium effort, for fixture mapping and focused repairs. Reserve Astra for an
unresolved topology/transport architecture question after compact Sol evidence.

Estimated effort: **L**, about 2–4 focused agent sessions or 1–3 engineering days after #824, assuming current map and unit
registrations behave as documented.

Dependency: complete #824 first. Coordinate access-family pure rows with #815 and supported runtime recipes with #816.
#822 is an optional content upgrade and is not a dependency.

## Cold start

Read only:

1. `docs/testing/strategic-scenarios.md` DOMAIN-01–06 and `adversarial-scenarios.md` H-19–21/H-29
2. matching rows in `tools/ai/fixtures/skirmish-v1.json`
3. `contracts/ai-access-graph-v1.ts` and `planning/ai-access-graph-v1.ts`
4. `planning/ai-transport-manager.ts`, `ai-tactics-manager.ts`, and `ai-adaptation-manager.ts`
5. Phaser `observation/ai-access-graph.adapter.ts` and `ai-observation-pipeline.ts`
6. adjacent specs and current registered map/unit/container capabilities named by the source index

Paths under `docs/`, `contracts/`, and `planning/` are relative to the gameplay AI-controller directory. Do not inspect
the optional island-map implementation unless #822 is separately selected.

## Audited capability boundary

This matrix records only capability proven from registered definitions and current tests. `Runtime candidate` means the
shipping game has the required content, not that Playwright evidence exists yet.

| Contract                                 | Registered capability                                                                    | Evidence now                                                                | Status / next owner                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| DOMAIN-01: water alone creates no demand | Water topology and water units exist                                                     | Authored pure fixture plus macro/adaptation unit coverage                   | Pure mapped; runtime recipe remains #816                            |
| DOMAIN-02: useful naval objective        | Tivara `Sandhold` produces `VikingBoat`; River Crossing registers naval content          | Authored pure fixture and adaptation coverage                               | Runtime candidate; do not claim Skaduwee naval production           |
| DOMAIN-03: transport route               | Tivara `Sandhold` produces `CommonBoat`; River Crossing registers one                    | Access-query and transport-lifecycle unit coverage                          | Blocked at the live capability projection described below           |
| DOMAIN-04 / H-29: loss and handoff       | `CommonBoat` has four seats and uses shared board/unload commands                        | Transport-manager loss, recovery, conflict, unload, and save-identity tests | Pure fixture mapping and runtime recipe remain                      |
| DOMAIN-05: useful air and anti-air       | `TivaraAlchemist` and `SkaduweeOwl` are registered flyers                                | Authored pure fixture and adaptation coverage                               | Runtime candidate; paired rejection evidence remains                |
| DOMAIN-06: compatible squads/counters    | Observations expose movement and target domains                                          | Authored pure fixture and tactics unit coverage                             | Pure mapped; runtime recipe remains #816                            |
| H-19/20/21: bounded access               | Adapter builds at most 512 cells per observation; graph carries generation and clearance | Pending, generation, narrow-route, and clearance unit coverage              | H-19 progress oracle and live mission clearance projection remain   |
| Air transport                            | No registered flying container                                                           | Synthetic observation test only                                             | Unsupported runtime capability; never count it as shipping evidence |
| Island-only runtime                      | No island map is registered                                                              | No valid runtime evidence                                                   | Optional `deferred_content` owned by #822; never blocks #759        |

The currently usable authority chain is:

1. the Phaser observation pipeline derives a generation-paired capability catalog and access graph;
2. `AiSkirmishManager` queries access and seeds a child transport plan;
3. `AiTransportManager` exclusively owns carrier production, boarding, transit, unloading, recovery, and handoff;
4. `PlayerAiController` sends board/unload through the shared command bus and normal game command handlers.

### First causal contract: producible carrier discovery

Given a current-generation catalog where an owned producer can produce a water carrier, a ground squad with no existing
carrier must still receive a `water_transport` route. The skirmish manager must seed exactly one transport plan; only then
may the transport manager request carrier production and take passenger ownership.

The path currently breaks before plan creation:

- `queryAiAccessRouteV1` already accepts `canProduceWaterTransport` and its focused test returns a transport route with
  zero existing seats;
- `AiTransportManager` can request a catalog entry with water movement and cargo capacity after a plan exists;
- `AiSkirmishManager.routeCapability` projects only observed seats and never projects either producible-carrier flag, so
  the access query reports the route impossible and no child plan can exist.

This is the first Terra repair. The skirmish manager, transport manager, and Phaser `PlayerAiController` composition
root were content-hash-baselined above the 400-line source limit. The controller command dispatcher and skirmish
responsibilities are now extracted and focused tests preserve their behavior. Finish the remaining transport lifecycle
split (route selection, reservation, recovery, movement, and handoff) without refreshing the legacy baseline. The
composition split is required because a new manager cannot enter the real runtime without editing that protected root.
Then add a failing skirmish routing test, project producibility from the owned producer/catalog relationship, and prove
that exactly one child plan is seeded.

Focused audit evidence:

```bash
pnpm exec nx test probable-waffle-gameplay --runInBand \
  --testPathPatterns='(ai-access-graph-v1|ai-transport-manager|ai-skirmish-manager).spec.ts$'
pnpm exec nx test probable-waffle-phaser --runInBand \
  --testPathPatterns='ai-domain-observation-fixtures.spec.ts$'
```

The 2026-09-12 boundary passed 3 gameplay suites / 26 tests and 1 Phaser suite / 2 tests. These results prove the existing
lower-layer contracts; they do not claim that the missing live projection or any runtime recipe passed.

## Owned scenarios

- DOMAIN-01/02: water alone creates no naval demand; valuable supported route/escort/intercept objectives may.
- DOMAIN-03: prove disconnected/costed-route and transport planning in pure fixtures; defer only the real island-map
  runtime variant to #822.
- DOMAIN-04 and H-29: transport loss, capacity change, passenger ownership, landing handoff, release, and recovery.
- DOMAIN-05/06: useful air selection, paired anti-air rejection, domain-compatible squads, counters, and targets.
- H-19/20/21: bounded optional access work, topology-generation invalidation, footprint-aware routes, and progress when a
  route is impossible for a particular unit or formation.

## Implementation order

1. **Sol/high boundary:** audit registered land/water/air/container capabilities, current maps, and authority handoffs.
   Commit a compact capability-to-evidence/status matrix that names the first causal contract and excludes unsupported
   runtime claims. Stop the Sol slice once the contract and its first failing or passing path are reproducible.
2. **Terra/high structural boundary:** finish the transport ownership-root split after the completed controller and
   skirmish splits. Preserve behavior with focused tests and no baseline refresh. Verify the source-structure rule
   before the bridge implementation.
3. **Terra/high delivery:** add the failing route/child-plan test, project buildable carrier capability from the owned
   producer/catalog relationship, wire the focused manager through the extracted composition root, and prove one child
   plan plus the existing transport-manager production intent. Record only what can produce real evidence; never infer
   capability from a type name or manufacture a shipping feature in the fixture.
4. Add typed pure fixtures and semantic oracles for the owned rows. Cover positive, rejection, loss, retry, abort, release,
   and ordering cases while preserving fair observations.
5. Add focused Phaser observation/access integration tests for topology generations, footprints, transfer points, and
   capability projection.
6. Add Playwright recipes only where existing maps and registered units genuinely exercise the contract. Route these
   recipes through #824 tooling and #816 shards.
7. Extend the manifest/report status model so `required_supported` work fails closed while `deferred_content` names #822,
   stays visible, is never counted as passed, and does not block the core merge gate.
8. Update code-adjacent world-access/testing docs with proven behavior and ownership. Do not move scenario TODOs into
   product architecture documentation.

## Evidence and completion

- All owned content-independent pure/integration cases pass deterministically with canonical provenance.
- Every currently supportable runtime case uses a real lobby-created Phaser match and registered capabilities.
- Island-only runtime variants are explicit `deferred_content` owned by #822; no supported core row is hidden behind it.
- Access work remains bounded; transport/passenger/squad ownership is exclusive and terminal cleanup releases claims.
- Run focused tests plus #824 changed/required accounting, omission/final closure audits, plan-artifact triage, commit,
  push, update #825, and report the refreshed roadmap grid.
