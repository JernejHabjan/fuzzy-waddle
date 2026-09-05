# #759 — start implementing the skirmish AI

Status: implementation-ready specification, no runtime stages completed by this documentation PR. This runbook is the execution entry point. The [research roadmap](../759-rts-ai-research-roadmap.md) retains evidence, design rationale, component coverage, and scenario requirements.

The [deterministic scenario packet](08-deterministic-scenarios.md) is mandatory alongside each owning stage. It translates the user's realistic strategic situations into positive/negative acceptance cases and independent outcome assertions. Useful duplicate buildings and units are expressly allowed; only accidental over-fulfillment and repeated side effects are suppressed.

## User-approved execution policy — one stage per handoff

The latest user instruction requires **one implementation stage per run: audit, check, commit, push, then stop**. This supersedes all earlier automatic-continuation prompts. The earlier approved hardening policy still applies: focused checks during Stages 0–14; extensive validation, release builds, broad playtesting and whole-solution review in Stage 15. Keep one integration branch; no intermediate merge is required.

- Implement only the selected/resumed stage. Use [stage delivery](../../../plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-stage-delivery/SKILL.md) to reconcile every requirement with evidence, perform separate Omission and Final Closure audits, update progress, commit task-owned work, push and verify the remote SHA, then stop. Report the next stage's recommended model/effort; wait for the user's next request. Keep the integration PR draft until Stage 15 finishes.
- Write tests with each feature. Run scoped lint/format, actual-source type checks, affected unit/contract regressions and the stage's small integration smoke before advancing. From Stage 5 use the real-runtime driver where relevant. Fix task-caused gate failures immediately. Read [the exact verification ladder](10-integration-and-adversarial-tests.md).
- Perform a focused code/consumer review at each stage. Reserve extensive whole-diff review, full production/repository builds, large seed/holdout/soak matrices, tuning, full debug/UI review and learning closure for Stage 15. Earlier targeted builds are allowed when required to prove changed packaging/generated integration.
- `stage_checked` means implemented, connected, documented and passing its recorded focused gate. It is **not** full release validation. `implemented_unvalidated` is a historical/partial state requiring missing focused checks before dependent work; do not silently skip it. `validated` requires final Stage 15 evidence.
- Every stage must implement its [hardening obligations](09-progress-and-hardening.md): real progress/deadlines, deadlock prevention, safe command uncertainty, lane service, useful economy/offense and lifecycle cleanup. The [strategic scenarios](08-deterministic-scenarios.md) plus [H/SEQ cases](10-integration-and-adversarial-tests.md) are mandatory acceptance, not future suggestions.
- Stage 15 reruns required checks over the final integrated revision, repairs findings in their owning modules, and publishes full evidence. Earlier green tests do not waive final reruns. Never disable runtime validators, omit required cases or loosen safety/progress assertions to finish.
- Stage 16 search/learning remains outside scope. Never merge or deploy automatically. Push task-owned commits and maintain the draft integration PR; don't disable CI.

## Start and continue algorithm

Also read [classic RTS strategy and difficulty](11-classic-rts-and-difficulty.md) and [debug workbench](12-debug-workbench.md) before Stage 2; these are mandatory extensions with explicit owning-stage cases, not optional research. Their C/D/DBG cases bring acceptance to 121 named cases before variants. The [interactive overview](overview.html) explains the intended result but is not executable AI or validation evidence.

1. Read repo `AGENTS.md` and applicable workflow/task-tracking/framework skills. Read this runbook, [shared decisions](01-shared-decisions.md), [hardening](09-progress-and-hardening.md), [verification ladder](10-integration-and-adversarial-tests.md), [debug](06-debug-panel.md), [scenario contract](08-deterministic-scenarios.md) and [progress](progress.md). Thereafter read the current stage plus its named cases/source sections. Broad external research is unnecessary.
2. Inspect current branch/status, origin/develop and #792 using read-only git/GitHub queries; preserve unrelated work. Record base/research/prerequisite/baseline SHAs and actual toolchain in progress.
3. Use the requested integration branch or create `feature/759-skirmish-ai` from current origin/develop in an isolated worktree. Don't implement on the research branch. Carry the reviewed #759 documentation plus its repo-local skill/index support if not yet on develop: `plugins/fuzzy-waddle-skills/skills/`, `tools/skills/`, and the corresponding AGENTS.md routing changes. Reconcile only these task-owned changes from PR #764 against newer develop guidance; do not replace the whole repository/router with an older research snapshot. Record the source SHA and carried paths. If the runbook is absent in the new checkout, read it from the verified research ref before importing the package.
4. Reconcile #792 on the integration branch: reuse the existing merged fix, or integrate its equivalent clean task-owned change without modifying/merging the other PR or waiting on it. Preserve provenance. Run the narrow Stage 0 prerequisite regression gate.
5. Pin baselineSourceSha before behavior changes. Stage 5 supplies baseline compatibility/manifest; comparative candidate/baseline batches remain Stage 15. Do not manufacture a candidate-derived baseline.
6. Resume the explicitly selected stage, otherwise the first stage not `stage_checked`/`validated`, or its exact interrupted step. If the preceding checked stage is unpublished, resolve that handoff first. Implement only the current stage's recipes and linked H/C/D/DBG obligations, tests and debug data; run its gate, repair failures, audit completeness, update progress, commit, push/verify, and end the turn. Do not start the next stage, switch models or create another task automatically.
7. Preserve stage/step, check results, changed contracts, test IDs, defects and next command before interruption. A resumed agent must not recreate completed work or treat old `authored_not_run` records as passed. Model/scheduler continuation is not guaranteed after a task actually stops.
8. Start Stage 15 on a subsequent user request once 0–14 are `stage_checked` and publication is verified. Run the core continuous-match gate first, then all full review/validation/tuning/closure obligations. Mark complete only with required evidence; otherwise leave precise failures and blockers.

