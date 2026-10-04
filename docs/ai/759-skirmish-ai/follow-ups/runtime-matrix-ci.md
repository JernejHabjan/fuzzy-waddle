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
components/commands. These shared-owner extractions and callers are now authored in the shared-caller checkpoint
below. Keep comments accurate and use bounded responsibility extractions, never a hash refresh. Resolve the independent oracle's price and
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


### Production pending-command capture checkpoint (2026-10-03, unverified)

This independent authority slice began at `6b64fd5930780c59bdde19f8e21b4d340b47091a`. At authorship, the previously
selected shared item-money hooks were deferred because bounded production/queue/research splits required relocating
comments under the former AGENTS.md permission rule. The user removed that rule on 2026-10-03; the permission
blocker is cleared. This batch completes the dependency-compatible pending-command capture work; it does not
implement those hooks or the real buffered cancellation/refund/probe world. No issue or production family is complete.

1. **Dispatch provenance — authored:** `ai-intent-dispatcher.ts` uses `dispatchAiIntentCommand` for its existing
   economic, movement, combat and control translations. An installed capture listener receives the exact accepted
   claims and command input before shared `dispatchAi`, followed by its actual receipt or rethrown exception. Ordinary
   scenes without that listener take the direct original bus path. No command is manufactured or admitted by the
   observer; prefix stripping and commitment correlation retain their prior semantics.
2. **Unspent pending ownership — authored:** `AiRuntimePendingCommands` correlates real dispatched outcomes with that
   in-flight scope, preserving command ID, commitment, intent/effect, player, epoch/sequence, product/address, actual
   request tick, proposal tick, scheduled tick and original claims. Only confirmed admission owns a diagnostic claim.
   Applied/terminal per-actor outcomes retire it after every addressed actor settles. A synchronous application before
   the finished receipt stays retired. Partial application conservatively retains the full command claim; no guessed
   per-actor cost is allocated. Duplicate outcomes do not release ownership, and uncertain lost/backlog outcomes leave
   it outstanding with a gap. Receipt/player/authority/timing mismatches remain explicit. Accepted cancellation has
   zero resource claims unless its real intent says otherwise; there is no pending credit.
3. **Capture/consumer/lifecycle — authored:** `AiRuntimeProductionFactV1` retains dispatch-scope callbacks and the bus
   intended tick on dispatched outcomes; enclosing fact tick remains actual callback time. `AiRuntimeProductionCapture`
   snapshots retain detached pending commands and resource claims beside real cash and queue liabilities. Claims are
   a diagnostic view of existing accepted ownership, not cash escrow or additional saved reservations to sum twice.
   Request/pending ledgers each cap at 128; invalid/duplicate resource claims and missing admission fail diagnostic
   completeness, and aggregate overflow produces null rather than a fictional numeric balance. The existing browser
   result's typed raw capture retains these fields automatically. Teardown removes the local dispatch listener and
   clears ownership on both shutdown/destroy. The pre-capture/restore gap stays explicit; no restored command metadata
   or price is inferred. Normalized production evidence, recipes, manifest and acceptance gates are unchanged.
4. **Regression authoring — authored/unrun:** `dispatch-ai-intent-command.spec.ts`,
   `testing/ai-runtime-pending-commands.spec.ts` and the added `ai-runtime-production-capture.spec.ts` case cover direct
   dispatch, detached scope order, real receipt/rejection/exception retention, synchronous versus buffered ownership,
   partial actors, cancellation without credit, duplicates, mismatched/premature outcomes, unknown intents, malformed
   and duplicate claims, receipt/schedule mismatch, bounded overflow, null aggregate and scene cleanup. Fixture helpers
   explicitly label their records synthetic; these are not relayed runtime or payment/refund evidence.
5. **Closure — source only:** implementation review traced all dispatch translations and existing bus timing semantics,
   then repaired receipt-after-application, authority/commitment correlation, premature callback handling and overflow
   representation. Omission Audit checks all four paths above, immediate contracts/consumer, test discovery and scope.
   Separate Final Closure Audit rechecks those repairs and staged ownership. No existing comments were moved/rewritten,
   no content hash was refreshed, and no executable validation ran. Shared hooks were not implemented; their former
   comment-permission boundary has since been removed by the user.

**Historical shared split action (now authored in the shared-caller checkpoint below):** extract the production alias and
spawn responsibility into bounded `production-game-object.ts`/`production-spawner.ts`, the research definition into
`research-definition.ts`, and the unified display projection into `project-shared-queue-items.ts`. Keep existing
public exports and method wrappers, keep comments accurate with their responsibility, and remove
only baseline entries for owners made compliant. Inspect actual sizes/ownership during that authoring pass; do not
refresh any hash. No shared owner is modified by this checkpoint.

**Historical caller action (now authored below):** after those bounded splits, connect the prepared scoped queue-resource emitter at the actual
production/research immediate charge, queue per-tick successful charge and cancellation refund boundaries. Carry the
actual unified item handle/command context and stored price, sample operation-scoped authority balances, preserve raw
callback ordering, distinguish suppression/no payment, and forward the actual cancellation command separately from
its item's originating command. Preserve existing shared refund formulas, including the per-tick owner's unusual
progress-based refund. Then author the real buffered cancellation/pre-credit rejection world using actual lockstep
scheduling and both-peer legal setup. A same-batch cancellation followed by a probe executes refund before probe;
that cannot prove pre-credit rejection. The fixture must establish an actually earlier applied rejected probe while
cancellation is still pending, without using deterministic local dispatch to fork multiplayer balances.

Retain **GPT-6.1 Sol / high** for these grouped authority decisions; actual model/effort is unavailable. Commit/push
this independent authored boundary and pause. The former comment-approval blocker is cleared by the user's policy
change. Remaining fair cadence, placement/navigation/exposure, lifecycle status reconciliation, legal
PRO-03/06/07 worlds, normalized evidence, full pure coverage and PRO-04 runtime proof remain as above.

