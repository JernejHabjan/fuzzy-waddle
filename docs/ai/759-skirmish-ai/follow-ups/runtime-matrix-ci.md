# Playwright runtime matrix and CI — #816

## Outcome

All supported runtime-required scenarios launch a real lobby-created Phaser match, observe authoritative effects, and run
as fail-closed required pre-merge shards with useful retained artifacts.

Recommended agent: **GPT-6.1 Sol / high** for new family helpers, reliable assertions and complex runtime contracts;
**GPT-6 Luna / medium** for expansion using established patterns and routine wiring. Follow the handoff's
[model batches and pause contract](../HANDOFF.md#model-batches-and-pause-contract), including its exact next batch.

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

### Production-family authoring contract (2026-10-02, unverified)

The first representative is PRO-04. `tools/ai/fixtures/focused-production-composition-runtime.json` now replaces its
natural-map registration with two same-seed faction pairs: ten ready soldiers, including two useful frontline copies
and eight ranged units, versus the same world with two additional frontline copies. Two finished producers, six
workers, food infrastructure and spare housing isolate production. Exact pre-tick balances are equal; no seeded queue,
loss, hidden information or AI-state injection is used. Each branch runs once through 600 ticks. Those positions and
the deadline are authored hypotheses until frozen-map preflight and the final gate prove them.

`requiredProductionComposition` and `evaluateRuntimeProductionComposition` independently require new owned ready
identities, two distinct applied composition effects, a dated unchanged target, retention and no excess ready/queued
units. The subject must fill its deficit at least 200 ticks before the final checkpoint. The satisfied control forbids
new military identities, military queues and composition application throughout the window. Ledger-only fulfillment,
unrelated commands, seeded copies, changed targets, missing identity evidence and truncated horizons fail closed.
`validProductionCompositionPair` checks the causal setup; the browser oracle still proves the actual effect.
The pure PRO-04 example separately covers priced useful duplicates, ready/queued/accepted target suppression,
disjoint accepted-versus-observed commitments, a one-unit remainder, three-run digests and input-order permutation.
No authored example here has run, and no coverage count or runtime saving is claimed.

| ID | Separate required causal world / independent oracle | Existing source anchor / remaining gap |
| --- | --- | --- |
| PRO-03 | Idle producer plus a dated future transition, paired with the same transition abandoned before spending. Require ready added capacity before its force deadline and release only unspent optional leases on abandonment. | `proposeAiMilitaryCapacity` prices current deficits; the existing PRO-03 pure test is a partial prebuild example. A future commitment/deadline and abandonment path are not established by this helper. Sol/high owns that contract before runtime migration. |
| PRO-04 | Useful repeated-unit deficit versus satisfied ready/queued commitments. Observe actual new copies and applied effects, then prohibit excess for an explicit window. | First ready-control example authored above. Extend the same identity/application oracle to ordinary seeded production queues; do not use demand counters as the effect oracle. |
| PRO-06 | Critical exposed producer versus the same useful demand already served safely; separately pair low-value/no-demand worlds. Observe an applied safe redundancy/replacement and retained useful throughput after scheduled loss; forbid needless redundancy. | `proposeAiMilitaryCapacity` has no criticality/exposure input. `AiAdaptationManager` counts role commitments, not producer resilience. Select fair visible threat evidence and a safe reachable site on Sol/high before claiming this row. |
| PRO-07 | Useful train/research contention on one shared lane; separately cancel one paid commitment while its refund is pending. Require applied lane occupancy within capacity, catalog-priced obligations, no spending of unapplied refunds and no cancel/requeue cycle over a dated window. | Presets seed production only; `applyAiRuntimePresetWorldV1` has no research/cancellation event setup. Pure queues can express research items. Actual shared-lane/refund application needs its own adapter and causal oracle on Sol/high, not a queue-count cap. |

**Next bounded batch — GPT-6 Luna / medium:** expand the specified composition commitment cases together. Keep
PRO-03/06/07's unresolved production-policy/authority work for a later Sol/high batch.

1. Add PRO-04 pure cases for a busy lane plus an idle producer, exact catalog-priced affordability versus one-unit
   shortfall, and both faction catalogs; retain three-run hashes and set-order checks. Use the existing proposal
   helpers and typed catalog, without copying live balance constants or broadening military policy.
2. Add a seeded-queue control pair on the same frozen map: the subject retains ten ready soldiers and empty queues;
   the control differs only by one ordinary paid frontline item in each of the two producers. Keep exact unspent
   pre-tick balances equal after normal queue charges. No brain leases or manufactured outcomes are allowed.
3. Extend the pair validator to validate each `pairId` independently, retaining both ready-control pairs and required
   factions. The queued control starts with ten preset military identities and two paid queued items, completes two
   new useful identities normally, issues zero AI composition commands and never exceeds twelve ready-plus-queued
   units. The subject still requires two new copies and two applied AI effects. No excess commands/queue entries
   after fulfillment, no early stop, and the same 200-tick stability/600-tick horizon remain mandatory.
4. Capture initial per-producer queue identities/types through the existing paused setup boundary so the oracle can
   distinguish preset completions from AI-created work. Do not infer paid queue application from debug text. Author
   false-pass cases, preserve diagnostic result/digest wiring, update manifest-derived catalog and this handoff,
   source-review, commit/push and pause. If real queue provenance requires a new authority decision, return to
   Sol/high instead of inventing one. All execution stays deferred.

Eventual focused gate: `pnpm ai:tools:test`, the gameplay `ai-production-scenarios` spec, the Playwright
`skirmish-ai-runtime-production-composition-evaluation` spec, and
`pnpm ai:skirmish-matrix -- --scenarios PRO-04 --mode runtime`. Run frozen-map preflight first and retain
source/fixture/run provenance. These commands have not run.

Focused commands to execute only at that gate:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-gameplay --testPathPattern=ai-production-scenarios --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-composition-evaluation.spec.ts
```

Use this batch order; the contract details below are acceptance requirements for these batches.

| Batch | Concrete output and dependency | Recommended agent |
| --- | --- | --- |
| Shared authoring contract | Extend existing fixture metadata, inventory and catalog; one short preset example and one continuous example | Sol/high |
| First usable family | Reuse authored open-economy map; author paired #815 pure and #816 runtime economy/production cases using existing setup services | GPT-6.1 Sol/high for new semantics, then GPT-6 Luna/medium for specified cases |
| Further families | Reuse helpers for combat/scouting/strategy; add bridge when needed, fortified map with wall cases; then recovery/debug | Same model across related cases while contract remains stable |
| Specialized adapters | Extend authored #819 relay harness and #823 lifecycle setup plus cases; preserve separate authority requirements | GPT-6.1 Sol/high; GPT-6 Luna/medium only for specified wiring |
| Execution tooling | Review authored early-stop and cross-report repair output before the broad validation sweep | GPT-6.1 Sol/high for oracle/provenance design, GPT-6 Luna/medium for specified plumbing |
| Pre-gate cleanup | Finish in-scope #821 splits/renames and update imports, manifests, compatibility readers and documentation links | GPT-6 Luna/medium; GPT-6.1 Sol/high for changed contracts |
| Deferred validation | Preflight, grouped sweep, cluster repairs, calibration/optimization/legacy retirement, then final evidence | GPT-6.1 Sol/high diagnosis and evidence decisions; GPT-6 Luna/medium for confirmed bounded repairs |

Reporter authoring checkpoint (2026-09-28, unverified): the existing summary CLI now accepts `--repair-list` and
`--require-supported`; runtime reports include a shared run ID, source/manifest provenance, per-fixture SHA-256
identities and scenario sources. CI supplies the run ID; manual sweeps must use `--run-id`. Pure parser/cluster tests
are authored. Exact 1-based variant/repetition diagnostic selection and a bounded rerun command are now authored but
unverified; diagnostic results cannot satisfy full scenario, pair, determinism or matrix coverage. Do not treat this
checkpoint as executed evidence.
The matrix writer now authors a bounded `indexes/*.json` sibling for each runtime report. Positive-only
`evidenceStop` policy is also authored with a stability window and fail-closed assertion allowlist. No fixture opts
into early stop yet; its runner and policy tests remain unrun under the current authoring mode.
Source review removed final military-type and repeated-type assertions from that allowlist: their final-checkpoint
values can fall after losses, so stable interim evidence is insufficient. The new policy cases are unrun.

Open-economy map checkpoint (2026-09-29, unverified): a separate grass tilemap, two-spawn editor/runtime scene and
asset pack are authored with a SHA-256 static topology contract. The map is hidden from ordinary browsing and
matchmaking but selectable by the local AI runtime-test lobby. No editor, topology, resource, buildability or
Playwright preflight has run. ECO-01/02, ECO-03 and ECO-04 are the first authored focused-map migrations; most
product-map recipes remain
registered until their legal starting worlds and independent outcomes are reviewed.

Recipe metadata checkpoint (2026-09-28, unverified): all nine currently registered runtime recipes declare
execution kind, variant role, pair identity where relevant, and focused long-deadline or natural-setup rationale.
The validator and generated catalog expose this contract and the current actual starting state. Paired resource-service
and housing controls now share their subject seed. Existing long/repeated focused recipes still need the planned
family-specific migration; no scenario pass is inferred from metadata or catalog generation.

Metadata comes before mass authoring because it defines every recipe. Early-stop and failure clustering are needed
before execution, so they need not block independent fixture authoring. Implement each helper with its first real
consumer; avoid a general fixture framework or extra index. Keep required defaults explicit. Use the inventory to
select one bounded family batch, carry its exact IDs/files/assertions forward, and expand only when that contract is
clear. Report progress and pause at the agreed model-batch boundary after committing/pushing and updating the handoff,
not after every scenario. Group related work on the same model to avoid unnecessary switching.

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
   The bounded `--repair-list` mode already aggregates retained shards from a run directory or repeated explicit files
   and has unrun provenance, path-selection and truncation tests;
   review and execute it at the final gate rather than building a second reducer. Reject
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
   `tools/ai/fixtures/continuous-land-runtime.json` now owns only natural SEQ match recipes. Replace the temporary
   natural `tools/ai/fixtures/production-natural-runtime.json` with focused PRO-03/06/07 files with legal preset actors;
   PRO-04 now owns `focused-production-composition-runtime.json`, authored but unverified. Include
   balances, queues and scheduled loss where needed. Group a positive/control pair together; do not create one file
   per ID or share a 12,000-tick natural match merely because several IDs mention production. PRO-05 already owns
   `tools/ai/fixtures/focused-production-replacement-runtime.json`, though its long deadline/repeats still need review.
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

## Authoring readiness before execution

This is a source-review checklist, not a claim of passing validation. Before announcing the final gate, record each
item as authored/unverified or explicitly blocked with its owner:

- Required gameplay changes and source-confirmed defects addressed; no known missing wiring hidden as a test task.
- Frozen maps, legal presets, independent oracles and required pure/runtime mappings authored; island rows deferred.
- Real relay/authenticated two-client setup/teardown and lifecycle adapters authored under #819/#823, including
  authority fencing, save/restore, replay and repeated-match cleanup where their source contracts need repair.
- In-scope splits/renames completed with imports, registrations, manifest paths, compatibility and docs updated.
- CI selection, early-stop, report producers and bounded cross-shard reporting authored with their own test cases.

Measured optimizations, difficulty tuning and legacy deletion remain evidence-dependent final-gate work. Do not
invent fixes for an unobserved runtime failure or remove compatibility on the strength of this checklist.

## Script-first agent result contract

The cross-shard reducer and exact diagnostic replay are authored but unverified. Finish remaining per-shard summary
and stop-on-evidence details before execution; the full contract below remains the acceptance target.

- Parse and evaluate results deterministically outside agent context. Passing rows produce totals by tier/family;
  retain full evidence in artifacts. No agent evaluation per tick, checkpoint or successful variant.
- Emit bounded JSON with run/source/workload provenance, expected/executed/passed/failed/unexecuted counts and
  provisional failure clusters. Each cluster includes classification, failure code, affected IDs, one representative
  expected/observed outcome and checkpoint, seed/map, artifact pointer and exact replay selection.
- Bound output by configurable byte and cluster limits. Preserve full member lists in retained artifacts; include
  omitted counts and detail pointers. Truncation never changes exit status, hides missing rows or marks them passing.
- Separate setup/infrastructure, behavior and unknown failures. Missing evidence stays unknown; a matching failure
  code is not proof of a shared cause. Reject incompatible provenance as specified above.
- Invoke agent judgment at a batch boundary for actionable failures, ambiguous evidence or tuning decisions. Start
  with the compact JSON, then request only the named cluster/member/checkpoint detail needed for diagnosis. Keep
  routine process waiting and successful result collection scripted; do not repeatedly reload unchanged reports.
- Author reporter tests for malformed/missing reports, provenance conflicts, distinct causes, zero-work runs and
  output truncation with correct totals and failure status. Execute these in the final preflight before trusting
  compressed results. Retain raw logs/traces so compression is reversible, not evidence deletion.

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
