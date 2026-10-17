# Combat and strategy

## Strategic purpose

Every active squad and meaningful spending plan links to an objective, evidence, expected effect, deadline and recovery policy. The controller evaluates state rather than advancing through a time-only script.

Scouting asks explicit questions about starts, expansions, production, composition and access. Repeated sightings of the same contact do not inflate strength or confidence. Stale knowledge loses certainty and drives legal search rather than hidden-state targeting.

Connectivity regions and information coverage have different granularity. The runtime caches at most128 static-ground
search destinations when a topology generation completes; several may share one connected region. Only permitted
terrain and already observed blockers affect selection. Current owned vision determines whether each destination is
observed, and durable answered questions prevent returning to it merely because the scout left. The existing direct
route guard still admits every member. No hidden enemy positions, new terrain observer or changed transport graph is
needed. Older authored observations without search destinations retain the legacy frontier contract.
Tactical formation keeps that information destination as its anchor; the scout's current position cannot replace it.
An in-progress healthy move is retained as the scout advances.
Likewise, expiry of a predicted damage reservation cannot replace a native Attack already targeting that same
actor. Forecasts help allocate damage; native approach and attack windup must continue until the order ends or the
target actually changes. Idle actors still receive their required attack order.

Scout admission requires a direct route in the committed player-fair access graph for each assigned pawn. Unknown,
pending, disconnected or transport-dependent access does not authorize a Move. Neutral resource reconnaissance
requires visible positive resource availability and a known access region; scenery is not a resource objective. The
destination is the region's traversable representative, never the occupied tree/resource tile. This is an information
mission, not proof of claiming ownership, resource delivery or useful economic effect.

Neutral and frontier missions share the proposal's actor ownership set, and frontier intents carry actor claims for
arbitration. A neutral mission retains its original deadline without redispatch. Observed region coverage completes it;
expiry or loss of available members cancels it. Its terminal record prevents recreating that neutral mission. Frontier
replacement rechecks each member's route and discards tactics for changed membership while retaining the existing
mission deadline. Defense and attack ownership take precedence over scouting.
Strategic membership projected in the current decision takes precedence over tactical snapshots from the previous
decision. Stale reserve/domain updates cannot reclaim a newly assigned scout or recreate a removed parent mission;
tactical-only projections can still release dead members. A squad can renew its own provisional actor lease for
move/attack/stop, including retreat, while foreign, dispatched and non-actor claims remain exclusive.
Defense tactics retain the observed threat assigned by strategy, just as offense retains its strategic target.
A more valuable unarmed enemy building cannot replace a raider solely through tactical target scoring. Current
strategic objectives, including explicit clearing, survive stale tactical updates and their domain children;
local tactical targets remain separate from that mission objective.
Membership preservation applies to actors introduced after the tactical snapshot. Existing members may move into
their air/ground domain child without being unioned back into the parent, which would duplicate squad membership.
The comparison includes the whole previous domain family, so strategic recombination cannot recreate duplicates
on later decisions. Assigned defenders count toward the home reserve budget; a second full reserve must not consume
the force required for an otherwise viable offensive while the existing defense already protects home.

## Missions

Offensive missions progress through assembly, rally, advance, engagement, regroup/recovery and closure. They launch with a useful feasible force rather than waiting forever for an optional straggler. A finite deadline forces retargeting, recovery or failure; changing the mission ID does not reset causal age.

A temporary route rebuild does not remove a mission whose members still have native Attack jobs against its visible
target. All domain children participate in this continuation check. Quiet-home reserve allocation excludes those busy
attackers; actual home defense still takes precedence. New launches continue to require a confirmed route.
Player-visible targets outside the squad's individual vision launch an attack-move toward a known passable approach,
keeping the same strategic objective. Direct target attacks require every commanded member's local vision; the shared
native visibility validator remains authoritative. An occupied building center is not an approach destination.
Mission continuation and quiet reserve also preserve these native attack-move approaches. Tactics replaces the
approach with a direct target job when the member obtains local vision, or withdraws it when the fight becomes unsafe.

The parent and its domain children share one dated launch permission. A child does not wait for a second launch or
consume another strategic launch when the parent no longer has members. Local damage orders and distant members'
approach orders are independent: fighting members cannot suppress reinforcement movement in the same decision.

Small raids receive a bounded compatible local response while the main force retains useful pressure. A growing lethal threat can recall more of the army. Multiple fronts own separate squads, routes and reinforcement priorities instead of collapsing into one permanent blob.

Defense membership is capability-aware: an actor can claim a threat response only when its target domains can affect the
threat's movement domain. An impressive squad count made from incapable units is not protection.
The initial head-count response grows until the existing bounded combat estimate is favorable, or the compatible
force/profile limit is reached. Unknown combat profiles retain the ordinary response instead of claiming the whole army.
Current observed weapons threatening workers also drive defense away from the main building. Harvest, recovery and
field sites exclude their exposed worker contact cells. Unarmed buildings alone do not create an economy emergency.
Once eight workers are established, optional workforce growth preserves the definition-priced next military unit
when the army is below target; survival recovery still takes precedence.

After a favorable engagement, the AI applies useful pressure to an exposed economy, production site, expansion, choke or core. It must not idle indefinitely for perfect certainty. After an unfavorable engagement, it preserves survivors, changes force/route/objective and avoids repeating the same lethal choke oscillation.