At the announced final gate, add:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='dispatch-ai-intent-command|ai-runtime-pending-commands|ai-runtime-production-capture|install-ai-runtime-production-capture' --skip-nx-cache
```

Then run the existing grouped raw/setup/payment/digest/oracle tests and map preflight before actual production worlds
and socket-backed cancellation/probe execution. All commands remain **unrun**; no tests, E2E, simulations, formatting,
lint/type/build/editor/schema/repository checks or doctor/context commands ran in this batch.

### Production queue-resource observer checkpoint (2026-10-03, unverified)

This support slice began at `ab2bc287ba532815edcf8558e922adba1ea65a08`, with local/remote matching on
`feature/759-skirmish-ai`. The former comment-relocation blocker is cleared by the user's 2026-10-03 removal of the
blanket comment-permission rule. Comment maintenance within authorized implementation requires no separate approval.
At this checkpoint the bounded adapter and raw consumer were authored; shared money callers were subsequently
authored in the shared-caller checkpoint below. The real buffered cancellation/probe world remains unimplemented. No issue/family is complete, and no runnable recipe or normalized evidence was added.

1. **Emission boundary — authored:** `data/emit-queue-item-resource.ts` forwards the actual shared `emitResource`
   inputs once, without another price/refund policy. Ordinary scenes with no diagnostic listener use that original
   path directly. Observed scenes record started, exact callback and finished phases, scoped cash before/after,
   original requested amounts, observed restore flag and return/throw state. Callback matching uses the exact input
   object plus player/action; equal-price copies, mutated vectors and wrong-player/action events cannot establish a
   matching operation. Missing/malformed samples are null, not fabricated zero balances. Absent callbacks cannot
   establish observed payment; the restore flag is context, not a guessed refund or a promise of pending credit.
2. **Bounded ordering/lifecycle — authored:** scene-local operation IDs identify scopes without gameplay/save/relay
   identity semantics. The temporary subscription is removed in finally, including exceptions. Eight exact callback
   facts can be emitted per operation; count saturates at nine with an explicit overflow flag. Nested observed calls
   own only their innermost callbacks; an outer interval containing one is explicitly ambiguous even if cash matches.
   Active scope state is released/restored in finally and scene-keyed state is weak. Existing capture caps/drop counts
   remain the outer retention bound. This observer does not report unaffordable attempts that never reach an emitter;
   the real per-tick denial path remains part of the shared-caller authoring obligation.
3. **Raw provenance/consumer — authored:** `AiRuntimeQueueResourceV1` and `projectAiRuntimeQueueResource` project the
   actual item handle at callback time, including before first insertion/after cancellation removal. Production uses
   stored item cost/progress/refund policy; research uses the actual definition. Original purchase execution, player
   and addressed actors remain separate from the supplied cancellation command, including IDs, intent/effect,
   authority epoch/sequence and scheduled tick. Missing/wrong/future cancellation, missing or inconsistent purchase,
   actor/owner, price/progress, sample, callback, exception and nested gaps remain explicit. The raw capture listener
   retains detached `queue_resource` facts, uses existing item identities/player filtering, and removes the listener
   on teardown. The browser result already retains the full typed capture. The generic `resources_applied` last-seen
   balance semantics and normalized mandatory gates remain unchanged.
4. **Regression authoring — authored/unrun:** `data/emit-queue-item-resource.spec.ts`,
   `testing/project-ai-runtime-queue-resource.spec.ts` and the raw-capture integration case exercise forwarding,
   operation cash distinct from last-observed cash, detached samples, exact/mutated/equal vectors, missing authority,
   restore/no callback, wrong action/player, malformed samples, duplicate/limited/nested callbacks, thrown emission,
   production/research provenance, separate cancellation lineage and timing, pre-insertion/post-removal item identity,
   and cleanup. These records and mocked emitters are explicitly synthetic. They do not establish real shared
   application, refund formulas, legal setup, multiplayer buffering or relay/hash parity.
5. **Closure — source only:** implementation review traced shared emission and communicator identity/order, all new
   contracts/consumer and scene cleanup. Omission Audit identifies absent shared callers and the real multiplayer
   world as blockers, rather than counting adapter authorship as completion. Separate Final Closure Audit rechecks
   nested-call repair, immediate consumers, documentation, exact owned scope and deferred checks. Existing comments
   and source-structure baselines are untouched. No test, simulation, E2E, formatting, lint, type, build, editor,
   schema, repository check or doctor/context command ran. Commit/push this bounded support slice and pause.

**Historical next action (now authored in the shared-caller checkpoint below):** perform the proposed bounded
`production-game-object.ts`, `production-spawner.ts`, `research-definition.ts` and `project-shared-queue-items.ts`
splits, keeping comments accurate with their responsibilities. Preserve public wrappers/exports and remove only
baselines whose owners become compliant; never refresh a hash to pass lint. Then connect `emitQueueItemResource` to
actual production/research immediate charges, successful
per-tick payments and both refunds. Create/carry the actual unified handle before initial charge without changing
eligibility/cash behavior. Forward the actual stamped cancellation through the queue command/system/component
wrappers separately from the item's purchase context. Record failed payment attempts without charging or progressing
the queue. Do not recompute or rebalance the shared PayOverTime progress-based refund formula.

At this checkpoint the helper had no shared production/research/queue caller. The shared-caller checkpoint below
connects those paths and replaces `queue_resource_shared_callers_unconnected` with
`queue_resource_runtime_authority_unverified`; `resource_item_attribution` remains. Synthetic records do not establish
runtime authority or normalized causal evidence.
After caller wiring, author the legal two-peer buffered cancellation/probe world described above: the rejected probe
must actually apply before cancellation credit while that cancellation is pending. Same-batch refund-then-probe and
deterministic local dispatch cannot prove it. Then normalize genuine evidence without weakening causal gates.

Retain the existing **GPT-6.1 Sol / high** recommendation for the grouped shared ownership and lockstep decisions;
actual settings are unavailable. The user removed the comment-approval restriction; shared caller wiring can resume
within the standing implementation scope. Tests and validation still wait for the final gate.

At the announced final gate, add this focused command to the existing pending/setup/payment/digest/oracle suite:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='emit-queue-item-resource|project-ai-runtime-queue-resource|ai-runtime-production-capture|install-ai-runtime-production-capture' --skip-nx-cache
```

It remains **unrun**. Follow with map preflight, real production worlds and socket-backed cancellation/probe execution
after the shared callers and legal worlds exist. Keep authored support, runnable scenario coverage and accepted
runtime evidence separate.


### Production shared-queue callers checkpoint (2026-10-03, unverified)

This grouped shared-owner batch began at `423b3a16fbaad9eb21f628bb58341f5363a6a469`. The behavior-preserving extraction
is commit `6cfd91ea`; caller wiring began there. Worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch
`feature/759-skirmish-ai`. The containing caller commit owns the latest revision; verify it and the remote on resume.
Actual model/effort is unavailable. No executable validation ran; no issue or family is complete.

