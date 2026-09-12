# Repository-wide agent efficiency and verification tooling — #824

## Outcome

Repository work starts from a measured, bounded context and uses cohesive project-aware commands for environment checks,
affected verification, failure triage, cache/runtime reuse, and compact evidence. Skirmish AI is the first domain adapter,
not the architecture of the generic tooling. The measurements form a closed improvement loop: agents inspect them,
improve the owning tools/skills/docs, and rerun the same benchmark before retaining an optimization.

Recommended agent: `gpt-5.6-terra`, high effort. Ask before using `gpt-5.6-sol` for a bounded investigation only after a
reproducible runner, lifecycle, or CI failure remains unexplained. Reserve `gpt-6-astra` for an exceptional unresolved
cross-system design problem, then return to Terra for implementation.

Estimated effort: **XXL**, about 5–9 focused agent sessions or 4–8 engineering days, including before/after measurement
and the skirmish-AI adapter.

## Dependency and start rule

This is the first unfinished #759 subissue and a repository-wide tooling investment sponsored by that roadmap. Complete
it before expanding the remaining core issues unless the user explicitly changes the order or this issue records a
genuine blocker. It may reorganize tooling but must not change product behavior or weaken evidence merely to run faster.

## Cold start

Read only:

1. `docs/ai/759-skirmish-ai/HANDOFF.md`
2. root `package.json`, `nx.json`, affected project definitions, and repo workflow verification/source-index references
3. `tools/skills/check-index.mjs`, source-structure tooling, and existing repository validation scripts as examples
4. `tools/ai/run-skirmish-matrix.mjs`, `summarize-skirmish-report.mjs`, and their tests for the first adapter
5. `apps/portal-e2e/playwright.config.ts` and `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts`
6. `.github/workflows/pull-request-checks.yml` only when proving the generic and AI CI-facing contracts

Keep generic implementation under a responsibility-based `tools/agent/` boundary with domain adapters rather than AI
assumptions in the core. Use Nx/project configuration and existing source indexes as authorities; use
`tools/ai/fixtures/skirmish-v1.json` only inside the AI adapter. Preserve one Playwright process per worker.

## First step: efficiency baseline

Before designing commands, measure representative current workflows: a small TypeScript change, cross-project change,
docs/skill update, unfamiliar source discovery, focused test repair, and skirmish runtime scenario. Record:

- wall time, command/process/server/browser starts, selected projects/tests, cache hits/misses, output lines/bytes, retained
  artifact size, and context files/bytes selected;
- exact input/cached/reasoning/output/total tokens only when stable task/API telemetry is actually available;
- otherwise clearly named proxies such as context bytes, duplicate reads, command output size, and tool-call count—never
  estimated values presented as token telemetry.

Store noisy run reports in ignored `tmp/agent-efficiency/`. Commit only a small versioned benchmark definition and stable
before/after summary when it remains useful. Define quality invariants first: the optimized path must select the same
required evidence, fail closed, retain provenance, and surface the same seeded failure.

The agent must turn each baseline into a short, evidence-ranked bottleneck list, select one bounded improvement, update
the responsible generic script/tool/skill/documentation, and rerun the affected benchmark. Retain the change only when
the result improves or deliberately trades one measured cost for another without violating a quality invariant. Do not
auto-edit from raw metrics, tune from one noisy run, weaken checks, hide failures, or encode feature-specific anecdotes in
global skills. Promote only repeated, demonstrated workflow lessons into skills.

## Repository command responsibilities

- `agent:doctor`: validate repository/runtime prerequisites, Git ownership, ports, tool availability, indexes, project
  graph, source-structure risks, and configured adapters before expensive work.
- `agent:context --issue <number>`: emit a bounded, stable current-state packet with provenance, source routes,
  dependencies, changed ownership, structural blockers, last evidence, and exact next commands.
- `agent:verify --changed|--required`: use the project graph and adapter contracts to select focused implementation checks
  or fail-closed delivery checks without conflating the two evidence levels. Selection is dry by default; `--execute` is
  explicit and retains every stdout/stderr stream plus a structured report under ignored `tmp/agent-verification/`.
  Required delivery policy accepts only `develop` or `main`; use `--base <diff-base>` independently from
  `--target-branch <develop|main>`.
