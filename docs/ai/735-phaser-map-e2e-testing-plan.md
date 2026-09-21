# Phaser map end-to-end testing plan

Issue: [#735 — E2E tests for MapRiverCrossing or MapSandbox?](https://github.com/JernejHabjan/fuzzy-waddle/issues/735)

Classification: `decision-pr`. This plan becomes `agent-ready` after review accepts the fixture-launch boundary or replaces its recommended default.

## Goal

Prove that gameplay works inside Phaser maps, beginning with a concrete behavior: a known player-owned unit moves from a known world position to a reachable destination after browser input.

Use two complementary kinds of coverage:

1. frozen, purpose-built E2E map fixtures for deterministic gameplay assertions;
2. production-map smoke tests that detect broken scene generation, registration, preload, assets, and initialization.

Tests must exercise the production path from the Angular host through Phaser input, selection, navigation, command dispatch, simulation ticks, and actor movement. They must not replace those systems with service mocks or assert only that individual services were called.

## Research findings

- `apps/portal-e2e` already provides Playwright, Chromium, an Nx-inferred `e2e` target, portal startup, retries in CI, traces on first retry, and failure screenshots.
- `/aota/instant-game` already creates a complete offline game instance and navigates directly to `/aota/game`. It does not require a running API for the instant-game transport path.
- The current instant-game route selects `MapRiverCrossing`. Its Phaser boot includes the production preload scenes, authored map, HUD, actor creation, `ActorIndexSystem`, `NavigationService`, `CommandBusService`, `SimulationTickService`, and AI.
- `MapSandbox` is a useful fixture seed: it already reuses the River Crossing tilemap and contains a Tivara worker plus walls, towers, and stairs. Testing `MapSandbox` directly would make routine sandbox editing a source of E2E flakiness.
- A full production-map copy would drift and could pass while the source map fails. A copy is valuable only when it is simplified, renamed, frozen, and owned as a test fixture with explicit behavioral zones.
- `GameContainerComponent` owns the `BaseGame` instance but keeps it private. Playwright can click the canvas, but it currently has no stable way to wait for scene initialization, identify an actor, translate a world destination through the active camera, or read the actor's final logical position.
- Screenshot assertions are useful diagnostics but are not a reliable semantic oracle for movement. Camera motion, animations, lighting, particles, and renderer differences can change pixels without changing gameplay correctness.
- Phaser provides camera world/screen transforms and Playwright supports browser-context evaluation plus `expect.poll`, so a narrow state-reading probe can coordinate deterministic canvas input while production gameplay remains authoritative.
- The current pull-request workflow runs E2E tests only for non-draft PRs targeting `main`. New gameplay E2E coverage will not protect ordinary `develop` PRs unless CI policy changes.
- No existing issue or PR was found that implements equivalent real-map movement coverage.

## Accepted decisions

1. **Start with `MapE2ENavigation`, derived from `MapSandbox`.** Copy the editor scene as a starting point, strip unrelated objects, give it test-owned identifiers, and freeze its layout after review.
2. **Do not create one map per assertion.** Group fixtures by spatial/gameplay domain. One navigation fixture should cover clear movement, obstacle routing, unreachable destinations, and formation space.
3. **Reuse production content.** Fixture maps reuse existing tilemaps, tilesets, actor definitions, prefabs, navigation, simulation, rendering, and input systems. Do not duplicate binary assets.
4. **Keep production maps in a separate smoke layer.** `MapSandbox`, `MapRiverCrossing`, and `MapEmberEnclave` each get a boot/readiness test. Precise gameplay assertions belong to frozen fixtures unless a production-map behavior itself is under test.
5. **Keep Playwright as the outer runner.** Extend `portal-e2e` rather than introducing another browser-test stack.
6. **Use a development-only read/projection probe, not a command backdoor.** The probe may report readiness, stable references, logical state, and world-to-canvas projection. Playwright still selects and commands through pointer input.
7. **Assert semantic state, not exact pixels or elapsed time.** Poll the selected actor's logical position with a tile-sized tolerance and a bounded timeout. Keep screenshots and traces as diagnostics.
8. **Add additional fixture maps only with their first test.** Likely later domains are `MapE2ECombat` and `MapE2EEconomy`; empty speculative fixtures are out of scope.

## Fixture-map policy

`MapE2ENavigation` should:

- live with the Probable Waffle Phaser scenes in a clearly test-owned E2E subdirectory;
- retain both the Phaser Editor source and generated TypeScript according to the existing scene workflow;
- reuse the existing River Crossing tilemap/tilesets and production prefabs;
- contain only the actors, obstacles, and invisible reference markers needed by navigation scenarios;
- use stable scenario-reference IDs such as `movement-unit`, `movement-clear-target`, `movement-detour-target`, and `movement-unreachable-target` rather than generated variable names or unexplained raw coordinates;
- disable win/lose conditions, AI, fog, or ambient interference unless a case explicitly needs them;
- remain unavailable in production map selection, matchmaking, campaign content, replay metadata, and public protocol map lists;
- fail editor/reference validation when required markers are missing or duplicated.

Initial authored zones:

| Zone | Contents | First assertion |
| --- | --- | --- |
| Clear lane | One owned ground unit and an unobstructed target several tiles away | The unit leaves its start and reaches the target. |
| Detour lane | One wall island between the unit and target | The unit routes around blocked tiles and arrives. |
| Unreachable pen | A target completely enclosed by blocking objects | The unit never enters blocked space and resolves the order safely. |
| Formation area | Open space for several owned units | Units respond to one command without ending on the same occupied tile. |

Only the clear lane is required for the first implementation slice. The other zones can be authored with the fixture if cheap, but their tests remain follow-up work.

## Proposed test boundary

```text
Playwright
  -> explicit development-only E2E launch for MapE2ENavigation + fixed seed
  -> production Angular game host and BaseGame
  -> wait for probe readiness after actor indexing
  -> resolve movement-unit + movement-clear-target reference markers
  -> project their world positions through the real camera/canvas bounds
  -> left-click the unit on the real Phaser canvas
  -> right-click the target on the real Phaser canvas
  -> production selection/navigation/command/simulation/movement pipeline
  -> poll the same actor until it reaches the target
```

The probe is an observation and coordinate-projection boundary only. It must not invoke `NavigationService`, enqueue commands, mutate actors, advance ticks, or teleport game objects.

The E2E fixture launch should remain outside the production `ProbableWaffleMapEnum` and `ProbableWaffleLevels` catalog. The recommended implementation is an explicit development-only launch adapter/configuration that boots the normal Angular host and gameplay scene while selecting the fixture locally. Production-map smoke tests continue to exercise the normal catalog/preload path.

## Implementation stages

### Stage 1 — frozen navigation fixture and launch boundary

- [ ] Duplicate `MapSandbox` editor/generated scene files into `MapE2ENavigation` as a bootstrap step.
- [ ] Strip the duplicate to the clear lane's unit, required terrain, target marker, and minimal supporting objects.
- [ ] Add stable scenario-reference IDs for the unit and target; add detour, unreachable, and formation zones only if they do not delay the first slice.
- [ ] Reuse production tilemaps, assets, prefabs, and actor definitions; duplicate no binary content.
- [ ] Add editor/reference validation for required unique fixture markers.
- [ ] Add a development-only E2E launch boundary with a fixed seed and explicit fixture key.
- [ ] Keep the fixture out of public map catalogs, lobbies, matchmaking, campaigns, saves, and replay metadata.
- [ ] Configure a quiet test session with no unrelated AI or end-game conditions.

Acceptance criteria:

- `MapE2ENavigation` is visibly test-owned and cannot be selected by a production user.
- The clear lane has one stable owned movable actor and one reachable stable target.
- Fixture launch uses production Phaser gameplay systems without requiring an API or authenticated account.
- Removing or duplicating a required marker makes validation fail with a useful message.

### Stage 2 — deterministic browser-test seam

- [ ] Define a typed, read-only E2E probe contract close to the Phaser host boundary.
- [ ] Expose it only in Angular development mode and only for the explicit E2E launch.
- [ ] Publish readiness only after scene initialization and actor indexing complete.
- [ ] Resolve stable actor/marker references through existing indexed authorities rather than ad hoc scene scans.
- [ ] Return serializable actor snapshots containing stable identity, ownership, kind/name, and logical world position.
- [ ] Project requested world points to canvas-relative coordinates using the active map camera and current canvas bounds.
- [ ] Remove the probe when `GameContainerComponent` or the active scene is destroyed.
- [ ] Document the read-only contract and production exclusion.

Acceptance criteria:

- Production builds expose no test probe or fixture launch.
- E2E mode can wait for `MapE2ENavigation`, resolve the clear-lane references, and read the unit's logical state.
- The probe has no API that changes gameplay state.
- Repeated route entry/exit retains no destroyed game, scene, listeners, or references.

### Stage 3 — navigation gameplay tests

- [ ] Add a Probable Waffle page object that owns canvas access and typed probe reads.
- [ ] Launch `MapE2ENavigation` with a fixed seed.
- [ ] Wait on scene/actor readiness instead of fixed-duration sleeps.
- [ ] Select `movement-unit` through a left click on the canvas.
- [ ] Issue a move to `movement-clear-target` through a right click on the canvas.
- [ ] Assert that the same actor leaves its initial position and reaches the target within a bounded timeout and tile-sized tolerance.
- [ ] Fail with actor ID, reference IDs, initial/current/target positions, scene key, and seed.
- [ ] Keep Playwright trace and screenshot artifacts enabled.
- [ ] Add detour, unreachable, and formation cases after the clear movement case proves stable.

Acceptance criteria:

- The clear movement case fails if selection, pointer conversion, command dispatch, pathfinding, simulation ticking, or actor movement breaks.
- It cannot pass merely because the unit starts near the target.
- It uses the authored fixture layout plus production gameplay code and pointer input.
- It runs without API, authentication, manual input, arbitrary sleeps, or direct gameplay mutation from Playwright.

### Stage 4 — production-map smoke coverage

- [ ] Parameterize a smoke case over `MapSandbox`, `MapRiverCrossing`, and `MapEmberEnclave` through the normal map catalog/preload flow.
- [ ] Assert the requested map scene becomes ready after preload.
- [ ] Assert actor indexing completes and the map satisfies a small map-specific invariant.
- [ ] Fail on uncaught page errors, failed asset requests, missing scenes, or duplicate scene keys.
- [ ] Avoid precise coordinate or actor-count assertions unless the production map explicitly guarantees them.

Acceptance criteria:

- Broken generated scenes, registration, preload keys, or required assets fail the owning map's smoke case.
- Normal production-map selection and preload remain covered independently of the test-only fixture launch.
- Routine layout/content changes do not require rewriting unrelated semantic gameplay tests.

### Stage 5 — CI adoption and domain expansion

- [ ] Record fixture and production-map cold/warm startup durations locally and in Linux CI.
- [ ] Add the clear movement case and production boot smoke cases to ready `develop` PR checks once stable.
- [ ] Retain slower domain cases for `main`, scheduled, or explicitly selected lanes if measured runtime requires it.
- [ ] Prefer the Nx/Playwright CI target that preserves per-spec splitting when distribution is enabled.
- [ ] Quarantine only with an owner, linked issue, captured trace, and removal condition.
- [ ] Create `MapE2ECombat` or `MapE2EEconomy` only when its first concrete scenario is implemented in the same change.

Acceptance criteria:

- A ready `develop` PR cannot merge while the movement smoke or production-map boot smoke is failing.
- Failures retain enough state and trace data to distinguish load, input, pathfinding, and movement problems.
- The test has no fixed sleeps and passes repeatedly in headless Chromium on Linux.

## Expected affected areas

- `libs/games/probable-waffle/phaser/src/lib/world/scenes/` — test-owned fixture scenes, stable reference markers, and validation.
- `libs/platform/game-host/src/lib/game/game-container/` — lifecycle-safe, development-only access to the owned `BaseGame`.
- `libs/games/probable-waffle/phaser/src/lib/` — typed read-only scene/actor observation and camera projection, using existing indexed authorities.
- `libs/games/probable-waffle/interface/src/lib/` — development-only fixture launch adapter and fixed seed without public-map registration.
- `apps/portal-e2e/src/support/` — typed Probable Waffle page object and diagnostics.
- `apps/portal-e2e/src/e2e/` — navigation semantics and production-map boot smoke specs.
- `.github/workflows/pull-request-checks.yml` — stable smoke execution for ready `develop` PRs.

## Verification plan

During implementation, run the smallest relevant checks in this order:

1. fixture editor/reference validation and owning-project lint/type checks;
2. the single clear-movement Playwright case in headless Chromium;
3. the clear-movement case at least ten consecutive times to expose timing flakes;
4. the parameterized production-map boot smoke spec;
5. the full `portal-e2e:e2e` target;
6. affected lint, unit-test, E2E, and production-build targets required by PR CI.

Inspect a captured trace from one successful run and one forced failure to ensure input actions, diagnostics, screenshots, and semantic state are useful.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Fixture drifts into another manually edited sandbox | Give it explicit E2E ownership, stable markers, narrow zones, validation, and review rules. |
| Fixture passes while production maps are broken | Keep separate boot/readiness smoke coverage for every production map. |
| Too many fixture maps increase generated code and preload cost | Group by gameplay domain and add a map only with its first implemented scenario. |
| Test-only map leaks into production contracts or UI | Use a development-only launch/config boundary; exclude it from protocol map enums and production catalogs. |
| Canvas actions depend on camera position or CSS scaling | Project world points through the active camera and current canvas bounds immediately before each click. |
| Probe becomes a production debug backdoor | Require development mode plus explicit E2E launch, expose reads/projection only, and tear it down with the game. |
| Test passes without covering input | Prohibit probe mutation/command APIs; selection and movement orders remain Playwright pointer actions. |
| Exact-coordinate assertions flake | Assert movement away from start plus arrival within tile-derived tolerance. |
| Auth/API instability blocks the test | Use the offline fixture launch and ensure no server dependency is introduced. |

## Out of scope for the first implementation

- Pixel-perfect rendering baselines.
- Multiplayer or two-browser lockstep validation.
- Testing every actor or map behavior.
- A general-purpose production debug console.
- Direct service invocation from Playwright as a substitute for canvas input.
- Maintaining full duplicates of production maps.
- Creating empty combat/economy fixtures before their first tests.

## Remaining implementation decisions

These defaults can proceed unless review objects:

1. **How should the fixture launch without entering the public map catalog?**
   - Recommended default: a development-only E2E launch adapter/configuration local to the interface/Phaser host.
   - Impact of deferral: Stage 1 cannot establish the production-exclusion boundary, and later tests may accidentally pollute protocol or lobby contracts.
   - Continuation prompt: `Implement Stage 1 of #735 using a development-only fixture launch that keeps MapE2ENavigation out of ProbableWaffleMapEnum and ProbableWaffleLevels.`
2. **Which authored marker authority should identify fixture actors and targets?**
   - Recommended default: reuse `EditorScenarioReference`, `ScenarioPoint`, and `IndexedScenarioReferenceRegistry`, which are already initialized for game scenes, while documenting that these IDs are test fixtures rather than campaign content.
   - Impact of deferral: tests fall back to brittle generated names, actor ordering, or raw coordinates.
   - Continuation prompt: `Implement stable MapE2ENavigation actor and point references for #735 using the existing indexed scenario-reference authority.`
3. **When should the new cases enter `develop` CI?**
   - Recommended default: after ten consecutive local passes and one successful Linux CI run; begin with clear movement plus production boot smoke only.
   - Impact of deferral: the tests exist but do not protect ordinary feature PRs.
   - Continuation prompt: `Adopt the stable #735 movement and production-map smoke specs in ready develop PR checks, preserving failure traces.`

## Progress

- [x] Inspected issue #735 and searched for overlapping issues/PRs.
- [x] Audited the current Playwright/Nx setup and PR CI behavior.
- [x] Traced the offline instant-game boot into the real Phaser map and gameplay services.
- [x] Compared production-map-only, duplicated-map, screenshot, and read-only-probe approaches.
- [x] Chose a hybrid of frozen gameplay fixtures and production-map boot smoke coverage.
- [x] Chose `MapE2ENavigation`, derived and simplified from `MapSandbox`, as the first fixture.
- [x] Defined domain-based fixture ownership, the initial authored zones, staged rollout, and acceptance criteria.
- [ ] Review or accept the recommended development-only fixture-launch boundary.
- [ ] Implement Stage 1.
- [ ] Implement Stages 2 and 3.
- [ ] Implement production smoke and measured CI adoption.
- [ ] Add later fixture domains only with concrete tests.

Exact next action: review the recommended E2E-only launch boundary, then implement `MapE2ENavigation` with only the clear movement lane and stable indexed references.

## References

- [Playwright assertions and `expect.poll`](https://playwright.dev/docs/test-assertions)
- [Playwright tracing](https://playwright.dev/docs/api/class-tracing)
- [Phaser camera world/screen coordinates](https://docs.phaser.io/phaser/concepts/cameras)
- [Phaser pointer world-coordinate updates](https://docs.phaser.io/api-documentation/class/input-pointer)
- [Nx Playwright integration and inferred E2E tasks](https://nx.dev/docs/technologies/test-tools/playwright/introduction)