| Acceptance | Authored source and consumers | Evidence/status |
| --- | --- | --- |
| 1. Bounded owners | `production-game-object.ts`, `production-spawner.ts`, `research-definition.ts`, `project-shared-queue-items.ts`; existing component wrappers/research type re-export | Source reviewed; three component baseline entries removed, no hash refreshed; structural lint deferred |
| 2. Actual money items | Production/research initial charge constructs and carries the same unified item before insertion; tick payment receives the physical first item; both refunds receive their actual item | Source traced; eligibility, charge/refund formulas and insertion/removal order preserved; runtime proof deferred |
| 3. Cancellation and denial | Queue command system forwards the original stamped cancel through component/queue/refund wrappers; `recordQueueItemPaymentDenied` records failed affordability without emission or progress | Separate purchase/cancel lineage; denial has no invented callback/after cash; actual relay/order proof still missing |
| 4. Regression authoring | `entity/systems/shared-queue-resource.spec.ts`, emitter/projection denial cases, capture gap assertion update | Authored/unrun, real components with synthetic scene/emitter; no paid runtime or lockstep proof |
| 5. Closure/publication | Implementation review, Omission Audit and separate Final Closure Audit; handoff and latest gap labels reconciled | Source-only audits; scoped commit/push and remote SHA verification at delivery; all executable gates deferred |

The production wrapper keeps actual spawning/navigation/rally behavior with `spawnProductionActor`; the helper reads
its original owner at the original pre-creation boundary. Research keeps the `ResearchDefinition` re-export for the
existing prefab contract. Display projection preserves lane/item traversal, icon selection, index and progress rules.
Only excerpts were extracted, not whole tracked-file moves. The final caller commit wraps two pre-existing long
production imports exposed by removal of the old structural exemption. No baseline hash was regenerated.

All actual shared charge/refund sites now invoke `emitQueueItemResource` with the physical handle, including the
pre-insertion initial payment and post-removal production refund. Successful PayOverTime ticks still charge the full
stored vector each 50ms before progress. A failed affordability attempt emits one `denied` diagnostic only when
observed, with requested price, current cash and item progress; the queue returns without payment/progress. Its
scene-local ID shares the operation sequence. It has no callback or after balance, so later snapshots/outcomes must
establish the result. No new save/relay field, gameplay escrow or price policy was added.

Production cancellation still removes the item/reports the purchase's terminal outcome before credit; research
still credits before removal/terminal outcome. The refund's separate cancellation is the actual command delivered
to `QueueCommandSystem`, never copied from the purchase execution. Optional cancellation metadata leaves direct
legacy cancellation callable; missing lineage stays an explicit raw projection gap. Existing refund suppression and
the unusual PayOverTime one-vector progress-based refund remain unchanged.

Every capture retains `resource_item_attribution` and `queue_resource_runtime_authority_unverified`. Source wiring
replaces the former absent-caller gap, but no mocked trace removes the real-authority/evidence debt. No normalized
`productionEvidence`, recipe, scenario registration, denominator or causal acceptance gate changed.

**Source review and audits:** traced all charge/refund callers, before/after insertion/removal handles, denied return,
separate cancellation forwarding, public research type consumer, save/restore queue context, display projection and
existing diagnostic teardown/caps. Omission Audit retains the missing two-peer world and normalized evidence as
unfinished implementation. Separate Final Closure Audit reviewed the complete grouped diff, exact owned staging,
comments and deferred gates. No skill/tooling policy was changed.

**Known final-gate test setup debt:** the shared Angular Phaser mock omits `Phaser.Events.EventEmitter` and lifecycle
constants used by earlier observer/capture specs. The new shared-path fixture locally loads Phaser's headless event
implementation and supplies its object-destroy constant. Repair the existing selected specs' setup at the final gate;
do not mistake mock setup failure for gameplay evidence. This discovery is source inspection, not an executed failure.

**Next exact authoring action — retain GPT-6.1 Sol / high:** extend the existing two-peer `MapAiMultiplayer` harness
(`skirmish-ai-multiplayer-match.ts`, observation/diagnostics adapter and command bus) with both-peer legal paid setup
and a genuinely buffered cancellation/pre-credit rejection world. The probe must be rejected before cancellation
credit while cancellation is pending; same-batch cancellation then probe and local deterministic dispatch are invalid
proof. Group with normalization of actual capture/outcome evidence and legal PRO-07 worlds without relaxing gates.
Commit/push and pause at that bounded authoring boundary. At this checkpoint shared callers were authored and the world remained not_started. The buffered-world checkpoint
below now authors the narrow socket boundary and its normalization; full causal production evidence remains unfinished.

At the announced final gate, run this combined caller/observer selection, then the existing pending/setup/payment/
digest/oracle selections linked above, frozen-map preflight, legal production worlds and socket-backed proof:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='shared-queue-resource|emit-queue-item-resource|project-ai-runtime-queue-resource|ai-runtime-production-capture|install-ai-runtime-production-capture' --skip-nx-cache
```

All tests/E2E/simulations, formatting/lint/type/build/editor/schema/repository checks and doctor/context remain **unrun**.


### Production buffered multiplayer world checkpoint (2026-10-03, unverified)

This batch began at `2b6a4a036fa3a837f73ea528313eadbf24afa9e1` in
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`. Its containing commit owns the
latest revision. Actual model/effort is unavailable; retain **GPT-6.1 Sol / high** for related authority/world work.
Source authoring only: no executable checks ran and no issue/family closes.

| Acceptance | Authored source/consumer | Status and deferred evidence |
| --- | --- | --- |
| 1. Both-peer legal paid setup | `prepareAiMultiplayerQueueWorld`, opt-in match marker, `AiMultiplayerQueueWorld` | Existing ready owned land-worker producer; mirrored definition cash at tick one; paid item admitted by real socket command; bootstrap/payment/parity unrun |
| 2. Genuine buffered order | World simulation-tick state machine and normal host `dispatch` | Probe first; cancellation requested next tick before probe executes, cancellation scheduled later; no local deterministic dispatch; relay timing unrun |
| 3. Authority capture/normalization | Human-only `captureHumanQueueBoundary`; named snapshots and `normalizeMultiplayerQueueBoundary` | Null AI input; exact item/price/callback/cash/outcome/request lineage, physical removal and newly indexed resumed actor; wider raw gaps and full production gates retained |
| 4. Negative/real test authoring | World scheduling Jest spec, capture/diagnostics specs, Playwright queue-refund and normalization specs | Authored/unrun; actual two-peer relay/hash case separate from synthetic contract inputs |
| 5. Audits/publication | Source implementation review, Omission Audit and separate Final Closure Audit, updated handoff | Source-only; scoped commit/push and remote SHA verification at delivery; tests/validation explicitly deferred |

