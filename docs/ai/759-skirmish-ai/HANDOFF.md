# RTS AI — execution handoff

Updated 2026-11-01. Scout profile implementation pushed at e9789ce05; remote full-family CI passed. Review repaired the CI blocker. Remote run 41249184852 passed all seven core runtime cases.
REMAINING-WORK owns acceptance; CURRENT-EVIDENCE owns provenance and limitations.

## Current state

- Branch feature/759-skirmish-ai; Node 24/pnpm; PR #814 stays draft.
- 0c73050a4: explicit ai-regression/* tag trigger and per-repetition omission accounting (six focused tests pass).
- d6ddd363a: hydrate Git LFS assets in all three runtime CI paths. First remote run failed before matches because assets were pointer files.
- Successful run: https://github.com/JernejHabjan/fuzzy-waddle/actions/runs/41249184852 at d6ddd363a, tag ai-regression/review-20261031-2.
- Native SCOUT-02 full-family and strategic evidence remain recorded in CURRENT-EVIDENCE. No gameplay changes in this review.
- Local core pack passed 7/7 in 25m27s; both owning compilers and changed-file lint pass. Full project lint retains the documented legacy errors.

## Live checks

- Local scout profile attempts failed with ENOSPC in the workspace temp volume; no behavior verdict. Free space or redirect runner outputs before retry.
- Remote scout profile passed: run 41284467090, tag ai-regression/scout/closure-20261101-1.
- Both owning lint and TypeScript checks pass; 63 runner/fixture tests and nine route-outage tests pass.

## Closure

- Full SCOUT-02 family is integrated and passed remotely across both factions, including all paired hidden-state comparisons. Seven-case core pack and SCOUT-02 are separate profiles, each capped at 30 minutes.
- Local core pack, remote core pack, remote scout pack, TSC, Phaser/portal-e2e lint, focused tests and omission/final audits pass. Local scout execution is unavailable on the full temp volume (8 KB free); remote run is authoritative for this profile.
- PR #814 remains draft. Manual dispatch requires default registration; explicit profile tags provide remote execution.
- No multiplayer, calibration or replay-determinism certification.

## Guardrails

- One local native runner, <=30 minutes per invocation; retain applicable evidence.
- No merge, PR readiness change, multiplayer certification, D-06 calibration or advanced replay claims.
- Update these records in place. Git stores history; no additional session logs.