Stop for missing authority/credentials, a required gate blocked by unavailable infrastructure, or a genuinely unresolved material choice not answered by the defaults. First exhaust safe local fixes and available test alternatives. Missing prefab capabilities produce explicit support limitations, not invented mechanics. Moved code calls for narrow symbol discovery, not another broad research phase.

On handoff, say which stage finished, which acceptance/check evidence passed, what remains deferred or blocked, the local/remote commit, and the next stage/model/effort. A failed push must be resolved before the next stage. On a later “continue,” consult progress and verify the previous publication before choosing the next incomplete stage; do not restart Stage 0 because the example prompt below names it.

The canonical framework skill is now [fuzzy-waddle-phaser](../../../plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-phaser/SKILL.md), with a compact runtime source index. The old phaser3 directory was renamed; read package.json for the current framework version. Use the repo workflow's source/test routes before broad searches. No general framework migration is authorized.

## Stage routing and model recommendations

These are engineering recommendations for the implementing coding agent, not models running inside the RTS. Official documentation describes [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) as balancing intelligence and cost, [Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol) for complex work, and [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) for cost-sensitive work. The listed `high`/`xhigh` efforts are supported by the currently exposed Codex host model metadata and public model docs (checked 2026-09-05). Stage-specific choices below are recommendations, not published performance guarantees. Model availability and quota can change.

| Stage | Deliverable | Model | Effort | Packet |
| --- | --- | --- | --- | --- |
| 0 | Integrate/reconcile planner prerequisite | `gpt-5.6-terra` | high | [Foundation](02-foundation.md#stage-0) |
| 1 | Static correctness and reason/trace envelope | `gpt-5.6-terra` | high | [Foundation](02-foundation.md#stage-1) |
| 2 | Pure contracts and capability coverage | `gpt-5.6-sol` | high | [Foundation](02-foundation.md#stage-2) |
| 3 | Shared commands, spell effects, persistence seams | `gpt-5.6-sol` | xhigh | [Foundation](02-foundation.md#stage-3) |
| 4 | Atomic observation, knowledge, diplomacy | `gpt-5.6-terra` | xhigh | [Foundation](02-foundation.md#stage-4) |
| 5 | Author harness, save/hash projections, baseline manifest | `gpt-5.6-sol` | high | [Foundation](02-foundation.md#stage-5) |
| 6 | Purpose, goal scoring, reservations, difficulty | `gpt-5.6-terra` | xhigh | [Foundation](02-foundation.md#stage-6) |
| 7 | Build orders, economy, production composition | `gpt-5.6-terra` | xhigh | [Macro and access](03-macro-and-access.md#stage-7) |
| 8 | Multi-domain routes and transport lifecycle | `gpt-5.6-sol` | high | [Macro and access](03-macro-and-access.md#stage-8) |
| 9 | Scouting, threats, basic squads, win/loss flow | `gpt-5.6-terra` | xhigh | [Macro and access](03-macro-and-access.md#stage-9) |
| 10 | Bases, placement, expansion | `gpt-5.6-terra` | high | [Environment](04-environment.md#stage-10) |
| 11 | Connected walls, stairs, towers, future gates | `gpt-5.6-sol` | high | [Environment](04-environment.md#stage-11) |
| 12 | Economy recovery and anti-blocking | `gpt-5.6-terra` | high | [Environment](04-environment.md#stage-12) |
| 13 | Tactical squads, support, spells, debug completion | `gpt-5.6-sol` | high | [Tactics](05-tactics-and-adaptation.md#stage-13) |
| 14 | Counters, research, archetypes, migration cleanup | `gpt-5.6-terra` | xhigh | [Tactics](05-tactics-and-adaptation.md#stage-14) |
| 15 | Full integration, code review, tests/builds, tuning, docs | `gpt-5.6-sol` | xhigh | [Final validation](07-final-validation.md) |

Start Stage 0 with **gpt-5.6-terra / high**. The table is the recommended owner for each complete stage, including its self-review and focused gate. Select the next model/effort in the app when starting that stage; no automatic switching or delegation is promised. If unavailable, report it and record the actual selected setting rather than claiming the recommendation was used. For a repeatedly unresolved cross-system issue, recommend Sol with the reproduction and attempts attached. Luna may assist mechanical fixture/docs work after contracts are fixed, but is not the recommended owner for these end-to-end stages.

## One-stage kickoff

```text
Implement Stage 0 only from docs/ai/759-skirmish-ai/00-start-here.md for #759.
Use its integration-branch/prerequisite policy and the stage-delivery skill.
Complete every stage requirement and linked case; run the authorized focused gate,
repair findings, perform Omission and Final Closure audits, and record acceptance evidence.
Commit and push task-owned changes, verify the remote SHA, then STOP.
Report the next stage, recommended model/effort and a copyable resume prompt.
Keep extensive full-solution validation in Stage 15. Preserve unrelated work; never merge.
```
