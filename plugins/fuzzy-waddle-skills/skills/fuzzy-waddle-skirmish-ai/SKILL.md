---
name: fuzzy-waddle-skirmish-ai
description: Implement, diagnose or validate the Probable Waffle skirmish AI, deterministic scenario matrix, Playwright runtime matches and difficulty calibration. Use for AI-controller work; not for unrelated Phaser gameplay.
---

# Skirmish AI

## Load the minimum state

1. Read the top resume block and current Stage 15 section of `docs/ai/759-skirmish-ai/progress.md`; do not reread its completed stage history unless a dependency is implicated.
2. Read the current stage packet and named scenario rows only. Use the [RTS source index](../fuzzy-waddle-phaser/references/rts-source-index.md) once, then navigate exact symbols and adjacent specs.
3. Treat files already read in the current logical turn as cached knowledge. Reopen only changed or missing ranges; prefer `git diff` for edits.

## Work efficiently

- Keep an internal acceptance list keyed by scenario ID and invariant. Repair the first causal disagreement: observation -> demand/mission -> intent/claim -> shared application -> outcome -> cleanup.
- Batch related focused Jest specs and independent TypeScript/build checks. Run only one accelerated Phaser/Playwright match process at a time; group compatible runtime IDs with `--scenarios` so the browser starts once.
- Use `pnpm ai:skirmish:report -- --details` after a matrix run. Never print a full runtime artifact unless one compact field is insufficient.
- A dispatch, debug label or authored fixture is not outcome evidence. Preserve fixture/source/seed digests and fail closed when a required runtime or pinned-baseline path is absent.
- Do not weaken a liveness, authority, fairness or useful-effect oracle to make a run pass. A balance threshold may change only with recorded workload evidence and a fresh affected run.
- Same-type units, producers and deposits are legal when dated demand/throughput/service value requires them. Suppress fulfilled causal commitments and duplicate side effects, not object-name repetition.

For stable commands, IDE entry points and evidence layers, read the [Stage 15 operator guide](../../../../docs/ai/759-skirmish-ai/13-stage-15-operator-guide.md). When a runtime row fails, read [runtime triage](references/runtime-triage.md).
