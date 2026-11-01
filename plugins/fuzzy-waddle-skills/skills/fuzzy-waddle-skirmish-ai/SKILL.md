---
name: fuzzy-waddle-skirmish-ai
description: Implement, diagnose or validate the Probable Waffle skirmish AI, deterministic scenario matrix, Playwright runtime matches and difficulty calibration. Use for AI-controller work; not for unrelated Phaser gameplay.
---

# Skirmish AI

## Load the minimum state

1. Read the [AI documentation index](../../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/README.md).
   Read [coverage and follow-ups](../../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/coverage-status.md)
   when evidence status or unfinished work matters. GitHub issues contain self-contained follow-up acceptance; there is
   no active #759 handoff queue. Multiplayer and extended save/load certification are deferred; difficulty calibration
   is cancelled. Automatic AI CI jobs/tag triggers are disabled until explicitly requested otherwise.
   Use descriptive unsuffixed AI filenames and symbols; do not add a generation suffix to a source name.
   Validate save/fixture/report shape at its existing boundary independently of source naming.
2. Read only the named manifest rows/fixtures implicated by the task. Use the [RTS source index](../fuzzy-waddle-phaser/references/rts-source-index.md) once, then navigate exact symbols and adjacent specs.
   If a JetBrains semantic tool is available, probe it once with a known symbol and use it for bounded symbol/call
   lookup; otherwise use narrow `rg` in the indexed owner. Do not repeat repository-wide searches after ownership is known.
3. Treat files already read in the current logical turn as cached knowledge. Reopen only changed or missing ranges; prefer `git diff` for edits.

## Work efficiently

- Keep an internal acceptance list keyed by scenario ID and invariant. Repair the first causal disagreement: observation -> demand/mission -> intent/claim -> shared application -> outcome -> cleanup.
- Batch related focused Jest specs and independent TypeScript/build checks. Run only one accelerated Phaser/Playwright match process at a time; group compatible runtime IDs with `--scenarios` so the browser starts once.
  Before expensive matches, finish the affected lifecycle review and controls in [runtime triage](references/runtime-triage.md), steps 4–5.
- Use the generic `agent:doctor`, `agent:verify`, `agent:triage`, `agent:metrics`, `agent:process` and manifest-backed
  `agent:scenario` tools through their documented contracts when relevant and authorized. `agent:context --issue`
  requires an existing local issue plan; GitHub-only follow-ups use the issue body and durable source docs directly.
  Do not recreate retired local plans just to satisfy context lookup. Derive CI selection from manifests, never a
  hand-written scenario list in workflow YAML.
- Before expanding #816 browser fixtures, inspect `pnpm ai:skirmish:catalog -- --inventory` for one-line-per-recipe
  setup/repetition/tick flags; do not dump every fixture or treat inventory flags as execution evidence.
- Summarize the newest matrix artifact with `pnpm ai:skirmish:report -- --details`, or a named artifact with
  `pnpm ai:skirmish:report -- --report <path> --scenario <ID> --failures-only --details`. Never inspect or print full
  JSON before the bounded summary identifies a missing field.
- Run a long matrix in one owned foreground terminal/session. If the tool yields while it remains active, confirm the
  original PID once. Prefer a 30–50 second session wait when supported over a separate sleep plus short polls; keep each
  wait within the host's communication limit. Avoid repeated empty log tails, directory checks and process inventories.
  Share state changes and concise waiting updates at the required cadence, without repeating the completed checklist.
  Never launch a retry or background sleep to wait. No runtime payload or zero
  tests/decisions/ticks is infrastructure evidence, not an AI behavior result.
- A dispatch, debug label or authored fixture is not outcome evidence. Preserve fixture/source/seed digests and fail closed when a required runtime or pinned-baseline path is absent.
- Do not weaken a liveness, authority, fairness or useful-effect oracle to make a run pass. A balance threshold may change only with recorded workload evidence and a fresh affected run.
- Same-type units, producers and deposits are legal when dated demand/throughput/service value requires them. Suppress fulfilled causal commitments and duplicate side effects, not object-name repetition.
- Keep proven behavior/testing/debugging guidance beside the controller and unresolved acceptance in GitHub issues.
  Retire completed temporary plans after updating backlinks; do not accumulate session ledgers.

For stable commands and evidence layers, read the [testing guide](../../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/README.md). When a runtime row fails, read [runtime triage](references/runtime-triage.md).
