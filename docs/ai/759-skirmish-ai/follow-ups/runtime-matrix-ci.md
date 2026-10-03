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
natural-map registration with two same-seed causal pairs per faction. Both start with ten ready soldiers, including
two useful frontline copies and eight ranged units. One pair compares that deficit with two additional ready copies;
the other compares it with one ordinary paid frontline item in each producer queue. Two finished producers, six
workers, food infrastructure and spare housing isolate production. Exact pre-tick balances are equal; no losses,
hidden information or AI-state injection are used. Each branch runs once through 600 ticks. Those positions and the
deadline are authored hypotheses until frozen-map preflight and the final gate prove them.

`requiredProductionComposition` and `evaluateRuntimeProductionComposition` independently require new owned ready
identities, two distinct applied composition effects, a dated unchanged target, retention and no excess ready/queued
units. The subject must fill its deficit at least 200 ticks before the final checkpoint. The ready control forbids
new military identities and queues; the seeded control forbids AI composition application and requires both captured
queue items to complete into exactly two new identities. Ledger-only fulfillment, unrelated commands, seeded copies,
changed targets, missing identity evidence and truncated horizons fail closed.
`validProductionCompositionPair` checks the causal setup; the browser oracle still proves the actual effect.
The pure PRO-04 examples cover priced useful duplicates, ready/queued/accepted target suppression, disjoint
accepted-versus-observed commitments, a one-unit remainder, busy/idle producer lanes, exact affordability versus a
one-unit shortfall, both faction catalogs, three-run digests and input-order permutation.
No authored example here has run, and no coverage count or runtime saving is claimed.

| ID | Separate required causal world / independent oracle | Existing source anchor / remaining gap |
| --- | --- | --- |
| PRO-03 | Idle producer plus a dated future transition, paired with the same transition abandoned before spending. Require ready added capacity before its force deadline and release only unspent optional leases on abandonment. | `proposeAiMilitaryCapacity` prices current deficits; the existing PRO-03 pure test is a partial prebuild example. A future commitment/deadline and abandonment path are not established by this helper. Sol/high owns that contract before runtime migration. |
| PRO-04 | Useful repeated-unit deficit versus satisfied ready/queued commitments. Observe actual new copies and applied effects, then prohibit excess for an explicit window. | Ready and seeded-queue pairs authored above. Do not use demand counters as the effect oracle. |
| PRO-06 | Critical exposed producer versus the same useful demand already served safely; separately pair low-value/no-demand worlds. Observe an applied safe redundancy/replacement and retained useful throughput after scheduled loss; forbid needless redundancy. | `proposeAiMilitaryCapacity` has no criticality/exposure input. `AiAdaptationManager` counts role commitments, not producer resilience. Select fair visible threat evidence and a safe reachable site on Sol/high before claiming this row. |
| PRO-07 | Useful train/research contention on one shared lane; separately cancel one paid commitment while its refund is pending. Require applied lane occupancy within capacity, catalog-priced obligations, no spending of unapplied refunds and no cancel/requeue cycle over a dated window. | Presets seed production only; `applyAiRuntimePresetWorldV1` has no research/cancellation event setup. Pure queues can express research items. Actual shared-lane/refund application needs its own adapter and causal oracle on Sol/high, not a queue-count cap. |

**Completed bounded batch — GPT-6 Luna / medium, authored and unverified:**

1. PRO-04 pure examples now cover a busy lane plus idle producer, exact typed-catalog price versus one-unit
   shortfall, and Tivara/Skaduwee product catalogs. Both faction paths retain repeated-result digests and reordered
   actor/catalog checks; existing queue/lease/observed suppression and one-unit remainder examples remain.
2. Each faction now has two same-map pairs: ten ready units versus the twelve-ready satisfied control, and the same
   ten-ready subject versus a control with one ordinary paid frontline item in each producer queue. All branches
   reset to equal authored pre-tick balances after normal queue charges, and retain the 600-tick ceiling and
   200-tick observation window.
3. The fixture validator groups by `pairId` and checks each ready and seeded-queue pair independently for both
   factions. The runtime oracle requires two new identities and applied composition effects in the subject, forbids
   AI composition commands in the seeded control, matches its captured queue item IDs/types/products, requires two
   normal completions, and prevents excess ready-plus-queued units.
