# Production bundle lazy-loading plan

Closes #771.

## Decision

Implement the measured lazy-loading boundary and keep the existing production budgets:

- initial warning: `1.5mb`
- initial error: `2mb`

Do not raise either budget. A temporary production-build experiment reduced both initial bundles below 1 MB with a contained route-import and guard-loading change.

## Measured baseline

The measurements use optimized production builds with `--stats-json`. A temporary local budget override allowed Angular to retain the baseline artifacts; it was reverted after measurement.

| Application               | Baseline initial | Estimated transfer | Experimental initial | Estimated transfer | Raw reduction |
| ------------------------- | ---------------: | -----------------: | -------------------: | -----------------: | ------------: |
| `portal`                  |          4.10 MB |          831.53 kB |            943.64 kB |          215.46 kB |        ~77.0% |
| `probable-waffle-desktop` |          4.07 MB |          820.29 kB |            914.62 kB |          207.38 kB |        ~77.5% |

The experiment did not remove game code. It moved the largest startup dependencies into lazy chunks:

| Dependency/content                  | Measured raw chunk | Baseline state | Experimental state |
| ----------------------------------- | -----------------: | -------------- | ------------------ |
| Phaser 4                            |            1.39 MB | Initial        | Lazy               |
| Probable Waffle Phaser/runtime code |            1.23 MB | Initial        | Lazy               |
| Campaign runtime and authored data  |          292.91 kB | Initial        | Lazy               |

## Root cause

The individual Angular screens already use `loadComponent`, but startup still reaches the game runtime through two static paths:

1. Both application shells import `probableWaffleRoutes` from the package barrel, `@fuzzy-waddle/probable-waffle-interface`. That barrel also exports `ProbableWaffleComponent`, so the route shell and its injected services enter the initial graph.
2. `probable-waffle.routes.ts` statically imports `GameInstanceGuard`. The guard injects `GameInstanceClientService`; its communicator imports the Phaser package barrel, which reaches Phaser, the RTS runtime, and campaign code.

The retained `stats.json` import chain confirmed:

```text
application main
  -> probable-waffle.routes.ts
  -> GameInstanceGuard
  -> GameInstanceClientService
  -> ProbableWaffleCommunicatorService
  -> probable-waffle-phaser barrel
  -> Phaser / RTS runtime / campaign
```

Changing only the application imports to the direct route subpath reduced portal startup by about 20 kB but left the game runtime initial. Lazily resolving the route-only guard produced the full reduction, so both changes are required.

## Implementation plan

### Stage 1 — isolate the route entry point

- [ ] In `apps/portal/src/app/app-routing.module.ts`, import `probableWaffleRoutes` from `@fuzzy-waddle/probable-waffle-interface/probable-waffle.routes`.
- [ ] Apply the same direct route import in `apps/probable-waffle-desktop/src/main.ts`.
- [ ] Keep the public barrel unchanged for existing consumers; this stage only prevents both application boot paths from evaluating unrelated barrel exports.

Acceptance criteria:

- Both shells compile with the same route URLs and redirects.
- `ProbableWaffleComponent` remains a lazy route component.
- No game behavior or public exports change.

### Stage 2 — lazy-load the game-instance guard

- [ ] Replace the static `GameInstanceGuard` import in `probable-waffle.routes.ts` with one typed `CanActivateFn` wrapper shared by the lobby, score-screen, and game routes.
- [ ] Capture Angular's `Injector` synchronously in the guard's injection context, dynamically import `game-instance.guard.ts`, then resolve `GameInstanceGuard` from that injector and forward the original route/state arguments.
- [ ] Keep `GameInstanceGuard` as the behavior authority; do not duplicate its navigation or environment logic in the route file.
- [ ] Extend the guard/route tests to cover successful activation and rejection/redirection through the lazy wrapper, including all three guarded route definitions.

Acceptance criteria:

- Lobby, score-screen, and game routes retain exactly the current guard behavior.
- No static import path from either application main entry reaches `GameInstanceGuard`, `GameInstanceClientService`, Phaser, or campaign runtime code.
- The route wrapper remains strongly typed and does not call `inject()` after an asynchronous boundary.

### Stage 3 — verify and enforce the existing budgets

- [ ] Run focused formatting, lint, and Angular tests for the two apps and Probable Waffle interface library.
- [ ] Build both applications with the real production configuration and `--stats-json`; do not use the temporary research budget override.
- [ ] Confirm both builds pass the existing 1.5 MB warning and 2 MB error limits.
- [ ] Confirm Phaser, Probable Waffle runtime, and campaign chunks are lazy in both generated stats files.
- [ ] Smoke-test portal home plus desktop `/aota`, then navigate through lobby/game guard success and rejection paths.
- [ ] Record final initial and transfer sizes in the implementation PR.

Acceptance criteria:

- `portal` initial raw bundle remains at or below 1.0 MB, allowing small measurement variation from the 943.64 kB experiment.
- `probable-waffle-desktop` initial raw bundle remains at or below 1.0 MB, allowing small measurement variation from the 914.62 kB experiment.
- Existing production budgets pass without modification.
- Navigating to the RTS downloads the deferred chunks and starts normally.

## Risk and rollback

- The primary risk is losing Angular's injection context by calling `inject()` inside the dynamic-import continuation. Capturing `Injector` before the promise is created avoids that failure mode.
- Route behavior risk is limited to the three existing guarded routes. Existing guard behavior remains in its current class and is covered by focused tests plus a browser smoke test.
- If final measured startup unexpectedly exceeds 2 MB, stop and inspect the new `stats.json` import chain. Raise budgets only if a separate, newly identified initial dependency is necessary and cannot be isolated cleanly; document that dependency and measured size in the implementation PR.

## Questions

No product decision is still required. The user's preference was to use lazy loading when the code remained reasonably clean; the production experiment shows that the contained approach restores the current budgets with substantial headroom.

## Continuation prompt

```text
Implement the approved lazy-loading plan from PR #772 for #771. Use the direct Probable Waffle route subpath in both application shells, lazily resolve GameInstanceGuard through a synchronously captured Angular Injector, preserve the guard class as the behavior authority, and add focused tests. Run formatting, lint, relevant Angular tests, and both real production builds with --stats-json. Keep the existing 1.5 MB warning and 2 MB error budgets, verify both initial bundles remain at or below 1.0 MB and Phaser/RTS/campaign code is lazy, smoke-test the guarded routes, then open a separate draft implementation PR. Do not raise budgets unless new measured evidence proves a necessary initial dependency cannot be isolated cleanly.
```
