# #759 skirmish AI handoff

This is the cold-start index for unfinished work from #759. Product architecture, testing, and debugging documentation
lives beside the AI controller. Detailed future implementation routes live in linked subissue plans rather than in this
file.

## Cold start

- Branch: `feature/759-skirmish-ai`
- Draft PR: [#814](https://github.com/JernejHabjan/fuzzy-waddle/pull/814), targeting `develop`
- Previous durable handoff anchor: `07ff67be6b08e8d8a40bd01eb0ad68ba7010069c`; always verify the current remote tip
- Pinned pre-change baseline: `de47f482889db30420692bf4406fba463d7db296`
- Manifest: `tools/ai/fixtures/skirmish-v1.json`, 121 named scenarios before variants
- Follow-up index: [subissue implementation plans](follow-ups/README.md)
- Unrelated local file: `.run/start_portal.run.xml`; do not stage it with AI work

## Continue implementing protocol

When the user says `continue implementing` on draft PR #814 without naming a subissue:

1. Verify the branch/remote SHA, PR and subissue state; recalculate mutable coverage rather than trusting this snapshot.
2. Start or resume #824. Do not expand the remaining core issues until its tooling and skill gate is complete unless the user explicitly
   changes the order or #824 records a genuine blocker.
3. After #824, resume an `in_progress` issue; otherwise select the first dependency-ready slice from the grid. Advance
   #815 pure fixtures and #816 runtime recipes by coherent behavior family so runtime feedback is not postponed until all
   pure mappings finish. Read only the selected plan, generated context packet, and named source anchors.
4. Work one issue boundary at a time. A sequential agent may commit directly to this integration branch. Parallel agents
   use isolated worktrees/branches and sub-PRs targeting `feature/759-skirmish-ai`; never share one writable worktree.
5. Batch coherent implementation and repairs. Use focused checks only when their result guides the next change; defer the
   broader required tests/lint/build to the stable issue boundary unless later changes invalidate them. Testing,
   calibration, and validation issues run their planned evidence as primary work.
6. Report the refreshed grid at every stop, followed by the recommended next model/effort and one sentence explaining
   why. A recommendation never changes the active model automatically.

Default to `gpt-5.6-terra` at the plan's stated effort. Ask the user before a bounded Sol investigation only when compact,
reproducible evidence shows Terra is stuck on a cross-system cause. Ask for Astra exceptionally, for unresolved
architecture/authority problems after Sol-level investigation. Return to Terra for implementation once the cause is known.

If structural lint would block an issue, run the smallest behavior-neutral #821 cleanup slice first with Terra medium,
commit it separately, and then resume the issue. Never refresh the legacy source-structure baseline merely to pass lint.

## Progress grid

| Order             | Issue                                                           | State         | Dependency / next boundary                                    | Default model |
| ----------------- | --------------------------------------------------------------- | ------------- | ------------------------------------------------------------- | ------------- |
| 1                 | [#824](https://github.com/JernejHabjan/fuzzy-waddle/issues/824) | `in_progress` | Review baseline, improve, remeasure; prove tools + AI adapter | Terra high    |
| 2                 | [#825](https://github.com/JernejHabjan/fuzzy-waddle/issues/825) | `not_started` | After #824; current-content domain contracts                  | Terra high    |
| 3                 | [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | `not_started` | After #824; pair pure families with #816                      | Terra medium  |
| 3                 | [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | `not_started` | After #824; pair runtime families with #815                   | Terra high    |
| 4                 | [#818](https://github.com/JernejHabjan/fuzzy-waddle/issues/818) | `not_started` | After #824; semantic debug usability/parity                   | Terra medium  |
| 5                 | [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | `not_started` | After stable SEQ/runtime tooling                              | Terra high    |
| 6                 | [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | `not_started` | After runtime matrix infrastructure                           | Terra high    |
| 7                 | [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | `not_started` | After runtime tooling; MP portion uses #819                   | Terra high    |
| 8                 | [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | `not_started` | Last, after #816/#819/#823 parity                             | Terra high    |
| As needed / final | [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | `not_started` | Bounded slices early; final AI cleanup after behavior         | Terra medium  |

Update this grid only from GitHub state and current evidence. `Code authored` is not `validated`; use the state vocabulary
defined by the task-tracking and stage-delivery skills.

## Open work

| Issue                                                           | Responsibility                    | Current boundary                                                                       |
| --------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| [#824](https://github.com/JernejHabjan/fuzzy-waddle/issues/824) | Repository agent-efficiency tools | Before-baseline captured; review, improve tools/skills/docs, remeasure; add AI adapter |
| [#825](https://github.com/JernejHabjan/fuzzy-waddle/issues/825) | Domain and transport coverage     | Current-content pure/integration/runtime proof remains                                 |
| [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | Deterministic pure scenarios      | 40/111 pure-required rows mapped at closeout; recalculate first                        |
| [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | Playwright runtime matrix and CI  | 10/120 runtime-required rows mapped; no required CI shard yet                          |
| [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | Continuous play and difficulty    | SEQ rerun, isolated baseline, D-06, and soaks remain                                   |
| [#818](https://github.com/JernejHabjan/fuzzy-waddle/issues/818) | Strategic debugging               | First semantic summary exists; usability, split, and parity remain                     |
| [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | Real multiplayer AI E2E           | Current Playwright AI runtime is local skirmish, not socket lockstep                   |
| [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | Legacy controller retirement      | Remove fallback only after runtime/save/multiplayer parity                             |
| [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | Source structure and naming       | Main planner names migrated; persisted IDs and large-file debt remain                  |
| [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | Save/replay/reconnect lifecycle   | Cross-phase and repeated-match runtime evidence remains                                |

Each issue description links its cold-start plan. The plan records exact source anchors, dependency order, commands,
evidence requirements, model/effort guidance, and completion boundary.

Optional future enhancement: [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822) may add an island map and
island-specific runtime scenarios later. It is detached from #759 and does not block PR #814; #825 owns all work that can
be proven with current content.

## Reviewed execution shape and effort

The reviewer pass confirmed a measured repository-wide tooling-first gate, one AI manifest authority, family-paired pure/runtime coverage, separate
multiplayer and lifecycle proof, calibration after stable runtime, and legacy removal last. Estimates assume a stable
local/CI environment and one bounded agent session per coherent commit/evidence slice; they are ranges, not guarantees.

| Issue | Size     | Estimated agent-assisted engineering time | Main cost                                               |
| ----- | -------- | ----------------------------------------- | ------------------------------------------------------- |
| #824  | XXL      | 5–9 sessions / 4–8 days                   | Cost baseline, repo CLI/core, adapters, reuse, triage   |
| #825  | L        | 2–4 sessions / 1–3 days                   | Domain fixtures, integration, supported runtime split   |
| #815  | XL       | 6–12 sessions / 4–8 days                  | About 71 currently unmapped pure-required rows          |
| #816  | XXL      | 10–20 sessions / 8–15 days                | About 110 runtime mappings plus fail-closed CI shards   |
| #818  | M        | 2–4 sessions / 1–3 days                   | Debug presentation, lifecycle, runtime parity           |
| #817  | XL       | 4–8 sessions / 3–7 days plus soaks        | SEQ repair, isolated baseline, statistics, long runs    |
| #819  | XL       | 4–8 sessions / 3–7 days                   | Multi-client relay, authority, reconnect, host transfer |
| #823  | XL       | 4–8 sessions / 3–7 days                   | Save/replay/interruption/repeated-match matrix          |
| #821  | Variable | 1–6 sessions / 1–5 days                   | Only blocking or compatibility-safe structural batches  |
| #820  | L        | 2–4 sessions / 1–3 days                   | Parity audit and legacy removal after dependencies      |

Sequentially, core closure is roughly 4–8 weeks of agent-assisted engineering. Independent worktrees can reduce elapsed
time after #824, but the full runtime matrix, paired calibration, and soaks still set a real lower bound. Optional #822 is
roughly another 3–8 days once map requirements and assets exist.

## Plan artifact lifecycle

These handoff and follow-up files are temporary execution artifacts, not permanent product documentation. At each issue
closure, triage its plan line by line:

- move proven behavior, contracts, ownership, debugging, and testing instructions into typed code/tests, focused comments,
  or the code-adjacent AI architecture/testing/debugging docs;
- keep unresolved work only in an open GitHub issue and its bounded cold-start plan;
- replace the closed issue's plan link with durable evidence/docs, then remove the resolved plan and index entry when no
  active consumer needs them;
- leave historical sequencing in Git/PR history rather than product filenames or permanent docs.

At #759/PR #814 closure, update external backlinks and delete this handoff plus the follow-up directory after all retained
knowledge has an owning code/doc/test location. Product documentation must describe supported behavior, not preserve a
completed roadmap or TODO ledger.

## Current evidence

- ECO-08 passed both factions in a real Playwright runtime, including zero-worker bootstrap.
- PRO-01–07 passed as one real Playwright group: 1,442 decisions and 24,040 ticks.
- Latest SEQ-01/02 artifact ran 6,674 decisions and 120,079 ticks but failed terminal/recovery expectations.
- Repairs after that SEQ artifact stop static enemy buildings from creating false home-defense demand and allow terminal
  victory to satisfy post-raid recovery; focused manager tests passed, but Playwright has not rerun those repairs.
- A wider focused gameplay batch passed 7 suites / 82 tests; the portal development build passed.
- Closeout coverage was 10/120 runtime-required and 40/111 pure-required. These are mapped counts, not pass counts.
- The pinned-baseline adapter is metadata-only; isolated baseline execution and D-06 calibration are not implemented.
- Wrap-up migrated the main planner/manager filenames and implementation symbols to responsibility names, added the
  committed strategic intent summary, removed four optional AI IDE profiles, and established source-structure lint.
- Wrap-up focused evidence: gameplay planner/manager Jest 10 suites / 104 tests; Phaser controller/domain Jest 2 suites /
  5 tests; AI/tooling Node tests 9 tests; gameplay/Phaser/portal-E2E lint passed; portal development build passed.
- Source-structure baseline initially records 674 legacy source hashes. New files are strict; editing a baselined violating
  file invalidates its exemption.

Evidence is source-sensitive. Raw `tmp/` artifacts are ignored and may be absent later. Future CI must retain compact
provenance plus failure traces/logs/screenshots as artifacts.

## Stable test policy

- Pure deterministic fixtures repeat three times and compare decisions, state, and canonical hashes.
- Supported runtime-required rows execute through lobby-started Phaser/Playwright matches.
- Representative available maps use seeds 1–5, mirrored sides, and both factions where the scenario applies.
- Selected stress cases expand to seeds 1–20.
- Difficulty starts with 20 paired seeds and expands toward 100 only if uncertainty remains material.
- Release evidence includes at least three 60-minute-simulation soak matches.
- Missing fixtures/work, zero selected work, provenance mismatch, non-finite metrics, unsupported fallback, or missing
  required terminal results are failures.
- Run only one Phaser/Playwright process at a time on one worker; independent clean CI workers may run separate shards.

Stable commands:

```bash
node tools/agent/measure-workflows.mjs
pnpm ai:skirmish:opening
pnpm ai:skirmish:production
pnpm ai:skirmish:land-sequences
pnpm ai:skirmish:report -- --failures-only --details
pnpm ai:tools:test
```

The parameterized Playwright spec is not a complete scenario run without the matrix runner's runtime request.

## Known boundaries

- No island map ships today. #825 owns current-content topology/transport evidence. Island-only runtime variants remain
  visible as an optional `deferred_content` upgrade under #822 and do not block core readiness.
- No registered flying container currently provides shipping runtime evidence. Do not substitute a synthetic capability.
- The current browser runtime uses the shared command/application path but not a real multiplayer relay or peer lockstep.
- The controller still has a legacy behavior-tree fallback when player/faction identity cannot resolve. Normal configured
  skirmishes use the pure brain. #820 owns evidence-backed retirement.
- Schema `V1` remains appropriate for saves, wire data, fixture manifests, repro bundles, and reports. Ordinary manager
  and planner implementations should not carry version/stage names.
- Existing source-structure violations are content-hash baselined. New or changed violating files must be split or receive
  an explicit reviewed baseline decision linked to #821; never regenerate the baseline as a routine lint fix.

## Current #824 baseline

- Definition: `tools/agent/benchmarks/repository-workflows-v1.json`; stable before-result and measured review:
  `tools/agent/benchmarks/repository-workflows-baseline-v1.json` and
  `tools/agent/benchmarks/repository-workflows-review-v1.json`.
- The 2026-09-12 before-baseline ran six representative workflows against `417ef777b8426591326a91484edd481189bdf1b3`.
  It measured 112.69 seconds of command wall time, 194,757 selected context bytes, 2,438 output bytes, and one declared
  server/browser/worker start. These are execution proxies; stable model token telemetry was unavailable.
- `skirmish-runtime-scenario` consumed 101.17 seconds (89.78% of measured command wall time). The completed first
  improvement replaces the unavailable discovery provider with an indexed `rg --files` profile query: 11.86 ms, 3 lines,
  and 199 bytes. This restores required discovery; it is not presented as a speed comparison against an unavailable tool.
- Generic contracts now live in `tools/agent/command-contracts.mjs`: versioned command/adapter ownership, valid Git
  provenance, required configured selection, bounded output, and retained truncated evidence all fail closed. The stable
  narrow checks are `pnpm agent:tools:test` and `pnpm agent:measure`.
- `pnpm agent:doctor` and `pnpm agent:context -- --issue <number>` now derive Git provenance, pinned Node/pnpm/Nx
  compatibility, project ownership, source-index health, source-structure baseline risk, configured adapter metadata,
  and the one issue-plan header. Their outputs are bounded contract packets; full explicit packets only write when
  `--output` is supplied. Focused command evidence: #824 reports 26 Nx projects, two healthy indexes, two adapters, and
  674 content-hash-baselined legacy files.
- `pnpm agent:verify -- --changed [--base <branch>]` now uses the Nx affected graph for focused lint/test ownership.
  `pnpm agent:verify -- --required --base <diff-base> --target-branch <develop|main>` emits the CI-shaped version,
  lint/test/build selection and includes affected E2E plus PR version-bump coverage only for a `main` delivery target.
  Base comparison and delivery policy are separate; `origin/main` is not a delivery target. Selection remains dry unless
  `--execute` is explicit, which retains every command stream and a report under `tmp/agent-verification/`.
- `pnpm agent:triage -- --report <path>` reads a retained report without replaying it and prints only the first failing
  check, exact replay command, exit code, and stdout/stderr paths. Corrupted or escaping reports fail closed.
  It fails closed on unavailable Git/Nx provenance, unknown affected projects, empty changed ownership, or absent checks.
- Verification-selection focused evidence: `pnpm agent:tools:test` passed 23 Node tests; `pnpm agent:doctor`,
  `pnpm agent:context -- --issue 824`, and both `agent:verify` modes passed. A `main` delivery target selected version,
  lint, CI test, production build, and affected E2E without running them. Prettier, source-structure tests, and
  `git diff --check` passed for this slice.
- Next exact action: implement metrics, cache reporting, lifecycle ownership, and the skirmish adapter. Do not call the
  initial collector the completed `agent:metrics` contract; that broader command remains #824 work.

## Publication and closure

For every subissue:

1. Re-evaluate every acceptance item against real consumers and negative/recovery paths.
2. Run the focused checks named by its plan; do not claim one evidence layer proves another.
3. Perform an omission audit, repair gaps, then perform a separate final closure audit.
4. Update the issue/plan only with current evidence and proven reusable documentation learnings.
5. Commit only owned changes, push normally, verify the remote SHA, and stop at the issue boundary.

Delete this handoff after all supported core manifest rows are required and green in pre-merge CI, optional content rows
have explicit non-passing owners, calibration/soaks/human review are recorded, legacy and required naming migrations are
closed, retained knowledge is in owning code/docs/tests, and no source, skill, wiki, PR, or issue depends on this file.