**Setup/ownership:** only the existing localhost/development multiplayer diagnostics plus the new explicit
`fuzzy-waddle:ai-multiplayer-queue-world-v1=cancel-refund` marker install this test-owned mutator. Both peers use the
same host-human producer and effective definition, without injecting AI state or a fake queue item. Starting cash is
`2 * price - floor(price * refundFactor)` for every resource, so a real initial payment leaves cash insufficient for
the probe but sufficient after the actual shared refund. The marked world chooses a land worker rather than a boat
whose completion cannot be established on this map. Eligibility/application still belong to the existing shared path.
The paid item is created on both peers by the one real relayed purchase, with the actual stamped command context.

**Scheduling:** source inspection established that back-to-back `dispatch` calls can share the same future tick;
pendingOutbound insertion does not advance the bus send cursor. The world therefore waits a simulation tick between
probe and cancellation. It requires `cancelRequestedTick < probeExecutionTick < cancelExecutionTick`, records the
actual sender request/dispatch outcome and keeps remote delivery separate. A skipped clock or synchronous/local
application fails closed. The sender waits until after actual refund application before resuming. Completion also
waits for actual indexed actor presence because spawning can await navigation/object initialization. The experiment
is a shared authority probe, not a claimed strategy decision or useful-force policy world.

**Capture/evidence:** named ready/paid/cancel-pending/rejected/refunded/resumed/complete snapshots use actual human
queue/cash authority. Human capture rejects AI players, and the existing settled decision requirement remains intact.
Raw facts retain existing bounds/drop counts/gaps and detached physical item identities. Passive browser polling
returns cached records. The normalizer requires one actual started/callback/finished operation for each payment,
valid scoped balances and exact stored prices/refund formula; original purchase and cancellation IDs remain distinct.
It requires exactly one applied purchase, an actual insufficient-resource rejection, cancellation terminals and a
resumed applied/completed item with new world identity. Both peers must agree on stamped commands, scoped payments,
physical checkpoints and two post-completion real hashes. Failure attachments retain bounded credential-free facts.
Shutdown/destroy disposes both subscriptions and capture; no save/relay schema or gameplay price changed.

**Limits:** no `RuntimeProductionEvidenceV1` is manufactured. Broad raw authority/fairness/navigation/cadence/restore
provenance gaps remain. The deliberate same-product retry isolates refund affordability, while the mandatory PRO-07
oracle still rejects cancel/requeue cycles. This socket case therefore cannot be counted as a full PRO-07 recipe,
strategy proof, pure-family coverage or #819 parity. No manifest/recipe/denominator/causal gate changed.

**Omission Audit:** traced diagnostics registration, both-context marker installation, real bus versus deterministic
paths, future scheduling, actual shared queue/refund callbacks, sender versus remote ownership, item identity,
resource start and human capture gate, async spawn/index boundary, passive polling, test discovery and teardown.
Full distinct PRO-07 worlds and genuine production-family normalization remain explicit unfinished implementation.
**Separate Final Closure Audit:** reviewed the repaired grouped scope against acceptance, including failed dispatch,
clock skip, stale/missing payment records, truncated capture, reused actor identity and ordinary marker-free behavior.
The final gate must establish live bootstrap/payment/relay/index/hash results; source review is not runtime proof.

**Next exact action:** retain the same model/effort and author distinct legal PRO-07 shared train/research contention
and strategic paid-cancellation worlds, then connect genuine full production evidence using actual committed AI
inputs, fair reachability, queue snapshots and item-scoped callbacks. Reuse the new narrow socket boundary evidence
without changing the family oracle or counting human/synthetic facts as AI strategy. Group related PRO-03/06
normalization/world work when dependency-compatible. Commit/push and pause at the next bounded authoring boundary.

