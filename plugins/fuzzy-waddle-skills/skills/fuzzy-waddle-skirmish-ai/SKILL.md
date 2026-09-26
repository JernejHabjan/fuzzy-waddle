---
name: fuzzy-waddle-skirmish-ai
description: Implement, diagnose or validate the Probable Waffle skirmish AI, deterministic scenario matrix, Playwright runtime matches and difficulty calibration. Use for AI-controller work; not for unrelated Phaser gameplay.
---

# Skirmish AI

## Load the minimum state

1. Read the [AI documentation index](../../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/README.md). For unfinished #759 work, read only [HANDOFF.md](../../../../docs/ai/759-skirmish-ai/HANDOFF.md).
   When a #759 subissue has a linked cold-start plan, read that plan instead of reconstructing its scope from the parent handoff.
   The #824 repository-wide efficiency/tooling gate and #825 current-content domain/transport foundation are complete.
   A generic request to continue draft PR #814 follows the first active row in the handoff progress grid. Optional
   island-map issue #822 is not a core dependency or merge gate.
2. Read only the named manifest rows/fixtures implicated by the task. Use the [RTS source index](../fuzzy-waddle-phaser/references/rts-source-index.md) once, then navigate exact symbols and adjacent specs.
3. Treat files already read in the current logical turn as cached knowledge. Reopen only changed or missing ranges; prefer `git diff` for edits.

## Work efficiently

- Keep an internal acceptance list keyed by scenario ID and invariant. Repair the first causal disagreement: observation -> demand/mission -> intent/claim -> shared application -> outcome -> cleanup.
- Batch related focused Jest specs and independent TypeScript/build checks. Run only one accelerated Phaser/Playwright match process at a time; group compatible runtime IDs with `--scenarios` so the browser starts once.
- Run `pnpm agent:doctor` and `pnpm agent:context -- --issue <number>` first for unfinished #759 work. Use
  `agent:verify`, `agent:triage`, `agent:metrics`, `agent:process`, and manifest-backed `agent:scenario` only through
  their documented contracts; do not manually rebuild their bounded output from chat history. #816 owns supported-row
  classification and CI sharding, so do not manufacture a scenario list in workflow YAML.
- Summarize the newest matrix artifact with `pnpm ai:skirmish:report -- --details`, or a named artifact with
  `pnpm ai:skirmish:report -- --report <path> --scenario <ID> --failures-only --details`. Never inspect or print full
  JSON before the bounded summary identifies a missing field.
- Run a long matrix in one owned foreground terminal/session. If the tool yields while it remains active, confirm the
  original PID once and poll sparsely; never launch a retry or background sleep to wait. No runtime payload or zero
  tests/decisions/ticks is infrastructure evidence, not an AI behavior result.
- A dispatch, debug label or authored fixture is not outcome evidence. Preserve fixture/source/seed digests and fail closed when a required runtime or pinned-baseline path is absent.
- Do not weaken a liveness, authority, fairness or useful-effect oracle to make a run pass. A balance threshold may change only with recorded workload evidence and a fresh affected run.
- Same-type units, producers and deposits are legal when dated demand/throughput/service value requires them. Suppress fulfilled causal commitments and duplicate side effects, not object-name repetition.
- When a #759 issue closes, migrate proven AI behavior/testing/debugging guidance beside the controller, update its GitHub links, and retire its resolved follow-up plan. Remove the #759-specific routing from this skill when the parent roadmap closes.

For stable commands and evidence layers, read the [testing guide](../../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/README.md). When a runtime row fails, read [runtime triage](references/runtime-triage.md).
