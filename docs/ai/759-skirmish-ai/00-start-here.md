# #759 — start implementing the skirmish AI

Status: implementation-ready specification, no runtime stages completed by this documentation PR. This runbook is the execution entry point. The [research roadmap](../759-rts-ai-research-roadmap.md) retains evidence, design rationale, component coverage, and scenario requirements.

The [deterministic scenario packet](08-deterministic-scenarios.md) is mandatory alongside each owning stage. It translates the user's realistic strategic situations into positive/negative acceptance cases and independent outcome assertions. Useful duplicate buildings and units are expressly allowed; only accidental over-fulfillment and repeated side effects are suppressed.

## User-approved execution policy

The user's 2026-09-05 request explicitly chooses sequential implementation with testing, builds, validation, and extensive code review deferred to the final stage. This policy supersedes earlier per-stage test/build/merge instructions in the research roadmap and repository skills **for this #759 implementation only**. It does not weaken the final acceptance criteria or alter repository-wide policy.

- Implement Stages 0–14 in sequence in one isolated integration branch, with task-owned commits at natural boundaries. Do not wait for an intermediate stage PR to merge. Keep the integration PR draft and unvalidated until Stage 15 finishes.
- Write regression tests, fixtures, harness code, and supporting docs alongside their owning feature. Mark them `authored_not_run`. Do not execute tests, builds, lint, type checks, formatting checks, benchmarks, browser playtests, or formal validation/review until Stage 15. Ordinary file inspection, git status/diff, and reading call sites remain necessary implementation work. Correct obvious errors encountered while authoring without claiming verification.
- `implemented_unvalidated` means the feature and consumers are written, its contracts are connected, debug fields are populated, fixtures exist, and handoff state is saved. It does not mean tests pass. Continue to the next stage using implemented dependencies. All “Acceptance,” “pass,” “gate,” “regression,” or “verify” requirements in stage/research documents are evidence to produce in Stage 15 unless they describe runtime command validation (which must always execute in the game).
- Stage 15 performs integration repairs, formal code review, exhaustive applicable verification, tuning, and learning/documentation closure. It may modify any earlier stage to repair findings and reruns affected checks. Never skip failing requirements, disable runtime validators, remove tests, or loosen assertions to finish.
- Stage 16 (search/learning) is outside this requested implementation. Do not automatically start it after Stage 15.
- Do not merge or deploy automatically. Push task-owned integration commits and keep the draft PR updated. Existing remote CI may run on pushes; do not disable or change CI to enforce the local deferred-execution policy. Record any CI output without claiming a local validation pass.

## Start and continue algorithm

1. Read repo `AGENTS.md` and the applicable repo workflow/task-tracking/framework skills. Read this file, [shared implementation decisions](01-shared-decisions.md), [debug contract](06-debug-panel.md), [scenario contract and owning-stage cases](08-deterministic-scenarios.md), and [progress](progress.md). Read only the current stage packet plus its referenced source sections thereafter. Broad external AI research is unnecessary.
2. Inspect status, current branch, and current `develop`/PR #792 using read-only git/GitHub queries. Preserve unrelated changes. Record the base SHA, research SHA, #792 head/merge state, and baseline SHA in `progress.md`.
3. Use the user-requested integration branch, or create `feature/759-skirmish-ai` from current `origin/develop` in an isolated worktree if none exists. Do not implement on the research branch. Carry this documentation package into the integration branch if it is not yet on develop; copy only its task-owned documentation via a reviewed patch, not unrelated research-branch runtime history.
4. Stage 0 reconciles #792. If merged, record the merge SHA and confirm the relevant code exists by reading it. If open, inspect the planner diff and integrate the equivalent exact fix into the integration branch (cherry-pick only clean, task-owned commits or apply a focused patch). Do not modify or merge the other PR, and do not block the entire sequence on its merge. Preserve its attribution/relationship in the integration PR. Tests are authored/inherited, not run yet.
5. Pin `baselineSourceSha` before behavior changes. It must identify the prior AI implementation, not the candidate. Store a versioned fixture/scenario manifest and baseline compatibility notes in Stage 5; run both baseline and candidate only in Stage 15.
6. Resume the first row not marked `implemented_unvalidated` or `validated`. Implement its ordered recipe and all component-audit obligations, add debug data and tests, record changed paths/contracts, unresolved defects, and next exact action, then commit only task-owned work. Continue automatically through the next stage without asking “continue?” or starting a new task.
7. At context/usage boundaries, persist `progress.md` before ending. A resumed agent follows the recorded stage/step and must not recreate completed work. Never claim that a model or scheduler will continue after the task has actually stopped. No background automation is required by this plan.
8. Enter Stage 15 only when 0–14 are implemented. Complete its review/validation/repair loop and docs/skills closure. Mark the whole plan complete only after every required gate has evidence; otherwise leave exact failures/blockers and the plan unfinished.

Stop only for missing authority/credentials or a genuinely unresolved product/architecture choice that cannot be answered from these defaults. Missing prefab capabilities produce explicit supported-map/faction limitations, not new mechanics or an invented tech tree. A local path that moved calls for narrow symbol discovery, not a new research project.

At the research checkout the framework skill file is `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-phaser3/SKILL.md`, although the router may name `fuzzy-waddle-phaser`. Use the present repo-local skill and current package/config versions; the historical skill name is not evidence that the current dependency is Phaser 3. No general framework migration is authorized by this plan.

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
Start implementing docs/ai/759-skirmish-ai/00-start-here.md for #759. Follow its sequential
Stages 0–15 and progress.md. Implement in one isolated integration branch with task-owned
commits, including all existing RTS mechanics and the full AI debug panel. Author tests and
fixtures with each stage, but defer test execution, builds, lint/type/format checks, runtime
playtests, formal code review, and extensive validation until Stage 15, as explicitly requested.
Continue between stages without reconfirmation. In Stage 15 repair all task-caused findings,
run the full applicable validation matrix, update affected docs/skills with proven learnings,
and push the completed implementation for review. Preserve unrelated work; never merge
automatically. Use the model/effort table as guidance and record actual settings and progress.
```
