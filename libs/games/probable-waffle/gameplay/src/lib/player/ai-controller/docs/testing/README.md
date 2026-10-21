# Skirmish AI testing

## Evidence layers

| Layer                   | Purpose                                                                   | Location                                              |
| ----------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Unit/pure Jest          | Reducers, managers, contracts, serialization and semantic oracles         | `gameplay/src/lib/player/ai-controller/**/*.spec.ts`  |
| Phaser integration Jest | Observation, command application, outcomes, saves and runtime driver      | `phaser/src/lib/player/ai-controller/**/*.spec.ts`    |
| Real runtime Playwright | Lobby launch, Phaser ticks, real commands, world effects and match result | `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts` |
| Matrix/report tooling   | Coverage, provenance, grouped execution and compact failure reports       | `tools/ai/`                                           |

An authored fixture or planner trace is not runtime evidence. A runtime case must launch the actual game world and measure authoritative outcomes independently of the planner's explanation.

Fixture JSON and typed builders are inert data until a Jest or matrix/Playwright runner registers and executes them.
Their assertions are deterministic code and require no LLM evaluation or manual judgment. Unmapped fixture metadata is
not automated coverage.

Native recipe specifications can be authored before their execution bindings exist. The manifest's
`runtimeRecipeDraft` links a case in `tools/ai/fixtures/native-scenario-recipes.json`: legal-world requirements,
opponent/fault actions, sampling ticks and finite ceiling, independent native measurements, required and forbidden
outcomes, control branches, reusable owners and specific missing harness bindings. These are authoring contracts,
not interpreted test programs. Every case is `authored_not_executed`; the ordinary matrix continues to report its
runtime fixture as missing. The catalog/inventory show authored specifications separately from executable recipes.

To promote a specification, implement its concrete paused-world bindings and native action/evidence/oracle path in
the existing driver or real multiplayer/replay harness. Resolve each named `executionBlocker`, preserve every required
and forbidden branch, then register an actual runtime fixture and remove that row's draft reference. Registration
still does not imply execution or passing. Do not turn unmet hooks into skipped assertions or generic command-count
checks. A missing map/capability, history gap or exhausted deadline cannot pass. The four #822 island-content rows
and user-deferred H-21 larger-unit native clearance remain explicit deferrals rather than receiving fake coverage.
H-23 separately includes user-authorized island establishment in a small native water-enclosed preset; this does not
claim the public island map or broader deferred content is complete.

Source review and catalog generation establish neither executable nor behavioral correctness. Keep source-specific
execution evidence separate, and never carry an earlier passing tool/native count onto changed source automatically.

Island establishment is created by the existing transport manager from permitted offshore resources, local exhaustion,
available builder/protection and an affordable definition-backed service. The saved purpose protects the eventual
deposit cost from unrelated AI spending; normal shared resource admission/payment takes over when construction is
committed. Survival can use that policy hold. No hidden source lookup, fixture-supplied plan or extra payment is used.
Native controls require physical boarding, landing, paid construction and delivered island income. Optional passengers
may be released at the original readiness threshold; missing indispensable passengers still block departure.

### Native scenario bindings and bounded lookup

Native bindings use tools/ai/native-scenario-bindings.json for original obligations/branches/ceilings and
native-scenario-registration.mjs to author ordinary matrix fixtures. Existing world layout/world factories own
construction/scouting/combat inputs; native-strategic-worlds.mjs, native-domain-worlds.mjs and native-classic-worlds.mjs
own the remaining mission/domain/classic inputs. native-authority-worlds.mjs owns H-06/H-07/H-10/H-13–15. skirmish-runtime-native-scenario-fixture.mjs refuses source-controlled
recipe/assertion drift. Read only the selected ID and its factory, not every generated fixture.

The normal evaluation dispatches through apps/portal-e2e/src/e2e/skirmish-ai-native-scenario-evaluation.ts to the selected
family reader. Full-case branch/faction comparisons live in skirmish-ai-native-scenario-pairs.ts. Physical hits,
applied effects, paid output, exact service and original-destination arrivals are distinct from selected claims or
receipts. Missing/truncated history and ambiguous spell/weapon attribution fail; no complete projectile trace is claimed.
These62 bindings/400 faction-control variants are authored unrun. Native setup, timing and outcome correctness remain
unmeasured until an authorized gate. New recipes must keep unavailable premises separate from AI behavior failures.

Only Tivara offers current ships; real boat landing/escort uses that faction. Native hostile ship cases use the existing
three-spawn map and a third Tivara opponent through the ordinary lobby, never a foreign prefab or synthesized player.
Initial team and actual defeat support retargeting; no in-match diplomacy command exists. Recipes retain that explicit
unsupported limit instead of claiming a dynamic diplomacy transition. Island content remains outside these land controls.

Board/unload controls use normal shared commands. Optional routeOutages are finite original-actor query faults, applied
only after navigation readiness; an actual interception result is required. Expiry/shutdown restores owned methods and
fences retained wrappers without overwriting later hooks. Faults neither corrupt geometry nor establish strategic defeat.
Early finishing accepts only an authoritative score win with its actual tick sealed in both native histories; generic
history checks retain the full declared horizon. Paid output and physical arrival may not borrow post-horizon events.

Explicit captureCombat retains bounded oracle-only sight, transport/team state and native operations in the existing
observer. Initial houses/unarmed carriers join lifetime proof only under that explicit combat capture.
Ordinary gameplay receives no fault hook or combat listener. Additional opponent reads omit the shared recipient
ledger retained once by the AI record. Raw proof stays local; use the existing maximum8192-byte model-facing summary,
then narrow projections only when needed. No LLM evaluates raw reports or decides whether an assertion passes.

