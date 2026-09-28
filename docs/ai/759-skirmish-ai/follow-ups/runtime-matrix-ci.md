# Playwright runtime matrix and CI — #816

## Outcome

All supported runtime-required scenarios launch a real lobby-created Phaser match, observe authoritative effects, and run
as fail-closed required pre-merge shards with useful retained artifacts.

Recommended agent: `gpt-5.6-sol`, high effort for the first runtime runner, CI-shard, and authoritative-outcome contract.
Hand proven family recipes and repeatable repairs to `gpt-5.6-terra`, medium effort. Reserve Astra for an unresolved
runner/authority architecture question after compact Sol evidence.

Estimated effort: **XXL risk envelope**, not 97 separate browser worlds: the current catalog has 97 supported runtime
rows without recipes, plus frozen maps, independent outcome oracles, CI wiring and final-gameplay repair. About 10–20
focused agent sessions is a provisional planning range, not a measured calendar estimate. Re-estimate after the first
frozen map and two representative behavior families using actual fixture reuse, run time and failure rate.

Dependency: #824 tooling and #826 preset-world support already exist. Consume their contracts. Pair #815 and #816
by behavior family; short fixture authoring can proceed while continuous-match victory remains unproven. A known
broken shared setup/API blocks its dependent cases, but a red full-match result is not a blanket authoring dependency.
The handoff's deferred execution policy applies to all commands below.

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

Use this batch order; the contract details below are acceptance requirements for these batches.

| Batch | Concrete output and dependency | Recommended agent |
| --- | --- | --- |
| Shared authoring contract | Extend existing fixture metadata, inventory and catalog; one short preset example and one continuous example | Sol/high |
| First usable family | Freeze open-economy map; author paired #815 pure and #816 runtime economy/production cases using existing setup services | Sol/high for new semantics, then Terra/medium for specified cases |
| Further families | Reuse helpers for combat/scouting/strategy; add bridge when needed, fortified map with wall cases; then recovery/debug | Same model across related cases while contract remains stable |
| Specialized adapters | #819 relay and #823 lifecycle contracts plus their cases; preserve their separate authority requirements | Sol/high, then bounded Terra delivery |
| Execution tooling | Finish early-stop and cross-report repair output before the broad validation sweep | Sol/high for oracle/provenance design, Terra/medium for specified plumbing |
| Deferred validation | Preflight, grouped sweep, cluster repairs, calibration/optimization/legacy retirement, then final evidence | Sol/high diagnosis; Terra for confirmed bounded repairs |

Metadata comes before mass authoring because it defines every recipe. Early-stop and failure clustering are needed
before execution, so they need not block independent fixture authoring. Implement each helper with its first real
consumer; avoid a general fixture framework or extra index. Keep required defaults explicit. Use the inventory to
select one bounded family batch, carry its exact IDs/files/assertions forward, and expand only when that contract is
clear. Stop for handoff at a coherent commit boundary, not after every scenario or model recommendation.

Read only the handoff's latest policy/current batch, selected requirement rows, fixture and named owning code. Retain
a short resume record with changed files, unresolved decisions, next IDs and unrun checks. Reuse this record after
compaction; do not reload the whole catalog/history. Compact context size is a proxy, not a promised token saving.

## Acceptance contracts

- **Tooling:** use the existing bounded agent context/report commands when
   execution is authorized, not a second context system. The new read-only
   `pnpm ai:skirmish:catalog -- --inventory` groups registered recipes and flags repeated, long and mixed cases;
   its implementation is authored but its unit test is deferred to the final gate. Extend the existing catalog
   generator/fixture validator with typed execution-kind, variant-role and deadline-rationale metadata before editing
   dozens of recipes. Add optional stop-on-evidence to the existing runtime driver before the broad execution sweep.
   Derive actor/resource/queue/event summaries from `presetWorld`; author metadata/catalog cases for missing setup,
   paired variants and justified long cases. Keep these in the existing bounded generator and adjacent helpers.
   Extend `tools/ai/summarize-skirmish-report.mjs` with a bounded repair-list mode for a selected collection of
   retained shard reports; the current summarizer handles one report and has no cross-scenario clusters. Reject
   mixed source revisions or incompatible workload provenance, and keep infrastructure failures distinct. Preserve
   exact report paths, scenario/variant IDs, seeds, failure codes and replay selection. Accept explicit artifact paths
   or one run directory; emit short text plus machine-readable cluster data, not raw checkpoint dumps. Cluster by
   normalized first failed predicate plus family/map and available checkpoint evidence; label clusters provisional
   until an agent confirms the shared causal owner. Add pure tool tests for grouping, distinct causes and provenance
   rejection.
   Different shards legitimately have different fixture-set digests: `skirmish-matrix-execution.mjs` hashes the
   selected fixture set. Require common candidate/dirty-source/manifest and run identity, plus an expected
   fixture identity-to-digest mapping per shard. Reject conflicting digests for the same fixture or unexpected
   membership; do not require every shard's aggregate fixture digest to be equal. Retain source maps and exact
   commands with each report. Add any missing provenance fields to the producer before relying on them in triage.
   Do not build a parallel runner, hand-maintained 121-row sheet, or another broad repository index.
