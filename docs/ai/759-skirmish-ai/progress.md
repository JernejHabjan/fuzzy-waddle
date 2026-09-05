# #759 implementation progress

This file records implementation, not completion of research. Update after every stage/interrupt. Do not check acceptance merely because code was authored.

Documentation review, 2026-09-05: added classic-RTS comparison, integrated C/D/DBG requirements and offline overview. Documentation smoke passed with `AI_OVERVIEW_BROWSER=/usr/bin/google-chrome node docs/ai/759-skirmish-ai/overview.smoke.mjs`: 30 scenario/stage combinations, three keyboard-operated profiles, capacity boundaries, three viewport widths, offline fallback, local links and 121 unique scenario IDs. Desktop/mobile screenshots were visually reviewed; a clipped mobile map label was fixed and the smoke rerun. This is page/specification evidence only; every runtime stage below remains not started.

- Integration branch/worktree: `feature/759-skirmish-ai` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`
- Base develop SHA: `de47f482889db30420692bf4406fba463d7db296`
- Research source SHA: `1465f5a8943f19e79041dd9a5355958f214d38f4`; carried only #759 docs, reusable skills/index checks, and the matching `AGENTS.md` routes onto the integration branch
- Stage 0 PR #792 state/SHA/integration method: open PR #792, source `17789141366e197f388e5ac5ed5cbb64882858e0`; cherry-picked with `-x` as `c57023f2bb0b99e79847bde7bcbb898bc6bab299`, without merging or modifying #792
- Baseline source SHA / fixture manifest version: `de47f482889db30420692bf4406fba463d7db296` / not yet applicable (Stage 5 owns the manifest)
- Current stage and exact next action: Stage 1; trace and correct the listed static AI paths after Stage 0 publication is verified
- Execution policy: one stage per user request; acceptance audit, focused checks/repairs, Omission and Final Closure audits, commit, push/remote verification, then stop. Extensive integrated release validation stays Stage 15. This supersedes automatic continuation.
- Current actual model/effort: host model/effort metadata was not exposed to this task; Stage 0 recommendation is Terra / high
- Last task-owned commit: `c57023f2bb0b99e79847bde7bcbb898bc6bab299` (Stage 0 prerequisite; closure evidence is committed next)
- Known integration defects / external blockers: none established; research findings are not yet fixed

| Stage | Implementation | Focused gate | Final validation | Commit / paths / next action |
| --- | --- | --- | --- | --- |
| 0 | stage_checked | passed | deferred_to_15 | `c57023f2` plus the pending Stage 0 evidence/docs closure commit; next: Stage 1 after remote verification |
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

## Per-stage closure and next-agent handoff

Use the [stage-delivery skill](../../../plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-stage-delivery/SKILL.md). Before the closure commit, append the current stage's acceptance ID -> implemented symbols/consumers -> actual evidence -> status, including owning H/C/D/DBG cases. Record separate Omission and Final Closure audit findings/repairs, exact checks and tested source/diff provenance, actual model/effort, and any final-only deferred evidence.

Record branch, next stage/substep, recommended model/effort from the runbook, blockers and a copyable one-stage prompt. Report final commit and verified remote SHA in the handoff; the next agent verifies the commit containing this ledger. A checked-but-unpushed stage is a publication blocker, not permission to begin the next stage. No self-referential commit SHA is required in its own file.

Documentation/skill maintenance, 2026-09-05: canonical Phaser skill/source routes and reusable stage closure added. No runtime stage is implemented by this maintenance.

## Stage 0 closure — deterministic planner prerequisite

- **Acceptance / implementation:** Reused #792's reviewed fix through `c57023f2`: `filterReachableBuildSpots` waits for every path result before removing unreachable/empty-path candidates; `compareScoredBuildSpots` establishes descending-score then logical-coordinate ordering; `BasePlanner` and `MapAnalyzer` both consume that authority. The change is limited to the prerequisite and its regression coverage—no planner redesign was added.
- **Consumers and provenance:** `BasePlanner.refineAccessibility` now receives a resolved reachable set before assigning `candidateSpots`; `BasePlanner.chooseBuildSite` and `MapAnalyzer.getSuggestedBuildTiles` share the deterministic comparator. The exact upstream source is #792 / `17789141366e197f388e5ac5ed5cbb64882858e0`, cherry-picked with `-x`; baseline predates behavior changes at `de47f482889db30420692bf4406fba463d7db296`.
- **Focused gate:** on candidate source `c57023f2bb0b99e79847bde7bcbb898bc6bab299`, Node `v24.18.0`, pnpm `11.14.0`: `pnpm exec nx test probable-waffle-phaser --runInBand --testPathPatterns='base-planner-selection.spec.ts|world-state-snapshot-manager.spec.ts' --verbose` passed 2 suites / 5 tests. This proves async reachability exclusion and permutation-stable ties; the visibility/ID ordering regression changed by #792 also passed. An earlier `--testPathPattern` invocation performed package bootstrap without a Jest summary and is deliberately not claimed as gate evidence.
- **Omission Audit:** Verified all six #792 files are represented in the cherry-pick; exact call sites use the shared helper; blocked and empty paths are excluded; equal scores have stable x/y tie-breakers; tests exercise both forward and reversed candidate insertion. No duplicate implementation, unrelated runtime mutation, or missing prerequisite behavior found.
- **Final Closure Audit:** Rechecked Stage 0 text against the staged diff and test output. The prerequisite matches #792, carries traceable provenance, pins a pre-change baseline, and has its narrow gate. Full-project lint/build, runtime matches, broad AI scenarios, and baseline comparison remain intentionally deferred to their owning stages/Stage 15.
- **Publication:** this evidence entry is committed/pushed in the Stage 0 closure commit immediately following the prerequisite cherry-pick; its exact remote SHA is recorded in the user handoff rather than self-referentially here.

Maintenance checks: all six skills passed the bundled skill schema validator; `node tools/skills/check-index.mjs` resolved six skills, nine reference links, 45 indexed source routes and four project definitions; `node --test tools/skills/check-index.test.mjs` passed both regressions (missing/escaping paths, target/name drift). The offline overview smoke still passes. Stage-policy review covered successful closure, failed required check, rejected push, already-satisfied prerequisite and interrupted resume; these are instruction reviews, not executed AI matches. Runtime stages remain not_started.

Tooling follow-up, 2026-09-06: direct ESLint 9 invocation failed because this checkout has legacy .eslintrc.json rather than flat config; its root overrides do not cover standalone .mjs tools. The two new tools instead receive explicit `--no-config-lookup --no-ignore --global process --global console --rule 'no-unused-vars:error' --rule 'no-undef:error'` checks and Node syntax checks, plus their runtime regressions. This is focused tool coverage, not a passing repository-wide lint run. No lint configuration or game code was changed.

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