### Native construction and continuation bindings

Preset `constructionOrders` issue ordinary shared Construct commands while the scene is paused at tick zero.
Each declaration names a unique site role, compatible owned builder roles and a logical world position. The normal
isometric conversion and shared construction owner enforce eligibility, cost, footprint, collision and assignment.
Setup then binds the actual applied command/world-link/site identity; a receipt without an indexed native site fails.
No finished prefab, paid state or construction progress is substituted. Limits are eight sites and eight builders
per site; a worker cannot start two construction duties or both construction and gathering.
Initial queue seeds cannot address a construction-created site because native queue seeding precedes these commands.

`cancel_unfinished_site` pins an original role and uses native unfinished-site teardown/refund. It refuses a finished,
missing, dead or replacement site. This developer test action is not a newly supported relayed multiplayer cancel
command. Scheduled combat losses still use native damage and retain their original pinned identities.

The standalone [construction worlds](../../../../../../../../../../apps/portal-e2e/src/e2e/skirmish-ai-construction-worlds.spec.ts)
are explicitly opt-in with `AI_CONSTRUCTION_WORLD_E2E=1`: builder loss, intact work and cancellation. They use the
ordinary lobby/frame driver and the existing native capture behind `captureConstruction: true`. Their oracle joins
the same site to actual start/payment/completion, sealed intervals, loss/removal and surviving worker orders; cancellation
also needs one native refund and a useful subsequent effect for that worker. Missing/dropped/unclosed history fails.
The summary has bounded failure details and explicit omission counts; raw proof uses existing single-copy storage.
These are Tivara owner controls, not full PLACE-03 corridor, all-faction, fortification or multiplayer acceptance.

Preset `protectedRoutes` declares fixed world endpoints, an owner and a conservative static tile margin0–2. It requires
explicit `captureProduction`. The pre-build baseline and each placement reconstruct current geometry with the native
terrain/object/height builders; the live navigation graph/cache is unchanged. The independent prefix reader requires
each actual applied Construct to have its exact earlier same-tick placement/command identity and every declared
route. Bounds:8 routes,16384 cells/search,512 returned path tiles and256 prefix reads; loss/unavailable data fails.
These are static tile envelopes, not actual unit/collider transit, spawn, occupied-defense value or full route history.

The [field placement worlds](../../../../../../../../../../apps/portal-e2e/src/e2e/skirmish-ai-field-placement-worlds.spec.ts)
are opt-in with `AI_PLACEMENT_WORLD_E2E=1`, one safe-room branch per faction. Ordinary workers and zero initial food
must create multiple new paid completed fields, an aligned pair and food delivered from each, without using reserved
baseline lanes. Fields are walkable, so reserved-space exclusion is separate from route reachability. Attribution
requires positive native extraction, the next offered cargo and exact successful transfer to a usable owned deposit;
source changes/restores cannot borrow a later credit. These authored unrun worlds do not close PLACE-01 constrained
room, threatened alternatives, full physical transit or any expansion/fortification branch.

### Native expansion and physical fortification controls

The [expansion worlds](../../../../../../../../../../apps/portal-e2e/src/e2e/skirmish-ai-expansion-worlds.spec.ts)
use explicit `AI_EXPANSION_WORLD_E2E=1` opt-in when execution is authorized. Both factions get ordinary land expansion,
already-served, home-pressure, pressure-withdrawal and native combat-recovery branches. Inherited neutral resources require exact position
bindings and native resource components; stock setup changes their actual pre-tick values without claiming extraction.
No completed opening, AI knowledge, construction progress, payment or income is injected. Native accepted expansion,
available original builder, physical arrival, actual completed paid deposit and exact economic-worker wood delivery
into that same deposit must agree. Native WorkMill or faction main service is eligible; another main is not compulsory.
Served controls require delivered income, while pressure controls require real attack/damage/survival and suppression.
Actual withdrawal or native AI-owned lethal damage and original attacker loss must precede resumed service.
The [EXP-02 matrix fixture](../../../../../../../../../../tools/ai/fixtures/expansion-pressure-runtime.json) now registers
eight worlds: both factions × safe/home-pressure/withdrawal/combat recovery. It requires sustained fair danger,
serious native damage to the surviving original home, suppressed remote spending and productive service after recovery.
Withdrawal also requires at least one surviving attacker to finish its actual retreat.
The safe counterpart must commit an actually productive deposit at a matching danger decision tick. Strict fixture
checks preserve shared economic inputs and reject scripted destruction or withdrawal in the combat-only branch.
Registration is authored unrun; a diagnostic individual world cannot supply full paired acceptance. Full EXP-01
utility/lease/concurrency and content-gated island establishment remain separate obligations.

The [fortification access worlds](../../../../../../../../../../apps/portal-e2e/src/e2e/skirmish-ai-fortification-access-worlds.spec.ts)
use `AI_FORTIFICATION_WORLD_E2E=1`. Human-owned native prefab geometry on the frozen open map isolates stairs
present/missing, worker/army passage, a sealed ring and a pinned real wall breach. Shared movement must physically
reach its original native tile; elevated occupancy must match actual wall height in closed history. A receipt,
native true return, fallback endpoint or planner graph alone cannot pass. AI construction prefixes, independent
hostile passage, occupied firing/coverage/value, shore/air and cumulative spending remain separate requirements.

