# Combat and strategy

## Strategic purpose

Every active squad and meaningful spending plan links to an objective, evidence, expected effect, deadline and recovery policy. The controller evaluates state rather than advancing through a time-only script.

Scouting asks explicit questions about starts, expansions, production, composition and access. Repeated sightings of the same contact do not inflate strength or confidence. Stale knowledge loses certainty and drives legal search rather than hidden-state targeting.

## Missions

Offensive missions progress through assembly, rally, advance, engagement, regroup/recovery and closure. They launch with a useful feasible force rather than waiting forever for an optional straggler. A finite deadline forces retargeting, recovery or failure; changing the mission ID does not reset causal age.

Small raids receive a bounded compatible local response while the main force retains useful pressure. A growing lethal threat can recall more of the army. Multiple fronts own separate squads, routes and reinforcement priorities instead of collapsing into one permanent blob.

Defense membership is capability-aware: an actor can claim a threat response only when its target domains can affect the
threat's movement domain. An impressive squad count made from incapable units is not protection.

After a favorable engagement, the AI applies useful pressure to an exposed economy, production site, expansion, choke or core. It must not idle indefinitely for perfect certainty. After an unfavorable engagement, it preserves survivors, changes force/route/objective and avoids repeating the same lethal choke oscillation.

The offense owner ranks visible and bounded last-seen targets by core/economic value, travel, visible local counterforce,
route feasibility and contact age. A compatible force can launch on an exposed core before the normal reinforcement
target is complete; a severe observed counterforce blocks the assembly timeout from forcing a token attack. A completed
mission does not consume the launch permission of the next mission, even when its stable squad ID is reused. The
selected choice, compatible/required force, confidence, effect/reconsideration ticks and bounded alternatives are saved
in the strategy state and projected into the historical debug view. A completed opening with a collapsed workforce
recovers that workforce before forming a fresh offensive squad, unless a credible finishing force is already ready.

A failed mission's creation tick, target, observed losses and bounded repeat count survive the squad's removal in the
strategy assessment. A recent failure briefly favors rebuilding, raises the compatible force requirement for the same
target, and allows a later stronger follow-up; a changed target does not inherit that penalty. This is a response to
observed mission failure, not hidden enemy strength. Runtime victory and timing still require paired scenario proof.

Attack squads approach visible building objectives through distinct observed passable cells around the footprint.
They do not use the occupied building center as a movement waypoint when no legal approach cell is known.

## Tactical execution

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

Counter demand is limited to capabilities that exist in the current faction catalog. Ready actors and unresolved
accepted effects count toward fulfillment, so duplicate units remain useful while a real deficit exists and production
stops when the commitment is satisfied. Existing production is retained rather than cancelled speculatively.

Research scoring weighs current and likely beneficiaries against cost, queue delay, and survival needs. The shared
research command remains the final authority. Adaptation evidence, targets, research rationale, and cancellation policy
are saved and projected into the debug snapshot without live replanning.

## Difficulty

Difficulty changes decision cadence, voluntary activity breadth, uncertainty use and commitment budgets. It does not grant hidden information, free resources, stat bonuses or exemptions from survival/recovery correctness. Easy must still open, produce, defend, retreat and recover; Hard must remain bounded and rules-compliant.

See [difficulty calibration](../testing/difficulty-calibration.md) for evidence requirements.