4. The paused preset application captures actual per-producer queue item identities and types; checkpoints and
   diagnostic digests retain them. False-pass examples and the generated manifest-derived catalog are authored.
   No tests, validation, E2E, simulation, lint, type checking, build or editor check ran; paid application,
   positions and completion timing remain final-gate evidence.

### Production authority contract checkpoint (2026-10-02, unverified)

The distinct contracts/oracles are authored. This is an evidence-contract slice, **not** the focused runtime migration
or completed gameplay support. `RuntimeProductionContractV1` declares per-variant branch, product/producer, group,
ceiling and retained window. `RuntimeProductionEvidenceV1` requires definition prices/durations, actual initial
identities, committed snapshots, physical lanes, current visible threats, future plan dates/leases, ready products
and research authority facts, and strictly ordered command/resource application facts. Fixtures declare expectations;
only a real test-owned adapter may capture evidence. The oracle-only synthetic builders cannot feed browser results.

| ID / acceptance | Authored owner and independent rejection | Still required before runtime migration |
| --- | --- | --- |
| PRO-03 future versus abandonment | `skirmish-ai-runtime-production-transition-evaluation.ts`: normal post-start commitment, idle lanes, catalog-duration throughput justification, new ready capacity before transition starts, dated applied/retained force; abandoned optional unspent leases disappear while irreversible claims remain. Missing/changed dates, unrelated effects, late capacity and paid-claim erasure fail. | Establish the real future plan/demand/deadline and optional claim owner, including persistence/reconciliation. Trigger commitment and abandonment through legal visible world changes; never preset an AI brain/lease. Capture at tick zero and after decisions, then author both factions' legal pairs. |
| PRO-06 exposed critical producer | `skirmish-ai-runtime-producer-resilience-evaluation.ts`: current visible effective building-weapon reach, new safe/reachable ready identity before loss, useful applied product from that survivor and retained output; safe-served and low-value/no-demand controls prohibit added capacity. Hidden/stale threats, unreachable/unsafe sites, missing loss and unrelated output fail. | Add fair observation-backed criticality/exposure policy and safe-site selection, with real navigation/placement authority. Capture effective ranges and reachability, then author both causal pairs per faction and deterministic actor-specific loss. |
| PRO-07 shared queue and refund | `skirmish-ai-runtime-production-refund-evaluation.ts`: shared physical lane occupancy, useful independent train/research completion, exact definition prices, reserved cash and remaining pay-over-time obligations; one paid cancellation request, an unfundable pre-refund probe, actual credit, later useful output and no requeue cycle. | Seed ordinary paid production/research through legal components/commands. Record cancellation dispatch and shared queue/resource application order in a test-only adapter. Capture remaining obligations from their real authority, exact queue identities and tech completion. Author shared-contention and pending-request worlds per faction. |

**Timing decision from source inspection:** `QueueComponent.cancelProductionItem` removes/reports the cancelled item
then calls `ProductionComponent.handleProductionRefund`; research calls its refund before removing/reporting the item.
Both refund paths emit resource addition synchronously. A pending-refund case therefore observes cancellation
**request/dispatch before authoritative cancellation/refund application**. Applied cancellation and credit may share a
tick, with their order retained explicitly. Do not defer the shared refund, inject anticipated cash or require a
multi-tick gap after applied cancellation just to satisfy a test.

`evaluateRuntimeProductionContract` is mandatory in the generic variant evaluator for these three IDs, and
`evaluateRuntimeProductionPairs` requires all branches for each required faction. Transition/resilience pairs must
have distinct variants with equal seed/map/pre-tick balances and a shared causal setup digest; queue contention and
cancellation use separate worlds. Aggregate producer/demand/queue checks now live in a supplementary count helper.
The old aggregate PRO-03 prebuild shortcut was removed, and capacity-only specs identify PRO-01/02 instead.
`requiredProductionContracts` cannot opt into early evidence stopping. The new pure resource-authority spec exercises
the existing arbiter's shared slot identity, priced claims, obligations and cash boundary with repeated digests and
proposal-order permutation; it does not establish runtime queue/refund application or full PRO-07 pure coverage.

The natural PRO-03/06/07 recipe remains registered as migration debt and now fails closed for missing contracts and
branches. No adapter fills `productionEvidence`, no new runnable focused recipe/full pure row was registered, and
fixture parsing/schema enforcement for the new field still needs the adapter/recipe slice. No policy, persisted brain
identifier, queue/refund gameplay owner or manifest denominator changed. All examples are authored and unrun.