Preset controls add bounded normal `move`, `move_to_actor` and `attack` actions. Owned targets use their actual native
tile; the fixture never sets a moving actor's height or position. Attacks target opposing original owned roles.
An original actor lost before a scheduled action records `unavailable` and emits no command. Controller `applied`
records dispatch; native outcomes still own actual application and independent movement/service effects.

The existing opt-in capture's `captureHuman` handle reads an actual human player's native authority without inventing
AI input or installing a second observer. Optional closed history arms only at paused tick zero and uses the existing
shared frontier owner. Retained disposed handles cannot rearm it. Both native record sets stay local as single-copy
raw artifacts; summaries/assertion messages retain bounded failures and omission counts. The source-delivery reader
joins exact source owner, worker, deposit, resource, time window and successful offered transfer; fields reuse it.

Bound recipes can separately request `captureCombat: true` alongside `captureProduction: true`. Native `ScoreDamage`
then appends detached victim/initiator identities, applied health/armour and native clocks to the existing bounded
ledger. Unmarked captures and ordinary games install no damage listener. The callback is post-application, and native
death/unregistration can precede it synchronously in the same tick. Recovery uses the shared callback sequence as
well as tick ordering. This record does not certify weapon legality or full projectile/impact continuity by itself.
Opponent browser reads omit the duplicate shared recipient ledger already retained by the AI capture.

StateHashService delegates native projection and pure diagnostics to focused owners. Its queue digest includes the
authoritative shared lanes/items, exact remaining work, original paid/refund policy and command lineage, with stable
key order. An explicit empty shared snapshot supersedes legacy lists. Legacy-only records keep their earlier
representation. The queue codec/trajectory controls compare uninterrupted and safely restored work before, during
and after output. Those controls do not certify native UI saves, replay or host transfer. The service also replaces
old subscriptions/hash caches on init and detaches its exact shutdown listener on disposal.

Pure fixtures may declare `pureCases` with exact repository-relative Jest file and assertion-title bindings. The
existing runner selects those files and requires every declared assertion to execute and pass exactly once in its
named file; an incidental ID mention cannot substitute for a missing, skipped or failed binding. Older fixtures retain
their ID-named assertion route. This permits existing semantic controls to serve a scenario without copying or renaming
the tests. The catalog links both ID-named controls and exact bindings.
Each bound case records its authored setup/expectation, `coverage` and `remaining` branches. `owner_contract` means
selected owner evidence and requires explicit remaining work; it does not certify every scenario variant, applied
native world, two-client authority or complete match. Fixture registration and passing bound assertions are separate
from full scenario acceptance. Reports preserve these limits beside the executed bindings.
The bounded summary prints owner-versus-scenario scope counts; `--scenario <id>` projects that case's remaining
branches without loading the raw Jest output into model context.

Raw native authority artifacts stay local in ignored storage and are never model inputs. Start with the existing
summary (`--max-bytes 8192`); if it lacks one causal field, project only that named field and
bounded adjacent checkpoints/actors. Include omitted counts; do not print nested world snapshots or full captures.
Large proof storage does not justify a large model context. H-18 packaging retains complete raw/V2 authority and all
normalized failures while omitting the duplicate normalized diagnostic payload; missing failure declarations fail closed.

Focused economy runtime assertions must verify applied preset balances and independently observed worker orders. For
example, ECO-04's zero-wood labor case requires a ready wood source and an AI-issued Gather order by a finite tick;
fixture-authored starting orders or planner debug text do not satisfy it. ECO-08's separate pure case covers both
factions' two-worker opening bootstrap; its runtime workforce-growth case remains a distinct Playwright obligation.

Recipes with `fixedStepFrames: true` and `simulationTimeScale: 1` drive complete native Phaser headless frames of50ms,
yielding an event-loop turn between frames. Scene timers, physics, pathfinding, pawn trees and shared commands still
run normally. This avoids accelerated render frames consuming many simulation ticks before Promise-based native
actions can settle. Exact final checkpoint ticks alone do not prevent that distortion. The driver sleeps the automatic
game loop and the runner closes its browser context on success or failure; ordinary gameplay is unaffected. Fixed-frame
repeatability does not establish multiplayer equivalence or correctness at arbitrary rendered frame rates.

The paid-supply-loss recipe requires a pinned actual house loss, exactly one completed replacement, and one matched
native completion for every already-paid queue item. A replacement demand, refunded/cancelled item, different producer,
or reused output identity cannot pass. The paired intact-supply control must avoid new housing attempts.

Preset workers must start on actual passable ground outside inherited static building footprints. A worker trapped
inside a main building is an invalid recovery setup, not evidence that native navigation should ignore that building.
Include a checkpoint after the physical completion allowance and before the deadline; a closed-history capture may
advance to deadline+1, which strict checkpoint readers correctly exclude. Native lifecycle timestamps remain the
completion authority. Neither fixing setup nor adding an intermediate sample extends the accepted deadline.

Hidden-state pairs compare complete permitted-observation digests and exact committed intents at each paired
checkpoint until legitimate contact differs. Missing/truncated input fails closed. These test-only checkpoint reads
do not install another gameplay observer. Continuous victory recipes use fixed native frames; ScoreTracker's initial
`quit` value is not an adjudicated terminal result. Only `win`, `loss` or `tie` can stop a terminal-only run early.

`economy-delivery-runtime.json` covers shared cash admission, useful surplus-worker transfer and poor-delivery recovery.
Its bounded existing decision input retains the exact consumed four-resource vector; assertions join native receipts
to actual balance increases and transferred worker identity. This is not complete M11 alias/lifetime authority.
These worlds retain raw capture without duplicating the full production V2 proof. Missing input, history, receipt or
competing priced demand fails the economy reader; a deliberately rejected purchase is not required when the planner
correctly suppresses optional spending before arbitration.