- `agent:triage --report <path>`: reduce a retained report to the first actionable cause, provenance, retained artifacts,
  and exact replay command without rerunning it. It rejects corrupted, escaping, or internally inconsistent reports.
- `agent:metrics`: compare benchmark runs for time, cache/runtime reuse, context/output volume, and exact token fields only
  when supplied by supported telemetry; emit evidence-linked bottlenecks and candidate owners for the next improvement.
- AI adapter: preserve `ai:scenario`, manifest coverage, seeded replay, compact intent/state differences, and required
  runtime shards by composing the generic commands rather than forking their behavior.

Equivalent cohesive names are acceptable only when one documented entrypoint exposes these responsibilities. Existing
scripts remain compatible or receive an explicit migration; generic tools must not import gameplay-specific modules.

## Implementation order

1. Capture the versioned benchmark definition and current baseline with the quality invariants above.
2. Review that baseline, record evidence-ranked waste and its likely owner, and choose the first bounded improvement.
3. Define small generic command/adapter/result contracts and deterministic output budgets. Missing configured work, empty
   required selection, invalid provenance, and unknown adapter results fail closed.
4. Implement doctor/context over Git, Nx project ownership, source indexes, structural lint, and adapter metadata. Derive
   mutable facts rather than copying them into another authority.
5. Implement changed/required verification, triage, metrics, log retention, cache reporting, and safe persistent-process
   lifecycle as separable generic owners.
6. Adapt the skirmish matrix, one-scenario replay, manifest statuses, portal/browser reuse, and CI shards. Explicit optional
   `deferred_content` remains visible with an owner, never counts as passed, and does not block the supported core gate.
7. Add negative tests for empty work, stale provenance, cache-key/source changes, failed startup, interrupted cleanup,
   corrupted reports, output truncation, first-cause selection, and replay stability.
8. Repeat the representative benchmark after each coherent optimization batch. Keep evidence-backed improvements, revert
   ineffective complexity, and report tradeoffs without relaxing quality or selecting less required evidence.
9. Update repository operator docs and skills only with proven command names, extension contracts, budgets, and repeated
   general lessons; keep run-specific observations in metrics artifacts rather than permanent instructions.

## Structural preflight

Before a behavior issue edits code, generic doctor/context identifies implicated content-hash-baselined files and likely size,
function-length, column, or multi-declaration failures. If cleanup is mechanical and necessary, execute a bounded #821
slice first with `gpt-5.6-terra`, medium effort, in a separate commit. Do not mix behavior changes into that cleanup and
never regenerate the baseline merely to pass lint.

## Verification

- Generic tool unit tests cover project/adapter selection, health checks, lifecycle cleanup, provenance, metrics, output
  budgets, formatting, and negative paths.
- Representative non-AI workflows plus one focused pure and runtime AI scenario prove the shared core and adapter boundary.
- A changed-scope dry run explains its selection; required dry runs account for configured project checks and every
  supported required AI manifest row.
- Existing stable AI commands remain compatible until documented consumers and CI migrate.
- Before/after metrics demonstrate reduced repeated context/process/output cost without losing required checks.
- Skill validation, source-index checks, affected lint, tool tests, and representative builds pass at the final boundary.

## Completion

- Generic doctor/context/verify/triage/metrics responsibilities are implemented, tested, documented, and cheap to invoke
  from a cold task; at least one non-AI path proves they are repository-wide.
- The AI scenario/matrix adapter composes the generic contracts without weakening current evidence.
- At least one measured review -> tool/skill/doc improvement -> remeasurement cycle is proven on a non-AI workflow, and
  its result identifies the next highest-value bottleneck without automatically mutating the repository.
- The handoff progress grid and generic `continue implementing` route use the generated context and tooling gate.
- CI can consume fail-closed shard output without manual scenario lists.
- Run omission and final closure audits, update current evidence, commit only owned files, push, verify the remote SHA,
  update #824, and report the refreshed grid plus the next model/effort recommendation.