**Next related batch — stay on GPT-6.1 Sol / high:** continue the authority capture and legal setup named in the
policy checkpoint below. The evidence-contract checkpoint above describes the preceding slice; its missing policy
owners now have an authored implementation, without runtime acceptance. Do not replace source authority with
self-reported counters or AI-state injection. Record absent capabilities/provenance as missing evidence.

Deferred focused checks also include the new Playwright production contract/transition/resilience/refund/pair specs
and `ai-production-resource-authority.spec.ts`. First execute their synthetic oracle cases and pure admission cases at
the final gate, then map preflight and the eventual focused browser recipes; no check listed here has run.

### Production policy checkpoint (2026-10-02, unverified)

The next bounded slice authors gameplay support behind PRO-03/06. `observeAiProductionTransition` is macro-owned:
normal post-opening pressure against a visible compatible objective, known idle production, legal catalog builder,
definition-backed timing and cash after the observed reserved/unpaid ledger can establish one future commitment.
The existing eight-work-per-lane horizon and 24-unit/three-producer bounds remain; this is not measured tuning.
`projectAiProductionTiming` reads production milliseconds, physical queues (matching `QueueComponent`'s base-definition
initialization), and automatic plus one-builder construction work rate. It never uses queue backlog slots as lanes.

The saved `AiProductionTransitionV1` freezes plan/demand/target/product identities, commitment/start/force dates and
justified force/capacity. A unit cycle is an admission/travel allowance before the start; it cannot guarantee actual
construction readiness. Macro links early capacity and later selected-product commands to that plan. The force ledger
and food/resource forecasts retain the future demand while admission is held. Dates do not slide. Changed objective or
essential defense abandons it; a missed deadline expires it. The terminal record prevents reviving the same objective
on every cadence while permitting a different objective to establish a new schedule. Only observed ready products can
fulfill it. The canonical serializer retains it, and a present malformed schedule rejects; older V1 saves omit it until
a new normal decision commits. Mission set-ordering and macro economy projection were extracted to keep owners bounded.

`productionTransitionClaims` appends one optional forecast for missing useful products, not already observed/queued
copies. It is a lineage/budget expectation, not resource admission or applied spending. `projectAiManagerState` removes
only forecast/provisional claims on release. `reconcileAiProductionReservations` advances this plan's command claims
from actual ordered outcomes before that release, preserving dispatched/applied work and removing it only at terminal
authority. A forecast is not a refund, and no shared gameplay queue/resource timing changed.

`needsAiProducerResilience` requires useful strategic demand and current visible, positioned effective ground attacks
against every compatible ready producer. Damage, minimum range and the shared high-ground threshold/bonus matter;
remembered/stale contacts cannot become live threats. `proposeAiMilitaryCapacity` can add one priced safe survivor or
replace useful lost critical capacity using its saved demand. A known safe compatible alternative or satisfied demand
prevents needless redundancy. Its new placement filter checks the entire footprint against weapon reach and a bounded,
known-cell ground flood. It conservatively excludes unknown cells and height transitions; shared construction application
still owns actual placement/navigation/payment legality. This is not proof of a build site, builder arrival or readiness.

`ai-production-scenarios-policy.spec.ts` authors both factions' normal schedule, no early unit admission, stable dates,
one initial build, later two-producer admission, abandonment/unspent release, same-boundary dispatched/applied retention,
terminal release, older/default and malformed saves, pledged obligations, deadline expiry and repeated digests. Resilience
cases author safe/low-value/no-demand/hidden/stale/island controls, useful survivor output after loss, critical replacement
and order permutation. The existing registered PRO-03 macro case now requires this real future commitment instead of its
old aggregate prebuild approximation. The existing matrix `ai-production-scenarios` pattern selects the policy suite;
no manifest denominator or recipe registration changed. Pure fixture facts are not browser outcome evidence. These
source-authored cases, timing cases and changed serialization paths remain entirely unexecuted.

Requirement-to-evidence closure for this source slice:

1. Definition timing and current catalog consumer: `ai-production-timing.ts`, adjacent unrun spec, catalog projection.
2. Future identity/dates/admission and optional claim lifecycle: transition/claims owners, military context/proposals,
   macro and manager/outcome reducers; both-faction unrun policy sequences.