`resource-recovery-runtime.json` starts a real partial pack, destroys its pinned drain, and requires the same worker's
credit at another drain, later extraction from a surviving source, and grown crop credit. Preset `sourceStocks` applies
bounded native source amounts before ticks/orders; it does not inject cargo, income or completion. Initial Gather
orders can target neutral or same-owner sources. Enemy sources remain invalid.

## Native production authority

Full PRO-03/06/07 runtime evaluation consumes `productionEvidenceV2`. Legacy V1 captures and pure oracle controls
remain diagnostic regressions; they cannot satisfy the runtime gate. V2 separates paused actual setup, exact consumed
and selected decisions, operation-time definitions, native lifecycle callbacks and closed physical intervals.

`inputTick` belongs to the consumed observation, `selectedTick` to publication, and `applicationTick` to the actual
callback. Before tick t+1 subscribers run, the native observer captures `closedThroughTick=t` with
`capturedAtTick=t+1`. Later browser polling cannot move an effect backward to its requested checkpoint. Unchanged
physical states coalesce; money callbacks remain individual. Missing coverage, restore, clock jumps, dropped records
and observer failures keep the proof unavailable. The observer detaches on failure and capture/scene disposal.

Only the explicit developer capture opt-in and an armed native horizon install this history. Ordinary matches install
no observer or proof buffers. Setup comparison uses actual indexed actors/components, players, tech, map topology and
runtime content. `pairedPositionRole` permits only a named PRO-06 actor's physical position to differ;
`usefulRallyActorRole` names the owned actor used by the normal rally route. Both refer to checked preset actor bindings.
Fair target-specific weapon pairs, actual builder paths/work, exact unit spawn/rally arrival and covered survival
replace general range/reachability guesses. Missing native authority never becomes a safe/reachable verdict.

`production-authority-runtime.json` authors the eight PRO-03/06/07 branches for each faction. Preset `controls` use
normal shared human commands, including delayed exact-handle cancellation and production probes before/after the
actual refund. Request time never supplies refundable cash. `productionRallies` applies the same ordinary owned
rally to each actual ready producer, including AI-built replacements. Both hooks exist only in opted-in developer
worlds and detach on scene shutdown. They do not alter the AI's cancellation policy or create selected AI records.

`existingActorBindings` names exactly one live indexed inherited actor by owner and canonical definition. Missing,
ambiguous or reused actors abort setup. A binding does not create or move a main base. The paused actual setup remains
the paired-world authority; authored schedules are deliberate later perturbations, not starting-state evidence.
Finished preset initialization can precede deterministic ID registration. Its tick-zero, unindexed, inactive-scene,
non-snapshot lifecycle belongs to initialization, never runtime construction payment or restored work.

An asynchronous owned rally route needs continuous closed actor/tile/level and native navigation history through its
request and terminal boundaries. Equal endpoints alone cannot establish continuity. The path must still join the
actual order, movement arrival and retained product; absent history keeps usefulness unavailable.

The focused `skirmish-ai-production-worlds.spec.ts` runs only with `AI_PRODUCTION_WORLD_HORIZON`. Use horizon 2000 for
the complete local strategic gate and a fresh `AI_PRODUCTION_WORLD_OUTPUT` directory for every run. Shorter horizons
are diagnostics. Per-world summaries and bounded pair inputs support triage; the retained native payload owns proof.
These single runs do not establish repeated determinism, calibration, multiplayer parity or full release coverage.

## Stable commands

```bash
pnpm ai:skirmish-matrix -- --scenario ECO-08 --mode runtime
pnpm ai:skirmish:opening
pnpm ai:skirmish:production
pnpm ai:skirmish:land-sequences
pnpm ai:skirmish:report -- --failures-only --details
pnpm ai:tools:test
```

The Playwright spec is parameterized by the matrix runner. Running its gutter test without `AI_SKIRMISH_RUNTIME_REQUEST` is not a complete scenario run.

Matrix source ownership: `tools/ai/run-skirmish-matrix.mjs` handles CLI selection, replay comparison and report output;
`skirmish-matrix-fixtures.mjs` validates manifest/runtime recipes; `skirmish-matrix-execution.mjs` invokes the pure and
browser drivers; `skirmish-matrix-io.mjs` owns bounded input, source provenance and path helpers. Keep rejection and
report behavior stable when changing these boundaries.

Browser results are retained separately under `tmp/ai-skirmish-runtime-results/`; the matrix report's
`execution.resultArtifact` locates the raw payload. This keeps large native captures out of subprocess logs.
The reader checks source/fixture/dirty provenance and a 256 MiB byte ceiling before accepting the artifact.
Missing, malformed, oversized or mismatched output supplies no runtime evidence. Direct Playwright callers
without an artifact path retain the console result protocol.

A diagnostic-impact sanity check can use existing representative warm runs and installation/cleanup coverage. Record
the observed costs and measurement limits, then stop when there is no clear substantial slowdown. Detailed profiling
below is an investigation technique for a concrete performance problem, not a requirement to certify every diagnostic
hook. Keep gameplay, authority, installation and cleanup correctness tests regardless of profiling scope.

