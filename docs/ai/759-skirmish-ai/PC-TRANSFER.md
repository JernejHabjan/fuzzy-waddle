# #759 cross-PC resume

Read HANDOFF.md first; this file is the short machine-transfer packet. The user explicitly requests an unfinished
commit now. Browser execution must move off the current thermally constrained PC. Do not claim stage completion.

## Fetch the work

Repository: https://github.com/JernejHabjan/fuzzy-waddle
Branch: feature/759-skirmish-ai. Base before checkpoint: b2c9868bba35818afd4ddad026121732cb6f668b.
The checkpoint is the commit containing this file; inspect its log and compare HEAD with origin/feature/759-skirmish-ai.
Use a clean checkout on the other PC. Do not reset or overwrite a checkout with unrelated edits.

```sh
git fetch origin
git switch --track origin/feature/759-skirmish-ai
git rev-parse HEAD
git rev-parse origin/feature/759-skirmish-ai
pnpm install --frozen-lockfile
git lfs pull
node tools/assets/check-git-lfs.mjs
```

If the local branch already exists, switch to it and fast-forward normally instead of creating it again.
Use the repository's pinned runtime/package-manager versions (previous PC: Node24.18, pnpm11.14).
Follow repo skills and environment setup; install the matching Playwright Chromium if absent. Real-peer cases need
the existing local Supabase/Docker setup and normal local configuration; never copy credentials into this document.
Multiplayer has no save/load. SP save/replay and real multiplayer authority transfer are distinct controls.

The previous checkout was /home/jernej/.codex/worktrees/skirmish-authority-recovery/fuzzy-waddle.
Do not assume that absolute path on the new PC; execute all commands from its clean repository root.
Ignored tmp/, dependencies, hydrated LFS cache, browser cache and local configuration are not committed.
Old artifacts are not needed to resume: rerun on the checkpoint source and retain its provenance.

## What this checkpoint changes and why

- Native requests use an8MiB-limited SHA256-bound local file instead of a huge environment variable, fixing E2BIG.
  apps/portal-e2e/src/e2e/skirmish-ai-runtime-request-transport.mjs is shared by the matrix runner and harness.
- tools/ai/native-scenario-registration.mjs strips empty route scratch arrays and uses2D endpoints; H-26 rallies
  to an owned front actor. Regenerated native JSON fixtures now pass the actual strict browser config schema.
- Browser readers reject missing required actor roles and handle incomplete evidence explicitly. Runtime harness
  records bounded per-variant/oracle errors while preserving completed worlds; this is not durable incremental
  reporting, and a global timeout can still prevent publication. Do not assume partial results survive every abort.
- Test registration/types and lifecycle mock contracts now match the real owners. Pure H-32/DBG mappings point to
  actual owner assertions. These changes improve trustworthy checks; they do not prove native gameplay success.

## Evidence retained at checkpoint

| Scope | Last result | Remaining limit |
| --- | --- | --- |
| Node tools including D-06 driver/refusal and request transport |109/109 pass|Not native calibration |
| Browser config schema in Phaser Jest |582/582 presets accepted|Exact checked-count assertion added after that run; rerun |
| Selected pure matrix |15/15 mappings;196 assertions/37 suites|Owner-contract proof only |
| Affected Phaser |90/90;16 suites|Later equivalent movement mock typing needs final recheck |
| Affected gameplay |60/60;9 suites|Later mutable test fixture typing needs final recheck |
| UI startup/host |9/9;2 suites|Not a running match |
| Assertion-only Playwright readers |13/13 and16/16|Later registration import repair needs affected recheck |
| e2e/Phaser/gameplay actual-source type checks |Passed|Complete final post-edit gate not repeated |
| Changed-file lint |Four errors repaired; focused rerun clean|Full changed-file rerun outstanding; warnings retained |
| Selected native obligations |0/22 newly closed|14 SP unproved,7 peer environment-blocked,D-06 expensive work deferred |

Local-only evidence: /tmp/759-ai-tools-gate.log, /tmp/759-native-configs.log, /tmp/759-phaser-controls.log,
/tmp/759-gameplay-controls.log, /tmp/759-ui-controls.log, /tmp/759-reader-controls.log,
/tmp/759-affected-reader-controls.log, /tmp/759-feature-{e2e,phaser,gameplay}-types.log.
Pure report: tmp/ai-skirmish-matrix/759-batch-pure/1792647668026-passed.json.
These paths will not exist on the other PC unless separately copied; this table is the compact retained record.

