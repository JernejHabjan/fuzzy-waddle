# RTS AI — next execution handoff

Updated 2026-10-31. S3 and the current-source local regression pack are complete. Task changes are committed and pushed. Remote CI validation is blocked because GitHub does not expose the new dispatch workflow until it is on the default branch; PR #814 remains unchanged.
`REMAINING-WORK.md` owns scope and acceptance; `CURRENT-EVIDENCE.md` owns evidence and exclusions.

## Current state

- Workspace `C:/Git/Jernej/fuzzy-waddle`, branch `feature/759-skirmish-ai`, Node 24, pnpm.
- T1/T2, S1/S2/S3, F1/F2/F3 complete. TSC checks pass for Phaser and portal-e2e; focused tests and native checks are recorded in CURRENT-EVIDENCE.
- Strategic native counterparts: SCOUT-02 full family `1793446488003-passed`; DOMAIN-05 `1793447721151-passed`; TECH-01 `1793446778377-passed`; RAID-01 `1793453795782-passed`; STRAT-05 had one evaluator false negative, fixed and covered by focused spec plus `1793455109552-diagnostic_passed` replay. That replay is diagnostic, not a replacement full-family certification.
- Current-source `pnpm ai:regression` passed: 7/7 selected cases, preflight 105 suites/632 tests, 25m27s under the 30m cap. Aggregate is `tmp/ai-skirmish-regression/latest.json`; run report IDs and source/fixture digests are in CURRENT-EVIDENCE.
- Local pack source is HEAD `90e8d711a` plus working-tree digest `fnv1a32:4f3eea29`. Seven selected diagnostic cases are not whole-family certification.
- R pack, strict E2E hook and manual workflow are authored. Remote successful workflow run and artifacts are not yet recorded.
- Commits pushed: `795d2f8b2` (AI/scouting behavior and native evidence), `1854f11c4` (regression runner/CI pack), `3232e2b09` (closure audit and CI prerequisite).
- `gh workflow list --all` does not include AI Regression Pack. Dispatch attempt returned HTTP 404: workflow not found on the default branch. Do not alter PR #814; required prerequisite is making the workflow available on the default branch.
- Changed TypeScript files pass direct ESLint with 0 errors (warnings remain). Whole-project lint has existing errors in unchanged `skirmish-ai-expansion-pressure-pairs.ts`, `skirmish-ai-native-scenario-evaluation.ts`, `skirmish-ai-native-scenario-pairs.ts`, and `ai-runtime-route-outages.ts`.

## Next actions

1. Remote C2 cannot proceed while the workflow is absent from the default branch. Once available there, dispatch `.github/workflows/ai-regression.yml` with `run_ai_regression=true`, then capture run URL/status/artifacts. Keep PR #814 draft and unchanged.
2. Keep C2 and the tool goal open until remote evidence exists or the user explicitly changes the default-branch/PR constraint.

## Guardrails

- One native runner at a time; each invocation max 30 minutes. No unchanged scenario reruns.
- Keep multiplayer, ESCORT/naval expansion, D-06 calibration, tournament balance and advanced replay parity excluded as listed in REMAINING-WORK.
- Preserve PR #814 draft status. No merge or PR readiness changes.
- Keep these three docs compact; update rows in place instead of appending a journal.
- `pnpm ai:regression -- --list` previews selection. `RUN_AI_REGRESSION=true pnpm e2e` opts into the pack; unset/false runs ordinary E2E only.