At the announced final gate, repair the previously recorded shared Phaser mock setup and run the affected selection:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='ai-multiplayer-queue-world|ai-multiplayer-diagnostics|ai-runtime-production-capture|shared-queue-resource|emit-queue-item-resource|project-ai-runtime-queue-resource' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.multiplayer.config.ts --grep 'synthetic contract tests'
pnpm ai:skirmish:multiplayer
```

The synthetic Playwright command still uses the existing multiplayer config; its configured local servers require
the normal local stack/environment. The multiplayer launcher discovers credentials from the existing local Supabase stack and
runs the registered socket cases; do not print credentials or substitute local single-player application. Follow
with the existing preset/pending/payment/digest/oracle selections, frozen-map preflight and full causal worlds.
All tests/E2E/simulations, formatting/lint/type/build/editor/schema/repository checks and doctor/context remain unrun.


### Production distinct shared queue worlds checkpoint (2026-10-03, unverified)

This grouped authority batch began at `486e2a7a63f18710228aea8667f9d4407f79b846`. It authors two distinct human socket
worlds and their narrow normalization. It does **not** complete PRO-07, prove useful AI strategy, populate
`RuntimeProductionEvidenceV1`, register family coverage or close #815/#816/#819. All executable validation is deferred.

| Acceptance | Source path / consumer | Status and final-gate evidence |
| --- | --- | --- |
| 1. Legal shared capability setup | `prepareAiMultiplayerSharedQueueWorld`, setup Jest spec, existing two-peer match launcher | Authored: indexed ready human producer, one physical lane with capacity >=2, definition-backed worker and faction/prerequisite eligible tech. Both peers mirror only cash at tick one. Live bootstrap/shared preflight remains unverified. |
| 2. Distinct shared authority worlds | `AiMultiplayerSharedQueueWorld`, diagnostics opt-in, two socket specs | Authored: train/research coexistence and paid research cancellation with a different technology probe/resumption. Only human slot one sends ordinary buffered commands. Real outcomes, tech registration, indexed owned worker variants and twenty-tick effect presence are required. |
| 3. Item-scoped normalization | `normalizeRuntimeScopedQueuePayments`, `normalizeMultiplayerSharedQueueWorld`, `evaluateMultiplayerResearchCancellation` | Authored: complete scoped triples, whole purchase/cancel execution lineage, stored prices, actual progress-dependent refund and cash, physical items, strict sequence, genuine sender request and independent completion. Raw wider gaps stay present. Full AI adapter remains unfinished. |
| 4. Registered meaningful regressions | new Phaser setup/world specs and `skirmish-ai-multiplayer-shared-queue*.spec.ts` | Authored/unrun: mocked legal setup/scheduling/passivity/teardown/effect loss, synthetic adapter contract cases and two actual socket cases. Existing multiplayer config glob discovers the new specs; no matrix coverage is claimed. |
| 5. Review, handoff and publication | current handoff and this checkpoint | Source-only implementation review, Omission Audit, then separate Final Closure Audit; task-owned commit/push and remote verification. No executable checks. |

The separate storage marker `fuzzy-waddle:ai-multiplayer-shared-queue-world-v1` accepts `shared_contention` or
`cancel_research` only. Existing development/localhost/multiplayer diagnostics gating owns installation. Combining this
marker with the older worker refund opt-in is rejected before either experiment is constructed. Ordinary diagnostics
retain null optional worlds. Reading snapshots never invokes an AI controller, samples authority or dispatches commands.
Scene teardown fences both subscriptions and retained records.

The contention branch uses the existing ready producer's real shared lane for two paid orders. It waits for both a
command-linked spawned worker and actual tech registration, then checks effects every simulation tick for twenty ticks.
Worker aliases are read from the runtime definition's `randomOfType`; a male/female variant is not rejected merely
because its concrete name differs from the purchased worker alias. Actual ownership, active scene and non-killed state
are required. These are authority effects; a technology's strategic usefulness to the AI is still missing evidence.

The cancellation branch pays for technology A and probes **different** technology B. Starting cash is A's stored
price plus `max(0, B price - conservative refund bound)` per resource. The bound uses A's definition refund factor and
at most twenty 50ms progress ticks. At least one refunded resource must cause a real B shortfall. Cancellation must
apply inside that actual window; normalization checks the emitted refund using A's actual remaining/total time and
existing `floor(price * refundFactor * (1 - progress))` formula. The expected bound is never applied as money.
As in the earlier socket experiment, probe dispatch and cancellation request occur on separate simulation ticks,
request < probe application < cancellation application, and B is retried only after real refund credit. A is never
requeued. Research's existing refund-before-removal/source-terminal ordering remains unchanged.

The reusable semantic queue-command equality now also understands research and cancellation, retaining every stamped
execution field. The earlier worker-only normalizer uses the same helper without changing its experiment contract.
New scoped payment normalization accepts only immediate item-backed triples for these worlds, rejects incomplete
operations, generic cash substitution, wrong callback ordinal/provenance, restore/nesting/overflow and mismatched
balances. It is not yet a per-tick/remaining-obligation or full production-evidence adapter. The world proof retains
raw gap labels instead of clearing absent AI, fair reachability, decision cadence, restore and initial setup provenance.

**Omission Audit:** traced marker -> development diagnostics -> first mirrored tick -> indexed capability/definition
selection -> ordinary socket dispatch -> shared component charge/item/outcome -> request/probe/refund -> different
purchase -> actual tech/spawn -> stable presence -> normalization/attachments/hash consumer. New specs are discovered
by the existing config. No deterministic multiplayer dispatch, seeded queue, injected AI state, hidden opponent input,
family oracle relaxation or manifest/catalog change was added. The source review repaired worker alias matching and
strengthened scoped metadata/outcome lineage and ownership checks. Both-faction setup, useful AI cancellation and full
normalization are explicit next-batch work rather than accepted requirements.

**Separate Final Closure Audit:** re-read the bounded source owners, immediate helper/diagnostic/browser consumers,
source provenance and exact staged scope after repairs. Checks remain deferred; source review is not validation.
No skill/tool policy changed. No issue/family is declared complete. Existing source owners remain bounded; no baseline
hash was refreshed. Remote publication is verified after the containing commit.

**Next exact authoring action:** author genuine committed-AI boundary/claim/obligation normalization for
`RuntimeProductionEvidenceV1`, preserve absent proof as failures, and legal Skaduwee research-producer setup. Then
connect actual useful AI contending/strategic cancellation worlds and dependency-compatible PRO-03/06 pairs. Current
human socket worlds supply reusable shared authority only. Retain **GPT-6.1 Sol / high** for this grouped authority
work; actual running model/effort is unavailable. Commit/push this bounded batch and pause.

At the final gate, add these commands to the earlier oracle/capture/policy/map/shared-caller selections:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='ai-multiplayer-shared-queue-world|prepare-ai-multiplayer-shared-queue-world|ai-multiplayer-diagnostics|ai-multiplayer-queue-world|ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.multiplayer.config.ts --grep 'synthetic contract tests'
pnpm ai:skirmish:multiplayer
```

The pure Playwright command still invokes the existing API/portal config and needs its local stack/environment. The
multiplayer launcher discovers local Supabase credentials without printing them. All commands above are unrun. Existing
Phaser mock emitter/lifecycle omissions remain final-gate repair work. The family oracle continues to reject missing
full evidence, missing both-faction branch worlds and same-product cancellation/requeue cycles.


### Production AI causality checkpoint (2026-10-03, unverified)

This bounded grouped adapter batch began at `e658318ae81b5dd9bd7618f0c3d4a70e557d19d3`. It connects actual accepted
AI intent to queue authority and report diagnostics. It does **not** populate `RuntimeProductionEvidenceV1`, establish
AI strategic usefulness, author the missing legal Skaduwee world or close PRO-03/06/07 or #815/#816/#819. Those remain
unfinished implementation, independent of the user's deferred validation policy.

| Acceptance | Source / consumer | Status and remaining evidence |
| --- | --- | --- |
| 1. Preserve accepted intent identity | `AiIntentCommandDispatchEvent`, `dispatchAiIntentCommand`, adjacent Jest spec | Authored: detached full accepted intent before actual bus call, retaining plan/demand/claims. Older diagnostics may omit the optional field; AI normalization rejects that omission. Actual committed decision identity still missing. |
| 2. Link request to shared authority | `validateRuntimeProductionCommandLineage`, `normalizeRuntimeProductionCausality` | Authored: strict observer order, correlation/payload, authority stamp, admission/delivery/outcome lineage, retries separated by request scope, pending and synchronous paths. No plan inferred from strings or neighboring snapshots. |
| 3. Retain scoped AI money | same normalizer and existing `normalizeRuntimeScopedQueuePayments` | Authored: actual AI origin and separate cancellation, exact immediate triples, stored-price charge, actual progress refund formula. Denied/per-tick/unknown payments retain gaps; missing application payment/refund stays explicit. Event-time claims/obligations still missing. |
| 4. Register consumers and regressions | `RuntimeVariantResultV1`, `runVariant`, `evaluateRuntimeProductionCausality`, `evaluateRuntimeVariant`, new synthetic Playwright spec | Authored/unrun: real runner emits causal diagnostics beside raw capture; only mandatory causal production rows surface their gaps/failures. Default Playwright config discovers the new spec. Mandatory full evidence oracle remains unchanged. |
| 5. Review, handoff, publication | handoff and this checkpoint | Source-only review and Omission Audit, separate Final Closure Audit, exact task-owned commit/push and remote verification; executable checks deferred. |

