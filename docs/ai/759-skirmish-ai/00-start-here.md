# #759 — start implementing the skirmish AI

Status: implementation-ready specification, no runtime stages completed by this documentation PR. This runbook is the execution entry point. The [research roadmap](../759-rts-ai-research-roadmap.md) retains evidence, design rationale, component coverage, and scenario requirements.

The [deterministic scenario packet](08-deterministic-scenarios.md) is mandatory alongside each owning stage. It translates the user's realistic strategic situations into positive/negative acceptance cases and independent outcome assertions. Useful duplicate buildings and units are expressly allowed; only accidental over-fulfillment and repeated side effects are suppressed.

## User-approved execution policy — hardened revision

The user's follow-up (“Do that … more hardening across whole plan”) accepts the review recommendations, including lightweight verification during implementation. This supersedes the earlier 2026-09-05 request to defer **every** check. Sequential implementation and one integration branch remain; extensive validation, release builds, broad playtesting and formal whole-solution review remain Stage 15.

- Implement Stages 0–14 sequentially with task-owned commits; do not wait for intermediate PR merges. Keep the integration PR draft and not release-validated until Stage 15 finishes.
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
3. Use the requested integration branch or create `feature/759-skirmish-ai` from current origin/develop in an isolated worktree. Don't implement on the research branch. Carry only this task-owned documentation package if not yet on develop.
4. Reconcile #792 on the integration branch: reuse the existing merged fix, or integrate its equivalent clean task-owned change without modifying/merging the other PR or waiting on it. Preserve provenance. Run the narrow Stage 0 prerequisite regression gate.
5. Pin baselineSourceSha before behavior changes. Stage 5 supplies baseline compatibility/manifest; comparative candidate/baseline batches remain Stage 15. Do not manufacture a candidate-derived baseline.
6. Resume the first stage not `stage_checked`/`validated`, or the exact interrupted step. Implement its connected recipes/H-obligations, tests and debug data; run its focused gate, fix failures, update progress and commit task-owned work. Continue without asking “continue?” or opening new tasks.
7. Preserve stage/step, check results, changed contracts, test IDs, defects and next command before interruption. A resumed agent must not recreate completed work or treat old `authored_not_run` records as passed. Model/scheduler continuation is not guaranteed after a task actually stops.
8. Enter Stage 15 once 0–14 are `stage_checked`. Run the core continuous-match gate first as directed there, then all full review/validation/tuning/closure obligations. Mark complete only when required evidence exists; otherwise leave precise failures and blockers.

Stop for missing authority/credentials, a required gate blocked by unavailable infrastructure, or a genuinely unresolved material choice not answered by the defaults. First exhaust safe local fixes and available test alternatives. Missing prefab capabilities produce explicit support limitations, not invented mechanics. Moved code calls for narrow symbol discovery, not another broad research phase.

At the research checkout the framework skill is `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-phaser3/SKILL.md`, although the router may name `fuzzy-waddle-phaser`. Use the present skill/current package versions; the historical skill name is not evidence of the current Phaser major. No general framework migration is authorized.

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

For a single uninterrupted task, use Terra `high`/`xhigh` as the cost-conscious default and keep working; the table does not mandate stopping to switch models. Use the app's supported model control when available, otherwise keep the selected capable model and record the actual model/effort. Do not claim automatic model switching, create tasks, or delegate solely because this table exists. Luna `high` is appropriate only for mechanical documentation/fixture data wiring after contracts are fixed; do not assign authority, transport, topology, or final review ownership to it. Escalate a repeatedly unresolved cross-system issue to Sol if available; preserve its exact reproduction and attempted fixes first.

## One-message kickoff

```text
Start implementing docs/ai/759-skirmish-ai/00-start-here.md for #759. Follow Stages 0–15,
the hardening contracts and progress ledger in one isolated integration branch. Include the
full AI debug panel, meaningful economy/offensive missions and every supported mechanic.
Write tests alongside each stage and run its focused lint/type/unit/integration smoke gate;
repair task-caused failures before advancing. This replaces the old all-checks-at-the-end rule.
Continue automatically between stages. Keep extensive whole-solution review, full builds,
broad scenario/holdout/soak validation, tuning and docs/skill learning closure in Stage 15.
Run the continuous-match and fault-injection cases as well as the strategic scenarios.
Preserve unrelated work, record actual model/effort and evidence, push for review, never merge.
```
