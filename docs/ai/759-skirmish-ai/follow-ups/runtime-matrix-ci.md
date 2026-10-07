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
