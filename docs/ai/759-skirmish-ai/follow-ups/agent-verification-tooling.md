# Agent verification and execution tooling — #824

## Outcome

The remaining skirmish-AI work starts from a small generated context, runs through cohesive deterministic commands, and
returns compact causal evidence. Repeated repository discovery, portal startup, log reading, and manual coverage
accounting are removed from ordinary issue work without weakening the final Playwright gate.

Recommended agent: `gpt-5.6-terra`, high effort. Ask before using `gpt-5.6-sol` for a bounded investigation only after a
reproducible runner, lifecycle, or CI failure remains unexplained. Reserve `gpt-6-astra` for an exceptional unresolved
cross-system design problem, then return to Terra for implementation.

## Dependency and start rule

This is the first unfinished #759 subissue. Complete it before expanding #815–#823 unless the user explicitly changes
the order or this issue records a genuine blocker. It may reorganize tooling but must not change AI balance or scenario
oracles merely to make execution easier.

## Cold start

Read only:

1. `docs/ai/759-skirmish-ai/HANDOFF.md`
2. `package.json` AI scripts and `tools/ai/run-skirmish-matrix.mjs`
3. `tools/ai/summarize-skirmish-report.mjs` and its test
4. `apps/portal-e2e/playwright.config.ts` and `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts`
5. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/runtime-e2e.md`
6. `.github/workflows/pull-request-checks.yml` only when proving the CI-facing contract

Use `tools/ai/fixtures/skirmish-v1.json` as the scenario authority. Do not create a second registry or duplicate coverage
table. Preserve the one-Playwright-process-per-worker rule; independent clean workers may execute separate shards.

## Command responsibilities

- `ai:doctor`: validate dependencies, ports, browser availability, manifest/recipe integrity, server health, and source
  structure risks for the selected issue before expensive work starts.
- `ai:context --issue <number>`: emit a bounded current-state packet with provenance, relevant source anchors, dependency
  state, coverage counts, structural blockers, last evidence, and exact next commands.
- `ai:scenario`: run one scenario/variant through the requested pure or runtime layer and print the exact replay command.
- `ai:verify --changed`: select focused unit/tooling/runtime families from changed ownership without claiming final proof.
- `ai:verify --required`: fail closed across every supported required row for the exact merge-candidate revision and emit
  CI-shard-ready results.
- `ai:triage`: reduce a report to the first causal disagreement, responsible subsystem, intent/blocker, provenance,
  compact state/observation diff, retained artifact locations, and exact replay command.

Equivalent cohesive names are acceptable only when one documented entrypoint exposes these responsibilities and old
scripts remain compatible or receive an explicit migration.

## Implementation order

1. Define typed command/result contracts and one manifest-derived selection path. Missing rows, empty selection, invalid
   provenance, and unsupported required work fail closed.
2. Implement doctor/context output with stable ordering and strict size bounds. Derive facts from source and Git; never
   copy mutable counts into another hand-maintained authority.
3. Unify single-scenario, changed-scope, and required execution over the existing matrix runner and runtime request.
4. Reuse one healthy portal server and browser lifecycle across compatible runtime work. Prove cleanup, port ownership,
   failure recovery, and deterministic isolation between scenarios.
5. Implement causal triage and machine-readable summaries. Keep full traces as artifacts rather than terminal output.
6. Add CI-ready shard output and tests for empty work, stale provenance, failed startup, interrupted cleanup, report
   corruption, first-failure selection, and exact replay.
7. Update testing/operator docs and repo skills only with the final proven command names and behavior.

## Structural preflight

Before a behavior issue edits code, doctor/context identifies implicated content-hash-baselined files and likely size,
function-length, column, or multi-declaration failures. If cleanup is mechanical and necessary, execute a bounded #821
slice first with `gpt-5.6-terra`, medium effort, in a separate commit. Do not mix behavior changes into that cleanup and
never regenerate the baseline merely to pass lint.

## Verification

- Tool unit tests cover selection, health checks, lifecycle cleanup, provenance, formatting, and negative paths.
- One focused pure scenario and one focused runtime scenario prove the unified entrypoint.
- A changed-scope dry run explains its selection; a required dry run accounts for every supported required manifest row.
- Existing stable AI commands remain compatible until documented consumers and CI migrate.
- Skill validation, source-index checks, affected lint, and the portal development build pass.

## Completion

- The five command responsibilities are implemented, tested, documented, and cheap to invoke from a cold task.
- The handoff progress grid and generic `continue implementing` route use the generated context and tooling gate.
- CI can consume fail-closed shard output without manual scenario lists.
- Run omission and final closure audits, update current evidence, commit only owned files, push, verify the remote SHA,
  update #824, and report the refreshed grid plus the next model/effort recommendation.
