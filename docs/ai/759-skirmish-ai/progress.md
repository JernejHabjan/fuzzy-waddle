# #759 implementation progress

This file records implementation, not completion of research. Update after every stage/interrupt. Do not check acceptance merely because code was authored.

Documentation review, 2026-09-05: added classic-RTS comparison, integrated C/D/DBG requirements and offline overview. Documentation smoke passed with `AI_OVERVIEW_BROWSER=/usr/bin/google-chrome node docs/ai/759-skirmish-ai/overview.smoke.mjs`: 30 scenario/stage combinations, three keyboard-operated profiles, capacity boundaries, three viewport widths, offline fallback, local links and 121 unique scenario IDs. Desktop/mobile screenshots were visually reviewed; a clipped mobile map label was fixed and the smoke rerun. This is page/specification evidence only; every runtime stage below remains not started.

- Integration branch/worktree: not started
- Base develop SHA: record at kickoff
- Research source SHA: record at kickoff
- Stage 0 PR #792 state/SHA/integration method: inspect at kickoff
- Baseline source SHA / fixture manifest version: not captured
- Current stage and exact next action: Stage 0; follow `00-start-here.md`
- Execution policy: stages 0–14 author plus focused checks/review/smoke; extensive integrated release validation/builds/soaks/review in Stage 15 (supersedes all-checks-at-end)
- Current actual model/effort: record at kickoff
- Last task-owned commit: none
- Known integration defects / external blockers: none established; research findings are not yet fixed

| Stage | Implementation | Focused gate | Final validation | Commit / paths / next action |
| --- | --- | --- | --- | --- |
| 0 | not_started | not_run | deferred_to_15 | |
| 1 | not_started | not_run | deferred_to_15 | |
| 2 | not_started | not_run | deferred_to_15 | |
| 3 | not_started | not_run | deferred_to_15 | |
| 4 | not_started | not_run | deferred_to_15 | |
| 5 | not_started | not_run | deferred_to_15 | |
| 6 | not_started | not_run | deferred_to_15 | |
| 7 | not_started | not_run | deferred_to_15 | |
| 8 | not_started | not_run | deferred_to_15 | |
| 9 | not_started | not_run | deferred_to_15 | |
| 10 | not_started | not_run | deferred_to_15 | |
| 11 | not_started | not_run | deferred_to_15 | |
| 12 | not_started | not_run | deferred_to_15 | |
| 13 | not_started | not_run | deferred_to_15 | |
| 14 | not_started | not_run | deferred_to_15 | |
| 15 | not_started | not_run | not_started | |

For each stage append: implemented symbols and consumers, schema/config decisions, debug fields, authored test/fixture IDs, actual model/effort, pending issues, and exact next action. Allowed implementation states: `not_started`, `in_progress`, `implemented_unvalidated`, `stage_checked`, `validated`, `blocked`. Validation records need command, candidate SHA, fixture version/seed, outcome, artifact path, and any unrelated pre-existing failure. Keep code defects separate from infrastructure blockers.

Use stage_checked only with passed focused gates, connected consumers and recorded evidence. Historical implemented_unvalidated/authored_not_run rows require their missing checks before dependent work. Final validation remains pending until Stage 15. If a shared contract changes, invalidate and rerun the affected prior focused evidence; don't blindly trust an old green row.

## Cross-stage hardening coverage

For H1–H9 and each H/SEQ ID record: stage owner, implemented symbols, debug fields, save/cleanup owner, focused command/result, final command/result, source/config/fixture digest, and unresolved causes. Claim scope, useful-progress predicate and deadline must be explicit. Use packet 09's stage table and packet 10's cases; do not mark coverage from a trace label alone.

- [ ] H1 measured progress and non-resettable causal recovery
- [ ] H2 reservation dependencies, atomic grants and cycle recovery
- [ ] H3 authoritative reconciliation, pending backlog and epoch fencing
- [ ] H4 fair lane service and bounded emergency preemption
- [ ] H5 useful sustainable economy, spawn/capacity and exposure
- [ ] H6 complete repeated offensive missions and safe reinforcement
- [ ] H7 fair observations, query isolation and actual access clearance
- [ ] H8 transport handoff and measured fortification value
- [ ] H9 technical fault isolation, saved debt and next-match cleanup
- [ ] H-01–32 fault/progress cases and SEQ-01–08 continuous matches

## Final verification ledger

The classic-RTS/difficulty/debug review adds mandatory [C/D](11-classic-rts-and-difficulty.md) and [DBG](12-debug-workbench.md) ownership. For each ID use the same symbol, persistence, focused/final evidence fields as H/SEQ. The 121-case catalog and [interactive overview](overview.html) are authored requirements/explanation, not implemented or passing AI tests.

- [ ] C-01–06 opening/timing/army demand/scout evidence/pursuit/opponent focus
- [ ] D-01–06 fair distinct difficulty, persistence, safety and paired calibration
- [ ] DBG-01–06 why-not, capture/replay/step/diff, privacy and bounded lifecycle

- [ ] Every deterministic strategic scenario ID and positive/negative variant: authored, exercised, semantic and replay assertions, real-runtime counterpart or explicit future-capability status
- [ ] Legitimate duplicate production/deposits/units, advance throughput planning and suppression only after fulfilled demand
- [ ] Pure decision/serialization tests and full gameplay library target
- [ ] Command/server authorization, replay/application, schema migration
- [ ] Real simulation scenarios: macro, combat, farming/support, transport, fortification, modes
- [ ] Debug projection/panel/overlay correctness and UI-on/off determinism
- [ ] Save/load, reconnect, host migration, pause/speed and render-rate variation
- [ ] Seed/map/faction/difficulty/archetype matrix versus pinned baseline
- [ ] Formatting, lint, type checking, builds, assets/editor/repository checks
- [ ] Browser and human-facing match/score/debug workflows
- [ ] Formal code review, omission audit, fixes and reruns
- [ ] Durable documentation and applicable repository skill learnings
- [ ] Final closure audit, remote SHA/PR verification