Native attempts first failed E2BIG, then unhydrated audio, then invalid configs; those source/setup issues were repaired.
The final single D-03 attempt still failed after2160074ms with0 ticks/decisions and a browser-context disposal error:
tmp/ai-skirmish-matrix/759-baseline-start/1792693515037-failed.json.
Thermal throttling is user-reported; that error alone does not prove its cause or identify an AI behavior bug.
No owned browser/matrix process remained active at checkpoint. Do not continue retrying on this PC.

## First action on the other PC

Verify the fetched checkpoint, dependencies and LFS, then try just the previously failing native start:

```sh
NX_DAEMON=false node tools/ai/run-skirmish-matrix.mjs \
  --scenario D-03 --variant d-03-tivara-easy-baseline --repetition 1 --mode runtime \
  --run-id 759-transfer-start --output tmp/ai-skirmish-matrix/759-transfer-start
```

Inspect only its bounded summary; substitute the actual resulting report path:

```sh
node tools/ai/summarize-skirmish-report.mjs --report REPORT_PATH --failures-only --details
```

Keep model-facing summaries at most8192 UTF-8 bytes. Never feed the raw large runtime report to an LLM.
If no ticks occur, fix startup/environment before another batch. If it executes, group the14 SP-capable rows:

```sh
NX_DAEMON=false node tools/ai/run-skirmish-matrix.mjs \
  --scenarios D-03,D-04,D-05,H-05,H-20,H-23,H-31,SEQ-03,SEQ-04,SEQ-06,SEQ-07,DBG-01,DBG-04,DBG-06 \
  --mode runtime --output tmp/ai-skirmish-matrix/759-transfer-sp
```

Real-peer rows: D-02,H-08,H-09,H-32,SEQ-08,DBG-03,DBG-05. Run together only after local Supabase/Docker and
the existing real-peer harness setup work. Fix shared causal failures and run affected controls together.
D-06: driver/refusal controls only now; pinned legacy difficulty/opening comparison is explicitly unsupported.
Do not launch calibration, holdout,72000-tick soaks or deferred both-faction victory matches in this batch.
Do not create more registrations or remove machinery yet. Reconcile exact behavior evidence, commit/push and pause.

## Useful work without launching a browser

These are alternatives for a future selected batch, not new acceptance stages or permission to claim native passes:

1. **Finish the lightweight publication checks:** actual-source typing, changed-file lint, schema Jest and Node
   controls. Use one worker for Jest if useful. Pure matrix command below repeats the15 declared mappings.
2. **Audit/fix production owners with pure regressions:** resource authority (duplicate charge/refund, stale deposit
   capacity, carried resources), construction cancellation/builder reassignment and attack readiness/retreat/routing.
   Start from an existing failing control or a demonstrable source defect; do not invent tuning from missing runtime evidence.
3. **Harden existing result readers using small synthetic records:** erase required evidence, swap actor/command
   identity, reorder events, test epoch/retention boundaries. Prefer existing tests over duplicate fixtures.
4. **Review legacy callers and contracts:** follow production consumers, save migrations, shutdown and exactly-once
   ownership; repair concrete inconsistencies with targeted pure/Jest coverage. Keep MP save/load out of scope.
5. **Resolve the D-06 baseline policy on paper:** document the exact compatibility decision needed before expensive
   calibration. Do not substitute baseline AI, waive requirements or launch matches without that decision.

```sh
node --test tools/ai/*.test.mjs
NX_DAEMON=false pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
NX_DAEMON=false pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
NX_DAEMON=false pnpm exec tsc --noEmit -p libs/games/probable-waffle/gameplay/tsconfig.spec.json
NX_DAEMON=false node tools/ai/run-skirmish-matrix.mjs \
  --scenarios D-02,D-03,D-04,D-05,H-05,H-08,H-09,H-20,H-23,H-31,H-32,DBG-01,DBG-03,DBG-04,DBG-05 \
  --mode pure --output tmp/ai-skirmish-matrix/759-transfer-pure
```

Typing/lint can still consume CPU; run sequentially here. Native matches, peer integration, real path arrivals,
delivered income, island landings and full victory cannot be certified by these alternatives.
Recommended next model: Sol6.1 medium for scoped checks/settled repairs; high for unresolved authority or causal design.
Actual model/effort during this checkpoint is unknown. No automatic model change or delegation.
