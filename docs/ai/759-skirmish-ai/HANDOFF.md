# #759 skirmish AI handoff

This is the only durable execution handoff for unfinished #759 work. Product architecture, testing and debugging documentation lives beside the AI controller at `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/`.

## Cold start

- Branch: `feature/759-skirmish-ai`
- Draft PR: [#814](https://github.com/JernejHabjan/fuzzy-waddle/pull/814), targeting `develop`
- Responsibility-based documentation closeout commit: `8101d24d445d2956fba1891ca72fc368cd219111`
- Last runtime/tooling repair commit: `e0f62f9fc84248605e8f8af3870248f9ae5e7543`
- Pinned pre-change baseline: `de47f482889db30420692bf4406fba463d7db296`
- Manifest: `tools/ai/fixtures/skirmish-v1.json`, version `skirmish-v1`, 121 named cases before variants
- Unrelated local file: `.run/start_portal.run.xml`; never stage it with AI work
- Recommended routine repair model: `gpt-5.6-terra`, medium effort
- Recommended mechanical fixture/report/docs work: `gpt-5.6-luna`, medium effort
- Raise effort only after a focused failure proves a cross-system authority or lifecycle problem

Start by reading:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/README.md`
2. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/runtime-e2e.md`
3. the `fuzzy-waddle-skirmish-ai` skill
4. this file's current evidence and next-action sections

Do not reconstruct completed implementation stages from Git history unless a failing contract points there.

## Environment and bootstrap

The last verified local tooling environment was:

| Tool          | Version/path                     |
| ------------- | -------------------------------- |
| Node.js       | `v24.18.0`                       |
| pnpm          | `11.14.0`                        |
| Playwright    | `1.61.1`                         |
| Local browser | `/usr/bin/google-chrome`         |
| Repository    | pnpm/Nx monorepo, base `develop` |

Install repository dependencies with `pnpm install`. Install the Playwright Chromium dependency when the host does not provide a compatible browser. Use the package commands below rather than invoking the parameterized Playwright spec without its runtime request.

## Current evidence

- ECO-08 passed both factions in `tmp/ai-results/759-runtime-opening/1789015953128-passed.json`, including the zero-worker bootstrap.
- PRO-01–07 passed as one real Playwright group in `tmp/ai-skirmish-matrix/1789053013336-passed.json`: 1,442 decisions and 24,040 ticks.
- Latest SEQ-01/02 evidence is `tmp/ai-skirmish-matrix/1789075636141-failed.json`: 6,674 decisions and 120,079 ticks.
- That sequence run reached income, production, combat and continuing pressure, but both land-loop variants lacked terminal results and Tivara raid recovery failed its old predicate.
- Repairs after that artifact stop static enemy buildings from creating false home-defense demand/reinforcement assignment and allow a terminal win to satisfy post-raid offensive recovery.
- Those repairs passed focused manager tests (2 suites, 35 tests) and portal-E2E TypeScript, but have not been rerun in Playwright.
- A wider focused gameplay batch previously passed 7 suites / 82 tests. The portal development build also passed.
- Coverage at closeout: 10 of 120 runtime-required rows mapped, so 110 remain. Forty of 111 pure-required rows are mapped, so 71 remain.
- The pinned-baseline adapter is metadata-only; isolated baseline execution and D-06 calibration are not implemented.

Evidence is source-sensitive. Verify the current commit and dirty diff before treating any artifact as applicable.

## Exact next action

```bash
pnpm ai:skirmish:land-sequences
pnpm ai:skirmish:report -- --failures-only --details
```

Repair remaining SEQ failures in causal batches. Run focused Jest checks after a batch, then rerun the affected grouped Playwright scenarios once. Do not run parallel Phaser/Playwright processes.

## Priority order

| Priority | Work                                                                                                                                             | Exit condition                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| P0       | Rerun/repair SEQ-01/02; implement isolated pinned-baseline execution; map remaining supported runtime and pure rows; wire mandatory pre-merge CI | Every supported required row is executable and CI fails closed on missing work/evidence |
| P1       | D-06 calibration; save/host/second-match lifecycle; debug parity; representative seeds and long soaks                                            | Correctness, challenge ordering and bounded lifecycle evidence are published            |
| P2       | Responsibility-based production naming migration; final documentation/index cleanup; optional diagnostic ergonomics                              | No permanent production name depends on #759 delivery-stage vocabulary                  |

After SEQ-01/02 pass:

1. Implement clean isolated candidate and pinned-baseline execution with no candidate fallback.
2. Implement D-06 paired calibration with 20 shared seeds, expanding to at most 100 only when uncertainty remains material.
3. Convert remaining manifest rows to typed pure fixtures and real runtime recipes.
4. Register the supported full runtime matrix as a sharded required pre-merge CI/merge-queue gate.
5. Run repository validation, extended seeds, soaks and human review only after the mandatory supported matrix is complete.

## Required pre-merge test policy

The 121 cases were never intended as one unrepeatable agent run. The design requires:

- every focused deterministic fixture repeated three times with decision/state/hash comparison;
- all supported runtime-required cases executed through the real Playwright game runtime;
- seeds 1–5, mirrored sides and both factions for representative available authored maps;
- selected stress cases expanded to seeds 1–20;
- difficulty comparisons starting at 20 paired seeds and expanding to at most 100;
- at least three 60-minute-simulation soak matches;
- missing fixture, missing work, missing terminal result, provenance mismatch or unsupported fallback reported as failure.

The full matrix is not currently connected to CI. Until it is sharded and registered as a required pre-merge check, agent-local green runs are evidence but not an enforceable merge gate.

## Scenario-family status

Derived from `tools/ai/fixtures/skirmish-v1.json` at the documentation closeout commit. “Mapped” means a fixture/recipe is registered, not that it has passed.

| Family        |   Cases | Runtime mapped/required | Pure mapped/required |
| ------------- | ------: | ----------------------: | -------------------: |
| Economy       |      10 |                    1/10 |                 0/10 |
| Production    |       8 |                     7/8 |                  2/8 |
| Technology    |       6 |                     0/6 |                  6/6 |
| Scouting      |       6 |                     0/6 |                  1/6 |
| Strategy      |      13 |                    0/13 |                 3/13 |
| Access        |       9 |                     0/9 |                  4/9 |
| Combat        |      12 |                    0/12 |                 8/12 |
| Placement     |       5 |                     0/5 |                  0/5 |
| Fortification |       7 |                     0/7 |                  1/7 |
| Recovery      |       5 |                     0/5 |                  0/5 |
| Authority     |       5 |                     0/5 |                  0/5 |
| Reservations  |       2 |                     0/2 |                  0/2 |
| Service lanes |       3 |                     0/3 |                  0/3 |
| Transport     |       1 |                     0/1 |                  1/1 |
| Lifecycle     |       3 |                     0/3 |                  3/3 |
| Continuous    |       8 |                     2/8 |                  0/0 |
| Classic RTS   |       6 |                     0/6 |                  4/6 |
| Difficulty    |       6 |                     0/6 |                  3/5 |
| Debug         |       6 |                     0/5 |                  4/5 |
| **Total**     | **121** |              **10/120** |           **40/111** |

Recalculate these counts from the manifest after every fixture batch; do not manually reduce the required denominator.

## CI sharding and artifacts

Suggested isolated Playwright shard families:

1. economy and production;
2. scouting, strategy and combat;
3. access, transport, placement and fortification;
4. recovery, authority, reservations, lanes and lifecycle;
5. continuous matches;
6. classic RTS, difficulty and debug.

CI may run shards concurrently on separate clean workers. Within one worker, run one Phaser/Playwright runtime process at a time. Each shard must publish its compact JSON summary. On failure, also retain the causal trace/repro bundle, browser log and relevant screenshot/video. Reports must include candidate SHA, dirty-source digest, manifest/fixture digest, seed, faction, side, profile, tick/decision counts and first failed predicate.

`tmp/` files are ignored and may not exist months later. Never make the handoff depend on them alone: keep the compact result/provenance in this handoff or the PR, and configure CI artifact retention for raw evidence. Final release evidence should have a durable compact index with hashes even when large raw artifacts expire.

## Map and capability limitation

There is no shipped island map yet. Do not claim real island-map E2E coverage or create a fake pass on another map. Keep island expansion/transport variants explicitly blocked by content, retain their pure access/transport tests, and enable their Playwright rows when an island map exists.

Air, naval and ordinary transport scenarios remain required wherever the current catalog and available runtime world genuinely support them. A flying container remains synthetic-only unless a real registered faction unit gains that capability.

## Blocker classification

| Class                   | Current examples                                                                                                  | Required handling                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Code defect             | Remaining SEQ terminal/recovery failure after the latest causal fixes                                             | Repair earliest causal disagreement and rerun focused plus grouped runtime evidence          |
| Test infrastructure     | 110 runtime rows and 71 pure rows unmapped; baseline adapter incomplete; pre-merge CI absent                      | Implement fixtures/adapters/coverage gate; missing coverage cannot pass                      |
| Game content            | No shipped island map; no registered flying container capability                                                  | Keep explicit unsupported/content-blocked status and retain pure contract coverage           |
| Human validation        | Challenge, predictability, fairness and debug usability review not completed                                      | Record separately after automated correctness; never fabricate approval                      |
| Pre-existing repository | Aggregate Phaser type check previously reported unrelated errors in campaign/human-controller/generated-map paths | Reconfirm against current `develop`; separate unrelated failures from task-owned regressions |

## Unit and integration backlog

- Determinism under equivalent actor, candidate and outcome ordering permutations.
- Duplicate, delayed, stale, missing and post-authority command outcomes.
- Demand fulfillment that permits justified repeated units/buildings and stops excess afterward.
- Save/load round trips across active economy, mission, transport, fortification, recovery and accepted-effect states.
- Property/fuzz coverage for malformed observations, topology invalidation and disappearing actors.
- Real-catalog composition/counter legality for both factions.
- Placement properties for footprints, reservations, corridors, walls, stairs, towers and shore access.
- Bounded history/backlog/controller cleanup across disposal, host replacement and repeated matches.
- A content-drift gate proving each trainable/buildable gameplay capability has an explicit AI disposition.

## Runtime E2E backlog

- Full AI matches for both factions and every difficulty on available representative maps/spawn sides.
- Land, air, naval and supported transport-required combat.
- Wall/rampart construction, reinforcement, breach, withdrawal and recovery.
- Resource depletion, worker loss, destroyed drop-offs/producers and purposeful rebuilding.
- Raids, simultaneous fronts, composition changes and meaningful follow-up attacks.
- Save/reload, host transfer, late outcomes and clean second-match startup.
- Human-versus-AI launch and basic play smoke.
- Multiple AI players/opponents with player-local IDs, quotas and claims.
- Debug enabled/disabled/export/filter outcome parity.
- Terminal/liveness, bounded memory and decision-work budgets under long soaks.

## Deferred responsibility-based naming cleanup

Production names currently contain pull-request stage numbers. Perform this as a separate mechanical migration after runtime stabilization:

- rename manager files/classes/specs by responsibility, for example `ai-stage-7-macro-manager` to `ai-macro-manager`;
- rename generic helpers such as `createStage2Observation` to responsibility-based test-builder names;
- replace stage-labelled test descriptions and non-persisted diagnostics;
- inventory persisted effect, claim, manager, trace and save identifiers containing `stageN` before changing them;
- preserve compatibility through aliases or an explicit migration when an identifier can exist in saves, replays or incident bundles;
- update imports, public barrels, manifests, source indexes and focused tests atomically;
- do not combine behavior changes with the naming migration.

## Final closure criteria

- Every supported required manifest row has pure/runtime evidence matching its declared driver.
- Unsupported rows state a real missing capability/content dependency and remain in the denominator/report.
- Candidate and baseline sources are isolated, identified and reproducible.
- Pre-merge CI executes the sharded supported matrix and fails closed.
- Difficulty profiles are behaviorally distinct without hidden information or cheats.
- Long-run lifecycle, debug parity and second-match cleanup pass.
- Remaining stage-number production names are migrated compatibly.
- Product docs, source indexes, skills and commands match the final code.
- A final omission audit and separate closure audit record exact commands, artifacts and unresolved external blockers.

## Copyable resume prompt

```text
Resume PR #814 on feature/759-skirmish-ai from docs/ai/759-skirmish-ai/HANDOFF.md. Verify the branch/remote SHA and preserve the unrelated .run/start_portal.run.xml change. Use the fuzzy-waddle-skirmish-ai skill and responsibility-based testing docs. Start with pnpm ai:skirmish:land-sequences, summarize failures compactly, repair the earliest causal SEQ-01/02 disagreements in batches, run focused Jest checks, then rerun only that grouped Playwright slice. After it passes, implement isolated pinned-baseline execution and continue the P0 manifest/CI work. Never weaken an oracle, replace the pinned baseline with candidate code, claim missing runtime evidence, or run parallel Phaser processes on one worker. Commit and push at a coherent evidence boundary and update this handoff.
```

## Handoff retirement

Delete this issue-specific handoff only after every supported required scenario is green in required pre-merge CI, explicit content blockers are transferred to their owning game-content backlog, calibration/soaks/human review are recorded, the responsibility-based naming migration is complete, and no source/skill/wiki link depends on this file. Durable architecture/testing/debugging rules remain beside the controller.