Capture installation and shipping code size are separate checks. The installer rejects production games even with a
matching test marker, and unmarked games have no capture root. Static imports can still keep test-harness modules in
production output. For size evidence, build with `--stats-json=true`, follow the index script/style roots and all static
and dynamic output imports, then gzip each reachable output with the same settings. Report code totals separately from
referenced media such as CSS fonts. Stats input `bytesInOutput` gives raw module contributions; it cannot assign
independent gzip bytes to a module. Record the reachable set and digests.
Compare only runnable, identified revisions with equivalent native worlds and workloads. An isolated empty-observer
method probe can check a fast path, but cannot establish whole-game CPU, allocation or shipping-delta budgets.

A matching simulation seed alone does not make separate lobby launches identical. `ActorIdAuthorityService` also
salts actor IDs with the game-instance ID, which affects actor ordering and command identities. A validated preset
fixes that ID from its seed and `fixtureId`; retain the same preset identity across paired runs and each source's own
provenance. The preset must contain valid authored work. An exact resource start equal to the existing balance can
establish identity without emitting a resource change; an empty preset is rejected. Check the legal roster and full
initial native boundary before comparing later states. Trace the first differing command/outcome when trajectories
diverge: a later gameplay repair can change the workload even when both initial boundaries match. Such runs establish
a causal difference, not paired performance evidence. Keep any behavior-aligned measurement reference explicitly
separate from the original pinned acceptance reference.

Production presets can require `requireFactionRoster: true`. The native bootstrap checks the ordinary indexed world,
authored actors, seeded products and scheduled-loss actor types against each owner's `TechTreeService` faction graph,
resolving concrete variants to their canonical definitions. It checks before actor/money work and again before completing
setup. Each authored position must also resolve through the native isometric converter to an in-bounds tile; rectangular
world-coordinate bounds alone admit positions beyond an isometric map edge. This checks the tile, not whole-footprint
terrain or successful unit spawning. Neutral sources still require a resource-source definition. This is an opt-in so
special diagnostic worlds with owned creatures remain possible. It proves roster membership at setup, not acquisition prerequisites or later mutation
history. Strict recipes name concrete actor variants; the browser verifies every created fixture ID, unique native ID,
created-name multiplicity and owned starting copies. A preset declaration alone cannot satisfy these checks.

`production-authority-runtime.json` groups sixteen physical branches on this map. Its 10× simulation rate keeps the
asynchronous decision loop closer to queue progress; tick deadlines and authority/usefulness assertions stay active.
Check the actual in-bounds world and inherited building footprints when relocating authored armies or objectives.
Physical-world artifacts use `productionWorldStorage: 1`: raw capture, ordinary result metadata and the actual paused
`productionPreset` are retained once. `decodeRuntimeProductionWorld` reconstructs pure joined views from that data;
use the matching source and record the projection revision. Legacy inline views remain supported. Missing capture,
missing required native setup or foreign storage versions fail closed. Expanded joined views are deliberately omitted
from disk because duplicating their shared facts can exceed V8's single-string limit; no native evidence is discarded.
An opt-in production capture has one 12,288-fact aggregate budget. Independent query/order/service identities and
channel budgets retain their 8,192 limits. Root sequence readers use the aggregate cap, and any overflow still refuses
certification. Increasing this test-only bound installs no observer or history in ordinary games.

Consumed combat profiles canonicalize weapon arrays. Exposure capture matches the complete native/consumed weapon
multiset and records the consumed index of the actual native selection, preserving equal-damage native tie choice.
Unavailable visibility, current identity, position, selected weapon or closed binding remains unavailable.
Destroyed target objects retain only their last actually indexed identity in a weak test-capture cache; their current
active/alive/indexed flags are false. Unknown objects never receive invented identity or historical survival credit.

Useful output joins actual purchase/completion, legal spawn, the exact unstamped native rally order, path execution,
original-destination arrival and closed survival. That full join can supply the legacy output labels saying rally
command identity or arrival was missing. Other gaps still refuse usefulness; an absent movement or contradictory spawn
never receives success merely because the legacy labels are recognized.

`production-economy-runtime.json` retains standalone, economically constrained worlds on the frozen economy map for
funding/throughput diagnosis. Its full PRO-03/06/07 oracles remain active. These legal starts do not substitute for the
required transition/abandonment, exposed/safe/low-value/no-demand or shared-queue/pending-refund causal branches.

Scheduled `destroy_owned_actor` events can pin `fixtureActorId` to an authored actor with the same owner and concrete
name. The event owner damages only that original live indexed object, records its native ID and releases both tick
and shutdown subscriptions when finished. If it has already disappeared, it never selects a same-type replacement.
The browser checks the declared event ID, exact tick, type and addressed native ID. Addressed damage is not death
proof; require native removal and later world absence separately. `AI_SKIRMISH_PRESET_LOSS=1` enables the finite
two-faction lifecycle check in `skirmish-ai-test-preset-loss.spec.ts`; it does not certify PRO-06 resilience.

Production transition evidence retains the planner's `fulfilled` and `expired` states. Fulfillment can satisfy the
committed branch only within the original deadline, with linked actual output and the same retained product identities.
Premature fulfillment, expiry, revival and changed dates fail. Replacement evidence also retains correctly typed
post-loss products throughout its sampled stable interval. Shared contention requires completion of the exact items
observed sharing a lane; other train/research completions cannot replace them.

`productionCausality.enqueues` joins checked physical insertion to its own immediate charge or actual new per-tick
obligation. It removes that command's own admitted budget once from unspent reservations while retaining other claims;
it never substitutes pending claims, predicted refunds or a nearby callback. `queueLifecycleEvents` additionally
projects successful per-tick payments, exact registered completions and distinct cancellation requests/removals/refunds
in native sequence order. Missing cash or claim boundaries remain named gaps. `definitionCatalog` reads actual sampled
producer options and placement definitions, rejects changing definitions and checks stored enqueue price/duration against
the preceding producer-scoped option. Neither channel supplies independent paired setup, full construction/loss events,
fair reachability or useful-effect proof. Construction duration here is required work, not elapsed builder travel/work time.
`productionEvidence` remains absent until its whole contract is independently supported.

