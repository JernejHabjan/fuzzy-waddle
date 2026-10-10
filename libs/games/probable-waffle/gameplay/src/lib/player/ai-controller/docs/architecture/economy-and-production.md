# Economy and production

## Purpose-driven macro

The AI maintains an opening or strategic objective with checkpoints rather than issuing unrelated affordable actions. Defense may suspend an opening, but completed checkpoints remain complete and the previous objective resumes only when it is still useful.

Economy decisions are based on delivered income and dated obligations. Stockpiles, carried resources, committed payments, queued work, construction lead time and supply are accounted separately. Forecast income is corrected when routes are congested, unsafe or no longer serviced.

The 600-tick resource forecast prices only the unmet portion of current demands from the runtime capability catalog.
Labor prioritizes the largest forecast deficit rather than the smallest raw stockpile. Food-consuming military demand
establishes bounded renewable Field capacity before the stockpile is exhausted; observed actors, queues, construction
and accepted effects remain disjoint commitments.
Resource-specific labor selection subtracts empirically delivered income expected before the 600-tick deadline
(20 simulation ticks per second); unknown income contributes zero. This is a labor-ranking estimate, never spendable
stockpile or permission to promise a purchase.
When no idle worker is available, a clearly priced shortage may transfer one unloaded Gather worker from a different
resource with at least 100 spendable surplus beyond its forecast. The donor source retains at least one worker;
returning and cargo-bearing workers keep their orders. The transfer is suppressed without 100 units of target deficit.

Opening checkpoints record historical progression; they are not lifetime uniqueness locks. Current demands separately
replace destroyed prerequisites and scale useful duplicate capacity. Construction prerequisites come from runtime
definitions. Renewable-food demand keeps at least one valid drop-off and scales additional Granaries only with Field
throughput, while terminally failed effects are released so rejected work can be retried.

Workers retain ownership of useful in-progress duties such as returning resources. Reassignment is allowed when a source is depleted, inaccessible, unsafe or oversaturated, but a brief duty transition must not be mistaken for idleness.

Field labor remains committed while its farmer returns food to any compatible drop-off, including a main building.
Known cargo identifies food returns; when cargo identity is unavailable, a catalog-defined food-capable destination
conservatively defers new Field staffing until gathering resumes. A known non-food delivery does not block staffing.
This prevents a transient return from attracting another worker to the same Field and consuming labor reserved for
construction resources. The observed return order does not identify its original Field, so this guard defers staffing
globally while that food return is unresolved.

The native pawn's Gather tree returns a full pack before tending another crop cycle or finding a replacement for a
depleted source. A farmer that fills its pack on the last ripe crop therefore delivers that food before regrowth;
workers with remaining capacity still tend and harvest normally. The shared resource and construction MDSL roots
have separate source owners and are composed into the existing pawn tree without changing its public entry point.

Native food gathering uses a ten-food pack and collects up to five food per harvest, with a one-second worker
cooldown. Fields take one second per extraction and thirty seconds per growth cycle before the assigned-tender boost.
These shared values apply to human and AI workers; larger packs reduce drop-off trips while shorter collection waits
make renewable food available for workforce recovery. Fields still yield thirty food per cycle, require a Granary to
unlock construction and deliver harvested food to a compatible drop-off. Field food becomes spendable only on native
delivery; other food sources retain their native source-owned immediate-credit policy. Larger packs keep more food
unspendable during travel. A return order resumes gathering only when cargo is empty; a partial pack, including five food restored
from older saves, is delivered before new gathering begins. `resource/create-default-gather-data.ts` in the Phaser
component directory owns the per-resource profiles;
each gatherer receives fresh profiles. Non-food gathering keeps its existing capacity, amount and cooldown.

Expansion construction carries every positive resource cost from the observed main building's catalog profile into
the shared intent arbiter. Stockpile reservations and due obligations therefore block an unaffordable expansion
before dispatch. A missing price profile keeps the saved candidate explicit without proposing free construction;
native application retains responsibility for actual payment and site/builder legality.

The resource-service proposer uses definition-derived drop-off resource types. A visible, valuable non-food source may
justify a compatible mill/camp only when existing local service is too far away, a worker or dated demand can use it,
its catalog cost is spendable, and a currently observed footprint improves travel. An already-served source, pending
site commitment, or unfinished nearby drop-off suppresses duplicate work. A second building of the same type remains
legal for a distinct underserved source. Construction candidates around a distant source are exposed only from bounded
owned vision anchors; final terrain, collision, path, and builder legality remain with shared command application.
Owned carried resources are observed separately from the spendable stockpile; a nearly depleted source alone is not a
reason to rebuild a local drop-off. The pawn's return order retains responsibility for choosing another compatible
finished drop-off if its prior target disappears.

Standard skirmishes give both human and AI players 200 food, wood, stone and minerals. The opening therefore secures a
two-worker minimum before infrastructure instead of spending the entire food reserve on a serialized six-worker gate.
Once renewable income is reachable, a separate current-workforce demand maintains six as a recovery floor and grows
toward dated spending demand, useful resource-service capacity and an 18-worker safety ceiling. Owned, queued and
accepted-but-unobserved replacements count once. Losses do not reopen historical opening steps.

