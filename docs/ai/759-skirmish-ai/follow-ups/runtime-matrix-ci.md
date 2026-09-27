# Playwright runtime matrix and CI — #816

## Outcome

All supported runtime-required scenarios launch a real lobby-created Phaser match, observe authoritative effects, and run
as fail-closed required pre-merge shards with useful retained artifacts.

Recommended agent: `gpt-5.6-sol`, high effort for the first runtime runner, CI-shard, and authoritative-outcome contract.
Hand proven family recipes and repeatable repairs to `gpt-5.6-terra`, medium effort. Reserve Astra for an unresolved
runner/authority architecture question after compact Sol evidence.

Estimated effort: **XXL**, about 10–20 focused agent sessions or 8–15 engineering days at the current unmapped count.

Dependency: complete #824 first and consume its verified orchestration, context, triage, and server-reuse contracts. Do
not build duplicate command wrappers in this issue. Finish the current SEQ causal repair, then use #826's authoritative
preset-world fixtures before scaling the remaining focused runtime families; retain full natural matches where required.

## Cold start

Read only:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/runtime-e2e.md`
   and its linked generated scenario catalog and frozen test-map contract
2. `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts`
3. `tools/ai/run-skirmish-matrix.mjs` and the selected manifest rows/runtime recipe
4. the first failing authority path named by the compact report
5. `.github/workflows/pull-request-checks.yml` and `develop-ci.yml` only when wiring CI

Read the generated catalog for the current registered/required counts; it does not claim passing evidence. The runtime
spec is parameterized; running its IDE gutter entry without `AI_SKIRMISH_RUNTIME_REQUEST` is not scenario evidence.

## Implementation order

0. **Tooling prerequisite, before mass fixture work:** use the existing bounded agent context/report commands when
   execution is authorized, not a second context system. The new read-only
   `pnpm ai:skirmish:catalog -- --inventory` groups registered recipes and flags repeated, long and mixed cases;
   its implementation is authored but its unit test is deferred to the final gate. Extend the existing catalog
   generator/fixture validator with typed execution-kind, variant-role and deadline-rationale metadata before editing
   dozens of recipes. Add optional stop-on-evidence to the existing runtime driver before long-case conversion.
   Do not build a parallel runner, hand-maintained 121-row sheet, or another broad repository index.
1. **Sol/high boundary:** establish the runner-to-Playwright-to-authoritative-outcome contract by inspecting the
   first land sequence, the selected manifest/fixture and current evaluator. Author a compact reproduction and
   fail-closed selector rule; retain the final-gate execution boundary rather than claiming proof now.
2. **Terra/medium delivery:** finish the land-sequence fixture/contract slice before broadening the matrix. Defer
   the runtime rerun until the user-authorized final gate.
3. Convert one compatible family at a time to an authored recipe with finite checkpoints, deterministic perturbations,
   authoritative assertions, and bounded deadlines.
   Prefer #826's preset-world mode when unrelated opening/map prerequisites do not belong to the behavior under test.
   Audit current variant counts and tick budgets first: aim for one run per positive/control branch and 200–2,000 ticks
   for focused cases, with measured exceptions. Keep explicit determinism assertions at two or more identical starts;
   update the evaluator contract with fixture repetition changes. Full-match victories remain separate, finite and
   allowed to run longer when terminal behavior requires it. See the code-adjacent runtime E2E policy.
   Split the current mixed `tools/ai/fixtures/stage-15-land-loop-runtime.json`: keep natural SEQ match recipes in a
   continuous-match file, and give production/replacement behavior its own focused files with legal preset actors,
   balances, queues and scheduled loss where needed. Group a positive/control pair together; do not create one file
   per ID or share a 12,000-tick natural match merely because several IDs mention production.
   Keep `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts` generic; put family-specific setup/evaluation in focused
   adjacent modules. Update manifest paths and every loader/catalog consumer for any nested fixture directories.
4. Diagnose the earliest disagreement in this order: observation, demand/mission, intent/claim, shared application,
   outcome, cleanup. Batch related authored repairs; run focused Jest and one grouped browser rerun only at the
   deferred final validation gate.
5. Author frozen test maps incrementally per the code-adjacent test-map contract: open economy first, bridge when
   route/combat/continuous cases need it, and fortified when wall cases need it. Do not block one map's cases on the
   next map. Migrate deterministic browser recipes per map. Keep mutable shipped-map playtests as separate
   compatibility evidence, not the stable CI oracle. Cover both factions and
   representative sides/seeds; consume the domain/transport contracts. Island-only variants remain visible
   `deferred_content` under optional #822; never claim them or synthetic flying-container coverage without registered
   capabilities.
6. First record each row as supported or explicitly deferred with its owner. Then derive isolated CI shards by stable
   manifest family from that status; do not copy scenario IDs into workflow YAML. Fail the selector when a supported
   runtime-required row has no recipe, no shard, or no runnable command. A clean worker may run one Phaser/Playwright
   process at a time; separate workers may run shards concurrently.
7. Publish compact JSON for every shard and retain trace/repro, browser logs, screenshots/video on failure.
8. Extend `tools/ai/generate-skirmish-test-catalog.mjs` to derive execution kind, preset starting-state summary,
   positive/control counts, map, deadline and focused-over-budget rationale from recipe data. Add parser/renderer
   fixtures for missing setup, paired variants, long focused exceptions and continuous matches. Add validated
   execution-kind/variant-role metadata and an over-budget reason to recipes; derive the actor/resource/queue/event
   summary from `presetWorld` instead of copying it. Split the generator by stable responsibility before it exceeds
   the repository's source-size limits; never maintain a second manual scenario table.
9. Stop-on-evidence must use settled checkpoints and independent authoritative outcome predicates. A positive case
   may end once all selected assertions and required events are complete; negative controls and temporal/terminal
   oracles run through their required horizon. Retain the actual stop tick and reason in reports. Author tests for
   early success, pending event, negative control, missing effect and mandatory terminal result before execution.

## Evidence

```bash
pnpm ai:skirmish:opening
pnpm ai:skirmish:production
pnpm ai:skirmish:land-sequences
pnpm ai:skirmish:report -- --failures-only --details
```

Every report records candidate SHA, dirty digest, manifest/fixture digest, seed, faction, side, profile, tick/decision
counts, and first failed predicate. Missing rows, zero work, provenance mismatch, non-finite metrics, or absent mandatory
terminal results fail the shard.

## Completion

- Every supported runtime-required row has real Playwright evidence.
- Required PR/merge-queue shards run from clean sources and retain artifacts.
- CI shard output is derived from the manifest support status, assigns every supported runtime-required row exactly once,
  and fails closed for missing/unrunnable assignments rather than reducing the required denominator.
- Optional island-content rows remain explicit, visible, non-passing, and outside the supported core gate.
- Focused recipes have bounded, justified tick budgets and no redundant PR repetitions; explicit determinism rows
  still compare at least two runs. Continuous-match rows retain a terminal oracle and evidence-based deadline.
- Each focused browser row has a declared legal preset starting state, or a documented natural-opening exception.
  The generated catalog makes that state, execution kind and deadline visible without duplicating fixture data.
- Focused positive cases can stop on proven outcomes; controls, liveness windows and continuous matches cannot
  silently exit early. The result records actual ticks and why execution stopped.
- Focused/continuous recipes and evaluator modules have stable responsibility names; new/rewritten TS/JS/MJS files
  respect 400 non-comment lines per file, 200 per method and 140 columns per line; hand-maintained JSON is also wrapped
  at 140 columns. No blanket baseline refresh.
- Run omission/final closure audits, update coverage counts and operator docs, commit, push, and close #816.