3. Fair criticality, safe placement and lost-capacity recovery: producer-safety and capacity proposal; unrun controls.
4. Persistence/default/rejection and bounded methods: optional economy-state contract, guard, canonical serializer and
   extracted mission ordering/macro economy projection; unrun save examples and existing serializer suites.
5. Source review, Omission Audit and separate Final Closure Audit: direct source/call-site/diff review only. Existing
   comments are preserved and no content-hash baseline was refreshed. No gameplay claim is validated by these audits.

**Adapter/authority boundary at this policy checkpoint:** the Phaser ledger emitted zero reserved/unpaid fields. The
raw-capture checkpoint below now implements unpaid queue liability and passive callbacks; full PRO-07 budget/causality
still remains. Preserve synchronous cancel/refund application and capture the actual pending request. Add a read-only
committed schedule projection for evidence/debug without running the planner, physical lane/item identities, prices,
research completion, current effective weapon ranges and real navigation/placement proof. Reconcile internal fulfilled/
expired lifecycle with the oracle's retained commitment requirements explicitly; never fabricate a `committed` snapshot.
Then schema-validate contracts and author legal paid train/research/cancel setups and both factions' future/resilience
pairs. The natural recipe remains migration debt and fails the mandatory gate for missing contracts/branches; no runtime
adapter fills `productionEvidence`. Full pure family integration and policy/strategy world causality still need review.

Keep these related owners on **GPT-6.1 Sol / high**. Only move to lower-cost fixture expansion after authority and setup
are concrete. All execution remains final-gate work, including timing projection, `ai-production-scenarios` (which also
selects the new policy suite), macro/air/capacity, canonical serializer/migration, generic production oracles and eventual
focused browser worlds. No test, simulation, lint/type/build/editor/schema validation or doctor/context ran.

### Production raw-capture checkpoint (2026-10-03, unverified)

The next source slice implements actual queue-liability projection and passive test-owned raw capture. It is **not**
normalized causal runtime evidence, legal-world migration, PRO-family acceptance or issue completion. It began from
`c2bce7d2a4e2296bbbbaede891c4b796866d957d`; its containing commit owns the new source revision.

`projectAiProductionObligations` consumes all owned live queue items in the committed observation pipeline. Source
inspection found that pay-over-time production currently charges its entire stored resource vector on each successful
50 ms queue tick, including the final partial tick. Failed payment leaves remaining time unchanged. The projection
protects every remaining successful charge for heads and waiting items; paid immediate production/research adds no
future charge. Malformed timing/cost fails capture instead of creating zero liability. A zero-time restored head still
enters the payment branch once before completion. No inspected shipped prefab uses this payment type, and no shared
payment/refund owner changed. At this checkpoint the independent payment oracle still treated over-time price as a total; the legal queue-setup
checkpoint below reconciles that contract without changing shared game balance.

`AiRuntimeProductionCapture` subscribes to actual bus outcomes/command delivery, player resource application, physical
queue changes, tech completion and actor unregistration. Resource callbacks retain copied before/after balances and a
continuity flag. The global callback sequence preserves same-tick ordering; fact tick is the current callback-observation
tick while original command/outcome ticks remain in their records. Command delivery can follow application for existing
subscribers and cannot prove pre-application request timing. Neither balance delta nor temporal proximity supplies
item-level payment/refund identity. Actor unregistration is retained as that fact, not an assumed combat death.

Read-only snapshots retain tick-zero owned actor IDs, later fair committed observation/catalog, the saved macro schedule
with its actual committed/abandoned/fulfilled/expired status, reservations, physical lanes, stored item costs/times,
actual resource balances, projected obligations and completed research from `TechTreeService`. Item identities use
saved command context where present; otherwise a WeakMap keeps a capture-local handle stable across array-index shifts.
An uncommanded handle does not survive restore. Lane IDs use actual queue indices; backlog capacity remains separate.
No planner, pathfinder, debug panel, payment owner or live AI state is mutated by these readers.

The strict developer config now permits `captureProduction: true`; the installer runs before preset resources/queues
in marked PRO-03/06/07 worlds, including natural worlds without a preset. The browser driver samples tick zero and each
settled checkpoint and retains `productionCapture` in its raw result. This new field cannot satisfy
`RuntimeProductionEvidenceV1`. The capture caps facts at 8,192 per scene and snapshots at 256 per player, with explicit
per-player dropped counts. Shutdown/destroy fences subscriptions and detaches only the matching global host handle.
Existing/new actors are observed through index events; a test-only tick scan attaches late-created queue components.
Queue events before registration, decision-snapshot cadence and restore provenance remain explicit gaps.