The offense owner ranks visible and bounded last-seen targets by core/economic value, travel, visible local counterforce,
route feasibility and contact age. A compatible force can launch on an exposed core before the normal reinforcement
target is complete; a severe observed counterforce blocks the assembly timeout from forcing a token attack. A reachable
target that can be attacked with the current force takes precedence over a more valuable target that still needs
reinforcements. Once the larger force becomes ready, target value can reclaim priority. A completed mission does not
consume the launch permission of the next mission, even when its stable squad ID is reused. The
selected choice, compatible/required force, confidence, effect/reconsideration ticks and bounded alternatives are saved
in the strategy state and projected into the historical debug view. A completed opening with a collapsed workforce
recovers that workforce before forming a fresh offensive squad, unless a credible finishing force is already ready.

Opportunity ranking retains an active mission's visible, reachable objective while a same-family member has a native
attack against it. This prevents new opportunities from interrupting useful work. Target disappearance or an inactive
job without useful progress permits reselection. A recent useful effect bridges a native-job gap only while the
existing mission effect deadline is live; tactical retreat and that deadline still own unsafe or stalled work.

A failed mission's creation tick, target, observed losses and bounded repeat count survive the squad's removal in the
strategy assessment. A recent failure briefly favors rebuilding, raises the compatible force requirement for the same
target, and allows a later stronger follow-up; a changed target does not inherit that penalty. This is a response to
observed mission failure, not hidden enemy strength. Runtime victory and timing still require paired scenario proof.

Attack squads approach visible building objectives through distinct observed passable cells around the footprint.
They do not use the occupied building center as a movement waypoint when no legal approach cell is known.

## Tactical execution

- Engagement estimates combine the force's effective damage and remaining durability, rather than summing individual
  duels against a durable target. Domain, range, health and permitted cooldown facts still limit that estimate.
  The firing interval determines sustained DPS; starting an ordinary shot cooldown does not independently trigger
  withdrawal. Weapon/spell readiness remains relevant to actual action and useful-impact timing.
- A visible committed threat remains in the bounded estimate outside the local contact radius. Retreat continues
  against that threat until the estimate becomes favorable; disappearance or a favorable reinforced force releases it.
- Domain children retain existing members when parent reinforcements create the same child. Projection assigns each
  reinforcement once. Nearby sibling domains with the same mission objective contribute to the engagement estimate;
  distant squads and other missions do not count as immediate support.
- Focus fire is limited by useful-effect reservations to reduce overkill.
- Attack orders require a currently legal target domain and local actionable knowledge.
- Ranged, support and damaged units use compatible positioning and withdrawal rules.
- Healing, spells and zones account for cooldowns, missing value and already-reserved effects.
- Casualties, damage, position progress and objective effects are independently measured.
- Reinforcements assemble or choose a safe alternate route instead of feeding singly into danger.

## Domain and transport authority

The observation pipeline publishes a generation-paired capability catalog and access graph. Route feasibility includes
carriers producible by owned producers, not only currently available seats. A same-kind graph refresh preserves a valid
mission, while a transient pending graph waits only until the existing phase deadline.

The skirmish manager creates the child transport requirement. The transport manager then exclusively owns carrier
production, reservation, boarding, transit, unloading, loss recovery and passenger handoff. Shared game commands remain
authoritative for every state change. Unsupported faction capabilities, synthetic flying containers and test-injected
brain plans are never treated as shipping evidence.

## Adaptation and technology

The adaptation manager alone owns counter-composition demand and optional technology rationale. It consumes only
committed visible evidence and legal research candidates projected by the runtime adapter. A normal role transition
requires repeated evidence plus the profile cooldown; remembered contacts cannot independently trigger it.
A visible building's publicly declared air products justify one anti-air precaution. Distinct confirmed flying actors
scale that target up to six; repeated sightings of the same actor and producer clues do not inflate fleet strength.
This projection reads static product capabilities, never an enemy's private production queue or research state.

Counter demand is limited to capabilities that exist in the current faction catalog. Ready actors and unresolved
accepted effects count toward fulfillment, so duplicate units remain useful while a real deficit exists and production
stops when the commitment is satisfied. Existing production is retained rather than cancelled speculatively.
The composition cooldown gates admitting a new or larger target; it does not delay filling an already admitted deficit.

Research scoring weighs current and likely beneficiaries against cost, queue delay, and survival needs. The shared
research command remains the final authority. Adaptation evidence, targets, research rationale, and cancellation policy
are saved and projected into the debug snapshot without live replanning.
Queued production items count as future beneficiaries once each; an idle producer alone is not an upgraded unit.
Optional research must clear the minimum useful-value threshold even for a tech archetype, and a visible survival
threat suspends it. The paired early/mass/queued/threat pure case is authored but unverified until the final gate.

## Difficulty

Difficulty changes decision cadence, voluntary activity breadth, uncertainty use and commitment budgets. It does not grant hidden information, free resources, stat bonuses or exemptions from survival/recovery correctness. Easy must still open, produce, defend, retreat and recover; Hard must remain bounded and rules-compliant.

See [difficulty calibration](../testing/difficulty-calibration.md) for evidence requirements.