`RuntimeProductionCausalityV1` is a detached diagnostic, not a narrower spelling of full production evidence. Its
command records retain accepted intent, real request/receipt sequence, stamped command and actual delivered/outcome
facts. Application can occur before the finished receipt in single-player; a pending multiplayer command needs its
real admission but must not be given invented delivery. Request and intended tick remain distinct. Wrong/duplicate
stamps, payload, claims, callback order, truncated capture or missing dispatch scope fail closed. Human receipt/payment
records are excluded rather than relabeled as AI intent. Any causal failure suppresses normalized money; raw facts remain.

Scoped payments require the original accepted AI purchase and the actual distinct cancellation command. Refund
normalization uses the stored price and actual remaining/total progress with the existing arithmetic ordering, never
an expected cash credit. Generic resource events cannot replace missing item operations. Full raw gaps stay attached,
with explicit missing committed-decision link, event-time liabilities, runtime definition catalog and paired setup.
Per-tick/denied/unknown operations are not promoted to complete payment proof. Catalog, useful demand, fair producer
geometry/readiness, effect stability and lease states still require their own actual authorities.

The synthetic helper deliberately adds invented accepted intents to existing synthetic queue-shape contracts. Its
prices remain synthetic. This is not the adapter for the real human socket worlds, not a browser fixture, and never
runs inside the game or registers matrix coverage. The actual runner gets its intents only from production dispatch
callbacks. Tests cover two branches, full intent detachment, pending/synchronous ordering, missing/changed provenance,
duplicate delivery, callback/capture loss, absent item payments, incorrect refund progress and unchanged oracle gating.
All assertions are authored, not executed; local bootstrap, module/type contracts and live outcomes remain unverified.

**Omission Audit:** traced accepted controller result -> intent dispatcher -> diagnostic before real bus call -> raw
capture -> normalization -> real variant result -> mandatory production report evaluation. Reviewed backward optional
records, ordinary no-listener dispatch, correlation retries, same-tick callback order, delayed admission, item/cancel
lineage, missing payments and test discovery. No save/wire schema, gameplay rule, family recipe, coverage denominator,
full oracle or source baseline was changed. Full adapter fields and legal strategic both-faction worlds are explicitly
unfinished, so this checkpoint closes only the causal-link authoring substep.

**Separate Final Closure Audit:** after source repairs, revisited the numbered acceptance and immediate callers,
helper ownership, stale comments, detached/bounded records, exact staged scope and both report gates. No executable
validation was performed. No skill/tool policy change, new worktree, thread, branch or PR was required. Publication
is verified after the containing commit; the integration PR remains draft.

**Next exact action:** add actual committed-decision identity and operation-time reservations/liabilities, then the
fair snapshot/catalog/setup projection needed by `RuntimeProductionEvidenceV1`. Preserve absent evidence as failures.
Follow with legal Skaduwee research-producer setup and actual useful AI contention/cancellation worlds; group compatible
PRO-03/06 pairs. Retain **GPT-6.1 Sol / high** because the remaining work crosses decision, queue and authority contracts.
Actual model/effort is unavailable. Continue authoring only, then commit/push and pause at the next bounded batch.

At the final gate, add to the existing capture/pending/shared payment/production oracle/socket selections:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='dispatch-ai-intent-command|ai-runtime-pending-commands|ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

The default Playwright config starts the local portal; this contract spec does not provision socket identities. The
existing multiplayer selection still owns the human worlds. All tests/E2E/simulations, formatting/lint/types/build/
editor/schema/repository checks and doctor/context/catalog commands remain unrun. Repair shared Phaser mock emitter/
lifecycle omissions at that gate, then execute the full actual-world evidence; these contracts cannot count as it.


### Production AI decision and boundary checkpoint (2026-10-03, unverified)

This grouped authoring batch began at `1f96cde194828d88eba46a1e9d1c894ad56ff497`. It closes the accepting-result
linkage and raw callback-state substep, not the full production adapter, useful strategy, both-faction worlds or
PRO-03/06/07/#815/#816/#819. Tests and every executable validation remain deferred by user policy.

| Acceptance | Owner / consumer | Authored evidence and remaining gate |
| --- | --- | --- |
| 1. Genuine accepting result | `PlayerAiController.stepPureBrain`, `dispatchAiBrainResult`, `AiDecisionDispatchEvent`, `AiDecisionIdentity`, `dispatchAiIntents` | Actual result published before any dispatch; native debug generation/tick/sequence plus bridge epoch, whole accepted intents/decisions and selected leases. Ordinary listener-free dispatch keeps its original path. Saved brain update ordering is unchanged. |
| 2. Exact request identity | `AiIntentCommandDispatchEvent`, `dispatchAiIntentCommand`, `matchRuntimeProductionDecision` | Detached key on each actual request; exactly one preceding same-observer-tick result, full semantic proposal/accepted arbitration and bus-epoch equality. Several commands may share one result. Legacy absence stays a gap; supplied mismatch fails and suppresses normalized money. |
| 3. Raw operation-time authority | `AiRuntimeProductionBoundaryState`, `projectAiRuntimeProductionBoundaryState`, `AiRuntimeProductionCapture` | At real dispatch/outcome/delivery/queue/resource callbacks: actual cash, physical queues/remaining costs, saved leases with native tick/sequence and pending ownership. Outcomes sample before and after diagnostic ledger changes. Invalid/missing/overflow authority stays null, never zero. |
| 4. Real consumer and meaningful contracts | `RuntimeProductionCausalityV1`, existing real `runVariant` / report path, helper/capture Jest and new decision Playwright spec | Exact decision/request boundary plus raw operation records survive the existing report consumer. Ordered/detached/missing/contradictory/shared-decision/empty-result/error/queue-invalid/pending/sample-phase contracts authored, all unrun. Full production gate remains unchanged. |
| 5. Scope review and publication | handoff and this checkpoint, exact staged source/docs/baseline removal | Source-only review, Omission Audit, separate Final Closure Audit, authorized task-owned commit/push with remote SHA verification. No execution evidence or completed family is claimed. |