`validProductionContracts` is wired to Node fixture parsing for present `requiredProductionContracts`. It checks strict
keys, scenario branch membership, every selected variant and required faction, matching pair identities/products/
horizons, declared checkpoint ceiling, stable window and absence of early stopping. PRO-07 uses separate standalone
queue worlds. It is schema/coverage enforcement, not definition legality, actual setup equality or execution evidence.
The missing-contract natural recipe remains migration debt at the mandatory runtime gate; no recipe was registered,
manifest denominator changed or normalized `productionEvidence` fabricated.

Source-slice closure map:

1. Owned resource liability: obligation helper and pipeline call, adjacent unrun timing/stall/removal/malformed cases.
2. Ordered real callback and detached snapshot ownership: capture/fact/queue contracts, queue reader and capture class;
   unrun callback-order, balance-continuity, index-shift, command-context restore, expired-status, tech and bounds cases.
3. Installation/teardown/browser retention: explicit config guard, gated installer, preset bootstrap and portal capture/
   setup/runner/result consumers; unrun opt-in, direct destroy, replacement-host and subscription disposal cases.
4. Present fixture contracts: Node helper/reader hook; unrun both-faction PRO-03/06/07 shape and rejection examples.
5. Implementation review, Omission Audit and separate Final Closure Audit: source/diff inspection only. Existing comments
   and source baselines were preserved. No test, E2E, simulation, lint/type/build/editor/schema/repo check ran.

**Next related boundary — stay on GPT-6.1 Sol / high:** establish reliable item-scoped payment/refund attribution,
initial paid-item provenance, pending dispatch admission and legal production/research/cancel setup through ordinary
components/commands. The shared owners are baselined; any required source split must preserve existing comments and
be a separate bounded responsibility extraction, never a hash refresh. Resolve the independent oracle's price and
pending-request timing assumptions honestly: ordinary single-player dispatch/application is synchronous, and a real
buffered request requires an actual authority path. Add committed-decision snapshots and real navigation/placement
proof, reconcile terminal schedule evidence, then build legal both-faction focused worlds and normalized evidence.
Do not lower the causal acceptance gate to accept this raw trace. Full pure family integration still remains.

At the deferred final gate include `ai-production-obligations`, `ai-runtime-production-capture`, installer and browser
config specs in Phaser, plus `skirmish-runtime-production-contract-fixture.test.mjs` under `pnpm ai:tools:test`. Retain
prior policy/timing/serializer/arbiter/oracle gates and run frozen-map preflight before eventual focused runtime worlds.
These commands are deferred, and no passing evidence or runtime savings are claimed.

