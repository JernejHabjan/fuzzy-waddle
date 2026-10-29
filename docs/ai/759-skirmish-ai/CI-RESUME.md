# #759 CI follow-up (deferred)

Updated 2026-10-29. CI activation and real-peer evidence are excluded from the first single-player iteration.
Read HANDOFF.md and REMAINING-WORK.md for current work. This file is not an active queue.

## Existing implementation

.github/workflows/pull-request-checks.yml defines:
- skirmish-runtime-plan: tools/ai/select-skirmish-ci-shards.mjs derives supported manifest shards.
- skirmish-runtime: runs native matrix shards, retains artifacts, max-parallel 2 and job timeout 60 minutes.
- skirmish-multiplayer: starts Supabase and runs the real-peer harness, timeout 35 minutes.

All three jobs require github.event.pull_request.draft == false. PR #814 is draft and must remain unchanged.
Configured automation is therefore not evidence that current branch checks have executed.
The selector includes supported runtime rows; it is not a changed-owner test selector.
No other-PC probe is needed. Do not manually duplicate the scenario catalogue in workflow YAML.

## Later activation work

After the single-player iteration, choose an explicitly authorized CI route (for example a manual workflow)
without changing PR state implicitly. Separate fast affected checks/small smoke coverage from extended native
runs; use existing manifest fixtures. Preserve real-peer requirements and report missing infrastructure honestly.
Run existing reconnect/host-transfer/stale-command cases and retain their own evidence; SP cannot certify them.
Resolve unsupported D-06 baseline comparison as a separate scope decision before calibration.
Do not activate or redesign these workflows during the current iteration.