- **Fixtures:** convert one compatible family at a time to a recipe with finite checkpoints, deterministic perturbations,
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
   Positive/control pairs use the same seed and starting world except the causal variable under test. Keep exact
   resources, faction roster and visibility legal; extend preset services only for state actually needed by a case.
   Give sustained/absence assertions an explicit observation window. Follow the frozen-map contract incrementally;
   optional island rows remain `deferred_content`, and mutable product maps are separate compatibility evidence.
- **CI selection:** record each row as supported or explicitly deferred with its owner. Derive isolated shards by stable
   manifest family from that status; do not copy scenario IDs into workflow YAML. Fail the selector when a supported
   runtime-required row has no recipe, no shard, or no runnable command. A clean worker may run one Phaser/Playwright
   process at a time; separate workers may run shards concurrently.
   Publish compact JSON for every shard and retain trace/repro, browser logs, screenshots/video on failure.
- **Completion:** stop-on-evidence uses settled checkpoints and independent authoritative outcome predicates. A positive case
   may end once all selected assertions and required events are complete; negative controls and temporal/terminal
   oracles run through their required horizon. Retain the actual stop tick and reason in reports. Author tests for
   early success, pending event, negative control, missing effect and mandatory terminal result before execution.
   A transient positive event cannot end a case that also requires retained workers, no duplicate construction,
   cleanup or sustained pressure. Declare the minimum observation/stability window and all selected obligations;
   shared variants stop only after all obligations finish. Continuous matches may stop on their real terminal result.

## Deferred final-gate execution loop

1. Tell the user before starting. Run the smallest tool/schema and representative map/fixture preflight at this gate;
   repair infrastructure or invalid setup before dispatching the broad suite. The preflight is not scenario acceptance.
2. Run manifest-selected compatible family/map shards, reusing a browser/server process within each worker while
   starting a fresh world per variant. Independent CI workers may run separate shards concurrently. Preserve one
   candidate SHA, dirty/fixture digests, seeds and retained reports across the sweep.
3. Generate one bounded repair list across the sweep. Separate missing/zero-work infrastructure, invalid preset/map,
   and actual behavior failures. Show cluster size, affected IDs, first failed predicate/checkpoint, one representative
   artifact/replay command and pointers to every member. Do not dump raw logs into agent context or claim a common
   root cause solely because several rows share a generic failure code such as `terminal_result_missing`.
4. Inspect one representative per provisional cluster and trace observation → intent → application → outcome.
   Repair shared owners in coherent batches; retain each scenario's independent oracle. Rerun only affected shards
   after each batch. Plan the final required matrix after all behavior-changing repairs, tuning, optimization and
   legacy removal. A complete passing sweep already on that final revision can supply this evidence without a
   duplicate run; require matching recorded candidate/source/workload provenance and invalidate it after relevant
   changes. Do not make CI green by dropping rows,
   shortening a negative-control horizon or accepting a planned action as an in-game effect.
5. Keep the PR draft while supported coverage or behavior is red. Enable the existing fail-closed required CI gate
   when the supported matrix, pure coverage and final review actually pass; extended calibration/soaks retain their
   separate schedule.

Continue independent cases after an individual behavior failure and retain every result; abort only a broken shared
infrastructure path and report its unexecuted rows explicitly. Group IDs only when one world can establish each
independent assertion. Do not multiply every case by all maps, sides, factions and difficulties: cover material
roster/authority differences in required variants, and use dedicated calibration/stress profiles for wider sampling.
Preserve required faction/control/determinism assertions already attached to each row. Reuse an executed result across
consumers only when seed, state, workload, source and every consumer's oracle agree.

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
- A retained, provenance-checked sweep yields one bounded repair list across shards; failure clustering never hides
  a required row or substitutes a hypothesis for a confirmed causal diagnosis. Affected-only reruns precede one
  clean full required matrix.
- Run omission/final closure audits, update coverage counts and operator docs, commit, push, and close #816.