Deferred focused command for the new Phaser owners:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='ai-production-(obligations|timing)|ai-runtime-production-capture|validate-ai-runtime-browser-test-config-v1' --skip-nx-cache
```

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


### Production legal queue-setup checkpoint (2026-10-03, unverified)

This bounded prerequisite batch began at `c2cd61df413e27c96a439c01eca5f2b34faeddfd`. It authors ordinary paid setup and
reconciles known oracle assumptions. It does **not** provide item-scoped ongoing resource hooks, legal-world/browser
proof, normalized `productionEvidence`, full pure-family coverage or completion of #815/#816.

The source acceptance record is:

1. **Legal setup — authored:** `applyAiRuntimePresetQueues` dispatches each production/research seed through the real
   bus/`QueueCommandSystem` path. `applyAiRuntimePresetWorldV1` no longer charges or adds queue items directly. Existing
   component initialization owns queue creation/registration, prices, eligibility, faction/campaign tech and capacity.
   Dispatch rejection, absent applied outcome, missing/wrong command-backed physical item, replacement of earlier
   items or wrong resource delta aborts setup. There is no corrective cash injection or rollback claiming acceptance.
2. **Real scoped provenance — authored:** `AiRuntimePresetQueueApplicationV1` retains the stamped command, matching
   callback outcomes, exact shared item ID and detached before/after resource-authority samples. Production immediate
   price and research definition price must match; per-tick production seeds pay nothing before simulation begins.
   These samples precede explicit authored balance resets. They describe a synchronous setup operation and are not
   guessed attribution for later unlabelled resource callbacks.
3. **Bootstrap/consumers/identity — authored:** object-ready callbacks wait for `sceneInitialized` and zero-delay
   Phaser timers. `scheduleAiRuntimePresetSetup` subscribes after preset actors are constructed, so its timer follows
   their component initializers. It checks paused tick zero and current active game, disposes on shutdown/destroy and
   fences stale games. The portal waits for the completed setup record before reading cash/queue counts. Fair owned
   queue items now share command-backed IDs with setup/raw capture across index shifts/restore; legacy identities
   remain positional. Browser counts/provenance, bounded enum-checked `researchQueues`, pair guards and recipe summary
   consumers are wired. Digests normalize per-match identifiers while retaining queue replacement continuity and full
   raw identities. No registrations/manifest/catalog generation changed.
4. **Authority-oracle agreement — authored:** `per_successful_tick` declares the actual full-vector charge. Events
   retain remaining successful charges before enqueue/payment; the independent oracle checks total admission liability,
   exact one-vector charges/liability release, repeat/timing identity and protected other commitments. Zero-duration
   queue heads still charge once. `cancel_requested.scheduledTick` is the intended bus tick, distinct from actual callback
   tick, and must be later than observation/request tick and linked to the cancellation command/actor/product. The
   refund/probe sequence remains application order. A deterministic/single-player dispatch cannot satisfy the pending
   branch. Neither shared gameplay money timing nor the mandatory production evidence gate changed.
5. **Closure/evidence — authored/unverified:** source review followed input -> bootstrap -> component command ->
   outcomes/physical item -> cash -> record -> browser/digest/oracles. Omission Audit covered strict parsing, duplicate
   player tech, repeated seeds, no-op/rejected/wrong-price application, teardown, host replacement, pair controls and
   immediate consumers. Separate Final Closure Audit checked repaired consumers, named remaining gaps and exact staged
   scope. Existing comments and content-hash baselines are preserved. No executable check ran.

Authored unrun tests cover command-backed multiple seeds on one producer, normal research pricing, unpaid per-tick
admission, scoped detached cash, dispatch-only/no-op/wrong identity/product, admission rejection/application exception,
missing authority and free items; deferred readiness, both teardown events, stale/inactive game and resumed/advanced
clock; fair queue identity through saved clones/index shifts; strict research seed fields/ownership/duplicate tech;
per-tick full price and liability, exhausted/short/no-payment fictions, real buffered request timing/correlation; digest
session-independence with preserved replacement identity; and Node research pair variables/summary counts. Mocked and
synthetic examples are never browser outcome proof.

**Remaining acceptance:** add true item-scoped payment/refund callbacks without inferring money from amounts/order,
then pending dispatch claims and real buffered cancellation/probe setup. The normal single-player harness cannot
manufacture a pending request interval; use actual buffered authority. Shared production/queue/research/scene owners
have source baselines: any necessary edits require bounded comment-preserving restructuring, not hash refreshes.
Per-tick cancellation also retains the shared owner's unusual progress-based refund formula; do not silently change
balance or assume it refunds cumulative per-tick payments. Continue fair decision cadence, placement/navigation and
weapon exposure facts, lifecycle status reconciliation, legal both-faction PRO-03/06 pairs and separate PRO-07 worlds,
normalized runtime evidence and full pure-family integration. Existing PRO-04 fixture setup is affected and needs the
same final-gate legal command/initialization proof. Natural PRO-03/06/07 remain fail-closed migration debt.

**Next model boundary:** retain **GPT-6.1 Sol / high** for these related authority decisions. Actual model/effort is
unavailable. Commit/push this authored prerequisite and pause; do not switch models per file or scenario.

At the announced final gate, add these focused commands to the earlier raw-capture/policy/oracle/map checks:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='apply-ai-runtime-preset-queues|assert-ai-runtime-preset-queue-payment|schedule-ai-runtime-preset-setup|ai-observation-queue-item-id|validate-ai-runtime-browser-test-config-v1' --skip-nx-cache
pnpm ai:tools:test
```

Also include the Playwright oracle-only `skirmish-ai-runtime-production-refund-evaluation.spec.ts`,
`skirmish-ai-runtime-production-composition-evaluation.spec.ts` and `skirmish-ai-runtime-digest.spec.ts` in the grouped
portal-e2e gate, then the frozen-map preflight and actual focused production worlds. All commands remain **unrun**.