The accepting-result event is a local diagnostic of the actual result chosen for dispatch. It is emitted even when no
intents are accepted, before synchronous bus effects and before the controller saves nextState/debug history. It retains
selected reservations separately from callback-time saved leases. A thrown command prevents normal saved-state adoption;
existing dispatch exception/causal failures still reject evidence. Nothing is persisted or sent over the relay.
Native identity is scoped to the retained capture and epoch, not minted from an intent reason or matched to a nearby
snapshot. The Node-side adapter uses deep semantic equality on the full typed proposal, independent of key ordering.

Boundary projection is passive, test-capture-only and detached. It reuses the indexed owned active non-killed actors,
physical lane projector, shared successful-charge arithmetic and actual balance sampler. Bounds are 256 actors,
2,048 physical items and 512 saved reservations per projection, within the existing 8,192-fact capture. Exceeding them
retains null authority and explicit gaps rather than partial proof. Invalid item progress/cost/identity likewise stays
null. The callback ledger's full admitted claims remain independent of physical queue liabilities. The outcome's
before/after samples refer to pending-ledger ownership, not pre-application world state: the shared callback may already
follow actual component application. Existing initial/restore/pre-registration/navigation/cadence gaps remain attached.

**Remaining authority:** saved reservations advance on decision boundaries, so their observation at an operation cannot
by itself prove reconciled unspent claims. Selected-result leases and actual pending/outcome/payment lineage now provide
inputs, but `production_boundary_unspent_reconciliation_missing` remains on every boundary. Full event liabilities
also remain missing. Shared per-tick payment emits its finished callback before the queue decrements remaining time;
that sample intentionally keeps the old remaining cost. Queue-change samples expose later physical changes when an
actual queue-change callback occurs. The authored regression manually drives such a later callback; it does not claim
that every real progress tick emits queue change. A genuine post-progress hook/lineage is required before promotion.
No nearest-checkpoint, zero-vector, expected refund or hypothetical successful tick fills these fields.

The default Playwright configuration discovers `skirmish-ai-runtime-production-decision-lineage.spec.ts`; multiplayer
socket test discovery is unchanged. Synthetic decisions are explicitly invented contract inputs, not runtime planner
selection, fair setup or useful effects. Missing key remains a missing-decision gap even beside a plausible result.
Contradictory supplied keys, duplicate records, rejected/changed proposals, future records and epoch/sequence mismatch
fail closed. The full mandatory production oracle still rejects absent `RuntimeProductionEvidenceV1`.

**Omission Audit:** traced actual brain step -> accepting-result helper -> fenced accepted dispatch -> all economic/
combat/control translations -> before-bus requested scope -> raw decision/operation callback capture -> native identity
matching -> real result/report diagnostics. Reviewed synchronous and buffered ordering, pre-progress finish, stale saved
leases, pending admission/retirement, null/overflow samples and scene disposal. No full oracle, gameplay payment rule,
family manifest/recipe/denominator, save/wire schema or balance threshold changed. Controller source width debt was
reflowed and its one baseline entry removed without updating hashes. Existing reflection-based dispatch regression gets
an explicit no-listener scene fixture. Full claims reconciliation and stable useful worlds remain unfinished.

**Separate Final Closure Audit:** after source repairs, revisited all five acceptance items, immediate caller guards,
report/test registration, captured references/bounds, stale documentation and exact staged ownership. No executable
checks ran and no pass is claimed. No skill/tool policy change, new worktree/branch/thread/PR or model switch. The
integration PR remains draft. Verify the containing commit and remote SHA on resume; publication is checked after it.

**Next exact action:** implement operation-time unspent reconciliation from actual selected leases, admissions and
item-scoped payments/outcomes, plus a real post-progress boundary for remaining successful charges. Then populate the
full fair snapshot/catalog/setup adapter, legal Skaduwee setup and useful strategic AI cancellation/contention worlds.
Group compatible PRO-03/06 pairs. Retain **GPT-6.1 Sol / high** for this authority work; actual model/effort is unknown.
Continue authoring only, commit/push, then pause at the next bounded batch.

Add these unrun commands at the final gate, with all prior pending/payment/oracle/socket selections:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPattern='player-ai-controller.spec|dispatch-ai-brain-result|dispatch-ai-intent-command|ai-runtime-production-capture|ai-runtime-pending-commands' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-decision-lineage.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

The default config starts the local portal; these pure contract specs do not provision socket identities. At the final
gate repair the shared Phaser mock emitter/lifecycle omissions, then run affected focused and actual-world checks.
All tests/E2E/simulations, formatting/lint/types/build/editor/schema/repository checks and doctor/context/catalog remain
unrun. Sampling overhead and live bootstrap/outcomes are unmeasured, not accepted production evidence.


### Production queue claims and progress checkpoint (2026-10-04, unverified)

This coherent authoring batch began at `59f72e037751e66078338c8e245aa7f062802313`. The unrelated upstream/Nx merge
is retained; the owned diff changes no migration/config/package files. This closes the scoped queue-claim ledger and
real post-progress hook authoring substep, not complete production evidence or PRO-03/06/07/#815/#816/#819.
Actual model/effort is unknown. Recommendation remains **GPT-6.1 Sol / high**; no model switch was performed.

| Acceptance | Owner / consumer | Evidence / status |
| --- | --- | --- |
| 1. Selected cash ownership once | `AiRuntimeUnspentClaims`, `AiRuntimeUnspentClaimsV1`, production capture | Authored: exact accepted queue claims/selected resource leases, request identity/payload, real admission and scoped payment/physical queue transfer. Forecasts, spent/refundable work and pending diagnostic claims are not counted again. Unsupported/pre-capture/migrated/invalid/overflow ownership stays null. |
| 2. Genuine progress boundary | `advanceSharedQueueItem`, `QueueProgressEvent`, actual `QueueComponent` production/research callers | Authored: before real payment and after actual decrement/clamp, before progress callbacks/completion. Denial/exception preserves progress. Ordinary no-listener path, prices, fixed 50 ms clock and completion order are retained. |
| 3. Exact operation-time liabilities | boundary projector, `AiRuntimeQueueProgressV1`, capture | Authored: detached live head/lane identity, actual cash/queues and future-charge vectors. Only the genuinely advanced exhausted zero head is excluded before removal; unprocessed zero heads/waiting lanes retain charges. Capture disposes hook and claim ledger. |
| 4. Real diagnostic consumer and contracts | `validateRuntimeProductionProgress`, `calculateRuntimeQueueLiabilities`, existing causal normalizer/report; Jest and Playwright specs | Authored/unrun: native attempt/payment identity/order, whole cash delta, exact progress, unchanged other items/lanes, independently computed absolute liabilities and one successful-charge reduction. Missing authority stays a gap; contradictions fail. Existing full oracle remains mandatory. |
| 5. Review/handoff/publication | this checkpoint and quick resume | Source-only implementation review and Omission Audit; separate Final Closure Audit after repairs/staging. Exact owned commit/push and remote verification at publication. All executable validation deferred. |

