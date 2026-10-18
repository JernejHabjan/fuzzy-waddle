# Resilience and lifecycle

## Progress and deadlines

Progress is an independently observable improvement toward a purpose: delivered resources, completed capacity, route advancement, damage, survival, objective effect or restored duty. Repeated reason text, renewed retry ticks, unrelated child work and new plan identities are not progress.

Each recoverable episode retains its original causal age. Healthy long-running work may continue when milestones are advancing; otherwise bounded recovery escalates through retry, alternate actor/target/site/route, reduced objective, safe release and explicit failure.

## Claims and fairness

Claims cover actors, resources, queue lanes, sites, routes and effect identities. Reservations are dated, released atomically and cannot promise the same resource to several consumers. Dependency cycles choose a deterministic reversible claim to release.

Emergency work may preempt normal activity, but observation and reconciliation continue. After the emergency, useful economy, scouting, production and offense regain bounded service. Optional work across several bases remains subject to player-wide exposure limits.

## Command uncertainty

Command identity includes authority epoch and monotonic sequence. Applied effects remain idempotent across duplicate delivery, detailed-record eviction, save restore and host replacement. Late outcomes from an old authority cannot resurrect cancelled work.

Backpressure retains unresolved and required outcome records. A missing acknowledgement is reconciled against authoritative state/history before any retry. Absence of a produced actor is not proof an effect never applied when that actor could already have been consumed or destroyed.

Native gathering and drop-off renew command progress only after a positive returned amount for the same current order,
actor and owner. This keeps productive long-running work from timing out; zero work and stalled commands still expire
under the existing deadlines. An `active` outcome proves native work, not terminal completion or useful income.
A refused Move reports terminal failure immediately so recovery can release its command instead of retrying a missing
path until timeout. Late movement returns cannot settle a replacement order.

Native construction seeking captures the pawn blackboard's runtime order revision. Replacement, cancellation,
queue admission and restore invalidate the pending lookup before it can enqueue a Build order. The revision is not
saved; native orders remain the durable state. Movement revalidates its requesting order after reachability and
ignores callbacks belonging to a replaced order, so an old route cannot start or cancel a later job.

Native ground, overlay and water EasyStar calculations deliver their results without a browser timer delay.
Their public APIs remain Promises, so requesting-order fences still apply. Cache hits and misses both settle through
Promise continuations before the next fixed frame; extra observation pauses must not change movement/combat.

Macro construction recovery also runs after the opening has completed. It assigns one available compatible worker
to an observed unfinished site requiring builders, while preserving assigned, busy and loaded workers. The site
keeps its existing payment and work; resumption neither places another building nor claims its resource price again.
Automatic zero-worker sites are excluded using the definition-backed capability catalog.
Recovery chooses a compatible worker with a usable observed approach, reclaims Build orders whose old site is gone
or finished, and stops a known impossible construction job if no useful reassignment is available. Healthy assigned
jobs and workers with cargo or an in-flight transfer keep their ownership; missing advisory topology alone is not
proof that a native job is impossible.

Housing recovery respects live construction prerequisites. If an ordinary house requires a lost core, demand
selects a legal housing provider constructible by an owned builder and funds its actual catalog price. One recovery
provider is enough while its site or accepted effect is pending; after the core finishes, ordinary housing resumes.
This prevents repeated forbidden house commands and exposes the rebuild's resource deficits to existing labor funding.

Native gather admission requires a live, finished compatible team drop-off when the source needs delivery.
Destroying the last drop-off stops the gathering job before further extraction/tending; missing return lookup
also releases only its requesting order. Stop unassigns the source/container while retaining carried resources and
the remembered source. A surviving compatible drop-off permits ordinary delivery/reacquisition, and sources that
credit resources immediately need no building. Indexed death-animation actors cannot remain valid drains.

Native resource indexes follow component installation as well as actor registration. Construction shells receive
their source/drop-off components only when upgraded to full actor data; the existing `ActorDataChangedEvent`
refreshes those derived memberships without duplicating actor counts or registration events. Death and scene
shutdown remove the component listener, so a late update cannot restore a dead building to the delivery index.

Native source extraction and drop-off validate their original physical endpoints after the cooldown. A lost source
or carrier cannot deduct stock; a lost drain or recipient cannot credit/debit a surviving carrier's cargo. Container
capacity is released even when entry, waiting or exit throws. A drain admits one pending return per carrier and
respects its active unload capacity; outdoor drains need no container slot. Invalid transfer amounts are rejected.
Construction's synchronous payment callback cannot reenter the same site's start and charge it a second time.
Cancellation settles before refund callbacks, releases every original builder even when membership changes or a callback
throws, and cannot replay its refund. Optional saved `cancellationSettled` preserves that terminal boundary; older saves
without it retain ordinary construction. A payment-time cancellation waits for the payment to return and cannot restart
the destroyed site. Builder transfers/death release construction and repair membership, while completion iterates a
snapshot when consuming builders. Duplicate membership cannot increase construction work.
Native player payments validate one complete cost vector before any debit, and reject unknown resources and negative or
nonfinite amounts. An unaffordable later entry leaves earlier balances untouched; configured refund formulas remain intact.
These local runtime guards do not establish mutation-complete resource history across arbitrary aliases or restore.

## Saves and controller lifecycle

Native actor saves carry an optional versioned `sharedQueue` snapshot owned by `QueueComponent`. It preserves
mixed lane ordering, empty lanes, remaining work, purchase command identity and the original production/research
cost and refund policy. Validate the complete replacement before mutating live queues. An explicit snapshot,
including an empty one, supersedes the legacy per-component queue lists; old saves still replace each work kind
without appending duplicate research or clearing the other kind. Restoring paid work does not charge it again.
Queue generations reject callbacks and purchases belonging to replaced work. Completion rechecks the live head
after progress callbacks; reentrant cancellation cannot finish or refund the next item. Native unit creation and
its terminal outcome settle synchronously before the simulation tick returns, so a tick-boundary capture cannot
fall between them. Research completion checks the tech tree and guards synchronous reentry before applying upgrades.
Cancellation removes its handle before refund callbacks. Failed refund callbacks cannot replay that handle.

Construction saves retain unique unresolved worker IDs, but only resolved live workers contribute progress or
repair. Partial component updates preserve absent membership fields; explicit empty lists clear them. New native
assignment supersedes unresolved old intent, and removal clears that worker's pending identity. Scene shutdown
disposes construction, builder, queue, production and command subscriptions; teardown does not cancel/refund a saved
construction site. Disposed owners cannot accept later assignments or restore callbacks.

These component controls are local evidence. The shared queue snapshot is carried by actor save/load, but its lane
and command metadata still needs adoption in the multiplayer state-hash projection and interrupted peer/replay
integration coverage. Local generations do not establish authority across a host change or mutation-complete history.

Save/load preserves brain state, causal deadlines, debt, claims, accepted effects, difficulty, archetype, scheduler state and RNG. Equivalent logical continuation must produce the same decisions after canonical migration.

Host transfer fences old callbacks and establishes one current authority. Scene disposal removes listeners, timers, overlays, captures and controller references. Starting a second match in the same app creates exactly one controller per AI player with no state leakage from the first match.
The transient host-authority gate is separate from the persisted campaign AI-enabled policy: demotion suspends planning
without rewriting that policy, and promotion restores one controller per AI participant. The initial host snapshot
service is also the migration-owned service; demotion disposes its timer, listener and delayed first capture before a
later promotion can reinitialize it. Multiplayer browser proof of this contract remains a separate requirement.

Debug visibility, filtering, export and capture must not change the AI or world digest.