Automatic construction starts wait when the native payment branch denies affordability. Denial records remain
available, while construction state, work and initial health stay unchanged until a later successful retry. Explicit
starts still throw on denied payment, and unexpected resource callback errors propagate. Payment uses configured
`costType`, independently of construction duration: positive-duration immediate buildings pay before work starts;
per-tick definitions do not pay at start merely because their duration is zero. Unstarted sites cannot refund an unpaid
placement. Killed/destroy teardown disposes once and releases tick listeners even when a native refund callback throws.
These are shared human/AI correctness repairs; definition costs/times and refund multipliers are unchanged. This does not
establish a complete paid-price history across restores, changed definitions or unsupported per-tick construction work.

A reviewed behavior comparator may carry exact native correctness repairs on top of its compile compatibility
overlay. Identify every excluded owner and both overlay digests, verify each repaired owner's emitted code against
the candidate, execute its native regressions, and restore the historical checkout after building. Movement failure
cleanup, positive resource progress, ground-route ownership and pawn WAIT timing must all agree before these builds
can serve as a shared workload. This does not establish acceptance against the original historical source. Preset `sourceRevision`
accepts the actual 40-character Git SHA; put the composite overlay identity in the external qualification manifest.
Qualify complete trajectories and native outcomes in repeated alternating pairs before collecting costs. Marked
accelerated equivalence covers that selected workload; production/unmarked equivalence, normal frames and lifecycle
continuation need their own evidence. Shipping size alone cannot establish CPU or allocation budgets.

For browser profiles, warm each source once, alternate source order, and compare every native boundary/outcome in
the profiled runs with the ordinary qualified trajectory. Profiling can change timer/cache behavior; any trajectory
difference invalidates the cost pair. Keep CPU and sampled-heap artifacts with their sampling intervals and hashes.
Record browser/realm reuse: separate full warm-ups followed by fresh browsers warm shared resources, but do not retain
JavaScript VM/JIT state. A steady-state claim needs a qualified warm-up/reset route in the retained runtime.
Use the actual build source maps to attribute exclusive samples to capture/observation owners, excluding diagnostic
readout stacks. Exclusive owner samples omit their callees; heap samples estimate allocation rather than retained
memory. Report that scope and variance instead of treating unsampled work as zero. Synchronous scene UPDATE timings
include immediate hooks but omit later asynchronous gameplay and cannot supply a whole-simulation CPU budget.

Normal lobby startup generates both seed and instance ID. Production ignores the test marker/preset and publishes
no test game handle; unmarked development publishes no AI test host. Angular's development inspection API can read
the ordinary game, but is absent from production. Live startup/root-absence checks establish this boundary, not
equivalent workloads or absence of all journal/listener allocations.

The explicit development runtime test config pins both values before creating the world. Presets use
`runtime-fixture-SEED-FIXTURE`; continuous matches use `runtime-fixture-SEED-continuous`. Actor identities include
the instance ID, so setting only the RNG seed leaves planner tie-breaks different in every fresh continuous match.
Repeated native starts must agree on initial world/actor identities and opening decisions before comparing repairs.

A native quicksave made at tick zero can provide a common capture-off setup. Use the real save serializer/codec,
retain its exact encoded record, and load it through the ordinary Load UI in isolated browser storage. Loading keeps
the saved seed/instance ID and restores RNG, command authority and AI save state. A loaded start is a distinct
workload: saved AI/authority fields can differ from a fresh lobby boundary. Compare every complete native boundary
and outcome across revisions/modes; never discard those fields to make the save appear equivalent to a fresh start.
Tick-zero evidence does not establish continuation of an in-progress pawn WAIT or general save/restart parity.

An external CDP debugger can retain the native scene object at its bootstrap boundary without publishing a global
test host. Locate the breakpoint in each exact output, require a unique match and verify the scene/seed/ID/roster.
For an accelerated replay, apply native manual clock pacing before the first tick, remove the breakpoint and disable
the debugger before profiling, then stop the render loop and advance the same fixed updates as the qualified replay.
The debugger reads the native world; the runner controls pacing. No running-world identity/state repair, capture
installation, prototype wrapper or shipped hook is needed. Release the remote handle/browser/server afterward.
This measures a capture-off accelerated workload, not rendered frame performance or ordinary wall-clock gameplay.

Exclude only the injected readout subtree and runner self work by their actual script identity; native methods also
named `capture` remain measured. Application exclusive samples include game and framework work and omit builtins,
GC and other unattributed work; they are not isolated whole-simulation CPU. Without production source maps, report
production diagnostic-owner costs as unavailable. Zero owner allocation samples are below the sampling resolution,
not proof of zero allocation. Qualify a common supported setup/read route before claiming normal-play overhead;
do not install capture in production merely to make profiling convenient.

For retained-browser warming, use the native in-game Load event/dialog after the full warm-up, then the actual Load
button. Record the retained document object, time origin/default context and exact native script identities across
resets. The application may recreate the Phaser game while keeping its realm and compiled modules. A sleeping old
render loop can defer native game destruction: wake it before opening Load and require the old scene to reach
DESTROYED with zero event registrations before measuring its replacement. Release old remote scene handles.
These checks prove the selected reset and warm-up reuse, not JIT optimization state, convergence or every async cleanup.

