# Content-independent domain and transport coverage — #825

## Outcome

Core skirmish AI understands and tests land, water, air, access queries, transport ownership, and recovery using current
registered game capabilities. The current-content implementation and focused contracts are complete. Natural Playwright
proof of transport-required play is deferred to #822 because no authored map currently requires a transport route.

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
| DOMAIN-03: transport route               | Tivara `Sandhold` produces `CommonBoat`; River Crossing registers one                    | Access-query, carrier-production, lifecycle, and generation-refresh tests   | Natural runtime proof deferred to #822                              |
| DOMAIN-04 / H-29: loss and handoff       | `CommonBoat` has four seats and uses shared board/unload commands                        | Transport-manager loss, recovery, conflict, unload, and save-identity tests | Pure fixture mapping and runtime recipe remain                      |
| DOMAIN-05: useful air and anti-air       | `TivaraAlchemist` and `SkaduweeOwl` are registered flyers                                | Authored pure fixture and adaptation coverage                               | Runtime candidate; paired rejection evidence remains                |
| DOMAIN-06: compatible squads/counters    | Observations expose movement and target domains                                          | Authored pure fixture and tactics unit coverage                             | Pure mapped; runtime recipe remains #816                            |
| H-19/20/21: bounded access               | Adapter builds at most 512 cells per observation; graph carries generation and clearance | Pending, generation, narrow-route, and clearance unit coverage              | H-19 progress oracle and live mission clearance projection remain   |
| Air transport                            | No registered flying container                                                           | Synthetic observation test only                                             | Unsupported runtime capability; never count it as shipping evidence |
| Transport-required runtime               | No registered map consistently requires transport for a meaningful objective             | Reusable topology/carrier/boarding/handoff checkpoint capture exists        | Optional `deferred_content` owned by #822; never blocks #759        |

The currently usable authority chain is:

1. the Phaser observation pipeline derives a generation-paired capability catalog and access graph;
2. `AiSkirmishManager` queries access and seeds a child transport plan;
3. `AiTransportManager` exclusively owns carrier production, boarding, transit, unloading, recovery, and handoff;
4. `PlayerAiController` sends board/unload through the shared command bus and normal game command handlers.

### First causal contract: producible carrier discovery

Given a current-generation catalog where an owned producer can produce a water carrier, a ground squad with no existing
carrier must still receive a `water_transport` route. The skirmish manager must seed exactly one transport plan; only then
may the transport manager request carrier production and take passenger ownership.

The original path broke before plan creation:

- `queryAiAccessRouteV1` already accepts `canProduceWaterTransport` and its focused test returns a transport route with
  zero existing seats;
- `AiTransportManager` can request a catalog entry with water movement and cargo capacity after a plan exists;
- `AiSkirmishManager.routeCapability` projects only observed seats and never projects either producible-carrier flag, so
  the access query reports the route impossible and no child plan can exist.

The skirmish manager, transport manager, and Phaser `PlayerAiController` composition
root were content-hash-baselined above the 400-line source limit. The controller command dispatcher and skirmish
responsibilities are now extracted and focused tests preserve their behavior. The skirmish route-capability projection
now derives buildable water/air carrier flags from the current-generation catalog and owned producers; its focused
contract proves one water child plan is seeded before a boat exists. The protected transport root is now a stable
44-line façade over focused creation, ownership/preflight, reservation, recovery, loading, landing, and handoff
modules; no legacy-baseline refresh was needed. Runtime discovery also found that a ready replacement access-graph
generation could cancel a still-valid transport route. The plan advancer now refreshes a same-kind route in place and
waits through transient pending graphs until the phase deadline. Focused lifecycle regressions preserve both rules.

River Crossing can expose real water topology and producible boats, but ordinary play does not reliably create a
transport-required objective. A long natural run can therefore complete without any transport mission. The runtime
harness now records real topology, carrier catalog, physical container state, transport plans, decisions, and command
outcomes, but no authored brain-state injection is retained and DOMAIN-03 is not mapped as passing runtime evidence.

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
- DOMAIN-03: preserve disconnected/costed-route and transport-planning unit/pure contracts; #815 owns any remaining pure
  manifest mapping and #822 owns natural transport-required runtime proof.
- DOMAIN-04 and H-29: transport loss, capacity change, passenger ownership, landing handoff, release, and recovery.
- DOMAIN-05/06: useful air selection, paired anti-air rejection, domain-compatible squads, counters, and targets.
- H-19/20/21: bounded optional access work, topology-generation invalidation, footprint-aware routes, and progress when a
  route is impossible for a particular unit or formation.

## Implementation order

1. **Sol/high boundary:** audit registered land/water/air/container capabilities, current maps, and authority handoffs.
   Commit a compact capability-to-evidence/status matrix that names the first causal contract and excludes unsupported
   runtime claims. Stop the Sol slice once the contract and its first failing or passing path are reproducible.
2. **Terra/high structural boundary:** controller, skirmish, and transport ownership-root splits are complete.
   Focused tests and source-structure lint preserved behavior without a baseline refresh.
3. **Terra/high delivery:** route/child-plan projection, carrier-production chain, lifecycle split, access-generation
   hardening, and reusable runtime checkpoint capture are complete.
4. #815 owns remaining typed pure manifest mappings; #816 owns non-transport supported runtime and fail-closed status/CI.
5. #822 owns natural transport-required Playwright recipes after a suitable island map exists. Never manufacture a brain
   plan or shipping capability merely to turn a runtime row green.

## Evidence and completion

- All owned content-independent pure/integration cases pass deterministically with canonical provenance.
- Transport-required runtime remains visible and unmapped until #822 supplies a real topology-driven objective.
- Access work remains bounded; transport/passenger/squad ownership is exclusive and terminal cleanup releases claims.
- Focused transport lifecycle and source checks pass; update #825 and retain this file only until the parent handoff is
  finally triaged.
