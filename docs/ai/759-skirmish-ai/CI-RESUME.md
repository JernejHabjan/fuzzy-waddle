# #759 CI runtime resume

Read [HANDOFF.md](HANDOFF.md) first. Routine native runtime scenarios are already automated by
`.github/workflows/pull-request-checks.yml`; do not run the former cross-PC D-03 startup probe.

## Current CI path

The pull-request workflow runs `tools/ai/select-skirmish-ci-shards.mjs`, derives shards from the scenario manifest,
runs each shard with the native matrix runner on Ubuntu/Playwright, and retains the report artifacts. Its separate
real-peer job starts local Supabase before multiplayer execution.

The selector accepted only deferred issue 822, while H-21 is correctly marked as a user deferral under issue 759.
That contract and its focused control are repaired. The selector now succeeds and dynamically emits 103 runtime
shards, retaining the five explicit content deferrals. Do not maintain another scenario list in workflow YAML.

## Progress snapshot

- Updated 2026-10-27: two of 22 selected native obligations are closed (STRAT-05 and all five STRAT-02 branches). The Skaduwee boat branch and the shared RAID-03 Skaduwee boat branch both pass on the latest tested source. Next work remains STRAT-03/04 and the dependent scouting/combat/access packages; see [HANDOFF.md](HANDOFF.md) and [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) for the active cursor and branch evidence.
- Scenario registration: pure 111/111 and supported runtime 115/115; five runtime rows are explicitly deferred.
  Registration means runnable setup exists, not that behavior passed.
- Newly selected native obligations: 2/22 closed. Thirteen single-player rows lack complete native family evidence; seven
  real-peer rows need multiplayer evidence; D-06's expensive comparison remains deferred/unsupported.
- The five-item non-browser audit and repair batch is checked. Its commands and results remain in
  [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md); do not repeat it as preparation.
- Package 3's two-faction SEQ-01 authoritative victory gate now passes on adaptive placement coverage and the one-retry
  tactical mission fix. See the latest evidence and Package 3 continuation cursor in [HANDOFF.md](HANDOFF.md).

## Next

Use the matrix or bounded local diagnostics and retained reports to triage failures. Fix the earliest shared causal
failure, run affected controls, then rerun relevant shards. Keep real-peer outcomes distinct from single-player
save/replay behavior.

The remaining outcome order and finish conditions are in [REMAINING-WORK.md](REMAINING-WORK.md): current scouting,
combat and access; placement/recovery; authority, multiplayer and lifecycle; continuous play and difficulty; then
debug, legacy closure and the final machinery review. The user's 2026-10-24 instruction to finish the AI work
supersedes the earlier pause on full victory and broad gates; run them after their dependencies. Resolve D-06 baseline
compatibility before calibration. Five content rows remain explicitly deferred and are excluded from the supported
runtime denominator.