Inclusive CPU scopes must be explicit. Count each sample once in the union of native application ancestry, including
builtin/URL-less callees, while excluding injected readout, runner self and idle. Keep global GC/unattached work separate.
The actual fixed-clock tick stack includes synchronous tick listeners; later async continuations may lose that ancestor.
Native/application ancestry also includes framework activity and cannot supply complete isolated simulation/hook CPU.
Inclusive hot-frame rows overlap; do not sum them or turn source-map gaps into zero-cost claims.

Player-controller decision settling does not establish quiescence of pawn behavior-tree actions or path promises.
Inspect each native action's clock before treating an accelerated replay as a deterministic cost workload.
Mistreevous WAIT nodes use wall time when `BehaviourTreeOptions.getDeltaTime` is absent, even if the caller steps on
fixed simulation ticks. `PawnAiController` supplies its accumulated active elapsed time in seconds to both production
and development trees, before resetting that accumulator after the step. The default 100 ms cadence collects two
50 ms ticks; a 125 ms cadence steps with the actual 150 ms, and a sub-tick cadence still receives 50 ms. Mistreevous
counts the delta on a WAIT's entry update too: a 5 ms polling wait can finish on its first 100 ms update, while a
1500 ms wait takes fifteen such updates. This is the library's discrete update contract, not an exact duration from
the wall-clock moment of entry. Existing guards can still interrupt waits. Paused frames, tick-counter jumps and
inactive/dead actors add no active delta; the isolated frame fallback uses the existing scaled frame delta and is
not a lockstep clock. Cancellation resets the tree's WAIT progress while retaining controller cadence. Blackboard
snapshots do not persist the tree's phase or accumulated elapsed time; this clock repair alone does not prove
save/reconnect/host-transfer continuation parity.

Trace the first native order change and actual command outcome separately; a current Build
order can change before command outcomes diverge. Diagnostic subscriptions/wrappers alter wall time, so traced
controls locate ownership but cannot stand in for ordinary repeats or paired CPU measurements. An isolated WAIT
control proves the clock dependency, not the cause of every whole-world mismatch. Preserve full native state and
outcome comparisons; do not discard transient order state or truncate a workload to its last matching prefix.

Movement consumes ground routes with `shift()`. The ground cache must keep its own route and tile objects and copy
them on a hit; otherwise a later range probe can receive an empty consumed path and incorrectly report proximity.
Trace the native Stop reason, selected order, path length and cache entry alongside world boundaries. Wall-clock
expiry can expose different consumed entries in different runs; extra tracing can change that expiry too. A repaired
candidate repeating the same full trajectory supports that workload's repeatability, but does not qualify a historical
comparator that lacks the repair or establish a CPU/allocation budget. Review ownership on each terrain separately;
ground isolation does not prove water isolation or simulation-clock WAIT authority.

Use one browser runtime process at a time and group compatible IDs with `--scenarios`. Unit, type and tooling checks may be batched independently. Diagnose the earliest causal disagreement in this order:

```text
observation -> demand/mission -> intent/claim -> command application -> outcome -> cleanup
```

## Scenario authority

`tools/ai/fixtures/skirmish-v1.json` owns the required IDs, driver requirement, fixture registration and baseline compatibility. Typed fixture builders and assertions own setup and expected behavior. The coverage gate must fail when a supported required row is missing rather than reducing the denominator.

The [generated scenario catalog](scenario-catalog.md) joins every manifest ID to its requirement, registered pure fixture,
ID-referencing specs, and real-game recipe/map/checkpoint data. It reports wiring, not passing evidence. Edit the
linked requirement and fixture sources, then regenerate with `node tools/ai/generate-skirmish-test-catalog.mjs --write`; the non-draft PR
and `develop` CI jobs check that the catalog stays synchronized. Existing browser recipes still use changing product
maps; [frozen test maps](test-map-contract.md) and their migration remain implementation work under #816. Until that
migration is done, do not describe a changing-map run as a stable reference-map regression.

For bounded authoring triage, `node tools/ai/generate-skirmish-test-catalog.mjs --inventory` prints one line per registered runtime recipe:
IDs, variant/run counts, preset coverage, maximum tick and migration flags. It reads the manifest/fixtures without
launching the game. Flags are an inventory, not proof of a failing test or an excuse to drop a required row.

The current catalog contains 121 named cases before variants. Registered pure fixtures still require complete semantic
and native acceptance where declared; see [the handoff](../../../../../../../../../../docs/ai/759-skirmish-ai/HANDOFF.md).

Detailed requirements are split by concern:

- [Strategic scenarios](strategic-scenarios.md)
- [Progress and recovery oracles](progress-and-recovery-oracles.md)
- [Adversarial and continuous scenarios](adversarial-scenarios.md)
- [Classic RTS and difficulty scenarios](classic-rts-and-difficulty-scenarios.md)
- [Debugging scenarios](debugging-scenarios.md)

Recovery bindings H-01–04/H-19/H-24–26 use native-recovery-worlds.mjs and the native recovery/mission readers.
They require original causal ownership and physical useful effects. Pending/error route faults are finite and
actor-scoped; pending calls cap at32 and release in original request order or settle null on scene shutdown.
H-05/H-20/H-23 now bind original AI receipt uncertainty, pending-query scene disposal and indispensable island
builder cargo. H-21 native larger-unit/formation clearance is explicitly deferred until suitable content exists.
Static geometry, a human scheduled command or scripted passenger membership cannot replace native outcomes.
All new sources remain unrun.

### Command/resource authoring update — 2026-10-20

