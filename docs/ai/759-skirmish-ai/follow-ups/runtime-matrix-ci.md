# Playwright runtime matrix and CI — #816

## Outcome

All supported runtime-required scenarios launch a real lobby-created Phaser match, observe authoritative effects, and run
as fail-closed required pre-merge shards with useful retained artifacts.

Recommended agent: **GPT-6.1 Sol / medium** across related family helpers, assertions and causal contracts;
high effort when a concrete unresolved problem warrants it. Optional **GPT-6 Luna / high** for specified routine work. Follow the handoff's
[model batches and pause contract](../HANDOFF.md#model-batches-and-pause-contract), including its exact next batch.

Estimated effort: **XXL risk envelope**, not 97 separate browser worlds: the current catalog has 97 supported runtime
rows without recipes, plus frozen maps, independent outcome oracles, CI wiring and final-gameplay repair. About 10–20
focused agent sessions is a provisional planning range, not a measured calendar estimate. Re-estimate after the first
frozen map and two representative behavior families using actual fixture reuse, run time and failure rate.

Dependency: #824 tooling and #826 preset-world support already exist. Consume their contracts. Pair #815 and #816
by behavior family; short fixture authoring can proceed while continuous-match victory remains unproven. A known
broken shared setup/API blocks its dependent cases, but a red full-match result is not a blanket authoring dependency.
The handoff owns execution timing; the authorized final gate is now active.

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

### Health mutation fence checkpoint (2026-10-08, authored/unverified)

Stage 46 is based on `e5a5eb242970489ebd2c2d7e1c2967b9ecb56cf8` (45, remote verified); containing commit owns 46.
`HealthComponent` now invokes existing `fenceSceneResourceHistory(scene, "resource_actor_health_change")`:
changed health/armor setters after no-op checks but before assignments/events; definition replacement before assignment;
ready initialization before campaign modifier callbacks and direct initial writes; valid normal/silent kill entry before
suppression, zero health, scene/actor callbacks or destruction. Kill entry fences already-zero health too. Changed kill
can fence twice (entry plus setter); this conservative loss epoch is intentional and never dispatches an extra native event.
Existing recipient capture subscription/disposal owns sticky global loss; no additional listener/schema/budget is created.

Why used: a worker or drain damaged/healed/killed during a resource return can change readiness. The observation leaves native delivery policy unchanged: post-wait
recipient, campaign suppression, notification and full return when the native route completes; earlier need/service accounting
cannot certify continuity across that mutation. Any supported actor route loses global history, even outside cohorts.
No exhaustive dependency map is claimed. Exact native credit remains diagnostic; channels remain partial, usefulness null.

| Acceptance | Implemented source / authored evidence |
| --- | --- |
| 46.1 Setter / delegated routes | HealthComponent pre-write health/armor fence; health-component-resource-history spec controls prior state at loss, changed/same/empty restores, full/changed reset, heal, armor-first/zero damage, native reentrant reads and no cohort filter. |
| 46.2 Initialization / definition | Fence before modifier callback or definition assignment, including matching values. Authored controls cover modifier failure with original state/sticky loss, direct initialization without native events, and definition replacement retaining references. |
| 46.3 Death / failure / suppression | Valid normal/silent kill fences even at zero; invalid-active guard retained. Controls cover entry/setter/scene/actor ordering, immediate silent destruction, restore without death, damage-driven death, health/armor emitter throws and nested health dispatch. No observation-induced sound/death/event. |
| 46.4 Capture / native delivery | Real scene recipient subscriber/journal controls observer throw isolation, later native credit, disposal and fresh partial capture without backfill. health-component-drain-credit spec uses actual health and drain with controlled wait/emit adapter; actual Phaser gatherer damage/normal/silent death × normal/granted/none economy retain the live drain's balances, context, recipient, notification and full return. |
| 46.5 Reports / scope / delivery | Existing application report control parameterized for owner/health reasons through real coverage/subscriber/fence over synthetic accounting payloads. Loss nulls need/application bounds and usefulness, retains legacy diagnostic income/all partial channels. No public alias, construction/source/drain/platform authority claim. Tests/validation unrun; commit/push and pause. |

**Source Implementation Review:** traced every supported setter and delegated path, ready initialization and both kill
entries against original suppression/native callback order. Read recipient scene subscription/disposal and native drain's
post-await lookup/credit path. Authored report producer uses the same passive fence over synthetic payloads, not a real
health-driven match. Tests use real native health/drain/journal; visual/dependency lookup and emitResource adapter are
controlled. The cross-await gatherer is an actual Phaser GameObject; silent destruction clears its scene, while the
drain stays alive. Source review replaced an over-permissive destroyed-drain fixture; no destroyed-drain delivery guarantee
is claimed. Review also found that the earlier owner cross-await control returned a player-shaped wrapper from getPlayer;
protocol observation requires the actual player's state binding. Both owner and health controls now return real protocol
players with typed campaign controllers and assert the exact application operation. This repairs authored evidence only;
no production credit path changed. Observer callbacks are exception-isolated; native exceptions/reentrancy remain native. No timer/alias fix.

**Omission Audit:** 46.1–46.5 maps all batch requirements; new health-component-prefixed specs are selected by the
existing final-gate pattern. No unused registration, complete channel, new fact, persistence or broader baseline edit.
ConstructionSiteComponent direct writes remain known unsupported health routes; arbitrary public aliases also remain.
**Final Closure Audit (separate):** reread final health/fence/report/native controls and owning consumers after repairs.
All source-authoring obligations covered, exact task-owned publication follows; no executable evidence or issue closure.
Runtime capture cost/native compatibility remain unmeasured. No skill/tool change or durable proven contract was established.

#### Authored design batch: 47 construction health writer contract

Recommend **GPT-6.1 Sol / high** for this grouped authority design, then pause. Construction writes live health/armor
silently rather than through HealthComponent setters; routing them through setters could add reactions/native events.
The next decision must preserve those semantics while closing before callbacks and handling ready/progress/repair/restore.
This is a concrete remaining writer contract, not a request to reopen all resource-history design.

1. Audit exact `entity/components/construction/construction-site-component.ts` routes `setInitialHealth`, construction
   progress, `tryRepair`, completion/cancel and getData/setData/init; inspect named local helpers and callbacks. Inventory
   supported direct health/armor writes and actual references, including conditional/no-op and native failure order.
2. Inspect definition/technology recalculation callers of HealthComponent.setHealthDefinition in `data/tech-tree` and
   immediate consumers. Distinguish already-fenced facade routes from direct aliases; do not assert TechTreeService itself
   writes health without source evidence. Public arbitrary data/definition/component map edits remain unsupported.
3. Choose bounded pre-mutation fences preserving silent construction writes and unchanged construction/payment/repair
   events, simulation time and save semantics. Specify exact loss reason/reentrant/error/capture-disposal controls and
   conservative over-invalidation. Plan any baseline owner prerequisite separately; never refresh its hash.
4. Record exact subsequent implementation batch, model/effort, acceptance, source anchors and unrun final-gate commands
   in these existing docs. Design only: no construction/source/drain/platform runtime changes, new metric/schema/budget,
   useful activation, real interval recipe or executable validation. Commit/push the design and pause.

Purpose: construction progress and repair change actor readiness through exposed state. The next contract lets a later
fence close earlier resource history at those actual writers without accidentally introducing health sounds/events/death.
Source/drain capacity, complete lifetime, roster and arbitrary alias authorities remain subsequent open work.

### Construction health writer checkpoint (2026-10-08, source design only)

Stage 47 is based on `6011a432219678fcabad2a00f675964b83716507` (46, remote verified); containing commit owns
this design. No runtime or test code changed. Actual host model/effort is unknown; last user selection is Sol 6.1 / medium.
The source audit settles the next grouped implementation batch, **48–49**, recommended **GPT-6.1 Sol / medium**.
Keep both stages together and pause after 49; commit/push the prerequisite separately before hooks.

Why used: building work and repair silently mutate the same public health object used by native damage and UI reads.
A delivery after that work must not inherit an earlier claim of continuous readiness. Completion/restore can change
readiness even without health, so their native state transitions need explicit boundaries too. This design preserves
silent writes; it does not convert construction into health setters or create damage/heal reactions.

#### Exact source inventory and decision

Paths below are relative to `libs/games/probable-waffle/phaser/src/lib/`.

| Route / source anchor | Native order and reference / selected boundary |
| --- | --- |
| `entity/components/construction/construction-site-component.ts`: constructor / `init` / `setInitialHealth` | UI constructs first; ready callback precedes tick subscription and destroy/killed handlers. NotStarted ready resolves HealthComponent afresh, directly floors health then optional truthy-max armor; audio service then cached health lookup follow. Fence `resource_actor_health_change` after successful local health lookup and before the first health assignment, even matching values. No health means no health fence. Preserve eager/deferred readiness. |
| `tryBuild`: immediate and assigned-worker start | Immediate branch calls start then initial health even if a synchronous start subscriber changes state. Assigned-worker start does not call initial health. Do not add a second guard. Existing state/killed guards precede progress; killed uses the cached facade. |
| `startConstruction` | NotStarted check and production lookup/throw precede payment. Payment returns before remaining work and Constructing state assignments, lifecycle observation and state subject. Fence `resource_actor_construction_change` immediately after payment returns, before work/state writes. Payment failure keeps the native failure/state and adds no construction fence; an observer during payment still sees the pre-start site. |
| `tryBuild`: progress | After Constructing/alive guards, calculate work using automatic plus assigned/pending builder count and resolve production definition. Fence `resource_actor_construction_change` after successful definition lookup and before decrementing remaining work. Then retain health `+=` followed by clamp, optional armor `+=` then clamp, sound, completion, fraction and progress notification. This one boundary covers work and silent vitality writes, including zero-work/capped values and sites without health. Do not coalesce arithmetic or resample health before the fence. |
| `tryRepair` | Resolves current HealthComponent afresh; missing health, zero effective repairers and full health return before mutation. Calculate repair amount from the existing second count read, then fence `resource_actor_health_change` before health `+=`/clamp. Preserve zero-factor eligible repair's conservative fence, no armor repair, sound afterward and full-health `leaveRepairSite` callbacks. No setter/event/death call. |
| `finishConstruction` / `completeConstruction` | Fence `resource_actor_construction_change` at finish entry before Finished assignment and lifecycle/state callbacks, even without a preceding progress tick or health object. Preserve state notification → visible completion sound → optional builder destruction → actor upgrade → score event. `completeConstruction` already-finished return stays fence-free. Progress-triggered finish deliberately fences twice. |
| `setData` / `getData` | Fence `resource_actor_construction_change` at setData entry before any state/work/progress/sound/assignment writes or reference-resolution callbacks. Even empty/matching restore fences because it resolves references and emits restored/progress/state callbacks. Preserve pending ID copies and all-or-nothing resolution; getData remains read-only with identical saved fields. Construction restore itself does not restore health. |
| `cancelConstruction` / `onDestroy` | Finished cancellation returns; otherwise lookup/refund then each builder's order reset. No health or construction-state assignment: do not add a cancellation health fence or invent a terminal state/payment ledger. Teardown observes first, then cancellation, then tick unsubscribe; repeated killed/destroy cancellation and throw-before-unsubscribe remain native. Stage 46 covers valid health death entry; arbitrary raw destroy remains an incomplete lifetime route. |
| `tryResolveAssignedActorReferences`, assign/unassign methods | Pending counts drive progress/repair until every ID resolves; updates can change arrays before progress guards. No direct health writes here. Worker roster/assignment and complete capacity history remain unsupported; the selected fences do not certify those changes before the actual work/restore boundary. |

`construction-progress.ts` owns the existing vitality formula: nonpositive gain returns zero, nonpositive production
time returns the full missing vitality, otherwise scales by work. Retain two writes per health/armor gain, truthy armor
predicate, native non-finite/negative arithmetic and progress-fraction behavior; this batch is not balance or arithmetic repair.
`construction-payment.ts` retains the unusual start predicate `productionTime === PaymentType.PayImmediately`, current
definition refund sampling, flooring, owner argument and resource reference identity. Do not move fences ahead of payment
or wrap payment with a new callback. `observe-construction-authority.ts` remains the existing diagnostic emitter owner;
its observation follows native transitions and cannot serve as a pre-mutation substitute.

Completion's `data/actor-data.ts:upgradeFromConstructingToFullActorData` adds completed components/systems to the current
maps, optionally applies a supplied definition, then emits ActorDataChangedEvent. Construction calls it without a supplied
definition. Its no-actor-data fallback constructs full data and can replace components; the selected finish fence precedes
that call but does not establish exhaustive component-map authority. `applyActorDefinitionToActor` restores construction
before health. The new construction restore boundary therefore precedes construction callbacks even when later health
setData matches and its setter emits nothing. Public component/data/definition aliases remain unsupported.

#### Technology and immediate consumers

The only production `setHealthDefinition` call found in Phaser source is `data/actor-level-utils.ts:upgradeActorToLevel`.
After level/definition guards it changes animations and attack before calling the health facade, then regeneration,
vision, container and level. Stage 46 already loses history before health definition replacement, including matching
values; retain actual definition reference and reset-to-max setter behavior. Do not claim the whole multi-component
upgrade is fenced at entry: animation/attack callbacks precede health, and an upgrade without health has no health fence.

`entity/components/research/research-component.ts:handleResearchComplete` registers research (and its synchronous tech
event) before upgrading owned actors selected by ActorIndexSystem; completion notifications follow upgrades.
`data/tech-tree/tech-tree.service.ts` stores research/unlocks and emits registration, but has no direct health writer.
`world/services/scene-actor-creator.ts:createActorFromDefinition` upgrades saved level, then reapplies saved health through
facade setData. EditorActorLevel also calls upgradeActorToLevel. No duplicate technology health hook is planned.
Research set/definition aliases and non-health upgrade readiness remain incomplete authority, not silently covered.

ConstructionProgressUiComponent subscribes to the facade BehaviorSubject and destroys its own bar at 100; HealthPresentation
subscribes to construction state for visibility. Both must keep seeing their existing notifications and silent health data.
Existing `construction-site-component.spec.ts` exercises formula helpers only; `construction-lifecycle.spec.ts` uses the
real component with payment/upgrade/UI adapters. Neither is executed evidence of the new boundaries.

#### Next implementation batch: 48–49 construction presentation and history fence

**48 — behavior-preserving sound prerequisite.** Extract construction sound presentation into adjacent
`entity/components/construction/construction-presentation.ts`, with one focused class. The facade retains
playingBuildSound as the serialized field; helper reads/writes it through callbacks rather than duplicating state.
Move cached AudioService, visibility gates, sound selection and build/completion playback; initialize its service
at the original init lookup position before cached health lookup. Store helper before an eager ready callback can run.
Keep ConstructionProgressUiComponent construction, subjects, simulation subscription and destroy/killed ordering on
the facade. Preserve flag-before-play behavior, existing completion callback, native audio throws, visibility/RNG order
and optional completion audio. No new timers/listeners or late-callback cancellation. This isolates render/audio work
and leaves room for readable hooks under 400/200/140. The component currently has no baseline entry (removed in prior
construction extraction); no baseline hash refresh or invented exemption. Split only further stable responsibilities
if source inspection finds a real limit problem. Author eager/deferred init, sound guards/flag/save/restore/callback,
completion order and unchanged lifecycle/teardown controls; do not run them. Commit/push separately.

**49 — passive construction writer fences.** Add the exact boundaries/reasons in the inventory using existing
`data/scene-resource-observation.ts:fenceSceneResourceHistory`. Constant bounded scene dispatch, no cohort filter,
new listener, schema, fact, budget, timer or persisted state. Preserve actual facade/data/definition identity, silent
arithmetic and all native callbacks/results/errors. Multiple boundaries may increase lossEpoch; sticky loss is intentional.

| Acceptance | Following implementation and authored controls (all unrun) |
| --- | --- |
| 49.1 Initial / progress / repair | Real component with controlled ready/ticks/adapters: loss sees old health/work/state; post-write construction/audio/repair callbacks see loss. Initial matching/armor absent/present; automatic/worker/pending work; zero/capped/instant work; repair missing/full/zero-worker guards, pending count, zero-factor, clamp and no armor/event/reaction/death. |
| 49.2 Lifecycle / restore | Start payment and denied/thrown payment ordering; immediate versus assigned start; manual versus progress finish, no-health finish and already-finished guard; matching/empty/partial restore, pending resolution and unchanged saved fields. Retain cancellation/refund/order-reset and repeated teardown/unsubscribe behavior. |
| 49.3 Failure / reentrancy / references | Observer throws do not suppress another observer or native work. Native payment/audio/upgrade/repair callbacks keep errors and partial state; nested restore/finish/progress reads never regain old history. Preserve initial local versus progress cached versus repair fresh health lookup. Do not freeze definitions/data across callbacks or add native guards. |
| 49.4 Capture / delivery | Real scene recipient capture subscriber and journal: sticky global reason/epoch, no cohort filter, disposal silence and fresh partial capture without backfill. Cross-await real construction progress/repair against a live drain and actual protocol recipient preserves post-wait owner, campaign normal/granted/none behavior, exact application operation, notification and full native return. No destroyed-drain guarantee. |
| 49.5 Report / limits / delivery | Extend existing real subscriber/fence application report control with construction reason over its synthetic payloads: need/application bounds and usefulness null, legacy income retained, every channel partial. Source-review consumers, size and ownership; update handoff, commit/push then pause. No useful activation or family/issue closure. |

Final gate retains every earlier command and adds these authored controls to the existing selections (do not run now):

```sh
pnpm exec nx test probable-waffle-phaser --testPathPatterns='construction-site-component|construction-presentation|construction-resource-history|construction-drain-credit|construction-lifecycle|construction-payment|scene-resource-observation|ai-runtime-recipient-resource-capture' --runInBand
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-resource-application.spec.ts skirmish-ai-runtime-construction-authority.spec.ts
```

**Source Implementation Review:** traced direct writes, local/cached references, payment and notification order,
constructor/readiness, restore resolution, completion component upgrade, researched definition callers and UI consumers.
Selected conservative work/lifecycle loss explicitly; rejected health setter routing because it adds native health events.
No mandatory baseline repair is inferred; sound extraction is a separate maintenance prerequisite before adding hooks.
**Omission Audit:** 47.1 writer inventory, 47.2 actual technology caller, 47.3 exact reasons/order and silent semantics,
47.4 bounded 48–49 acceptance/model/commands are recorded. Assignment/alias/raw destroy/non-health research routes remain
explicit gaps; cancellation is not falsely labeled a health mutation. No runtime edits or new registration required by design.
**Final Closure Audit (separate):** reviewed the design against native code and immediate consumers after drafting,
reconciled handoff/current grid/resume policy. Design authored/source-reviewed only; all executable evidence deferred.
No skill/tool update warranted. Commit/push this documentation slice and pause at 47.

### Construction writer fence checkpoint (2026-10-08, authored/unverified)

Stage 49 is `a989f66c1ec2cd9ae2fdc1c931e923eb261bb7fc`, based on
`04ded09863f51adb72a10b54ff8a30537678c8be` (48, remote verified).
The authorized 48–49 batch reaches its pause after this publication. Last selected profile GPT-6.1 Sol / medium;
actual host settings unknown. Tests, formatter, lint, types, builds, source-size validation, doctor/context and simulations
remain deferred to the final gate. No new useful metric, complete channel or issue/family closure is claimed.

ConstructionSiteComponent uses existing fenceSceneResourceHistory at six native entries: initial health and eligible
repair use resource_actor_health_change; progress, returned-payment start, finish and every restore use
resource_actor_construction_change. Loss is scene-wide, bounded by the existing subscription owner, sticky and before
writes/callbacks. Missing/full/zero-worker repair, failed payment and already-finished complete keep their old guards.
The facade retains local initial, cached progress and fresh repair references, direct silent health/armor arithmetic,
actual definitions/data, saved fields, native payment and completion/refund/error ordering. No listener/schema/timer
or persisted field was introduced; no baseline refresh. Why used: a delivery after building work, repair or completion
cannot inherit an earlier continuous-readiness claim. Native income and full return still follow actual delivery policy.

| Acceptance | Implemented symbols / authored evidence (all unrun) |
| --- | --- |
| 49.1 Initial/progress/repair | Six facade hooks; construction-resource-history.spec.ts uses real construction/health facades and journal via a controlled fixture. Initial matching/absent/zero armor, automatic/assigned/pending/zero/capped/instant/no-health work, guard/failure, pending/zero-factor/clamped repair, silence/no death, retained facade/data/definition references. Includes native zero-time/zero-work NaN progress characterization. |
| 49.2 Lifecycle/restore | construction-resource-history-lifecycle.spec.ts covers start ordering/errors, immediate versus assigned, reentrant immediate completion, manual/progress/no-health finish, no-op finish, empty/matching/partial restores and pending resolution, saved fields, cancellation/repeated teardown/refund failure/tick cleanup. construction-payment.spec.ts additionally connects actual paid/denied/throwing native payment to the real caller fence. Existing lifecycle/payment controls retained. |
| 49.3 Failure/reentrancy/references | Both history specs cover throwing observers with later delivery, native audio/upgrade/repair/refund partial-state failures, nested restore/finish/reconcile reads and the original local/cached/fresh/live reference semantics. No new native state guard or snapshot. |
| 49.4 Capture/delivery | Real recipient capture: global loss with no cohort, epoch on later actual protocol add, disposed silence, fresh partial capture without backfill. construction-drain-credit.spec.ts uses real construction/health facades, a live drain, actual protocol players, controlled wait/emitter, progress/repair and normal/granted/none economies. Keeps post-wait owner, full return, notification, native exact application object and loss epoch. No destroyed-drain claim. |
| 49.5 Report/limits/delivery | Existing skirmish-ai-runtime-resource-application.spec.ts real subscriber/fence control adds construction reason over synthetic accounting payloads: need/application/usefulness quantities null, legacy income retained, all channels partial. Source-reviewed facade/helpers/spec ownership; executable size/cost/compatibility evidence remains unmeasured. Handoff and pause reconciled. |

**Source Implementation Review:** traced each native input/guard/payment/write/notification/cleanup path against 47;
reviewed silent arithmetic, reference resolution, sound helper and health/UI consumers. Repaired fixture ID lookup,
kept actual payment integration separate from controlled error cases, and retained explicit instant-work NaN behavior.
No event-based substitute, extra scan, observer filter or changed native economy policy was added.
**Omission Audit:** 49.1–49.5 maps above; test/helper files are adjacent and selected by the retained final-gate patterns.
Public assignments/aliases, non-health technology readiness, component replacement, raw destroy and complete source/drain
capacity/lifetime authority remain gaps. Fresh capture does not backfill lost history. No skill/tool change warranted.
**Final Closure Audit (separate):** reread final runtime changes, new controls and immediate consumers after source review;
reconciled current/next state, provenance, acceptance and publication scope. Authored/source-reviewed only; no check pass.
Commit/push exact owned paths and pause after 49; remote SHA must be verified before reporting publication.

#### Next design pass: 50 consolidated remaining machinery

**User policy (2026-10-09):** replace the narrow source/drain design and repeated per-component design stages with
**one thorough consolidated design pass on GPT-6.1 Sol / high**, followed by **one or more substantial implementation
passes on Luna / high**. Sol reviews the combined implementation and resolves concrete contract conflicts or difficult
final-gate failures. Recommendations do not switch the active model. Stage 50's consolidated source design is now
authored below; implementation and all tests, types, lint, builds, simulations, doctor/context and validation remain deferred.

Purpose: give the economical implementation model settled contracts and a finite finish line, while preventing
ongoing hook-by-hook expansion. Implementation passes are dependency/review units; they do not require model switches
between files or commits. Existing broader game-policy/scenario/parity/calibration obligations remain separate.
Begin with a scope/value review before specifying more hooks. For every existing/proposed subsystem, name a concrete
game test or debugging question that consumes its evidence, compare simpler alternatives, and justify complexity and
runtime/maintenance cost. Flag excessive machinery and propose explicit deferrals; do not remove mandatory acceptance
without user approval. A thorough design should reduce unnecessary machinery and strengthen precision, not expand scope.

| Design acceptance | Required output in this existing plan / handoff |
| --- | --- |
| 50.1 Scope/value and finish line | Inventory every remaining machinery obligation from 32/36/39/42/49 and the current PRO-03/06/07 consumers. For each existing/proposed system name the concrete test/debugging consumer, simpler alternatives and why its complexity/cost is justified. Define required release evidence, optional exhaustive tracking, firm completion criteria and proposed deferrals with rationale. Preserve mandatory acceptance unless the user explicitly approves its removal; distinguish machinery completion from useful activation, runtime proof and issue closure. |
| 50.2 Source-grounded inventory | Inspect actual source/drain stock/refill/lock/assignment/restore and pre/post-await capacity writers; container load/unload and lifetime; protocol resources/state/roster and mutable aliases; component/definition replacement; selected need, consumed/accepting frames and queue/payment liabilities; access/safety/readiness/clock predicates; actual capture installation, producer timing and report consumers. Record source anchors, current hooks, unsupported routes and prerequisite splits. |
| 50.3 Implementation-ready contracts | Settle exact interfaces, identity/lifetime ownership, mutation entry/terminal order, async context, reentrancy/failure, save/restore/disposal, bounds and supported-coverage declarations. Give exact owning files/symbols and implementation edits, including required behavior-preserving splits; architectural descriptions alone are insufficient. Preserve native extraction, post-wait owner/economy, full return, silent health, payment arithmetic and callbacks. Resolve cross-owner conflicts together rather than leaving decisions to Luna. |
| 50.4 Test and operational contract | Specify concrete positive/negative/recovery cases and real adapter/caller paths, synthetic versus runtime evidence, exact final-gate commands and compatibility criteria. Preserve existing test obligations. Inventory what is disabled in production/unmarked normal matches and what hooks/allocations remain. Define final-gate measurements and acceptance for disabled-hook CPU/allocation and any shipped bundle cost; do not promise zero overhead or an unmeasured FPS result. |
| 50.5 Finite implementation passes | Produce one or multiple dependency-ordered passes sized for Luna / high, each with exact changes, purpose, prerequisites, authored acceptance, commit scope and completion criteria. Group related owners/splits/hooks/tests in substantial passes. Give a source-grounded count/range after the inventory; do not carry forward the informal 15–25/30–50 estimates as commitments. Do not schedule a fresh design stage for each component. |
| 50.6 Escalation and combined review | Luna handles ordinary implementation choices, local inspection, source review and routine repairs within the agreed contract. Escalate only an evidenced contract contradiction, missing architecture/authority decision or incompatible native ordering/lifetime rule; name exact source and impact. Permit small evidenced design amendments with revised acceptance recorded in the same completion map, without restarting design or silently expanding scope. Keep safe work and continue independent authorized items. Sol reviews the combined implementation before the executable final gate; ordinary commit boundaries do not force a model switch. |
| 50.7 Completion map and delivery | Produce one map covering every requirement: concrete consumer, required/optional classification, owning contract/files/symbols, dependency/implementation pass, positive/control case, deferred check and evidence status. Link existing manifests as scenario authority; no separate competing inventory. Source Implementation Review, Omission Audit and separate Final Closure Audit against 50.1–50.6 and this map; reconcile handoff/current grid/model policy/resume prompt, commit/push design docs and pause for model selection. No runtime changes, executable validation, automatic model switch or new task/subagent in this design pass. |

Initial source anchors are the existing stage-42 writer table; resource-source-component.ts/resource-drain-component.ts
and adjacent service/cargo/credit owners; ContainerComponent and actor-data component maps; protocol player/resource
observation and platform game-instance roster; queue mutation/restore/payment owners; controller/pipeline/unspent-claims
and report projection/coverage owners. Use direct navigation for these known owners and semantic discovery only for
unknown remaining predicate writers. This list starts the inventory, not an assertion of exhaustive ownership.

### Consolidated machinery design checkpoint (2026-10-09, source design only)

Base `af9d078d9f3888a97550eb5c08b9215651f8df58`; containing commit owns stage 50. Recommended design profile
GPT-6.1 Sol / high; last user-selected profile Sol / medium, actual host settings unknown. No automatic switch.
This checkpoint implements 50.1–50.7 in the existing plan. It authors contracts and a bounded implementation queue,
not runtime behavior, passing evidence, useful activation or family closure.

#### Finish line and value decisions

**Four implementation passes, 51–54, then one combined Sol review.** This is a source-grounded count for the
bounded diagnostic work specified here. It replaces the informal 15–25 machinery-stage estimate. Each pass includes
its local source review, fixtures and any necessary compliance cleanup; coherent prerequisite commits may sit inside
the same pass. Stay on Luna / high across these passes. At 54, stop adding diagnostic systems and return to Sol.

The bounded finish line is: supported named writers lose stale history before native callbacks; reads distinguish
consumed claims from newly accepted claims; a real native producer path reaches the existing reports with honest
partial status; installation/disposal and ordinary-play cost have authored controls and exact final-gate measures.
All rows M01–M09 below must have authored paths/cases before M10 can establish gate readiness.
The combined source review found missing authoring and records it below. Executable success is a later gate.

**Full useful-service machinery is still blocked, not completed by four passes.** Existing 32/36 requirements for
mutation-complete beneficiary, liability, cargo/lifetime and continuous access/safety history remain mandatory.
Public resource/state/roster/component/definition/queue aliases permit write/undo without an observable method call.
Named fences cannot certify their absence. There is no finite honest implementation count for that broader authority
while those APIs remain unrestricted. M11 retains that blocker; M12 retains independent PRO-03/06/07 release evidence.
Neither is silently downgraded to optional. The four passes must not add a `complete` channel or populate useful floors,
retained useful throughput, continuous capacity or `usefulContribution` from partial channels.

Recommended **scope proposal, not adopted acceptance:** use exact native applications and actual useful product/tech
effects for the production release tests; retain aggregate-resource bounds as diagnostics, and defer exhaustive
continuous resource capacity unless a required oracle actually consumes it. This would avoid a repository-wide
mutation-API migration just for optional explanation. User approval is required before removing any current mandatory
continuous-usefulness obligation. Until then M11 remains an explicit release blocker; no approval is inferred here.

| System / concrete question | Simpler alternative and decision |
| --- | --- |
| Accepted decision/command, physical lane and completed actor/tech lineage | “Did this AI purchase create the useful force/research on time?” Dispatch counts cannot answer. Retain existing exact joins for PRO-03/06/07; no second event bus or paid ledger. |
| Native route/caller/order and arrival/service attempt | “Did the purchased worker reach and perform its own assigned task?” Current-order or endpoint samples can belong to a later task. Retain bounded existing handles and passive query capture; no new path query/cache manager. |
| Whole cargo pile and exact recipient mutation | “Which worker work produced this actual credit, and who received it?” Balance differences include grants/refunds/other workers. Retain exact payload/operation joins and known whole piles; no FIFO or partial-lot allocator. |
| Selected forecast and native application windows | “Did money arrive before the dated need, or merely get reported later?” Final stock/publication timing cannot answer. Retain separate observed quantities and null useful quantities; no renamed diagnostic as an oracle. |
| Named supply/container/component/restore loss | “Can an earlier read survive this known mutation?” A post-event snapshot is too late for a reentrant callback. Reuse the scene loss helper; deliberately conservative, with no dependency graph or new fact stream. |
| Consumed versus accepting liabilities | “Why did a real selection fail the reconciled-frame check?” A later brain snapshot includes new claims. Add bounded before/after diagnostic fields in existing facts, preserving the actual planner input and current rejection. |
| Platform roster routes | “Could remove/re-add before a read hide a recipient lifetime break?” Later reconciliation misses net-zero churn. Use capture-owned wrappers on this game instance only; avoid generic platform hooks, baseline splits and normal-play work. |
| Continuous resource supply/readiness/access/safety | “Was usable safe service continuously available, including between reads?” Neither deliveries nor ready endpoints answer. Keep unsupported and mandatory blocker M11. Further mutation tracking is not automatically queued by a missing metric. |
| Cost and capture-off controls | “Does testing machinery affect ordinary games?” A production guard proves installation policy, not bundle elimination or CPU cost. Measure disabled hooks and shipped code; add fast paths before more generic instrumentation. |

#### Source inventory and exact implementation contracts

Paths `P/...` below mean `libs/games/probable-waffle/phaser/src/lib/...`; `T/...` means its
`player/ai-controller/testing/` directory; `E/...` means `apps/portal-e2e/src/e2e/...`.
Existing shared authorities remain `AiRuntimeResourceCoverageCapture.lose`, `fenceSceneResourceHistory`,
`ResourceServiceObservation`, `PlayerResourceObservation`, root `appendAiRuntimeProductionFact`, and exact native
operation/transfer handles. No new persistent field, wire event, registry, timer, scene scan or planner mutation.

**C1 — passive named entry.** Reuse `fenceSceneResourceHistory(scene, reason)`. No new per-owner listener.
Call after the listed native no-op guards but before the first actual write or external callback in that phase.
Fence state is sticky before fallible diagnostics; observers cannot prevent native work. Same-value restore and
unguarded setters still fence. Named reasons below are literals used by controls, not a new schema/channel.
Global loss is intentional: no exhaustive actor-to-need map exists. Ordinary extraction/container activity may therefore
lose application-window bounds, even when the actual scoped credit survives. Do not filter actors to make a positive pass.

| Native owner / symbol | Required edit, ordering and reason | Unsupported route retained |
| --- | --- | --- |
| `P/entity/components/resource/resource-source-component.ts:extractResources` | `resource_source_capacity_change` inside the enter branch before increment/load; after the await before unload/decrement. Then `resource_source_stock_change` before stock deduction, after the existing factor/min calculation. Preserve debug, resource subject, positive-only depletion subject, transform read, destroy and depleted-image order. | Public definition can change factor/type/cooldown/max mid-await; stock samples do not prove continuous supply. |
| Same owner: `assignGatherer`, `unassignGatherer`, `refillResources`, `lockResources`, `setData` | Assignment reason `resource_source_assignment_change` inside existing has/not-has guards before Set mutation/subject. Stock reason before refill/lock; restore reason `resource_source_restore` inside defined-currentResources guard before max read/clamp/write. | No interception of arbitrary definition/Set aliases; matching values do not restore authority. |
| `P/entity/components/resource/resource-drain-component.ts:init`, `returnResources`, `setData` | `resource_drain_capacity_change` before init writes, before pre-await increment/load and post-await unload/decrement; `resource_drain_restore` inside defined-capacity guard before write. | No change to the inherited zero maximum without a container or cached enter/maximum semantics. Definition aliases remain unsupported. |
| `P/entity/components/building/container-component.ts` | `resource_container_change` before `setContainerDefinition` merge, boarding register/cancel mutations, successful load after can-load guard, unload before delete/reposition, and actual sea-destruction branch before iterating contained actors. `resource_container_restore` before pending-ID copy/clear and, after all references resolve, before delayed clear/load. | Pending/contained/definition aliases remain gaps. Getter arrays are copies, but contained actor identity is live. |
| `P/entity/components/building/containable-component.ts` | `resource_container_change` before `setContainer`/`clearContainerReference`; after existing owner/pending guards in leave/kill/cancel before first write or delegated container callback. Preserve clear-before-unload recursion prevention. | Public pending boarding field can be assigned directly; do not claim complete transport history. |
| `P/data/actor-data.ts` named installation/upgrade/add/remove/definition routes | `resource_actor_components_change` at each public mutation entry before constructors/map edits/callbacks; `applyActorDefinitionToActor` fences only after its absent-definition return. Wrapper entry before gather constructors matters: they can mutate ready state before `setActorData`. Keep the native duplicate fences on delegated routes. | Public Maps and `actor.setData(ActorDataKey, ...)` bypass named functions. No proxy/read-only conversion or cleanup of replaced components. |
| `P/entity/components/queue/queue-component.ts:setData` | `resource_queue_restore` at entry before clearing any lane; preserve saved-item cloning, least-time placement, omitted overflow items and final notify order. Existing mutation/progress before/started records retain their original ownership. | Raw `queues`, `queuedItems`, definitions, item cost/time/context remain mutable. No synthetic enqueue/payment records for restored items. |
| `P/campaign/participants/campaign-participant-scene-adapter.ts:configure` caller of `applyStartingResources` | `resource_campaign_setup` immediately before the call inside the existing non-startup-load branch, using the actual scene. Leave helper arguments, slot order, missing-field fallback, economy modes and `Math.round(amount * scale)` intact. | Setup preceding installation is not historical authority. Startup-load skip remains unchanged. |
| Existing owner/health/construction/restore/controller routes | Retain 40/44/46/49 and reconnect pre-snapshot fences exactly; add regression coverage to the shared cases. | Health/data/definition aliases and raw destruction remain incomplete. No further presentation splits. |

**C2 — native async and identity.** Source/drain keep their current await and return contracts. Source extraction
uses the actual post-wait stock/definition and native math; drain resolves owner/player economy after waiting, then
uses the exact payload/recipient mutation callback. Preserve granted/none suppression, notification and full returned
amount. No early owner capture, cancellation, retry, health gate, additional await or compensation on errors.
Existing gatherer `ResourceTransferContext` retains execution/cargo owner/transfer object; do not add an ambient source
context or bind a late continuation to a new capture. Named source/drain fences use the current native scene at their
listed phases. A shutdown-resolved wait may still run native continuation; diagnostic eligibility stays unavailable.
Source/container native failures keep their partial state (including increments before thrown load/unload).

**C3 — roster observation stays test-owned.** Add `T/ai-runtime-recipient-roster-capture.ts` with one class
`AiRuntimeRecipientRosterCapture`. Constructor receives `scene.baseGameData.gameInstance` and `coverage.lose`; it wraps
only `addPlayer`, `removePlayerByUserId`, `removePlayerByPlayer`, `stopLevel` on that instance. Preserve original property
descriptors/absence, receiver, arguments, one native invocation, return and thrown value using `Reflect.apply`.
Before delegation call loss reason `recipient_roster_mutation` (stop uses `recipient_level_reset`), isolating sink throws.
Installation failure rolls back installed wrappers and loses history. Disposal restores only its own unchanged wrapper;
a foreign replacement is left intact and loses `recipient_roster_wrapper_replaced`. No prototype patch or platform import
of Phaser. One owner per instance via WeakMap; duplicate capture loses the second, never stacks wrappers. Exactly four
method slots, no roster scan. `AiRuntimeRecipientResourceCapture` owns installation/cleanup; existing reconcile remains.
Unknown new players need not be enrolled into a lost capture. Public array/state replacement and saved pre-wrapper
method references remain explicit gaps. No claim that wrapping methods owns all membership mutations.

**C4 — before/after liabilities are diagnostics, not substituted planner inputs.** Extend existing fact union only:
`resource_input_read` gets optional `unspentClaimsAtRead: AiRuntimeUnspentClaimsV1`; `decision_selected` gets optional
`unspentClaimsBeforeSelection: AiRuntimeUnspentClaimsV1`. Optional means old capture lacks this evidence, never zero.
`AiRuntimeResourceInputCapture` receives a callback `snapshotClaims(playerNumber)` from the root capture. Invoke once
at begin, before ledger read; the existing unchanged frontier/loss check binds that detached snapshot to the actual
observation at finish. Append it in the same read fact; no added fact sequence or owned-actor scan. A failed snapshot
loses history; native observation still returns. At `observeDecision`, snapshot claims before `observeDecision` updates
them, then append this snapshot with the selected event; existing `boundaryState.unspentClaims` remains after selection.
Do not re-read the brain to reconstruct either frame.

Keep the report interface and projection functions in `E/skirmish-ai-runtime-resource-liability-frames.ts`
(no new state owner or duplicate Phaser report type). Report one optional `liabilityFrames` field per existing need-accounting record:
`consumedReserved`, `beforeSelectionReserved`, `acceptingReserved` are exact resource amounts or null; `status` is
`matching | accepting_changed | unavailable`; `gaps` is readonly strings. Consume exact marker/read/player/resource
and selected-fact identities. All three known vectors equal the consumed ledger's reserved amount, with existing due-cost
checks unchanged, is `matching`; consumed and before-selection amounts matching the ledger with a known valid
accepting inequality is `accepting_changed`; a before-selection mismatch is `unavailable` with a specific frame gap.
Missing/invalid/sticky-gap,
intervening boundary or pre-capture ownership is `unavailable`. Require finite nonnegative values; contradictions fail
the normalized parent, not just this field. Extra diagnostic fields do not change `frame`, grossUnmet or the existing
contribution calculation: an accepting mismatch still leaves bounds null. In particular consumed `reservedUnspent: 0`
must not be replaced by newly selected purchase claims. Non-queue purchases remain unsupported; pending resource
claims are not added again; paid cash and queue future obligations remain disjoint.

**C5 — cleanup/bounds.** Preserve root 8,192 facts/identities, 256 snapshots/cohorts/need/window groups, 512 claim entries,
8 observer limits and bounded 32 loss reasons. New fields use those existing budgets. Nested/throwing/failed terminal,
restore, component replacement, dropped append or detach cannot revive an epoch. Disposal loses before removing hooks,
is repeatable, restores only owned wrappers, and prevents stale work from attaching to a replacement capture.
Fresh capture starts partial with no backfill. No capture object/sequence/weak identity appears in saves or hashes.

**C6 — compliance is a prerequisite commit inside a pass, not another design stage.** Source inspection found
source 214, container 276, actor-data 370 and platform game-instance 185 physical lines; the baselines do not imply
each needs another helper class. In edited source/container/actor-data files remove the redundant top-level `GameObject`
alias in favor of `Phaser.GameObjects.GameObject` and wrap long lines/imports/comments, preserving existing comments'
meaning. Remove only their now-obsolete exact baseline entries after compliant authoring; never refresh hashes.
No actor-data/helper or platform split is planned. Queue's 565 physical lines include substantial comments:
retain the focused facade, existing separate `projectSharedQueueItems` helper and serialization order; wrap its long
imports. If local inspection exposes a genuine size contradiction, record a C6 amendment instead of refreshing a hash.
Limits remain 400/200/140; exact compliance is established at the deferred gate.

**C7 — predicates and real producer timing are explicitly bounded.** `AiObservationPipeline.capture` projects actors,
fair topology/access/threat facts, then starts the resource read around obligations and stock. Its ledger still reads
reservedUnspent zero. `AiAccessGraphAdapter.advanceGraph` carries navigation/threat revisions and bounded pending work;
`projectAiObservedActor`, visibility policy and `projectThreatSummary` are samples, not complete predicate journals.
`SimulationTickService.tick$` starts a tick; `waitForSimulationDuration` resolves on elapsed simulation time/shutdown,
and has a wall-clock fallback outside a live simulation service. Existing clock identity/discontinuity loss remains.
No topology, motion, threat, definition, visibility or clock API migration is included. These are M11 blockers.

`installAiRuntimeProductionCapture` installs before preset money/work; owner/health/construction initialization can
already lose that epoch. C1 adds further expected service loss. Do not reset loss after setup, silently move installation,
manufacture snapshot frontiers, or evaluate an old need in a fresh capture. Real recipes currently provide no resource
interval declarations. Keep that state until an actual fixture supplies its independent fixed need/endpoints and
supported authority; adding a declaration cannot supply missing history. Native scoped credits remain separate from
aggregate bounds and useful-capacity assertions. Report the exact reason at the existing consumer.

#### Finite passes and single completion map

Implementation paths 51–54 are authored. M10 has source-reviewed them and recorded missing control authoring below;
none has executable evidence. Existing authored stage 29–49 paths are prerequisites, unverified.
R = required bounded implementation; B = existing mandatory acceptance still blocked; O = optional extra, not queued.
Checks K1–K5 are defined below. Existing scenario authority remains `tools/ai/fixtures/skirmish-v1.json`, not this table.

The following map preserves stage-50 design/authoring states; the final-gate checkpoint below owns current executed evidence.

| Requirement / consumer and purpose                                                             | Class; owning contract / files                                            | Dependency / pass                                               | Positive, control and recovery evidence                                                                                                                                                                                                                         | Deferred check / state                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M01 Named supply/capacity writers: need/accounting rejects stale history                       | R; C1/C2 resource source/drain, scene loss                                | 49 → 51                                                         | Real source extraction and real drain credit across controlled wait; refill/lock/assignment/restore, duplicate assignment no-op; callback sees old stock/capacity at loss; native throws/reentrancy; fresh partial capture                                      | Code authored; K1/K3 deferred                                                                                                                                                                                                                            |
| M02 Container/containable: readiness cannot survive a known boarding/restore boundary          | R; C1 building owners                                                     | 51                                                              | Actual load/unload/dead-at-sea/shore/pending-ID resolution, full load no-op, undefined restore no-op; throw and callback ordering, repeated destroy/clear-before-unload                                                                                         | Code authored; K1 deferred                                                                                                                                                                                                                               |
| M03 Component/queue/campaign restore: old actor/need identity cannot survive named replacement | R; C1/C6 actor-data, QueueComponent, campaign caller                      | 51 → 52                                                         | Real named component replace/add/remove/upgrade/definition, source/health constructor callback, empty queue restore, campaign modes/rounding/startup skip; constructor/helper throws; matching restore still loses                                              | Code authored; K1/K3 and C6 checks deferred                                                                                                                                                                                                              |
| M04 Recipient roster: journal knows remove/re-add before another read                          | R; C3 roster capture and recipient owner                                  | 52                                                              | Real protocol game instance add/remove/reset with actual protocol players; temporary removal/re-add, native throw, foreign receiver/descriptor/replacement, installation rollback, disposal/reinstall                                                           | Wrapper code/spec authored; K1/K2 deferred                                                                                                                                                                                                               |
| M05 Exact consumed/accepting frames: explain purchase-plus-gather null bounds                  | R; C4 fact union/input/root/unspent/report fields                         | 52 → 53                                                         | Real input/controller selected event with zero and nonzero new claims; immediate paid vs future queue transfer; due head exhaustion; unsupported building/pre-capture/expired/recovery claims and callback-in-progress; mismatch stays null                     | Code plus focused input/root/synthetic frame controls authored; full native integration still missing; K1/K3 deferred                                                                                                                                    |
| M06 Cargo/recipient/window compatibility: preserve credited income without false usefulness    | R; C2/C4/C5 existing credit/application/need projections                  | 53                                                              | Exact real payload join; normal/granted/none and changed owner; mixed/old/restored cargo; grant then spend cannot reopen shortage; publication delayed across application window; same-tick/straddle/overflow bad tail                                          | Existing path retained; K1/K3 compatibility cases deferred                                                                                                                                                                                               |
| M07 Real adapter/report bridge: expose actual producer evidence and explicit gaps              | R; C7 root capture, variant runner, production normalization              | 51–53 → 54                                                      | Real Phaser actor/components/protocol player/read/native command path into report; initialization loss, post-await service loss and late/disposed capture; native income remains diagnostic while useful fields stay null; contradictory tail suppresses parent | Short probe and full 611-decision native diagnostic bridge pass after causal repairs; full production contract/authority/capacity remains open in the native causal checkpoint                                                                           |
| M08 Normal-play impact: testing does not install heavy machinery during gaming                 | R; C8 below, installer/helper controls and existing profiler              | 54                                                              | Production/unmarked guard, no sample/clone/listener/timer/root journal; before/after disabled-path and bundle comparison; foreign host/duplicate capture, late callbacks                                                                                        | Production/unmarked controls and isolated profiles checked; derived code gzip +0.052062%, candidate 114,606 raw testing bytes reachable; three qualifications prove initial equality and tick-22 divergence; native costs/original pinned budget blocked |
| M09 Compliance/publication: economical implementation remains reviewable                       | R; C6 exact baselines, existing handoff                                   | Each 51–54                                                      | No refreshed hashes/new permanent stage names; task-only prerequisite and behavior commits; source review/Omission Audit/closure, remote SHA and clean task scope                                                                                               | Authored/source-reviewed; implementation commit `978cb09e70cbc6e2ed0b520971690ea47ab38045` remote-verified; checks deferred                                                                                                                              |
| M10 Combined review and compatibility: decide readiness before execution                       | R; C1–C8, all changed consumers                                           | 54 → Sol review                                                 | Trace real input → selected/admitted → native application → report/disposal; review all controls, repair concrete contract contradictions; every required unrun check remains listed                                                                            | K4/K5, derived C8 compilation and initial world equality checked; prior native 702/gameplay 274/report 461 retained; native trajectory/costs, original pinned comparison and full production proof blocked; wider release remains                        |
| M11 Mutation-complete useful resource/continuous capacity: 32/36 full proof                    | B; C7 plus 32/36/39/42 authority, public APIs                             | Explicit authority/scope decision; not a hidden fifth Luna pass | Net-zero alias undo, arbitrary definition/Map/item/roster replacement, hidden/stale threats/access changes between reads, full supported initial predicate history; no positive complete channel currently possible                                             | Existing 32/36 gates; blocked, mandatory                                                                                                                                                                                                                 |
| M12 Production useful outputs, legal setup and strategy: PRO-03/06/07 release                  | B; existing production authority contract and evaluators                  | Broader gameplay/fixture queue, separate from 51–54             | Both-faction transition/abandonment, exposed/safe/no-demand resilience, shared train/research and paid cancellation/pending refund pairs; full oracle and denominator                                                                                           | K5 and owning scenario/policy plans; open, mandatory                                                                                                                                                                                                     |
| M13 Finer loss scopes/continuous journal/lot allocation                                        | O; no new files/owners                                                    | Not scheduled; new consumer must justify proposal               | No actor-to-beneficiary dependency map, FIFO allocation or extra scan introduced just to recover a diagnostic bound                                                                                                                                             | No extra gate; proposed only                                                                                                                                                                                                                             |
| Final machinery necessity review                                                               | R; existing M01–M12 consumers, C8 measurements and reporting/replay tools | End of gate, before final closure                               | Every existing system has demonstrated consumers/proof, simpler-alternative comparison, measured cost and a keep/simplify/retire verdict; representative context-byte/read-cost evidence retains diagnostic quality                                             | User added 2026-10-09; not_started. [Owning review acceptance](../HANDOFF.md#end-of-gate-machinery-necessity-review); no new machinery scope or automatic acceptance reduction                                                                           |

**51 — supply and containers (Luna / high):** implement M01/M02 and relevant C6 cleanup together. Use shared real
actor/protocol fixtures beside resource components; tests `resource-source-resource-history.spec.ts`,
`resource-drain-resource-history.spec.ts`, `container-resource-history.spec.ts`, and containable controls. Separate a
compliance-only commit where needed, then native fence/test commit(s). Source-review cross-await branches and all
subjects; finish when every listed method/guard/phase and recovery case is authored. These files help tests detect a
known change in resource availability without changing what the worker extracts/returns.

**52 — binding and restore boundaries (Luna / high):** implement M03/M04 with roster-wrapper fixture and
`ai-runtime-recipient-roster-capture.spec.ts`, `actor-data-resource-history.spec.ts`, queue/campaign adjacent controls.
Root/recipient capture owns cleanup; no platform-level production observer. Commit actor/restore and test-owned roster
slices coherently; finish with descriptor/receiver/constructor timing/disposal cases. These routes stop old accounting
from surviving an actor or recipient identity replacement that briefly returns to the same apparent state.

**53 — input and claim frames (Luna / high):** implement M05/M06, extending existing resource-input, unspent-claims,
production-capture and report specs. Add typed optional fields and small projection helper; preserve exact calculation,
incoming-start/own-admission exemptions and all partial channels. Finish with a real read/selection frame case and
nonzero-accepting-claim negative control; old capture parsing remains supported. This explains why newly purchased work
changes available money without misrepresenting the resource values the AI actually consumed.

**54 — producer/report and operational closure (Luna / high):** implement M07/M08/M09 controls and C8 fast paths;
extend the existing real root-capture fixture and report normalization control with its output. Do not feed a synthetic
oracle builder into browser results. Add `ai-runtime-resource-producer-report.spec.ts` on the Phaser side for actual
producer timing; on E2E side extend existing application/causality specs, keeping synthetic arithmetic labelled.
Add `E/skirmish-ai-runtime-resource-producer-report.spec.ts` for the actual browser bridge: use
`prepareRuntimeVariant`/`runVariant` with an existing legal production world, then
`captureRuntimeProductionAuthority` and `normalizeRuntimeProductionCausality`. Retain the raw capture and inspect its
exact selected/admitted/native operation/credit identities; absence of a required native event is a failure, not a skip.
Use existing marked-host accessor/probe paths for the controlled loss/disposal branch, not hand-inserted capture facts.
The Phaser spec proves native raw ordering; the browser spec proves that runtime output reaches the report. Neither
counts as a full PRO scenario or positive continuous-usefulness proof. Author ordinary-play/profile controls using
existing runtime probe infrastructure; no new scenario registration claims.
Update this map with authored symbols/unrun checks and handoff, publish, then pause for M10 Sol review. Finish the
bounded queue here; M11/M12 remain visible rather than becoming an indefinite stream of helper stages.

### Bounded machinery implementation batch (51–54, 2026-10-09, authored/unverified)

User selected Luna / high for the complete grouped batch. Batch base `58dc92f8a9ce4d44cfaa133bbcf621fe8fc22b5b`;
implementation commit `978cb09e70cbc6e2ed0b520971690ea47ab38045` is published and remote-verified.
worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`. Actual host model and
effort remain unknown. All executable tests, type/lint/build checks, browser runs and cost measurements were deferred
to the final gate by user instruction. Source review and Git publication are not test evidence.

| ID | Authored path and purpose | State / remaining evidence |
| --- | --- | --- |
| 51 / M01 | `ResourceSourceComponent`, `ResourceDrainComponent`: stock/capacity/assignment/restore loss at named native phases, including both sides of simulation waits. Existing math, await, owner/economy-after-wait and full native return remain in place. | Code authored/source-read. Native ordering, reentrancy, throw and recovery cases deferred. |
| 51 / M02 | `ContainerComponent`, `ContainableComponent`: loss before definition, boarding, load/unload, sea-destruction and restore writes; delayed restore loses before resolved actor replacement. | Code authored/source-read. Native callback and restore controls deferred. |
| 52 / M03 | `actor-data.ts`, `QueueComponent.setData`, campaign setup caller: loss before component constructors/map mutations, queue lane clearing and actual starting-resource application. Removed the specified redundant `GameObject` aliases and their three exact baseline entries without refreshing hashes. | Code authored/source-read. Actor constructor throw/order, no-op restore, economy-mode and startup-load controls deferred; C6 lint/size evidence deferred. |
| 52 / M04 | `AiRuntimeRecipientRosterCapture`, installed and disposed by `AiRuntimeRecipientResourceCapture`: four instance-only roster wrappers preserve native receiver and return/throw path, isolate loss callbacks and restore only still-owned wrappers. | Code plus focused wrapper spec authored. Run with protocol/native roster mutation and disposal cases at final gate. |
| 53 / M05 | `AiRuntimeProductionFactV1`, `AiRuntimeResourceInputCapture`, root decision callback: optional detached claims at actual input-read begin and immediately before selected-claim updates. `RuntimeResourceLiabilityFramesV1` reports consumed/before/accepting amounts and matching, changed or unavailable status. | Code authored/source-read. Frame equality/change/mismatch/missing/sticky-loss controls deferred. Existing consumed-frame calculation and useful `null` remain unchanged. |
| 53 / M06 | Existing exact cargo, recipient and operation projection retained. New frame diagnostics do not supply new income, contribution or usefulness bounds. | Compatibility inspected; paired native/report cases deferred. |
| 54 / M07 | Existing marked `runVariant` already captures the actual Phaser root and normalizes that same capture. Runtime matrix assertion now requires selected decisions to reach the report and partial resource channels to stay null. | Browser bridge assertion authored, not run. Actual native producer/report route and required-event evidence deferred. |
| 54 / M08 | `fenceSceneResourceHistory`, `PlayerResourceObservation.reset/lose`, and installer: empty loss groups return before snapshot/reentrancy allocation; no matching marked host returns before config parsing or capture construction. | Code plus unmarked-host guard spec authored. Disabled-path profile, production bundle and native fast-path controls deferred. |
| 54 / M09 | Changed only task-owned source, one E2E report assertion, the exact baseline removals and these existing plan/handoff files. | Source/Git scope review only. No executable validation or cost evidence. |

Historical authoring boundary: M10 source review found missing controls, subsequently authored and executed in the
final-gate checkpoints below. The user-authorized final gate is active; K5/C8 and broader release evidence remain.
Do not claim stage validation before K1–K5. M11 remains a mandatory blocker from public mutable aliases
and incomplete access/safety/lifetime history; M12 remains open for full PRO-03/06/07. Neither was reduced by this batch.

### Final-gate native equivalence checkpoint (2026-10-10, trajectory divergence checked)

User authorized continuation and commit/push/pause; clean base/remote was
`8fa4ac588e6bb8f133bcdbf84a6fae6af8cd5ee7`, branch `feature/759-skirmish-ai`, worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. Actual model/effort unknown. Candidate source, configuration,
dependencies, recipes, oracles and the tracked compatibility patch remain unchanged.

**What was established / why:** a legal three-player Ember world now reproduces exactly between the candidate and
the compile-qualified derived reference at tick zero and through tick 21. Three alternating qualification pairs
reproduce the same first divergence at tick 22: the candidate terminates a refused Move, while the reference keeps it
active. This proves the old natural-match comparison would mix native behavior changes with diagnostic cost.
No timing, allocation or C8 budget pass is inferred. These are qualification pairs, not cost pairs.

| Acceptance / purpose                          | Evidence / owning path                                                                                                                                                                                                                                | State                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| N1 Preserve identities and environment        | Replayed existing 11-file patch/source and production-output audit; same five config hashes. Both development builds pass using their own source/assets and identical installed dependencies.                                                         | Checked                                                             |
| N2 Legal identical initial world              | Ordinary lobby: human 1 Skaduwee, AI 2/3 Tivara Normal; seed 759101, 18 indexed actors, no positive owner outside 1/2/3. Existing validated preset fixes instance identity without adding actors, queues, orders or changing balances.                | Checked for this marked developer world                             |
| N3 Equivalent native trajectory before timing | Three pairs in reference/candidate, candidate/reference, reference/candidate order; all 81 boundaries repeat exactly within each source. Cross-source boundaries match 0–21, diverge at 22.                                                           | Trajectory equivalence blocked                                      |
| N4 First cause and concrete next scope        | `PawnAgentMovement.stopFailedMove` → `PawnAgentOrders.Stop` → `CommandBusService.reportPersistedOutcome` closes the same Move only in the candidate. Separately, both sources reproduce cross-player commitment collisions. Reference decision below. | Cause checked; cost and M12 work open                               |
| N5 Closure / publication                      | Scoped durable testing guidance and two coordination files; implementation review, omission and separate final closure audits. Exact staged scope and remote equality checked at publication.                                                         | This investigation batch checked; C8/M11/M12/wider gate remain open |

**Replay setup:** first natural setup attempt had equal roster/population/balances/RNG digest but different actor IDs
at tick zero. `ActorIdAuthorityService.sessionSalt` includes the random lobby instance ID. The existing preset seam in
`ProbableWaffleGameComponent.setData` sets it before Phaser boots; no ID remapping or post-hoc state normalization used.
The final preset is `fixtureId: native-cost-ember-roster`, `actors: []`, `resourceGrants: []`,
`resourceStarts: [{ playerNumber: 1, amounts: { wood: 200 } }]`; each source supplies its own full HEAD SHA and the
computed fixture digest. Existing native wood is already 200, so the setter emits no resource change. Validator
requires nonempty authored work; an empty preset would be invalid. Both instances are exactly
`runtime-fixture-759101-native-cost-ember-roster`, with production capture explicitly enabled in development.
Both map assets and `MapEmberEnclave` authored/generated sources are unchanged between revisions; tilemap SHA-256
`1dd43c9e171acd3ae43020bc1fa6b6f1c35380ddf069bd9219d0950c3cc582d1`.

**Native evidence and limits:** six independent booted Phaser worlds, 80 exact 50 ms UPDATE boundaries each,
all AI decision boundaries settled, zero page errors. The driver sleeps the render loop and uses the existing runtime
bridge's scene-UPDATE convention; it does not measure normal rendering, real-time match duration, CPU or allocations.
Per-tick snapshots retain the actual authoritative projection, bus authority/outcomes and both controller boundaries.
Initial population is 7/6/5 owned actors and 2/0/1 workers for players 1/2/3. No fixture-authored command is added.
The initial boundary SHA-256 is identical in all six runs:
`d7f14bb42f149386d542b6644173c4737e303a457d6c04d41d7c9bc7906fe152`.

At tick 20 the same player-2 command `2:0:1:runtime-fixture-759101-native-cost-ember-roster` is applied to
`sim-4e1168b3` (`TivaraMacemanMale`). At tick 22 only the candidate records `failed/application_failed`, detail
`Move - Movement Failed`, and removes its active progress/commitment. The reference retains the expected actor with
no terminal actor. This is the already-reviewed `17fde8c7e` repair, not a new performance regression; do not remove it
to force equivalence or shorten the workload to tick 21 and call that representative performance.
Final boundary hashes differ and repeat within each source: reference
`c62d54160ea6eb76620974b233c15c3f557a2c1f5aae0977213bad537fec6025`, candidate
`7397ef6b20cf23f254c018043df4784b248d7b2c8bc6b7c846949a39c7cfbc4d`.

**Additional M12 defect retained:** at tick 20 player 3 receives two `duplicate_command` rejections referencing
player-2 commitments, for bootstrap-worker and the same neutral-target effect. `CommandBusService` indexes
`activeCommitments` by the supplied key without player scope. Both sources reproduce the collision; it is not the
first cross-source divergence or evidence of cost. Preserve this causal slice for the mandatory multiplayer/production
authority pass; do not hide it by changing the recipe or count this world as full production correctness proof.

**Reference scope decision / recommended next batch:** qualify a second, explicitly behavior-aligned diagnostic
reference using only the already-reviewed refused-Move and actual Gather/drop-off progress repairs in addition to
the compile overlay. Keep the original reference and its failure evidence intact; preserve both patch identities.
Review each behavior hunk and its excluded cost contribution, run its native regressions and require equal state,
commands/outcomes through a meaningful workload before profiling. Do not copy whole candidate owners, planner policy,
resource-frame/report changes or silently change the pinned release criterion. A result against that new comparator
measures the remaining diagnostic delta; it does not satisfy original pinned acceptance without an explicit reference
policy decision. If other behavior diverges, retain the first cause and stop adding speculative reference patches.
Keep the cross-player collision as a separate M12 repair obligation. This groups the reference/workload reasoning in
one GPT-6.1 Sol / high batch, then permits the existing warm-up plus three alternating production/unmarked/marked
cost pairs only where native equivalence holds. No cost optimization is justified by these untimed runs.

**Commands / retained evidence:** unchanged-source development builds use
`NX_DAEMON=false node node_modules/nx/dist/bin/nx.js build portal --configuration=development --stats-json=true`
with separate output paths: candidate `tmp/ai-plans/759-validation/cost-batch/native-candidate`, reference
`tmp/native-cost-reference` in its own checkout. Nx builds pass in 34.7/26.7 s, respectively, 0/3 cache hits.
Ignored `tmp/ai-plans/759-validation/cost-batch/qualify-native-world.cjs` owns the bounded replay;
`audit-native-equivalence.cjs` rechecks source identity, all six traces, exact prefix equality/divergence and retained
actual output hashes. `native-equivalence-manifest.json` links artifacts; `native-equivalence-summary.json` is only
4,230 bytes. Each raw reference/candidate trace is 1,335,204/1,354,910 bytes and remains on disk; the initial random-ID
control is in `random-instance-control/`. No raw payload or profile needs enter context. Missing ignored evidence
requires recreation from the setup/owners above, not a claim of inherited runtime success.
Both development inventories retain hashes for 106 emitted JS/CSS files, including three copied service-worker files;
actual emitted bytes and pre-postprocessing stats bytes are recorded separately. These inventories identify the
executed builds and do not replace the previous production reachable-gzip closure. Production size evidence remains
+830 bytes / +0.052062% against the compile-derived reference only.

**Implementation Review:** traced instance salt, preset validation/application, real lobby roster, clock/pause/settling,
authoritative snapshots, native Move terminal cleanup and both-source commitment rejections. No production repair or
new shipping measurement tool was authored. Durable instance/workload guidance lives in the testing README.
**Omission Audit:** N1/N2 checked; N3 explicitly blocked by native behavior, N4 causally evidenced; zero qualified
cost pairs, production/unmarked runtime profiling, marked-hook cost and original pinned acceptance remain open.
**Separate Final Closure Audit:** verified exact patch/source set, repeated trace/bundle hashes, map identity, doc
links, unchanged candidate production inputs, unrelated Nx ancestor and task-owned scope. No generic skill change
was justified. Update handoff/map, commit/push and pause; M11/M12, wider gate and final machinery review remain required.
Scoped format checks pass for this checkpoint, all five changed tables and the durable testing guide; diff whitespace
and 54 handoff/plan links pass. Whole-file formatting fails on both original historical documents too; unchanged
historical tables retain their prior layout rather than adding unrelated formatting churn.

### Final-gate reference qualification checkpoint (2026-10-10, compile prerequisite checked)

User authorized continuation with commit/push/pause; base/remote was clean
`6af776cdb058651ad66b3ec3fafd74f13d4ddd56` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle` on
`feature/759-skirmish-ai`. Actual model/effort unknown. This batch owns a replayable measurement-reference patch and
coordination evidence. Candidate production source, configurations, dependencies, fixtures and oracles are unchanged.

**What changed / why:** [cost-baseline-compatibility.patch](fixtures/cost-baseline-compatibility.patch) applies only to
original `af9d078d9f3888a97550eb5c08b9215651f8df58`. It fixes compilation of a derived cost reference without copying
later candidate owners, planner policies, Movement/Gather/roster repairs, frame changes or report normalization.
The original 31-diagnostic build failure remains valid. This derived source has its own identity; it does not turn the
unbuildable original into a passing baseline or establish a release correctness result.

| Acceptance / purpose | Implementation and evidence | State |
| --- | --- | --- |
| Q1 Preserve source/environment | Detached HEAD stays exactly pinned; 11-file patch only. Same installed dependencies and five package/lockfile/project/TS/Nx hashes as the candidate; original failed build retained. | Checked |
| Q2 Minimal compatibility / native semantics | Seven emitted-identical files after three intended `satisfies` syntax repairs; four guard owners reviewed below. No resource filter merge or allocation change in the planner reference. | Scoped equivalence checked |
| Q3 Executable reference | Same production compiler/configuration with stats passes. Five reference-owned Phaser specs / 22 cases pass. Two planner specs: 25 pass and one pre-existing fixture fails identically on original and derived gameplay sources. | Compile prerequisite checked; correctness failure retained |
| Q4 Reachable bundle scope | Same index roots/static+dynamic traversal, actual byte sizes, gzip level 9 per file and code/media split as the candidate. All 102 outputs retained and hashed. | Derived size comparison checked |
| Q5 Complete paired C8 budgets | Zero native pairs; no equivalent world/state/outcome digest, disabled p95/CPU, native allocations or installed marked-hook cost. Original pinned budget remains blocked. | Pending native equivalence and measurements |
| Q6 Closure/publication | Exact tracked patch and two coordination files; patch replay/source identity and doc links checked; containing commit/remote verified at publication. | This qualification batch checked; C8/M11/M12/wider gate open |

**Equivalence review:** compiler erasure uses installed TypeScript 6.0.3 / CommonJS / ES2022 with comments removed.
For the three unparsable original statements only, join the newline before `satisfies` before comparing intended emitted
code. This is a syntax-normalized comparison, not execution of invalid original JavaScript.

| Patched owner | Exact scope / why it preserves supported reference behavior |
| --- | --- |
| `validate-ai-brain-state-v1.ts` | `as const` retains the existing workforce keys; emitted code identical. |
| `ai-military-force-context.ts` | Declares existing ground/air literal result; emitted code identical. No macro/capacity/unit policy patch. |
| `ai-producer-safety.ts` | `as const` retains the four existing adjacency tuples; emitted code identical. |
| `ai-resource-service-manager.ts` | First filter's type predicate states the exact two known-status checks already performed. Both filter passes and all conditions remain; emitted code identical. |
| `player-pawn-ai-controller.agent.interface.ts` | Declares existing `CanBoardContainerNow`; interface erased, implementation unchanged. |
| `ai-runtime-resource-service-capture.ts`, `emit-construction-placement.ts` | Join the `satisfies` syntax; intended syntax-normalized emitted code identical. |
| `ai-runtime-resource-coverage-capture.ts` | Join syntax and guard missing private cohort before dereference. Private array only appends and indexed IDs are created from its length; installed/repeated/converted/replaced/saturated/tick-loss differential matches original intended output. |
| `pawn-order-observation.ts` | Retain checked first order before observer callbacks. Native private array contains only successfully enqueued order references; successful/ambiguous/nested/error/disposal differential matches original. |
| `ai-multiplayer-queue-world.ts`, `ai-multiplayer-shared-queue-world.ts` | Retain checked completion ID; native outcomes carry dense string arrays. Fifteen actual-method differential cases cover product/research completions and empty/multiple-ID rejection in both branches. Existing adapter specs pass. |

The four guards add runtime instructions; no zero-cost claim. Equivalence is limited to dense native outcomes,
private capture arrays and typed diagnostic callbacks. Sparse/malformed arrays, accessor side effects, reflective private
mutation or callbacks escaping their typed origin contract can differ. Native command/outcome constructors and private
writers must stay within that domain in the eventual paired workload. Unit/differential evidence does not establish a
legal equivalent world or gameplay victory. Prior later native repairs can change trajectories and must be accounted for.

**Planner control:** original pinned gameplay sources and fixtures reproduce exactly the same land-throughput mismatch
(`desired: 1`, fixture expects `2`), with 25 passing cases and one failure. The derived source has identical emitted
planner code. The unrelated Phaser overlay remains installed during this pure control; no claim that the complete
original tree passes. No fixture expectation or production policy was changed to qualify compilation.

**Size evidence:** derived all-app closure: 84 JS/CSS outputs, 6,234,949 raw / **1,594,251 gzip bytes**; including the
same 18 referenced fonts: 102 outputs, 10,031,453 raw / 3,188,155 gzip bytes. Candidate production inputs at `17fde8c7e`
are unchanged by `6af776cdb` or this batch: 1,595,081 code gzip bytes, **+830 / +0.0520620655%** against this derived
reference. This falls below 0.5% for the explicitly derived code-size comparison only; original pinned acceptance and
complete C8 are not passed. Reference has 39 reachable AI testing modules / 112,524 raw contribution bytes; candidate
has 40 / 114,606. These raw module totals are not independently compressible gzip bytes or the whole introduced machinery.
Lazy all-app reachability is neither initial download nor RTS-only load. Existing initial-budget warning remains.

**Replay/provenance:** patch SHA-256
`d9a65f6afed24f2b068d07f8b234dcc06df0da1938a21815526d0739a5a0cecb`; sorted changed file/hash set
`dbf35afcb4ffc3a47a48665281f6db6af9212bddb31635fd921933db6114a373`.
Derived identity is original full SHA plus this patch SHA. Final production build passes in 27.5 s, 0/3 cache hits;
five focused Phaser specs / 22 cases pass in 4.47 s. Derived stats SHA-256
`511d6ec718d22c780f413a60f7133d13f56dd125a556f0303caa8d726a85db29`; reachable filename/output-hash set
`025a1e27b8b7b439766455121262d4cec1782ad289bee78f1704215b62b9599e`; bundle inventory SHA-256
`bd21965d559c011aaf99e836169366d9eacf7908af1184ee91d97972b3e8028f`.
The managed measurement checkout remains at
`/home/jernej/.codex/worktrees/skirmish-cost-baseline/fuzzy-waddle`, detached original HEAD with exactly this patch
uncommitted; it is no longer a clean original checkout. It remains protected by the app. Do not archive/delete around
that protection or silently commit it into the feature branch. Clean recreation: hydrate original LFS assets, reuse
identical dependencies, verify/apply the tracked patch, then invoke the same compiler. Reject a foreign revision or
pre-existing source changes before applying; patch context alone does not identify the complete reference.

```sh
# Clean detached original reference only; verify HEAD and patch hash before applying.
test "$(git rev-parse HEAD)" = af9d078d9f3888a97550eb5c08b9215651f8df58
git diff --quiet
git diff --cached --quiet
git apply --check /home/jernej/.codex/worktrees/7977/fuzzy-waddle/docs/ai/759-skirmish-ai/follow-ups/fixtures/cost-baseline-compatibility.patch
git apply /home/jernej/.codex/worktrees/7977/fuzzy-waddle/docs/ai/759-skirmish-ai/follow-ups/fixtures/cost-baseline-compatibility.patch
NX_DAEMON=false node node_modules/nx/dist/bin/nx.js build portal --configuration=production --stats-json=true
```

Ignored `tmp/ai-plans/759-validation/cost-batch/` retains `baseline-qualification.json`, original/derived planner logs,
`derived-baseline-phaser-tests.log`, `derived-baseline-build.log`, `derived-baseline-bundle.json`,
`derived-bundle-comparison.json`, every derived output/index/stats and one-off qualification/control/measurement scripts.
`reference-closure-audit.json` independently checks patch application against a temporary original-source Git index,
all 11 resulting file hashes, five environment/config hashes, all 102 retained output hashes/bytes/gzip sizes and 53
local documentation links/anchors. The temporary index is removed without modifying either checkout's real index.
No raw artifacts need enter model context. Missing local artifacts require fresh scoped checks; the tracked patch and
the original compiler-failure checkpoint remain the reproducible source authority.

**Implementation Review:** inspected all 11 hunks, type erasure, exact native/private array writers and caller contracts;
did not merge planner filters, copy later owners or suppress the old fixture failure. Checked original/derived control
and reachable output graph with consistent per-file compression.
**Omission Audit:** Q1–Q4 have scoped evidence; Q5 explicitly remains open. No native pair, gameplay correctness, zero
allocation, unchanged guard timing or whole machinery-size saving is inferred from compilation/differentials.
**Separate Final Closure Audit:** after checks, verified patch replay, actual source set, retained bundle bytes/hashes,
documentation links, unchanged candidate production inputs, unrelated Nx ancestor and exact staged scope. No generic
tool/skill update was justified. This closes the compile-reference prerequisite only.

**Next combined batch / why:** GPT-6.1 Sol / high for equivalent native-world setup and paired C8 CPU/allocation costs.
Verify patch/source identity first; qualify legal equal roster/map/population/command stream/tick ceiling, comparing state
and native outcomes before interpreting timing. Account for later refused-Move/Gather-progress/editor-roster repairs;
do not use the old orphan-owner two-player Ember setup. Warm once, run at least three alternating pairs per
production/unmarked/marked mode, isolate hook costs from renderer/planner/capture time and retain variance/digests.
If equivalence fails, report the first causal divergence and a concrete scope decision. Keep original pinned budget
blocked and label derived results explicitly. Group any justified cost repair with affected reruns, commit/push and pause.
M11/M12, broader final gate and the end-of-gate necessity review remain mandatory.

### Final-gate cost prerequisite checkpoint (2026-10-09, paired C8 blocked)

Historical source-prerequisite result. The [reference qualification checkpoint](#final-gate-reference-qualification-checkpoint-2026-10-10-compile-prerequisite-checked)
owns the newer derived compilation reference and size comparison; the original pinned-source failure below remains valid.

User authorized the next combined cost batch with commit/push/pause. Clean base/remote were
`17fde8c7ebf00825b99fe6bf73c294ddbd25133a` on `feature/759-skirmish-ai`, worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. Actual host model/effort unknown; no subagents or model switch.
The containing commit owns one added production-installation regression and evidence/operator guidance. No production
source, build configuration, baseline, oracle, game recipe, timer, listener, journal or useful activation changed.

**First disagreement / why it blocks C8:** a managed detached checkout of the exact pinned source
`af9d078d9f3888a97550eb5c08b9215651f8df58` fails portal production compilation: 31 diagnostics across 13 source files.
This includes three newline-separated `satisfies` parse failures, missing `CanBoardContainerNow`, unchecked optional
entries and unretained literal/narrowed types. Its tracked tree stayed clean. Package/lockfile, portal project,
TypeScript base and Nx configuration hashes match the candidate; both use the same installed dependency directory.
LFS checkout hydrated the baseline's own assets (541 checked audio assets). Baseline uses the direct Node/Nx entry:
pnpm's dependency freshness check rejects the reused modules symlink before compilation; bypassing that launcher does
not change source, compiler, dependency versions or build options. The actual compiler failure remains decisive.
No baseline bundle or equivalent native world can be accepted, so no full-world pairs or budget delta were fabricated.

| Acceptance | Evidence and purpose | Status |
| --- | --- | --- |
| C8 runnable pinned baseline / same environment | Exact detached revision; matching five configuration/dependency hashes; real production compiler failure retained. | Blocked on baseline source; candidate builds |
| C8 production/unmarked capture installation | Added `install-ai-runtime-production-capture.spec.ts` case with production environment and matching marked host: no capture construction, config read or shutdown/destroy listeners. Existing unmarked/marker/replacement/teardown and scene isolation/overflow controls pass. | Focused boundary checked; whole-world profiling pending |
| C8 empty protocol/scene fences | Chromium isolated-source reset/lose probe: warm once, three alternating pairs of 500,000 cycles; actual baseline/candidate method bodies, same unattached keys and actual resource enum. CPU/heap profiles separate method stacks from caller/render/planner work. | Isolated fast-path evidence only |
| C8 reachable shipping bytes | Actual candidate production stats and byte-checked outputs; index JS/CSS roots, static/dynamic import closure, gzip level 9 per output. Test-owned source contributions remain measurable. | Absolute candidate size checked; baseline delta unavailable |
| C8 complete paired CPU/alloc/gzip budgets | Zero qualified native pairs. No simulation p95, marked installed-hook cost, equivalent state/outcome digests or 0.5% baseline gzip delta. | Blocked; no C8 acceptance/FPS claim |
| Review / publication / wider gate | Implementation review, Omission Audit and separate Final Closure Audit; exact owned paths and remote equality at publication. K5 release, M11/M12, wider gate and final necessity review remain open. | This prerequisite slice checked; C8 not complete |

**Measured independent evidence:** candidate production build passes (34.4 s, 0/3 cache hits; existing initial-budget
warning). The all-app reachable code closure is 84 JS/CSS outputs, 6,238,883 raw bytes and 1,595,081 gzip bytes.
Including 18 CSS-referenced font outputs gives 102 outputs, 10,035,387 raw bytes and 3,188,985 gzip bytes. Code and media
totals stay separate for the entry/chunk budget. This includes lazy routes and is not the initial download or only the
RTS route. Forty modules under the Phaser AI `testing/` directory
contribute **114,606 raw bundled bytes**; this includes runtime capture, presets/host and multiplayer test adapters.
Module contributions are not independently compressed sizes. Runtime installation guards therefore do not prove that
test code disappears from the shipping bundle. No size regression or budget violation is inferred without the baseline.

The isolated reset/lose pairs take baseline 56.3–67.2 ms (median 56.5) versus candidate 14.1–14.4 ms (median 14.3) per
500,000 cycles. With 128-byte heap sampling, native profiler estimates assigned to those source method stacks are
80,488,272 baseline bytes versus 3,460 candidate bytes. The candidate scene-fence method stack has no sampled allocation;
there is no corresponding scene-fence module on this baseline. Heap frames omit source URLs, so attribution joins
their script IDs to CPU source/function frames. JIT/caller/profiler allocations are excluded and inlining/sampling remain
limits. These are TypeScript-transpiled isolated methods on unattached object keys, not a native game, production
bundle or bound on per-tick overhead. No zero-allocation or zero-normal-play-cost claim is made.

**Checks:** doctor/context pass; two native specs/six cases and protocol observer spec/five cases pass; actual Phaser
spec typing, scoped lint/structure and format pass. Prior full native 702 and gameplay/report checks remain prior scoped
evidence; no production source changed and no whole-match replay was needed to expose the baseline prerequisite.

```sh
# Baseline cwd: managed detached checkout at exact af9d078d9; reuse the identical installed dependencies.
node tools/assets/check-git-lfs.mjs
NX_DAEMON=false node node_modules/nx/dist/bin/nx.js build portal --configuration=production
# Candidate cwd: /home/jernej/.codex/worktrees/7977/fuzzy-waddle
pnpm exec nx build portal --configuration=production --stats-json=true
node tmp/ai-plans/759-validation/cost-batch/measure-candidate-bundle.cjs
node tmp/ai-plans/759-validation/cost-batch/measure-unobserved-fences.cjs
pnpm exec jest --config libs/games/probable-waffle/phaser/jest.config.cts --runInBand --runTestsByPath libs/games/probable-waffle/phaser/src/lib/data/scene-resource-observation.spec.ts libs/games/probable-waffle/phaser/src/lib/player/ai-controller/testing/install-ai-runtime-production-capture.spec.ts
pnpm exec jest --config libs/games/probable-waffle/protocol/jest.config.cts --runInBand --runTestsByPath libs/games/probable-waffle/protocol/src/lib/game-instance/probable-waffle/player-resource-observation.spec.ts
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
```

Ignored `tmp/ai-plans/759-validation/cost-batch/` retains build/check logs, candidate stats and every reachable output,
the stats-derived bundle inventory,
two one-off measurement scripts, three CPU/heap profiles, the isolated probe and `cost-evidence-manifest.json` with
environment/config/source/artifact hashes. The bundle inventory SHA-256 is
`ef04cce94a6ed5fc2d5e07fdc7faf367d1797df6ffb1ee95bc2b46b0e33261e8`; isolated probe SHA-256
`1bbc908ce082c116ad84dbe6cf3632f90025513e07d660f1e4a40e434c53905f`. Reachable bundle-set digest is
`b42f89e3368134ef42ffbe8c672db09609337a5a001138b4897d43d041f4f28f`;
stats SHA-256 `b5b5fc563caa5cd9e6b6ef4ce86a05b32bf03147ed88aeab175ee4cbb0e20601`.
Scripts are local measurement artifacts, not new shipping/report machinery. Recreating them requires the documented
closure/sampling method; missing artifacts supply no evidence. The clean measurement checkout is retained at
`/home/jernej/.codex/worktrees/skirmish-cost-baseline/fuzzy-waddle`: app archival returns
"This worktree is protected by a pinned task or workspace." No deletion workaround was used. Reuse the exact detached
revision for qualification, or recreate/hydrate it if absent on another host.

**Implementation Review:** checked the production guard before capture construction and configuration reads; the new
case exercises a matching marked host and actual Phaser EventEmitter. Reviewed same dependency/config/source identity,
native build failure, reachable import graph and per-file byte equality, gzip scope and profiler script-ID attribution.
**Omission Audit:** every row above has scoped evidence or a named blocker. The three isolated pairs are not counted as
the three required native-world pairs. Retained test-only bytes and positive sampled candidate bytes are reported;
no new capture-off optimization or production exclusion is justified from a missing baseline delta alone.
**Separate Final Closure Audit:** fresh focused checks, type/lint/format, source hashes, documentation links, unchanged
production inputs and exact staged ownership checked. This closes only baseline diagnosis and independent cost evidence;
it neither closes C8 nor the final release gate. No reusable skill/tool change was warranted.

**Historical next combined batch / why:** GPT-6.1 Sol / high for C8 baseline qualification, then equivalent-world paired measurements
and any measured cost repair. Preserve `af9d078d9` as the original source and failed-build evidence. Investigate a
separately identified minimal compilation-compatibility overlay, reviewing every change for native/observation behavior;
it is a derived reference and must carry its own patch/source digest. If equivalence cannot be justified, keep the
original comparison blocked and present a concrete replacement-baseline/scope decision. `0641e9ed5` is the first
recorded production-build pass but already contains the bounded machinery, so it cannot silently measure that
machinery's full introduction. Do not copy candidate owners wholesale, borrow its bundle, disable strict checks or
claim a passing C8 budget on a different reference. Only after qualification: legal equivalent roster/map/population/
commands/tick ceiling, warm-up and at least three alternating native pairs in production/unmarked/marked modes,
isolated CPU/allocations, variance and native state/outcome/source/bundle digests. Keep the retained shipping test bytes
for the end-of-gate necessity review. Commit/push the coherent batch and pause.

### Final-gate native causal checkpoint (2026-10-09, stage checked)

Clean base/remote `e3f192e0c243f5d97b6e98813d9e7791850328ca`, branch `feature/759-skirmish-ai`, worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. User authorized this combined causal repair batch and active final
checks, then commit/push/pause. Actual model/effort unknown; no switch, new chat or subagent. Containing commit owns
publication; verify remote on resume. Unrelated Nx merge `59f72e037` retained.

**Diagnosis / first disagreement:** an offline audit invokes the actual shared lineage validator for all 34 accepted
queue, construction and service commands in the prior 69,310,679-byte native artifact. Only four `lost_outcome` facts
fail lineage: one Move and three gathering orders. The Move repeatedly returns false from real navigation starting
at tick 53 but remains current until tick 7,220. The gatherers continue positive native harvesting/drop-off before and
after their timeouts, yet publish no progress outcome. These are native command lifecycle defects, not a reason to
relax the report validator or extend its timeouts. The roster error independently originates in direct editor actors
for absent player 3; campaign participants are resolved before actor initialization.

**Implemented / why used:** `PawnAgentMovement.stopFailedMove` settles the current refused Move through existing
`PawnAgentOrders.Stop` and terminal classification. Exact current-order/liveness checks prevent an old Promise from
stopping a replacement. Attack-move and gather false-return recovery remain; exception cleanup keeps current-order
ownership. `PawnAgentResources.reportResourceProgress` publishes the existing `active` outcome after a finite positive
native return, only for the same current order, addressed actor and owner. This renews existing command reconciliation
while zero work, replaced/converted/inactive/unstamped orders and truly stalled work retain timeout behavior.
It proves native work, not terminal completion, income attribution or useful capacity. No new observer, timer, journal,
schema or planner policy. Durable guidance is in `architecture/resilience-and-lifecycle.md` beside the AI controller.

`SceneActorCreator.spawnFromSpawnList` excludes direct editor actors for absent positive player slots before components
publish owner/player changes or registration. Spawn markers already use this boundary. Neutral `-1`/unowned and
participating player/campaign actors retain initialization; saved/runtime definition creation is unchanged.
The redundant local GameObject alias is removed so the touched owner satisfies the existing structure rule without
refreshing a baseline. Three new specs cover movement terminals, resource progress/reconciliation and editor roster.

| Acceptance / state | Evidence and remaining boundary |
| --- | --- |
| 1. Resume and full causal trace / checked | Doctor/context pass; 34 real accepted commands audited with actual family validators. Exactly four timeout facts cause prior lineage failures. Queue/construction validators and all authority oracles unchanged. |
| 2. Native lifecycle repair / checked | Before: six failing new regressions / fourteen passing controls. Final: 23 new cases; native Move failure/stale Promise/exception/attack recovery and positive/zero/stalled/replaced/converted/inactive/unstamped resource controls pass. Full native suite 146 suites / 702 tests passes. |
| 3. Legal roster / checked | Absent-owner actor destroyed before initialization/registration; neutral and campaign player-3 controls pass. Real 300-target-tick probe ends at 303 with no page errors, no player-3 actors, 849 facts and all 16 selections normalized; refused Move terminal at tick 26. Screenshot inspected. |
| 4. Full native bridge / checked, scenario failed | Unchanged single PRO-03/Tivara diagnostic: 611 decisions / 12,031 ticks; 5,737 facts, zero dropped facts/snapshots; all 611 exact decisions retained, zero normalization/bridge failures and zero lost_outcome. 95 native resource progress outcomes; Move terminals at 53/11,699. Useful fields stay null. |
| 5. Compatibility/quality / checked | Actual Phaser spec and E2E compiler configs exit zero; all six sources pass scoped libs flat ESLint with explicit existing structure rule and Prettier. Portal production build passes; initial-bundle warning remains, not paired C8 proof. Final formatted resource spec rerun: ten passing cases. |
| 6. Release/cost / open or blocked | Full PRO-03 still fails missing production contract, mandatory authority gaps and minimum military-producer count. M11 blocked/M12 open; no useful activation or scenario registration. C8 and wider server/socket/save/restart/hash/calibration/necessity review pending. |
| 7. Delivery / scoped | Three native sources, three new specs, durable lifecycle doc and two existing coordination docs. Exact staging; no ignored raw artifact, fixture, oracle, config or baseline change. Normal push and remote-SHA verification required. |

**Provenance / retained evidence:** full matrix
`tmp/ai-plans/759-validation/browser-readiness-batch/1791575849795-diagnostic_failed.json`; raw
`tmp/ai-skirmish-runtime-results/run-BZnXyt/runtime.json`, **106,133,304 bytes**, SHA256
`f2d37b5b69a203f11f778ed264f0689a020ee950c7f60b4f9f75b4720bd873e5`.
Source base above, dirty `fnv1a32:f26886cd`, fixture `fnv1a32:221d6201`, seed 759101.
Process wall 249,738 ms; phase setup 7,554 ms, advance 29,021 ms, settle 1,336 ms, capture 176,305 ms.
These are marked diagnostic phase times, not isolated hooks, allocation evidence or paired normal-play cost.
The short probe (`causal-native-probe.json`) is 13,925,856 bytes, SHA256
`1f7bed9401d2cdf22be3f5478200963b55ff85421f731d9ed87b07cae04fdff9`.
`causal-browser.spec.ts` asserts all page errors, unlike the existing AI-labelled error filter; no general full-match
page-error guarantee is inferred from empty `aiErrors`. `causal-startup.png` retains the real screenshot.

```sh
pnpm agent:doctor
pnpm agent:context -- --issue 816
pnpm exec playwright test --config tmp/ai-plans/759-validation/browser-readiness-batch/lineage.config.ts
pnpm exec jest --config libs/games/probable-waffle/phaser/jest.config.cts --runInBand
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm exec nx build portal --configuration=production
pnpm exec playwright test --config tmp/ai-plans/759-validation/browser-readiness-batch/causal-browser.config.ts
AI_SKIRMISH_PROFILE=1 pnpm exec node tools/ai/run-skirmish-matrix.mjs --scenario PRO-03 --variant tivara-production --repetition 1 --mode runtime --run-id k5-native-causal-candidate --output tmp/ai-plans/759-validation/browser-readiness-batch
pnpm exec node tools/ai/summarize-skirmish-report.mjs --report tmp/ai-plans/759-validation/browser-readiness-batch/1791575849795-diagnostic_failed.json --scenario PRO-03 --failures-only --details
```

Ignored directory above retains `lineage-audit.json/log`, failing-before/passing-after logs, full native/compiler/lint/
format/build logs, real probe/screenshot, runtime summary and `causal-evidence-summary.json`. Native full run took
101.558 s while independent checks/startup were active; browser probe 44.2 s. Final production bytes are unchanged
from the full browser run; later edits only format one spec and add documentation. These runs are scoped correctness
evidence, not performance comparisons. Previous 461 synthetic/seven Node and gameplay 274 checks are prior scoped
evidence; their owners were not changed or rerun here.

**Implementation Review:** traced original native facts through accepted commands, movement refusal, current-order
cleanup/terminal classification, real positive resource returns, reconciliation and shared report validation. Reviewed
cross-await replacement, owner conversion, inactive/unstamped boundaries, campaign-before-startup ordering and save/load
consumers. No timeout, report oracle or useful channel relaxed; every new helper has immediate native consumers.
**Omission Audit:** all seven rows have evidence or named blockers; every original native test remains, 23 new cases
execute exactly once. Failed runtime output is retained and not called release success. No gameplay-result comparison,
new fixture family, skill/tool change, baseline refresh or cost claim is inferred.
**Separate Final Closure Audit:** final source/structure/format, actual types, 702 native cases, current production
build, native probe/full bridge, raw hashes, document links and exact staged ownership checked. This closes the causal
repair slice only; K5 release, C8, M11/M12 and wider gate remain open. Publication requires normal push/remote equality.

**Historical next combined batch / why:** GPT-6.1 Sol / high for C8 equivalent baseline/world setup, paired normal-play/marked
CPU/allocation/reachable-gzip measurements and justified causal cost repair. Read C8 in this plan and use pinned baseline
`af9d078d9`, one warm-up and at least three alternating pairs in production/unmarked/marked modes. The two natural
diagnostics are not controlled cost pairs: world setup, actor identities and outcomes differ. Preserve native digests,
full denominator/oracles and useful nulls; M11/M12 authority/adapter/gameplay remain mandatory after this cost boundary.
Measure before expanding production proof; commit/push the coherent checked batch and pause.

### Final-gate browser readiness checkpoint (2026-10-09, diagnostic repairs checked)

User authorized the next coherent final-gate batch with commit/push/pause. Clean base and remote were
`4f4bd471e58d04a03dfec5e5ffc45944bdd739cd` on `feature/759-skirmish-ai`, worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. Actual host model/effort unknown. The containing commit owns
these repairs; verify its remote SHA on resume. No gameplay policy, fixture recipe, authority oracle, source baseline,
wire/save schema, useful-service activation or model setting changed.

**What changed / why used:** `reconcileRuntimeProductionUnspent` now accepts publication after the exact consumed
input tick, retaining the existing identity, accepted intent, lease, admission, payment and total checks. Async planning
can publish at tick 23 for input tick 20; requiring equality falsely invalidated genuine cash ownership and suppressed
the whole report. Publication before input still fails. `reconcileRuntimeUnspentEntry` extracts unchanged per-entry
admission/payment/physical-transfer/release checks to keep the changed owner within source/function limits. It has one
consumer, the same reconciler; this adds no capture or gameplay manager.

`publishRuntimeResult` and `skirmish-runtime-result.mjs` move the complete browser result into a unique retained artifact
instead of the subprocess log. The matrix reader validates source/fixture/dirty provenance and report shape, checks a
256 MiB ceiling before loading, and fails closed on missing/malformed/oversized/foreign results. Direct Playwright
callers retain the old console protocol. Matrix reports locate the raw artifact through `execution.resultArtifact`.
This preserves failed native evidence without raising the existing 32 MiB subprocess log buffer or weakening native
fact/snapshot/route bounds. Two report specs and one Node spec add timing, transport and unavailable/negative controls.

**Real-browser evidence:** inventory remains 19/120 registered, 97 supported missing, four deferred, 13 recipes.
PRO-03/06/07's natural recipe has no mandatory `requiredProductionContracts` or full production-evidence adapter.
Do not launch the whole production family expecting release success. The initial single PRO-03/Tivara run failed with
`spawnSync pnpm ENOBUFS`, no retained runtime payload. A separately retained real startup/300-tick probe reaches the
normal lobby and Phaser world, installs capture before setup, and observes 903 native facts and 16 selections. Its
8,165,349-byte capture/report originally had two unspent timing failures and zero normalized decisions. Replaying
those exact raw bytes after repair retains all 16 identities/positions, zero normalization failures and null useful
fields; SHA256 `37c863f96380b040d4ca908d8761a88b8d14538c939112f93e0f0dd0d73bb3c2`.
Actual queue payment, mutation/progress/completion, resource mutation, shared delivery, registration and construction
events are present. This is real captured data replay, not a full PRO case or continuous-usefulness proof.

The unchanged full diagnostic recipe now completes and retains a **69,310,679-byte** runtime artifact:
`tmp/ai-skirmish-runtime-results/run-oEObnE/runtime.json`, SHA256
`b4b27d0e19b51db5bb52e6057c1d5cb6e49c00b04bb86ac9ac146b1b81d05261`.
Matrix artifact `tmp/ai-plans/759-validation/browser-readiness-batch/1791571496389-diagnostic_failed.json`:
source base above, dirty digest `fnv1a32:0ed8a8c4`, fixture digest `fnv1a32:221d6201`, seed 759101. One real test,
611 decisions, 12,020 actual ticks, 244,964 ms process wall time. Capture retains 5,316 facts / 611 selected decisions,
zero dropped facts/snapshots. Report remains **diagnostic_failed**: missing production contract, normalized
`production_ai_outcome_lineage`, mandatory authority gaps and capacity assertion; the parent correctly suppresses
normalized decisions and the browser bridge fails. Four native `lost_outcome` terminals are retained as uncertainty,
not promoted to proof. Trace route/service/construction lineage against the exact report before choosing a repair;
this batch does not assert that those four terminals are the unique cause of the lineage failure.

The startup probe also observes two `Player not found with number 3` page errors. Ember Enclave directly authors
player-3 actors while the skirmish lobby contains players 1/2; `SceneActorCreator.spawnFromSpawnList` initializes direct
editor actors without the missing-player guard used for spawn markers. The runner only records AI-labelled page errors,
so its empty `aiErrors` does not establish an error-free world. Legal-world/M12 investigation remains required.
Screenshot `startup.png` and bounded `browser-errors.json` retain the reproduction; no map or roster was changed.

**C8 status:** phase totals are setup 6,141 ms, advance 27,089 ms, settle 1,196 ms and capture 175,220 ms.
The last checkpoint's capture is 42,341 ms. These combine browser capture and transport work, not isolated hook CPU
or allocations, and do not prove disabled-path overhead. The existing production bundle still contains instrumentation
strings; no attributed byte count or paired baseline comparison was measured. C8 remains pending: baseline
`af9d078d9`, warm once, at least three alternating pairs with identical seed/map/population/commands/tick bound in
production/unmarked/marked modes, native digests, variance, isolated CPU/allocations and reachable gzip bytes. Preserve
the existing 1% plus 0.1 ms/tick p95 and 0.5% gzip budgets. M11 remains blocked, M12 open; no wider release closure.

| Acceptance / state | Evidence and remaining boundary |
| --- | --- |
| 1. Resume/readiness / checked | Clean exact remote/base; doctor/context pass; inventory and actual K5/C8/M12 consumers inspected. |
| 2. Async cash selection / checked | New late-publication test fails before repair with the same two native-probe failures; pre-input control passes. Final positive/negative controls and exact native replay pass. |
| 3. Large result transport / checked | Seven Node/tool tests, including 33 MiB exact payload, fresh paths and malformed/foreign/oversized negatives; two publisher controls. Real 69,310,679-byte failed payload retained end to end. |
| 4. Compatibility/limits / checked | 461 synthetic report tests across 43 specs pass; actual E2E compiler exits zero. Nine sources pass scoped ESLint plus explicit structure rule and Prettier. AST extraction audit retains all 15 moved ownership statements after the required continue-to-return adaptation. |
| 5. Browser gate / failed, evidence retained | Full diagnostic performs 611 decisions/12,020 ticks; full authority, outcome lineage and bridge remain failed. Short native replay passes only its scoped diagnostic claims. |
| 6. Cost and release / pending/blocked | C8 paired measurements absent; legal-world/page errors, M11/M12 and broader server/socket/save/restart/hash/calibration remain. |
| 7. Delivery / scoped | Nine sources plus testing README, HANDOFF and this ledger. No unrelated or ignored raw artifact is staged; normal push and exact remote SHA verification required. |

Ignored evidence directory: `tmp/ai-plans/759-validation/browser-readiness-batch/` contains baseline/candidate logs,
startup screenshot/errors, exact native probe, replay summary, extraction audit, report/type/lint/format/tool logs and
compact runtime summary. The probe's authored 300-tick wait ends at actual tick 303; the full recipe's 12,000 target
ends at 12,020. Neither uses capture reset or planner-input replacement. Final runtime source differs from the dirty
digest only by erased type-import formatting; final compiler/lint/format and replay cover those current bytes.

```sh
pnpm agent:doctor
pnpm agent:context -- --issue 816
pnpm exec node tools/ai/generate-skirmish-test-catalog.mjs --inventory
AI_SKIRMISH_PROFILE=1 pnpm exec node tools/ai/run-skirmish-matrix.mjs --scenario PRO-03 --variant tivara-production --repetition 1 --mode runtime --run-id k5-readiness-candidate --output tmp/ai-plans/759-validation/browser-readiness-batch
pnpm exec node tools/ai/summarize-skirmish-report.mjs --report tmp/ai-plans/759-validation/browser-readiness-batch/1791571496389-diagnostic_failed.json --scenario PRO-03 --failures-only --details
pnpm exec node --test tools/ai/skirmish-runtime-result.test.mjs tools/ai/skirmish-runtime-diagnostic-selection.test.mjs
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
```

The report check uses the previous 41-spec production/resource/route/construction/queue selection plus
`skirmish-ai-runtime-production-unspent.spec.ts` and `skirmish-ai-runtime-result-output.spec.ts`; 457 original controls
remain, four added. Browser code is not part of the production portal graph; no new build, native or gameplay change
requires repeating the previous checked suites/build. The lint check uses the real E2E flat config with the existing
source-structure rule added in an ignored task config; no repository config or baseline changed.

**Implementation Review:** traced actual input identity versus publication, cash ownership, native payment/release,
matrix environment/request, publisher-before-assertion, subprocess completion, retained artifact read and report/index
consumers. Missing artifacts and nonzero process exits cannot become success. No fallback to truncated log data.
**Omission Audit:** all seven rows have evidence or named blockers; every original report registration/oracle remains,
helpers have consumers, direct console compatibility remains, wrong/early identity and unavailable authority stay
negative. No speculative gameplay fix, new scenario registration or cost claim. No reusable skill change required.
**Separate Final Closure Audit:** current source/types/format/lint/structure, extraction invariants, artifact hashes,
all controls, remaining real failure, document links, exact task scope and unrelated Nx merge retained were checked
before publication. This closes diagnostic repairs only; K5/C8/release remain open.

**Historical next combined batch / why (native causal repairs checked above):** GPT-6.1 Sol / high for the actual native outcome lineage and legal-world/M12 boundary.
Start with the named report above (rerun the exact diagnostic if ignored artifacts are absent), then narrow
`skirmish-ai-runtime-route-service-lineage.ts`, shared command outcomes, construction lineage and
`SceneActorCreator.spawnFromSpawnList`. Establish the first disagreement and a focused native regression before
changing semantics. This makes a real match judgeable before paired C8 measurements. Group causal repairs and legal
setup together; retain strict oracles, null useful quantities and phase-cost evidence. Publish that coherent batch and pause.

### Final-gate combined gameplay checkpoint (2026-10-09, stage checked)

User authorized continuing with the next coherent batch, with stable-boundary checks and one commit/push/pause.
Base `04f311f2d0b5c734551c7b0ac767798b45ff09a1` was clean and remote-verified on `feature/759-skirmish-ai` in
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. Preserve unrelated Nx merge `59f72e037`. Actual model/effort
unknown; no model switch, subagent or new machinery. The containing commit owns this batch; verify remote on resume.

**Purpose / runtime repair:** `AiDecisionPlanner.strategyFor` retains the prior skirmish assessment while replacing
its stance-owned fields. Otherwise an unchanged future production schedule is abandoned on the next macro step as
`objective_changed`. `AiMacroObservation.owned` sorts its fresh filtered array by actor identity, keeping actor-set
selection, demand order and digest stable when equivalent inputs are permuted. Skirmish assessment updates still
belong to the skirmish proposal; changed-objective, emergency and expired-schedule controls remain passing.
Restoring each original production owner alone against the repaired fixtures reproduces two schedule failures and
four ordering failures; restoring candidate bytes makes both production specs pass all 22 tests. Candidate hashes
are identical before/after that controlled regression experiment. No balance, usefulness or wire/save policy changed.

**Fixture contracts / why:** nine required numeric spread slots use existing `requireAiTestEntry`; missing authored
records throw rather than becoming unchecked assertions. Debug demand/intent/transport fixtures use their actual
types and transport ID; adaptation IDs retain their literal type. Route helpers retain the actual combat domain and
narrow a real `water_transport` result before shared lifecycle/route consumers read it. Completed tactics outcomes
carry actual execution identity and `resultingActorIds`, without obsolete `reason` fields or a broad type assertion.
Victory-route fixtures import their actual brain-state contract. These repairs remove all 44 strict diagnostics in
12 existing specs, including two unmodified transport specs repaired through their shared fixture.

Invalid worlds now exercise their advertised behavior: economy workers have gather capability; the healthy-workforce
control has six workers, matching the existing recovery floor. Production uses the registered male worker type and
both-faction constructs capabilities name the actual producer. Ordinary production stock 230 leaves 200 after the
existing 10 reserve/20 obligation; explicit exact/below-price cases remain. Food stock 230 funds granary plus field;
an added stock-109 control leaves 79 and rejects the granary. PRO-01/05 also required the matching builder capability;
do not attribute those original failures solely to affordability. PRO-02's schema label is corrected from
`dated_land_pressure` to `dated_ground_pressure`, retaining the desired-force assertion of 12.
Victory enemy positions scale by 20 to stay outside the home-defense radius while preserving graph connectivity;
static cores cost zero housing. The bounded smaller-mission target is an unarmed worker; an added otherwise identical
armed defender suppresses attack. Its optional, incomplete `tactics: {} as never` is omitted. The spending fixture that
spent 100 of a 130 economy quota now correctly expects a Wood conflict; a separate exhausted 260-of-260 setup retains
the null assertion while both pending purchases individually fit remaining resources. Spending production code is unchanged.

**Source ownership / splits:** 31 TypeScript paths: two production owners, six fixture owners and 23 specs (15 existing,
eight new). All paths below are under `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/`:

- `planning/ai-tactics-test-fixtures.ts` supports the original tactics spec plus `ai-tactics-combat.spec.ts`,
  `ai-tactics-deadlines.spec.ts` and `ai-tactics-targeting.spec.ts`; all 24 original cases remain.
- `planning/ai-skirmish-test-fixtures.ts` supports the original manager plus `ai-skirmish-mission-lifecycle.spec.ts`
  and `ai-skirmish-boundaries.spec.ts`; all 11 original cases remain.
- `planning/ai-offensive-opportunity-test-fixtures.ts` supports the original selection spec plus
  `ai-offensive-opportunity-domains.spec.ts` and `ai-offensive-opportunity-recovery.spec.ts`; all 13 original cases remain.
- `testing/ai-economy-forecast-test-fixtures.ts` supports the original forecast spec and
  `ai-economy-forecast-budget.spec.ts`; all six original cases remain.
- `testing/ai-production-scenario-test-fixtures.ts` shares production setup; registrations and scenario rows stay
  in the original production spec. Existing transport fixture is the sixth fixture owner.

These helpers are test-only consumers, keeping setup reusable and all changed sources within existing file/function,
width and declaration limits. The debug summary also splits its oversized describe without moving cases to new files.
The generated testing catalog refreshes 37 owner-link/inventory lines, including the generator's current `research=0`
field. No manifest, recipe, registration, denominator or new runtime coverage is claimed. Total published scope:
31 TypeScript sources, generated catalog and two existing coordination docs (34 paths).

| Acceptance / state | Evidence |
| --- | --- |
| 1. Clean baseline / passed | Doctor/context pass; actual gameplay config reproduces 44 diagnostics and full target reproduces 22 failures/252 passes on the clean base. |
| 2. Causes / passed | Contract-correct fixtures and both production repairs reviewed; isolated original-owner regressions fail 2/4 respectively and restored candidate passes 22 tests. |
| 3. Oracles / passed | AST audit retains 100 registration expressions and actual scenario-array initializers; all 303 expected matcher arguments retained after checked-read/parentheses/domain-label normalization; 306 now, three added controls. No skips, strictness/baseline/threshold changes. |
| 4. Compatibility / passed | Actual full gameplay 60 suites/274 tests and Phaser 143 suites/679 tests pass with zero Nx cache hits; 457 synthetic reports/41 specs pass without browser/server. All four actual compiler configurations have zero diagnostics. |
| 5. Quality/build / passed | Gameplay lint executes/pass; Phaser/protocol lint pass via 2/2 cache hits. Portal production build and dependencies pass by execution, 0/3 cache hits. All 31 sources pass formatting, explicit AST structure and diff whitespace checks; generated catalog check passes. |
| 6. Remaining gate / pending | K5 real-browser and C8 paired disabled-path/bundle measurements are unrun. Server/socket/save/restart/hash/calibration and M11/M12 still prevent release closure; no complete useful-service activation. |

Ignored evidence: `tmp/ai-plans/759-validation/gameplay-fixture-batch/`. Exact source manifest `source-files.txt`,
base snapshots/logs, final compiler logs (`types-gameplay-final`, `types-native-closure`, `types-report-closure`,
`types-protocol-final`), `tests-gameplay-final`, `tests-native-final`, `tests-report-final`, `quality-final`,
`lint-consumers-final`, `build-final`, `format-closure`, `catalog-final`, regression logs/summary and `provenance.json`.
Final 31-source SHA256 digest: `7ce9cc7f0bdf004d5f17a09826bec9364f0dda78706bd1dbe3ed897a5bea6ed0`.
Artifacts may be absent on another machine; recorded counts are scoped evidence, not permission to invent raw records.

```sh
pnpm agent:doctor
pnpm agent:context -- --issue 816
pnpm exec tsc --noEmit -p libs/games/probable-waffle/gameplay/tsconfig.spec.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/protocol/tsconfig.spec.json
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm exec nx test probable-waffle-gameplay --runInBand
pnpm exec nx test probable-waffle-phaser --runInBand
pnpm exec nx lint probable-waffle-gameplay
pnpm exec nx run-many --targets=lint --projects=probable-waffle-phaser,probable-waffle-protocol
pnpm exec nx build portal --configuration=production
pnpm exec node tools/ai/generate-skirmish-test-catalog.mjs --check
git diff --check
```

Synthetic reports use the existing ignored `tmp/ai-plans/playwright-resource-gate.config.ts` (actual base config,
only unused webServer disabled) and the same 41-spec selection recorded in the production/queue checkpoint below.
This is report execution, not browser evidence. Intermediate repair runs found and repaired local syntax/import/type
errors; stable final sources pass. The catalog wrapper invocation with forwarded literal `--` rejected its arguments;
the exact direct generator command above is the passing check. No tooling/config change was needed.

**Implementation Review:** reviewed both production diffs against planner/schedule/assessment ownership and macro
set semantics, fixture capability/price/domain/outcome contracts, split imports and every retained causal control.
Filtered actor sorting does not mutate observation input. Existing lifecycle ordering, native/resource authority,
consumed inputs, conservative null useful quantities and actual changed-objective abandonment remain intact.
**Omission Audit:** all 44 diagnostics and 22 reproduced failures addressed; original registrations, parameterized
rows and matcher arguments retained, with explicit schema-label normalization and three added controls. Generated
catalog follows split owners; every new helper has test consumers. No registration/config/save/wire/lifecycle hooks
changed or required for this batch. No reusable skill/tool update justified. Unexecuted release duties remain visible.
**Separate Final Closure Audit:** all six acceptance rows reconciled; final source hashes match the checked candidate,
generated catalog synchronization passes and exact staging contains 34 task-owned paths. All local doc links/anchors
resolve after correcting three older slash-heading backlinks; unrelated Nx history is retained. Passing compatibility
closes this batch's K4 repairs only. Normal commit/push, exact remote SHA and clean status close delivery, not release.

**Historical next grouped batch (now investigated above) — why:** inspect runtime recipe inventory and actual K5/C8 contracts, checking legal-world/M12
prerequisites before the bounded production browser gate and paired disabled-path/bundle measurements. This tests
real native-to-report behavior and ordinary-play cost; builds and synthetic reports cannot establish those results.
Recommend **GPT-6.1 Sol / high** for causal runtime/provenance investigation. Do not assume complete useful authority;
M11 and broader PRO-03/06/07 remain mandatory. Pause after publishing this checked gameplay batch.

### Final-gate combined native fixture checkpoint (2026-10-09, stage checked)

User authorized the three remaining native fixture families in one implementation/check/publication batch, with no
pause or model switch between families. Base `ddd970bb8c223478f6b8881ef352b55936ce5228` was clean and remote-verified
on `feature/759-skirmish-ai` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`; unrelated Nx history is retained.
Actual model/effort unknown. The containing commit owns this batch; verify its remote SHA on resume. No subagent,
new machinery, shared helper, production source, config, source-size baseline, wire/save or useful quantity changed.

**Purpose / ownership:** repair existing native evidence controls against current contracts so later AI reports can
rely on typed actor, queue, payment, movement and campaign records. All paths below are under
`libs/games/probable-waffle/phaser/src/lib/`; 38 existing specs changed, with no new source files:

- Capture/world (18 specs; 54 baseline diagnostics): `player/ai-controller/ai-runtime-decision-input.spec.ts` and
  `capture-ai-producer-exposure.spec.ts`; under `player/ai-controller/testing/`, `ai-multiplayer-diagnostics.spec.ts`,
  `ai-multiplayer-queue-world.spec.ts`, `ai-multiplayer-shared-queue-world.spec.ts`, `ai-runtime-construction-capture.spec.ts`,
  `ai-runtime-pending-commands.spec.ts`, `ai-runtime-producer-route-capture.spec.ts`, `ai-runtime-production-spatial-capture.spec.ts`,
  `ai-runtime-recipient-resource-capture.spec.ts`, `ai-runtime-recipient-roster-capture.spec.ts`, `ai-runtime-rejection-capture.spec.ts`,
  `ai-runtime-route-order-capture.spec.ts`, `ai-runtime-unspent-claims.spec.ts`, `apply-ai-runtime-preset-queues.spec.ts`,
  `capture-ai-runtime-construction-catalog.spec.ts`, `capture-ai-runtime-initial-construction.spec.ts` and
  `capture-ai-runtime-production-world.spec.ts`. Existing `requireAiTestEntry` checks required slots and scheduled
  command roles; actual event kinds narrow mutation/path/placement/order fields. `ObjectNames.Sandhold` is the
  registered current definition with the worker production/construction capabilities these fixtures need, replacing
  the nonexistent `TivaraSandhold`. Canonical capture identities retain enum values. Native preset/initial actors
  use actual GameObjects; corruption controls require the original item/context before changing it.
- Component/movement/lifecycle (15 specs; 34 baseline diagnostics): under `entity/components/combat/components/`,
  `health-component.spec.ts`, `health-component-resource-history.spec.ts`, `health-component-drain-credit.spec.ts`;
  under `entity/components/construction/`, `construction-drain-credit.spec.ts`, `construction-payment.spec.ts`,
  `construction-presentation.spec.ts`, `construction-resource-history.spec.ts`; `entity/components/owner-component.spec.ts`,
  `entity/components/resource/resource-drain-credit.spec.ts`, `entity/systems/movement-completion-observation.spec.ts`,
  `entity/systems/movement-path-execution.spec.ts`, `prefabs/ai-agents/pawn-agent-order-boundaries.spec.ts`,
  `prefabs/ai-agents/pawn-resource-service-observation.spec.ts`, `player/human-controller/single-selection.handler.spec.ts`
  and `world/services/multiplayer/apply-shared-construction-command.spec.ts`. Native health/drain/builder actors replace
  incomplete actor shapes. Payment/callback/player/service records are checked, audio uses its actual parameter
  tuple, and current-tile mocks retain the real 2D shape. Readonly health definition variants replace the definition
  value without calling a gameplay setter or adding a fence. Owner callbacks declare optional owner IDs, missing
  visibility uses the actual null contract, and the pointer event fixture preserves other event constants.
- Campaign (five specs; 13 baseline diagnostics): `campaign/actions/campaign-phaser-world-adapter.spec.ts`,
  `campaign/actions/campaign-trusted-hook-registry.spec.ts`, `campaign/campaign-world-event-adapter.spec.ts`,
  `campaign/objectives/campaign-objective-projection-store.spec.ts`, `campaign/scenario/scenario-reference-registry.spec.ts`.
  Fixtures use team/owner-token/resource-vector/map-key/trusted-hook contracts. Scenario scenes retain real default
  scene data and native marker/actor event dispatch behind explicitly headless scene plugins.

| Acceptance / state | Implementation and evidence |
| --- | --- |
| 1. Baseline / passed | Doctor/context pass on the clean remote-verified base. Fresh actual native spec config reproduces all 101 diagnostics in the 38 selected owners. |
| 2. All three families / passed | Final native spec typing exits zero, with zero diagnostics. No assertion/cast suppression, strictness change or baseline refresh. |
| 3. Oracles / passed | AST audit preserves all 183 registration expressions and parameterized rows; all 799 matcher names/expected arguments match after normalizing checked reads, redundant formatting parentheses and the corrected enum. Guards require actual records/phases; missing authority/null useful quantities remain conservative. |
| 4. Native compatibility / passed | Final full Phaser target: 143 suites / 679 tests, actual execution, zero cache hits. Final lint: zero errors/eight existing warnings; all 38 sources pass Prettier. |
| 5. Review and delivery scope / passed | Formatted-base semantic diff self-reviewed; Omission Audit and separate Final Closure Audit below. Exact scope is 38 specs and these two coordination docs. Publication requires normal push and exact remote SHA verification. |
| 6. Broader gate / pending | Earlier gameplay typing 44 diagnostics and full gameplay 22 failed / 252 passed remain blockers, not rerun by this native-only batch. E2E 457 report controls and earlier build/protocol checks remain unchanged evidence. Browser K5, paired cost/bundle, socket/save/restart/hash/calibration and M11/M12 remain open. |

**Exact checks and provenance:** Phaser 4.2.1, actual project Jest/angular preset and
`phaser/tsconfig.spec.json` including native specs and followed workspace sources. Ignored evidence is in
`tmp/ai-plans/759-validation/native-fixture-batch/` (`source-files.txt`, clean `types-base.log`, final `types-closure.log`,
`tests-closure.log`, `lint-closure.log`, `format-closure.log`, registration/assertion audits, compiler summary,
per-source hashes and `review-semantic.diff`). Final SHA256 source digest:
`fb684127274f4d19bc7d99ad186e4234ef11f6cfe6673d2fd4dfb2ba534a685f`.

```sh
pnpm agent:doctor
pnpm agent:context -- --issue 816
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
pnpm exec nx test probable-waffle-phaser --runInBand
pnpm exec nx lint probable-waffle-phaser
pnpm exec prettier --check $(cat tmp/ai-plans/759-validation/native-fixture-batch/source-files.txt)
git diff --check
```

The first repair type run reduced 101 diagnostics to five task-caused fixture typing/narrowing errors; all five
were repaired. The full initial native run passed 143 suites/679 tests, and the five corrected owners then passed
37 tests. Review removed obsolete unrun labels and an unused import; final full typing/test/lint/format checks ran
on that stable source. Nx Cloud artifact upload failed with ENETUNREACH on final test/lint runs; both executed
locally and exited zero. No remote-cache success is claimed. One-off AST audit formatting normalization was
repaired locally; it is ignored evidence tooling, not a new product authority.

**Implementation Review:** self-reviewed the whole semantic diff and native capture/payment/command/lifecycle
consumers. Retained resource amounts, callback/reference identity, death/restore ordering, original Promises/errors,
queue corruption controls, overflow bounds and listener cleanup; no gameplay policy or useful-authority claim.
**Omission Audit:** all three selected families/all 101 diagnostics are covered; all 183 registrations/rows and 799
expected matcher arguments retained, including negative/recovery cases. No skipped registrations, unused helper,
stale execution labels, new public API or unregistered code. No new behavioral regression test is needed for these
fixture-only repairs. Unchanged shared source requires no E2E/build rerun; real browser/cost and gameplay blockers
remain explicit. No reusable skill/tool change is justified by this local fixture repair.
**Final Closure Audit:** rechecked all six acceptance rows after repairs, final source hashes, actual full-config
selection, final native test count, lint/format, doc links, task-owned scope and unrelated history. Native slice is
stage checked; full K4/M10/release is not closed. Commit/push plus remote verification close delivery only.

**Historical next combined batch (now checked above) — why:** refresh gameplay typing/failure evidence, then group repairs by actual shared
planner/production contract. Start with `pnpm exec tsc --noEmit -p libs/games/probable-waffle/gameplay/tsconfig.spec.json`
and the earlier base-reproduced gameplay failure ledger; earlier counts are 44 diagnostics and 22 failed tests.
Recommend **GPT-6.1 Sol / high** for causal investigation, retaining the now-passing native slice. Finish gameplay K4
before K5 browser and paired cost measurements, so those matches are judged against working shared behavior.
Pause after this checked/published combined native task.

### Final-gate native dispatch/queue fixture checkpoint (2026-10-09, partially checked)

Base `e9ed4cc4916441b13274277f1164165a17095da7` was clean and remote-verified on
`feature/759-skirmish-ai` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. The containing commit publishes this
native fixture slice; verify its remote SHA on resume. Actual model/effort unknown; next recommendation GPT-6.1 Sol / high
for native capture/world contracts. Recommendations do not switch settings. No subagent or reusable skill/tool change.

**Purpose and changed sources:** make existing native command and queue authority controls usable under strict spec
typing before using capture evidence to judge real matches. Eight existing specs changed; no new source files:

- `phaser/src/lib/player/ai-controller/dispatch-ai-intent-command.spec.ts` and `dispatch-ai-brain-result.spec.ts` retain
  checked request/receipt/decision records; actual event kinds narrow the claims, identity and receipt assertions.
  Original ordering, detached values, rejected/copied proposal and dispatch exception expectations remain.
- `phaser/src/lib/entity/systems/shared-queue-resource.spec.ts`, `entity/components/queue/advance-shared-queue-item.spec.ts`,
  `mutate-shared-queue-item.spec.ts` and `observe-queue-completion-authority.spec.ts` require queue lanes, live items and
  callback records through existing `requireAiTestEntry`. Native balances, refund formula, removal/terminal ordering,
  denied progress, restore suppression, exact completion return and subscription cleanup expectations remain.
- `phaser/src/lib/data/emit-queue-item-resource.spec.ts` requires observed records before reading them. Duplicate,
  nested, wrong-recipient/vector/action, malformed-sample and throwing-emitter controls retain their existing oracles.
- `phaser/src/lib/player/ai-controller/testing/project-ai-runtime-queue-resource.spec.ts` declares the authored event's
  actual `finished` phase with `Extract` and `satisfies`; live item fields still permit intentional missing-lineage and
  malformed-progress controls. Research cancellations use the real command shape, retain execution identity, and omit
  the production-only queue index. Wrong owner/type/actor and absent/reused cancellation controls remain negative.

The paths above are under `libs/games/probable-waffle/`. Only specs and two coordination docs changed; no production
observer, planner, money, queue, save/wire, shared helper or configuration change. Useful quantities remain null.
Prettier accounts for most diff expansion in the older compact specs. No baseline refresh or strictness suppression.

| Acceptance / state | Implementation and evidence |
| --- | --- |
| 1. Prerequisites / passed | Clean exact base/remote, doctor/context, actual Phaser 4.2.1, native Jest/TypeScript configs and authority consumers inspected. |
| 2. Checked native fixture records / passed | Existing helper requires selected slots; request/finished kind guards keep discriminated assertions exact. All original 41 test cases retained once. |
| 3. Real queue/emission shapes / passed | Research command rebuilt from actual fields and existing execution; finished-event builder preserves its discriminant. Negative provenance/callback controls still pass. |
| 4. Focused native checks / passed | 66 tests across 14 suites, including every changed spec and adjacent capture/disposal consumers. Native lint: zero errors/eight existing warnings; all eight sources pass Prettier. |
| 5. Full native typing / partially checked | Fresh clean-base 161 → candidate 101 diagnostics; all 60 owned diagnostics resolved. Canonical diagnostics outside changed files are exactly unchanged; full config still exits 2. |
| 6. Remaining release evidence / blocked/pending | Remaining native K4, earlier gameplay 44 strict diagnostics and 22 base-reproduced failures, K5 matches and paired overhead/bundle, socket/save/restart/hash/calibration remain. M11 blocked/M12 open. |

```sh
pnpm agent:doctor
pnpm agent:context -- --issue 816
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
pnpm exec nx test probable-waffle-phaser --runInBand --testPathPatterns='(dispatch-ai-intent-command|dispatch-ai-brain-result|shared-queue-resource|observe-queue-completion-authority|advance-shared-queue-item|mutate-shared-queue-item|project-ai-runtime-queue-resource|emit-queue-item-resource|ai-runtime-production-capture|ai-runtime-completion-capture|ai-runtime-queue-mutation-capture|ai-runtime-pending-commands|ai-runtime-rejection-capture)\.spec\.ts$'
pnpm exec nx lint probable-waffle-phaser
pnpm exec prettier --check $(cat tmp/ai-plans/759-validation/native-queue-batch/source-files.txt)
git diff --check
```

Ignored evidence: `tmp/ai-plans/759-validation/native-queue-batch/` contains `types-base.log`, `types-final.log`,
`compiler-summary.json` (all remaining owners), `tests-final.log`, `lint-final.log`, `format-final.log`,
`source-files.txt`, `spec-registration-audit.json`, `review-semantic.diff` and `provenance.json`.
Changed-source SHA-256 digest: `f1cda889328b3b29e02c61b4c5a3a37c4b5cb58e2dd0a2150fdfe52050026922`.
The first formatting/type/lint attempts exposed an introduced newline-before-`satisfies` syntax error; it was repaired
before final checks. The first multi-path Nx test command selected only one suite/three tests; it is not whole-batch
evidence. The corrected pattern selected 14 suites/66 tests. Final runs use the repaired source. No runtime behavior
changed, so no new behavioral regression was needed. Earlier unchanged E2E/gameplay/build checks were not rerun.

**Historical next batch (now checked by the combined native checkpoint above) — why:** native capture/world fixtures
need real actor shapes, current catalog definitions and
checked queue/command records so later report evidence cannot be manufactured by a stale fixture. Start in
`phaser/src/lib/player/ai-controller/testing/`: `ai-runtime-recipient-resource-capture.spec.ts` (six diagnostics),
`ai-runtime-route-order-capture.spec.ts` (six), `ai-runtime-unspent-claims.spec.ts` (five),
`capture-ai-runtime-construction-catalog.spec.ts` (five) and their related world/preset consumers. Counts are diagnostics,
not distinct defects. Use the current compiler owner map, inspect actual contracts, repair the coherent family and
run native typing plus selected real Jest/lint. Then remaining component/campaign native fixtures and gameplay K4;
investigate broader gameplay failures causally. Finish K4 before K5/cost. Publish and pause; no new machinery scope.

**Implementation Review:** self-reviewed the complete formatted-base semantic diff and traced dispatch identity,
queue insertion/removal, native payment/refund and completion observation into existing capture consumers. Checked reads
fail missing fixtures rather than fabricate authority; the projection's wrong-command controls still exercise wrong
type/owner/actor with the real execution. Production oracles, setup and lifecycle contracts are unchanged.

**Omission Audit:** all six acceptance items have scoped evidence or explicit blockers. All eight specs and 41 original
cases remain registered; no unused new helper, missing registration, threshold relaxation or skip. Existing negative,
throw, no-listener and cleanup cases execute. No browser/socket or complete K4 claim follows from these focused passes.

**Separate Final Closure Audit:** after the syntax/filter repairs, verified final source hashes, exact spec registration,
66-test selection, unchanged remaining diagnostics, project lint and formatting. The native fixture slice is checked;
full K4/M10/release remains open. Scope is eight specs and two coordination docs; unrelated Nx history is preserved.
Commit/push and remote-SHA verification close this batch's delivery only. Whole-ledger formatting remains final cleanup.

### Final-gate production/queue report checkpoint (2026-10-09, partially checked)

Base `6804b955d1f33b646c1acc9e0e9282940f736a68` was clean and remote-verified on
`feature/759-skirmish-ai` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. The containing commit publishes
this grouped E2E slice; verify its remote SHA on resume. Actual model/effort unknown; recommendation GPT-6.1 Sol / high
for the next native command/queue batch. The recommendation is task-specific judgment; it does not switch settings.
No independent reviewer/subagent, production planner/native/save/wire change, or skill/tool change.

**Purpose and implementation:** close E2E strict contracts before using the reports to judge real matches.
`normalizeRuntimeProductionCausality`, scoped queue payments, production progress/unspent/rejections, rejection boundaries
and cancellation paid-lineage retain checked records after exact count checks. The multiplayer queue/shared-queue and
research cancellation normalizers use the same explicit receipt/callback/terminal ownership. Required single matches,
order, payload and balance checks remain intact. Failed reports retain diagnostic command rows, while normalized
money/effects remain empty. Duplicate-receipt and regressed-sequence controls also exercise the mandatory causal evaluator.

Existing `requireAiTestEntry` checks authored slots in production/retry/queue fixtures and related report specs;
normalizers never use it as authority. Synthetic command ticks are checked, spatial facts retain their exact kind,
readonly gap arrays are copied only for the Playwright matcher, and mixed negative-control facts retain the complete union.
The capacity evaluator now accepts only the actual variant/checkpoint fields it consumes, eliminating incomplete
full-result casts. Construction, digest and multiplayer host-transfer captures retain checked values; all existing
test declarations are retained once. The host-transfer and actual browser driver are compiled, not executed here.

`evaluateEvidenceStopAtCheckpoint` requires every selected scenario assertion before evaluation. Missing assertions
retain the full horizon and clear the sustained-success marker instead of crashing or treating a subset as complete.
Its typed probe includes actual setup queue items. The new control passes the complete selection and rejects a missing
assertion with retained prior success. Restoring the exact base evaluator reproduces a TypeError at
`evaluateRuntimeVariant` (`requiredProductionContracts`); the candidate control passes. The diagnostic browser branch
now records the same explicit missing-assertion failure as normal scenario evaluation. Browser execution remains K5.

| Acceptance / state | Implemented path and evidence |
| --- | --- |
| 1. Prerequisites / passed | Clean base, exact remote SHA, agent doctor and issue-816 context pass. Existing actual configs/consumers inspected. |
| 2. Exact production/queue authority / passed | Checked locals and exact fact predicates in the named normalizers; negative receipt/sequence controls and existing cancellation/completion/payment oracles pass. No rule/threshold relaxation. |
| 3. Fixture and harness contracts / passed | Exact spatial kind, checked fixture slots, partial capacity input and complete evidence-stop probe. All original declarations retained across 15 changed specs. |
| 4. Regression / passed | Evidence-stop base reproduction: 1 failed with the original TypeError; candidate complete/missing selection control passes. Initial two failures were incorrect expectations in newly authored diagnostic-command controls, repaired to the existing documented contract; no existing oracle was weakened. |
| 5. E2E checks / passed | Full actual E2E TypeScript: 145 → 0 diagnostics, exit 0. Grouped 41 synthetic specs: 457 passed. Portal-e2e lint passes with 10 existing warnings; all 32 changed sources pass Prettier and diff checks. No config, baseline or suppression change. |
| 6. Broader final gate / pending | Earlier Phaser/gameplay strict counts remain 161 / 44 and gameplay has 22 base-reproduced failures; not rerun here. K5 matches, paired disabled-path/bundle cost, socket/save/restart/hash/calibration remain. M11 blocked, M12 open. |

```sh
pnpm agent:doctor
pnpm agent:context -- --issue 816
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm exec playwright test --config tmp/ai-plans/playwright-resource-gate.config.ts 'skirmish-ai-runtime-production.*spec.ts' 'skirmish-ai-multiplayer-(queue-normalization|shared-queue-normalization).spec.ts' 'skirmish-ai-runtime-construction.*spec.ts' 'skirmish-ai-runtime-(digest|evidence-stop).spec.ts' 'skirmish-ai-runtime-resource.*spec.ts' 'skirmish-ai-runtime-route-(order|caller).spec.ts' 'skirmish-ai-runtime-service-attempt.spec.ts' 'skirmish-ai-runtime-producer-routes.spec.ts'
pnpm exec playwright test --config tmp/ai-plans/playwright-resource-gate.config.ts skirmish-ai-runtime-evidence-stop.spec.ts --grep 'checkpoint evidence stopping'
pnpm exec nx lint portal-e2e
git diff --check
```

The narrow evidence-stop command reproduced the base failure by temporarily restoring the evaluator's exact HEAD
bytes and restoring candidate bytes in `finally`. Final checks run on the candidate source. Ignored artifacts under
`tmp/ai-plans/759-validation/production-queue-report-batch/`: `types-final.log`, `compiler-summary.json`,
`reports-final.log`, `reports-summary.json`, `evidence-stop-base.log`, `lint-final.log`, `format-final.log`,
`spec-registration-audit.json`, `review-semantic.diff`, `source-files.json` and `provenance.json`.
The 145 baseline diagnostics come from the prior batch's exact committed-source log; the final full configuration is
freshly checked. Changed-source digest: `64b6a604200dc3142937d819ce6d42fd2c14d3e305dd6a315496311a6cf123d6`.
The existing ignored Playwright config removes only the unused web server; these 457 controls use no browser/page fixture.
Whole-ledger formatting remains final cleanup; changed-source formatting passes.

**Historical next batch — why (native dispatch/queue slice now checked above):** repair native dispatch/queue fixtures so the real command application, payment and
completion contracts can pass strict K4 checking before browser evidence is interpreted. Start with
`phaser/.../player/ai-controller/dispatch-ai-intent-command.spec.ts` (18 earlier diagnostics),
`entity/systems/shared-queue-resource.spec.ts` (15), `dispatch-ai-brain-result.spec.ts` (9) and
`entity/components/queue/observe-queue-completion-authority.spec.ts` (8); resolve their exact paths from
`tmp/ai-plans/759-validation/fixture-batch/types-native-final.log`. Inspect their actual native contracts and related
controls, repair the coherent family, then run `pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json`
and focused native tests/lint. Preserve the now-green E2E type gate when any shared fixture contract changes.
Then investigate the 22 wider gameplay failures from their first causal disagreement. K4 must finish before K5/cost;
do not lower oracles, suppress strictness, refresh baselines, or expand machinery/M11/M12. Publish and pause.

**Implementation Review:** self-reviewed all changed owners against the formatted-base semantic diff, exact production
and multiplayer consumers, report rejection path, fixture records and existing assertions. Missing evidence remains
explicit; helper failures are fixture failures, never fabricated report authority. No new gameplay lifecycle hooks.

**Omission Audit:** all six acceptance items have evidence or explicit broader blockers above. Existing test registration
and scenarios remain; native/browser execution is not claimed from type checks. Source/input/usefulness policy and
unrelated Nx history remain intact. No reusable skill/tool change was justified.

**Separate Final Closure Audit:** final source passes the full E2E type config, 457 selected controls, project lint and
changed-source formatting; source hashes and exact task scope are checked before publication. The E2E slice is checked;
M10/K4/release remains partial. Commit/push and remote-SHA verification close delivery, not broader gate readiness.

### Final-gate resource-report contract checkpoint (2026-10-09, partially checked)

Base `88eb4be01b0750e002af018828ca7393ca636d13` was clean and remote-verified on
`feature/759-skirmish-ai` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. The containing commit publishes
this grouped E2E resource/route slice; verify its remote SHA on resume. Actual model/effort unknown; next recommendation
GPT-6.1 Sol / high. Final-gate checks remain authorized. No independent reviewer/subagent or skill/tool changes.

**Purpose and implementation:** make the report evidence type-safe without inventing missing authority.
`RuntimePageControllerV1` now picks the eight existing read-only methods from `PlayerAiController`, replacing a stale
hand-copied return schema. Economy, strategy and transport checkpoints narrow actual outcome/decision/intent unions;
legacy missing base lifecycle is explicitly null in `RuntimeCheckpointV1`. This prevents checkpoint consumers from
silently drifting away from the committed observation, catalog and brain contracts. The import is type-only; no live
controller or planner is added to the E2E bundle through this alias.

Resource coverage/interval validation, selected need normalization, recipient replay, service/application projection,
credit normalization and route-service lineage retain checked local values and explicit fact predicates. Single exact
matches remain required; missing/ambiguous read, intent, application or cohort evidence retains the existing failures,
gaps and unavailable quantities. Selected intent controls now also cover duplicate identity and wrong action family.
The existing `requireAiTestEntry` helper checks authored snapshot/report slots in six related specs and the application
fixture; it is not used to manufacture evidence in report normalizers. Native, planner, save/wire and useful-service
rules are unchanged; useful contribution/capacity fields remain null.

The expanded report run exposed the route-caller re-registration fixture expecting an empty parent failure list despite
duplicating an already completed product's registration. Exact base reproduction confirms the same failure. The control
now directly proves unavailable route attribution through `validateRuntimeRouteOrders` / `projectRuntimeRouteOrder`,
and separately requires the parent completion-authority failure and empty route group. The revival rejection remains.
No completion or lifetime validator was relaxed. All original test declarations remain exactly once.

| Acceptance / state | Source and evidence |
| --- | --- |
| Prerequisites / passed | `pnpm agent:doctor` and `pnpm agent:context -- --issue 816` pass on the clean base. |
| Resource/route evidence / passed | 207 synthetic tests across 12 selected specs: resource credit/application/labor/need/liability/service, producer routes, route caller/order and service attempts. Two new selected-intent controls; all original declarations retained. No browser/server used. |
| Exact failure repair / passed | Base register/unregister selection: 1 failed / 1 passed, with `production_ai_completion_actor_authority_invalid` on register. Candidate grouped run passes the strengthened route and parent controls. |
| Strict typing / partial | Full E2E configuration: 300 → 145 diagnostics. Zero diagnostics across 22 changed source files; no newly introduced diagnostics elsewhere. Full type check still fails. |
| Source quality / passed | Final portal-e2e lint, all 22 changed-source Prettier checks, registration AST audit and diff check pass. No source-structure baseline/config relaxation. |
| Other K4 blockers / pending | Earlier Phaser/gameplay diagnostics remain 161 / 44, and broader gameplay has 22 base-reproduced failures. Those owners were not changed or rerun in this slice. |
| Runtime/release authority / pending | K5 real matches, C8 paired disabled-path/bundle cost and inherited socket/save/restart/hash/calibration remain. Browser checkpoint execution is not proven by compile/report tests. M11 blocked and M12 open. |

```sh
pnpm agent:doctor
pnpm agent:context -- --issue 816
pnpm exec playwright test --config tmp/ai-plans/playwright-resource-gate.config.ts 'skirmish-ai-runtime-resource.*spec.ts' 'skirmish-ai-runtime-route-(order|caller).spec.ts' 'skirmish-ai-runtime-service-attempt.spec.ts' 'skirmish-ai-runtime-producer-routes.spec.ts'
pnpm exec playwright test --config tmp/ai-plans/playwright-resource-gate.config.ts skirmish-ai-runtime-route-caller.spec.ts --grep 'register fences original'
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm exec nx lint portal-e2e
git diff --check
```

The register/unregister command above reproduced the failure while the exact changed source bytes were temporarily
replaced with HEAD, then restored in `finally`. Ignored evidence in `tmp/ai-plans/759-validation/resource-report-batch/`
includes `reports-final.log`, `route-register-base.log`, `types-final.log`, per-owner `compiler-summary.json`,
`lint-final.log`, `format-final.log`, `spec-registration-audit.json`, `review-semantic.diff`, `source-files.json` and
`provenance.json`. Changed-source digest: `40c79174e65aeec032ff8709724f881f7db1302d776758768e25a1f43114ec83`.
The ignored Playwright config imports the real portal-e2e config and only removes the unused web server for these
browser-free report controls. Existing whole-ledger formatting remains final cleanup; changed source formatting passes.

**Historical next batch — why (E2E production/queue slice now checked above):** production/queue report joins and native dispatch/queue fixtures must become type-safe
before they can establish trustworthy command/payment/completion evidence. Current largest E2E owners are cancellation
specs (15), completion specs (13), both multiplayer queue fixtures (10 each), production causality normalization (10),
rejection specs (10), progress and unspent reports (8 each), and multiplayer queue normalizers (7 each). Native owners
remain dispatch-intent (18), shared queue resource (15), dispatch-brain-result (9), queue-completion authority (8).
Read the existing owner diagnostics, repair one coherent command/queue group, run the actual configs and related
controls, publish and pause. First next check: `pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json` after repairs.
Then investigate the 22 wider gameplay failures from their first causal disagreement; K4 remains blocked until all
required checks pass. Do not weaken oracles, suppress strictness, refresh baselines or add machinery scope.

**Implementation Review:** self-reviewed the formatted-base semantic diff, real controller signatures and all immediate
checkpoint consumers, exact lineage joins, missing evidence paths and original test registration. Type-only controller
coupling and legacy null output have explicit consumers; browser execution remains a named pending gate.

**Omission Audit:** all batch acceptance items have source and focused evidence above. No unused helper, new registration
or production lifecycle hook. Test-only helper use stays separate from report authority. Wider compilation, gameplay
and browser/cost duties remain open; unrelated Nx history preserved. No skill/tool change was needed.

**Separate Final Closure Audit:** after the fixture repair, final source bytes pass all 207 selected controls, lint and
formatting, retain every original declaration and introduce no new compiler diagnostics. Exact task-owned scope is
publishable; M10/K4/release readiness remains partial. Normal push plus remote-SHA verification closes publication only.

### Final-gate capture and queue fixture checkpoint (2026-10-09, partially checked)

Base `0641e9ed5851f542e6a12c43cb01d01b0787cd08` was clean and remote-verified on
`feature/759-skirmish-ai` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. The containing commit publishes this
grouped fixture/report slice; verify its remote SHA on resume. Actual model/effort unknown; next recommendation
GPT-6.1 Sol / high. No independent reviewer/subagent. Final-gate execution remains authorized.

**Purpose and repairs:** make captured-record tests and queue/need report joins type-safe before using them to judge
real matches. `requireAiTestEntry` in the existing pure AI test-fixtures module rejects an absent authored slot instead
of casting it away. It is used only by specs/synthetic fixtures; report normalizers retain their own conservative guards.
Native production, progress, completion, mutation and decision-boundary controls now require their actual records.
Synthetic operation/refund/physical queue/world/admission fixtures and corresponding report specs use the same check.
Mutable fixture world restore flags retain their boolean type; queue boundaries accept the actual readonly queue contract;
copied nullable resource authority remains null rather than becoming a partial invented balance.

`runtimeNeedHasIncomingStart` / `runtimeNeedOwnAdmissionSequences` retain a checked start, selected intent, request,
finish and addressed actor before their existing exact identity comparisons. `normalizeRuntimeProductionInitialQueues`
retains a checked delivered/applied record and explicitly narrows physical mutation facts before matching insertion.
Missing or contradictory evidence retains its existing unavailable/gap/failure behavior; no useful authority is activated.

The oversized macro spec is split into opening/gathering, construction, production and renewable-food specs sharing
`ai-macro-test-fixtures.ts`. Native decision boundaries move to `ai-runtime-decision-boundary-capture.spec.ts` beside
the queue-lifecycle spec. All 22 macro cases and 11 original capture cases remain registered exactly once.
The land-domain control now covers both 3 ready units (9-unit deficit, 2 producers) and 10 ready units (2-unit deficit,
1 producer). Air production supplies the current `WORKER_RECOVERY_FLOOR` through gathering-capable catalog facts;
removing that workforce must suppress optional air production. Existing domain/affordability assertions remain.
The split also repairs two existing macro fixture types: literal base IDs and explicit unknown carried/growth values.
No game planner/native rule, schema, save/wire field, baseline exemption or new machinery was changed.

| Acceptance / status | Evidence and limit |
| --- | --- |
| Preflight / passed | Doctor/context on the clean base; branch/remote verified. |
| Native extraction / passed | 6 suites / 22 tests, including capture installation, decision boundaries, queue progress/mutation/completion and lifecycle. Zero diagnostics in these touched files. |
| Macro fixtures / passed | 8 focused suites / 37 tests; both former failures repaired with valid workloads and stronger positive/control assertions. No strategy threshold changed. |
| Report joins/consumers / passed | 93 synthetic tests in 8 related specs: operations, initial queues, world readiness, need boundaries, cancellation/rejection, removed ownership and physical queue mutation. No browser/server used. |
| Strict typing / blocked | Phaser 322 → 161 diagnostics; E2E 498 → 300; gameplay 46 → 44. All 23 touched/new source files have zero diagnostics. Full configurations still fail; counts are not distinct defects. |
| Wider gameplay / blocked | Candidate: 9 failed / 43 passed suites, 22 failed / 252 passed tests. Base: 11 failed / 38 passed suites, 24 failed / 250 passed tests. The same 22 remaining failure identities reproduce on base; only the two macro failures disappear. This is not a release exemption. |
| Quality and registration / passed | Gameplay/Phaser/portal-e2e lints, exact source Prettier and diff checks pass. AST title comparison proves no omission/duplication across the two splits. Existing ledger formatting remains final cleanup. |
| Full gate / pending | K4, K5 real browser, C8 paired disabled-path/bundle budgets and inherited server/socket/save/restart/hash/calibration remain; M11 blocked and M12 open. Earlier production/native/interface/protocol evidence remains scoped history. |

```sh
pnpm exec nx test probable-waffle-phaser --testPathPatterns='ai-runtime-(production-capture|decision-boundary-capture|queue-mutation-capture|completion-capture|production-boundaries)' --runInBand
pnpm exec nx test probable-waffle-gameplay --testPathPatterns='ai-macro|ai-resource-service|ai-brain|ai-producer|ai-production-transition' --runInBand
pnpm exec nx test probable-waffle-gameplay --runInBand
pnpm exec playwright test --config tmp/ai-plans/playwright-resource-gate.config.ts skirmish-ai-runtime-production-operation-projection.spec.ts skirmish-ai-runtime-production-world-normalization.spec.ts skirmish-ai-runtime-production-initial-queue-normalization.spec.ts skirmish-ai-runtime-resource-need-boundaries.spec.ts skirmish-ai-runtime-production-cancellations.spec.ts skirmish-ai-runtime-production-rejections.spec.ts skirmish-ai-runtime-removed-queue-ownership.spec.ts skirmish-ai-runtime-production-queue-mutations.spec.ts
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/gameplay/tsconfig.json
pnpm exec nx run-many --targets=lint --projects=probable-waffle-gameplay,probable-waffle-phaser,portal-e2e
```

Ignored local evidence: `tmp/ai-plans/759-validation/fixture-batch/` contains logs, exact commands, provenance,
per-owner compiler counts and `gameplay-failure-comparison.json` with all 22 remaining failure names.
Final source digest: `bae5137367a08b800530bdb0e4558dc3e1aaa2b28f7de9b8ce395073ac6289fb`.
The base reproduction restored exact HEAD gameplay owners and temporarily removed the four new macro files, then
restored candidate bytes in `finally`. A later native-spec import cleanup was type-only; no executable statement changed
after the native pass. The final full gameplay run includes the final base-ID/resource-shape repairs.

**Historical next batch — why (resource/report slice now checked above):** repair remaining resource/report joins and strict fixture families, then investigate wider gameplay
failures from their first causal disagreement. This is needed for trustworthy K4 evidence before K5 browser/cost work.
Largest current report owners: `skirmish-ai-runtime-economy-checkpoint.ts` (24), resource-credit normalization (20),
resource-service specs (29) and resource-application specs (18). Native owners include dispatch-intent (18), shared queue
resource (15), dispatch-brain-result (9) and queue-completion authority controls (8). Gameplay type owners include
transport route/lifecycle and skirmish-route capability fixtures. First next check after remaining report-join repairs:
`pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json`.
The nine failing gameplay owners are offensive opportunity selection, production scenarios, production policy scenarios,
skirmish manager, victory-route scenarios, food infrastructure, economy policy, victory-pressure scenarios and spending
budget conflicts. Keep all useful/liveness/fairness oracles; do not lower thresholds, suppress strictness, refresh baselines
or expand machinery merely to obtain a pass. Pause after the next coherent reviewed/checked/published slice.

**Source Implementation Review:** self-reviewed fixture-slot failure semantics, preserved test registrations, exact
read/admission/insertion identities, nullable authority, readonly queue shapes and workload-derived macro expectations.
No planner/native behavior or save/debug/lifecycle authority changes. New split files have executed consumers.

**Omission Audit:** checked every batch acceptance against source, focused tests, strict diagnostics and broader gameplay
evidence. All touched files are type-clean and compliant; mandatory wider failures remain explicitly open. Browser/cost
and inherited release duties remain pending. No new machinery or skill/tool changes; unrelated Nx/user work preserved.

**Separate Final Closure Audit:** rechecked final source bytes, registration counts, test/diagnostic provenance,
formatting/lints and exact publication scope after repairs. This slice is checked and publishable; full M10/K4/release
readiness remains blocked. Normal push and remote-SHA verification close publication only.

### Final-gate production compiler and mock checkpoint (2026-10-09, partially checked)

Base `426c03ee0c8a3584bfed147b28d16b8852f7acb7` was clean and remote-verified on
`feature/759-skirmish-ai` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. The containing commit publishes this
coherent production/compiler compatibility slice; verify its remote SHA on resume. Actual model/effort unknown;
next recommendation GPT-6.1 Sol / high. No independent reviewer/subagent. Final-gate execution remains authorized.

**Purpose and repairs:** make the real portal compile while retaining native rules and strict types. Workforce keys
in `validate-ai-brain-state-v1.ts` and adjacency offsets in `ai-producer-safety.ts` retain literal/tuple types.
`ai-military-force-context.ts` preserves the ground/air domain union returned to macro consumers.
`ai-resource-service-manager.ts` reads a known available amount inside the same narrowing predicate.
The two multiplayer queue worlds retain their single checked completion ID; `PawnOrderObservation` retains a checked
single order before rally callbacks. `IPlayerPawnControllerAgent` now declares the existing `CanBoardContainerNow` method.
No affordability, workforce floor, producer throughput, save/wire schema, capture authority or usefulness policy changes.

The shared production-capture fixture uses a native GameObject and supplies `sys.queueDepthSort` and `sys.isActive`;
the movement fixture returns the actual 2D tile shape. This removes the unsafe actor assertion and makes the native
mock lifecycle explicit. Source formatting was applied without refreshing structure baselines. No new files/machinery.

| Acceptance / status | Evidence and limit |
| --- | --- |
| Preflight / passed | Doctor/context passed on the clean base. |
| Production compile / passed | `nx build portal --configuration=production` passes on final source; 12 prior diagnostics cleared. Initial bundle warning remains: 1.08 MB against 1.00 MB; this is not the C8 paired gzip comparison. |
| Native/mock compatibility / passed | Entire Phaser target: 142 suites / 679 tests. Main browser-host/game component controls: 2 suites / 7 tests; shared game container: 1 suite / 1 test. This proves these test consumers, not a real browser match. |
| Focused pure planner / blocked | 35 passed / 2 failed in 5 suites, identical failures on base and candidate. Land-domain throughput expects 2 with only a 2-unit deficit; air-force fixture has an existing military actor and no gathering-capable workforce, so recovery owns food. Investigate/repair fixtures or policy with source evidence; retain domain/affordability/workforce oracles. |
| Strict typing / blocked | Phaser spec config: 322 diagnostics, all specs. E2E config: 498. Newly checked gameplay config: 46 diagnostics, all specs. No non-spec diagnostics remain in Phaser/gameplay configs, but the full checks still fail. Counts are diagnostics, not distinct defects. |
| Local quality / passed | Gameplay/Phaser project lints, exact changed-source Prettier and diff whitespace checks pass. Existing whole-ledger Markdown formatting remains final cleanup. |
| Full gate / pending | K4 is incomplete; K5 browser, C8 cost/bundle, inherited server/socket/save/restart/hash/calibration and wider gameplay proof remain. M11 remains blocked and M12 open. |

```sh
pnpm exec nx build portal --configuration=production
pnpm exec nx test probable-waffle-phaser --runInBand
pnpm exec nx test probable-waffle-interface --testPathPatterns='ai-runtime-browser-test-host|probable-waffle-game.component' --runInBand
pnpm exec nx test platform-game-host --testPathPatterns='game-container.component' --runInBand
pnpm exec nx test probable-waffle-gameplay --testPathPatterns='ai-macro|ai-resource-service|ai-brain|ai-producer|ai-production-transition' --runInBand
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/gameplay/tsconfig.json
pnpm exec nx run-many --targets=lint --projects=probable-waffle-gameplay,probable-waffle-phaser
```

Ignored artifacts: `tmp/ai-plans/759-validation/compiler-batch/` contains exact logs, commands, full diagnostic owner
counts and final source provenance. Source digest: `65477085b3303953e24d840111bcf883ae21a184027ed8d70c01201eb5a85c86`.
The base planner reproduction temporarily restored exact HEAD gameplay owner contents and restored candidate bytes
afterward; base/candidate logs record the same two failures. The first native run preceded the fixture's scene hooks;
its failures were repaired and the entire target rerun. One attempted `tsconfig.lib.json` route does not exist;
the recorded gameplay check uses the actual `tsconfig.json`. No passing gameplay type check is claimed.

**Historical continuation at this checkpoint:** group checked native-fixture extraction/narrowing and report-contract repairs, then resolve
the pure planner fixture/policy disagreements. These are required to trust evidence before K5 matches and C8 measurements.
Start with `ai-runtime-production-capture.spec.ts` (101 diagnostics), `ai-runtime-queue-mutation-capture.spec.ts` (36)
and completion/resource fixtures sharing those authorities; group E2E production operation/world controls (44/40) with
their normalization owners. Resource need-boundaries (27), economy checkpoint (24) and the newly recorded gameplay spec
types remain owning failures. First next check after shared-selector repairs is the Phaser `tsconfig.spec.json` command
above. Do not suppress strictness, replace consumed inputs, refresh baselines, or weaken release oracles. Pause after
the next coherent reviewed/checked/published slice. Production compilation is clear; full K4 is not.

**Source Implementation Review:** self-reviewed exact known-value reads, literal types, completion identity rejection,
single rally origin/callback cleanup, implemented boarding method and native fixture consumers. The mock itself remains
unchanged in this batch. Existing runtime controls cover the affected paths; no new runtime strategy was introduced.

**Omission Audit:** production compile and full native/main mock consumers have passing evidence; strict types and
base-reproduced planner failures are explicit blockers. Browser/cost and inherited release duties remain pending. Earlier
157 synthetic report / 6 protocol passes remain scoped evidence. No claim of complete lifetime/useful-service authority.
No skill/tool change; no unrelated Nx merge or user work included.

**Separate Final Closure Audit:** rechecked final source/fixture bytes, actual target/config ownership, formatting/lint,
native consumer evidence and exact publication scope after repairs. This slice is checked and publishable; M10, K4,
M11/M12 and overall release completion remain open. Normal push and remote-SHA verification close publication only.

### Final-gate preflight and repair checkpoint (2026-10-09, partially checked)

Base `8616a2223b9390f3039a717b7fc14564bf81c6eb` was clean and remote-verified on
`feature/759-skirmish-ai` in `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`. The containing commit publishes
this batch; verify its SHA against the remote on resume. Actual model/effort unavailable; recommendation remains
GPT-6.1 Sol / high. No independent reviewer/subagent. The user-authorized final gate is active.

**Purpose and repairs:** execute the authored native fences and scoped-credit/report consumers before actual browser
matches. Newline-separated `as`/`satisfies` assertions were invalid or executed as separate expressions; corrected
their boundaries. Report need accounting now joins `command.decision.sequence`, matching the producer contract instead
of the obsolete nested `selectedDecision.fact`. Native production rejects unaffordable commands through the numeric
`AssignProductionErrorCode.NotEnoughResources` enum, preserving `insufficient_resources` outcome semantics.

Native fixtures now expose actual protocol players/rosters, synchronous money observers and installed Phaser
EventEmitter/GameObject lifecycle. Restored campaign metadata and observer registration reflect the actual owners;
container mocks reset per test. Synthetic report fixtures use real enum names, complete labelled service snapshots
and the existing two contributor lots (3 + 4), without substituting consumed planner inputs. The extracted
`skirmish-ai-runtime-construction-lineage-fixture.ts` keeps the spec within the source-size limit. E2E `rootDir`
is the workspace root so its no-emit config can follow source aliases. Formatting was applied to touched files.
The global Phaser test mock change was subsequently checked against the full native and main interface/host consumers
in the production compiler/mocks checkpoint above; the following table records this earlier preflight's evidence.

| Acceptance / status | Evidence and practical limit |
| --- | --- |
| Readiness preflight / passed | `pnpm agent:doctor` and `pnpm agent:context -- --issue 816` passed on the clean base. |
| K1 + inherited native selection / passed | 69 suites, 371 tests; source/drain/container/restore/roster/input/queue/construction/health/movement/capture/disposal consumers. Nonzero intended controls executed. |
| K2 / passed | Protocol player/resource observation: 2 suites, 6 tests. |
| K3 + related report selection / passed | 157 tests in 13 synthetic report specs; exact credit joins, lineage, windows, liabilities, conservative accounting and bridge checks. Playwright ran without a browser or portal server. This is not K5 production evidence. |
| K4 / partial | Protocol `tsconfig.spec.json` passed; lints for Phaser/protocol/portal-e2e passed; changed-file formatting/diff checks passed. Phaser TypeScript: 336 diagnostics. E2E TypeScript: 510 diagnostics after removing the false source-root restriction. Portal production build: 12 diagnostics. |
| M08/K5 / pending | No real browser matrix or paired disabled-path/bundle measurements: compilation is a prerequisite. No performance or shipping-byte claim. |
| M11/M12 / blocked/open | Useful-service fields remain null. No complete alias/lifetime authority, useful throughput or broader production release success was established. |

Ignored local evidence is retained in `tmp/ai-plans/759-validation/`: native/report/protocol logs, TypeScript logs,
lint/build/format logs, commands and provenance. `provenance.json` records per-file hashes and the tested source digest
`7289254a44d579b0955934388a8990fa37bfa770c31751c72c943c278070fc6a`. Only formatting of two specs changed
after that grouped native pass; both were rerun together. `final-provenance.json` records the final source hashes.
Final source digest: `beb3ccfbf15319b61fc67df4c460af151af5b3edcaca9614c0a1781e4bf36675`.
These files are local artifacts; the checkpoint carries the transferable results and blockers. Whole-document Prettier
checks fail for both ledgers on the clean base and candidate; their existing Markdown layout is retained. Changed
source/config formatting passes; ledger formatting remains a documented final-gate cleanup item.

```sh
# K1 plus inherited native behavior: 69 suites / 371 tests
pnpm exec nx test probable-waffle-phaser --testPathPatterns='gatherer|resource-cargo|resource-service|resource-drain-credit|observe-resource-credit|resource-source|health-component|health-presentation|owner-component|owner-presentation|construction|movement|ai-runtime|queue|resource-(source|drain)-resource-history|container-resource-history|containable-resource-history|actor-data-resource-history|campaign-participant-scene-adapter-resource-history|scene-resource-observation' --runInBand
# K2: 2 suites / 6 tests
pnpm exec nx test probable-waffle-protocol --testPathPatterns='player-resource-observation|player' --runInBand
# Synthetic K3 expansion: 157 tests. The ignored config spreads the existing Playwright config,
# sets testDir to ../../apps/portal-e2e/src/e2e and webServer to undefined. No browser is used.
pnpm exec playwright test --config tmp/ai-plans/playwright-resource-gate.config.ts skirmish-ai-runtime-construction-authority.spec.ts skirmish-ai-runtime-construction-catalog.spec.ts skirmish-ai-runtime-construction-decision-lineage.spec.ts skirmish-ai-runtime-construction-lineage.spec.ts skirmish-ai-runtime-native-navigation.spec.ts skirmish-ai-runtime-producer-routes.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts skirmish-ai-runtime-production-report.spec.ts skirmish-ai-runtime-resource-application.spec.ts skirmish-ai-runtime-resource-credit.spec.ts skirmish-ai-runtime-resource-liability-frames.spec.ts skirmish-ai-runtime-resource-need-accounting.spec.ts skirmish-ai-runtime-resource-need-boundaries.spec.ts
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/protocol/tsconfig.spec.json
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm exec nx run-many --targets=lint --projects=probable-waffle-phaser,probable-waffle-protocol,portal-e2e
pnpm exec nx build portal --configuration=production
```

**Historical continuation at this checkpoint:** repair compilation and wider mock compatibility together, retaining fail-closed contracts. First
reproduce `pnpm exec nx build portal --configuration=production`. Its known owners are gameplay
`validate-ai-brain-state-v1.ts` (workforce key narrowing), `ai-macro-manager.ts` (pressure-domain literal),
`ai-producer-safety.ts` (adjacency tuple) and `ai-resource-service-manager.ts` (known-value narrowing); Phaser
`ai-multiplayer-queue-world.ts` / `ai-multiplayer-shared-queue-world.ts` (possibly absent produced ID),
`pawn-agent-boarding.ts` (missing interface method) and `pawn-order-observation.ts` (possibly absent first order).
Then repair strict spec/report contracts by shared owner rather than individual arbitrary stages. The largest diagnostic
groups are `ai-runtime-production-capture.spec.ts` (101), `ai-runtime-queue-mutation-capture.spec.ts` (36),
`skirmish-ai-runtime-production-operation-projection.spec.ts` (44),
`skirmish-ai-runtime-production-world-normalization.spec.ts` (40), resource-service specs (29),
resource-need boundaries (27) and economy checkpoint (24). Counts are diagnostics, not distinct defects.
The source-root configuration repair alone is not a passing type check. Do not suppress strictness or refresh baselines.
Build success enables K5; the C8 paired baseline/profile/bundle budgets and all inherited server/socket/save/hash and
gameplay obligations remain. Stop after a coherent reviewed, checked and published compiler/build batch.

**Source Implementation Review:** self-reviewed assertion semantics, producer-to-report decision identity, exact numeric
queue error classification, real native roster/money/lifecycle fixtures and their immediate consumers. No new schema,
wire/save fields, authority claims, baseline refresh or gameplay strategy. New fixture helper has an executed consumer.

**Omission Audit:** K1/K2 and expanded synthetic K3 have recorded passes; K4 records both passing and failing checks.
M01–M09 authoring obligations remain mapped above; passing scoped tests does not establish every broader integration
obligation. K5, wider shared-mock compatibility, inherited checks and C8 measurement are explicit pending evidence.
M11/M12 remain mandatory. No new machinery or skill/tool change.

**Separate Final Closure Audit:** checked changed-source ownership, direct fixture imports, native error/outcome and
accounting consumers after repairs. Partial useful fields and unsupported histories remain conservative. This preflight
batch is checked and publishable; full M10/final gate and issue/release closure remain blocked by the recorded checks.
Publication uses the containing commit with normal push and remote-SHA verification.

### Combined machinery review M10 (2026-10-09, authored/unverified)

Base `bd30bea87f57d87c7751b3a9e5759e5a1e021f24` was remote-verified on resume. Reviewed implementation
`978cb09e70cbc6e2ed0b520971690ea47ab38045`, its immediate native owners, capture consumers and adjacent specs.
Actual host model/effort unknown; no subagents or independent reviewer. All executable checks remain deferred.
Review/repair commit `a952782dece8e36bef7bc92e01545021dc99fe48` is pushed and remote-verified;
the containing documentation commit records that publication. No executable check result is claimed.

| Acceptance | Source evidence / repair and purpose | Status |
| --- | --- | --- |
| M01/M02, C1/C2 | Traced source enter/wait/leave/deduct/subjects and drain enter/wait/leave/post-wait owner/credit/full return, plus container boarding/load/unload/sea/shore/restore and containable clear-before-delegate. Authored controlled waits, old state at loss, assignment no-ops, stock/restore, entry/exit throws, delayed-ID restore, partial container mutation, sea/shore behavior, and clear-before-recursion controls in adjacent specs. | Source-reviewed; controls authored/unrun |
| M03, C1/C6 | Traced actor install/upgrade/add/remove/definition entry before constructors/map changes, queue restore before clear/clone/notify, and campaign caller inside startup-load skip. Authored map edit ordering, constructor failure before map publication, cloned/empty queue restore, campaign economy rounding/modes, and startup-load suppression controls. Inspected the three exact alias-baseline removals, with no hash refresh. | Source-reviewed; controls authored/unrun; compliance unrun |
| M04, C3/C5 | Roster loss reporting is now isolated during duplication, rollback and disposal too; a throwing diagnostic cannot strand owned wrappers. Tests cover real remove/re-add/reset, receiver/arguments/native return/throw identity, own/inherited descriptors, foreign replacement, duplicate owner, rollback and reinstall. | Repairs and focused controls authored; K1/K2 unrun |
| M04/M06 compatibility | Seven native recipient fixtures lacked the newly required `baseGameData.gameInstance`; installation would lose before money hooks were attached. They now use real protocol game instances and live roster getters. The synthetic root fixture supplies its roster host while retaining its intentional unavailable native player authority. | Source incompatibility repaired; prior owner/health/construction/drain cases still unrun |
| M05, C4 | Moved projection into the existing frame helper. Missing/changed accepting due liabilities, unknown restore status, state gaps and missing input scope cannot claim matching frames. Validates every supplied claim vector across resources and tails; malformed tails suppress parent normalization. Existing native capture controls cover selected/input capture; real matrix report consumption is retained. | Repairs and controls authored; executable integration deferred |
| M06, C2/C4/C5 | Existing exact payload/recipient/operation join, whole-pile ownership, incoming start/admission exemption and consumed-frame calculation retained. Accepting changes leave the old bound unavailable; legacy absent optional fields keep old diagnostics while new frame status is unavailable. | Source-reviewed; all earlier cargo/payment/window compatibility checks deferred |
| M07 | Matrix bridge failures now join scenario failures so the emitted failed artifact retains raw capture and normalized gaps. Native capture now has a dedicated selected-decision/scoped-resource report control; the check is extracted into `skirmish-ai-runtime-production-report.ts`, covered by a focused report spec, and called by the existing real-browser matrix driver for PRO-03/06/07. | Native and consumer controls authored; actual matrix execution deferred |
| M08, C8 | Empty scene/protocol loss groups return before snapshot/reentrancy allocation; unmatched production host returns before config/capture creation. Existing installer/scene-observation specs cover marker, duplicate install, foreign host/replacement, teardown and listener-free fence behavior. No new production listener, scan, timer, save/hash field or wire event. Static imports still require bundle measurement. | Source-reviewed; controls authored across existing specs; cost measurement remains open |
| M09/M10 | Reviewed task-owned source/diff and immediate callers; no baseline refresh, new gameplay policy or skill/tool change. Added the frame spec to K3 below. | Source review completed; authored evidence is not gate readiness or validation |

**Omission Audit:** the earlier claim that 51–54 had authored every M01–M09 path/case was too broad. This grouped
authoring pass now adds source/drain, container/containable, actor-data, queue-restore, campaign-setup, and report-bridge
controls. Existing M04/M05/M06/M08 controls were traced back through roster, root fact, money, accounting, installer,
and scene-observation consumers. Selected and report decision identities are checked exactly; useful values stay null.
The real matrix driver invokes the shared report bridge check, while focused native and browser report specs verify
the scoped operation and bounded bridge contract. No
authoring omission remains for this finite M01–M10 batch. Real-world integration, shared test-harness lifecycle, cost
measurements, and every executable check remain final-gate work.

**Separate Final Closure Audit:** traced repaired helpers back to root fact append, recipient money observation,
resource accounting/service/native/parent normalization, and the emitted matrix result. Native owners and consumed
inputs remain unchanged; partial useful quantities remain null. No executable verification was run. M10 source review
and control authoring are complete; executable readiness is deferred to the final gate. M11 is blocked and M12 open;
no acceptance was removed or treated as optional.

**Current authoring status — why:** the grouped continuation authored the missing native ownership and restore
controls and extracted the real matrix report bridge into a focused consumer check. This closes the authoring slice;
the final gate still must execute native/report checks and measure the unmarked path so diagnostics can be trusted and
their resource cost understood. Next use GPT-6.1 Sol / high for gate readiness and difficult repairs. Do not add new
machinery, reset capture after setup, or weaken useful-authority oracles.

#### Deferred tests, operational acceptance and final gate

**C8 — capture-off fast paths.** In `P/data/scene-resource-observation.ts:fenceSceneResourceHistory`, look up the group
and return before creating a snapshot array if absent/empty. Do the equivalent before empty arrays/reentrancy bookkeeping
in `PlayerResourceObservation.reset/lose`. Preserve snapshot iteration and every installed-observer failure/reentrancy
rule. C3 allocates only while marked capture is installed. Existing `ResourceServiceObservation`/credit/input fast paths
remain. Production guards do not prove tree shaking; retain static capture-import bundle measurement. Do not remove
native closure/request creation or rewrite protocol money semantics as a speculative optimization in this batch.

Final measurements compare baseline `af9d078d9` with the authored implementation revision, same environment/seed/map/
population/command workload and tick ceiling: (a) production build, (b) unmarked developer game, (c) marked capture.
The [cost prerequisite checkpoint](#final-gate-cost-prerequisite-checkpoint-2026-10-09-paired-c8-blocked) records that
this exact source cannot compile. Its original native comparison remains blocked. The
[reference qualification checkpoint](#final-gate-reference-qualification-checkpoint-2026-10-10-compile-prerequisite-checked)
now qualifies a separately identified compile-compatible reference and scoped size delta; native world equivalence
still needs evidence. Never treat the isolated fast-path probe as a native pair.
Use existing `AI_SKIRMISH_PROFILE=1` variant phase timing and browser performance/heap allocation profiling; profiler
output must isolate hook CPU/allocations from unrelated rendering/planner work. Alternate baseline/candidate order,
warm once and retain at least three paired runs; record variance, native outcome/state digests and source/bundle digests.
Baseline/profile work runs only at the final gate. A marked heavy-capture measurement is not disabled-hook overhead.

Operational budgets for this bounded change: no installed journal/listener/timer/scans in production or unmarked mode;
no new allocation attributable to an unobserved fence call (existing protocol closure/request costs remain measured);
no repeatable disabled-path regression above both 1% of simulation CPU and 0.1 ms/tick p95; candidate production gzip
entry+reachable-chunk size no more than 0.5% above this baseline. Native budgets remain unmeasured; the explicitly
derived reference's code-size delta is below the limit, while original pinned acceptance remains blocked.
If below profiler resolution, report that limit and the observed bound, not “zero overhead.” If exceeded, repair the
owning fast path or escalate the exact tradeoff; no acceptance/FPS claim until measured. Report total reachable test-only
capture bytes even when delta fits budget; no unsupported claim that all instrumentation was removed from shipping.

K1–K5 add to, never replace, every deferred 29–49 and earlier controller/movement/queue/native/lifecycle command.
No executable check runs during design or Luna authoring; test authoring is allowed. At execution confirm nonzero
intended specs/cases and retain source revision, fixture/seed digests and actual native/report results.

```sh
# K1: actual native owners, capture and read/frame/disposal controls
pnpm exec nx test probable-waffle-phaser --testPathPatterns='resource-(source|drain)-resource-history|container-resource-history|containable-resource-history|actor-data-resource-history|queue-resource-history|campaign-participant-scene-adapter-resource-history|ai-runtime-recipient-(resource|roster)-capture|ai-runtime-resource-(input-capture|coverage-capture|producer-report)|ai-runtime-unspent-claims|ai-runtime-production-capture|install-ai-runtime-production-capture|scene-resource-observation' --runInBand
# K2: protocol money/reset observation and actual player compatibility
pnpm exec nx test probable-waffle-protocol --testPathPatterns='player-resource-observation|player' --runInBand
# K3: report join, frame, conditional arithmetic and negative controls (synthetic where labelled)
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-resource-need-accounting.spec.ts skirmish-ai-runtime-resource-liability-frames.spec.ts skirmish-ai-runtime-resource-need-boundaries.spec.ts skirmish-ai-runtime-resource-application.spec.ts skirmish-ai-runtime-resource-credit.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts skirmish-ai-runtime-production-report.spec.ts
# K4: real library configs, focused lint/source structure, integration build
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/protocol/tsconfig.spec.json
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm exec nx run-many --targets=lint --projects=probable-waffle-phaser,probable-waffle-protocol
pnpm exec nx build portal --configuration=production
# K5: existing real browser production gate and bounded report; no fake new supported row
AI_SKIRMISH_PROFILE=1 pnpm ai:skirmish:production
pnpm ai:skirmish:report -- --failures-only --details
```

Final gate also owns formatting/link/path/diff checks and existing agent doctor/context, source/schema/editor/repository,
multiplayer, save/restart/hash, server/shared-command and calibration obligations. M11 cannot pass via these partial
diagnostic fixtures. M12 requires its legal worlds/gameplay support before K5 can establish release success; an expected
missing-authority failure is evidence of the blocker, not a completed family. No mandatory oracle/denominator changes.

#### Stage-50 reviews and continuation rule

**Source Implementation Review:** traced source/drain phases, container pending restore/containable recursion,
actor-data constructor-before-map order, queue rebuild, actual campaign caller, protocol aliases/observers, roster owner,
root selected-ledger update, resource-read frontier and application/need report consumers. Chose capture-owned roster
wrappers instead of production platform hooks, minimum compliance cleanup instead of automatic helpers, and diagnostic
frame explanation instead of replacing consumed inputs. Semantic discovery was attempted once; `jbcontext` unavailable,
so indexed/narrow source reads supplied predicate anchors. Source review repaired the campaign caller anchor to
`configure`, selected the actual spec/E2E TypeScript configs rather than nonexistent lib configs, and separated the
native raw fixture from the real browser/report integration case. No executable compatibility/cost result is claimed.

**Omission Audit:** 50.1 value/finish line is above; 50.2 source inventory is C1–C7/M01–M12; 50.3 exact edits, async,
identity, errors, cleanup and bounds are C1–C6; 50.4 positive/control/recovery and cost/gate are map/C7/C8/K1–K5;
50.5 is finite 51–54; 50.6 amendment/escalation below; 50.7 single map and handoff/publication are this checkpoint.
Existing full authority and production obligations are blocked/open, not dropped or optionalized. No new plan file,
runtime/schema/save/wire/manifest/balance/CI change, unused source owner, skill/tool change or extra agent was introduced.

**Separate Final Closure Audit:** rechecked native math/owner/economy/full return, pre-callback phase boundaries,
no-op guards, matching restores, constructor order, descriptors/foreign wrappers, fresh-capture/no-backfill, old schema,
fixed bounds, before/after claims and partial-channel consumers. Stage 50 design and 51–54 code are authored;
M10 source review/repairs are above. Missing controls, cost and executable validation remain open. Broad useful authority remains blocked M11;
production/gameplay proof remains M12. Containing commit and verified remote publication own design delivery.

Current continuation: missing-control authoring is complete and the final-gate preflight results are recorded above.
Use GPT-6.1 Sol / high for grouped compiler/build repairs, then actual browser/cost evidence. Do not invent another design stage for an ordinary repair.
A concrete source contradiction may amend the affected
C/M row with source, native impact and replacement acceptance; only an unresolved architecture decision goes to Sol.
Continue independent authorized work, retain safe commits, and never silently expand into M11/M12 or alter acceptance.

### Execution-policy refinement checkpoint (2026-10-09, documentation only)

Base `60fa7457d8b660cc5ad665ab3f0a34e775cfc285` is the published policy update; containing commit owns this refinement.
**Source Implementation Review:** added scope/value justification, simpler alternatives, firm required/optional finish
line, implementation-ready contracts, remaining normal-play hooks/cost and one requirement-to-evidence completion map.
Reconciled quick resume, model policy and copyable prompt. Existing native contracts
and final-gate obligations remain. No runtime or test changes.
**Omission Audit:** user request maps to 50.1–50.7: one Sol high design, finite one/multiple Luna high implementation
passes, concrete escalation/small evidenced amendments, combined Sol review, purposes, finish line/completion map and
deferred validation. Every system must justify its cost against an actual consumer. No generic skill change.
**Final Closure Audit (separate):** reviewed both policy documents for stale next-action/model instructions and owned
scope after editing. Policy authored/source-reviewed only; stage-50 design and all executable evidence remain outstanding.
Commit/push this documentation update and pause; next work is the consolidated design pass.

### Construction presentation checkpoint (2026-10-08, authored/unverified)

Stage 48 is `04ded09863f51adb72a10b54ff8a30537678c8be`, based on
`fa0dc1e4c0f1b589bb8265ba680a4e56b50ec609` (47, remote verified).
The current authorization covers 48–49, with a separate commit/push per stage and pause after 49.
ConstructionPresentation owns cached audio, visibility/RNG and build/completion playback. ConstructionSiteComponent
retains playingBuildSound in saved data, accessed by live callbacks, plus UI creation, state/subjects, ticks and teardown.
The helper is stored after original UI creation but before eager ready; its lookup stays before cached health lookup.
Native flag-before-play, audio throws, optional completion selection and uncancelled late callbacks are retained.
This isolates presentation so passive readiness fences can be added to a focused owner without a baseline refresh.

| Acceptance | Authored evidence / status |
| --- | --- |
| 48 sound ownership / save contract | Adjacent construction-presentation.ts and facade delegation; no new persisted fields/listeners/timers. Source-reviewed. |
| 48 ready / guards / callbacks | construction-presentation.spec.ts: eager/deferred ordering, visibility/audio/RNG guards, restored flag and late callback, audio exception, completion sound without service. Authored/unrun. |
| 48 lifecycle / cleanup / completion | New spec retains state/sound/builder/upgrade/score order and finished guard; existing construction-lifecycle.spec.ts retains repeated teardown and tick unsubscribe. Authored/unrun. |

**Source Implementation Review:** compared original lookup/guard/RNG/callback order and live saved state against the
extraction; constructor stores helper before ready, facade retains public class/API and registration. Immediate consumers
and payment/lifecycle owners require no changes. No native arithmetic was changed.
**Omission Audit:** all 48 obligations map above; no baseline refresh, duplicate flag, new cleanup or simulation owner.
**Final Closure Audit (separate):** reviewed the final source/doc scope and unrun controls after implementation review;
48 authored/source-reviewed only, all executable evidence deferred. No skill/tool change warranted.
Next within current batch: 49 exact pre-write fences and native/capture/drain/report controls, for rejecting stale
readiness continuity after construction/repair. Recommend staying on GPT-6.1 Sol / medium; actual host settings unknown.

### Health presentation prerequisite checkpoint (2026-10-08, authored/unverified)

Stage 45 is `e5a5eb242970489ebd2c2d7e1c2967b9ecb56cf8`, based on `e173b564beda5d18a55dd9f28b03b91f550551ae` (44).
`HealthComponent` retains authoritative health data/definition references, damage metadata, public events and bounds/
visibility forwarders, serialization, health/armor setters, reactions, death audio/animation and simulation destruction.
New adjacent `HealthPresentation` owns bars, construction/frame/container visibility, UI timeout and damage/heal effects.
It reads current facade references through callbacks, with no copied health state. Bars still construct immediately;
container attachment follows facade destruction registration; ready initialization runs after helper storage.
Armor initialization still precedes animation/audio/service/translation lookup. Cleanup still unsubscribes construction,
removes UI timeout, removes native simulation delay, then detaches container/frame listeners. Existing tint callbacks remain.

Why used: a compliant native health owner can accept the next passive fence without blending render work into resource
history observation or refreshing a source-size exemption. Owner/status bars and regeneration continue using the facade.
Only HealthComponent's obsolete baseline entry was removed; no fence or native behavior change was added in 45.

| Acceptance | Implemented source / authored evidence |
| --- | --- |
| 45.1 Facade / references | HealthComponent retains actual data/definition, events, getData/setData and damage/death order; health-component spec controls live reference, cloned save, defined/same/empty restore and definition replacement. |
| 45.2 Ready / visibility | HealthPresentation stored before ready; initial armor and lookup order preserved. Spec controls eager initialization, campaign values, construction/vision/frame/container gates, bounds and visibility subject. HealthUiComponent still looks up the public facade. |
| 45.3 Effects / cleanup | Spec controls armor-first damage, poison, blood/heal position/depth/tint, delayed visual cleanup, construction unsubscribe, UI timeout and native simulation-delay disposal. |
| 45.4 Native death / size | Death remains on facade, with normal/silent/invalid-active order, fade/hidden fallback and 30-second simulation delay controls. Both owners below 400 physical lines by source inspection; only own baseline removed. |
| 45.5 Delivery / policy | Source-reviewed only; all tests/types/lint/format/source validation unrun. Commit/push prerequisite separately, then authorized 46. |

**Source Implementation Review:** compared moved methods with original source and inspected HealthUiComponent,
OwnerPresentation and status-effect bar consumers. Ready/native dependency order and timer/listener disposal remain
unchanged; tint casts now use unknown rather than any. Existing HealthUiComponent lifecycle remains its own responsibility.
One helper allocation per actor is unmeasured. ConstructionSiteComponent's direct public-data writes bypass facade
setters and remain an explicit unsupported route, not silently covered by the planned fence.

**Omission Audit:** 45.1–45.5 covers split, references, lifecycle, effects, consumers, compliant source and publication.
No new registry/schema, copied mutable health, native mutation observer, timer fix or other baseline refresh.
**Final Closure Audit (separate):** reviewed facade/helper/spec and baseline diff after local cleanup; all authoring
requirements mapped, source evidence only. Final gate retains previous commands and adds `health-component|health-presentation`.
No runtime compatibility or durable proven contract/skill change is claimed. Next: implement exact 46 acceptance below,
commit/push and pause; Sol 6.1 / medium remains appropriate for the settled pre-mutation contract.

### Owner conversion fence checkpoint (2026-10-08, authored/unverified)

Stage 44 is based on `89ed0cf2cc757f76ecce400c3cb4647f67c8a687` (43, remote verified); containing commit owns 44.
`OwnerComponent.setOwner` now invokes `fenceSceneResourceHistory(scene, "resource_actor_owner_change")` after
its same-owner early return and before index lookup/update. Existing recipient capture subscription marks global sticky
loss immediately, before callbacks can reenter reads. No listener owner, schema, mutation record or root budget was added.
The scene helper documents broader pre-mutation boundaries and isolates observer exceptions from native mutation.

Why used: a drain converted while delivery awaits still credits its actual post-wait owner (or suppresses campaign
credit) and returns the full native amount; earlier accounting cannot certify continuity across that known conversion.
Any actor owner change during installed capture loses global history, including initial ownership assignment outside
installed cohorts. This deliberate over-invalidation avoids claiming an exhaustive actor-to-beneficiary dependency map.
Exact recipient credits can remain diagnostic; all four authority channels remain partial and useful verdicts null.

| Acceptance | Implemented source / authored evidence |
| --- | --- |
| 44.1 Pre-index passive fence | OwnerComponent no-op → scene loss → index lookup/update → owner → visuals → event. owner-resource-history spec checks pre-lookup and pre-update reads, no cohort filter, initial ownership, same/defined/undefined restore, clear and blink. |
| 44.2 Native failure / reentrancy | Same-owner no-op preserved; native index throw and nested conversion order controlled; observer throw is isolated by existing scene fence. No-subscriber and bounded/isolated scene subscriptions covered. |
| 44.3 Capture lifetime | Existing recipient journal owns subscription/disposal; recipient and owner-history specs author sticky loss before native add, post-disposal silence and fresh partial installation without old-capture backfill. |
| 44.4 Cross-await / reports | Extended resource-drain-credit spec changes actual OwnerComponent during actual drain wait for normal/granted/none economies, checks actual beneficiary, balances, unchanged context, notification and full return. Application report spec reads real coverage through real recipient scene subscriber/fence over synthetic accounting payloads; bounds/application quantities null, legacy income diagnostic, loss and partial channels retained. |
| 44.5 Scope / delivery | No health/source/drain production mutation hook, roster/alias coverage claim, useful activation, metric, schema or persistence change. Source review only; commit/push and pause. All tests/validation unrun. |

**Source Implementation Review:** traced facade no-op/restore/clear/blink through scene subscriber and irreversible
coverage, including pre-index lookup, native index throw/reentrancy and observer exception isolation. Reviewed actual
post-wait drain recipient/economy/emission and exact native journal operation; report consumers already suppress bounds
and application quantities on loss. Tests use real native owners/journal and the existing pure report projection with
synthetic accounting payloads; they do not establish runtime compatibility or real-match correctness.

**Omission Audit:** 44.1–44.5 covers all requested hook, failure, lifetime, cross-await and report requirements. New
owner-resource-history and drain-credit specs were added to the deferred gate pattern, alongside existing native journal
and application specs. No new production consumer/registration or source baseline update is needed after 43.
**Final Closure Audit (separate):** re-read the final hook, helper docs, all authored controls and existing consumers
after edits; source authoring complete, all executable verification explicitly deferred. Conservative global loss,
public aliases, capture cost and partial channels remain limitations. No reusable skill/tool update warranted.

#### Authored implementation batch: 45–46 health presentation and history fence

Keep **GPT-6.1 Sol / medium** across this related prerequisite/hook pair, then pause. The 42 writer contract already
selects conservative global loss; do not reopen complete-history design or expand into source/drain/platform owners.
If the split exposes a concrete initialization, disposal or reentrant event conflict, stop there and recommend Sol / high.

- **45: health presentation prerequisite.** Existing anchor is
  `phaser/src/lib/entity/components/combat/components/health-component.ts`; new destination is adjacent
  `health-presentation.ts`. Delegate UI bars, visibility/frame/container/construction subscriptions, UI timeout,
  health/armor bounds/refresh and damage/heal visual effects. Retain the facade's public health data/definition,
  latestDamage, hidden flag, events, serialization, native damage/armor/heal/kill ordering, death sounds/animation,
  simulation destruction delay and suppression. Helpers read current facade state/references rather than copying
  mutable health/definition; preserve exact readiness and destruction order and HealthUiComponent's facade lookup.
  Keep actor movement dependencies used by visual feedback in the focused helper. Preserve delayed callbacks rather
  than mixing unrelated timer fixes. Split further by stable responsibility only if necessary for 400/200/140.
  Remove only HealthComponent's obsolete baseline entry after compliance; never refresh hashes. Author public facade,
  ready/restore, UI/effect and disposal controls, unrun. Commit/push this behavior-preserving prerequisite separately.
- **46: passive health history boundary.** Reuse `fenceSceneResourceHistory` with
  `resource_actor_health_change` before changed health and armor assignments in `setHealthValue`/`setArmorValue`,
  after each same-value early return and before native events. Fence `setHealthDefinition` before definition replacement
  and `init` before campaign modifier/definition/direct initial health/armor writes; these routes conservatively fence
  even if the resulting values happen to match. Preserve original setter dispatch and suppression: no native event,
  death call, sound or disposal is added by observation. Existing reset/heal/damage/defined restore/kill routes delegate.
  Silent/normal kill with already-zero health remains a known gap if no changed setter occurs; add a pre-kill fence at
  each valid active kill entry before suppression, events or destroy, preserving invalid-active early returns.
  Public health/definition aliases remain unsupported. Author changed/same-value health and armor, initialization,
  definition replacement, kill/silent kill, suppression/restore, event throw/reentrancy, observer throw/no subscriber,
  capture disposal and cross-await native return controls. Extend real scene-subscriber report controls to show sticky
  loss and unavailable quantities, without activating channels/useful metrics. Commit/push, then pause.

Purpose: damage, healing, armor or death can invalidate earlier readiness/service assumptions before callbacks observe
the mutation; conservative loss prevents a later resource delivery from proving continuity across that known boundary.
Source/cargo/drain capacity, roster/alias and complete lifetime routes remain separate later work. No gameplay tuning,
new metrics/budget, persistence, real interval recipes or executable checks are authorized by this next-batch plan.
Final gate adds `health-component|health-presentation` to the existing Phaser controls and retains all prior commands.

### Owner presentation prerequisite checkpoint (2026-10-08, authored/unverified)

Stage 43 is based on `1dbaaf5d1f574960aaf9b71f20d9b37bb3343c6b`; its containing commit owns this checkpoint.
`OwnerComponent` retains the only owner field, definition reference, public color access, static events/options,
serialization and index → owner → visuals → event order. `OwnerPresentation` owns color/ring/pipeline/blink and
visual subscriptions/cleanup. It reads the facade owner through a callback, with no duplicate owner state.
Its explicit `attach` runs only after the facade stores the helper, preserving eager/deferred ready safety.
This makes the formerly baselined owner small enough to add the next passive mutation fence without refreshing hashes.
Only OwnerComponent's obsolete source baseline entry was removed. No ownership observation behavior changes yet.

| Acceptance | Implemented source / authored evidence |
| --- | --- |
| 43.1 Facade / identity | OwnerComponent owns owner/index/events/getData/setData; ownerColor forwards read/write to helper; definition and object references retained. Owner spec covers ordering, same-owner and undefined restore no-op. |
| 43.2 Presentation / lifecycle | OwnerPresentation moves existing visuals and delayed callbacks; attach stores before ready; killed/destroy disposal, frame/container visibility and movement/health/construction subscriptions authored in owner spec. |
| 43.3 Native compatibility | Index throws precede assignment/events, first conversion blink and clear visual refresh preserved; opt-in pipeline and definition colors controlled. Immediate conversion and color-event consumers still use facade. |
| 43.4 Size / scope | Facade and helper each below 400 lines, methods below 200 by source review; only own obsolete baseline removed; no new registration or runtime capture schema. Executable size/lint/type checks deferred. |
| 43.5 Delivery / policy | Source-reviewed only; commit/push this prerequisite, then continue authorized 44. Tests, types, lint, formatting and runtime validation remain unrun. |

**Source Implementation Review:** compared moved methods with original source and traced public callers, constructor
ordering, same-owner/throw paths, on-ready subscriptions, render-only updates and killed/destroy disposal.
Repaired an extraction typo before closure. Existing delayed color callbacks and repeated pipeline cleanup are preserved;
no unrelated timer or pipeline fix is claimed. One extra helper allocation per actor remains unmeasured.

**Omission Audit:** 43.1–43.5 maps every split requirement to source and authored controls; no copied owner, direct helper
import of OwnerComponent, baseline refresh, native mutation hook, configuration or consumer migration was introduced.
**Final Closure Audit (separate):** re-read final facade/helper/test diff and immediate consumers after repair; all 43
source-authoring obligations covered. Final-gate commands from the 43–44 plan remain deferred; this is not a runtime pass.
No durable proven behavior or reusable skill/tool change was established. Remaining 44 acceptance stays below.

### Ownership boundary design checkpoint (2026-10-08, source design only)

42 is based on `ecd26ba772e822ebbb06f4f21bf9172ded4fd495` (41); containing commit owns this design.
The latest `continue` authorizes this bounded design, publication and pause. Last selected profile is Sol 6.1 / medium;
actual host settings remain unknown. No model switch or executable check. No runtime hook is added by this stage.

**What / why:** define conservative closure at named native writers without promising complete mutation history.
For example, a worker may start returning wood to a friendly drain and that drain may change owner during the wait.
Native return still resolves the owner after the wait; a future pre-owner-change fence must prevent the earlier need
from receiving a usefulness claim. Exact observed income and whole-pile lineage remain separate diagnostic evidence.
These decisions give the next author a bounded implementation contract; they do not establish useful throughput.

#### Supported scope, identity and closure

The support unit is a capture installation observing a named route, not an actor ID, player number or equal endpoint.
Capture-local identity binds actual scene, player, player state/data/resource object, actor and component objects to
their installation. Serialized IDs locate records; they do not certify object continuity. No new saved identity, clock,
actor scan, registry, timer or public API restriction is required by this design.

1. **Selected need:** retain the exact consumed read, matching incoming start and selected intent/effect/generation
   from 40. Freeze A/S0/R0/D0; a new result with different accepting liabilities remains unavailable. A later decision,
   including empty/recovery/expiry reconciliation, closes the old generation before reconciliation. No fresh selection
   may revive it. The exact resource-free own-admission exemption stays limited to 40's validated request/outcomes.
2. **Native application:** keep 37's actual recipient/payload/operation pair and 41's read frontiers. Read overlap,
   entry/terminal straddle, loss or conflicting supplied tail cannot be repaired by a later matching balance. Grant/spend
   arithmetic stays 38's conditional bound; spending does not undo an earlier grant's consumption of the old shortage.
3. **Boundary versus loss:** an exact known player decision fence closes that player's older needs. Unknown scope,
   binding replacement, restore, reentrancy, dropped facts, reader failure or missing native terminal loses the capture
   conservatively. A named actor ownership mutation will use the existing scene-wide irreversible loss route because
   no complete actor-to-beneficiary/need dependency map exists. Over-invalidation is explicit; no post-event reopening.
4. **Cross-await:** an attempt retains its original task/order context and actual gatherer/source/drain/component
   installation identities. After the wait, identity/epoch validity determines diagnostic eligibility only; it must not
   cancel, retry, reorder or modify native extraction/return. Return-time owner/economy and actual credit callback remain
   authoritative even if they differ from entry. An invalid lifetime leaves attribution unavailable; native full return
   or campaign suppression is preserved. Never substitute entry owner, latest task, nearest operation or inferred FIFO.
5. **Cleanup:** capture-owned observers are passive, bounded and removed on disposal/shutdown. Loss state changes
   before any fallible append. Exceptions from observers cannot prevent native mutation; missing evidence stays a gap.
   Reentrant mutation uses original native ordering and loses history rather than serializing gameplay. A stale awaited
   completion must not attach to a replacement capture; fresh installation cannot backfill pre-installation history.

#### Writer contracts and implementation boundaries

Source anchors are relative to `libs/games/probable-waffle/`, except the platform row. This table specifies future
implementation duties; no row is newly intercepted or certified complete by stage 42.

| Authority / source anchor | Required entry and identity rule | Remaining limit / implementation boundary |
| --- | --- | --- |
| `protocol/.../probable-waffle-player.ts`, `PlayerResourceObservation` | Keep paired named add/pay observations on the actual installed recipient. Player/state/data/resource identity replacement loses history before a read can certify a frame. | Public state and `getResources()` references still allow write/undo; matching samples never erase the mandatory mutable-alias gap. General authority requires a separate public API ownership decision, outside this batch. |
| `phaser/.../campaign/participants/campaign-participant-scene-adapter.ts`, `applyStartingResources` | A future caller fence must precede direct slot writes and use actual scene context; this helper currently receives only a resource record. | Do not convert to add/pay: rounding, scaling and replacement semantics differ. Pre-installation setup is not observed history. Deferred separate route, not an extra hook in 43–44. |
| `libs/platform/game-sessions/src/lib/game-instance.ts`, add/removal/reset | Future optional platform-level passive observer must precede push/filter assignment/reset and avoid a dependency on Phaser. Constructor roster creation precedes installation. | Public players array and public state replacement remain bypasses; current recipient reconciliation detects only persistent mismatch. Platform owner is baselined; split separately before editing. Not in 43–44. |
| `phaser/.../world/services/recovery/reconnect.service.ts` | Preserve the existing pre-snapshot scene fence before actor rebuild and player-state assignment. | Completion, later matching bindings or controller restore cannot revive the lost capture. All unowned direct restore/replacement routes remain gaps. |
| Pure planner/brain and `phaser/.../testing/ai-runtime-unspent-claims.ts` | Close older needs before pure reconciliation; preserve selected → admitted → queue liability / settled / released ownership. Only exact supported immediate payment terminal retires cash; physical future queue charges belong to D0, never both R0 and D0. | Callback-in-progress, uncertain terminal, pre-capture claims, unsupported non-queue purchase or lineage/price mismatch stays null. Outcome publication alone is not a pre-mutation authority. No planner/payment rewrite. |
| `phaser/.../entity/components/queue/` named mutate/advance routes | Retain before/start boundaries. A future queue liability transfer needs exact command/item/price and actual payment terminal; only the advanced exhausted head may avoid future charges. | Raw queues/items and `setData` rebuilding remain unsupported. Never infer liability retirement from application or completion labels alone. Separate queue ownership work. |
| `phaser/.../entity/components/owner-component.ts`, `setOwner` | After the same-owner early return, fence scene history **before** `ActorIndexSystem.updateActorOwnership`, owner assignment, UI work and `OwnerChangedEvent`. `clearOwner`, blink and defined-owner `setData` delegate to this route. | Selected next batch 43–44. No actor/player filter can claim exhaustive affected needs. Undefined-owner `setData` currently does nothing; preserve it. Same-owner call remains a no-op. |
| `phaser/.../entity/components/combat/components/health-component.ts` | Future named health entry precedes write and `healthChanged.emit`; death/silent death must close before zero health and callbacks. Include restore/reset/definition/tech recalculation, not just `KilledEvent`. | Public health data/definition and component replacement remain bypasses. Baseline prerequisite plus complete writer inventory required in a later batch; post-death events cannot certify readiness. |
| `phaser/.../entity/components/resource/resource-source-component.ts` | Future fences precede capacity/load, post-wait unload/capacity/stock writes, refill, lock, assigned-gatherer changes and restore clamp. Preserve actual extraction math, subject ordering and depletion/destroy. | Source definition, container and component lifetime remain separate authorities. Baseline split required. No assertion of continuous supply from extraction or a stock sample. |
| `phaser/.../entity/components/resource/resource-drain-component.ts`, `returnResources` / `setData` | Future entry and post-wait phases retain exact context; fence capacity/load/unload/restore changes. Preserve post-wait owner/economy lookup and suppressed callback/full returned amount. | Drain conversion may still deliver to its actual new beneficiary; old need/lifetime is unavailable. Container, definition and readiness remain partial. No early owner snapshot used for native credit. |
| Cargo/service/component registry and scene/controller/clock | Preserve known whole piles only, capture epoch, exact native credit and existing controller/restore/shutdown fences. Replacement, cargo clear/merge/restore and lost async context require pre-boundaries at their actual owners. | `ActorData.components` is exposed through actor data; silent map edits cannot be certified. Access/safety, container membership, readiness, clock/horizon and all four coverage channels remain incomplete. No new complete channel literal. |

#### Next bounded implementation batch: 43–44 owner conversion fence

Keep **GPT-6.1 Sol / medium** across both settled stages, then pause. This is the recommended next profile, not a model
change. If the scoped split exposes an unresolved lifecycle or initialization contract, stop at that concrete blocker
and recommend Sol / high; do not expand into health/source/platform restructuring. No fixed machinery total is implied.

| Stage / purpose | Concrete authoring acceptance |
| --- | --- |
| **43: ownership presentation prerequisite** — make the baselined owner safe to edit | Separate ownership visual work into a focused owner presentation helper, retaining `OwnerComponent` as public facade and sole authoritative owner field. Delegate color/ring/pipeline/blink, visual frame updates, subscriptions and visual cleanup; retain static options/events, serialized shape, owner/index/event order and same-owner behavior. Keep existing callers on the facade and current definition/object references. Use callbacks/getters for owner access; do not copy or expose a second mutable owner. Constructor/on-ready and killed/destroy cleanup timing must remain equivalent. New owners comply with 400/200/140 and one substantive type per file. Remove only this file's obsolete baseline entry after the compliant split; never refresh baseline hashes. Author facade/order/visual-disposal controls, all unrun. Commit this behavior-preserving prerequisite separately. |
| **44: passive pre-owner-change capture fence** — prevent old accounting surviving known conversion | Reuse `fenceSceneResourceHistory(scene, "resource_actor_owner_change")` immediately after the changed-owner check and before index lookup/update. Preserve native throw/reentrant/index/UI/event semantics; no subscriber means native behavior is unchanged. Generalize the helper's restore-only documentation to its now broader passive history boundary. Existing `AiRuntimeRecipientResourceCapture` scene subscription must deliver sticky coverage loss before index callbacks can reenter capture reads; no new listener owner or fact schema. Author changed/same/clear/blink/defined restore/no-op undefined restore, index throw/reentrancy, observer throw, no subscriber, capture disposal and owner-change-during-return controls. Reports must retain loss and unavailable need bounds/application quantities without upgrading any channel or suppressing actual native return. Commit/push and pause after both stages. |

43–44 deliberately adds no health/source/drain/membership hooks, liability repricing, real interval declarations,
new report metrics, new root budget, persistence or useful-service activation. Owner mutation on any actor during an
installed capture can conservatively lose resource history, including actor initialization; document and control that
cost rather than hiding it behind an incomplete cohort filter. Existing exact credits may remain diagnostic where
their consumer permits it; no useful verdict follows from them.

The 43 destination is `phaser/src/lib/entity/components/owner-presentation.ts`, beside the unchanged owner facade.
Preserve public `ownerColor` access, `ownerDefinition`, `ZIndex` and event payload/timing. Immediate consumers include
`convertible-component.ts` (blink), `combat/components/health-ui-component.ts` and
`construction/construction-progress-ui-component.ts` (color event). Avoid eager constructor callbacks into an
uninitialized helper and cyclic runtime imports for event constants; initialization/cleanup controls must cover these.
Preserve existing delayed visual callbacks during the split; unrelated timer cleanup is a separate change.

**Deferred evidence:** extend Phaser owner facade/presentation and scene-resource observation controls; extend existing
recipient capture and drain specs for the real pre-index and cross-await ordering. Use a producer-shaped capture/report
control, not only a hand-inserted loss flag. Add the authored owner spec to the final Phaser gate:

```sh
pnpm exec nx test probable-waffle-phaser --testPathPatterns='owner-(component|resource-history)|health-component|health-presentation|scene-resource-observation|ai-runtime-recipient-resource-capture|resource-drain-(component|credit)' --runInBand
```

Retain every 29–41 command and native pipeline/controller integration obligation. Final gate also checks source-size
compliance, types/lint and runtime compatibility/capture cost; nothing executes during this authoring pass.

| Acceptance | Source-design evidence / state |
| --- | --- |
| 42.1 Route scope / public aliases | Writer table names actual entry owners, missing direct-write/replace authority and mandatory gaps; complete history explicitly blocked. Design authored. |
| 42.2 Need / liabilities / windows | Exact consumed versus accepting frame, no reopening, disjoint cash/queue retirement and paired native frontier rules specified. Implementation from 40–41 remains unverified. |
| 42.3 Lifetime / await / cleanup | Actual object installations, post-wait recipient, passive pre-write loss, reentrancy and stale completion boundaries specified; unsupported lifetime evidence stays unavailable. Design authored. |
| 42.4 Bounded next batch / size | Only owner presentation prerequisite and scene-loss reuse selected; baseline owners for health/source/platform explicitly deferred. 43–44 has concrete controls and pause, no broad hook sweep. |
| 42.5 Handoff / evidence policy | Existing handoff updated to 42 design complete and 43–44 next; all executable validation deferred, no automatic model change or family closure. |

**Source Implementation Review:** inspected actual owner early return → actor index → assignment → presentation → event,
scene loss subscriber/irreversible coverage, recipient reconciliation and weak read scope, drain post-await owner/economy,
source capacity/stock/restore, health pre-event writes, platform roster/reset and existing source baseline entries.
The reuse of global loss avoids introducing an unsupported dependency registry; source split precedes the owner edit.

**Omission Audit:** 42.1–42.5 covers every requested writer, selected liabilities, cross-await identity, alias limitation,
restore/reentrancy/disposal, source prerequisites and deferred positive/negative controls. No runtime code/registration,
schema, test or config changes are applicable to this design-only stage. No skill/tool changes are warranted.

**Separate Final Closure Audit:** design is authored/source-reviewed only; implementation and all prior validation remain
open. Reviewed the two task-owned document changes against the acceptance table and next-batch scope. Retain unresolved
coordination documents; no proven runtime guidance exists to migrate from this stage. Preserve Nx merge `59f72e037`;
commit/push only these documents, verify Git remote and pause. Useful metrics remain null and all channels partial.

### Native application window checkpoint (2026-10-08, authored/unverified)

41 completes the authorized 40–41 authoring batch, based on
`4647a4a427acf56ddf34579df3e64317dd8ac254` (40). Containing commit owns 41. Commit/push and pause.
Actual host model/effort unknown; last selected Sol 6.1 / medium. No model switch. Every executable check stays deferred.

**What / why:** `resourceServices.applicationIntervals` is a separate `native_operation_entry` projection.
`skirmish-ai-runtime-resource-application-interval.ts` names its diagnostic contract; the application projection
places exact joined native entry/terminal pairs in `(start frontier, end frontier]`. Terminal and credit publication
must exist in the complete supplied tail, although publication can follow the endpoint. The shared application join
also serves frozen-need accounting, so both consumers check the same actual beneficiary and payload. Legacy
`intervals` retain publication-position diagnostics; no old field is silently relabelled.

| Acceptance / source evidence | Authored status / deferred evidence |
| --- | --- |
| 41.1 Native positions and endpoints | Application projection uses validated paired operations and exact snapshot frontiers/cohorts, never credit publication tick to choose the window. A pair crossing either endpoint, absent/ambiguous reads, drop/loss or incomplete journal leaves quantities null. |
| 41.2 Complete supplied tail | Shared recipient replay inspects all supplied entries/terminals and conflicts. Exact credit fact must be present in source tail; repeated operation credit or payload/beneficiary conflict rejects the normalized parent. Legacy absent operation IDs leave only new quantities unavailable. |
| 41.3 Diagnostic quantities | Observed income sums each exact scoped operation once. Observed contribution bounds use the selected accounting record; grant/spend before delivery still consumes the old shortage. All usefulness/floor/retained-throughput/capacity fields remain null; partial authority and mutable-alias gaps remain. |
| 41.4 Consumers / compatibility | Service projection adds application intervals; production causality clears them with every other normalized group on failure. Legacy publication fields retain their meaning and shape. No real recipe declarations, gameplay hooks, persistence, budget or coverage upgrades. |
| 41.5 Controls | New application fixture/spec covers publication in a later adjacent window, exact frontiers and boundary straddle, absent terminal/publication/join, missing/ambiguous reads/cohort, loss/drop, duplicate operation joins, conflicting tail, overflow and unrelated beneficiary. Grant then spend precedes native delivery; all controls are authored/unrun. |

**Source Implementation Review:** traced shared native-payload predicate, all-tail recipient replay, fixed interval
declarations, endpoint coverage/frontier validation, sparse source-player facts versus all-beneficiary journal, exact
join reuse, accounting-bound consumption, legacy projection and final parent suppression. Source review repaired a
synthetic unrelated-beneficiary control to retain the original recipient's payment terminal while inserting a distinct
recipient installation. Focused new owners remain below source limits; no baseline refresh/check executed.

**Omission Audit:** acceptance 41.1–41.5 includes registrations through existing derived report types, bounded arrays,
all-tail failures and negative controls. No new producer listener or ownership allocation requires disposal. Existing
partial cohort installation proves no continuous capacity. Authoring does not claim native integration or runtime cost.
Add `skirmish-ai-runtime-resource-need-boundaries.spec.ts` and `skirmish-ai-runtime-resource-application.spec.ts` to the
retained portal-e2e Playwright final gate; updated input-capture/controller specs join retained Phaser Jest patterns.
All earlier commands and real pipeline/controller integration obligations remain deferred.

Additional final-gate command (unrun; run with the retained 29–38 portal-e2e and Phaser commands):

```sh
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-resource-need-boundaries.spec.ts skirmish-ai-runtime-resource-application.spec.ts
```

**Separate Final Closure Audit:** 40–41 is authored/unverified, with separate source review and omission audit; native
planner/dispatch/resource semantics remain unchanged. Publication checks concern Git only. No executable validation,
useful-service activation, issue/family closure, fixed machinery total or completed-capacity claim. Preserve Nx merge
`59f72e037`, publish task-owned paths and pause.

#### Next bounded authoring action: 42 ownership design

Recommend **GPT-6.1 Sol / high** for the next ownership-design boundary. Define an explicit supported-route and
loss/closure contract for beneficiary membership/state, selected liabilities and source/actor/cargo lifetimes before
adding more hooks. Start from 39's audited writer table and 40–41's exact read/application constraints. Name each
pre-mutation authority, cross-await identity, public mutable alias limitation, reentrancy/restore/disposal boundary,
source-size prerequisite and deferred positive/negative control. Produce a concrete bounded implementation batch in
these existing docs; do not infer complete history from named method hooks or change public resource/payment semantics.
This design is used to choose what later diagnostic captures can prove without activating unsupported useful metrics.
Keep related ownership decisions together; medium can implement settled wiring after this contract exists.

### Causal need boundary checkpoint (2026-10-08, authored/unverified)

40 is based on `1c7ecdef633d5d28cf3ca88b7ed4467eb5436c12` (39); containing commit owns 40.
The user authorized the grouped 40–41 batch. Continue with 41 after publishing 40, then pause.
Actual host model/effort unknown; last selected Sol 6.1 / medium, recommended Sol 6.1 / high. No model switch.

**What / why:** `beginAiResourceDecision` publishes the actual committed observation's weak read identity before
the pure step. `resource_need_fence.incomingRead` does not keep older needs open. The report requires exactly one
matching start between the read and selected result, while other intervening boundaries still invalidate the frame.
`skirmish-ai-runtime-resource-need-boundaries.ts` recognizes only the exact selected gather intent, without resource
claims, its unique request/dispatched receipt and exact stamped bus/actor admission outcomes. All other dispatches,
rejections, throws, duplicates, later decisions and fences still close the generation. This lets conditional diagnostics
follow a real producer's ordering without equating admission to delivery or sustained usefulness.

| Acceptance / source evidence | Authored status / deferred evidence |
| --- | --- |
| 40.1 Incoming read versus older closure | Controller calls `beginAiResourceDecision` before reconciliation; capture serializes exact optional read; journal rejects conflicting fence/read references; projection requires one exact start and selected generation. |
| 40.2 Own gather admission | Focused boundary helper reuses route request/payload validation, joins exact decision/intent/correlation/stamp and admits only dispatch plus successful individual actor application. Other outcomes close; repeated requests/receipts cannot gain exemption. |
| 40.3 Frozen liabilities and lifetime | Original consumed ledger R0/D0 remains unchanged; mismatching accepting claims leave frame null. A native operation must finish before closure and forecast expiry; null quantitative needs cannot supply bounds. No pure planner, command bus or payment semantics changed. |
| 40.4 Controls | New admission fixture/spec covers producer-shaped read/start/selection/request/outcome/receipt/native delivery, unrelated/rejected/thrown/reentrant dispatch, later empty decision, reconciliation closure before expiry/recovery, purchase frame mismatch, omitted scope, restore and loss. Updated input-capture spec checks weak identity versus clone; controller spec checks fence-before-thrown-pure-step ordering. All unrun. |
| 40.5 Compatibility / ownership | Schema 1 gains an optional diagnostic fence field; legacy missing scope stays unavailable for new accounting while old publication diagnostics remain compatible. No listeners, budget or persistence changes; actual observation identity owns the passive read. |

**Source Implementation Review:** traced pipeline read → committed observation → controller pre-step fence →
selected result → synchronous bus dispatch/outcomes → receipt → native entry/terminal → whole-pile credit.
ActionSystem emits applied admission per actor, so request/receipt-only exemptions would still close a normal need;
the helper checks exact execution stamp and addressed actor. Rejections and unrelated outcomes remain boundaries.
Source owners remain focused; no baseline refresh or source validator ran.

**Omission Audit:** numbered acceptance 40.1–40.5 covers consumers, native call ordering, legacy omissions, liability
mismatches, thrown/reentrant/loss paths and docs. Recovery/expiry controls establish pre-reconciliation closure,
not full reservation lifecycle authority. Full native pipeline/controller integration remains a final-gate obligation.
All earlier 29–38 checks remain deferred, plus the new boundary spec in the existing portal-e2e Playwright gate.

**Separate Final Closure Audit:** reviewed complete task-owned diff; no executable tests, formatting, lint, types,
builds or repository validation ran. Conditional bounds remain diagnostics; public aliases and incomplete need,
liability/cargo/component histories retain mandatory gaps and null useful metrics. Nx merge `59f72e037` is preserved.
Commit/push this coherent stage and continue to distinct native application window diagnostics (41).

### Coverage activation audit checkpoint (2026-10-08, source audit only)

39 completes the bounded audit requested by `continue`, based on
`0e9dc0c9bc69c1aa04db1e1b35f51526efa4abc5` (38). Containing commit owns 39. Only this plan and the handoff
change; no runtime repair, coverage upgrade, test execution or useful-service acceptance is claimed. Pause after publication.

**What / why:** traced the actual consumed read, decision fence, accepting event, claim reconciliation, command dispatch,
native recipient operation and report window. The audit identifies where real producer ordering defeats synthetic
accounting and names the mutation routes that still prevent useful-service authority. The next batch can repair
diagnostics without mistaking a matching endpoint or a worker's income for sustained useful service.

#### Concrete producer/consumer obstacles

1. `observation/ai-observation-pipeline.ts` captures the resource input before
   `PlayerAiController.stepPureBrain` emits `controller_decision_started`. The accounting projection treats every
   `resource_need_fence` between the read and `decision_selected` as a liability change. Consequently an otherwise
   matching real selection receives `production_need_input_liabilities_changed_before_acceptance`. The start fence
   correctly closes older generations but does not by itself prove that the incoming read's liabilities changed.
   Repair requires exact decision/read scope; ignoring all fences by reason or tick would conceal genuine interference.
2. The same projection closes a selected need at any subsequent `intent_dispatch` or `outcome`. The controller publishes
   the selection before dispatch, so the accepted gathering command's own dispatch closes it before later delivery.
   A gather command without resource claims is not automatically a liability mutation. An exemption needs the exact
   selected intent/effect/decision and supported command lifecycle, with unrelated/rejected/ambiguous events still
   closing or remaining unavailable. A later decision, even empty, must close the previous generation.
3. The observation ledger uses `reservedUnspent: 0`. Capture calls `AiRuntimeUnspentClaims.observeDecision` before
   sampling the selected boundary, which includes newly accepted produce/research cash claims. The equality check
   against the consumed ledger therefore rejects selections with nonzero new liabilities. This is conservative,
   not a reason to replace selected R0 with a diagnostic total or count pending claims twice. Keep mismatching frames
   null; distinguish the consumed frame from accepting-result liability changes and any later settled read.
4. Stage 35 windows filter on credit publication sequence/tick. Stage 38 accounts by exact native operation entry,
   but has not changed those windows. A delayed credit can land in a different diagnostic window from its application.
   `installAiRuntimeProductionCapture` and multiplayer queue-world constructors pass no interval declarations.
   Existing synthetic positive fixtures do not establish real producer sequencing, useful windows or native recipes.

The bounds described in stage 38 are conditional diagnostics. Their synthetic arithmetic example does not establish
that an ordinary native decision currently produces a non-null contribution bound. Keep legacy publication-based
fields explicitly diagnostic; do not relabel them as application-owned evidence.

#### Audited writer and lifetime routes

Paths below are relative to `libs/games/probable-waffle/` unless explicitly qualified. This is an audited route list,
not a declaration that arbitrary public writes have been exhaustively intercepted.

| Writer / actual route | Current evidence and missing boundary | Safe consequence / prerequisite |
| --- | --- | --- |
| `protocol/.../probable-waffle-player.ts`: add/pay vector and leaf methods; public `getResources()` / state data | Native paired records cover named methods. Mutable references permit invisible write/undo histories. | Always retain mutable-alias gap; no proxy, freeze or resource API semantic change in the next batch. |
| `phaser/.../campaign/participants/campaign-participant-scene-adapter.ts`: `applyStartingResources` | Writes resource slots directly, outside add/pay hooks. | Named entry fence can cover that route; installation timing and pre-capture changes cannot establish general alias coverage. |
| `phaser/.../world/services/recovery/reconnect.service.ts`: snapshot apply and `Object.assign` of player state | `setSnapshotApplyInProgress(true)` fences before actor/state restore. Direct state replacement elsewhere is not thereby owned. | Retain restore loss and actual object-binding reconciliation; no epoch revival on restore completion. |
| `libs/platform/game-sessions/.../game-instance.ts`: `addPlayer`, removals, public `players`, `stopLevel` | Player reset has a pre-write observer; membership mutations/public array replacement are detected only at later reconciliation. | Membership pre-fences need scoped ownership; same roster at two reads cannot certify intervening replacement. |
| `gameplay/.../planning/ai-decision-planner.ts`: `reconcileReservations`; `brain/ai-brain.ts`: recovery release | Provisional expiry filters by due tick; terminal outcomes and abandoned recovery claims change reservations within the pure step. No per-transition native resource callback. | Exact decision-start closure covers older generations; a new need needs separately reconciled consumed/accepting frames. |
| `phaser/.../testing/ai-runtime-unspent-claims.ts`: selection, dispatch, outcome, queue and payment transitions | Selected/admitted/queue-liability/released states exist; pre-capture, unsupported purchases and unfinished payment stay gaps. Outcome publication is not a general pre-mutation boundary. | Retain sticky gaps; immediate payment retirement and physical liability transfer must remain disjoint. |
| `phaser/.../entity/components/queue/`: `mutateSharedQueueItem`, `advanceSharedQueueItem`, `QueueComponent.setData` / raw queues | Named mutation `before` and progress `started` precede native work. Restore rebuild and exposed queues/items permit bypass writes. | Close on actual before/start records; restore/raw references remain unsupported. Only the actually advanced exhausted head may be exempt from future charges. |
| `phaser/.../entity/components/owner-component.ts`: `setOwner`, `clearOwner`, `setData` | Actor-index update and owner assignment precede `OwnerChangedEvent`; event alone is post-only evidence. | A future entry fence must precede the index callback and preserve reentrancy/native ordering. Retain lifetime gap now. |
| `phaser/.../entity/components/combat/components/health-component.ts`: damage/heal setters, `killActor`, `setData`, delayed destroy | `killActor` writes health before `KilledEvent`; restore can set health without that event. Registration/removal records do not cover all earlier changes. | Health/owner/death/component lifetime needs its own pre-mutation ownership; later actor samples cannot prove continuous readiness. |
| `phaser/.../entity/components/resource/resource-source-component.ts`: `extractResources`, refill, lock, `setData` | Capacity changes bracket an await; stock deduction occurs later. Refill/lock/restore alter supply outside an extraction record. | Each phase requires explicit lifetime context and fences; a current supply sample is not continuous supply. |
| `phaser/.../entity/components/resource/resource-drain-component.ts`: `returnResources`, `setData` | Capacity changes bracket an await; actual drain owner and campaign economy are resolved afterward at emission. | Preserve actual beneficiary and suppression semantics; source-start owner cannot replace return-time owner. Capacity/owner/lifetime coverage remains partial. |
| Cargo/service context and report | Known whole piles and exact callback/native operation join exist; mixed/unknown/restored cargo and silent component changes remain unsupported. | No FIFO allocation, nearest-operation lookup or ambient latest-task attribution; all four coverage channels remain partial. |

Access/safety, container membership, component replacement, scene/controller lifetime and clock/horizon remain additional
continuous-capacity requirements. This audit supplies no new path query, scan, timer, mutation listener or complete predicate history.

#### Next bounded implementation batch: 40–41

Keep **GPT-6.1 Sol / high** across both stages: the incoming decision/old-generation distinction is an unresolved causal
contract, not routine field wiring. Last user-selected profile remains Sol 6.1 / medium; host settings are unknown,
and no switch is performed. Group these related repairs and pause afterward; do not activate useful metrics.

| Stage / purpose | Authoring acceptance and deferred controls |
| --- | --- |
| **40: causal read, frame and closure repair** — let report diagnostics distinguish a new accepted read from closure of an older need | Bind decision-start to exact consumed read and incoming selected identity; older needs still close before pure reconciliation. Preserve genuine intervening mutation/restore/loss fences. Classify exact self gather dispatch separately from actual liability/target changes; do not blanket-ignore outcomes. Keep nonzero accepting-result liability mismatches unavailable, never silently reprice selected R0/D0. Author a producer-shaped read → start → selection → own dispatch → native delivery control, unrelated dispatch, later empty decision, expiry/recovery, new purchase, thrown/reentrant/lost paths and legacy omissions. Preserve pure planner/native dispatch/payment semantics. |
| **41: native application window diagnostics** — place a joined delivery in the window where money actually changed | Add a separately identified application-based projection using validated operation entry sequence/tick and exact endpoint frontiers; terminal and credit publication must still be present in the complete supplied tail. A joined operation straddling an endpoint, absent/duplicate/partial join, conflicting tail or missing read stays unavailable. Keep legacy fields backward-compatible and explicitly diagnostic. Author delayed publication across adjacent windows, boundary straddle, duplicate join, unrelated beneficiary, grant/spend before delivery and overflow controls. Useful contribution, useful floors, retained throughput and capacity stay null; do not add real interval recipes or upgrade channel declarations. |

Before hooks, inspect each affected owner against the existing source-size/contracts rules and perform only required
scoped splits. No baseline refresh. Keep one root fact budget, bounded identities and owned disposal. The final gate
must run stage 40–41 controls together with all retained 29–38 obligations, including real pipeline/controller ordering;
no new command runs during authoring. Further full-history implementation needs a separate explicit ownership design,
especially public mutable aliases; adding method hooks alone cannot unlock it.

**Source Implementation Review, 39:** traced read/start/selection/dispatch against the actual controller and accounting
consumer; traced selected-before-frame claim ownership, queue before/start versus restore/raw references, reset versus
membership, reconnect pre-fence, owner/death post-events, source/drain await phases, and installer/window consumers.
The two producer timing obstacles and accepting-frame mismatch are recorded for repair, not asserted fixed.

**Omission Audit, 39:** (1) provenance/scope, (2) recipient alias/state/membership routes, (3) claim/queue/frame routes,
(4) owner/death/source/drain/cargo lifetime, (5) native versus publication windows/installers, (6) bounded next acceptance
and deferred controls, (7) current handoff/publication/pause are accounted for. Unsupported arbitrary writes and predicate
histories remain explicit blockers to activation; no audit table or positive fixture erases them.

**Separate Final Closure Audit, 39:** documentation-only scope preserves runtime/native behavior, mandatory partial
channels, null useful metrics, earlier deferred commands and unrelated Nx merge `59f72e037`. Current resume/grid/model
guidance names 40–41 and why each is used. Publication checks establish Git provenance only; no runtime pass, fixed
total/percent, issue/family completion or full-machine readiness is claimed. Commit/push the two task-owned docs and pause.

### Frozen need accounting checkpoint (2026-10-08, authored/unverified)

38 completes the authorized 37–38 **partial-channel diagnostic authoring** batch, based on
`f72d123174e9e9d1fb5ccdd335bfbce6cbeeff34` (37). Containing commit owns 38; pause after publication.
All executable validation remains deferred. Actual host model/effort unknown; last user-selected Sol 6.1 / medium.

**What / why:** the native observation pipeline marks the actual resource/queue-obligation read in the root sequence.
Weak observation metadata crosses only the pipeline's own canonicalization and accepted original gathering proposal;
intent/save/wire schemas do not change. Interference, missing installation or loss cannot manufacture a read marker.
`normalizeRuntimeRecipientMutations` validates every supplied journal tail, exact begin/terminal identities, initial
balances, monotone loss, source/projection duplicates and read vectors. It counts each native operation once;
older `resources_applied` callbacks do not become additional income.

`projectRuntimeResourceNeedAccounting` freezes the consumed input, checks its exact read, uses the selected fact's
actual reconciled unspent/live-queue frame, and requires the selected R0/D0 to match disjoint actual liabilities.
Pending claims are not added again; saved brain reservations do not supply current ownership. Missing frame or
pre-acceptance liability changes stay unavailable. An accepting result replacing the original forecast closes that
generation immediately. Later selected decisions, known claim/application/queue/construction/actor changes and
explicit controller fences close it conservatively; native application positions own accounting, not late publication.
Controller restore/state replacement/disable/authority loss/shutdown and the start of a fresh pure decision publish
fences before changing state. Existing queue before/start callbacks provide pre-mutation closure where available.
Post-only outcome/actor callbacks, silent claim expiry/recovery, owner/death/restore aliases and component lifetime
routes remain explicit unsupported coverage; these diagnostics cannot certify their absence.

`calculateRuntimeResourceContribution` caps observed contribution using cumulative positive recipient additions
since the consumed read, unchanged liabilities, actual entry/terminal stock and marginal spendable gain. Removals
never undo that cumulative income. All other observed grants/refunds/deliveries reduce the old shortage; the whole
matched delivery stays tied to its exact original selection and operation. Seven of ten wood supplied elsewhere and
then spent allows at most three from the later seven-wood delivery. Prior full fulfillment allows zero; money absorbed
by existing liabilities contributes zero. These are **observed upper bounds**, not complete-history useful metrics.
The existing `resourceServices.needAccounting` report consumer serializes frozen frames/closures/applications; parent
normalization failures clear it with other groups. Actual useful contribution, window floors, throughput and capacity
remain null; fixture declarations cannot upgrade any partial channel. Real recipes still declare no intervals.

**Source Implementation Review, 38:** traced native read -> pipeline canonicalization -> weak original selection ->
selected boundary frame -> strict all-recipient replay -> exact credit operation -> existing variant report. Reviewed
pre-acceptance additions, same-result replacement, application/publication order, cumulative income, marginal gain,
whole-pile identity, overflow/tail conflicts, legacy omissions, monotone loss and owned teardown. Repair from this review:
failed journal/root installation cleans owned subscriptions, and native listener snapshots prevent live-set churn from
making a notification unbounded; recursive loss notifications are bounded, and reset bindings clean up by their actual state.
The shared root append budget/sample/
failure path moved to `appendAiRuntimeProductionFact` to keep the growing capture owner within its source-size contract;
the existing root budget tests and new native append-failure control remain deferred. No baseline or skill/tool change.

| Acceptance | Authored source evidence / status |
| --- | --- |
| 1. Exact consumed input | `AiResourceInputRead`, weak observation owner, native pipeline/root input capture, original proposal |
| 2. Frozen liability frame | Selected fact's `boundaryState.unspentClaims` and live obligations, exact R0/D0; missing histories unavailable |
| 3. Conservative closure | Controller pre-fences plus selected/queue/outcome/actor fact closure; unsupported silent/post-only routes remain gaps |
| 4. Independent all-recipient replay | Strict paired journal validation, exact operation join, cumulative additions including pre-acceptance income; no double sum |
| 5. Contribution/report | Observed bounds and null useful metrics through `resourceServices.needAccounting`; parent failure clears normalized records |
| 6. Controls / final evidence | Proposal marker/controller/input/append controls plus journal/arithmetic/accounting Playwright specs authored, never run |
| 7. Publication / stop | Task-owned 38 commit/push/remote check, then pause before coverage activation audit |

**Omission Audit, 38:** acceptance 1–6 has authored producer/consumer/spec paths above. Full mutable-alias, silent
need/liability changes and cargo/source/drain/owner lifetime coverage remain activation blockers, deliberately retained
as gaps even for a synthetic successful calculation. No test fixture or hook list certifies full native authority.

**Separate Final Closure Audit, 38:** reviewed frozen versus newly projected forecasts, selected-before-save frame,
claims versus pending liabilities, exact native operation/window order, no reopening and null versus observed zero.
The bounded partial-channel batch is authored; no issue/family/release acceptance closes. Next authorized continuation
must begin with **39 coverage activation audit**, recommended **GPT-6.1 Sol / high**, to identify each missing writer
and determine safe bounded hooks before enabling useful metrics or authoring activation-dependent native recipes.
Do not silently erase gaps or change public mutable resource/native payment semantics to claim completeness.

Deferred additional final-gate commands (combine with every earlier obligation; **not run**):

```sh
pnpm exec nx test probable-waffle-protocol --testPathPatterns='player-resource-observation|player' --runInBand
pnpm exec nx test probable-waffle-gameplay --testPathPatterns='ai-general-gathering-proposal' --runInBand
pnpm exec nx test probable-waffle-phaser --testPathPatterns='observe-resource-application|ai-runtime-recipient-resource-capture|ai-runtime-resource-input-capture|ai-runtime-production-capture|player-ai-controller|ai-observation-pipeline' --runInBand
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-resource-need-accounting.spec.ts skirmish-ai-runtime-resource-service.spec.ts skirmish-ai-runtime-resource-credit.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

### Recipient native journal checkpoint (2026-10-08, authored/unverified)

37 follows the 36 design below, with a behavior-preserving player-owner split prerequisite `80a84493b`.
37 is `f72d123174e9e9d1fb5ccdd335bfbce6cbeeff34`. Related 38 accounting is now authored above; batch pause reached.
Last user-selected profile is GPT-6.1 Sol / medium; actual host settings unknown. Recommended profile remains
GPT-6.1 Sol / high because native ordering/authority crosses protocol, scene capture and accounting.

**What / why:** `PlayerResourceObservation` hooks actual add/vector-pay/direct-pay entry and terminal boundaries.
Expected vector leaf calls count once. Partial thrown payment retains its terminal balance and original native error.
`AiRuntimeRecipientResourceCapture` records initial stock and all observed recipients' native mutations in the same
root budget, preserving a separate all-recipient projection alongside source-filtered service facts.
`observeResourceApplication` joins an exact payload reference and actual recipient to one operation token;
`readAiRuntimeResourceOperationId` converts only that token to a capture-local ID on credit publication.
This supplies all observed grants/refunds/deliveries rather than a selected worker's subtotal, without adding income twice.

Reset fences before its first write; scene snapshot-apply fences before restoration/recreation. Actual bound player,
state, data and resource identities plus prior terminal balances are reconciled at existing tick/read boundaries.
Replacements, bypass mismatch, thrown/invalid mutation, reentrancy, listener saturation and append failure fence
monotone coverage. Owned teardown removes native/scene/identity subscriptions. No save/wire or native payment policy change.
All four prior gaps remain; native recipient, selected lifecycle, reconciled liabilities and cargo lifetime channels
are explicitly partial. Public mutable aliases and net-zero write/undo remain unsupported even when endpoints match.

**Source Implementation Review / Omission Audit, 37:** traced protocol listener -> exact player mutator -> begin/terminal
root records -> explicit token -> detached service credit, plus reset/restore/reconcile/teardown. Legacy synthetic players
without native authority stay unavailable rather than fabricate bindings. Authored native observer, exact-application and
recipient-journal specs cover direct/vector/partial throws, reentrancy, listener failure/saturation, foreign/equal-copy/
duplicate application, restore/replacement/alias mismatch and explicitly unsupported net-zero aliases. None ran.

**Separate Final Closure Audit, 37:** reviewed exact request/native error preservation, single outer vector operation,
root-budget ownership, all-recipient filtering, no double sum with `resources_applied`, local operation IDs and null join.
Source authoring complete for this partial channel; full alias/lifetime authority and useful activation remain open.
Final gate must run the new `player-resource-observation`, `observe-resource-application` and
`ai-runtime-recipient-resource-capture` specs with every prior deferred command. No executable validation ran.
37 was committed/pushed with matching remote. Its controls remain unrun; 38 records the related accounting publication/pause.

### Beneficiary need authority design checkpoint (2026-10-08, partially implemented)

36 is the user-authorized bounded design after `d2e48214230e66290f95f7011c17951025cbacda` (35).
The containing commit owns this documentation slice. Selected profile remains GPT-6.1 Sol / medium; actual host
settings are unknown. Source inspection only; no runtime change, executable spec, validation or model switch.
Pause after this checkpoint. The 32 contract and all prior final-gate commands remain mandatory.

**Purpose:** decide whether a particular gathering delivery still reduces its beneficiary's selected aggregate
shortage. For example, another worker or a refund may already have supplied the wood. A delivery can remain real
income while contributing zero to that old need. The current `potentialContribution` cannot decide this.

#### Actual writers and ordering

Paths below are relative to `libs/games/probable-waffle/` unless explicitly qualified. These are inspected source
routes, not evidence that every mutation is covered by today's capture.

| Authority / existing anchor | Finding / required implementation consequence |
| --- | --- |
| `protocol/src/lib/game-instance/probable-waffle/player.ts`: `addResources`, private `addResource`, `payAllResources`, public `payResources` | Actual resource writes are here. Vector operations iterate entries and can partially mutate before throwing. Observe actual mutators, including direct public single-resource payment; do not assume atomic payment. |
| `protocol/src/lib/communicators/probable-waffle/listeners.ts`: resource cases | Shared listener invokes those mutators. Observing the later `playerChanged.on` callback does not supply an operation-scoped before sample. Human/AI purchases, refunds and other gatherers use the same recipient money. |
| `phaser/src/lib/data/scene-data.ts`: `emitResource`, `sendPlayerStateEvent` | Routes through local send or normal communicator; restore can suppress emission. Returned emit is not proof of a native application. Preserve all existing routing/suppression behavior. |
| `phaser/src/lib/entity/components/resource/observe-resource-credit.ts`: `prepare` | Exact payload-reference callback, before/after balance and nested interference already exist, but no native player-mutation ID joins that credit to a beneficiary-wide journal. Keep these requirements in addition to the new join. |
| `phaser/src/lib/player/ai-controller/testing/ai-runtime-production-capture.ts`: constructor resource observer, `append` | `lastBalances` is the previous observed balance, not actual mutation entry. `resources_applied` also gets no `boundaryState` in the append allowlist. Facts are later filtered by source player; a recipient journal needs its own explicit projection. |
| `phaser/src/lib/campaign/participants/campaign-participant-scene-adapter.ts`: `applyStartingResources` | Direct writes bypass resource events. Pre-installation setup supplies initial stock only; invocation during capture must fence authority before mutation. |
| `phaser/src/lib/world/services/recovery/reconnect.service.ts`: `applySnapshot` | Sets the restore flag, recreates actors, then `Object.assign`s player state. Fence at restore entry, before any recreation/write; seeing the flag at a later snapshot is insufficient. |
| `libs/platform/game-sessions/src/lib/player/player-state.ts`: `resetData`; game-instance construction/reset/player membership | Public state and player identities can be replaced. Installation binds actual player/state/resource objects; reset, removal/replacement and scene restart terminate that binding. |
| Player `getResources()` and public `playerState.data` | Return/expose mutable objects. Method hooks do not intercept arbitrary alias writes or net-zero write/undo. Complete general resource history remains unsupported until these routes have an owned mutation boundary; matching endpoint balances cannot repair it. |

Existing resource-event callers were inspected in construction payment/refund, queue payment/refund, immediate
gathering, drain return, campaign grant/set actions, preset-world grants/starts and multiplayer test setup. All
recipient additions must affect need accounting, even if their origin is not service or belongs to another player.
Startup construction/loading is initial state, not income. Server mirrors and socket parity are separate #819 proof;
one scene journal does not establish cross-client exact-once authority.

#### Native mutation journal contract

Implement a focused protocol-local passive observer keyed weakly by the actual player instance, with no Phaser or
E2E dependency. The marked scene capture supplies simulation boundary reads and owns subscriptions. Ordinary
listener-free mutators keep their native path. Keep the existing class token, APIs, arguments, receiver, mutation
order, return/error and state/save/relay shapes. Use focused owners; split an oversized edited owner before hooks.

- Each outer resource call gets a capture-local operation ID and actual entry/terminal positions in the root's
  single ordered sequence. Record operation kind, exact requested vector, actual before/after vectors, return/throw,
  player/state/resource binding and restore/loss state. Numeric resource values remain finite native units.
- Vector-to-leaf calls belong to the same outer operation and count once. Direct `payResources` is also an outer
  operation. A failure after a first resource write records its partial terminal balance and invalidates quantitative
  history; never fabricate rollback or turn a thrown partial payment into zero mutation.
- Begin/end readers, append and observer failures fence loss before fallible diagnostics. Native work still runs
  exactly once with its original error. Reentrant diagnostic-triggered native operations are ambiguous and fence
  the affected epoch; expected internal vector-to-leaf nesting is distinct from external reentrancy.
- Bind the existing service emission's exact payload reference and recipient to one actual mutator application
  while that synchronous emission is open. Retain a transient explicit operation token/ID in the credit record;
  never select the nearest journal entry by tick, amount, resource, owner or a global ambient current order.
  Missing/multiple/nested applications leave the join unavailable. Direct grants still enter the recipient journal
  without becoming attributed service. Journal and old `resources_applied` facts are not summed twice.
- Project the bounded journal for the actual beneficiary, including every source player and non-service addition.
  Existing source-player filtering stays explicit. One recipient mutation may be referenced by several diagnostics
  but is consumed once by operation ID; conflicting references invalidate the parent normalized groups.
- Installation retains a detached initial vector and object identities at its real boundary. It cannot backfill
  pre-capture work. Every sampled boundary must reconcile against the previous journal terminal vector; a mismatch,
  unknown player, unsupported writer, open operation or replacement leaves completeness unavailable. This check
  detects some bypasses; it is not proof that arbitrary alias mutations never occurred between reads.

Use the existing 8,192 fact/identity, 256 snapshot/group and eight-listener/nesting bounds, with monotone loss before
serialization. New journal records consume the existing root fact budget; do not create an unbounded second history.
Keep all supplied tails inspectable and reject malformed/conflicting/overflow groups. Teardown removes only owned
subscriptions; disposal/restore/restart cannot revive an epoch. No extra scan, navigation query or timer.

**Coverage decision:** introduce separate explicit channel status for native recipient mutations, selected-need
lifecycle, reconciled liabilities and cargo/lifetime. Today's four unsupported-history gaps remain mandatory.
Do not replace them with one `complete` boolean. Native-mutator coverage alone is partial because public mutable
aliases and state replacement exist. A test declaration, writer list or successful positive fixture cannot grant
complete authority. Either implement the missing mutation boundary without changing gameplay semantics, or retain
null usefulness and the exact unsupported route. This is an activation gate, not a reason to stop authoring records.

#### Frozen need generation and conservative closure

Use the original accepted selection identity and the 33 consumed inputs. At acceptance retain the original forecast
`A`, resource, horizon, player/generations and input ledger `S0`, `R0`, `D0`. A later decision's freshly projected
forecast cannot replace them: macro chooses gathering before `projectAiMacroEconomyState`, and
`PlayerAiController.stepPureBrain` dispatches before saving `result.nextState`.

Bind the consumed stock/obligation observation to its actual read position in this same capture epoch. The current
selection has a tick/generation but no journal read marker; tick equality cannot fill that gap. Capture a transient
read marker at the native observation projection and carry it through accepted selection metadata without save/wire
changes. Missing/pre-installation/interfered reads stay unavailable. Replay all recipient additions between that
input read and acceptance as well as later ones; a balance that happens to match again is insufficient. If the same
accepting result already replaces the consumed target/forecast, close the old input immediately rather than borrowing
its new forecast. A new supported generation needs actual fresh selected inputs.

Establish a detached acceptance-time liability frame from the actual selected result plus reconciled unspent claims,
pending admission ownership and live stored queue charges. Existing owners are `AiRuntimeUnspentClaims`,
`AiRuntimePendingCommands`, `projectAiRuntimeProductionBoundaryState` and `projectAiProductionObligations`.
The live controller brain/reservations can lag dispatch; use the exact selected event, not a newer/older saved view.
The observation currently sets `reservedUnspent: 0`. Do not substitute diagnostic claim totals silently: if exact
disjoint reconciled liabilities cannot establish that the selected `R0`/`D0` still apply, usefulness is unavailable.
Do not add pending claims twice; a selected/admitted cash claim transfers into physical pay-over-time liability or
retires on exact successful immediate payment. Pre-capture/unsupported construction and unfinished payment remain gaps.

The first implementation deliberately closes the old generation on **any relevant liability or target change**;
it does not reprice a new obligation into the old need. Close before the affected mutation/callback, using actual
sequence order, for the following routes:

- Every later selected decision, including an empty or non-gathering one. Same forecast values do not renew identity.
- Claim release/expiry/recovery abandonment, admission rejection/cancellation/failure/payment, queue insertion/removal/
  progress/completion/restore, or an affected actor's registration, owner transfer, death or removal. Existing outcome,
  queue mutation/progress and unspent-claim events are starting anchors; post-only callbacks need a pre-mutation fence.
  Successful zero-time progress has its existing exact exhausted-head exemption; never infer it from remaining time alone.
- `PlayerAiController.setBrainState`, `setSaveState`, disable or authority loss; controller replacement, scene teardown,
  restore, clock/loss fence and horizon expiry. These need actual entry hooks, not later roster/tick samples.

If a relevant route cannot be observed, report missing lifecycle coverage; absence of a callback is not continued
need. Closed generations stay closed. A new accepted quantitative selection may open a new generation only from
new independently captured inputs/history. This is aggregate forecast service, not individual purchase fulfillment
or strategic sufficiency. Keep the same-recipient/resource overlap rejection; no allocation across competing needs.

#### Independent unresolved amount at each application

Only when all relied-on channels are supported, define `B0 = max(0, S0 - R0 - D0)` and `G = max(0, A - B0)`.
Let `Pbefore` be **all positive native additions to this beneficiary/resource after the exact consumed input read
and before the exact application**, including other gatherers, cross-owner deliveries, refunds and grants.
Pre-acceptance additions belong in this history too; the input's initial stock is excluded.
Removals never subtract from this cumulative value. Retain the actual pre-application stock `Sbefore`; liabilities
must still be the unchanged, independently reconciled `R0`/`D0` or the generation is already closed/unavailable.

```text
unresolvedBefore = min(max(0, G - Pbefore), max(0, A - max(0, Sbefore - R0 - D0)))
spendableGain = max(0, Safter - R0 - D0) - max(0, Sbefore - R0 - D0)
usefulContribution = min(eligibleScopedAppliedAmount, unresolvedBefore, max(0, spendableGain))
```

This is a conservative portion of a whole attributed pile; it does not divide cargo among attempts or originating
demands. Eligibility still requires the 31/35 exact whole-pile accepted-selection/recipient/operation lineage and
complete relied-on lifetime history. Unmatched ordinary income can close a need but cannot become useful service.
The actual terminal balance `Safter` belongs to that same successful mutation. The marginal spendable cap prevents
money absorbed entirely by already-owned liabilities from claiming to reduce the selected forecast shortage.
Counting all positive additions against `G` remains deliberately conservative; this may undercount useful service,
but it never renews the old generation after spending. Malformed/negative/non-finite requests or unmatched vector
changes invalidate quantitative history without repairing native inputs or inferring application amounts.
After each actual addition, advance `Pbefore` by its full applied positive amount, including surplus/ineligible income.
Cap cumulative contribution once across windows/adjacent intervals for that generation. A satisfied generation
never reopens because spending reduces the stockpile; changed liabilities require closure and a fresh selection.

Example: an initial 10-wood shortage receives seven wood from another source, spends seven, then receives seven
from the selected worker. The old generation can receive at most three useful wood, even though its current balance
would allow all seven. If other income already supplied ten, the worker's delivery contributes zero. Conversely,
unavailable recipient or liability history produces null, not zero. The formula is a future conservative service
metric, not a claim that native planner demand has authoritative demand-unit allocation.

Application order comes from the native mutation entry/terminal, not the later `resource_credit` publication. New
credits must carry that exact join. A supersession occurring after native application but before its diagnostic
publication cannot retroactively change the application order. Nested/interfering operations stay unavailable.
Fixed window ownership likewise uses application position; actual reads never seal pending async continuations.

Useful-window floors may be evaluated only with complete interval history and need/lifetime authority. A covered
window with no qualifying contribution is zero; a missing window is null. A filled/closed generation cannot prove
continued useful throughput in later windows. Renewed service requires independently declared/captured generations,
not moving deadlines or extending the forecast. `continuousUsefulCapacity` stays null until complete readiness,
supply, drain, access/safety and service predicate histories exist. Source refill/lock/restore, drain capacity and
owner changes are additional actual writers, not covered by successful extraction/credit observations.

#### Capture/accounting implementation status and final-gate evidence

37–38 partial-channel authoring is recorded above. Recommend **GPT-6.1 Sol / high** for the next 39 coverage audit;
this is a task-risk recommendation, not a setting change. Medium remains suitable for later settled fixture/report
wiring. These are local authoring boundaries, not a remaining-machinery count or automatic authorization.

| Next stage | What / why / authoring stop condition |
| --- | --- |
| 37: recipient mutation capture | Authored/unverified native observer, bounded all-recipient journal, exact operation join and fences. Gives accounting observed recipient income rather than a worker subtotal; mutable aliases remain unsupported. |
| 38: need lifecycle/accounting | Authored/unverified exact read, selected frame, conservative known-boundary closure and observed unresolved/contribution bounds. Prevents observed other income/spending from renewing old need; silent lifecycle routes and useful activation remain unsupported. Batch pause reached. |
| After 38: activation/recipes | Audit remaining mutation authority before enabling useful windows, then frozen native positive/control declarations through the installer/browser config and existing variant consumer. Gives PRO oracles independent real evidence; do not assume 37–38 makes activation safe. |

Author, but do not run until the final gate, controls for direct/vector mutations; partial throw; expected leaf nesting
versus reentrancy; observer/reader/subscribe/append failure; unknown/removed/replaced player/resource objects; restore
before write; alias mismatch and explicit unsupported alias history; other source/cross-owner income/refund/grant;
suppressed/zero/pending credit; exact-reference duplicate/interference joins; same-tick application versus selection/
publication ordering; stale selected ledger; claim-to-queue transfer without double reservation; pre-capture claims;
payment/progress/zero-head boundaries; missing input read marker and income before acceptance; same-result forecast
replacement; forecast/claim/lifetime closure; spending after fulfillment; income absorbed by existing liabilities;
whole-pile mixed
generations; empty versus missing fixed windows; overflow with contradictory tails. Reuse existing credit, unspent,
queue-boundary and resource-service spec owners; add focused native observer/replay owners when implemented.
Existing installer currently passes no intervals, so declarations and real PRO-03/06/07 positive/control recipes
remain unimplemented. All full oracles/denominators and uncovered gaps remain mandatory.

**Source Implementation Review, 36:** traced native event application to player writers, direct campaign/setup/restore
paths, selected-result-before-save ordering, live queue liability and reconciled claim consumers. Rejected previous-
balance reconstruction, source-cohort totals, amount-only joins, mutable-alias completeness and balance-only reopening.
No gameplay/public API/save/wire/schema/editor/CI/baseline or skill/tool change; only the two existing roadmap docs.

| Acceptance | Source evidence / status |
| --- | --- |
| 1. Provenance/scope | 35 local/remote SHA matched; Nx merge ancestor preserved; existing two-doc scope |
| 2. Recipient writer authority | Native writer/bypass table and bounded journal contract; implementation open |
| 3. Selected need/liabilities | Exact input read, accepting result, disjoint live frame and closure routes; implementation open |
| 4. Independent usefulness | All-recipient positive history, no reopening and marginal spendable cap; activation gated |
| 5. Failure/lifetime/consumers | Monotone channel loss, bounds/cleanup, exact application/window joins and mandatory PRO gaps |
| 6. Negative/final evidence | Future native/replay controls named; no executable checks or runtime behavior added |
| 7. Publication/resume | Two scoped docs, commit/normal push/remote check; pause before grouped 37–38 |

**Omission Audit, 36:** the writer table, native journal, independent need/frame/closure contract, conservative
formula, channel activation gate, fixed windows, bounds/cleanup and negative evidence above cover acceptance 1–6.
Full mutable-alias, need/liability and cargo/lifetime mutation authority are explicit implementation blockers to positive
usefulness, not design successes or lost requirements. No executable specs were added for a documentation-only stage.

**Separate Final Closure Audit, 36:** after source review, rechecked partial native writes, recipient/source identity,
application versus publication sequence, disjoint liabilities, monotone fulfilled/closed state and strict null/zero
distinction. Acceptance 7 is scoped publication: commit/push these two docs and verify remote, then pause before 37–38.
This closes the bounded design authoring only. All executable tests/validation remain deferred; no issue/family closes.

### Resource service input and interval checkpoints (2026-10-08, unverified)

Authorized group: 33 consumed selection, 34 supported coverage/loss, 35 strict interval diagnostics.
Stage 33 is `0e1906024c7339a964fcc1dfdea93145b9e10509`, based on `42b5bf3d3`.
Stage 34 is `d226b6636d41cc7201803ba80d34869a32b59a78`, based on that stage-33 commit.
Stage 35 is `d2e48214230e66290f95f7011c17951025cbacda`, based on that stage-34 commit.
The 33–35 pause boundary was reached; the newer authority-design checkpoint above owns current continuation.
Last selected profile: GPT-6.1 Sol / medium; actual host settings unknown. No automatic model switch.
All executable tests/validation remain deferred. The stage-32 contract below remains mandatory.

**33 — authored/unverified, purpose:** `selectAiForecastEntry` returns the native winning entry with the same sort,
tie and fallback behavior. `AiGatheringSelection` / weak selection observation retain a detached selected ledger,
forecast, generations, native deficit and exact branch without adding an intent/save/wire field. The dispatch event
reads only original accepted proposal identities; copied/restored/rejected objects cannot borrow the metadata.
`normalizeRuntimeResourceNeeds` validates bounded accepted inputs and derives gross aggregate unmet resources; the
following report stage connects its consumer. This lets later accounting identify the resource need the AI actually
selected, even when `demandId` is null and the next macro projection changes the forecast.

**Source Implementation Review, 33:** traced the real macro proposal, selector, arbitration's reference-preserving
`accepted.push(intent)`, result dispatch before its detached clone, and resource-deficit arithmetic. Diagnostic storage
and read failures leave evidence unavailable. Sorting still evaluates every original entry and keeps native stable ties;
the first duplicated resource entry is not retrospectively guessed. Weak storage holds no live state or intent history.
The small per-proposal diagnostic clone is unmeasured and belongs to the final gate.

**Omission Audit, 33:** consumed input, actual branch, accepted identities, aggregate units and nullable demand are
represented. Pure proposal controls cover duplicate forecasts, later mutation, nonpositive native choices and fallback;
dispatch controls cover accepted originals versus rejected/copied proposals. Both are authored/unrun. The report helper's
consumer is 35 in this authorized batch. No planner policy, durable field, schema, editor, CI, baseline or skill/tool change.

**Separate Final Closure Audit, 33:** rechecked selector forwarding, object identity through arbitration/dispatch,
known/unknown income, diagnostic failure, bounded report tails and test discovery. This closes authoring only; no
formatter/lint/types/build/Jest/Playwright/source validator, simulation or other executable check ran.

**34 — authored/unverified, purpose:** `AiRuntimeResourceCoverageCapture` / `AiRuntimeResourceCoverageV1` retain
bounded weak component cohorts and real `(tick, captureSequence)` reads. Resource/attempt observers report failed
reads, listeners, installation and append loss; restore, component/actor/owner/controller replacement, unwatch/disposal,
clock replacement, skipped ticks and saturation fence the capture before diagnostic work. The same root inventory,
registration and existing tick subscription supply installation; there is no new scan/query/timer. Actual event-time
discovery of a late component cannot backfill an earlier execution. Loss is global and conservative within this one
capture instance (`captureEpoch: 1`); this instance never reopens a lost epoch.

`AiRuntimeProductionCapture` also freezes optional test-owned `AiRuntimeResourceServiceIntervalV1` declarations at
installation, retaining an overflow flag and discarding an oversized group. Old callers remain valid and declare no
interval. `validateRuntimeResourceCoverage` checks ordered tails, snapshot markers, sparse global sequence clocks,
cohort identity/prefix preservation and monotone loss. Unsupported full component/lifetime/beneficiary-need mutation
routes remain explicit gaps; this is partial channel authority, never complete income or continuous service coverage.

**Source Implementation Review, 34:** traced the optional coverage owner through root -> spatial -> producer routes ->
orders -> service attempts -> cargo observation. Loss callbacks are insulated from native results/errors; the original
mutation runs once and the original native Promise remains unchanged. Read-side invalidation occurs before serializing
loss counters. Existing subscriptions retain their teardown route; only weak component identities and detached bounded
cohorts are retained. Snapshot/read/append/saturation failure cannot be repaired by later balances. Binary neighbour
checks avoid rescanning all facts for every cohort at every read. Capture/output cost remains unmeasured.

**Omission Audit, 34:** install/frontier/epoch/loss routes, fresh identities, lifecycle fences, numeric caps and legacy gaps
are represented. Coverage specs cover failed samples, original mutation/error, subscriber cap, restore-before-reader,
component replacement, cohort cap and fast-forward; all are authored/unrun. Unsupported history stays named, not inferred
from successful samples. No durable schema, new actor query/timer, baseline refresh, editor/CI or skill/tool change.

**Separate Final Closure Audit, 34:** rechecked optional constructor compatibility, real observation/teardown routes,
late installation, actor/owner/component reuse, restore-before-append, clock/read positions and discarded oversized
declarations. Coverage validator's consumer is 35 in this same batch. All executable checks remain deferred; complete
beneficiary-need/lifetime authority and actual useful-throughput acceptance remain open.

**35 — authored/unverified, purpose:** `projectRuntimeResourceServices` now consumes the selection and coverage
helpers through `normalizeRuntimeNativeServices`; `RuntimeProductionCausalityV1.resourceServices` is retained by
the existing `skirmish-ai-runtime-variant-runner.ts` report. No runtime recipe yet supplies interval declarations;
ordinary captures still retain selection/coverage diagnostics plus the missing-declaration gap.

`validateRuntimeResourceIntervals` accepts independently frozen dates, actor cohort, beneficiary/resource, run ceiling,
fixed floors and explicit partial-window duration/floor. Every window needs unambiguous actual reads at its exact ticks;
effects use `(left.captureSequence, right.captureSequence]` and their real ticks. Legacy/ambiguous/missing/lost reads,
late/missing/replaced cohorts and snapshot drops cannot certify supported coverage. All supplied tails are inspected;
256 need/cohort/interval/window groups and existing 8,192 fact bounds remain fail closed. Overlap for one beneficiary/
resource is rejected, including different actor cohorts. Contradictions suppress parent normalized groups.

Scoped observed income is the declared source cohort's subtotal, not all beneficiary income. Stable transfer identity
is required for the interval total; each transfer counts once. Eligible observed whole-pile credits require one exact
accepted gathering selection shared by every contributor, the same beneficiary/resource, an earlier observed cohort
and no lifetime fence. Any later selected decision conservatively closes the old selection input. Mixed generations,
cross-owner service, unknown/pending/partial piles, zero/suppression and later decisions cannot supply eligible positive
contribution. The upper bound is capped once by gross unmet selected need across chronological windows and adjacent
intervals; excess never becomes fulfillment value, and spending cannot reopen that cap.

**Unimplemented mandatory proof:** `usefulContribution`, `retainedUsefulThroughput`, `continuousUsefulCapacity` and
`meetsUsefulFloor` deliberately remain unavailable (`null`). Supported partial channels and a cap cannot show that the
same beneficiary need was still unresolved at application, that other income had not filled it, or that readiness,
supply, drain, ownership/access/safety and service stayed valid. Full recipient resource/liability/need and relied-on
component/lifetime mutation routes, actual useful-window oracle, real recipe declarations and native positive/control
evidence remain open. This is interval diagnostic authoring, not completed useful-service machinery or scenario closure.

**Source Implementation Review, 35:** traced original accepted selections through each cargo contributor's earlier
shared service command and real scoped credit, then the existing variant consumer. Repaired retrospective first-entry
selection, missing supplied input fields, same-tick boundary ambiguity, repeated transfer totals, late cohort backfill,
cross-window cap reuse and unsupported-history promotion. Reads/counters never seal async work; a pulse cannot count
in a later empty window. Sparse installation clock checks use binary neighbours; report/capture cost is unmeasured.
Every original attempt/capture gap and PRO-03/06/07 full oracle/denominator remains mandatory.

**Omission Audit, 35:** acceptance 1–7 is represented by owning production symbols, consumers and the four focused
spec owners. Synthetic report controls cover null demand versus newer forecast, fallback/expired/confidence/nonpositive/
missing/rejected selection, same-tick/ambiguous reads, missing/late/lost/legacy/dropped coverage, revival, deadline/overlap,
reused transfer, supersession/mixed generations, other income plus spending, pulse then empty window, overflow with
contradictory tail and explicit partial-window floors. Earlier 29–31 native/zero/suppression/restore controls stay required.
Actual usefulness and native fixtures are expressly unimplemented above; no no-op success adapter or fixture registration
is claimed. Helpers are consumed; no save/wire/schema/editor/CI/baseline/skill/tool change or new plan file exists.

**Separate Final Closure Audit, 35:** after repairs, rechecked accepted/cargo/recipient units, fixed deadlines/half-open
positions, cohort lifetime and global-versus-subtotal authority, once-only accounting, cap renewal and existing report
failure propagation. Commit only owned paths, normal batch push and verify remote SHA. Pause at this authoring boundary.
No Jest, Playwright, formatter, lint, types/build, schema/source/repository validator, doctor/context/catalog, simulation
or `git diff --check` ran. Nothing is validated and no issue/family closes; every earlier final-gate obligation remains.

**Next — 36, purpose / recommended profile:** GPT-6.1 Sol / high for a bounded complete-beneficiary/need/lifetime authority
design checkpoint. Start at the root resource observer, scoped credit helper, unspent-claim owner and boundary-state
projection. Trace all actual resource mutators and forecast/claim supersession/abandonment; define complete initial
authority plus every mutation/failure/loss fence before enabling actual useful contribution. Then group supported native
capture and useful-window/recipe wiring under that settled contract. Do not invent a fixed remaining total or authorize
this next group automatically. The high recommendation is task-specific;
[OpenAI Docs](https://developers.openai.com/api/docs/models/gpt-6.1-sol) confirms Sol supports medium/high, not that this
repository requires a particular setting. Host settings were not changed.

| Acceptance | Result / purpose | State |
| --- | --- | --- |
| 1. Provenance / ownership | Same worktree/branch, base 32, unrelated Nx merge ancestor preserved | Source reviewed |
| 2. Actual accepted selection | Weak proposal inputs -> detached dispatch -> aggregate need helper -> reports | 33 authored/unverified |
| 3. Supported coverage | Installation/frontier/loss and unsupported authority distinctions -> reports | 34 authored/unverified |
| 4. Fixed interval accounting | Cohort, beneficiary, ordered reads, unique credits and capped windows | 35 diagnostics authored/unverified |
| 5. Honest usefulness / capacity | Independent need/lifetime mutation history is required | Useful oracle open |
| 6. Controls / final gate | Pure/dispatch/coverage/report specs authored; all execution deferred | Unverified |
| 7. Publication / resume | Scoped commits, single normal batch push, remote check; pause after 35 | Authoring boundary reached |

Deferred 33–35 commands (do not run before the final gate; retain every earlier command below):

```sh
pnpm exec nx test probable-waffle-gameplay --testPathPatterns='ai-general-gathering-proposal|ai-resource-forecast' --runInBand
pnpm exec nx test probable-waffle-phaser --testPathPatterns='dispatch-ai-brain-result' --runInBand
pnpm exec nx test probable-waffle-phaser --testPathPatterns='ai-runtime-resource-coverage-capture|ai-runtime-resource-service-capture|ai-runtime-route-order-capture|pawn-resource-service-observation' --runInBand
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-resource-service.spec.ts skirmish-ai-runtime-resource-credit.spec.ts skirmish-ai-runtime-service-attempt.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

### Useful resource service contract checkpoint (2026-10-08, unverified)

Machinery 32 is the contract boundary after `c7aefd0b8dd2217f90eeea5d6abe695bb74e2057`.
The containing commit owns this documentation slice. Last selected profile: GPT-6.1 Sol / medium; actual host
settings unknown. A generic continuation authorizes this contract stage and its scoped commit/push, then a pause.
No runtime code, executable spec, fixture registration or passing evidence is added here.

**Purpose:** distinguish accepted gathering, actual delivered income, contribution to a dated resource need,
retained throughput, and continuous useful capacity. These require different authorities. The 29–31 facts are
prerequisites, not interchangeable proofs. The rules below govern the next implementation; they are unimplemented.

#### Source findings and quantitative need

- `planning/ai-general-gathering-proposal.ts` selects from `state.economyProduction.forecasts` and returns
  `assign_gatherers` with `demandId: null`. `planning/ai-macro-manager.ts` invokes it before projecting the new macro
  state. Capture the exact inputs consumed there; a later decision snapshot can contain a different forecast.
- `planning/ai-resource-forecast.ts` aggregates unmet priced demands per resource with a 600-tick forecast horizon.
  `aiResourceForecastDeficit` subtracts spendable stock and predicted delivered income. These are planner estimates,
  not application evidence or a mapping from one resource unit to one originating production demand.
- `contracts/ai-plan-contracts.ts` demand units include actor counts and generic work. `resourceObligations` can
  price a missing actor/building; neither field alone declares a delivered-resource target with beneficiary/dates.
- `skirmish-ai-runtime-route-service-lineage.ts` therefore may retain a valid selected service command while its
  selected demand is missing. Keep that distinction; never parse `reasonCode`, borrow purchase demand, synthesize
  a demand ID, or turn movement/production work into resource units.

These gameplay source anchors are under `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/`;
the report anchors are under `apps/portal-e2e/src/e2e/`.

The first resource-need authority is **aggregate selected forecast need**, explicitly labelled as such. A transient
selection record must retain the actual intent/effect identity, player, observation/catalog generation and tick,
selected resource, forecast amount/horizon/confidence, stockpile/reserved/due amounts, empirical-income status/value,
and exact chosen forecast-versus-fallback branch. Bind this to the later accepted decision and shared command by
existing identities. Rejected proposals supply no accepted service. Do not change native resource selection or
persist/relay this diagnostic record. Capture input during selection; retrospective recomputation is insufficient.

Define `spendable = max(0, stockpile - reservedUnspent - obligationsDue)` and
`grossUnmet = max(0, forecast.amount - spendable)` in units of that exact resource. Retain the planner's own deficit
separately, including its predicted income subtraction. A quantitative need requires known finite nonnegative inputs,
a positive selected planner deficit, positive grossUnmet, positive forecast confidence and a future horizon. Missing,
expired, fallback or nonpositive-deficit selections retain assignment/income only. Do not call grossUnmet a native
planner output or recompute its forecast price into a different demand. The current selector can choose a nonpositive
maximum; observation must preserve that behavior rather than repair it.

This proves at most contribution toward an aggregate forecast shortfall. Individual production-demand fulfillment,
whether that forecast is strategically sufficient, and affordability of a later purchase require their independent
catalog/liability/decision/application evidence. Do not remove those production oracle gaps.

#### Exact endpoints, horizon and accounting

Use a capture epoch plus ordered boundary `(simulationTick, captureSequence)`; sequence distinguishes same-tick
selection, admission, addition, credit, cancellation and read. A boundary is an actual detached capture/read position,
never an asserted end of all work at that tick. `SimulationTickService.tick$` emits synchronously when a tick begins;
async continuations can follow it. A tick subscription alone cannot seal that tick's final resource history.

The fixture declares start tick, deadline/end tick, retained duration, subwindow length and required amounts before
execution. All ticks are safe integers; durations are positive. Resource amounts are finite nonnegative native units.
The requirement cannot extend the consumed forecast horizon, run ceiling or captured authority frontier. Never default
an oracle window to the planner's 600 ticks, move a deadline to the first successful credit, or stop early. Require
actual start/end reads and exact endpoint ticks. Define all effect intervals as `(leftBoundary, rightBoundary]`:
left-edge/pre-installation credits are excluded; right-edge credits through that read's sequence are included.

An eligible useful contribution needs positive `appliedAmount`, matching actual beneficiary and resource, complete
whole-pile provenance and earlier accepted gathering with the same selection record. Credits after a selection's
horizon, abandonment, supersession or lifetime fence remain observed money but supply no old-need contribution.
Whole piles with contributors from different need generations are not allocated to one generation. Keep the existing
no-partial/FIFO attribution rule. Cross-owner income cannot fulfill the gathering player's need. A recipient report
must not infer it from its balance: existing facts are filed under the source player, so beneficiary-wide totals
require explicit complete scene capture/recipient projection, not a single player's fact list.

For one fixed need generation, count each transfer once in application order. Report raw eligible income separately
from `potentialContribution = min(eligibleIncome, grossUnmet)`; excess has no additional fulfillment value. Whole-pile ownership
remains intact when this cap saturates. Before labelling any portion useful, require independent evidence that this
same need remains unresolved at that application's boundary. Other income, revised liabilities or abandonment may
already have closed it. This requires complete beneficiary resource/liability/need history; a cohort subtotal cannot
provide it. Missing history leaves actual useful contribution unavailable, with potentialContribution retained as an
explicit upper bound. Later spending cannot reopen a fulfilled generation. The cap is not an allocation to originating demands
or a rewrite of cargo lineage. Overlapping needs cannot each spend the same credit; until a real independent allocation
authority exists, permit one evaluated generation per beneficiary/resource interval and reject overlapping claims.
Credit at a supersession boundary uses its actual sequence relative to supersession, never tick-only equality.

Zero application is observed zero income. Campaign suppression, emitter return, native extraction/drop-off result,
pending cargo, refunds, initial stock and balance deltas without scoped service credit cannot satisfy this metric.
Consumption/spending does not erase earlier income; retained stock and actual later spending remain separate evidence.

#### Complete coverage and retained benefit

Coverage is explicit capture-owned authority, scoped to the declared actor cohort, need generation, channels and
epoch. Declare the cohort at the start boundary, including current native gatherer identity and listener installation;
late installation cannot backfill old cargo or work. Pending pre-start executions cannot acquire this generation.
Reuse the existing indexed inventory/subscription routes; no extra scene scan, navigation query or gameplay timer.
New actors may join only at an observed registration/component-install boundary with fresh identities. Such joins
cannot make an earlier cohort interval complete. Scope a cohort subtotal honestly; it is never all-player income.

Installation/read/subscribe/append/detach failures, unsupported mutation paths, missed registrations, lost facts or
snapshots, saturated identities, scene/controller/component replacement, restore, actor reuse and disposal make the
affected coverage unavailable. Record a monotone epoch/loss fence before fallible diagnostics; even a lost fence
record cannot allow later credits to certify the old interval. Fast-forward without intermediate ticks breaks tick
coverage. Simulation pause adds no ticks or income; wall-clock waiting supplies no horizon evidence. Later snapshots,
no recorded error, unchanged current order or repeated successful credits cannot repair absent coverage.

Retain existing raw caps (8,192 facts/identities, 256 snapshots) and bound cohorts/need/window groups at 256. Overflow
or supplied contradiction invalidates the whole relevant group; inspect all supplied tails before producing output.
Legacy capture without explicit authority stays unavailable, even with zero reported drops. Hooks must cover every
mutation relied upon; a roster plus tick counter alone cannot certify no missed service/cargo/lifetime changes.

**Retained useful throughput** means independently declared resource delivery floors in every adjacent, nonoverlapping
subwindow over the full retained interval. Require integral tiling of its duration; include a final partial window only
if the fixture explicitly declares its length and floor. Require complete scoped coverage and dated positive need in
each window; after a need is filled, renewed throughput usefulness needs a new independently captured generation.
One large delivery cannot satisfy a later window, and a final stockpile cannot replace any window. Supersession or
abandonment closes the old generation; do not invent future work to keep a sustained-service assertion alive.

**Continuous useful capacity** is a stronger predicate: actual retained ready/living/owned capability, source supply,
compatible beneficiary drain, accepted service and fair access/safety must hold throughout a declared interval.
Endpoint snapshots and throughput windows do not prove it. Each predicate needs an initial authority sample plus all
actual mutation/invalidation boundaries, including source depletion, order changes, component/lifetime changes and
navigation/threat revisions. Until those complete routes exist, keep continuous capacity unavailable. Full production
retention also needs producer/lane/product/tech authorities; resource flow never substitutes for those.

#### Consumers, cases and next grouped implementation

The future normalizer should expose scoped income, aggregate need contribution, retained throughput and continuous
capacity as separate evidence/status fields. Contradictions still suppress parent normalized groups. Missing proof
remains a gap; do not globally delete attempt-level missing-credit/history gaps just because some credits exist.
Resolve only a specifically covered claim. The existing `evaluateRuntimeProductionCausality` and mandatory PRO-03/06/07
transition/resilience/refund oracles and manifest denominators stay fail closed.

Required future authored cases: real selection input versus newer decision forecast; null demand with positive aggregate
need; nonpositive/fallback/expired/confidence-missing need; accepted versus rejected selection; boundary-edge and same-tick
ordering; repeated/mixed-generation piles; beneficiary mismatch; one large pulse with an empty later window; fulfilled
need without renewal; changed/cancelled need; snapshot/reader/append loss, late installation, restore/reuse/fast-forward
and overflow with contradictory tail; observed zero and suppressed credit; other income fills need before cohort credit;
income retained despite spending without reopening fulfilled need; successful
throughput with continuous capacity unavailable. Pair positive/negative cases through real native paths at the final gate.

Originally proposed coherent group, now authorized and recorded in the newer checkpoint above;
recommended **GPT-6.1 Sol / high** throughout:

1. **33, selection authority:** capture exact consumed forecast/observation and bind accepted service identities;
   this lets aggregate usefulness be measured without inventing an individual production demand.
2. **34, coverage authority:** capture cohort installation/frontier/loss epochs and actual supported invalidation routes;
   this lets an interval assert what was fully observed. Unsupported predicates remain explicit gaps.
3. **35, interval reports:** implement strict boundary/accounting/window projection and negative specs through existing
   variant reports; this lets oracles distinguish isolated income from retained useful throughput. Continuous capacity
   stays unavailable for predicates lacking complete mutation coverage; no full production closure is implied.

These were three proposed authoring stages; the newer checkpoint above records their authorized diagnostic authoring.
They are not a fixed remaining machinery total or completed useful-service proof. Source-size prerequisites discovered
at an edited owner need their own scoped extraction before hooks.
Use medium again once these actual authority routes are settled. This recommendation reflects cross-authority risk;
[OpenAI Docs](https://developers.openai.com/api/docs/models/gpt-6.1-sol) confirms Sol supports medium/high, not that
this repository requires one setting. Host settings are unchanged.

| Acceptance | Result / evidence | State |
| --- | --- | --- |
| 1. Provenance/scope | Source anchors above; base 31, same branch, unrelated Nx merge preserved | Source reviewed |
| 2. Quantitative need/beneficiary | Actual null-demand/aggregate forecast gap; separate units and selected-input binding | Contract authored; capture open |
| 3. Endpoints/horizon | Ordered real boundaries, half-open effects, fixed fixture horizon and subwindows | Contract authored; oracle open |
| 4. Accounting/loss | Unique transfer, aggregate cap, generation/owner fences, whole-pile policy, explicit coverage | Contract authored; implementation open |
| 5. Continuous predicates | Mutation-complete authority required; pulses and sampled presence insufficient | Contract authored; authority open |
| 6. Existing consumers/negative cases | Mandatory production oracles unchanged; future rejection cases named above | Source reviewed; specs open |
| 7. Publication/resume | Handoff updated with next group/purpose/profile; scoped commit/push and remote check | Authoring boundary only |

**Source Implementation Review:** traced real gathering selection and forecast calculation to admitted service lineage,
native credit/cargo projection, capture's per-player filtering/read boundary and existing PRO oracles. Repaired the
initial design assumption that every gathering command has a selected demand. Aggregate need and individual demand
are now separate; tick emission is explicitly not an end-of-tick seal. No code behavior or existing authority is changed.

**Omission Audit:** acceptance 1–7 represented. Capture/oracle/spec implementation is explicitly next, not claimed here.
No new plan file, unused interface, save/wire/schema/editor/CI/baseline change or skill/tool change. No issue/family closes.

**Separate Final Closure Audit:** rechecked units, beneficiaries, selection-time source, same-tick endpoints, generation
overlap, coverage loss and independent continuous predicates against immediate consumers. The contract is reviewable;
its actual implementation feasibility, bounded cost and executable correctness remain unverified. No tests, formatter,
lint, types/build, source/schema/repository validators, simulation, doctor/context/catalog or diff check ran. Retain every
29–31 and earlier final-gate command below; this docs-only slice adds no executable check or passing evidence.

### Production credit and cargo checkpoints (2026-10-08, unverified)

Authorized group: gatherer prerequisite/contract (29), native cargo/application capture (30), strict report projection (31).
Selected profile last reported Sol 6.1 / medium; actual host settings unknown. All executable validation is deferred.

**Stage 29 — authored/unverified**, base `135c5b1c1cec0f4a8557d52f1511761887f449f5`:

| Acceptance | Implementation / purpose | Evidence |
| --- | --- | --- |
| 1. Separate compliant prerequisite | `GathererTargetSelection`, `GathererResourceExecution`, facade forwarding | Target selection and awaits extracted; only exact obsolete gatherer exemption removed, no refresh |
| 2. Native ownership and ordering | Same facade fields, source/drain/component/save token | Existing source selection, live cargo reads after awaits, subjects, cooldown and credit policy retained |
| 3. Negative/pending cases | `gatherer-resource-execution.spec.ts` | Selected source/arguments retained across await, live cargo subtraction, rejection and cooldown authored/unrun |
| 4. Causal contract | Handoff and owning source responsibilities | Actual balance application separate from emission, native return, cargo origins and task usefulness |
| 5. Publication/resume | Existing handoff/checkpoint | Continue 30 then 31 in the authorized group; scoped commit/push with remote SHA verification |

**Source Implementation Review:** traced existing pawn call sites and resource facade consumers through the two focused
owners. State/serialized fields stay on the facade; owners forward original references and retain native await/callback
order. Comparator formatting retains the same name/rounded-position key. Facade forwarders return owner Promises directly.
Two small owner allocations per gatherer are unmeasured. This is the required prerequisite before touching the old baseline.

**Omission Audit:** acceptance 1–5 authored. No target/price/economy/timer policy or wire/save/CI changes. Existing specs are
registered by normal test discovery. No new plan, unrelated Nx edit, source-baseline refresh or skill/tool change.

**Separate Final Closure Audit:** rechecked callback receiver, live cargo/clock reads, original error propagation, facade API,
serialization and exact owned scope. Tests/format/lint/types/build/source validators/diff check were not run. Publication
closes authoring only; final gate must establish native compatibility and structure compliance.

Deferred command: `pnpm exec nx test probable-waffle-phaser --testPathPatterns='gatherer-resource-execution|pawn-agent-order-boundaries' --runInBand`.
Next 30: explicit transient cargo/credit boundaries let later reports prove exact beneficiary and prior contributors.

**Stage 30 — authored/unverified**, base `00d6f2e77ab566262bd09225bdb945bf71e53210`:

| Acceptance | Implementation / purpose | Evidence |
| --- | --- | --- |
| 1. Explicit execution across awaits | Pawn service forwarding, gatherer execution, `ResourceTransferContext` | Same native Promise; one callee; optional handles are unsaved and unused by native policy |
| 2. Native cargo/offer/restore boundaries | `ResourceServiceObservation`, facade setter/setData and execution | Actual added/reset/removed state, extraction type/amount and pile offered before drain await; restore fences before partial mutation |
| 3. Actual application evidence | `observeResourceCredit`, immediate/drain callers | Exact resource object callback, beneficiary, scoped balances, capped duplicate count/interference and campaign suppression |
| 4. Marked detached capture/cleanup | `AiRuntimeResourceServiceV1`, capture, existing attempt watch | Eight listeners per actor; weak cargo/transfer/attempt IDs cap 8,192; restore/rebinding fences; no additional scene scan/timer |
| 5. Immediate raw consumers | Spatial union and normalizer delegation | Existing production fact collector retains resource records for 31; no save/wire/config/CI registration |
| 6. Boundary cases | New credit/drain/resource-capture specs; extended execution/order-capture/pawn specs | Same arguments/Promise, cross-owner policy, restore/pending/disposal, observer failure, missing/wrong/duplicate/async callbacks authored/unrun |
| 7. Publication/resume | Handoff/checkpoint | Continue report projection within this group; exact scoped commit/push and remote SHA verification |

**Source Implementation Review:** traced pawn -> facade -> extraction/drain -> `emitResource` -> synchronous protocol
listener -> `ProbableWafflePlayer.addResources`. Diagnostics sample the actual scoped balance, not the root collector's
previous event balance. The original sparse payload object is passed once to the emitter; exact callback identity and
one matching callback are necessary for balance application. Nested/unrelated resource events invalidate outer authority.
Listener-free observation performs no balance/channel/restore reads. Native callback/amount/cooldown ordering and campaign
policy stay intact; unmarked drain arguments remain three. The compliant small drain's obsolete exemption is removed
without refresh. Resource capture shares existing actor/controller subscriptions; transfer and emission restore flags are
independent of capture boundary flags. No planner, saved state or gameplay cargo policy consumes this evidence.

**Omission Audit:** acceptance 1–7 authored. Every new type/helper is reached from native callers or marked capture;
negative and pending cases are registered through existing discovery, unrun. Report income/lineage is deliberately next,
not claimed by the raw union. No new plan, unrelated Nx change, baseline refresh or skill/tool change.

**Separate Final Closure Audit:** rechecked native callback receivers/argument timing, diagnostics isolation, subscription
cleanup, ownership across awaits, frozen payloads and exact owned scope. Final source review repaired unmarked drain
argument count and kept emission restore samples separate from capture's boolean boundary. Tests/formatter/lint/types/build,
source/schema/repository validators and diff check were not run; compatibility, performance and source compliance are final-gate obligations.

Deferred command: `pnpm exec nx test probable-waffle-phaser --testPathPatterns='observe-resource-credit|resource-drain-credit|resource-drain-component|gatherer-resource-execution|ai-runtime-resource-service-capture|ai-runtime-route-order-capture|pawn-resource-service-observation|pawn-agent-order-boundaries' --runInBand`.
Next 31: connect exact applied credit and observed whole-pile contributors to admitted tasks without useful-service claims.

**Stage 31 — authored/unverified**, base `67372aa37860d3e921facdb0671055a47b764515`:

| Acceptance | Implementation / purpose | Evidence |
| --- | --- | --- |
| 1. Native entry generation | `ResourceServiceObservation.begin`, execution owner, marked weak execution IDs | Cargo bound before guards/awaits; no ambient later-order attribution, capped at 8,192 |
| 2. Strict supplied evidence | `validateRuntimeResourceService`, `runtimeResourceCreditMatches` | Every supplied tail checked, including suppressed/failed/overflow; finite quantities, full vectors, exact callback claim, immutable cargo/transfer identities and no reused gathering additions |
| 3. Separate actual credit and cargo | `normalizeRuntimeResourceCredits`, `RuntimeResourceCreditV1`, `RuntimeCargoContributionV1` | Actual beneficiary/scoped application independent from native result; whole observed pile and removal retain every earlier contributor, not the latest task |
| 4. Lifecycle and loss | Capture entry/transfer maps and live component reader; report generation/source/target fences | Cargo-only restore invalidates before readers/append; execution cannot rebind to fresh cargo, even when restore projection is lost; replaced live gatherer blocks old ownership |
| 5. Existing reports | `normalizeRuntimeNativeServices`, production causality type/normalizer, existing variant runner | One attempt normalization feeds cargo projection; contradictory resource evidence suppresses existing normalized groups; no oracle/CI/wire/planner registration |
| 6. Cases | New resource fixture/report spec, extended capture/order spec | Multiple contributors, cross-owner/immediate/local-rally, zero, suppression, missing entry/owner/offer/consumption/admission/clock, mixed/partial cargo, restore/reuse, duplicate/identity/result contradictions, cap/lost restore authored/unrun |
| 7. Pause/publication | Existing HANDOFF/checkpoint | Three stages authored; scoped publication, exact remote SHA verification; next unresolved useful-service interval requires Sol/high design |

**Source Implementation Review:** native entry/offer/addition/credit/removal and terminal are joined through explicit weak
handles, never latest order, purchase purpose, nearest tick or amount equality. Report recomputes actual credit from exact
callback count/vector and scoped balances; whole-pile provenance additionally requires earlier native entry, admitted
attempts, uninterrupted generation, matched complete consumption and source/target lifetime fences. Several same-type
contributors retain distinct prior attempts/demands. Unknown amounts/types and partial consumption receive no invented
FIFO allocation. A suppressed credit can consume an attributed pile while appliedAmount stays null. Zero remains zero.
Native immediate return is extraction amount; drain return is offered amount. Resolved contradictions fail closed.

Source review repaired the prerequisite owner initialization for the repository's ES2024 class-field semantics, moved
cargo-restore invalidation before fallible readers/append, latched native execution to its entry cargo generation and checked
the currently registered gatherer component. These repair the unverified 29/30 implementation, not a claimed test failure.
The normalizer's native-service composition keeps the existing parent owner focused and normalizes attempts once. No
native policy, extra await, Promise wrapper, query, timer, scene scan, persisted state or economy repair was introduced.
Legacy attempt-level actual-credit/cargo gaps remain because attempts alone lack that authority; individual resourceCredits
carry the new evidence. Full history, useful fulfillment and continuous stability stay explicit gaps. Bounds are 8,192 raw
facts/weak IDs, 256 normalized cargo/entry/transfer/credit groups and 256 contributors per complete pile; repeated bounded
scans and report serialization cost are unmeasured and require the final gate.

**Omission Audit:** acceptance 1–7 authored with owning consumers/specs. Every new helper/type is consumed; existing
runner retains the full causality object. No AI task fulfillment, continuous coverage or independent PRO oracle is declared.
No schema/save/wire/CI/config/editor/baseline refresh, unrelated Nx edit, new plan or skill/tool change applies. All 29/30
specs remain final-gate obligations after the source repairs; no source-size or performance pass is inferred.

**Separate Final Closure Audit:** after source repairs, rechecked original Promise/error/callback order, native type/amount
argument timing, entry-generation capture before awaits, component/controller/restore/reuse/disposal fences, all supplied
error/overflow tails, strict parent suppression, report consumer and owned Git scope. No Jest/Playwright, formatter, lint,
type/build, schema/source/repository validator, doctor/context/catalog/simulation or diff check ran. This closes authoring
and authorized publication only; final gate must establish executable correctness and native compatibility.

Deferred report command: `pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-resource-credit.spec.ts skirmish-ai-runtime-service-attempt.spec.ts skirmish-ai-runtime-route-order.spec.ts skirmish-ai-runtime-route-caller.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts`.
Retain the 29/30 Jest commands above and all earlier movement/capture/runtime/structure obligations. Current report
fixtures are synthetic boundary evidence, not real match wins or demand usefulness. Three-stage group is authored; pause.
Next recommendation: Sol 6.1 / high for exact continuous useful-resource-service interval/beneficiary/demand units and
coverage contract, then medium for its settled implementation group. Actual host settings remain unknown.

### Production service foundation checkpoints (2026-10-07, unverified)

User-authorized three-stage group: native service-attempt ownership (26), marked detached capture (27), strict report
projection (28). This identifies which worker task invoked gathering/drop-off, not credited cargo or sustained usefulness.
Last selected profile: GPT-6.1 Sol / medium; host settings unknown. Tests/validation remain deferred to the final gate.

**Contract:** retain the action's entry order and actual callee target. Freeze mutable order data before the callee starts;
never reread current order after an await to assign ownership. One transient execution owns start/terminal, with no ambient
async context. Zero is a valid native result. Resolution proves only an attempt result: drains can return full amounts
without credit; immediate credit uses source ownership, drop-off uses drain ownership. Actual application, resource type,
beneficiary, old/mixed cargo, complete history, task usefulness and sustained stability remain gaps. Native policy, saved
state, planner inputs, new scans/queries/timers and baseline refreshes are outside this foundation.

**Stage 26 — authored/unverified**, base `1bfa9740460f0b2a7836ab44ebc0d38c18eb063e`:

| Acceptance | Implementation / purpose | Evidence |
| --- | --- | --- |
| 1. Actual caller/target | `PawnResourceServiceEvent`, `PawnAgentResources.GatherResource/DropOffResources` | Existing order/target references surround the one native callee; native range/admission/retarget policy retained |
| 2. Promise/error identity | `PawnResourceServiceObservation.invoke` | Original Promise forwarded, throw/rejection preserved; listener-free direct forwarding; diagnostic side observation with no added await |
| 3. Bounded lifecycle | `subscribe`, weak board listener set | Eight subscriptions; release removes late terminal recipients; no old call transferred to a fresh listener set |
| 4. Boundary cases | New observer spec and extended pawn order-boundary spec | Same Promise/one call, zero, pending replacement, observer/native failures and disposal authored/unrun |
| 5. Resume/publication | Existing HANDOFF and this checkpoint | Group, next capture action and limitations recorded; scoped commit/push with exact remote verification |

**Source Implementation Review:** traced the pawn methods into unchanged gatherer/drain owners. Gather retains its earlier
order across the range await, then its actual selected target after start admission. Drop-off retains its entry order/target.
The diagnostic closure adds no order/component reads, passes the original receiver/argument and forwards the same Promise.
Native amounts do not affect behavior-tree results. Stage 26 installs the native seam; report consumption follows in 27/28.

**Omission Audit:** acceptance 1–5 have symbols and authored cases. No callee, baseline, save/wire/CI/config or unrelated
Nx change. Existing discovery registers specs. Cargo/application/stability remain explicitly outside attempt ownership.
No new plan or skill/tool change applies.

**Separate Final Closure Audit:** rechecked call sites, Promise forwarding, native errors, disposal and exact staged scope.
Authoring only; no tests, formatter, lint, type/build, validators or diff check ran. Runtime cost/module compatibility/native
behavior remain final-gate evidence. Normal scoped commit/push and exact local/remote SHA verification close publication.

Deferred command: `pnpm exec nx test probable-waffle-phaser --testPathPatterns='pawn-resource-service-observation|pawn-agent-order-boundaries' --runInBand`.
Next: marked capture freezes start data and lifetime boundaries before reporting; stay on the selected Sol profile within
this concrete group, without an intermediate switch.

**Stage 27 — authored/unverified**, base `4b0dd34d029e677a006a1b2dc174b25f35c144b5`:

| Acceptance | Implementation / purpose | Evidence |
| --- | --- | --- |
| 1. Exact detached attempt | New `AiRuntimeServiceAttemptV1` / `AiRuntimeServiceAttemptCapture` | Weak execution IDs capped at 8,192; start-time snapshot reuses native order identity; terminal never resnapshots mutable order |
| 2. Lifetime/source/target boundaries | Capture `watch`, existing order-capture state/token | Existing board restore token and actor/controller subscription lifetime, actual source/target and capture-scene membership sampled independently |
| 3. Existing raw consumer / cleanup | `AiRuntimeProductionSpatialV1`, `AiRuntimeRouteOrderCapture` | Native service subscriber installed/released with existing actor inventory; raw root fact capture includes service records; spatial report delegates kind to the next dedicated validator |
| 4. Pending work cases | Extended order-capture spec | Frozen Gather order across mutation/replacement, restore-invalid terminal and no late append after disposal authored/unrun |
| 5. Resume / publication | HANDOFF/checkpoint | Exact next report contract and limitations, scoped commit/push and remote verification |

**Source Implementation Review:** a started event binds one weak native execution and freezes the already selected order
before the one native callee begins. Terminal reuses that snapshot, even after order/target mutation; actual target boundary
is independently sampled. The existing owner getter detects controller replacement and token invalidation; current-order
replacement alone does not invalidate an earlier attempt. Unwatch/disposal removes listeners and leaves partial history,
never transfers it to a new board. Failed/lost readers cannot retry the native service. Report authority follows in stage 28.

**Omission Audit:** acceptance 1–5 covered by consumed raw types/owners and authored cases. No extra scans/timers/queries,
Promise wrapping, native component policy, save/wire/planner state, baseline refresh or CI/config change. Monetary/cargo
claims remain absent. Existing actor and fact caps bound retained work; callback cost remains unmeasured.

**Separate Final Closure Audit:** rechecked start-time detachment, partial histories, lifetime token getter, subscription
release, union consumers and exact staged scope. All executable checks remain deferred; no issue/family closure. Normal
commit/push and exact local/remote SHA verification close publication. No skill/tool changes apply.

Deferred command: `pnpm exec nx test probable-waffle-phaser --testPathPatterns='ai-runtime-route-order-capture|pawn-resource-service-observation' --runInBand`.
Next: strict service-attempt validation/projection, retaining actual credit/cargo/stability gaps. Continue the selected
profile without pausing within this three-stage group.

**Stage 28 — authored/unverified**, base `77499c4db98e1f28d625ed6a66e465039d0b22a1`:

| Acceptance | Implementation / purpose | Evidence |
| --- | --- | --- |
| 1. Every supplied frozen order and attempt | Shared `validateRuntimeRouteOrders`; new `normalizeRuntimeServiceAttempts` | Full order stamp/source scope, native phase/amount and paired identity inspected, including orphan/failure/overflow tails |
| 2. No lifetime revival | Shared order fence plus dedicated attempt validation | Restore/controller/observed unregister/re-register interval; false lifetime cannot revive or be replaced with a fresh attempt ID for an old admitted order; target reuse separately prevents ownership attribution |
| 3. Independent report meanings | New `RuntimeServiceAttemptV1`, causality `serviceAttempts` field | Paired native result versus admitted task ownership versus dated service demand; native amount never promoted to income or fulfilled demand |
| 4. Explicit unavailable history | Dedicated normalization | Legacy/no-order/no-admission/partial/clock/scene/unready/fenced data remain gaps; 256-attempt overflow drops the entire group; contradictory data suppress existing normalized report groups |
| 5. Meaningful consumed cases | New Playwright service-attempt spec and additional observer bound case | Positive/zero/failure/rally/replacement/missing/fence/revival/target reuse/payload/stamp/overflow cases authored/unrun; existing variant runner retains the new field |
| 6. Group handoff/publication | Existing HANDOFF/checkpoint | All three authoring stages retained, next credit/cargo contract and purpose, final-gate commands and scoped publication |

**Source Implementation Review:** shared frozen-order validation now includes native service samples rather than only
query/movement callers. A single start and at most one terminal retain operation, source/target physical identity and the
entire immutable order. Amount is finite/nonnegative only on resolved; other phases carry null, so zero stays distinct
from rejection or partial work. Order attribution requires a paired terminal, earlier observed admission and available
source/target/clock/lifetime interval. Current-order replacement supplies no alternate task. Observed target reuse prevents
ownership without asserting that the source board token itself expired. Dated service lineage reuses exact command/stamp
and earlier selected demand; local rally or missing demand cannot borrow purchase purpose. Retargeted admission and actual
target versus frozen order remain explicit gaps. `nativeResultAmount` retains callee diagnostics even when ownership is
unavailable; it supplies no resource type, credited player, cargo ledger, applied money, arrival or useful/stable verdict.
Every tail is inspected before a normalized group receives ownership attribution; raw fact-budget loss fails closed.
The observer-bound case uses eight distinct listener functions because subscriptions are stored in a Set; repeating one
function would not exercise the eight-listener limit. This source-review repair is authored and unrun.

**Omission Audit:** acceptance 1–6 have consumed owners and authored positive/control/negative cases. `serviceAttempts`
reaches the existing causality normalizer and variant report without a new fixture-registration or CI route. All service
orders reuse existing stamp/identity checks; source/target/player/scene and full-history gaps remain explicit. Same task
may own multiple attempts; task repetition is not a duplicate service effect. No changes to gameplay/resource policy,
cargo persistence, source-size baseline, save/wire/planner state, timers/scans/queries or unrelated Nx files. Source review
only; report join cost and native observer overhead remain unmeasured. No skill/tool improvement task applies.

**Separate Final Closure Audit:** after source repairs, rechecked union consumers, immutable attempt identity, start-time
admission ordering, source/target fences, native result versus income, global contradiction suppression, overflow tails,
test discovery and exact staged scope. All three foundation stages are authored, not validated; no family/issue closure.
No Jest/Playwright/simulation, formatting/lint/type/build, source-size/schema/editor/repository validator, doctor/context,
catalog or diff check ran. Native/module compatibility, test syntax/flags, performance and real-money/gameplay evidence
remain final-gate obligations. Normal scoped commit/push and exact local/remote SHA verification close publication.

Deferred command: `pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-service-attempt.spec.ts skirmish-ai-runtime-route-order.spec.ts skirmish-ai-runtime-route-caller.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts`.
Retain the stage 26/27 Jest commands above and stage 25 movement cases at the final gate.

**Next and purpose:** define actual emission/application and bounded cargo identities across native gather/drop-off awaits,
mutating Gather/ReturnResources orders, source/drain/player ownership, campaign suppression, mixed/old cargo and restore/reuse.
This lets a useful-service assertion distinguish a returned amount from credited benefit. Existing service attempt identity
supplies the caller boundary, not the cargo origin. Do not add a nearest-time or current-order join to resource money.
Any edit to the baselined gatherer needs a separate compliant prerequisite split; no baseline refresh. Recommend Sol 6.1
high for this cross-owner causal design, then medium for settled implementation. Pause after the three requested stages;
sustained usefulness and full runtime oracles remain open beyond actual-credit evidence.

### Production movement arrival checkpoint (2026-10-07, unverified)

Machinery batch 25, #815/#816 PRO-03/06/07 physical movement evidence.
Base `aa4bf0a4920ba09d2df95045a2cae2a4d543239f`; the containing commit owns this slice.
Integration worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
User-selected setting is GPT-6.1 Sol / medium; host settings are not independently exposed. Nx merge `59f72e037` remains.
The latest request permits related continuous stages and requires a stop when stronger reasoning is warranted.
All executable validation remains deferred to the final gate.

**Purpose:** an executed movement attempt can now be distinguished from a successful navigation query. A worker can
arrive at its selected endpoint, arrive at a congestion fallback, stop early, or return false after a completion callback
fails. Native cancellation still resolves successfully; `returned_true` cannot supply arrival. The report uses detached
physical boundaries and retained order ownership so later service assertions cannot borrow a probe/path result or a
replacement task. Actor-radius endpoints and tending/boarding endpoints are movement destinations, not proof that a
resource/building/transport service was fulfilled.

| Acceptance | Implemented owners / consumers | Evidence state |
| --- | --- | --- |
| 1. Native boundaries without new gameplay authority | `MovementSystem`, `MovementPathExecution`, `MovementTween`, new `MovementCompletionEvent` / `MovementCompletionObservation` | Explicit token passed across awaits/recovery; physical arrival/stop before native callbacks, query throw rethrown, native boolean results and occupancy ordering retained by source review |
| 2. Passive bounded marked capture and cleanup | New `AiRuntimeMovementCapture` / `AiRuntimeMovementV1`, existing `AiRuntimeRouteOrderCapture` | Existing actor inventory/subscription lifetime; weak execution IDs capped at 8,192, eight observers per board, detached caller and endpoint/actual tile snapshots; disposal releases listeners |
| 3. Strict retrospective report | New `RuntimeMovementV1` / `normalizeRuntimeMovement`, existing caller/order validators and causality normalizer | Start/destination/physical/return intervals and identity, immutable original endpoint, sticky fallback, complete supplied caller stamps, source/clock/lifetime fences; contradictory tails suppress normalized groups; 256 execution overflow drops whole movement group |
| 4. Explicit unavailable and separate meanings | Same observer/capture/report owners | Missing context/position/clock/physical callback/return/admission, inactive actors, restore/reuse/controller reset, unordered helpers and partial history stay gaps; physical arrival, caller attribution and native return remain independent |
| 5. Meaningful tests and final-gate policy | New observer Jest and movement Playwright specs; extended native facade/path/tween/order-capture specs | Listener-free/no-context, cancellation true, native throw, fallback recovery, callback error, frozen order replacement, restore/disposal, missing evidence, orphan/probe/endpoint/terminal contradictions and overflow authored/unrun |
| 6. Handoff and authorized publication | Existing HANDOFF and this checkpoint | Current purpose/provenance, continuous execution policy, stronger-reasoning next boundary and exact deferred commands; commit/push and remote verification follow source review |

New files:

- `entity/systems/movement-completion-event.ts` and `movement-completion-observation.ts`: transient physical execution
  boundaries, detached endpoints and a per-execution identity; ordinary listener-free movement creates no token/position read.
- `player/ai-controller/testing/ai-runtime-movement-v1.ts` and `ai-runtime-movement-capture.ts`: marked bounded detached
  records reusing order-capture ownership and fences; no native order/save or planner field.
- `apps/portal-e2e/src/e2e/skirmish-ai-runtime-movement.ts` and `skirmish-ai-runtime-movement-normalization.ts`: report
  records and strict projection consumed by existing production causality/variant reports.
- `movement-completion-observation.spec.ts` and `skirmish-ai-runtime-movement.spec.ts`: passive-boundary and synthetic
  report cases; extended `movement-system-boundary.spec.ts`, `movement-path-execution.spec.ts`, `movement-tween.spec.ts`
  and `ai-runtime-route-order-capture.spec.ts` cover the actual owning boundaries. All remain unrun.

**Source Implementation Review:** traced the location, actor-radius and direct/flying paths plus pawn movement, tending
and boarding callers. A token begins only for explicit marked context, captures the first native endpoint, and follows
the same path arrays and recovery state through waiting/sidestep/repath/fallback. Fallback candidate queries never select
an execution destination; only an executable recovered path does. Empty-path completion observes actual position before
the user completion callback. Tween cancellation observes stop after existing step release and before the native stop
callback; it neither resumes the path nor changes the resolved Promise. A stopped sidestep remains stopped even if native
recovery subsequently proceeds. Callback failure cannot erase already observed physical arrival. Direct movement uses its
existing callbacks and Promise chain. Query errors stay outside the existing movement catch, rethrown by identity; movement
errors retain false returns and native finally cleanup. Boolean observations occur only after destination cleanup returns;
a cleanup error keeps the original rejection and missing-return gap instead of falsely recording a successful return.
Report physical endpoint credit requires a real arrival boundary,
matching selected endpoint/actual tile and available clock/source/lifetime interval; true return alone supplies none.
Order attribution requires an earlier observed admission and frozen caller; a later current order supplies no replacement
identity. Restore/reuse/controller changes fence the entire observed interval. Valid physical endpoint evidence still
supplies no admitted-target fulfillment, credited service, strategic utility or continuous stability.

**Omission Audit:** acceptance 1–6 have consumed symbols and authored cases. Existing report integration retains the new
`movements` field; the spatial normalizer delegates this record kind, and shared caller/order validators inspect every
supplied movement caller, including failed/orphan/overflow tails. Specs use existing Jest/Playwright discovery, requiring
no CI/config/registration edit. No new query, scan, timer, native policy, saved/wire state, tracked-file move, baseline
refresh or unrelated Nx edit exists. Legacy/unmarked calls remain unavailable. Source/refactor/contract audits only;
no tool/skill improvement task applies. Runtime and report cost remain unmeasured, including repeated bounded joins.

**Separate Final Closure Audit:** after source repairs, rechecked token propagation, disposal, original/fallback identity,
current-order independence, report consumption, negative cases and task-owned publication scope. This completes movement
authoring only, not validated behavior or family/issue closure. No formatter, lint, type/build, Jest, Playwright, simulation,
source-size/schema/editor/repository validator, doctor/context/catalog or `git diff --check` ran. Native callback/Promise
compatibility, real Phaser positions, performance, test syntax/module/flags and structural compliance require the final gate.
Normal commit/push and exact local/remote SHA verification close publication; the next session verifies the containing commit.

Deferred final-gate commands (unrun; include adjacent existing boundary tests):

```bash
pnpm exec nx test probable-waffle-phaser --testPathPatterns='movement-completion-observation|movement-system-boundary|movement-path-execution|movement-tween|ai-runtime-route-order-capture|movement-query-observation' --runInBand
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-movement.spec.ts skirmish-ai-runtime-route-caller.spec.ts skirmish-ai-runtime-route-order.spec.ts skirmish-ai-runtime-producer-routes.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

**Next boundary and why stronger reasoning is recommended:** native resource-service usefulness needs exact
service/cargo/application ownership, not another callback-success flag. `PawnAgentResources` mutates the same order from
Gather to ReturnResources and retargets source/drain after awaits. `GathererComponent` accumulates a carried pile and its
immediate-credit branch uses the source owner. `ResourceDrainComponent.returnResources` waits, uses the drain owner,
suppresses credit for campaign economy `granted`/`none`, then always emits its return subject and returns the full amount.
Consequently the return value/subject does not prove income, and the current order or latest movement cannot claim all
old/mixed cargo. Define bounded transient identities, actual resource application, denied/suppressed credit, partial
history and restore/reuse before implementation. `gatherer-component.ts` is source-size baselined; editing it needs a
separate compliant prerequisite split, never a refresh. Recommend **GPT-6.1 Sol / high** for this cross-owner causal design,
then **Sol / medium** for grouped settled implementation. Stop here under the user's effort boundary. Sustained useful
stability follows the service contract and needs its own interval/interruption oracle; no fixed total stage count is claimed.

### Production caller report checkpoint (2026-10-07, unverified)

Machinery batch 24, #815/#816 PRO-03/06/07 report-side caller/order ownership.
Base `fc358946368d3ab595c7fd56bc1f9b7964eebb5d`; the containing commit owns this slice.
Integration worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
User-selected setting remains GPT-6.1 Sol / medium; actual host settings are not independently exposed.
Nx merge `59f72e037` is preserved. All executable validation stays deferred.

**Purpose:** final report assertions can distinguish the order a native query actually serves from a later current order.
A worker whose task is replaced during a pending route still has the original query caller recorded. This prevents a new
same-target task or a unit's purchase demand from supplying the old query's purpose. Attribution means query/order
ownership only: range/reachability probes, rejected/no-path queries and recovery attempts can belong to an order while
supplying no movement success, destination arrival, service benefit or sustained stability.

| Acceptance | Implemented owners / consumers | Evidence state |
| --- | --- | --- |
| 1. Every supplied caller/order | `validateRuntimeRouteOrders`, new `validateRuntimeRouteCallers` | Shared order payload/full stamp/source validation; all failed/orphan/nested/overflow tails inspected; invocation payload/method/stage and paired immutable snapshot checks |
| 2. Lifetime and identity fences | New `runtimeRouteOrderFenced`, caller validator and existing order projection | Same invocation/source/caller/order retained across stages; false lifetime cannot revive; old admitted order cannot revive using a fresh invocation ID after observed reset/reuse |
| 3. Separate report meanings | `RuntimeRouteOrderLineageV1`, `projectRuntimeRouteOrder`, existing route/causality normalizers | Detached caller retained; valid paired/admitted/lifetime-bound query ownership distinct from current-order sample equality; exact earlier rally/service/dated-demand joins reused |
| 4. Explicit unavailable evidence | Same projection/normalizer | Missing/legacy/lost/null boat caller, unobserved admission, missing terminal/clock, restore/reuse, retarget, nested, failed/no-path and full-history/usefulness gaps retained; overflow drops whole route group |
| 5. Contract evidence and handoff | New `skirmish-ai-runtime-route-caller.spec.ts`, existing HANDOFF and this checkpoint | Synthetic positive/replacement/rally/retarget/repath/fallback/missing/fence/revival/orphan/overflow cases authored/unrun; exact scoped commit/push/remote verification |

Changed code under `apps/portal-e2e/src/e2e/`:

- New `skirmish-ai-runtime-route-caller-validation.ts`: capture-wide invocation consistency and loss/fence checks.
- New `skirmish-ai-runtime-route-order-fence.ts`: shared observed actor/controller lifetime interval predicate.
- Updated `skirmish-ai-runtime-route-order-validation.ts`: validate detached caller orders through existing full order contracts.
- Updated `skirmish-ai-runtime-route-order-projection.ts`: prefer explicit caller for task origin; preserve legacy co-observation.
- Updated `skirmish-ai-runtime-route-order-lineage.ts`: detached caller plus narrowly documented boolean attribution.
- New `skirmish-ai-runtime-route-caller.spec.ts`: synthetic consumer cases, registered by existing Playwright test discovery.

**Source Implementation Review:** traced raw `AiRuntimeRouteCallerV1` into the existing producer route validator,
projection, causality normalizer and existing report retention. Request/terminal identity excludes only the lifetime flag;
that flag may fall but cannot revive. Multiple recovery queries retain one invocation, while stage/method compatibility
is checked on each supplied boundary. Frozen caller orders are compared independently from mutable current samples;
a pre-admission frozen snapshot does not become a live regression or gain credit through a later admission. Exact
source/stamp conflicts still fail. Caller order replaces current order only for origin projection, never the separate
current-sample comparison. Native endpoints are not compared with admitted task targets for ownership; retarget differences
remain visible. Current order replacement alone does not erase the original caller. Restore/reuse/controller reset does.
Failed/no-path query ownership can remain true, with mandatory failed-path/arrival/usefulness gaps. Null boat callers
cannot borrow current-order service demand. All report groups already suppressed by route contradictions stay suppressed;
existing raw diagnostic command boundaries retain their existing policy. Report joins are bounded by capture limits but
include repeated scans; cost and correctness require the final gate.

**Omission Audit:** acceptance 1–5 map to concrete consumed owners and authored tests. Every supplied caller is inspected
before normalized credit, including nested missing observations and contradictory tails beyond the 256-identity reporting
limit. Native capture remains unchanged; no new query/timer/scan, gameplay/save/wire/planner field, CI registration,
tracked-file move or source exemption refresh is needed. Existing legacy specs still require false attribution. Direct,
flying and construction paths without this producer caller seam remain unavailable, never inferred from actor/endpoint
similarity. Service and purchase demand remain independent. Complete query/order history and arrival/service/stability
remain open. No skill/tool change was needed.

**Separate Final Closure Audit:** rechecked acceptance, immediate consumer and exact publication scope after source
repairs. This closes caller-report authoring only; it establishes no executable pass or issue/family completion. No Jest,
Playwright, simulation, formatter, lint, type/build, source-size/schema/editor/repository validator, doctor/context/catalog
or `git diff --check` ran. Git scope/provenance/publication inspection only. Test syntax/module/flags, structural compliance,
real gameplay and overhead remain deferred. Normal commit/push plus exact remote SHA verification close publication.

Deferred final-gate command (unrun):

```bash
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-route-caller.spec.ts skirmish-ai-runtime-route-order.spec.ts skirmish-ai-runtime-producer-routes.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

**Next grouped authoring:** native movement completion/arrival with original/fallback/stop/error boundaries, then service
fulfillment and stable usefulness. Inspect `MovementSystem`, `MovementPathExecution`, native callbacks and pawn movement /
tending/boarding owners; capture actual terminal position and retained context passively. A successful probe/path lookup
must never become arrival, and fallback arrival must not claim original task fulfillment. Preserve native callbacks,
Promise/error/occupancy timing and lifetime fences; bounded marked capture and strict report projection follow. Stay on
**GPT-6.1 Sol / medium** because the next slice shares this causal model. Commit/push, verify remote, pause.

### Production invocation capture checkpoint (2026-10-07, unverified)

Machinery batch 23, #815/#816 PRO-03/06/07 native query/order diagnostics.
Base `7096907e46618902a3170a5450af21232cf0ecd2`; the containing commit owns this slice.
Worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
User-selected setting remains GPT-6.1 Sol / medium; host settings are not independently exposed. Nx merge `59f72e037` is retained.
All executable validation remains deferred. This batch authors native capture, not normalized attribution or outcome proof.

**Purpose:** record the actual caller and order used by a query. Current-order samples can change during awaits while
native movement retains an earlier target/order; equal tiles cannot resolve that ambiguity. Explicit contexts now reach
existing marked capture without leaving an ambient scope alive across awaits. The next report consumer uses these records
to identify which task a route serves. Arrival, service benefit and sustained usefulness need later native evidence.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Exact native use sites | `PawnAgentMovement`, `PawnAgentTending`, `PawnAgentBoarding`, `MovementQueryContext` | Actual local order passed; probes/actions distinct; container shore caller passes null without a blackboard read |
| 2. Async execution/recovery propagation | `MovementSystem`, `MovementPathExecution`, `MovementQueryObservation` | Explicit context survives recursion/waits/sidestep/repath/fallback; ambient binding ends synchronously; native calls/awaits/results retained |
| 3. Marked capture lifetime/identity | `AiRuntimeRouteOrderCapture`, `AiRuntimeProducerRouteCapture`, `AiRuntimeRouteCallerV1`, `AiRuntimeProducerRouteV1` | Detached use-site snapshots, 8 subscribers/depth, 8,192 invocation IDs, weak identities and existing 256 subscription lifetimes; restore/reuse/controller fences |
| 4. Characterization and negatives | New observation spec; extended pawn, movement facade/recovery, order capture and producer capture specs | Authored/unrun: original Promise/one call, async/nested/actor isolation, thrown observer/query, orphan copied context, replacement/mutation, restore/reuse/disposal, unordered and overflow |
| 5. Publication/handoff | This checkpoint and HANDOFF | Exact owned paths; normal commit/push and remote SHA verification; pause after publication |
| 6. Strict report attribution/effects | Existing report normalizer | Next dependency: `queryCallerAttributed` remains false; no arrival/service/stability or complete-history credit |

New production adapter files under `libs/games/probable-waffle/phaser/src/lib/`:

- `entity/systems/movement-query-context.ts`: transient actor/blackboard/order/caller contract; separate from gameplay move config.
- `entity/systems/movement-query-observation.ts`: passive subscribers and bounded synchronous native-call binding.
- `player/ai-controller/testing/ai-runtime-route-caller-v1.ts`: detached capture contract with invocation ID, stage and lifetime validity.
- New `entity/systems/movement-query-observation.spec.ts` plus five extended specs named in acceptance 4.
  Existing movement facade/path execution, three pawn owners, order/producer captures and producer-route contract are wired.
  Only these sources/specs and the two existing handoff documents change; no baseline refresh or tracked-file move.

**Source Implementation Review:** traced range/reachability reads, retained MoveToTarget entry order after probe await,
attack-move mutation, tending's spatial tile selection and both passenger/container shore branches. No extra current-order
read, navigation query or gameplay decision is introduced. The optional diagnostic argument forwards separately from native
move config and is never passed into navigation's arguments. All recursive recovery edges retain the context; candidate
probes and routing to a chosen fallback have their own stage. Native receiver/arguments, path array mutation, callbacks,
waits, occupancy/cleanup, query Promise/results/errors remain owned by the existing runtime. Only navigation invocation is
scoped; the outer marked wrapper consumes its binding once before any native call, so nested/reentrant queries cannot
borrow it. Nested undefined calls shadow outer contexts, nesting above eight loses context, and finally restores prior scope.
Listener-free capture returns undefined and invocation with no context/outer binding calls directly. Observer exceptions
are fenced. Capture snapshots the exact OrderData reference without reading current order; weak caller identity rejects
copied/orphan contexts. Existing watch/restore tokens fence old holders, including failed partial restores and replaced
controllers; terminal snapshots retain the original caller/order while reevaluating lifetime validity. IDs saturate and do
not revive on re-registration. Teardown releases both subscribers and caller holders. Tests exercise the native boundaries
with doubles; they do not prove map navigation, actor arrival, usefulness or runtime cost.

**Omission Audit:** acceptance 1–5 have authored implementations and evidence paths; executable evidence is deferred.
Both context and observer have production call sites; the raw caller contract is emitted by existing producer queries.
Other helpers, formation/random selection, direct non-pawn/rally fallback, flying movement without queries and construction
routes cannot borrow a pawn order through this seam. Container shore movement deliberately records null order, never the
first boarder's order. Existing registration/inventory routes install capture listeners; no new scan/listener/timer outside
the bounded board subscriptions exists. Capture begins only after marked installation, so earlier invocations remain missing.
The normalizer still ignores the optional raw caller and grants no attribution; strict validation of supplied/orphan/overflow
records, full command/demand joins and normalized caller authority are acceptance 6's next coherent report batch. No schema,
save/relay, planner, scene/prefab, CI, skill/tool or Nx migration change is required by this native slice.

**Separate Final Closure Audit:** revisited acceptance and immediate consumers after source review and repairs. Native
capture authoring is complete; report authority and production outcome evidence remain open. No test, lint, formatter,
type/build, schema/editor/repository check, source-size validator, simulation, doctor/context or `git diff --check` ran.
Git scope/provenance/publication inspection only. No issue/family or strategic-usefulness gap closes. New files stay focused;
structural compliance and runtime overhead require the final gate. Normal commit/push owns only the listed paths and requires
exact remote SHA verification; publication failure is a blocker. Stay on Sol/medium for strict report consumption because
it shares this causal model. No new plan file or skill/tool change was needed.

Deferred final-gate command (unrun; Nx CLI options remain unverified after the migration):

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='movement-query-observation|movement-system-boundary|movement-path-execution|pawn-agent-order-boundaries|ai-runtime-route-order-capture|ai-runtime-producer-route-capture' --skip-nx-cache
```

Next exact source owners: `apps/portal-e2e/src/e2e/skirmish-ai-runtime-route-order-validation.ts`,
`skirmish-ai-runtime-route-order-projection.ts` and a focused caller validator/projection/spec. Validate all supplied raw
caller records before granting normalized attribution, independently from current-order equality. Missing/legacy/lost,
unordered, restore/reuse/controller replacement, retargeted, failed/orphan/overflow and nested observation cases must stay
explicit. Full service stamp/demand and useful-effect authority cannot be inferred from invocation identity alone.

### Production pawn ownership checkpoint (2026-10-07, unverified)

Machinery batch 22, #821 prerequisite for #815/#816 PRO-03/06/07 caller/order authority.
Base `298c0f2f106aefc0f6d0bf9702bf627f6dfb266a`; the containing commit owns this slice.
Worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
User-selected model/effort: GPT-6.1 Sol / medium; host settings not independently exposed. Nx merge `59f72e037` is retained.
All executable validation remains deferred. This is intended behavior-neutral restructuring, authored/unverified.

**Purpose:** isolate the pawn's actual order-use and route callers before diagnostics bind them to native navigation.
These focused owners let later tests distinguish a route for an assigned task from an unrelated probe. They do not supply
caller attribution, arrival, service benefit or sustained usefulness themselves.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Preserve tree API and lifecycle | `PlayerPawnAiControllerAgent`, unchanged `PawnAiController` and MDSL consumers | Same exported token/constructor/public methods, Stop arrow and shutdown callback; source-reviewed, unverified |
| 2. Preserve native reads, calls and async boundaries | Nine `PawnAgent*` owners, shared real blackboard/components | Original bodies extracted; cross-owner/public callbacks route through facade; no extra query/timer/listener/scan/state |
| 3. Genuine responsibility split | Agent facade and focused owners; source baseline | Exact old agent exemption removed; no replacement exemption or baseline refresh; structural checks deferred |
| 4. Meaningful characterization | `pawn-agent-order-boundaries.spec.ts`, `pawn-agent-terminal-boundaries.spec.ts` | Authored/unrun: async order replacement, denied/rejected probe, original gather order, boarding cleanup, terminal stamp/order and shutdown deduplication |
| 5. Handoff/publication | This checkpoint and HANDOFF | Source audits below; normal exact-path commit/push with remote SHA verification; pause after publication |
| 6. Causal attribution/effects | Existing capture/report and new precise route sites | Open; `queryCallerAttributed` remains false, arrival/service/stability authority absent |

Changed files under `libs/games/probable-waffle/phaser/src/lib/prefabs/ai-agents/`:

- `player-pawn-ai-controller.agent.ts`: forwarding behavior-tree entry point; collaborators are created without native reads.
- `pawn-agent-movement.ts`: range and reachability probes, actor/location movement and native random Move admission.
- `pawn-agent-orders.ts`: queue selection, exact Stop cleanup and persisted terminal/shutdown reporting.
- `pawn-agent-combat.ts`: attacks/healing, retaliation and shared deterministic attackable-visible-enemy selection.
- `pawn-agent-resources.ts`: acquisition, gathering, return and mutable Gather/ReturnResources transitions.
- `pawn-agent-construction.ts`: construction/repair admission and next-site Build orders.
- `pawn-agent-tending.ts`: crop assignments, native tile movement/animations and post-build Gather admission.
- `pawn-agent-boarding.ts`: land/shore rendezvous, boarding requests and passenger/container loading.
- `pawn-agent-spells.ts`: native autocast targeting/shared spell dispatch; no unnecessary blackboard retention.
- `pawn-agent-status.ts`: live health/status/cooldown and target predicates.
- Two boundary specs named above. Outside that directory, only the exact obsolete baseline entry and these two handoff
  documents change. No meaningful tracked-file rename occurred; the existing tree entry point remains in place.

**Source Implementation Review:** traced all original methods to the facade and extracted native bodies, the sole
controller construction/cancellation/shutdown consumer and existing interface. No subclasses or private-method consumers
were found in the owning source. Public intra-agent calls retain facade dispatch; private target selection stays owned by
combat and is shared with movement through a callback. Native action component/system/service receivers and arguments,
await/catch boundaries, order references and mutable targets remain unchanged. Selection performs no eager component/
scene reads. Owners create no subscriptions/timers and persist nothing. Shutdown still deduplicates stamped command IDs.
Stop still cleans assignments/attack, resets, reports, animates, cancels movement and pops in native order. Source review
repaired missing test execution-stamp fields and narrowed mock signatures; `SelfIsAlive` callbacks use type-only facade
contracts so the separately baselined existing interface does not need an unrelated rewrite; these were not executed test failures.

**Omission Audit:** acceptance 1–5 have source implementations and authored evidence; validation is explicitly deferred.
All nine owners are constructed/used by the registered tree entry point. The unchanged interface and its consumers were inspected; no save,
wire, planner, capture/report, scene registration, generated prefab, CI or Nx migration change is needed. Existing native
quirks remain, including non-awaited resource reacquisition, placeholder `NoEnemiesVisible`/high-value gathering behavior,
shore failure/throw cleanup distinctions and order changes during awaits. Nine collaborator allocations per pawn agent
remain unmeasured. Acceptance 6 is the next dependency, not completion claimed by this split.

**Separate Final Closure Audit:** revisited the numbered acceptance map after source repairs and consumer inspection.
Authored prerequisite scope is complete; runtime correctness and source-structure compliance require the final gate.
No test, lint, type/build, schema/editor/repository validation, source-size checker, simulation, doctor/context or
`git diff --check` ran. No issue/family, production oracle or useful-effect gap is closed. Git publication owns only the
listed paths, uses normal push and requires exact remote SHA verification; publication failure remains a blocker.
No skill/tool changes or new plan files were needed.

Deferred final-gate command (unrun; Nx CLI arguments remain unverified after the unrelated migration):

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='pawn-agent-order-boundaries|pawn-agent-terminal-boundaries|player-pawn-order-terminal-outcome|pawn-order-observation|movement-system-boundary|ai-runtime-producer-route-capture' --skip-nx-cache
```

**Next authoring acceptance:** bind exact native order-use/caller identity at the focused movement/tending/boarding
invocations and carry it through movement recovery and marked capture/report. Distinguish movement from range/reachability
probes, stale entry orders from later reads, direct/flying/unordered boarding, failed/orphan/lost histories and restore/
reuse. Never infer causality from current-order samples, target equality or ambient scope across awaits; add no native
query/timer/scan. Keep actual arrival/service effects and continuous benefit open. Stay on Sol / medium for this related
causal group; recommend high only for a concrete unresolved reasoning problem. Commit/push and pause at its next coherent
boundary, with all executable evidence deferred.

### Production movement ownership checkpoint (2026-10-07, unverified)

Machinery batch 21, #821 prerequisite for #815/#816 PRO-03/06/07 query-caller authority.
Base `ef33516103f40f7cbb0d7ca72092332d31a663d2`; worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
The containing commit owns this slice. Nx merge `59f72e037` is preserved; actual model/effort is unavailable.
All executable validation remains at the final gate. This is authored restructuring, not verified movement correctness.

**Purpose:** isolate the native movement responsibilities before adding caller/order diagnostics. Later records need
actual invocation sites and recovery calls to distinguish a range/reachability probe from movement. Smaller owners
make those seams reviewable without extending a content-hash-exempt monolith. No caller attribution is claimed here.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Preserve actor-system identity and public API | `MovementSystem`, existing pawn agent/RallyPoint/random-movement consumers | Same class token, constructor subscription/readiness/kill order, method/export signatures and async route boundaries reviewed; facade spec authored/unrun |
| 2. Separate concrete movement responsibilities | `MovementRuntime`, `MovementFormation`, `MovementPathExecution`, `MovementTween`, `MovementPresentation` | Facade instantiates and calls every owner; lazy dependencies/ready reads, mutable paths, timing and presentation reviewed; no new query/scan/timer |
| 3. Keep native admission/recovery/lifecycle behavior | Shared MOVE callback, path executor, tween and occupancy service | Full command context, queue/override and application outcome, bounded wait/sidestep/repath/fallback, step/destination cleanup and errors reviewed; four specs authored/unrun |
| 4. Retire obsolete size exemption without refresh | Exact MovementSystem entry removed from source-structure baseline; small recovery/error contracts | Genuine responsibility split; no other baseline changed; executable format/type/size/lint enforcement deferred |
| 5. Source audits, handoff and publication | This checkpoint and HANDOFF | Source-only review/audits below; task-only normal commit/push and exact remote verification close publication, then pause |
| 6. Next causal/effect work | Oversized pawn agent prerequisite, actual caller/order seam, existing marked capture/report | Open; `queryCallerAttributed` remains false, and arrival/service/stable-usefulness authority is still absent |

Changed native files under `libs/games/probable-waffle/phaser/src/lib/entity/systems/`:

- `movement.system.ts` retains shared command admission, public route selection/probes, random-movement and direction exports.
- `movement-runtime.ts` retains ready-time component/service reads and original lazy navigation/occupancy caching.
- `movement-formation.ts` owns connected same-height slot selection, native reachability and destination reservations.
- `movement-path-execution.ts` owns mutable path recursion and bounded congestion recovery, including native repath queries.
- `movement-tween.ts` owns tile/direct movement, step reservations, interpolation, active cancellation and scene listeners.
- `movement-presentation.ts` owns order/movement sounds, direction updates and order animations.
- `blocked-step-recovery-state.ts` and `movement-step-blocked-error.ts` retain the same recursive state/error identity.
- `movement-test-fixture.ts` supplies shared boundary doubles; `movement-system-boundary.spec.ts`,
  `movement-path-execution.spec.ts`, `movement-tween.spec.ts` and `movement-formation.spec.ts` are authored/unrun.

The public system token stays registered through the existing actor setup; no consumer import migration is needed.
New collaborators allocate actor-local owners before the original subscription/readiness/kill registration, with no
component or scene lookup in those constructors. Ready reads retain their original order. Missing lazy services retry;
the first available instance remains cached. No diagnostic registry, planner input, saved/wire field or listener is added.
Allocation/runtime cost is unmeasured and remains a final-gate concern.

Static and actor-target routing retain their existing async functions and native query receiver/arguments/results/errors.
Queries still return the native mutable path arrays: initial current-tile removal and recursive consumption stay in place.
Flying movement bypasses navigation paths and uses the original direct duration/distance behavior. Range probes do not
execute a path. Shared MOVE still releases its destination, awaits native formation, then enqueues/overrides a stamped
OrderData and reports per-actor application; non-pawn movement still reports completion/failure after movement.

Recovery retains two active-step waits at 120 scene milliseconds, two sidesteps, two direct repath escalations, two wait
retries per repath and six-ring fallback search. The native candidate ranking, lexicographic actor-ID formation ordering,
96-cell connected search, height/footprint tests and destination-excluding dynamic blockers are unchanged. Step and
fallback reservations retain their native ordering. UPDATE/SHUTDOWN, interpolated simulation clock, leading throttle,
status/campaign speed modifiers, visual RNG, callback sequencing and rejection/cancellation behavior are retained.
Existing async cancellation/callback/cache/throttle defects are not repaired or declared correct by this split.

**Source Implementation Review (source only):** traced constructor -> shared MOVE -> formation -> native queue/outcome,
pawn/RallyPoint public movement -> native navigation -> mutable path -> recovery -> reserved step/tween -> callbacks,
instant position -> cached translator, and kill/cancel/shutdown cleanup. Reviewed receiver/argument order, original async
boundaries, live versus ready-time component reads, direct flight, null/empty/error paths, default recovery-state lifetime,
same-height fallback ranking and recursive path mutation. Repaired extraction boundary braces/comments/constants,
fixture dynamic-blocker types and missing-reservation test setup during source review; these were not executed failures.

**Omission Audit (source only):** every extracted owner has a native facade/owner caller. Existing public symbols,
actor-system token, constructor callbacks and helper exports remain present. Four specs cover native mutable path
consumption, null/empty/query-versus-execution errors, flying bypass/probes, full stamped queue/override application,
readiness/kill cleanup, bounded waits/repath, ranked fallback reservation, arbitrary error propagation, onStop behavior,
interpolation/paused time, delayed completion, cancellation/shutdown, speed/distance and failed reservation/setup.
Shared doubles supply no world/pathfinder/useful-effect evidence. The tracked facade remains in place, so this is an
extraction rather than a tracked-file move. No unrelated Nx, CI, schema, generated editor or fixture/oracle policy changed.
No new execution plan or reusable skill/tool change was needed. Executable checks remain explicitly deferred.

**Separate Final Closure Audit (source only):** the movement prerequisite slice maps to concrete runtime consumers and
authored characterization tests. The obsolete exemption is removed once, never refreshed. Source review supports authored
publication only; no tests, E2E, simulations, formatting, lint, type/build, source-size, schema/editor/repository checks or
doctor/context/catalog commands ran. Caller identity, arrival/service effects, continuous usefulness, full production
adapter, independent PRO-03/06/07 oracles/denominators, paired setup/legal research and strategy remain open. Publication
requires exact task-owned staging, normal commit/push and matching remote SHA, followed by the agreed pause.

**Deferred focused commands (unrun; append to the existing final gate):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='movement-system-boundary|movement-path-execution|movement-tween|movement-formation|ai-runtime-producer-route-capture|ai-runtime-production-spatial-capture|pawn-order-observation|observe-production-rally-action' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-route-order.spec.ts skirmish-ai-runtime-producer-routes.spec.ts skirmish-ai-runtime-production-spatial-normalization.spec.ts
```

Review flags/module mocking after the Nx/Phaser migration at that gate. Tween specs use a local arithmetic/event double;
the shared Phaser mock is unchanged. Full runtime, lifecycle, multiplayer parity, source structure and allocation cost
remain unverified. The current pawn agent still has its original content-hash exemption and was not edited here.

**Next exact authoring — what it is for:** split the oversized pawn agent by its real responsibilities without refreshing
its exemption, so actual order reads and range/reachability/movement invocations can accept a diagnostic seam. Then carry
that exact caller identity through native route/recovery requests into existing marked capture/reports; never infer it
from equal targets, current-order samples or an async scope spanning an await. This will let later oracles check which
assigned task a movement serves before checking actual arrival/service effects and stable usefulness. Retain
**GPT-6.1 Sol / high** for the grouped caller/effect work; causal authority remains unresolved. OpenAI Docs was searched
and opened for the recommendation: [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
Recommendation only; no model switch, issue closure or percentage claim. Commit/push, verify remote, pause.

### Production order and service demand checkpoint (2026-10-07, unverified)

Machinery batch 20, #815/#816 PRO-03/06/07 authority. Base `d1600887f09bb99df16e334a70abebba8ff3b6bf`;
worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
The containing commit owns this revision. Nx merge `59f72e037` is preserved; actual model/effort is unavailable.
All executable verification remains at the final gate. No production family, issue or runtime result is complete.

**Purpose:** these records distinguish the task assigned to a unit from the demand that purchased it. Later runtime
oracles need this distinction to check useful work, rather than count a purchase or a route as task fulfillment.
The new native admission/service-demand association is authored; actual query-caller attribution still needs its seam.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Actual enqueue and rally scope | `PawnAiBlackboard`, `PawnOrderObservation`, `observeProductionRallyAction`, shared spawner | Native argument identity, successful admission, single-order synchronous origin and native error/result preservation reviewed; two Jest specs authored/unrun |
| 2. Bounded marked capture/lifetime | `AiRuntimeRouteOrderCapture`, root/spatial/producer captures, `AiRuntimeRouteOrderV1` | Existing inventory only; exact weak order identities, initial/missing admissions, restore/reuse/disposal and two-boundary samples; Jest plus expanded capture spec unrun |
| 3. Exact shared service/dated demand | Service command/request/admission helpers, service lineage, shared stamped lifecycle validator | Full payload/eight stamp fields/ordered context, native per-actor outcomes, accepted request, selected result and dated demand; synthetic Playwright unrun |
| 4. Fail-closed report consumption | Order validator/projection, producer routes and existing causality/variant serializer | Orphan/failed/unqueried/overflow-tail validation, 256-order whole-group loss, separate purchase/service lineage; report specs unrun |
| 5. Native query-caller and useful effect | `orderLineage.queryCallerAttributed: false`, mandatory caller/history/effect gaps | Explicitly open for next batch; current-order overlap is not invocation authority, arrival or continuous useful stability |
| 6. Reviews/publication/handoff | This checkpoint, HANDOFF and exact task-owned staging | Source-only audits below; normal commit/push/exact remote verification closes only this authored slice, then pause |

Native files under `libs/games/probable-waffle/phaser/src/lib/`:

- `prefabs/ai-agents/pawn-order-observation.ts` and adjacent spec; `pawn-ai-blackboard.ts` has the successful-enqueue seam.
- `entity/components/production/observe-production-rally-action.ts` and adjacent spec; `production-spawner.ts` scopes only
  its already-selected actor/tile action. Fallback movement stays untouched and supplies no fabricated order.

Marked files under `player/ai-controller/testing/`:

- `ai-runtime-route-order-v1.ts`, `ai-runtime-route-order-capture.ts` and adjacent spec.
- Existing `ai-runtime-producer-route-v1.ts`, producer capture/spec, root production capture and spatial capture consumers.

Report files under `apps/portal-e2e/src/e2e/`:

- `skirmish-ai-runtime-route-order-lineage.ts`, order validation/projection, service command/lineage/outcome helpers,
  `skirmish-ai-runtime-route-order-fixture.ts` and `skirmish-ai-runtime-route-order.spec.ts`.
- Existing producer route normalizer/contract, spatial kind router and shared production command lineage validator.
  The validator's optional request/equality owners retain the exact old queue/construction defaults.

`PawnOrderObservation` is a local weak diagnostic registry, with eight observers/scoped nesting and terminal depth loss
inside an exhausted scope. Enqueue observers see the exact admitted `OrderData` after the native queue mutation. Rally
origin is emitted at scope exit only when that exact synchronous native action admits one order; a cancellation callback
admitting another order makes origin ambiguous. A native action can throw after admitting an order; the admission remains
an observation, never a successful-action or useful-effect verdict. Listener-free rally calls add no controller reads.
No listener errors replace native return/Promise/errors, queue shape, cancellation order, planner state or save/wire data.

The marked capture subscribes through the existing root inventory/registration/tick attachment; it adds no actor scan,
new tick listener, path query or timer. A maximum of 256 actor lifetimes acquire subscriptions; order IDs saturate at
8,192. Weak identity includes actual actor/controller lifetime and an opaque restore token. Attempts to `setData` fence before mutation,
including partial/failing attempts; unregister/re-register cannot revive an earlier identity even for the same object.
A changed controller/blackboard is fenced when observed, with a separate reset reason; its replacement time is not inferred.
Wrapper installation failures unsubscribe, and disposal preserves the original method descriptor and any later owner.
Actual current-order samples are detached at request/terminal, with missing controller/oversized context/reader loss
unavailable. Disposal releases subscriptions/maps and restores only owned wrappers. Original query Promise/result/args
and the one native invocation remain unchanged. Capture volume and runtime/report cost are unmeasured final-gate risks.

Reports retain admission separately from local rally association and stamped service scope. An exact observed admission
must match the full shared service payload/context, delivery, request/receipt, admission outcome and selected decision.
A future receipt cannot fill an already-resolved query. Mutable orders may retarget; the original admission remains the
basis for command matching while retargeting has a gap. Native service application/terminal reports retain their sorted
actor subsets: different addressed pawns may apply/reject independently, while duplicate actor effects fail closed.
The command and order context retain their entire ordered actor list; another pawn's application cannot fill this one's gap. Construction-owned commands remain with existing construction
lineage, not a service failure. Missing/legacy/non-AI authority stays unavailable. The actual matching selected demand
row is dated by its decision sequence/tick, never borrowed from a later snapshot or an output's original purchase scope.
A missing demand row/selection is a gap; duplicate or malformed supplied rows fail. Demands/claims/actor arrays are bounded.

Validation inspects every raw order/current/rally observation, including unpaired failed terminals and unqueried tails.
Native payload/stamp/actor contradictions, identity reuse, duplicate admissions, orphan/rally-output reuse, invalid
selected intent/demand or overflow-tail corruption suppress all normalized authority groups. More than 256 distinct
observed orders discard the complete producer route group. Equal current-order samples mean only those two samples
agree; `queryCallerAttributed` stays false, with complete order history and useful-effect gaps always present.

**Source Implementation Review (source only):** traced root inventory -> native successful enqueue -> marked weak identity,
spawner selected action -> single-order scoped origin -> output identity, and wrapped native query -> both detached order
samples -> exact admission/shared dispatch/selected demand -> existing variant report. Reviewed queue replacement ordering,
observer throws, original action/Promise/error, multi-order cancellation ambiguity, nesting/counter limits, missing actor
components, mutable targeting, failed restore, object reuse and wrapper/disposal ownership. Repaired stale-lifetime revival,
construction-command misclassification, per-actor service outcome semantics, unqueried admission omissions, controller
replacement/failed wrapper subscription cleanup and exhausted nested-scope revival during review.

**Omission Audit (source only):** all new owners have native callers or marked-report consumers, with four new specs and
one expanded spec covering actual reference/Promise identity, listener-free branches, ambiguity/depth loss, restoration,
missing admission/selection/demand/current/receipt/delivery, retargeting, future receipt, reused/orphan/full-stamp/payload
claims, native multi-pawn application scopes, identity saturation, failed restore/installation, method descriptors,
controller replacement and order overflow/tails. No game/save/wire/AI input, new scan/query/timer, fixture/oracle weakening, schema/editor
or baseline refresh, CI change or unrelated Nx file is included. Exact query-caller attribution, movement arrival/effects,
continuous usefulness and broader adapter/oracles remain explicitly open; no executable validation ran.

**Separate Final Closure Audit (source only):** the bounded admission/rally/service-demand authoring slice has concrete
owners and report consumers. Its runtime/type/format/size/schema/editor/build/test evidence remains deferred. The native
query-caller acceptance is intentionally unfinished, not relabeled as proven by co-observation. Normal task-only commit/
push/remote verification closes publication of the authored slice, then pause. Next grouped **GPT-6.1 Sol / high**: native
order/query caller identity, then actual arrival/service terminal and continuous usefulness. Editing the oversized pawn
agent/movement owners requires a behavior-neutral prerequisite split; do not refresh their exemptions. Full production
adapter/independent denominators/oracles, paired setup/legal research and strategic cancellation/transitions remain open.
No reusable skill/tool change is warranted by this slice; existing routing and the user's reporting-purpose policy apply.

**Deferred focused commands (unrun; append to the existing final gate):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='pawn-order-observation|observe-production-rally-action|ai-runtime-route-order-capture|ai-runtime-producer-route-capture|ai-runtime-production-capture|production-spatial-spawn' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-route-order.spec.ts skirmish-ai-runtime-producer-routes.spec.ts skirmish-ai-runtime-production-spatial-normalization.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

### Production native navigation checkpoint (2026-10-07, unverified)

Machinery batch 19, #815/#816 PRO-03/06/07 authority; prerequisite #821 split is in `024c6a75d`.
Base `024c6a75d0d756afcae57be0b8ab250676ad3ce7`, worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`,
branch `feature/759-skirmish-ai`; containing commit owns this revision. Nx merge `59f72e037` is preserved.
Actual model/effort is unavailable. No family/issue is complete; all executable validation remains at the final gate.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Actual native milestones | `NavigationProvenance`, `NavigationNativeBoundary`, `NavigationService`, ground/water owners | Completed configuration/clear/rebuild and partial/reentrant failure source paths reviewed; native/facade Jest authored/unrun |
| 2. Native query/cache entry lineage | `NavigationNativeQuery`, actual ground/water lookup and callback sites | Static hit/miss, request-time TTL, original insertion generation, uncached overlays and water fallback retained; native Jest unrun |
| 3. Bounded caller capture/disposal | `AiRuntimeNativeQueryObservation`, shared navigation observation, marked builder/producer captures | Exact synchronous native lookup; 256 pending holders, ambiguous/missing legacy loss, original Promise/errors and disposal reviewed; Jest unrun |
| 4. Strict normalization/report consumption | Native validator/projection, shared spatial stream, producer normalizer and existing causality/variant reports | Failed/orphan/tail payload checks, milestone/TTL/engine/conflicting identity rejection and separate generation diagnostics; synthetic Playwright unrun |
| 5. Reviews, omissions and handoff | Three new specs, three expanded specs, this checkpoint and HANDOFF | Source-only audits below; exact staging, normal commit/push/remote verification and pause required |

Native contracts/implementation are under `libs/games/probable-waffle/phaser/src/lib/world/services/`:
`navigation-native-boundary.ts`, `navigation-native-query.ts`, `navigation-provenance.ts`, the facade and existing ground/
water owners. Native counters are scene-local diagnostics, not authority commands, deterministic planner inputs or saved
state. Query/rebuild/configuration/clear counters saturate at 8,192; loss remains null for the service lifetime. Observer
scopes cap at eight synchronous nested callers. Native caches remain at their existing cleanup thresholds; records hold
constant-size detached tiles/milestones, never actor/scene references or copied paths, and entry lineage is flattened.

Rebuild milestones retain the actual setup -> distance invalidation -> ground clear -> water clear sequence. A successful
inner rebuild leaves its outer invocation pending. Failed setup/cache clear releases the invocation depth while retaining
the partial-rebuild flag; a later complete rebuild can recover. Water setup still configures its original grid/costs and
clears its own cache directly. Water configuration does not advance on ordinary ground object rebuilds. Shutdown still
clears only ground, without pretending it rebuilt topology. The existing 100-ms throttle/disposal defects are not fixed.

The native cache request timestamp remains the already-sampled `performance.now()` value; no additional clock read was
added. Callback insertion stores the exact query request and completed milestone. An old pending callback can still refill
a cleared cache, including after a completed rebuild; a later hit retains the older origin, not the lookup generation.
Null, empty and mutable original arrays, debug order, TTL thresholds, native rejections/throws and EasyStar calculate order
remain unchanged. Ground occupancy overlays use a fresh engine and record `bypass` with no cache wall-time sample. Dynamic
water queries still use water's native static cache; diagnostics do not manufacture ground overlays or extra queries.

Marked captures observe only synchronous native lookups from the actual wrapped caller. They return the same native
Promise, invoke its receiver/arguments once, and detach query completion only at the outer terminal. No query means no
native record, including early returns. Multiple lookups/nested ambiguity, legacy methods, reader/counter loss or pending
holder capacity leave an explicit normalized gap. The shared observer caps pending holders at 256 and clears them on
root capture disposal; every completion/error releases its holder. Builder diagnostic reads/append are fenced from the
native invocation, repairing the prior diagnostic-error interference seam. Neither capture adds a timer or actor scan.

`apps/portal-e2e/src/e2e/skirmish-ai-runtime-native-navigation-validation.ts` validates native payloads before pairing,
including failed/orphan/overflow tails. Counter bounds, monotonic milestones, terminal loss revival, pending rebuilds,
completed-versus-configuration/clear consistency, exact cache TTL, original entry identity/time/insertion lineage and
engine/method compatibility fail closed. Spatial normalization checks one service stream across both caller kinds and
retains prior native milestones through legacy omission. Shared native query IDs may appear in identical nested caller
scopes; conflicting schema-only fingerprints fail all groups. Producer group overflow still discards the whole group.

The native projection is consumed by both `RuntimeProductionSpatialAuthorityV1.paths[].nativeNavigation` and
`RuntimeProducerRoutesV1.paths[].nativeNavigation`; the existing causality normalizer/variant runner already serializes
those groups, with no new registration. It separates `completedRebuildInterval` (`same_completed`, `changed`, `unavailable`)
from `queryGenerationAtTerminal` (`same_native_generation`, `changed`, `unavailable`) and `cacheLineage`
(`same_requested_generation`, `older_request_generation`, `uncached_overlay`, `unavailable`) and retains
the exact native lookup. Equal generation is not immutable result, complete query/topology history or useful arrival
proof. Static cache mutation/history remains a mandatory gap; actor movement/restoration, target endpoint selection,
service/rally command identity, demand usefulness and continuous stability keep their independent contracts.

**Implementation Review / Omission Audit (source only):** acceptance 1–5 traced actual facade initialization/rebuild/
shutdown, ground and water hit/miss/insertion/overlay paths, object/terrain routing, marked capture installation/nesting/
disposal, strict validation, both report consumers, root failure suppression and existing variant serialization. Repairs
preserve direct water cache clear (no new public interception boundary), isolate diagnostic failures from native calls,
release failed/reentrant rebuild ownership, keep native loss terminal, validate all query tails and preserve history
through legacy omitted fields. New owners retain one substantive contract each; no source baseline was refreshed.
No editor/GUI/package/config/save/wire migration or scenario registration applies. No skill/tool improvement was needed.

Authored/unrun evidence: `navigation-provenance.spec.ts` characterizes partial/reentrant rebuilds, actual clears,
ground/water old callback refill, request-time exact TTL, shared array mutation, static/overlay query identity, observer/
native errors and bounded terminal loss. `ai-runtime-native-query-observation.spec.ts` covers Promise identity, terminal
copy, ambiguity/missing query, 256 pending holders, capacity recovery, disposal and terminal native reader loss. Existing
builder/producer capture specs add actual scoped native record consumption; facade spec adds completion ordering.
`skirmish-ai-runtime-native-navigation.spec.ts` covers builder and producer report consumption, old request/insertion
lineage, water fallback/overlay, partial/missing/exhausted history, malformed TTL/counters/engine/IDs, native failure,
conflicting identity and root fail-closed output. All are synthetic/native-boundary characterizations; actual topology,
Phaser movement, useful effects, performance and merged Nx/Phaser mock compatibility remain final-gate evidence.

**Separate Final Closure Audit (source only):** after repairs, every authoring acceptance has concrete owners, consumers
and explicit deferred evidence. Scope contains only native navigation/capture/report owners/specs and the two handoff
documents. Formatting, source-size enforcement, lint, types, builds, schema/editor/repository checks, Jest, Playwright
and simulations remain unrun. Normal commit/push/exact remote verification closes only this authored slice; pause after
publication. Next grouped **GPT-6.1 Sol / high**: exact service/rally command identity and dated useful demand, followed by
native arrival/service effects and continuous useful stability. Full production adapter/oracles/denominators, paired
setup/legal research, strategic cancellation/transitions and #823 generation/disposal repair remain open.

**Deferred focused commands (unrun; append to the existing final gate):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='navigation-provenance|ground-navigation-pathfinder|navigation-service-boundary|ai-runtime-native-query-observation|ai-runtime-navigation-observation|ai-runtime-producer-route-capture|ai-runtime-production-spatial-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-native-navigation.spec.ts skirmish-ai-runtime-navigation-boundary.spec.ts skirmish-ai-runtime-producer-routes.spec.ts skirmish-ai-runtime-production-spatial-normalization.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

### Production navigation owner checkpoint (2026-10-06, unverified)

Machinery batch 18, #821 prerequisite for #815/#816 PRO-03/06/07 native navigation provenance.
Base `b6d396348d19bf46d95714533bb0f49c8e6f05f4`, worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`,
branch `feature/759-skirmish-ai`; containing commit owns this revision. Nx merge `59f72e037` is preserved.
Actual model/effort is unavailable. No family/issue is complete; all executable validation remains at the final gate.

The selected navigation owner was still an oversized content-hash exemption. The repo task-tracking rule requires a
separate behavior-neutral prerequisite before new behavior in that owner. This batch authors that prerequisite;
native query/cache/completed-rebuild provenance is the next acceptance boundary, not an outcome of this extraction.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Public compatibility and scene ownership | `NavigationService`, `navigation-terrain-type.ts`, existing movement/AI/production callers | Service token, exports, signatures, subscription receiver and direct Promise forwarding preserved by source review; facade Jest unrun |
| 2. Native graph and query/cache responsibilities | `NavigationHeightGraph`, `GroundNavigationPathfinder`, existing `WaterNavigationHelper` | Exact graph reference, direction ordering, cache TTL/result references and uncached overlays preserved; graph/cache Jest unrun |
| 3. Grid, candidate and object-route responsibilities | `NavigationObjectGrid`, `NavigationTileSelection`, `NavigationObjectRoutes` | Collider/navigable priority, RNG progression, distance/y/x ties, target footprint and terrain routing retained; selection/facade Jest unrun |
| 4. Maintainable source and caller wiring | Six responsibility files, facade composition, exact source-baseline entry removal | No refreshed hash, source-size command or new registration/config/save field; enforcement remains deferred |
| 5. Review, omissions, closure and publication | Four specs, `NavigationPathfinderDouble`, handoff and this packet | Source-only audits below; exact staging, normal commit/push/remote verification and pause required |

Production sources are under `libs/games/probable-waffle/phaser/src/lib/world/services/`:

- `navigation-height-graph.ts`: owns the built graph/cells, debug conditions, directed traversal, sorted bounded
  connected-component walk and static versus overlay EasyStar direction configuration. Its snapshot getter returns the
  existing reference. A new reference is not yet a captured completed-rebuild revision.
- `ground-navigation-pathfinder.ts`: owns the existing persistent EasyStar instance and ground cache. Native cache
  keys, request-time wall-clock TTL of 1,000 ms, cleanup threshold, null/empty results, mutable result-array identity and
  debug callback order remain unchanged. Dynamic occupancy overlays still use a fresh uncached EasyStar instance.
- `navigation-object-grid.ts`: keeps the original scene-child collider and navigable-footprint passes, tinting branches,
  footprint shrink rules and out-of-bounds writes. Navigables still overwrite collider tiles in native order.
- `navigation-tile-selection.ts`: keeps the original radius candidates, one RNG sample per attempted candidate,
  same-index removal, deterministic distance/y/x order, indexed representable occupancy and spawn perimeter search.
  It samples existing owners lazily so scene initialization/replaced grid storage retain their original lifetime.
- `navigation-object-routes.ts`: keeps actual actor/target checks, selected target footprint/radius, existing public
  closest-target call, terrain-specific route and optional debug output. No diagnostic target/path query is added.
- `navigation-terrain-type.ts`: owns the same literal enum; `navigation.service.ts` imports/re-exports that exact object
  so existing `TerrainType` imports still resolve to the one authority.

The facade keeps `NavigationService.UpdateNavigationEvent`, the same 100-ms trailing throttle, constructor registration,
scene initialization and shutdown callback ownership. Rebuild order stays object overlay -> ground grid -> height graph ->
ground EasyStar setup -> distance cache clear -> ground cache clear -> water cache clear. Base terrain/water setup
still occurs only at initialization. Water dynamic-blocker calls still use the existing water cache without a ground
occupancy overlay. Shutdown still removes its update listener and clears only the ground cache. The inherited trailing
throttle/water lifetime behavior is not repaired or represented as complete disposal evidence by this split.

The original async implementation moves to its owner. New facade forwarders deliberately omit `async` and return the
owner Promise directly; adding a second async adoption layer would change completion ordering. Existing facade methods
that already wrapped a native query remain async. Native query throws/rejections, mutable returned paths and debug
ordering stay native-owned. In particular, a pending old ground query can still refill a cleared cache, and a late
callback retains the request's timestamp. Native cache/rebuild observation must characterize those cases before claiming
freshness; this extraction introduces no version guard, cache copy, new timer, query, actor scan or save/relay field.

**Implementation Review / Omission Audit (source only):** acceptance 1–5 traced the facade constructor, initialization,
all moved method bodies, static/object/dynamic/water routing, graph cell/reference consumers, movement enum imports,
production spawn callers, DistanceHelper and marked builder/producer wrappers. Callers continue resolving the same
service token and public methods; capture wrappers need no registration change. Dependencies on the facade in extracted
selection/routes are type-only; runtime composition stays scene-owned. Repairs remove extra async forwarding layers,
retain the existing closest-target public call, isolate the enum while preserving its re-export identity, and correct
stale spawn-exhaustion/null-result comments without changing their native predicates. The exact obsolete navigation
baseline entry is removed, with no new exemption or hash refresh. New owners keep one substantive declaration each;
source-size enforcement is still unrun. No editor, GUI, package, config, save/wire migration or scenario registration
applies. No skill/tool improvement was needed.

Authored/unrun characterization: cache exact TTL and request-versus-callback clock, original path mutation, null/empty
results, old callback after clear, uncached overlays and native query errors; exact graph reference, directed asymmetry,
static/overlay order, same-height and traversal bounds; RNG/removal, current grid/water candidates, distance/y/x ties,
occupancy sampling and spawn exhaustion; public enum/Promise identity, static/water fallback, missing source tile,
initialization/rebuild/cache clear order and shutdown listener ownership. `NavigationPathfinderDouble` explicitly delivers
callbacks and does not execute pathfinding. These are synthetic/native-boundary characterizations, not Phaser world,
completed revision, useful arrival, actual cache freshness or measured runtime-cost evidence. Existing Phaser mock and
merged Nx compatibility debt remains final-gate work.

**Separate Final Closure Audit (source only):** after the forwarding/comment repairs, every authoring item has a concrete
owner, consumer and explicit deferred evidence. Public return types/default arguments and native rebuild/cache ordering
remain in source; the staged scope must contain only these navigation owners/specs, exact baseline removal and two
handoff documents. Formatting, lint, types, builds, source-size/schema/editor/repository checks, Jest, Playwright and
simulations remain unrun. Publication closes only this prerequisite authored slice; verify exact remote SHA and pause.
The next grouped Sol/high batch adds bounded native query/cache/rebuild observation and report consumption through these
owners. Useful demand/service/rally lineage, arrival/stability, full production adapter/oracles, setup/research and
strategic AI worlds remain open. No family, issue, complete machinery or release closure is claimed.

**Deferred focused command (unrun; append to prior final gate):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='ground-navigation-pathfinder|navigation-height-graph|navigation-tile-selection|navigation-service-boundary|height-navigation-graph-builder|ai-runtime-navigation-observation|ai-runtime-producer-route-capture|ai-runtime-production-spatial-capture|production-spatial-spawn' --skip-nx-cache
```

### Production producer route checkpoint (2026-10-06, unverified)

Machinery batch 17, #815/#816 PRO-03/06/07 prerequisites. Base `b238801000ae8730c9802a833a485fa57162f55f`,
worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`; containing commit owns
this revision. Nx merge `59f72e037` is preserved. Actual model/effort is unavailable. No issue/family is complete.
All executable validation remains deferred to the final gate; source review below is not execution evidence.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Native returned object and rally selection | `spawnProductionActor`, `observeProductionOutput`, local `ProductionSpatialAuthorityEvent` | Exact producer/item/product plus already-selected branch; native branch/error-isolation Jest authored/unrun |
| 2. Existing target-specific service/output queries | `AiRuntimeProducerRouteCapture` installed/disposed by marked `AiRuntimeProductionSpatialCapture`; `AiRuntimeProducerRouteV1` | Three existing NavigationService methods observed once; weak product binding and producer-component scope; passive capture/integration Jest unrun |
| 3. Exact report lineage | `matchRuntimeProducerOutput`, `RuntimeProducerRoutesV1`, `normalizeRuntimeProducerRoutes`, causality normalizer and existing variant runner | Exact physical item, native completion/product/spawn and accepted production decision/demand; synthetic Playwright authored/unrun |
| 4. Loss, contradiction and lifetime ownership | Bounded bindings/queries/paths, scene/index/clock checks, restore/setData/reuse fences and root suppression | No partial route group after overflow; duplicate product/item and conflicting command/query facts fail closed; negative cases authored/unrun |
| 5. Review, omissions, closure and publication | Native/passive/synthetic specs, handoff and this packet | Source-only audits below; exact staging, normal commit/push/remote verification and pause required |

The spawner emits an output record only for an actual returned product with a supplied physical queue handle. It does
so after the existing creator/score callback and before the selected rally invocation. Branches are `unset`,
`movement_fallback`, `actor_action`, `tile_action` and `no_target`. The fallback keeps target selection inside RallyPoint;
its target remains unknown in this boundary. Actor/tile branches retain values the native code already selected.
No additional `isSet`/target getters, spawn choice, action or route query exists. The output observer is listener-gated,
local/nonpersistent, and catches diagnostic listener errors without changing native actions, return values or errors.

The existing marked spatial capture owns the route adapter even if the scene has no navigation service. When present,
it wraps the actual service instance's object-radius, static-tile and dynamic-blocker methods; builder observation
remains installed outside that wrapper. Disposal restores builder then route wrappers in reverse ownership order,
preserves later replacements, fences pending continuations and clears weak product bindings. No timer, extra index
scan, hidden actor list or planner input is introduced. The dynamic route records only the actual blocker count, not
occupancy actors or a reconstructed grid. Source/target identity, actual capture-scene membership, current tiles,
fixed clock, scene/restore flags and existing graph-reference/request observations are sampled at each boundary.
Caller tile arguments and native path results are detached before later mutation; the original receiver/arguments,
Promise, null/empty/nonempty result object, rejection and synchronous throw are preserved. Diagnostic-reader failures
remain missing history and cannot retry the native call. Flying/direct movement and other unwrapped queries stay unknown.

Actual returned-object bindings are weak and cap at 256 output events; capture-local output/query counters saturate
at 8,192. Each complete returned path is retained up to 512 tiles, otherwise its successful native result remains
separate from diagnostic loss. The normalized output/query group caps at 256 each and is discarded entirely on either
overflow, including raw binding overflow. The raw root's 8,192-fact/256-snapshot caps are unchanged. Tail records are
still validated after group overflow; duplicate output IDs, consumed item/product reuse and contradictory interval,
clock, method, argument, actor, result and navigation claims suppress all normalized route/world/money/effect groups.

Output lineage requires the exact item ID/producer/product from the real native completion, the full detached physical
item, command/effect identity, producer membership and callback order: actual creator-after precedes output, output
precedes the production terminal, and creation/output use the same actual tick. Spawn choice joins exact same item and
producer before creator-before, after physical removal. Missing native completion/spawn or decision cannot be filled
from an endpoint, name, price, nearest event or later snapshot. Every query with output ownership names the exact earlier
capture-local output ID and actual product ID/canonical family/owner. The production admission/selected demand can be
retrospectively reported through that output; it does not assert that later movement fulfills the original demand.
Generic owned-producer target queries carry no inferred service intent/demand; their missing identity stays explicit.

Request and terminal actor binding is separate from successful route result and topology observation. Current binding
requires same-tick active/alive/finished/indexed actors still in the capture scene at unchanged sampled tiles. Restore
flags, relevant construction setData and observed unregister/re-registration fence old output links. Awaited ticks,
missing clock/scene/index, moved actors and topology changes keep distinct gaps. Failed/pending/no-path and empty-success
queries are retained distinctly. Native cache provenance/revision, complete query history, rally-command identity,
actual movement/service arrival, useful dated demand and continuous stability remain missing. No endpoint or rally
selection supplies a reachable/safe/useful producer boolean. The full `RuntimeProductionEvidenceV1` adapter/oracles and
PRO-03/06/07 denominators remain mandatory and unchanged.

**Implementation Review / Omission Audit (source only):** acceptance 1–5 traced the native spawn/creator/rally order,
RallyPoint fallback, MovementSystem static/dynamic callers, NavigationService object/tile methods and existing marked
capture installation/disposal. Raw kinds are additive/legacy-compatible; the existing spatial normalizer delegates only
new kinds while validating the shared graph/request counter stream across builder and producer queries;
the causality normalizer validates/routes the new groups after native completions. The existing variant runner
serializes the full result without new scenario registration. Source repairs isolate diagnostic reads from the one
native invocation, add actual scene membership, and reject consumed product/item reuse. Tests cover all five rally
branches with original getter/action counts, error isolation, original Promise/arguments/result mutation, static/dynamic/
producer-target scopes, unrelated tile movement, null/empty/overflow results, reader/native failure, pending/disposal/
later replacement, exact accepted demand, missing authority, restore/reuse/scene/index/awaited/topology boundaries,
contradictions and whole-group overflow including invalid tails. Every test is unrun. No editor/GUI/config/package/save
migration applies; all new runtime contracts are local test diagnostics. No skill/tool improvement was needed.

**Separate Final Closure Audit (source only):** after repairs, all five authoring items have concrete implementations,
consumers, authored cases and explicit deferred evidence. New source owners remain narrow; no source exemption was
refreshed. Source-size enforcement, formatting, lint, types, builds, Jest, Playwright, simulations, schema/editor and
repository validation remain unrun. Publication closes only this authored slice; exact staging, normal commit/push and
matching remote SHA remain required before pausing. Full native navigation/cache/history, service/rally command
identity, useful arrival/demand/stability, paired setup/legal research, strategic AI transition/cancellation worlds and
runtime profiling remain open. No release, family, issue or complete machinery closure is claimed.

**Deferred focused commands (unrun; append to prior final gate):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='production-spatial-spawn|observe-production-output|ai-runtime-producer-route-capture|ai-runtime-production-spatial-capture|ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-producer-routes.spec.ts skirmish-ai-runtime-production-spatial-normalization.spec.ts skirmish-ai-runtime-production-completions.spec.ts skirmish-ai-runtime-production-effect-retention.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Final-gate obligations include merged Nx/Jest/Phaser compatibility and mock-emitter debt, actual asynchronous/native
cache order, observer/capture/report cost and real legal/useful worlds. Synthetic contracts provide no gameplay proof.

**Next grouped authoring:** actual native navigation query/cache/rebuild provenance through ground TTL, dynamic-grid
and water-helper branches, preserving results and distinguishing completed rebuilds from capture-local graph/request
observations. Inspect source-size ownership before a narrow extraction; never refresh baselines or add diagnostic-only
queries. Then dated useful demand, actual arrival/service effects and continuous stability before the full production
adapter. Keep **GPT-6.1 Sol / high** for these unresolved authority boundaries. Official OpenAI documentation was searched
and opened this turn: [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) supports complex coding
and high effort. The recommendation is task judgment, not a setting change. Commit/push, verify remote, pause.

### Production construction ownership checkpoint (2026-10-06, unverified)

Machinery batch 16, #815/#816 PRO-03/06/07 prerequisites. Base `f3835ddc2a862f265ecdd1f16a7e716dbc77d1e5`,
worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`; containing commit owns
this revision. Nx merge `59f72e037` remains intact. Actual model/effort is unavailable. No issue/family is complete.
All executable validation remains deferred to the final gate; source review below is not execution evidence.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Exact native placement/admission lineage | `projectRuntimeConstructionLineage`, shared `matchRuntimeConstructionDecision`, `matchRuntimeConstructionApplication` | Exact earlier site, complete payload/stamp, accepted decision/demand and native application; source reviewed, synthetic Playwright unrun |
| 2. Installation/pre-capture/restore ownership | `AiRuntimeInitialConstructionV1`, `captureAiRuntimeInitialConstruction`, existing marked capture, `normalizeRuntimeInitialConstruction` | One detached installation inventory per player, no later backfill; Jest authored/unrun |
| 3. Every attempt reaches reports | `RuntimeConstructionLineageV1`, causality normalizer and existing variant runner; pricing projector consumes exact scopes | Repeated refunds/teardowns retained; automatic sites need no builder path; source traced, Playwright unrun |
| 4. Bounds, contradictions and missing history | 256-site inventories / lineage groups, restore and ID-reuse fences, existing raw caps / root fail-closed suppression | No partial membership on overflow/reader loss; legacy absence, cancellation/setup/payment/global ownership and useful-effect history stay gaps |
| 5. Review, omissions, closure and publication | New inventory/lineage specs, capture/authority assertions, handoff and this packet | Source-only audits below; exact staged scope, normal commit/push/remote verification and pause required |

Installation samples actual ConstructionSiteComponent state/work through its existing save projection, and the shared
created-actor identity/index/owner projection. It reuses the actor list already needed for initial queue listeners;
there is no additional index query, recurring scan, timer, planner input or gameplay/save/relay mutation. The existing
capture owns and clears its per-player map on dispose. Known ownership outside declared players is excluded; an unknown
owner or read failure makes membership unavailable, rather than proving a partial inventory complete. Each declared
player retains at most 256 sites, with overflow discarding the whole player's group. Initial state may be unfinished
or finished and work counters can include native negative completion overshoot. Presence at tick zero is still only
capture installation presence, never fixture/map identity, prior charge provenance, restoration completion or paid lease.

Lineage consumes validated native records and placements. Each callback requires an exact earlier site-ID/canonical
family/owner binding; multiple earlier placements fail closed instead of choosing the nearest. Observed unregister /
re-registration, restore flags and setData boundaries fence earlier ownership, including manual setData outside global
restore. Canonical family/owner changes without a fence fail; visual variant changes keep an explicit history gap.
Installation binding requires actual index identity. Missing IDs/clock/live binding retain gaps, not useful product credit.
Future placement cannot backfill an earlier callback. All repeated teardown/refund attempts remain independent records.

The existing construction decision matcher now allows a caller to request capture-wide retrospective admission linkage
without a path resolution. The accepted request, retry fence, selected decision, native admission, receipt and complete
command payload/stamp remain shared authority. Existing path callers still supply their resolution boundary, preserving
the stricter receipt-before-resolution rule. This permits automatic sites without inventing a builder path and preserves
single-player callback-before-receipt order. No retrospective scope is represented as authority available at callback time.
Application is separate: one exact delivery and one real applied outcome must match actual placement tick, actor IDs,
site world link and all execution fields. Illegal/missing/failed application retains nullable application alongside the
observed admission/attempt; admission cannot imply legal, paid, completed or useful construction. Pricing reports reuse
these exact scopes by placement sequence; current definition, admission price and refund vector remain separate.

`RuntimeProductionCausalityV1.initialConstruction` and `constructionLineage` reach the existing variant serialization.
Contradictory initial state/identity, application/stamp, family or ambiguous placement suppress normalized authority,
catalog, world, money and effect groups. Overflow yields no partial lineage/inventory. Per-attempt AI identity gaps
replace the unconditional construction AI gap only when the exact admission is actually joined. Full site-lifetime,
payment/definition/global-resource history, initial setup/payment, cancellation command identity and completion/useful
effects remain explicit. No full production adapter/oracle/denominator is weakened. Native payment predicate, resampled
refund policy, pre-start/repeated credits and zero-duration arithmetic are untouched, still authored/unverified findings.

**Implementation Review / Omission Audit (source only):** acceptance 1–5 traced capture construction/install/dispose,
actual component save getters, owner/index projection, legacy optional raw contract, exact shared decision/command
matching, native placement/application callback order, full causality/variant consumption and catalog scope reuse.
Source repairs preserve neutral ownership, fenced restore family changes and visual variants; callback-time state/finished
contradictions now fail closed. Specs cover automatic sites, multi-builder exact admission, callback-before-receipt,
initial/legacy/unknown/neutral/reader/overflow ownership, finish-before-effects, illegal/missing application, restored
callbacks, ID reuse, repeated teardown/refund, future placement, stamp/site/state contradictions and whole-group loss.
No test or other executable check ran. No new scenario registration or editor/GUI/package/config/save migration applies;
these are test-owned diagnostic contracts consumed by the existing runner. No skill/tool change was needed.

**Separate Final Closure Audit (source only):** after source repairs, all five authoring items have concrete owners,
consumers, authored tests and explicit deferred evidence. Existing raw caps and complete-evidence gates are retained.
New files/methods remain narrow, one substantive contract per file; no source baseline is refreshed. Size enforcement,
format/lint/type/build/Jest/Playwright/schema/editor/repository checks remain unrun. Paired setup, navigation/cache/history,
producer service/output reachability, dated useful demand/continuous stability, AI strategic cancellation worlds, legal
Skaduwee research and the full `RuntimeProductionEvidenceV1` adapter remain open. No release/issue/family closure.
Publication closes only this authored slice; verify exact owned stage, normal commit/push and matching remote SHA, then pause.

**Deferred focused commands (unrun; append to prior final gate):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='capture-ai-runtime-initial-construction|ai-runtime-construction-capture|ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-construction-lineage.spec.ts skirmish-ai-runtime-construction-authority.spec.ts skirmish-ai-runtime-construction-decision-lineage.spec.ts skirmish-ai-runtime-construction-catalog.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Final-gate work also includes merged Nx/Jest/Phaser compatibility, Phaser mock emitter debt, actual capture installation /
restore order, bounded inventory/report cost and real legal/useful worlds. Synthetic contracts do not provide that evidence.

**Next grouped authoring:** target-specific producer service/output routes through existing native query/spawn/rally
callers and exact accepted demand/producer/product identity. Then complete navigation revision/cache/history and dated
useful demand/continuous stability before the full production adapter and real strategic worlds. Keep **GPT-6.1 Sol / high**
for these unresolved authority boundaries. Official OpenAI documentation searched/opened this turn supports complex
coding and high effort: [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol). Recommendation is task
judgment, not an actual setting change. Commit/push, verify remote, pause.

### Production construction lifecycle checkpoint (2026-10-06, unverified)

Machinery batch 15, #815/#816 PRO-03/06/07 prerequisites. Base `02345fb78d8fc6460fecf2af0f44f1793b1ed57c`,
worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`; containing commit owns
this revision. Prerequisite extraction `e654a8e1a` is included in the grouped publication. Nx merge `59f72e037`
remains intact. Actual model/effort is unavailable. All executable validation stays deferred to the final gate.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Narrow native authority without policy changes | `construction-payment.ts`, `construction-progress.ts`, existing `ConstructionSiteComponent` callers/exports | Source diff reviewed; changed size exemption removed, not refreshed; original progress specs retained/unrun |
| 2. Exact resource/lifecycle attempts | `ConstructionAuthorityRecord`, `ConstructionResourceScope`, `observeConstructionResource`, `observeConstructionLifecycle` | Native payment characterization and real component state/restore/teardown Jest authored/unrun |
| 3. Marked capture and report consumption | Raw construction contract/fact, existing capture install/dispose, `normalizeRuntimeConstructionAuthority`, causality/variant runner | Capture Jest and synthetic Playwright authored/unrun; no separate runner registration |
| 4. Bounded/fail-closed authority | Constant synchronous observation, callback count saturates at nine, 256-record normalized group, existing raw caps | Contradictions suppress groups; overflow drops the entire group; missing/full-history authority remains explicit |
| 5. Review, omissions, closure and publication | This checkpoint, handoff, exact owned paths | Separate source audits below; normal commit/push and exact remote SHA required |

Native findings remain behaviorally unchanged: start charges only when `productionTime === PaymentType.PayImmediately`
(the enum value is zero), independently of configured costType. An ordinary configured immediate price with positive
work time therefore follows the native skipped-charge branch. Cancellation resamples the current production definition,
uses current progress only for configured immediate costs, multiplies by the site's refund factor, floors each resource,
and emits even before construction starts. Cancellation does not change state or retain a paid-price ledger; killed and
destroy callbacks can invoke it twice. Finished cancellation returns early. Construction progress itself emits no
per-tick charge in this owner. A zero-duration progress fraction can become non-finite; this remains a native defect,
not a reason to manufacture a finite refund or validated payment policy. Definition/owner errors before the resource
observer remain uncaptured native errors, with incomplete-history gaps. No balance/persistence policy is repaired here.

The extraction keeps exact predicate/resource references and call order, progress helpers' existing exports and restore
assignment behavior. Removing the component's content-hash exemption avoids presenting edited oversized authority as
baselined. New owners are narrow and one contract per file; no baseline is refreshed. Source-size enforcement is unrun.

Resource observation is listener-gated. Ordinary scenes call the original shared emitter once without balance/communicator
reads. Marked scenes copy the definition/request before native callbacks, sample only the explicit owner's current balance,
subscribe for exact action/owner/input-object identity, and release that subscription on normal/error return. Callback count
saturates at nine without accumulated history. Nested observed construction intervals fence the outer comparison. A returned
emitter is separate from a callback and delta; restore suppression can return with unchanged money and no callback. Missing
owner is retained as null, never replaced with the emitter's local-player fallback. Setup/projection errors cannot replace
the native return/error. Observation loss, other resource owners and unsampled operations remain unproven.

Lifecycle observations occur after the real start/finish state assignment, after setData loads its fields, and before each
native teardown cancellation. `finished` precedes upgrade/score effects and proves only the state transition; `restored`
means setData ran, not a completed reconnect/snapshot. No progress polling, new scene owner, timer, save/relay data, fair AI
input, paid-price ledger, cancellation guard or new resource mutation is introduced. Teardown callbacks remain distinct.

The existing marked raw capture detaches the site through actual identity/index/owner projection and appends these facts
under its unchanged 8,192 fact cap; disposal removes its event listener. The normalizer inspects every construction fact,
even beyond its 256-entry projection limit, checks native predicates/refund arithmetic/callback/delta claims and rejects
contradictory boundaries, vectors and ownership. A 257-entry group is dropped rather than partially accepted. Legacy omission
has an explicit gap. Null authority, restore/inactive boundaries, nested/throwing/saturated intervals, complete payment/
definition history, global resource interval ownership, full AI lifecycle identity and completed effects remain gaps.
Exact local matching callbacks are diagnostic observations, not `RuntimeProductionEvidenceV1` or accepted liabilities.
The causality coordinator suppresses all normalized groups on contradictions; the existing variant runner serializes the
whole return, including `constructionAuthority`. Queue money remains on its prior native queue contracts.

**Implementation review and Omission Audit:** traced component start/cancel/finish/setData/killed/destroy -> extracted
native payment -> exact emitter/callback observation -> existing marked capture -> bounded normalizer -> causality ->
variant report. Reviewed no-listener behavior, original emitter arguments/errors, definition mutation during callbacks,
skip/denial, current-price/progress refunds, pre-start and repeated cancellation, restore suppression, explicit missing
owner, exact versus merely equal callback vectors, nested intervals, callback saturation, diagnostic failure/cleanup,
legacy omission, changed prices and invalid money/state/clock claims. Regression sources cover those cases; all are
unrun. Existing serialization shape/assignment cleanup/queue accounting are retained. Native policy defects are recorded
rather than hidden by expected prices. No skills/tooling changes or unrelated Nx edits belong to the stage.

**Separate Final Closure Audit:** five authoring criteria have owning implementations, immediate consumers and source
or authored-regression evidence. Executable correctness, global resource ownership/complete payment history, exact AI
construction/cancellation lineage, pre-capture/initial/restore provenance, real completed product effects, zero-duration
policy and capture/report performance remain unverified. No family, subissue, parent, runtime adapter or release is
complete. Publish only the exact owned extraction/capture/contracts/specs/docs, keep PR #814 draft and verify the final
remote SHA; preserve primary develop and Nx migration. Retain **GPT-6.1 Sol / high** for grouped construction lineage/
setup ownership; official [model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol) supports
complex coding and high reasoning, while the task-specific recommendation does not switch the running model.

Focused final-gate commands (recorded only; **not run**):

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='construction-payment|construction-lifecycle|construction-site-component|ai-runtime-construction-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-construction-authority.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts skirmish-ai-runtime-construction-catalog.spec.ts
```

At the final gate also run the required formatting/lint/type/build/repository checks, including changed source-size
owners and Nx/Jest/Phaser compatibility. Known Phaser global EventEmitter/DESTROY mock debt remains unverified.
Next authoring: exact construction placement/admission/AI lifecycle joins and initial/restore ownership, followed by
remaining native producer output routes and full paired/useful/stable evidence. Never promote these attempts to a
complete paid-price history, terminal cancellation or useful strategic replacement.

### Production navigation boundary checkpoint (2026-10-06, unverified)

Machinery batch 14, #815/#816 PRO-03/06/07 prerequisites. Base `e08d28f60943e669fa7dfcc7f6009bee83d06e28`,
worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`; containing commit owns
the new revision. Nx merge `59f72e037` remains intact. Actual model/effort is unavailable. No executable validation ran.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Capture exact observed navigation boundaries | `AiRuntimeNavigationObservation`, `AiRuntimeNavigationBoundaryV1`, existing marked spatial capture | Capture/observer Jest specs authored/unrun; source reviewed |
| 2. Preserve native query ownership and cleanup | Original receiver/args/Promise/result/rejection, one disposed listener, constant retained graph reference | Existing capture cases plus changed/read-loss/disposal cases authored/unrun |
| 3. Fail-closed report handling | Boundary validator/interval projector, spatial normalizer, `paths[].topologyObservation`, existing variant runner | Synthetic Playwright cases authored/unrun |
| 4. Bound work and preserve missing authority | 8,192 graph observations/update requests, terminal loss, legacy gaps, native revision/cache/history gaps | Bound and contradiction cases authored/unrun; no fresh/reachable/safe verdict |
| 5. Audits and scoped publication | This checkpoint, handoff, exact task-owned staging | Source audits below; normal commit/push and exact remote SHA required |

Native source inspection: `NavigationService.updateNavigation` calls setup and clears ground/water/distance caches.
Setup creates a new height-graph object, exposed by the existing O(1) `getHeightGraphDebugSnapshot` getter.
`UpdateNavigationEvent` drives a throttled handler, so observing a request cannot prove completed rebuild/cache clearing.
Ground paths can reuse a 1,000 ms cache. This batch leaves all native navigation code untouched.

The test-owned observer reads only graph reference identity at actual requested/resolved/threw/rejected boundaries.
Its positive graph observation ID denotes consecutive observed reference identity, not a native revision or world digest.
An absent graph breaks that interval. Update-request count is independent and capture-local; neither counter reconstructs
unsampled changes. No graph cells, global actors or tiles are serialized or supplied to fair AI input. A getter failure
becomes terminal diagnostic loss without altering the native query. Bounds stop usable observation after 8,192 graph
observations or update requests; loss returns null counters. Disposal removes the listener and releases the graph.
There is no accumulated history, new query, timer, prototype replacement, gameplay/save/relay change or new scene owner.

The spatial normalizer validates every observed boundary, including native failed query intervals, before accepting it.
Malformed/negative/fractional/oversized counters, regressions across interleaved queries, and resumed counters after
exhaustion fail closed through the existing causality suppression. Legacy omission and missing graph cannot supply an
interval or erase prior known counters. Equal graph/update counters give only `same_observed`; either changed counter
gives `changed`; absent/lost boundaries give `unavailable`. Actor binding `currentAtResolution` remains a distinct fact.
A request count changing without graph replacement is still flagged. The original raw path and lineage stay intact.
Every normalized path keeps native revision, cache-provenance and complete-history gaps, including equal boundaries.
The existing variant runner consumes the full causality return, so this field reaches reports without new registration.

**Implementation review and Omission Audit:** traced marked capture installation -> native caller boundary -> existing
graph getter/update event -> raw optional metadata -> validated interval -> causality -> variant report. Reviewed
throttle semantics, same-tick awaits, unavailable graph, reader exception, failed queries, interleaved/legacy counters,
overflow, exact native Promise identity, teardown, late callbacks and later wrapper replacement. Specs cover graph
replacement, update without rebuild, legacy/lost samples, counter contradictions and both observation bounds. All are
authored/unrun. No source baseline was refreshed; changed owners had no matching exemption. No skills/tooling changed.
Full producer/output routes, native query/cache revisions/history, real construction money/lifecycle, continuous effect
stability, useful demand, paired setup and the full evidence adapter remain open.

**Separate Final Closure Audit:** all five authoring requirements have source paths and explicitly deferred executable
evidence. No tests, E2E, simulation, formatter/lint/types/build/schema/editor/repository or doctor/context/catalog command
ran. This closes this authoring batch only; no production family, issue, release or validation gate is complete. Inspect
exact staged paths, commit/push normally, verify exact remote SHA and both worktrees, then pause.

Focused final-gate commands, **not run**:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='ai-runtime-navigation-observation|ai-runtime-production-spatial-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-navigation-boundary.spec.ts skirmish-ai-runtime-production-spatial-normalization.spec.ts skirmish-ai-runtime-construction-decision-lineage.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Next grouped authoring: actual construction charge/cancel/lifecycle attribution, with pre-start destruction, repeated
teardown, restore and definition history explicitly scoped; inspect the native `productionTime` payment predicate.
Keep native authority extraction and source-size compliance together, then producer/output routes and complete
query/cache revision/history, useful demand/stability and the full adapter. Retain **GPT-6.1 Sol / high** for unresolved
causal contracts; this is task judgment. Complex coding and high effort are supported in
[official OpenAI documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

### Production construction catalog checkpoint (2026-10-06, unverified)

Machinery batch 13, #815/#816 PRO-03/06/07 prerequisites. Base `2f087d048dcf4b8d13765cd6251c61798b94ab56`,
worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`; containing commit owns
the new revision. Nx merge `59f72e037` is preserved. Actual model/effort is unavailable. All executable checks remain
deferred to the user-authorized final gate. This is diagnostic authoring, not full production evidence or family closure.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Exact command-checked construction price | Shared construction, listener-gated detached admission vector, native placement event | Native seam spec authored/unrun; source reviewed |
| 2. Distinct effective site definition | `AiRuntimeConstructionCatalogV1`, `captureAiRuntimeConstructionCatalog`, marked spatial capture | Base/researched/configuration/loss specs authored/unrun |
| 3. Bounded fail-closed report consumption | Catalog validator/projector, `RuntimeProductionCausalityV1.constructionCatalog`, existing variant runner | 256 limit, duplicate and invalid-value specs authored/unrun |
| 4. Missing authority remains explicit | Legacy/tech/AI identity/payment/definition-history gaps | Source reviewed; no inferred paid or useful result |
| 5. Audits, handoff and scoped publication | This packet, handoff, exact task-owned Git paths | Source audits below; normal commit/push and exact remote SHA required |

`applySharedConstructionCommand` keeps native eligibility, affordability, footprint, assignment and outcomes in order.
For an existing spatial listener it copies the exact checked base-price vector before site creation can invoke callbacks;
`emitConstructionPlacement` detaches the local event vector again. Listener-free application uses its original cost
reference and adds no definition lookup, resource mutation or route query. Reconciled/failed-before-placement commands
still produce no placement catalog; no later snapshot can fill that absence.

`captureAiRuntimeConstructionCatalog` belongs only to the existing marked test capture. It selects the same site's
researched definition as the construction component at the placement boundary, with null for the base-level lookup.
Absent tech, mismatched site name, invalid level/numerics or missing definition leave the effective definition null
with explicit loss. Admission price is retained independently. The helper reads current owned tech and definitions;
it does not revalidate affordability/prerequisites, add a listener/timer/cache or mutate gameplay. Existing capture
disposal fences the placement observer. No saved/relay/schema protocol field is added.

`requiredWorkMs` describes construction work, not elapsed time: assigned builders and automatic progress determine
speed, and future research may change the component's definition selection. `configuredPayment` is definition data,
not an actual charge. Source inspection found the existing `ConstructionSiteComponent.startConstruction` compares
`productionTime === PaymentType.PayImmediately`, rather than `costType`. This batch preserves it. Actual construction
charge/cancellation/lifecycle attribution and that payment predicate remain explicit debt before full evidence acceptance.
Do not fill paid provenance from either admission cost or configured payment.

The spatial normalizer validates prices even on an unbound/illegal placement. The catalog projector consumes validated
native placements, retaining command, site, legal verdict and observer order. Exact previously joined construction paths
can supply selected decision and accepted demand identities; no path leaves these null and explicit. Multiple builders
do not duplicate a catalog entry. Native/legacy/autonomous placements need no fabricated route. More than 256 placements
returns an empty catalog with an overflow gap; duplicate command identity fails closed. Contradictory numeric/configured
prices suppress the complete normalized causality groups. The existing variant runner serializes the normalizer's full
return value, so no unused adapter or new runner registration exists. The full `RuntimeProductionEvidenceV1` adapter and
global definition catalog remain absent. Queue application-gap projection moved unchanged to its own small helper so
the causality coordinator stays within the method-size contract; source baseline entries were not refreshed.

**Implementation review and Omission Audit:** traced checked command cost -> pre-creation copy -> native placement ->
marked capture -> raw catalog -> spatial validation -> bounded catalog -> existing report. Reviewed immediate consumers,
legacy captures, multi-builder scopes, missing tech, researched cost divergence, unbound contradictions, duplicated
commands, bounds, disposal and absence of gameplay/relay changes. Meaningful native Jest and synthetic Playwright
specs are authored, all unrun. No skills/tooling changes or unrelated Nx changes were needed. Route/topology freshness,
continuous retention, dated useful demand, paired setup and complete event liabilities remain unresolved dependencies.

**Separate Final Closure Audit:** all five authoring requirements have implemented source paths and deferred evidence.
No tests, E2E, simulation, formatter/lint/types/build/schema/editor/repository or doctor/context/catalog command ran.
No family, issue, release or validation gate is closed. Inspect exact staged paths, publish normally, verify the remote
branch SHA and both worktrees, then pause. Publication is separate from executable correctness.

Focused final-gate commands, **not run**:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='apply-shared-construction-command|ai-runtime-production-spatial-capture|capture-ai-runtime-construction-catalog' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-construction-catalog.spec.ts skirmish-ai-runtime-construction-decision-lineage.spec.ts skirmish-ai-runtime-production-spatial-normalization.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Next grouped authority: target-specific producer/output routes with actual navigation revision/history, dated useful
demand, continuous effect retention and actual construction money/lifecycle, then the full evidence adapter and paired
PRO-03/06 transition worlds. Retain **GPT-6.1 Sol / high** for unresolved causal contracts; this is task judgment, with
complex coding/high support described in [official OpenAI documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

### Production lineage/retention checkpoint (2026-10-05, unverified)

Machinery batch 12, #815/#816 PRO-03/06/07 prerequisites. Base `55f14e50c8329f8824277d87031f83db634bd301`,
worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`; this packet's containing
commit owns the new revision. Nx merge `59f72e037` remains intact. Actual model/effort is unavailable.
All tests, simulations, formatter/lint/types/build/schema/editor/repository and doctor/context/catalog execution remain
deferred by the user. This is an authored diagnostic slice; full production evidence and family acceptance remain open.

| Acceptance | Implemented owner / consumer | Evidence state |
| --- | --- | --- |
| 1. Exact accepted construction lineage | `matchRuntimeConstructionDecision`, production request/command validators, spatial normalizer | Source reviewed; synthetic spec authored/unrun |
| 2. Actual sampled boundary order | Raw snapshot `afterSequence`, marked capture, world normalizer | Source reviewed; marker assertions authored/unrun |
| 3. Native completion to later owned effect | `RuntimeProductionEffectRetentionV1`, retention projector, causality normalizer | Actor/tech samples authored; continuous/useful proof absent |
| 4. Fail closed and bounded loss | Full stamp/site/builder checks, sample marker ordering, ID reuse/tech checks, 256/8,192 limits | Negative specs authored/unrun |
| 5. Consumer, handoff, scoped publication | Existing variant runner/report contract, this packet and handoff | Source wiring reviewed; normal commit/push and remote SHA required |

Construction lineage follows the real selected decision -> accepted construct -> dispatch admission -> stamped receipt ->
native placement/delivery/application -> observed path interval. `constructionCommand` is attached to each joined path;
queue scope and queue-specific accounting remain under their existing owners. The accepted intent must exactly match
all addressed builders, prefab, site key and logical tile; the delivery and native applied outcome must retain the
full execution correlation. Same-effect retries are fenced by the previous finish. Duplicate/mismatched receipts,
wrong selected decisions and a receipt observed after path resolution invalidate the spatial group. Missing legacy
decision identity stays a gap. Construction's actual late application is distinct from the intended command tick.
Native human/legacy placement alone supplies no AI attribution, fresh navigation or reachability verdict.

`afterSequence` is the last observed fact for the sampled player, not the global sequence counter. It may be zero
before any player event; gaps in global sequence caused by other players remain legal. Raw capture adds no listener,
query, timer, persistence or relay field. World normalization checks marker membership, clocks and monotonic sample
ordering, and preserves independently sampled completed tech and source-world omissions. Older snapshots omit the
marker and cannot establish same-tick or later effect order. Normalized worlds retain legacy order loss as null.

Retention joins each exact native completion to subsequent ordered world samples. Actual indexed actor identity,
canonical family, owner and component level remain separate from researched catalog level. A complete sample with no
product records absence; an incomplete owned-world sample leaves absence unavailable. Native unregistration and
registration records prevent reusing an actor ID as the original product. Newly registered research must remain in
the later player tech authority. Samples retain the original accepted decision and demand ID without interpreting
the demand as useful. There is no interpolation, stability duration, demand fulfillment or oracle verdict. The
projector caps completions at 256 and completion/snapshot expansion at 8,192; overflow returns no partial group and a
named gap. Actor lifecycle events are indexed once rather than rescanning the entire raw capture for each sample.
The causality normalizer suppresses retention and all other normalized effect groups on contradictions. Existing
`skirmish-ai-runtime-variant-runner.ts` already invokes that normalizer and retains its complete result in reports.

Implementation review and Omission Audit (source-only): traced native construction ordering, admission versus actual
application time, accepted multi-builder payload, repeated effect attempts, current consumers, raw capture disposal,
world identity/catalog checks, completion/removal authority and report projection. Reviewed changed contract comments
and direct constructors/imports. No new capture owner, save migration, public gameplay policy or external write is
needed. Repairs during review made stamp comparison semantic for optional execution fields, retained sample-local
world gaps, fenced future receipts and removed nullable-clock access from nested callbacks. No baseline was refreshed.

Separate Final Closure Audit (source-only): acceptance 1–4 and documentation/consumer authoring are present; publication
is the final required action. Newly authored tests cover positive multi-builder lineage, late application, missing
legacy identity, retry scopes, forged decisions/payload/stamps/admission/duplicate or future receipts, actor and tech
retention, same-tick pre-terminal and unordered samples, absence versus loss, changed levels, impossible/regressing
markers, reused/unregistered actor IDs, restore, missing registered tech and report overflow. Raw-capture assertions
cover zero before events, a later same-tick marker and interleaved other-player sequence exclusion. No tests or checks
ran, so compilation, runtime setup, exact assertions, Phaser mocks and report cost are unverified. The full adapter,
route freshness, command-priced construction, complete event liabilities, paired setup, useful demand and continuous
stable-effect evidence remain named obligations. No family/issue/release closure is claimed; no skill/tool changes.

Deferred focused commands (review Nx/Jest/Phaser compatibility before execution at the final gate):

```sh
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-construction-decision-lineage.spec.ts skirmish-ai-runtime-production-effect-retention.spec.ts skirmish-ai-runtime-production-spatial-normalization.spec.ts skirmish-ai-runtime-production-world-normalization.spec.ts skirmish-ai-runtime-production-completions.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Next authoring: complete producer service/output route and navigation revision/history authorities, command-priced
construction catalog, dated useful demand and continuous effect stability, then implement the full
`RuntimeProductionEvidenceV1` adapter using these exact construction/effect joins. Continue with actual paired setups,
legal Skaduwee research and useful strategic cancellation/transition worlds. Keep compatible PRO-03/06/07 work together.
Retain **GPT-6.1 Sol / high** for these authority joins; this is a task recommendation, not a model switch.
The [official model page](https://developers.openai.com/api/docs/models/gpt-6.1-sol) supports complex coding and high
reasoning effort. Commit/push the authored batch and pause before continuing.

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

## Production operation projection checkpoint (2026-10-04, unverified)

Base `e64a6f802777419b746b6f3f9c11d01b67412675`; same integration worktree and `feature/759-skirmish-ai` branch.
The containing commit owns publication. The unrelated Nx migration is preserved. Actual model/effort is unavailable;
retain **GPT-6.1 Sol / high** for the remaining native lifecycle/fair-world design. No automatic model change.

| Acceptance | Owner/consumer | Evidence/status |
| --- | --- | --- |
| 1. Exact complete cash intervals | `RuntimeProductionOperationV1`, `projectRuntimeProductionOperations`, existing scoped payment normalizer | Authored: immediate charge and distinct cancellation refund use actual start/finish cash and unchanged physical liabilities, native accepted decision/command/item ownership and complete callback triples. No inferred enqueue/application time. |
| 2. True per-tick application | operation projector, `validateRuntimeProductionProgress`, shared capture hook from prior batch | Authored: successful charge pairs with actual advanced head/remaining liabilities; final/initial-zero heads retain their distinction. Denied attempt stays zero-charge with unchanged cash/progress/liabilities. Native effect, actor/lane, all waiting liabilities and unique scope are checked. |
| 3. Queue-claim reconciliation | `reconcileRuntimeProductionUnspent`, boundary ledger | Authored: native selected provisional lease/proposal, admission, exact successful immediate price or physical per-tick transfer justifies state. Full selected/admitted totals are recomputed once, with omitted active admissions/leases rejected. Pending diagnostic claims are separate. Missing/unsupported ownership stays null. |
| 4. Real consumer and contracts | `RuntimeProductionCausalityV1.operations` -> existing variant runner/report/evaluator; default Playwright operation spec | Authored/unrun: positive immediate/tick/denied/final/zero/refund, retained transient gap, missing or contradictory state/claims/cash/native ownership, reused identity and duplicate lane contracts. Existing legacy immediate-payment list stays separate. |
| 5. Review, handoff and publication | this checkpoint, HANDOFF quick resume, exact task-owned commit/push | Source-only implementation review and Omission Audit; separate Final Closure Audit after repairs/staging. No executable validation or assertion pass claimed. Remote SHA verified after commit at publication. |

**Operation contract:** records carry actual command and purchased-item command separately, accepted plan/effect,
physical actor/item and scene-local operation id. Per-tick scopes additionally retain actual lane/attempt and remaining
successful charges. Exact raw boundary sequences identify before/after cash, absolute physical liabilities and nullable
queue-claim totals. Charge/refund vectors stay separate. Cash and obligations require every ResourceType; sparse stored
costs must contain only known finite nonnegative resources. Duplicate queue owner/lane/capacity and reused operation
identities fail closed. The projector is Node/test-owned, detached and bounded by capture limits; it adds no gameplay,
save, relay, listener or persistence authority. Report normalization now rejects captures beyond existing 8192 fact /
256 snapshot bounds as well as declared drops. Diagnostic runtime cost remains unmeasured.

**Claim interval:** exact accepting identity and full proposal bind each ledger entry to selected native provisional
resource leases; amounts are not parsed from subject keys. Admitted amounts require actual preceding native admission.
Paid state requires a captured completed immediate triple with the accepted full vector. Physical per-tick ownership
requires the actual command-backed product/effect and stored accepted price at that callback. Released state requires
actual terminal outcome. Paid immediate work can remain paid after completion; it is not unspent cash. Whole-ledger
selected/admitted totals are independently recomputed and pending diagnostic amounts are never added. Missing native
admissions/retained leases cannot silently understate the total. This remains the captured queue-claim subset, not
complete global resource escrow or reservation timing proof.

Unsupported non-queue ownership, pre-capture/restore/migrated owners, unstamped rejected admissions and a removed
per-tick item before its terminal callback remain null with gaps. Current operations do not manufacture a lifecycle
interval to cover them. The full production adapter must obtain their actual authorities. A complete immediate
admitted-to-paid interval may name its exact callback in `reconciledCallbackSequences` only when both endpoint totals
are reconciled, the complete native operation is sound, and the callback ledger contains only the genuine transient
payment gap with unchanged entries and the actual post-charge cash/unchanged physical liabilities. A stale intermediate
callback cannot borrow its endpoints to claim reconciliation. Raw facts and top-level gaps remain unchanged; this is
no global gap deletion.

**Consumer scope:** existing `runVariant` normalization retains operations in real variant JSON/reports. Sound
per-tick operations stop carrying the narrow missing-progress-liability gap; their enqueue authority remains separately
missing. Unsupported per-tick refunds and mismatched payment modes keep gaps. Full event liabilities, fair producers /
reachability / usefulness, runtime definition catalog, paired setup, cadence and restore gaps remain. The mandatory
full `RuntimeProductionEvidenceV1` oracle is unchanged and still rejects missing evidence. No synthetic contract becomes
runtime coverage. No scenario recipe/registration, coverage denominator, balance threshold or source baseline changed.

**Omission Audit:** traced actual capture callbacks -> exact accepting/native command lineage -> scoped immediate
payments or actual progress attempts -> absolute liabilities -> queue-claim reconciliation -> causal normalizer ->
existing report/evaluator. Reviewed synchronous payment before saved brain adoption, buffered intended/actual times,
final exhausted heads, untouched waiting lanes, denied attempts, distinct refunds, absent/contradictory state and
native identities, bounded detached output and retained raw gaps. No additional gameplay lifetime/save duties arise.
Non-queue/global/restore and complete lifecycle/fair-world evidence remain explicit open work, not satisfied acceptance.

**Separate Final Closure Audit:** after source repairs, rechecked the five scoped acceptance items, immediate consumers,
test discovery, legacy contracts, native optional effect typing, new owners/line widths and exact staged scope. No
executable check ran or pass is claimed. No skill/tool policy change, migration edit, baseline refresh, new agent,
branch/worktree/thread/PR or model switch. Existing integration PR remains draft. Commit/push then pause as requested.

**Next exact authoring action:** implement exact native enqueue/rejection, cancellation request/application/removal and
completion/product or tech events around these operation intervals. Per-tick insertion and cancellation refunds need
separate actual ownership; do not infer an enqueue from a successful payment. Resolve unsupported resource/restore and
unstamped rejection ownership, keeping missing amounts null. Then project fair ready/reachable producers, useful stable
products/tech, runtime price/duration/effective-level catalog and paired setup into complete production evidence.
Author legal Skaduwee research setup and useful strategic AI contention/cancellation worlds; group compatible PRO-03/06
pairs. Continue authoring only, commit/push, then pause. Retain GPT-6.1 Sol / high for this authority work.

Add the following **unrun proposed command** to the final gate, alongside prior capture/claim/progress/decision,
preset/pending/payment/digest/oracle/map/multiplayer checks:

```bash
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-operation-projection.spec.ts skirmish-ai-runtime-production-progress.spec.ts skirmish-ai-runtime-production-decision-lineage.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

The default config starts the portal; these pure contract fixtures provision no socket identities. Review all flags /
dependency installation against merged Nx 23.2.1/Jest 30.3.0/Phaser 4.2.1 at the final gate. Shared Phaser mock emitter /
lifecycle omissions remain prior unverified debt. All tests/E2E/simulations, format/lint/type/build/editor/schema /
repository checks and doctor/context/catalog commands remain deferred. Type/module compatibility, source-structure
checks, report/capture pressure, bootstrap and actual both-faction strategic outcomes still need executable evidence.

## Production physical queue checkpoint (2026-10-04, unverified)

**Scope/provenance:** current #815/#816 PRO-03/06/07 substep is native physical insertion/removal interval authoring.
Base `75768bb0875123f8971ab7bc1515172a76f76fde`, integration worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`. The unrelated Nx migration in
`59f72e037` remains intact. This is not full lifecycle / RuntimeProductionEvidenceV1 or issue acceptance.

| Acceptance | Owner / consumer | Status and evidence |
| --- | --- | --- |
| 1. Real physical authority | `QueueComponent` -> `mutateSharedQueueItem`, `QueueMutationEvent` | Authored/unverified: actual push/splice before UI callbacks, retained production/research refund and async completion ordering, no-listener call-once path. |
| 2. Exact raw state / lifetime | `AiRuntimeProductionCapture`, `projectAiRuntimeQueueMutation`, shared `captureAiRuntimeProductionItem` | Authored/unverified: detached outside-lane item/context, before/after all-lane cash/obligations, earliest actual per-tick transfer, restore flag, bounded facts and scene cleanup. |
| 3. Native normalized intervals | `projectRuntimeProductionQueueMutations`, `validateRuntimeQueueMutationBoundaries`, unspent reconciler | Authored/unverified: exact accepting scope/price/physical delta, request/intended/actual timing, isolated cash, independent liabilities, nullable claims and separate actual payment/refund IDs. |
| 4. Contracts / report wiring | New shared mutation/capture Jest specs and default Playwright queue mutation spec/fixtures; existing `runVariant` | Authored/unrun: source review of actual consumers/discovery, both cancellation orders, single-player pre-receipt application, completion and negative boundaries. No assertion executed. |
| 5. Review / handoff / publication | This checkpoint and HANDOFF Quick resume | Source-only implementation review/Omission Audit and separate Final Closure Audit recorded; exact task-owned commit/push then pause. No executable validation or release readiness claimed. |

**Physical authority:** the actual selected lane and affected item handle surround the push/splice itself. Enqueue is
not inferred from cash payment or a later UI notification. Production retains remove -> original terminal -> refund;
research retains refund -> remove -> original terminal. Completion removes before async spawn / synchronous tech
registration. The listener-free path mutates once; a throwing mutation reports no successful after callback. IDs are
scene-local diagnostics in a WeakMap, never save/relay metadata or gameplay deduplication. Bulk QueueComponent.setData
keeps its restore path; research restore addItem facts retain their restore flag and cannot supply fresh native authority.

**Capture and claim timing:** the new subscription is owned by capture and removed on dispose/shutdown/destroy.
Full lane projection shares its item projector with detached mutation handles. Actual per-tick after-push state retires
admitted cash into future physical liabilities before ordinary queueChanged/UI notifications. Node reconciliation can
use this affected native item/context at that exact callback, retaining the prior queueChanged route for older captures.
Pending diagnostic claims are never added. All raw drops/gaps and unknown restore/ownership states remain explicit.
The extra callback pressure and nested bounded normalization cost are unmeasured; final gate owns performance evidence.

**Normalized contract:** `queueMutations` is a separate physical diagnostic in the existing causal/report path. Native
accepted result, complete bus stamp/context, addressed producer/product, stored accepted full price, physical lane/index
and actual callback ordering must match. Every resource must be present in cash/obligation vectors; liabilities are
recomputed independently from all lanes. Exactly the selected push/splice changes the physical queues; cash and every
unrelated lane stay unchanged within that interval. Contradictory metadata, duplicate/reused IDs/items, restore, a prior
terminal, malformed/missing pair or inconsistent boundaries fails closed and suppresses normalized operations/payments.
Missing state/scope is a named gap; it cannot borrow a snapshot or nearest queue notification.

Request sequence/tick is the native request observation; scheduled tick is the actual bus intended application time;
the mutation tick is actual shared application/removal. Buffered cancellation does not receive advance cash. Immediate
insertion names its preceding scoped charge without charging again. Cancellation names its original purchase and
separate cancel execution plus actual refund, on the appropriate side of removal. Missing money or terminal callbacks
remain gaps. Completion removal requires the genuine advanced zero head and its exhausted marker; it still cannot
prove a produced actor or registered useful tech. Removed per-tick ownership before terminal remains null with a gap.
Full event/cadence/global escrow/restore, fair world/catalog/paired setup and useful replacement evidence remain absent.
Only the narrow missing-per-tick-enqueue gap can cease for a sound actual physical interval; raw gaps remain unchanged.

**Authored contracts:** real QueueComponent push/splice and production/research cancellation/completion ordering,
actual lane selection, nonexistent cancellation, no-listener/throw behavior; capture detachment, no-UI observation,
exhausted-head liability sampling, restore and cancellation provenance/cleanup. New native-shaped pure fixtures cover
immediate and per-tick insertion, single-player application before finished receipt, distinct production/research refund
ordering, final consumed-head removal, missing physical state, forged metadata, cash/other-lane/liability/index/duplicate /
restore negatives and a missing advanced callback. They establish no real product/tech, runtime definition prices,
legal setup, strategic AI cancellation, socket parity or passing coverage. Existing legacy contracts remain separate.

**Omission Audit:** traced QueueComponent mutation -> live event -> owned raw capture -> exact decision/native request /
admission/lifecycle scope -> independently checked physical/cash/liability interval -> queue-claim reconciliation ->
normalizer -> existing `runVariant` JSON/evaluator. Reviewed synchronous pre-receipt application, buffered cancel request
versus future removal, both refund orders, exhausted heads/unrelated lanes, legacy absence, restore and cleanup, invalid
suppression, exact staging and unchanged mandatory full production oracle. Rejected admissions/application and actual
created actor / registered tech events are explicit next work, as are unsupported per-tick/global/restore owners.

**Separate Final Closure Audit:** after source repairs, rechecked the five scoped items, optional native stamps and
GameCommandInput typing, consumer/test discovery, new source owner sizes/line layout and staged scope. This is a source
review, not format/type/source-structure validation. No tests/E2E/simulations or executable checks ran; all such evidence
remains deferred. No baseline hash, oracle coverage, threshold, package/config/migration, skill/tool policy, model switch,
agent/thread/worktree/branch/PR creation. Integration PR remains draft. Publish only this batch, verify remote SHA, pause.

**Next grouped authoring:** native rejected request/application events and actual actor/tech completion authority;
complete cancellation request/application/removal/refund lifecycle, removed per-tick ownership and per-tick refunds.
Resolve non-queue/global/unstamped rejection/pre-capture/restore claim authority without default zeros. Then fair
ready/reachable producers, useful stable products/tech, runtime definition catalog and paired setup; legal Skaduwee
research setup and useful strategic AI cancellation/contention worlds, grouping compatible PRO-03/06 pairs.
Retain **GPT-6.1 Sol / high** for this cross-authority work; this is a judgment, not an automatic switch. Actual model /
effort remains unavailable. [OpenAI Docs](https://developers.openai.com/api/docs/models/gpt-6.1-sol) was searched and
opened this turn and lists high effort; no pricing or actual-account availability claim is made.

Add these **unrun proposed commands** to the final gate, alongside prior capture/claim/progress/decision,
preset/pending/payment/digest/oracle/map/multiplayer checks:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='mutate-shared-queue-item|ai-runtime-queue-mutation-capture|advance-shared-queue-item|ai-runtime-production-capture|ai-runtime-unspent-claims' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-queue-mutations.spec.ts skirmish-ai-runtime-production-operation-projection.spec.ts skirmish-ai-runtime-production-progress.spec.ts skirmish-ai-runtime-production-decision-lineage.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Review tooling/flags against merged Nx 23.2.1 / Jest 30.3.0 / Phaser 4.2.1 and dependency installation at that gate.
The default Playwright config starts portal; these pure fixtures need no socket identity. Shared Phaser mock emitter /
lifecycle omissions remain prior unverified debt. All tests/E2E/simulations, format/lint/type/build/editor/schema /
repository checks and doctor/context/catalog commands remain deferred. Type/module compatibility, source structure,
report/capture pressure, bootstrap and actual both-faction strategic outcomes still require executable evidence.

## Production native rejection checkpoint (2026-10-04, unverified)

**Scope/provenance:** current #815/#816 PRO-03/06/07 substep is rejected admission/application plus exact selected-claim
release. Base `f6e60b9e0862263112f4dc88cbf4bb08582af916`, integration worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`; unrelated Nx migration preserved.
The batch closes this authoring slice only. Full lifecycle / RuntimeProductionEvidenceV1 and all executable proof remain open.

| Acceptance | Owners / consumers | Status / evidence |
| --- | --- | --- |
| 1. Native rejected request | `validateRuntimeProductionRequest`, `matchRuntimeRejectedAdmission`, existing dispatch and command lineage | Authored/unverified: same closed unstamped payload validation, exact selected result and synchronous receipt, nullable native stamp. |
| 2. Actual callback state | `AiRuntimeProductionCapture`, raw fact/boundary types and boundary projector | Authored/unverified: detached dispatch before/after ledger samples; actual restore flag; existing outcome samples and cleanup reused. |
| 3. Normalized rejection / claim release | `projectRuntimeProductionRejections`, boundary validator, unspent reconciler and causality normalizer | Authored/unverified: admission/application stages, exact native times, full cash/all-lane liabilities, selected/admitted release, null missing state, fail-closed group suppression. |
| 4. Contract authoring / report integration | New rejection capture Jest spec, Playwright rejection spec and two native-shaped fixtures; existing `runVariant` | Authored/unrun: production/research, stamped/unstamped, no-delivery and synchronous delivery paths, retry fencing and negative boundaries; existing report retains normalized object. |
| 5. Review / handoff / publication | This checkpoint, HANDOFF Quick resume and exact task-owned Git scope | Source-only implementation review/Omission Audit; separate Final Closure Audit before commit/push/pause. No passing validation or release readiness claim. |

**Native authority and timing:** `dispatchAi` supplies the shared stamp, but a rejected receipt does not itself expose
that stamp. Spectator/replay/owner normalization rejection can publish only the receipt; input-address rejection can
publish one native rejected outcome without an admitted command. The adapter retains the real unstamped request and
nullable native outcome/ID. It constructs no fake bus command, scheduled tick, queue item or useful effect. A subsequent
application rejection follows actual admission; native validation may reject before delivery, while a component may
reject during command delivery. Synchronous application/outcome can precede the finished receipt. Buffered request
observation, intended application tick and actual terminal observation remain distinct. A relay rejection may precede
its intended application time; no advance refund/credit is inferred.

**Boundary and release authority:** each dispatch callback now samples before the pending/unspent ledger update and
retains its detached after sample. All sampled boundaries include snapshot-restore status. Native outcome callbacks
reuse their existing exact before/after samples. Rejection validates unchanged full enum cash and full physical queues,
including unrelated lanes, and independently recomputes both all-lane future-cost vectors. The targeted selected or
admitted queue claim must become released; all unrelated entries stay identical. The Node reconciler excludes the
current event when reading its before ledger and accepts an unstamped release only through its exact selected request /
rejected receipt scope. Its amounts still come from native accepted resource leases, never a forecast or reason string.
Pending diagnostic resource claims are not added again. Non-queue/global, migrated, pre-capture and restore ownership
remain null/gapped. Missing older callback state or restore status stays explicit; no snapshot supplies that absence.

**Failure behavior:** contradictory selected result, request payload/claims/correlation, native epoch/sequence/actors,
duplicate or conflicting lifecycle, uncertain duplicate/lost/backlog outcomes, supplied restore, cash/queue/liability /
release changes and attributed native resource/mutation/progress/queue-item effects fail closed. Native IDs distinguish
later retries with the same correlation; a rejected admission cannot borrow the retry's stamp/outcome. Invalid groups
suppress rejections as well as normalized payments/operations/mutations; raw facts and original/global gaps remain.
This is a diagnostic rejection record, not a complete RuntimeProductionEvidenceV1 event or fairness/catalog/setup proof.

**Omission Audit:** source-traced selected decision -> real `dispatchAiIntentCommand` observer -> shared bus receipt /
native application outcome -> owned detached callback samples -> exact scope/release reconciliation -> normalizer ->
existing `runVariant`/report/evaluator. Reviewed actual unstamped and stamped input-address branches, pre-delivery bus
rejection, component rejection, synchronous pre-receipt application, native retry fencing, missing older state,
restore, bounded capture/drop behavior and existing disposal. The new shared request validator replaces duplicated
accepted-request validation, retaining actual command stamp/admission/delivery validation. No mandatory oracle, recipe,
coverage denominator, full event gap or useful-effect requirement was relaxed. New tests are discovered by existing
Jest/default Playwright routes; none ran. Additional before-state capture/report cost remains unmeasured.

**Separate Final Closure Audit:** after source repairs, rechecked the five acceptance items, explicit discriminant
narrowing, actual before-event cutoff, unrelated claim/cash/lane invariants, immediate consumers, source layout and exact
staging. No baseline refresh, policy/skill/tool change, model switch or new agent/thread/worktree/branch/PR. No tests /
E2E/simulations, format/lint/type/build/editor/schema/repository checks or doctor/context/catalog commands ran. The
existing draft integration PR and unrelated migration are preserved. Publish only this batch, verify remote SHA, pause.

**Next grouped authoring:** actual created actor / registered tech completion bound to physical removals, then full
cancellation request/application/removal/refund lifecycle, removed per-tick ownership and actual per-tick refunds.
Continue fair ready/reachable producers, stable useful products/tech, runtime price/duration/effective-level catalog,
paired setup, legal Skaduwee research producer and strategic AI worlds. Keep compatible PRO-03/06 pairs together.
Recommend **GPT-6.1 Sol / high** for these cross-authority contracts; this is judgment, not an automatic model switch.
Actual model/effort is unavailable. [OpenAI Docs](https://developers.openai.com/api/docs/models/gpt-6.1-sol) was searched
and opened this turn and supports high effort; no account availability or pricing claim is made.

Add these **unrun proposed commands** to the final gate alongside prior physical/payment/progress/decision/preset /
pending/digest/oracle/map/multiplayer checks:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='ai-runtime-rejection-capture|ai-runtime-production-capture|ai-runtime-unspent-claims|ai-runtime-pending-commands|dispatch-ai-intent-command' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-rejections.spec.ts skirmish-ai-runtime-production-queue-mutations.spec.ts skirmish-ai-runtime-production-operation-projection.spec.ts skirmish-ai-runtime-production-decision-lineage.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Review merged Nx 23.2.1/Jest 30.3.0/Phaser 4.2.1 flags/dependencies at that gate. Shared Phaser mock emitter/lifecycle
omissions remain prior unverified debt. Type/module/source-structure compatibility, capture/report pressure, native
bootstrap and both-faction strategic outcomes remain executable final-gate obligations.

## Production completed-effect authority checkpoint (2026-10-05, unverified)

**Scope/provenance:** current #815/#816 PRO-03/06/07 slice is actual actor creation / tech registration bound to native
purchase and physical completion removal. Base `dd1e9192e1f7ae9e52418b2f4adaf705e09689ab`, integration worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`; unrelated Nx migration preserved.
This closes the bounded authoring slice only; full lifecycle, RuntimeProductionEvidenceV1 and executable proof stay open.

| Acceptance | Owners / consumers | Status / evidence |
| --- | --- | --- |
| 1. Actual completion authorities | QueueComponent -> ProductionComponent / production-spawner and ResearchComponent -> observeQueueCompletionAuthority | Authored/unverified: removed live item reaches the real creator/registration call; callback invoked once, exact result/throw, existing order and async behavior retained. |
| 2. Bounded detached raw capture | QueueCompletionAuthorityEvent, raw completion/actor contracts and projectors, AiRuntimeProductionCapture | Authored/unverified: exact before/after/threw, actual object/index/canonical identity and tech membership; real index/service notifications, restore, capture/drop limits and teardown. |
| 3. Native completed-effect projection | Completion interval validator, completed-effect matcher, projectRuntimeProductionCompletions and normalizer | Authored/unverified: native selected purchase -> consumed physical head -> actual new registration -> later terminal; exact times, gaps and group suppression. |
| 4. Consumers / contract authoring | Rejection projection, existing runVariant/report/evaluator; new helper/capture Jest specs and completion Playwright spec/fixtures | Authored/unrun: production/research, canonical variant, async terminal, missing/contradictory/reused authority, restore/detachment/throw/disposal; rejected attempts forbid completion callbacks too. |
| 5. Source review / handoff / publication | This checkpoint, HANDOFF Quick resume and exact task-owned staged scope | Source-only implementation review/Omission Audit and separate Final Closure Audit. All execution deferred; commit/push/remote verification/pause remains the publication boundary. |

**Actual call path and timing:** the queue removes its consumed zero-time head through the existing physical mutation
helper. It then passes that exact removed handle to the production/research component. The passive completion helper
runs around the actual synchronous creator call after legal spawn selection, or around the actual TechTreeService
registration call before unit upgrades and component notifications. It adds no async continuation. Listener-free calls
still execute the original callback once, returning the same object/undefined or propagating the same throw. Missing
legal spawn and legacy calls without an item produce no invented creation scope. A thrown authority has before/threw,
never after. A real undefined creator result with its failed native terminal stays a named creation-failed gap, without
completion credit or a fabricated actor. These diagnostics are scene-local WeakMap interval identities; no save/relay/gameplay deduplication role.

**Raw provenance:** the detached item uses the existing capture item owner even outside its lane. The actual returned
object must be indexed as that same object in its own scene, owned, active/alive/finished, and in the producer scene.
Canonical requested/created product families both use the shared definition registry so a genuine random variant
can match its purchased family; neither side is inferred from a display name in Node. The index's real actorRegistered callback is retained separately inside creation; the tech service's existing
researchCompleted callback is retained inside registration, with actual false -> true membership. Complete current
boundary samples and restore flags remain separate from these identities. New observers use existing subscriptions /
fact limits/drop reporting and are removed at shutdown/destroy/disposal. Capture and index-lookup/report cost is unmeasured.

**Normalized authority:** `RuntimeProductionCausalityV1.completions` retains purchase command/effect/plan, exact item /
producer, request sequence/tick, intended bus tick, physical removal sequence/tick, creator/registration interval,
registration sequence and later native completed terminal sequence/tick/world link. A production terminal may occur
on a later async continuation tick. The native terminal alone cannot prove actor type, registration or research scope.
Missing native selection/item/physical interval/notification/terminal remains a named gap without nearest-snapshot or
world-link substitution. Older captures without new facts retain the created-effect gap. Full raw/global gaps remain;
local success does not provide stable strategic utility, effective researched level, fair reachability or complete event
cash/liability/claim authority. Removed-before-terminal per-tick ownership stays null/gapped for the next lifecycle slice.

**Fail-closed behavior:** supplied wrong native stamp/context/producer/item/price, reused removal/effect, duplicate /
pre-existing registration, conflicting success/cancel/reject/failure, wrong world link, wrong actor family/owner/index /
scene, inactive/dead/unfinished created actor, false registration or supplied restore contradict completion. Native
terminal/creation conflicts are inspected before requiring physical removal, so a missing interval cannot mask them.
The rejection projector now forbids attributed completion authority on stamped rejected application and unstamped
rejected admission. Any diagnostic failure suppresses completions, rejections, payments, operations and mutations while
retaining raw facts. Missing older boundary state stays an explicit gap, with no invented resource or useful-effect record.

**Implementation review / Omission Audit:** source-traced actual queue removal -> shared component/spawner/service
call -> exact returned object/new research -> real index/service callback -> native terminal -> normalizer -> existing
runVariant/report/evaluator. Reviewed successful/absent/throwing creation, missing service/owner, canonical variants,
registration ordering and duplicate/reuse fences, unchanged async continuation, legacy callers, restore, bounds and
cleanup. Added explicit compound filter discriminants and checked independent callback/terminal timestamps. Source
review repaired the rejection consumer to recognize newly introduced completion facts and moved terminal contradiction
inspection ahead of missing-removal handling. New specs use existing Jest/default Playwright discovery. No mandatory
oracle, full evidence gap, recipe, coverage denominator, source baseline, price/refund rule or relay schema was weakened.

**Separate Final Closure Audit:** after source repairs, rechecked all five acceptance items, immediate native/report /
rejection consumers, detached live-handle/item/index/tech projection, explicit null/gap ownership and task-owned scope.
Source owners remain split by responsibility; no baseline refresh or automated size/format check. Shared Phaser mock
Events.EventEmitter/GameObjects.Events lifecycle omissions remain prior unverified debt. No policy/skill/tool change,
model switch, agent/thread/worktree/branch/PR creation or issue closure. Every executable check remains deferred.
Publish this coherent actor/tech authority batch normally, verify local/remote SHA and pause; no release readiness claim.

**Next grouped authoring:** exact cancellation request/application/removal/refund lifecycle with the original purchase
and distinct accepted cancel execution; removed per-tick ownership and actual shared per-tick refund lineage. Continue
fair ready/reachable producers, stable useful products/tech, actual runtime price/duration/effective-level catalog and
paired setup, legal Skaduwee research producer and strategic AI cancellation/transition worlds. Keep compatible
PRO-03/06 pairs together. Recommend **GPT-6.1 Sol / high** for the remaining cross-authority contracts; this is judgment,
not an automatic switch. Actual active settings are unavailable. [OpenAI Docs](https://developers.openai.com/api/docs/models/gpt-6.1-sol)
was searched and opened for this recommendation and supports high effort.

Add these **unrun proposed commands** to the final gate alongside prior rejection/physical/payment/progress/decision /
preset/pending/digest/oracle/map/multiplayer checks:

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='observe-queue-completion-authority|ai-runtime-completion-capture|mutate-shared-queue-item|ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-completions.spec.ts skirmish-ai-runtime-production-rejections.spec.ts skirmish-ai-runtime-production-queue-mutations.spec.ts skirmish-ai-runtime-production-operation-projection.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Review merged Nx 23.2.1/Jest 30.3.0/Phaser 4.2.1 flags/dependencies at that gate. All tests/E2E/simulations, format/lint /
type/build/editor/schema/repository checks and doctor/context/catalog commands remain deferred. Native helper/capture
runtime compatibility, source structure, capture/report pressure, actual bootstrap and both-faction strategic outcomes
remain final-gate obligations.

## Production cancellation lifecycle checkpoint (2026-10-05, unverified)

**Scope/provenance:** #815/#816 PRO-03/06/07 native cancellation/refund lifecycle and removed per-tick queue-claim
ownership. Base `0101ef0e32491bdb181e490c45639672cd9bfd70`; integration worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`. Nx migration preserved.
This is a diagnostic authoring slice, not full RuntimeProductionEvidenceV1, useful strategy or executable acceptance.

| Acceptance | Owners / consumers | Status / evidence |
| --- | --- | --- |
| 1. Exact native refund policy | validateRuntimeQueueRefundPolicy, normalizeRuntimeScopedQueuePayments and production causality normalizer | Authored/unverified: immediate production full-factor refund, research/per-tick remaining-progress refund, actual scoped triples and stored vector, no cumulative credit. |
| 2. Complete cancellation lineage | RuntimeProductionCancellationV1, matchRuntimeCancellationPaidLineage, projectRuntimeProductionCancellations | Authored/unverified: selected purchase/insertion/payment -> distinct accepted cancel -> actual removal/refund -> both native terminals, separate request/application/observer times. |
| 3. Removed claim ownership | hasRuntimeRemovedQueueOwnership, reconcileRuntimeProductionUnspent, shared physical boundary validator / extracted balance helper | Authored/unverified: exact observed prefix, native price/insertion/removal, current absence, completion exhausted-head or distinct cancel admission. Missing authority null; global/non-queue/restore unsupported. |
| 4. Consumers / negative contracts | Existing runVariant/report/evaluator; cancellation and removed-ownership specs, per-tick fixture and repaired existing fixtures/specs | Authored/unrun: production/research/per-tick, true paid-progress chain, missing/contradictory/reused/restore authority, native order, no snapshot/tombstone substitution or full-evidence credit. |
| 5. Review / closure / publication | Source-only implementation review/Omission Audit, separate Final Closure Audit, HANDOFF and exact staged scope | All execution deferred. Publish this coherent slice, verify remote SHA and pause. No issue/family or final gate is complete. |

**Source authority and preserved behavior:** QueueCommandSystem forwards the real applied cancel. QueueComponent
production removes the actual selected item, reports its original purchase cancelled, invokes the native refund and
then the cancel command system reports its separate cancelled outcome. Research refunds its physical head first,
then removes it and reports the original purchase cancelled before the distinct cancel terminal. Delivery observation
may follow synchronous gameplay callbacks. The normalized record retains the actual accepted native scopes and
physical/refund/terminal order; no synthetic applied outcome is added to cancel commands. Gameplay owners, queue
selection, stored prices, refunds, native terminals, score, save and relay behavior are unchanged.

**Refund correction:** source review found the previous diagnostic treated immediate-paid production like research.
Native ProductionComponent pays `floor(stored price * refund factor)` for immediate payment, independent of remaining
progress. Its pay-over-time branch uses `floor(stored price * (1 - progress) * refund factor)` with one stored vector.
ResearchComponent multiplies its factor by remaining progress first, then floors price times that product. The pure
policy mirror keeps these native floating-point multiplication orders. Actual callback cash must still reconcile at
all resources; the emitted vector cannot be inferred from cumulative charges. The older synthetic production refund
fixture now credits 7 rather than 4, and records both native cancelled reasons; research keeps progress credit 4.
Per-tick refunds are normalized separately from their successful tick charge intervals. No shipped balance fix implied.

**Paid lineage and physical ownership:** a cancellation needs exactly one actual validated insertion with the same
item, stored price, product/payment/time, and an actual preceding immediate charge. Per-tick cancellation additionally
walks the captured real 50 ms attempt chain from full insertion time to removed remaining time and links every advanced
attempt to its validated actual charge operation. Missing history or no observed paid work remains a gap, even when
native credit/terminal exists. Neither later cash nor a fixture expectation supplies paid work. Removed queue-claim
ownership is independent of usefulness: exact current absence and a complete prefix physical interval can retire that
subset before its later native terminal. Completion requires the true advanced exhausted head; cancellation requires
its separate accepted/admitted command. No retained old head or nearest snapshot is used. Balance validation was
extracted with compatibility re-export to avoid a dependency cycle; full all-lane physical liability arithmetic is reused.
Raw capture limits, global gaps, unsupported ownership and the separate full production evidence requirement remain.

**Failure/gap boundaries:** supplied wrong native/item/price/payment/time, conflicting cancel kind/reason/world link,
wrong terminal/refund order, duplicate/refund reuse or restore contradict authority and suppress every normalized effect
array. Native cancel terminal contradictions are inspected even when physical evidence is missing. Missing older
physical/refund/paid/terminal authority remains named, without invented lifecycle/effect credit. Original raw/global gaps
stay attached. A sound narrow cancellation does not prove useful distinct replacement, stable tech/product value,
fair reachability, effective levels, complete reservations, paired setup, actual AI cancellation policy or both factions.

**Implementation review / Omission Audit:** traced real queue command -> component -> native physical mutation /
refund -> separate terminals -> scoped triple/progress/claim projection -> normalized lifecycle -> existing variant
report/evaluator. Inspected immediate versus per-tick production and research formula/order, same-item paid progress,
current physical absence and prefix boundaries, original/native selection, legacy/missing state, restore, reuse, failure
suppression and report ownership. Repaired the old fixture's native cancelled reason, policy-specific credit and
terminal kind, explicit compound filter narrowing, research floating-point order and restore boundary guards.
All new specs use existing default Playwright discovery. No new runtime listener, persistence format, global claim
owner, strategy, recipe, oracle relaxation, denominator change, source-baseline refresh or package/config change.

**Separate Final Closure Audit:** after source repairs, rechecked all five acceptance items, actual native owner
semantics, immediate consumers, meaningful positive/missing/negative specs, null/gap contracts, compatibility exports,
responsibility/file/function boundaries, and exact task-owned staged scope. Evidence is authored/source-reviewed only;
no automated size/format/type/test/runtime check. Shared Phaser mock debt remains prior unverified work. No policy /
skill/tool/model switch, agent/thread/worktree/branch/PR creation or issue closure. Publish normally, verify the remote
branch SHA and pause at this slice; retain the final release gate.

**Next grouped authoring:** capture fair ready/reachable producers, actual runtime price/duration/effective-level
catalog, stable useful products/tech and paired setup/initial paid-item provenance into full RuntimeProductionEvidenceV1.
Complete actual cadence/navigation/threat/lease ownership; keep global/non-queue/migrated/pre-capture/restore claims
null until their real authorities exist. Then legal Skaduwee research setup and useful strategic AI worlds, grouping
compatible PRO-03/06 pairs. Recommend **GPT-6.1 Sol / high** for cross-authority implementation without another switch;
actual active model/effort is unavailable. [OpenAI Docs](https://developers.openai.com/api/docs/models/gpt-6.1-sol) was
searched and opened; high effort is supported. The recommendation is judgment, not an automatic switch.

Add these **unrun proposed commands** beside the prior completion/rejection/physical/payment/progress/decision /
preset/pending/digest/oracle/map/multiplayer final-gate checks:

```bash
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-cancellations.spec.ts skirmish-ai-runtime-removed-queue-ownership.spec.ts skirmish-ai-runtime-production-completions.spec.ts skirmish-ai-runtime-production-queue-mutations.spec.ts skirmish-ai-runtime-production-operation-projection.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

Review merged Nx 23.2.1/Jest 30.3.0/Phaser 4.2.1 flags/dependencies at the final gate. All tests/E2E/simulations,
format/lint/type/build/editor/schema/repository checks and doctor/context/catalog commands remain deferred. Actual
runtime native policy/creation/claims, tooling/module compatibility, shared mocks, capture/report pressure, legal
bootstrap and useful both-faction strategic outcomes still require executable evidence.

### Production owned world/setup checkpoint (2026-10-05, unverified)

**Scope/provenance:** grouped #815/#816 PRO-03/06/07 diagnostic authoring, beginning at
`56bd5e53e73afdd9c043fd1c99d2cec746e31825`, integration worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
The containing commit owns this batch; verify its remote SHA on resume. The unrelated Nx merge `59f72e037` is preserved.
Actual model/effort is unknown. User-authorized comment edits remain permitted. All executable validation is deferred.
This closes the bounded authoring slice only, not full production evidence, useful strategy, family or issue acceptance.

| Acceptance | Implemented owners / consumers | Evidence / status |
| --- | --- | --- |
| 1. Actual bounded owned readiness/options and native price versus level | Phaser `capture-ai-runtime-production-world.ts`, `capture-ai-runtime-queue-catalog.ts`, their typed contracts; `AiRuntimeProductionCapture.captureBoundary` | Source-reviewed. Actual scene/index/owner identity, readiness, component level, base production command price/duration and separately researched level; research-definition cost/duration. No global roster or navigation queries. Authored/unverified. |
| 2. Fair exact-boundary world diagnostics and explicit missing authority | `normalizeRuntimeProductionWorld`, `RuntimeProductionWorldSnapshotV1`, `RuntimeProductionCausalityV1.worldSnapshots` | Exact current owned observation required for positions; stale/missing positions and all reachability stay null/gapped. Contradictory identity/queue/numerics/time/restore suppress all normalized arrays. Authored/unverified. |
| 3. Actual paused setup insertion/payment provenance | `normalizeRuntimeProductionInitialQueues`, `RuntimeProductionInitialQueueV1`, `RuntimeProductionCausalityV1.initialQueues` | Native command/application, physical insertion, full stored item/catalog price and scoped payment join at tick zero. Immediate paid versus unpaid per-tick is explicit; resets and subsequent gameplay cannot replace initial balances. Authored/unverified. |
| 4. Report wiring and meaningful negative contracts | `runVariant` passes its real preset application; normalizer retains both arrays. `capture-ai-runtime-production-world.spec.ts`, world and initial-queue normalization specs, synthetic world fixture | Default Jest/Playwright discovery; authored/unrun. Existing full PRO-03/06/07 evaluator/oracle gaps and denominator stay mandatory. |
| 5. Source audits, cold start and authorized publication boundary | This checkpoint and HANDOFF Quick resume; exact task-owned staging, normal commit/push and remote SHA verification | Source-only audits below. Publication belongs to the containing commit. Pause after verified push; retain Sol/high for the next related authority batch. |

**Native price finding:** `QueueCommandSystem.handleProductionCommand` calls `getPwActorDefinition(actorName, null)`
for the stored production cost. Research can upgrade the resulting actor but does not make the shared command charge
its effective-level cost. The new catalog preserves `priceSource: base_production_definition` separately from
`effectiveLevel`, and uses the existing fixed-clock duration conversion. Research uses the real `researchDefinitions`
price/duration. Actual `ProductionComponent.productionDefinition.availableProduceActors` and
`ResearchComponent.availableResearch` restrict the producer options; they do not establish current-tech eligibility,
affordability, useful strategic demand or accepted admission. No balance values were copied into production code.

**World authority:** raw snapshots preserve same-scene, actual indexed owned actor identity, canonical family,
active/alive/finished state and actual component level. Capture bounds are 256 actors, 512 catalog entries and
128 advertised options per actor; overflow remains explicit. Normalization preserves time-varying producer-scoped
catalogs and actual physical lanes. Position requires the same sampled tick's owned/self committed observation;
future, foreign, hidden or contradictory supplied observations fail, while absent/stale inputs remain null/gapped.
Reachability is always null until actual navigation authority is joined. A ready actor is not a stable useful product,
a safe site, a served demand or a full-oracle snapshot. Full construction catalog/cadence/threat/exposure remains open.

**Initial queues:** the existing real `AiRuntimePresetApplicationV1` is passed by the variant runner, never synthesized
from a recipe. Each player's setup application must match exactly one paused physical item, native delivery and one
applied outcome, original execution, item/product/producer/lane, full stored price, command-defined duration/payment,
exact before/after insertion and independently checked all-lane liabilities/cash. Native applied observation follows
insertion. Immediate credit requires the actual full scoped charge triple before insertion and its isolated setup
balances. Per-tick insertion has no payment and is labelled `unpaid_per_tick`; no initial paid-item credit is invented.
Later resource-start resets do not replace the operation balances. Projection reads only tick-zero facts so later
charges/refunds/removals/terminals cannot change initial provenance. Unknown/uncommanded/pre-capture work stays gapped.
Missing setup/tick-zero/insertion/payment produces no item credit; supplied partial/mismatched/duplicated/restore /
wrong-order evidence fails closed. This does not create a paired setup digest or resolve global reservation ownership.

**Implementation Review / Omission Audit (source only):** traced shared command base price, component-advertised options,
tech level/research definitions, index/ownership/readiness, fixed timing, raw settled capture, exact committed position,
real preset native application, physical push boundaries, scoped payment, resource resets, subsequent lifecycle and
normalizer/report/full evaluator consumers. Repaired the base-price/effective-level distinction, isolated tick-zero
history from later same-item facts, required native applied-after-insertion order, execution/world-link/setup actor
mapping and stored-price equality, preserved null reachability, and added duplicate/overflow/hidden/future/restore /
conflicting position-timestamp fences. Synthetic fixtures are explicitly labelled;
no browser outcome, full production evidence, fairness/eligibility proof or gameplay policy is claimed. No reusable
skill/tool/policy change was needed. Shared Phaser mock emitter/lifecycle debt and capture/report cost remain final-gate work.

**Separate Final Closure Audit (source only):** acceptance 1–5 maps to the actual owners/consumer and authored specs.
Source review and exact staged scope establish authoring/publication only. No executable check ran, including automated
format/source-structure validation. New owners are small responsibility-based files with single substantive contracts;
no content-hash baseline was refreshed. Native production/research/queue/payment/cancel selection, score/save/relay and
strategic AI policy remain untouched. Full `RuntimeProductionEvidenceV1`, construction catalog, decision cadence,
fair navigation/threats, stable usefulness, paired setup and global/restore liabilities remain explicit open work.

**Deferred focused commands (unrun; append to the existing final gate):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='capture-ai-runtime-production-world|ai-runtime-production-capture|ai-runtime-completion-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-world-normalization.spec.ts skirmish-ai-runtime-production-initial-queue-normalization.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts skirmish-ai-runtime-production-cancellations.spec.ts skirmish-ai-runtime-production-completions.spec.ts
```

Review Nx 23.2.1 / Jest 30.3.0 / Phaser 4.2.1 tooling and shared mocks before execution. All tests/E2E/simulations,
format/lint/type/build/editor/schema/repository checks and doctor/context/catalog remain deferred. Confirm real paused
bootstrap and both-faction outcomes, complete lifecycle/lease/restore authority, bounded capture/report pressure and
full mandatory oracles at the final gate. Synthetic source contracts do not replace those runtime obligations.

**Next grouped authoring:** actual decision cadence and fair navigation/reachability/threat authority, then stable
useful actor/tech effects and paired setup into full production evidence. Follow with legal Skaduwee research setup
and strategic AI cancellation/transition worlds; keep compatible PRO-03/06 pairs together. Retain **GPT-6.1 Sol / high**
for these cross-authority joins. Official OpenAI Docs searched/fetched this turn confirm complex coding and `high`
support: [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol). The recommendation is a task judgment,
not a model switch or an inference about active settings. Commit/push this slice, verify remote, then pause.

### Production consumed decision input checkpoint (2026-10-05, unverified)

**Scope/provenance:** grouped #815/#816 PRO-03/06/07 diagnostic authoring, beginning at
`66f450a669739c1fe91672671984c2a18e40999a`, integration worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
The containing commit owns this batch; verify remote on resume. Nx merge `59f72e037` is preserved.
Actual model/effort is unknown. Existing comment authorization persists. All executable validation is deferred.
No full production contract, family, issue, cadence guarantee, path or exposure acceptance is claimed.

| Acceptance | Implemented owners / consumers | Evidence / status |
| --- | --- | --- |
| 1. Exact consumed selected-step inputs and real scheduler fields | Phaser `AiDecisionInputV1`, `captureAiDecisionInput`, `PlayerAiController.stepPureBrain`, `dispatchAiBrainResult`, `AiDecisionDispatchEvent`; existing raw selected fact | Listener-gated passive bounded capture; observation/catalog actually consumed, configured interval and completed attempts before selection. Event/raw clones precede ordinary dispatch and debug/state adoption. Empty decisions retained. Source-reviewed, authored/unverified. |
| 2. Fair committed topology/query/threat input with no fabricated reach | `normalizeRuntimeProductionFairInput`, `validateRuntimeProductionFairGraph`, `RuntimeProductionFairInputV1` | Own cached graph generation/status/age, exact owned-to-visible-enemy endpoint checks and visible weapon facts. Remembered opponents excluded from current threats. Producer path and target-specific building range remain null/gapped. Source-reviewed, authored/unverified. |
| 3. Cadence join, missing authority and contradiction fencing | `normalizeRuntimeProductionDecisions`, `RuntimeProductionDecisionV1` | Exact selected identity/input/catalog, configured interval versus observer time and observation age. Catch-up/stale/skips/epochs/prior history retain explicit semantics. Restore, regression, mismatch, invalid topology/time/query fail closed; missing catalog cannot hide supplied graph contradictions. Source-reviewed, authored/unverified. |
| 4. Report consumer and meaningful negative contracts | `RuntimeProductionCausalityV1.decisions`, sole causality normalizer, existing variant report; three new specs and raw capture spec update | Global failures suppress decisions plus world/setup and all normalized lifecycle/money arrays. New controller/input and fair/cadence specs discovered by normal suites, authored/unrun. Full evaluator/oracle/denominator untouched. |
| 5. Audits, cold start and authorized publication/pause | This checkpoint and HANDOFF Quick resume; exact task-owned staging and normal commit/push | Source-only review/audits below. Publication belongs to containing commit; verify remote then pause. Retain Sol/high for related cross-authority joins. |

**Actual input/cadence:** input capture receives the same committed observation used by `pureBrain.step` and the
synchronously paired catalog used by its managers. It adds the controller's actual configured interval (converted
from milliseconds using the fixed-clock constant), completed scheduled attempts before this selected step, current
simulation tick or explicit render fallback, and actual restore flag. The selected event is cloned before shared
command dispatch; the existing capture clones that event in observer order. No new listener/timer/service/scan/query,
save/wire schema or strategic policy was introduced. The helper performs no authority reads when the selected-event
listener is absent. Bounds are 256 actors, 64 access products, 64 actor capabilities, 32 attacks per profile, 512 catalog
entries/unsupported rows, 512 graph nodes/unknown nodes/transfers and 2,048 links. Oversized optional inputs become
null with named gaps, rather than a silently truncated complete world. The raw capture's existing fact-drop fence
continues to fail closed. Report/capture pressure and nested payload size still require final-gate evidence.

`normalizeRuntimeProductionDecisions` retains selected sequence/tick, native pure identity, scheduler fields,
observation age, paired capability catalog and fair input. Configured interval is not measured execution spacing:
same-tick catch-up and stale consumed observations can occur after asynchronous pre-tick work. Repeated/regressing
pure decisions or controller attempts, changed same-epoch cadence, foreign/future/mismatched observations/catalogs,
restore, invalid graph/query/weapon facts and bad observer order fail closed. Skipped attempts, missing input/catalog,
render fallback, initial unknown history and authority changes stay explicit gaps. Missing metadata is never supplied
by a later settled checkpoint. Missing catalog/observation does not hide a supplied contradictory graph.

**Navigation/threat finding:** `AiObservationPipeline.projectAccessProducts` delegates to `projectAccessProduct`.
That publisher names exact owned-source/current-visible-enemy pairs and checks whether each endpoint is traversable;
it returns `not_ready`, `unknown`, `blocked` or `service_failed`, and has no branch that produces `ready` or a complete
path. Those statuses are retained verbatim. A graph node assignment, cached ready graph, blocked endpoint or input
labelled ready is never converted to a producer reachable/safe boolean. Cached graph generation differs legitimately
from observation generation; pending/old graph status/age remains visible. Query revision is its own invalidation
revision, not guessed from graph generation. The fair projector validates actual pair IDs, node endpoints, domains
and observation-time query stamp, without requerying navigation or accessing live opponents.

Current visible enemy positions and attack profiles come only from the consumed observation. Last-seen opponents
never supply exposure, live cooldown or current weapons. Missing profiles/positions stay null, not zero. Base range,
minimum range, targeting domains and high-ground bonus remain separate weapon facts. The shared runtime picks a
specific attack against a target and applies actual elevations; this batch deliberately leaves `buildingRange` null
until target-specific authority is joined. Full producer construction/spawn/service reachability remains open.

**Implementation Review / Omission Audit (source only):** traced fixed-clock scheduler catch-up, pre-tick commit,
pure selection, manager catalog, host fence, listener-free dispatch, event/raw detachment, ledger consumers, report
retention, permitted graph/access publisher and visible/remembered combat projection. Reviewed compatibility with
legacy selected fixtures and ordinary human captures. Source review caught an existing fixture-name collision;
restored the original decision-lineage fixture verbatim and placed new data in
`skirmish-ai-runtime-production-consumed-decision-fixture.ts`. Added current/stale/same-tick/empty/overflow/fallback /
restore/cadence-regression/skipped-attempt, hidden/foreign/future/duplicate/malformed weapons, pending/missing graph,
invalid endpoints/query owners/timestamps and partial-missing-input contradictions. Tests are authored/unrun; no
synthetic object proves a useful real decision or fair legal world. No skill/tool/policy change was needed.

**Separate Final Closure Audit (source only):** acceptance 1–5 maps to concrete owners/consumers and authored specs.
Source review supports authoring/publication only. No executable validation ran, including automated source-size /
format/module/type checks. New owners are bounded responsibility-based files with single substantive contracts;
no content-hash baseline was refreshed. Existing lineage fixture and native queue/payment/cancel/save/relay/score /
strategic policies remain intact. Full cadence closure, producer navigation/placement/exposure, construction catalog,
stable usefulness, paired setup, global/restore claims, full evidence and both-faction AI outcomes remain open.

**Deferred focused commands (unrun; append to prior final-gate commands):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='ai-runtime-decision-input|dispatch-ai-brain-result|player-ai-controller.spec|ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-production-decisions.spec.ts skirmish-ai-runtime-production-fair-input-normalization.spec.ts skirmish-ai-runtime-production-decision-lineage.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts skirmish-ai-runtime-production-world-normalization.spec.ts
```

Review Nx 23.2.1/Jest 30.3.0/Phaser 4.2.1 flags/dependencies and shared Phaser mock Events/lifecycle debt at the final
gate. All tests/E2E/simulations, format/lint/type/build/editor/schema/repository and doctor/context/catalog commands
remain deferred. Real cadence, bounded capture/report pressure, legal bootstrap, stable usefulness, both factions,
full PRO-03/06/07 oracle/denominator and multiplayer parity need executable evidence.

**Next grouped authoring:** target-specific shared producer navigation/placement and building attack/elevation
authority, then stable useful actor/tech effects and actual paired setup into full production evidence. Follow with
legal Skaduwee research producer setup and useful strategic AI cancellation/transition worlds; group compatible
PRO-03/06 pairs. Retain **GPT-6.1 Sol / high** for these cross-authority joins. Official OpenAI Docs searched/opened
this turn confirm complex coding and `high` support: [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
The recommendation is task judgment, not a switch or inference about active settings. Commit/push, verify remote, pause.

### Production spatial/exposure checkpoint (2026-10-05, unverified)

**Scope/provenance:** grouped #815/#816 PRO-03/06/07 authoring from
`9c7f09ee76365fe147fbb7b2e97f731aab387c5c`, integration worktree
`/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`.
Containing commit owns publication; verify remote on resume. Nx merge `59f72e037` is preserved.
Actual model/effort is unknown. Comment edits/moves remain authorized. All executable validation is deferred.
This is native spatial/input authority authoring, not full production evidence, strategy or family acceptance.

| Acceptance | Implemented owners / consumers | Evidence / status |
| --- | --- | --- |
| 1. Native placement/spawn results | applySharedConstructionCommand, emitConstructionPlacement, ProductionSpatialAuthorityEvent, spawnProductionActor | Actual already-computed footprint verdict before destruction/assignment; actual ground/water/null spawn tile before creation. Shared service retains lifecycle owners. Authored/unverified. |
| 2. Existing native builder-route intervals and cleanup | AiRuntimeProductionSpatialCapture, AiRuntimeProductionSpatialV1, existing raw capture/fact union | One original service invocation and exact Promise/result/rejection; owned builder/owned construction targets only. Real request/resolution clocks, restore/scene/index bindings, bounded loss and disposal. No new query. Authored/unverified. |
| 3. Native spatial/command joins and report fences | normalizeRuntimeProductionSpatial, matchRuntimeConstructionPath, RuntimeProductionSpatialAuthorityV1, causality normalizer/report | Separate legal/illegal footprints, spawn choices and requested/resolved paths. Exact native site/builder/delivery/application. Intended time differs from actual application time. Missing authority stays gapped; contradictions suppress all normalized groups. Authored/unverified. |
| 4. Target-specific fair shared weapon/elevation authority | AiDecisionProducerExposureV1, captureAiProducerExposure, captureAiDecisionInput, normalizeRuntimeProducerExposure, fair input normalizer | Current consumed input only; shared visibility, indexed identity, current tile/base elevation and exact weapons. Native selected attack/positioning range and geometric band kept separate; no hidden cooldown or safety credit. Authored/unverified. |
| 5. Negative contracts, review, cold start and publication | Four new Phaser specs, two new Playwright specs plus spatial fixture; existing raw capture spec update; HANDOFF | Tests authored/unrun. Source review/Omission Audit and separate Final Closure Audit. Exact task-owned publication/pause remains required. |

**Native spatial ownership:** the shared constructor previously combined scene subscription/state ownership with
construction application. Its existing application body now delegates to a bounded responsibility owner while
retaining site reconciliation, addressed-builder/owner/activity/eligibility/cash gates, native creation, footprint /
collision checks, assignment, native outcomes and completion/destroy subscriptions in the same order. The boolean
footprint expression is evaluated once with the same short-circuit behavior; the local listener-gated event observes
that verdict before destruction or assignment. The changed service's content-hash baseline entry was removed, not
renewed. No queue/resource/cancel selection, save/relay schema, strategic policy, recipes or packages changed.

Production's spawner retains its native water nearest-tile versus ordinary around-building choice, tile-to-world
conversion and original creation/completion/rally timing. Its local event observes that result with the actual removed
item before creation. A null choice remains no spawn; a tile supplies no producer-to-objective route or created actor.

The existing marked-test capture owns a spatial observer. Its instance-level navigation wrapper filters actual owned
builders and owned construction targets, captures the input boundary, calls the original native object-target path
method once with the same receiver/arguments, attaches an observer and returns the original Promise. Null versus empty
returned paths, rejection and synchronous throw remain distinct. Observer-only Promise errors cannot replace the
native result; a missing return leaves the request explicitly unmatched. Disposal removes its event listener, fences
pending continuations and restores only its own wrapper, preserving later replacements. It adds no route query,
movement order, timer or saved state. Ordinary games have no installed wrapper; native events have a listener-free path.
Bounds: 128 footprint tiles, 512 path tiles and the unchanged 8,192-fact ledger. Loss is null plus named gap, never a
silently complete subset. Diagnostic current-visibility rechecks and observer/report pressure remain unmeasured.

**Native normalization and remaining route boundaries:** paired path intervals use actual scene-local IDs, source /
target index identity, owner, requested radius, observer sequence and fixed clocks. Foreign/regressing/orphan/duplicate /
restore/malformed path, footprint or spawn values fail closed. Null path stays not-found, empty success remains empty,
and pending/failed/overflow requests remain gaps. Moved/index-lost actors or cross-tick awaits deny current binding;
unchanged endpoints across ticks cannot prove there was no intermediate restore/topology change. The native service
also caches paths; no navigation revision is captured here. All returned paths remain native query diagnostics,
not complete fresh topology, service/output-route or global producer-reachable/safe verdicts.

A route joins native construction only through its exact owned target and addressed builder, a captured earlier legal
footprint, one native command delivery with matching payload/execution identity and a real applied outcome naming the
same site/builder/epoch. Application's actual observer tick matches placement, and can be later than the intended
command tick. Delivery/application must precede the route result; missing placement clocks or live index binding
cannot supply a join. Missing clocks also cannot hide contradictory spatial values. Initial, repair, pre-capture and
missing-application routes have no guessed construction link. Construction
AI accepted-decision lineage, full construction catalog, producer service/output routes, navigation revision/history
and full production evidence remain next work; mandatory gaps and full PRO-03/06/07 oracles are intact.

**Target-specific exposure:** capture is reachable only after the existing decision-listener gate. It requires the
actual simulation tick to equal the consumed observation tick, no restore, current permitted visible contacts,
exact indexed object/name/owner/scene/current tile/base-z/representable binding, finished non-flying owned producer
components and an exact consumed weapon vector. No remembered/hidden actor can repair missing profiles. Pair cardinality
is at most 256; overflow yields no pairs and an explicit gap. Native AttackComponent.getAttack chooses the actual
highest-damage first-declared weapon; getAttackRange can instead prefer longer effective range among equal-damage
weapons. Both results are retained. Shared high-ground helpers use actual representable elevation including flight;
DistanceHelper retains the native floored 3D tile distance. Enemy cooldown remains private.

`withinSelectedWeaponBand` checks positive damage, minimum range and that selected weapon's effective range. It is
geometric diagnostic information, never proof that a native order/path/cooldown/stun allows an attack. The existing
pawn's positioning/range behavior is not changed. A threat has no one range for all buildings; scalar buildingRange
remains null, with target-specific pairs separate. Missing/unavailable pairs cannot prove safety. Readiness/useful
resilience, stable effects and full oracle exposure integration remain open.

**Implementation Review / Omission Audit (source only):** acceptance 1–5 traced shared application/delegation,
short-circuit footprint checks, actual spawner, existing MovementSystem/native radius path, query cache, fixed clock,
raw observer ordering, synchronous/native Promise preservation, teardown, actual attack choice versus positioning,
shared visibility/elevations/distance, exact consumed profiles and every normalized consumer. Source review repaired
an overly strict application-time join (actual time is not intended time), a local field-renaming collision with
minRange, typed production test input, strict array-index guards and long expressions before publication. The final
review fenced future delivery/application, mismatched canonical site names and malformed values with missing clocks.
These were source findings, not
executed failures. Native negative specs cover legal/illegal/reconciled placement, ground/water spawn, null/empty /
oversized/failed paths, original Promise/throw identity, delayed disposal, current/hidden/stale/restored/changed
weapon/position binding, equal-damage choice, high-ground threshold and minimum band. Synthetic normalizer specs
cover native joins, missing setup, moved/cross-tick paths, invalid ownership/time/values and complete suppression.
No synthetic shape proves actual legal map/bootstrap, strategy or stable production. No skill/tool change was needed.

**Separate Final Closure Audit (source only):** after source repairs, concrete owners/consumers and authored tests
cover this native capture/normalization slice. Source responsibilities are bounded; one substantive contract per file,
no baseline refresh. Required full evidence/oracles/denominators remain intact. All executable tests/E2E/simulations,
format/lint/type/build/editor/schema/repository and doctor/context/catalog checks remain deferred. Exact staging,
normal commit/push, remote verification and pause close publication only. No issue/family or release gate is complete.

**Deferred focused commands (unrun; append to prior final gate):**

```bash
NX_DAEMON=false pnpm exec nx test probable-waffle-phaser --testPathPatterns='capture-ai-producer-exposure|ai-runtime-production-spatial-capture|apply-shared-construction-command|production-spatial-spawn|ai-runtime-decision-input|ai-runtime-production-capture' --skip-nx-cache
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts skirmish-ai-runtime-producer-exposure.spec.ts skirmish-ai-runtime-production-spatial-normalization.spec.ts skirmish-ai-runtime-production-decisions.spec.ts skirmish-ai-runtime-production-fair-input-normalization.spec.ts skirmish-ai-runtime-production-causality-normalization.spec.ts
```

At that gate, review flags/dependencies against merged Nx 23.2.1/Jest 30.3.0/Phaser 4.2.1, shared Phaser mock
Events/GameObjects lifecycle debt, module/type/format/structure compatibility, bounded listener/Promise/report cost,
actual map/bootstrap, native topology freshness and both-faction production effects. No check was executed here.

**Next grouped authoring:** stable useful actor/tech effects, construction AI decision lineage, complete construction /
producer route/history authority and actual paired setup into full production evidence; then legal Skaduwee research
producer setup and useful strategic AI cancellation/transition worlds. Group compatible PRO-03/06 pairs.
Retain **GPT-6.1 Sol / high** for these related cross-authority joins. Official OpenAI documentation searched/opened
this turn supports complex coding and high effort: [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
The recommendation is task judgment, not a switch or an inference about active settings. Commit/push, verify remote, pause.
