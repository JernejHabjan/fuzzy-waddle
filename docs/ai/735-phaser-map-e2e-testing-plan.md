# Phaser map end-to-end testing plan

Issue: [#735 — E2E tests for MapRiverCrossing or MapSandbox?](https://github.com/JernejHabjan/fuzzy-waddle/issues/735)

## Goal

Prove that gameplay works inside a real authored Phaser map, beginning with a concrete behavior: a known player-owned unit moves from a known world position to a reachable destination after browser input.

The test must exercise the production path from the Angular host through Phaser input, selection, navigation, command dispatch, simulation ticks, and actor movement. It must not replace those systems with service mocks or assert only that individual services were called.

## Research findings

- `apps/portal-e2e` already provides Playwright, Chromium, an Nx-inferred `e2e` target, portal startup, retries in CI, traces on first retry, and failure screenshots.
- `/aota/instant-game` already creates a complete offline game instance and navigates directly to `/aota/game`. It does not require a running API for the instant-game transport path.
- The instant-game route currently selects `MapRiverCrossing`. The resulting Phaser boot includes the production preload scenes, authored map, HUD scenes, actor creation, `ActorIndexSystem`, `NavigationService`, `CommandBusService`, `SimulationTickService`, and AI player.
- `GameContainerComponent` owns the `BaseGame` instance but keeps it private. Playwright can click the canvas, but it currently has no stable way to wait for scene initialization, identify a particular actor, translate a world destination through the active camera, or read the actor's final logical position.
- Screenshot assertions are useful diagnostics but are not a reliable semantic oracle for world movement. Camera motion, animation frames, lighting, particles, and rendering differences can change pixels without changing gameplay correctness.
- Phaser provides camera world/screen transforms and Playwright supports browser-context evaluation plus `expect.poll`, so a narrow state-reading probe can coordinate deterministic canvas input while the production gameplay path remains authoritative.
- The current pull-request workflow runs E2E tests only for non-draft PRs targeting `main`. A test added only to the existing suite will not protect ordinary `develop` PRs unless CI policy changes.
- No existing issue or PR was found that implements equivalent real-map movement coverage.

## Decisions

1. **Use `MapRiverCrossing` first.** It is the map already booted by the offline instant-game route and exercises representative production content. Do not duplicate either map for the test; a copied map would drift and could pass while production content fails.
2. **Keep Playwright as the outer test runner.** Extend `portal-e2e` instead of introducing another browser-test stack or a second app host.
3. **Add a development-only read/projection probe, not a command backdoor.** The probe may report readiness, stable actor identity, logical position, and world-to-canvas projection. Playwright must still select and command through canvas pointer input so the real input and gameplay pipeline is covered.
4. **Assert semantic state, not exact pixels or elapsed time.** Poll the selected actor's logical position with a tile-sized tolerance and a bounded timeout. Attach the existing screenshot and trace artifacts when the assertion fails.
5. **Make the scenario deterministic.** Use a fixed random seed, one stable owned movable actor, a prevalidated reachable destination, disabled camera edge scrolling during the action, and no dependence on arbitrary sleeps.
6. **Keep the initial smoke case small.** One movement case should establish the harness. Broader gameplay scenarios follow only after runtime and flake data are known.

## Proposed test boundary

```text
Playwright
  -> /aota/instant-game?e2e=1&seed=<fixed>
  -> wait for development-only probe readiness
  -> read owned actor identity + canvas projection
  -> left-click actor on the real Phaser canvas
  -> right-click reachable destination on the real Phaser canvas
  -> production selection/navigation/command/simulation/movement pipeline
  -> poll probe until that same actor reaches the destination
```

The probe is an observation and coordinate-projection boundary only. It must not invoke `NavigationService`, enqueue commands, mutate actors, advance ticks, or teleport game objects.

## Implementation stages

### Stage 1 — deterministic browser-test seam

- [ ] Define a typed, read-only E2E probe contract close to the Phaser host boundary.
- [ ] Expose the probe only in Angular development mode and only when the explicit E2E query flag is present.
- [ ] Publish scene readiness only after `sceneInitialized` and actor indexing complete.
- [ ] Return serializable actor snapshots containing a stable authoritative ID, ownership, actor kind/name, and logical world position.
- [ ] Project a requested world point to canvas-relative coordinates using the active map camera and canvas bounds.
- [ ] Remove the probe when `GameContainerComponent` or the active scene is destroyed so navigation cannot retain stale game state.
- [ ] Document that the probe is read-only test infrastructure and that production builds cannot activate it.

Acceptance criteria:

- Production builds expose no test probe.
- E2E mode can deterministically wait for `MapRiverCrossing` and query one player-owned movable unit.
- The probe has no API that changes gameplay state.
- Repeated route entry/exit does not retain a destroyed Phaser game or scene.

### Stage 2 — real map movement smoke test

- [ ] Add a Probable Waffle page object that owns canvas access and typed probe reads.
- [ ] Start the offline instant game with a fixed seed and explicit E2E mode.
- [ ] Wait on scene/actor readiness instead of fixed-duration sleeps.
- [ ] Select a stable player-owned ground unit through a left click on the canvas.
- [ ] Issue a move through a right click on a reachable world destination at least several tiles away.
- [ ] Assert that the same actor leaves its initial position and reaches the destination within a bounded timeout and tile-sized tolerance.
- [ ] Fail with actor ID, initial/current/target positions, scene key, and seed so the run can be reproduced.
- [ ] Keep the existing Playwright trace and screenshot artifacts enabled.

Acceptance criteria:

- The case fails if selection, pointer-to-world conversion, command dispatch, pathfinding, simulation ticking, or actor movement is broken.
- The case does not pass when the actor merely starts near the target.
- The case uses the authored `MapRiverCrossing` loaded by the production game configuration.
- The case runs without an API, authenticated account, or manual interaction.

### Stage 3 — CI adoption and flake control

- [ ] Record cold-start and warm-start duration locally and in Linux CI.
- [ ] Add the movement smoke case to the `develop` PR checks once it is stable; retain broader E2E execution for `main` if total runtime requires it.
- [ ] Prefer the Nx/Playwright CI target that preserves per-spec task splitting when the repository enables distribution.
- [ ] Quarantine only with an owner, linked issue, captured trace, and removal condition; do not hide failures behind unconditional retries.
- [ ] Define an initial runtime budget of 60 seconds for the movement assertion and 180 seconds for portal startup, then tighten it from observed data.

Acceptance criteria:

- A ready PR targeting `develop` cannot merge with the real-map smoke case failing.
- Failures retain enough state and trace data to distinguish load, input, pathfinding, and movement problems.
- The test has no fixed sleeps and passes repeatedly in headless Chromium on Linux.

### Stage 4 — follow-up gameplay coverage

Add scenarios incrementally, each retaining the same real-map and input-path rule:

- [ ] route around a known obstruction and assert arrival without entering blocked tiles;
- [ ] multi-select units, issue one move, and assert formation/occupancy invariants;
- [ ] attack a real target and assert health/death state transitions;
- [ ] place and complete a building on a valid authored tile;
- [ ] gather a resource and assert actor, resource node, and player-resource changes;
- [ ] replay a recorded command stream and compare deterministic state at selected ticks;
- [ ] add a focused `MapSandbox` case only if it supplies a behavior or fixture that `MapRiverCrossing` cannot cover cheaply.

These are deliberately deferred until the first test establishes runtime, reliability, and the probe's minimum useful contract.

## Expected affected areas

- `libs/platform/game-host/src/lib/game/game-container/` — lifecycle-safe, development-only access to the owned `BaseGame`.
- `libs/games/probable-waffle/phaser/src/lib/` — typed read-only scene/actor observation and camera projection, preferably using existing scene-data helpers and `ActorIndexSystem` rather than scanning ad hoc.
- `libs/games/probable-waffle/interface/src/lib/gui/instant-game/` — fixed seed/E2E launch options if they cannot remain entirely in the host seam.
- `apps/portal-e2e/src/support/` — typed Probable Waffle page object and diagnostics.
- `apps/portal-e2e/src/e2e/` — the real-map movement smoke spec.
- `.github/workflows/pull-request-checks.yml` — run the proven smoke case for ready `develop` PRs.

## Verification plan

During implementation, run the smallest relevant checks in this order:

1. lint/type validation for each changed owning project;
2. the single Playwright movement spec in headless Chromium;
3. the movement spec repeatedly (at least ten consecutive local runs) to expose timing flakes;
4. the full `portal-e2e:e2e` target;
5. the affected lint, unit-test, E2E, and production-build targets required by the PR workflow.

Also inspect a captured trace from one successful run and one forced failure to confirm that input actions, diagnostics, screenshots, and semantic state are useful.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Canvas actions depend on camera position or CSS scaling | Project world points through the active Phaser camera and normalize through the real canvas bounds immediately before each click. |
| AI or ambient systems interfere with the chosen unit | Choose a stable player-owned worker and a short safe route; use a fixed seed and capture identity/position diagnostics. |
| Probe becomes a production debug backdoor | Require both development mode and an explicit E2E flag, expose read/projection operations only, and tear it down with the game. |
| Test passes without covering input | Prohibit probe mutation/command APIs; all selection and movement orders must be Playwright pointer actions. |
| Exact-coordinate assertions flake | Assert movement away from the start plus arrival within a tile-derived tolerance. |
| Full map load makes every PR slow | Begin with one smoke case, measure it, and split slower scenarios into a separate scheduled or `main` lane if needed. |
| Auth/API instability blocks the test | Use the existing offline instant-game flow and assert that no server dependency is introduced. |

## Out of scope for the first implementation

- Pixel-perfect rendering baselines.
- Multiplayer synchronization or two-browser lockstep validation.
- Testing every authored actor or map.
- A general-purpose production debug console.
- Direct service invocation from Playwright as a substitute for canvas input.
- Duplicating `MapRiverCrossing` or `MapSandbox` solely for E2E use.

## Progress

- [x] Inspected issue #735 and searched for overlapping issues/PRs.
- [x] Audited the current Playwright/Nx setup and PR CI behavior.
- [x] Traced the offline instant-game boot into the real Phaser map and gameplay services.
- [x] Compared canvas-only, screenshot, duplicated-map, and read-only-probe approaches.
- [x] Selected the first scenario, test boundary, staged rollout, and acceptance criteria.
- [ ] Implement Stage 1.
- [ ] Implement Stage 2.
- [ ] Measure and adopt Stage 3.
- [ ] Prioritize Stage 4 cases from regressions and gameplay risk.

Exact next action: implement the typed development-only probe at the `GameContainerComponent`/active-scene boundary, including lifecycle cleanup and a test proving that production mode cannot expose it.

## References

- [Playwright assertions and `expect.poll`](https://playwright.dev/docs/test-assertions)
- [Playwright tracing](https://playwright.dev/docs/api/class-tracing)
- [Phaser camera world/screen coordinates](https://docs.phaser.io/phaser/concepts/cameras)
- [Phaser pointer world-coordinate updates](https://docs.phaser.io/api-documentation/class/input-pointer)
- [Nx Playwright integration and inferred E2E tasks](https://nx.dev/docs/technologies/test-tools/playwright/introduction)