Consumer-only receipt faults preserve the actual shared outcome stream and command application. Explicit preset opt-in
selects original AI requests, retains bounded callbacks, releases them FIFO at fixed simulation ticks and detaches on shutdown.
Ordinary gameplay has no installed fault policy. Existing root capture records narrow delivery metadata within its budget;
it does not duplicate heavy world samples for those events. Selected authority/lanes/wait ownership has explicit loss bounds.
H-06/H-07/H-10 readers join raw native charges/output/history; H-13–15 require player-wide resource exposure,
actual applied service and relevant native defense. Cumulative nine bindings/62 variants are authored unrun.
H-11 independently prices/exhausts the complete scarce food chain. H-12 proves native atomic admission prevention
plus pure cycle recovery under the explicitly approved scope; it reverses real proposal enumeration.
H-30 uses finite optional/debug/mandatory faults with saved retry debt and original native reconciliation.
H-08/H-09 stay unbound with exact missing seams in native-scenario-recipes.json. H-31 now has the native SP
save/continuation registration described below; its execution is still deferred.
No recipe, test, lint, type check, formatter, build or other validation ran. Model summaries remain at most8192 UTF-8 bytes.

### Authority/save/lifecycle source update — 2026-10-20

Admitted commands retain original execution/progress across host epochs and history eviction. Duplicate delivery is
not terminal failure of the original paid effect; a distinct rejected new request cannot release its original purpose.
Only actual unsent transport input is cancelled at a host fence. Saves carry detached local pendingCommandBatches;
strict restore and nonzero relay startup preserve identities behind the ordinary server echo gate. Those local batches
are not an acknowledged authoritative response tail or a peer-independent hash projection.

Disposed bus/transport/save callbacks and delayed Angular communicator transitions are fenced. The single root client
facade delegates through shared context, event and lobby inheritance layers; the previous oversized-file issue was
addressed by splitting source, without updating the lint baseline. Dependency-injection/type/lint checks remain unrun.

The localhost authority-probe opt-in retains only genuine admitted AI envelopes (16 candidates,32 selected outcomes,
explicit overflow failure). skirmish-ai-multiplayer-authority-continuation.spec.ts authors ONE real host-promotion and
original replay/application branch. Full H-08/H-09 registrations remain absent until their actual native
cancellation/compaction drivers exist. Headless bus/codec tests cannot certify those rows.
No recipes, tests, lint, types, formatter, browser or other verification ran in this source batch.

H-32 uses native-lifecycle-worlds.mjs and the native lifecycle runner/readers for eight worlds: normal disposal,
an original pending path, an original paid queue and a real two-client host replacement, for both factions.
Menu hitboxes, score-screen Leave and the skirmish lobby retain the same browser realm. The second match must have
its own seed/identity, exactly one current controller/player and later decisions. Actual old queue completions,
tick emissions, navigation promises and the retained multiplayer replay callback are exercised after the transition;
the new world's full canonical projection, including RNG, must remain identical. Paid completion fences dead owners.
The host branch uses a natural relayed AI3 match and an AI2 next match, with no single-player fallback. Matrix execution
selects the multiplayer configuration and requires its existing local API/auth prerequisites. Original histories and
next-match evidence remain separate. Save groundwork uses the actual quicksave/encrypted repository/Load UI;
restored identity/seed and actors/queues are never replaced by fixture setup. This is authored support, not save certification.

Save/load cases are single-player coverage. Multiplayer lifecycle cases use real host transfer/reconnect and late-event
fencing. D-02/SEQ-08 have independent supported legs; they do not require coordinated multiplayer save/load.

H-31 binds eight actual single-player save/continuation worlds across both factions. The ordinary quicksave shortcut,
encrypted repository and Load UI rewind only after the original uninterrupted continuation has been sealed. Saved/restored
and control/resumed boundaries compare full canonical world/sharedQueue, live brain, cadence, claims, authority and RNG;
each actual subsequent committed decision also has an exact input/result fingerprint. Pending applied receipts, unfinished
paid construction, progressing training/research and chronic recovery are mandatory original premises. External future
fixture inputs cannot silently disappear after reload. The pause/speed leg uses actual scaled native frames. Native
selection/dispatch is synchronous: pure ai-saved-continuation.spec.ts covers otherwise unreachable saved provisional expiry,
debt/age and retained paid/unknown claims. New saves preserve confirmed delivered-income sampling, while legacy saves still
reset unsafe derived income. Deterministic comparison excludes measured telemetry only. Raw captures stay local; bounded
fingerprints and the first differing decision enter reports. All controls remain authored and unrun.

DBG-05 binds twelve native worlds to the actual runtime-artifact import surface. It is present only under an explicit
localhost developer marker and is excluded from production. The actual host gate protects capture and is rechecked on
every import. Malformed JSON, bytes/counts/depth, schema, traversal and markup are rejected before any world application;
labels use textContent. Actual native canonical state/RNG must remain unchanged. A real ordinary peer must be denied
both import and native capture. Only bounded digests/results enter reports. Import never claims runtime replay.

### Difficulty policy registration (D-01)

Six native worlds select Easy/Normal/Hard in the ordinary lobby for both factions on the same legal setup/seed.
The existing listener-gated consumed-input projection includes the actual controller/brain profile. The D-01 reader
pins every policy field independently of the production factory and requires every selected tick/sequence through2000,
persisted difficulty, accepted proposal/command quota consistency and a real applied AI action. No checks have run.
Invalid configuration is covered at the actual controller/factory boundary: there is no invalid lobby option to select.
This is registration, not difficulty calibration, quota saturation or D-03 hidden-state fairness certification.