**Ownership details:** amounts come from full accepted claims and exact native selected provisional leases, never
parsed resource-subject strings or forecast prerequisites. Entries retain full accepting identity/proposal and actual
command id. Selected/admitted entries contribute cash once. A real rejected admission or terminal outcome releases it;
a validated immediate charge marks paid. An actual command-backed pay-over-time insertion transfers the accepted claim
to the physical remaining-charge owner. The existing pending ledger remains independently visible and can lag payment.
The saved brain still updates after dispatch, so it cannot substitute for this operation-time owner.

The ledger retains at most 512 entries per player; selected decisions/leases also have a 512 guard. Overflow fails
closed instead of exposing partial money. Omitted unadmitted/settled leases retire at a genuine selecting decision;
admitted or physical-liability ownership survives stale decision leases until real outcomes settle it. Unknown
non-queue resource purchases and prior/migrated resource ownership remain explicit limitations. A callback in the
middle of an immediate emission is temporarily unknown until the complete operation returns; raw callback gaps remain
attached to diagnostic normalization. No refund prediction creates cash or another unspent claim.

**Progress details:** the scene-local attempt id is diagnostic only and is not persisted/relayed. Native resource
operation ids remain separate. Started/advanced/denied/threw callbacks retain the live item before/after processing;
retained facts project it immediately, never store handles. A per-tick finished money callback is still pre-progress.
The new advanced callback reads the actual later state, not an adjusted earlier sample. Both callbacks occur before
UI progress subscribers and asynchronous production completion can remove/spawn items. Missing production components
retain the original no-processing return; denied payment and exceptions retain the original no-progress behavior.

At the final paid head, physical remaining time is zero while the head is still present. Its exact
`exhaustedProgressItemId` excludes that successfully processed item from future charges at this callback. Other
zero-time heads/waiting items are not excluded; they still enter one actual payment branch. Queue completion/removal,
research registration, terminal outcomes, prices/refund formulas and planner behavior are unchanged.

Node diagnostics require two same-tick ordered attempt callbacks, command-backed producer/item/native origin,
fixed-step progress, untouched remaining lanes/items, exact scoped charge triples (or an actual denied attempt),
whole cash delta and one stored-vector liability reduction. They independently recompute the absolute charge vector
from all physical lanes, so two consistently inflated before/after vectors cannot pass. Missing state/command is a
named gap; duplicate scope, altered progress/payment/epoch/cash/remaining liabilities or restore is rejected. This
remains a diagnostic slice: per-tick money is not promoted into the existing immediate-payment list, and complete
`RuntimeProductionEvidenceV1`, fair geometry/useful effects/catalog/setup/cadence/restore proof remain unfinished.

**Authored checks:** `advance-shared-queue-item.spec.ts` drives the actual fixed-tick `QueueComponent`; capture boundary
specs exercise the real helper with actual scoped emitter callbacks. The old manual-progress capture assertion is
replaced by this genuine hook case, retaining pre-progress cash/liability assertions. Shared mutable synthetic scene
setup lives in `ai-runtime-production-capture-fixtures.ts` to keep specs bounded. Claim specs cover selection/admission,
payment, physical transfer, forecast/release, pending/spent distinction, absent/mismatched/duplicate/lost ownership,
migrated subjects and overflow. The default Playwright config discovers the new progress contract spec; its invented
prices/queues/decisions never count as runtime coverage. No assertion has been executed.

**Omission Audit:** traced real pure result -> native request -> shared admission/payment/queue insertion/outcomes ->
claim ledger -> exact boundary projection, and actual fixed-tick queue -> helper -> capture -> Node attempt/liability
validator -> existing causal result/report. Reviewed synchronous versus buffered ordering, stale saved leases, initial
zero heads, final paid heads, waiting lanes, refunds/rejections, incomplete payment, fail-closed overflow, detached
retention and disposal. No full oracle/coverage/recipe/balance threshold, save/wire schema, source baseline or migration
was changed. Full global resource ownership and actual useful strategic worlds are explicitly unfinished.

**Separate Final Closure Audit:** after source repairs, revisited all five acceptance items, actual controller/queue
consumers, synthetic versus real provenance, listener-free path, test discovery, new source ownership, stale comments
and exact staged scope. No check ran or pass is claimed. No new worktree/branch/thread/PR/agent or model switch. The
existing integration PR remains draft. Publication SHA is checked after the containing commit; verify it on resume.

**Next exact authoring action:** complete the production operation-event adapter using exact decision/request,
scoped payment and real post-progress records. Resolve non-queue claimed purchases and prior/restore leases from their
actual shared authorities, then project fair ready/reachable producers, useful stable products/tech, runtime definition
catalog and paired setup into full evidence. Keep missing inputs explicit. Follow with legal Skaduwee research setup
and useful strategic AI contention/cancellation worlds; group compatible PRO-03/06 pairs. Continue implementation only,
commit/push, then pause. Retain **GPT-6.1 Sol / high** for the remaining cross-authority design.

Add these **unrun proposed commands** to the final gate, alongside prior decision/pending/payment/oracle/socket checks:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='advance-shared-queue-item|ai-runtime-production-boundaries|ai-runtime-unspent-claims|ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-progress.spec.ts skirmish-ai-runtime-production-decision-lineage.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

The merged package declarations are Nx 23.2.1/Jest 30.3.0/Phaser 4.2.1. Review dependency installation and older singular
`testPathPattern` commands at the final gate rather than reverting the migration. The default Playwright config starts
the portal; pure contract specs do not provision socket identities. Shared Phaser mock emitter/lifecycle omissions
remain unverified debt. All tests/E2E/simulations, format/lint/type/build/editor/schema/repository checks and
doctor/context/catalog commands remain deferred. Measure capture pressure and overhead, live bootstrap and actual
both-faction outcomes at the final gate; source-only review does not establish any of them.