After an observed failed attack, the strategic assessment may require a larger compatible force. Macro production
uses that requirement, bounded by a 24-unit planning ceiling, rather than stopping at the ordinary 12-unit standing
target. Additional military producers are requested only while the owned and queued force leaves enough dated work
to justify their throughput. The producer demand still counts existing, constructing, and accepted capacity.

The economy policy projects food runway from available stockpile, planned workers and dated food obligations together;
these simultaneous consumers are additive rather than alternatives. Field capacity is bounded by projected labor and
reserves at least one worker, or roughly a third of larger workforces, for non-food duties. An urgent runway can grow
renewable capacity without constructing fields that would leave wood/stone/mineral demand unstaffed. Terminally failed
worker-production leases are released before counting committed replacements. Visible enemy pressure, plus the strategy commitment that prevents one-tick posture
oscillation, freezes optional workforce growth and shifts the advertised spending split from 65/35 economy/defense to
35/65 under pressure or 20/80 when local attackers outnumber defenders. Recovery below the six-worker floor remains
possible at a lower priority; when pressure clears, useful economic growth resumes.
Local pressure requires a visible enemy with a known position near an observed owned base or economic asset; a threat
summary ID without a corresponding visible contact does not establish a local emergency.

The macro owner now publishes that split to the shared intent arbiter. Catalog-priced spending proposals are tagged as
survival, economy or defense. Survival still obeys the real stockpile but may cross a posture quota; otherwise the
arbiter protects the opposing category's share only while an affordable, still-eligible competing proposal is pending.
An idle category does not freeze resources. This is a per-decision allocation, not a separate bank account; accepted
claims and authoritative command outcomes remain the spending source of truth.
The posture itself is save-safe: visible local pressure escalates immediately, while de-escalation retains the last
observed threat posture for a bounded 160 simulation ticks. Remembered or hidden enemies do not refresh that timer.

For source changes, `planning/ai-macro-manager.ts` owns proposal ordering and the committed demand/state patch.
`ai-opening-proposal.ts`, `ai-general-gathering-proposal.ts`, `ai-housing-proposal.ts`, and
`ai-food-economy-proposal.ts` own the corresponding economy proposal phases; the food coordinator calls the focused
prerequisite, Field-capacity, and Field-labor proposers. `ai-military-force-context.ts` captures the compatible force
and its forecast, while `ai-military-capacity-proposal.ts` and `ai-military-unit-proposal.ts` own producer and unit
requests. Keep their intent ordinals, resource claims, accepted-effect accounting, and construction-site reservations
consistent when changing phase boundaries.

## Demand and legitimate duplicates

Duplicate units, production buildings, houses and resource drop-offs are valid when they satisfy measured demand. The AI suppresses duplicate fulfillment of one commitment, not repeated actor types.

Additional capacity requires evidence such as:

- a dated production target that one queue cannot meet;
- local resource-service travel or congestion improvement;
- resilience for strategically critical exposed capacity;
- supply required by committed production;
- a composition deficit that needs several copies of one effective unit.

Existing, queued, under-construction and accepted-not-yet-observed capacity count toward the same demand once. When the target is fulfilled or abandoned, optional claims are released and excess construction/production stops.

Macro construction and opening production carry catalog-priced resource claims into shared intent arbitration. Several
simultaneous proposed buildings may each be individually affordable, but only the combination that fits unreserved
stockpile can be admitted. A rejected lower-priority proposal remains unmet demand rather than silently spending money.

Housing demand prices queued population as well as current use and an opening-specific reserve. Ready houses supply
current capacity; unfinished houses and accepted but unobserved effects count toward future capacity once. The demand
ledger records a required building count, while the planner separately calculates population capacity, so a house is
not mistaken for one population point and copied until a numeric population target is reached.

## Composition and technology

Composition uses real runtime target domains, effective levels, attacks, armour, range, support and movement capabilities. It must never invent a familiar RTS counter that the faction cannot build. Sparse evidence justifies limited preparation and scouting; confirmed strength can justify a larger counter transition.
The current-tech catalog tags ranged attackers from their effective weapon range, because the generic `attack`
capability alone cannot distinguish ranged from frontline units. Production counts owned and queued units by role,
reserves at most one support slot in a standing force, and favors an unmet role before another copy of a fulfilled role.
Counter demand counts compatible units already in real production queues alongside owned units and accepted effects.
It asks for additional production only for the remaining deficit; existing useful queues are not cancelled to make a
new composition look tidier.

Research competes with survival, supply, production and expansion. Its value depends on eligible existing and committed units, timing, queue occupancy and opportunity cost. Useful queued units are not cancelled merely to obtain a cosmetically cleaner composition.

## Recovery expectations

- Replace lost workers and critical productive capacity when economically feasible.
- Restore sustainable food and compatible drop-off service after depletion or destruction.
- Avoid circular worker/resource/building prerequisite reservations.
- Do not repeatedly cancel and requeue the same affordable unit or upgrade.
- Explain genuine infeasibility with observed evidence and reassign actors to other useful work.
