# Stages 7–9 — build orders, composition, access, and a purposeful match

Read [runbook](00-start-here.md), [shared decisions](01-shared-decisions.md), [debug contract](06-debug-panel.md). Dependencies: Stages 0–6 at least `implemented_unvalidated`. Apply [hardening H1–H9](09-progress-and-hardening.md) and author the owning [focused gates](10-integration-and-adversarial-tests.md) here; Stage 15 executes all validation. Any older “run” wording below means author and defer under the runbook's latest policy.

## Stage 7

Model: Terra / xhigh. Source anchors: EconomyManager, LogisticsManager, SupplyPlanner, ForceMaintenanceManager, TechProgressManager, BasePlanner, QueueComponent, TechTreeService, actor definitions and pawn gather/tend/return/build behavior.

### Implement in this order

1. Add data-driven opening steps with stable `stepId`, completion predicate, desired capability/count, prerequisite demand, resource horizon, actor/site/queue claims, interrupt policy and fallback. Resume from existing world state; do not replay construction when a checkpoint is already satisfied.
2. Implement startup recovery before ordinary optimization. Current faction defaults contain a main building plus a combat unit, not guaranteed workers. If no worker exists, train the cheapest legal worker from the main producer when resources/supply permit. If main is lost but builder survives, prioritize legal rebuild; if neither exists, evaluate other valid acquisition/production routes and mode survival instead of calling a nonexistent worker.
3. Resolve and author these initial opening data entries, reading current costs/capabilities at runtime:

| Checkpoint | Tivara | Skaduwee | Completion / interruption |
| --- | --- | --- | --- |
| Main/worker bootstrap | Sandhold -> TivaraWorker alias | FrostForge -> SkaduweeWorker alias | Existing main and at least one worker, or explicit rebuild/recoverability reason |
| Establish income | Compatible visible food/wood/stone sources and drop-off | Same capability query | At least one active delivered-income route; grow workers toward 6 while affordable |
| Supply safety | Olival | Emberstone | Forecast has at least 3 free population after near-term commitments; resolve by positive housing capability, not prefab label |
| First military producer | AnkGuard | InfantryInn | At least one compatible ready/constructing/in-flight producer satisfies this opening demand; extra useful existing producers do not invalidate the checkpoint |
| Sustainable food | Granary then Field if food-source life/throughput cannot cover next horizon | Same legal shared buildings | Granary ready and one working grow/harvest/deposit cycle, or sufficient sustainable alternative |
| Mixed first force | Legal frontline/ranged from AnkGuard | Legal frontline/ranged from InfantryInn | First 6 available military population/role slots assembled with useful frontline/ranged mix; existing start military counts |
| Transition | Stable economy, supply, producer and first squad -> pressure or expand | Same state predicates | Threat suspends current step; recovery resumes it without resetting completed steps |

These names are confirmed discovery anchors, not permission to bypass the tech tree. Read worker constructable lists recursively, production rosters, prerequisites, level overrides, and faction policy. If current definitions change, resolve an equivalent capability and record the mapping; unsupported capabilities produce a fallback. Do not grant ships or units to a faction that cannot legally produce them.

4. Implement worker demand per resource using a 600-tick (30 s) horizon: upcoming committed costs + next two opening steps + supply/survival reserve minus stockpile and expected deliveries. Allocate by positive deficit/delivered throughput, with source/tender/deposit capacity and travel/safety. Initial worker target is min(12 per active base, useful safe job capacity); recompute as expansions/production require more, and never demand workers without food/supply or useful jobs. Keep at least one food income path while growing workers; desired minima are bounded by available workers, not impossible fixed allocations.
5. Supply forecasting counts current use, committed production, accepted-not-observed population, and housing that finishes before those needs. Request the minimum additional capacity to preserve buffer 3. If one house already covers it, `unmet=0`. If projected need exceeds two houses, the ledger may admit two distinct needs; do not enforce a blanket one-building cap that creates a new supply deadlock.
6. Compute required throughput from a committed unit mix, amount and deadline, including queue lane count, training duration, queued remaining work, construction/prerequisite lead time, supply, and the joint resource forecast. Simulate a small canonical queue schedule over that horizon; choose the smallest additional affordable producer capacity that meets the plan. Existing >=80% busy queues over 600 ticks are one expansion signal, not a required condition. An economic-to-military transition may begin extra construction before current queues are busy when its dated demand and income justify it. Allow traced survival, safer-location/redundancy and prerequisite needs. Initially admit one new general producer plan per base at a time, then admit the next still-needed producer after reconciliation; this is not a total building cap. Repeated unit types fill legitimate composition demand. A destroyed producer creates a replacement only if its capacity is still useful.
7. Implement renewable Field lifecycle and compatible deposits from the research component audit. Tending is a gather-order execution subphase where existing semantics suffice; do not add an unnecessary independent farm command. Source resources stay locked until mature. Automatic construction uses zero assigned builders where definitions specify it. Worker roles cannot conflict with transport or support.
8. Use shared production/research queues and real payment/refund rules. Limit ordinary queue look-ahead to two items per queue initially so adaptation is not trapped behind long stale queues. Reserve future payments correctly. Cancel only with a traced net benefit and tick cooldown; spent/refunded resources are observed, not predicted as cash.

### Purposeful composition algorithm

First implement [C1/C2 opening branches, dated force targets and affordability](11-classic-rts-and-difficulty.md). Total desired military population must come from useful mission demand, queue/resource forecasts and worker/supply obligations; percentages below do not create that total. Connect soft stance spending preferences without cash-hoarding quotas or double-counted mission tech. Author C-01/02/03 and D-04 now; Stage 14 extends supported branches rather than replacing their identities. Show total demand, deadline and opportunity cost in the debug view.

Keep one composition plan per army/task force: objective/domain, desired military population budget, primary role shares, capability constraints, current/queued/accepted contributions and evidence. Initial balanced distribution is 60% frontline, 40% ranged; when a legal useful support option exists, use 50% frontline, 35% ranged, 15% support. Shares refer to military population, with largest-remainder integer allocation and stable role tie-break; workers and unarmed transports contribute zero combat allocation.

Assign each unit a primary accounting role so a multi-role actor is not counted twice. Anti-air, detection-if-ever-supported, healing, shore fire and transport escort are capability constraints layered on that primary distribution, not extra fictitious units. Observed flyers require two legal anti-air attackers initially, or the affordable supported number if only fewer can exist. Useful existing dual-role actors satisfy the constraint once.

For each free queue: resolve producible eligible actors -> compute greatest positive role/capability deficit after pending commitments -> rank legal candidates by deficit reduction, objective-compatible effective combat/support value, time-to-ready and cost burden -> stable type ID tie-break -> propose one TrainIntent. Recompute projected contributions after each accepted proposal. If only one useful legal type is available, repetition is allowed with a clear reason; never force useless diversity. Unit names/class labels alone are not counters.

Exposure to new capability evidence raises role demand; decay/hysteresis prevents immediate reversal when a flyer leaves sight. Step 14 generalizes this baseline to tech/archetypes. No periodic random unit pick. Every queue choice publishes role deficit, alternative rejection, resource/producer obligation, and expected composition in the panel.

### Concrete anti-spam fixture

Desired Olival count 1; build command accepted but site not observed -> no second intent. Command becomes site -> still one commitment. Site becomes complete -> one ready actor. Destroy it -> exactly one replacement if forecast still needs it. Repeat 100 decision steps without changing demand -> no extra construction. Duplicate callback/replay does not spawn a second site. Repeat the same fixture for a producer, Granary/Field, and two independently justified housing slots.

Output: both faction openings, delivered-income economy, supply, shared queues, persistent demand and composition plans, live debug fields, and authored macro fixtures. None of the required no-op behaviors from Stage 1 may remain on these paths.

### Forecast and duplicate acceptance details

- Keep the 600-tick tactical economy horizon, plus dated strategic demand through 2,400 ticks for planned military transitions and infrastructure lead time. Do not fully reserve speculative two-minute spending as immediate cash; distinguish committed payments, planned costs and confidence-weighted forecasts. Aggregate every queue, building, research and expansion consumer once by demand identity.
- Additional WorkMill/MiningCamp/Granary service areas are justified by safe travel-time savings, congestion relief and remaining resource life versus their construction/resource cost. Compare the existing best legal deposit to each new candidate. A new service-area identity does not evade accounting for existing nearby capacity.
- Estimate job capacity from actual source/service/path constraints and observed delivery cycles, not just count workers. Assign the next worker to the best marginal delivered income; transfer away from saturated or projected-surplus jobs with hysteresis. Do not treat 12 workers/base as an immutable population cap when useful demand grows.
- Publish throughput target/deadline, predicted completion with/without another producer, queue utilization, resource bottleneck, marginal deposit travel savings, and any redundancy reason. Do not let a generic `strategic_need` string substitute for evidence.
- Author the positive and negative duplicate cases in [the scenario specification](08-deterministic-scenarios.md), including two useful producers, two useful drop-offs, several same-type units, and suppression only after the requested capacity is fully committed.
- Apply H5's player-wide optional reservation exposure, measured-income correction, viable recovery floors and spawn-clearance checks. Run H-11/13/16/17/18 and the Stage 7 actual-faction economic smoke. A completed producer must receive useful work or a bounded real blocker; empty buildings with impressive forecasts fail.

### Stage 7 retained final acceptance

**Acceptance**

- Every supported faction/map fixture reaches worker, housing, producer, and first-squad milestones.
- AI neither remains supply-blocked nor queues redundant emergency housing in authored fixtures.
- Idle workers, production idle time, and unexplained resource float improve versus baseline or meet reviewed bands.
- Destroyed builder/producer/prerequisite recovers through a valid fallback.
- Production never substitutes a generic ranged label for anti-air capability, counts transports as combat power, or builds naval assets for an irrelevant water region.
- No stage acceptance depends on an enemy standing idle.

## Stage 8

Model: Sol / high. Source anchors: NavigationService, WaterNavigationHelper, height graph/occupancy, FlyingComponent, Container/Containable, boat spawn/rally, pawn EnterContainer and shore behavior.

1. Build cached region/transfer graph from existing movement authorities with stable region IDs and versioned invalidation. Distinguish static known terrain, observed dynamic blockers and unknown regions. Include ground, water, elevated/ground connections, air reachability and legal transfer points. Amphibious/flying-container edges require executable capability.
2. A route query returns a typed result: direct movement/firing route; water transport; air transport; air/naval objective; pending knowledge/work; or impossible with reason. Include required assets, source/destination nodes, pickup/unload candidates, integer distance/risk cost and graph generation. For attacks query legal firing positions, not the occupied target tile.
3. Implement one transport plan with phases proposed/reserving/gather/rendezvous/boarding/transit/landing/unloading/regroup/handoff plus recovery/cancel/fail. Each passenger, transport seat, escort and physical landing slot has one compatible owner. Routes are shared geography; reserve bottleneck service/time slots rather than blocking all future use of a sea region.
4. Capacity may require production; create one capacity demand linked to the operation. Mobile containers are transports; deposit containers are not. Required passengers for island establishment include builder and protection; record indispensable members and allowed partial departure. Initial boarding timeout is 600 ticks; departure requires all indispensable members and >=75% assigned capacity, otherwise reroute/reassign/cancel by bounded recovery.
5. Score pickup/landing on compatible ground/water reachability, observed threat, unload room, travel and onward route. Recheck before unload. Default travel timeout is max(600 ticks, 2*estimated travel ticks); status/obstruction outcomes may justify extension with a bound and reason.
6. Execute shared load/move/unload commands and consume outcomes; move passengers back to squad/economy ownership only after confirmed unload and regroup in intended access region. On transport death account for actual runtime cargo survival/death, then release/recover claims. No invented rescue/teleport.
7. Save every phase, manifest, deadline, route generation and pending outcome. Reconcile upgrade capacity/ownership and deposit occupancy before boarding. Add live transport/route debug views and overlay.
8. Add actual CommonBoat water fixture and a separately marked flying-container test definition proving no boat-only shore assumptions. No production roster changes to force faction symmetry.
9. Apply H7/H8 route clearance, query isolation, phase progress and ownership cleanup. Run H-19–21/29 and the real boarding/unsafe-landing focused gate. Test actual duty after unloading and transport reuse, not just the unload animation.

Output: legal reachability everywhere objectives are selected, water transportation and failure recovery, generic future air-transport contract, no impossible direct ground command loop.

### Stage 8 retained final acceptance

**Acceptance**

- Equivalent map state produces the same access graph, feasible route ordering, transfer points, and route reason codes.
- A ground squad never receives a direct order into a disconnected ground region; it gets a complete feasible route plan or an explained unreachable result.
- The water-transport fixture gathers, boards, sails, unloads, regroups, and hands the squad to its objective without duplicate or orphaned ownership.
- Each passenger, cargo seat, transport, escort, rendezvous, landing slot, and destination has at most one compatible plan owner.
- Transport loss, a dead passenger, a closed route, and an unsafe landing each reach one bounded recovery/cancellation outcome without repeated command spam.
- Save/load during boarding, transit, and unloading preserves the next command batch, ownership, brain state, and digest.
- A flying-container test definition uses the generic transport lifecycle with ground pickup/drop zones and no accidental boat-only shore requirement.

## Stage 9

Implement [C3/C4](11-classic-rts-and-difficulty.md): question-driven scouting, stable opponent/region focus, protected-asset pursuit leash and useful post-battle follow-up. Connect profile offensive mission caps without suppressing essential scouts, independent defense or rescue. Run C-04/05/06 and D-04/05; Stage 13 refines tactical scoring. Add causal mission/economy timelines and read-only bookmarks from packet 12. A generic exploration percentage or repeated nearest-enemy selection does not satisfy this stage.

Model: Terra / xhigh. Source anchors: ScoutingManager, TargetingManager, CombatMicroManager, GameModeConditionChecker, ScoreTracker, Convertible/Owner and vision helpers.

1. Choose deterministic reachable frontiers/start hypotheses relative to map/base, assigned scout role and information value. Use permitted air/water scouts where supported. Explore last-seen locations when vision is lost; no remembered live ID target.
2. Build threat incidents keyed by base/region and hostile group evidence; distinguish worker harassment, army pressure, flyers, naval/transport landing, proxy/blocker and unknown contact. Incident expiry and escalation use ticks and confidence. Score defense with compatible weapons/routes.
3. Form persistent defense, attack, reserve and reinforcement squads by role/domain. Initial full-engagement preference: at least 6 assigned military population, ready fraction >=75%, legal objective/retreat route, and local estimated advantage >=1.2. H6 supplies mission-specific launch/progress rules; uncertainty or this preferred threshold cannot block useful scouting, raids or pressure indefinitely. After 1,200 assembly ticks choose an explained smaller safe probe, alternate objective, reinforcement request or cancellation; never wait indefinitely for an impossible roster.
4. Assign objective by urgency/value/feasibility: local threat -> blocker -> known reachable enemy economy/production -> search. Attack objective ownership outlives a single target actor. Invalid target causes legal search/retarget, not random full-army reassignment. Keep initial 25% home reserve when army size permits, but size each response by compatible threat strength, travel time and asset loss risk. Reserve percentage is an initial preference, not a reason to recall the whole army for a scout or retain an insufficient defense during a major raid. High imminent danger can recall main army through arbitration. Maintain independent objectives for concurrent fronts and reinforce the highest marginal useful engagement.
5. Add basic air scout/intercept/harass and naval escort/intercept/shore fire only when weapon and path allow it. Coordinate task-force timing with transport; normal ground squad is not forced into the fleet's formation.
6. Add one bounded neutral-approach claimant per opportunity, revalidate ownership and consume deterministic conversion outcome. Allied defense uses permitted information, own units and local survival floor; no remote teammate orders.
7. Build a pure mode objective/recoverability evaluator using actual win/loss/tie settings. Require sustained hopelessness for 1,200 ticks before concession, interrupted immediately by a feasible recovery/win route. Preserve last-building/time/stockpile objectives. Dispatch authoritative concession; GameModeConditionChecker/ScoreTracker produce exactly one final result/score scene.
8. Fill debug purpose/next actions, exploration/knowledge/threats, basic squad/mode/concession views and overlays.
9. Implement H6's first complete mission lifecycle now: independently useful objective effect, assembly/launch deadlines, reinforcement/regroup and a next mission. Run H-22–24 and SEQ-01's supported land core path before Stage 10. The first offensive launch target is 10 simulated minutes on viable Normal fixtures; expansion is not a substitute. Recovery is already supervised by Stage 6, with detailed domain repair extended at Stage 12.

Output: first complete skirmish loop connected; run the focused complete-land-match, income, first-attack/continuation and minor-raid gates before Stage 10. Author all unseen-enemy, neutral/team, victory/concession/score and island variants for Stage 15. A smoke pass is not final release validation.

### Stage 9 retained final acceptance

**Acceptance**

- Normal AI finds an unseen opponent through legal exploration.
- An observed early threat receives a defense response within the profile delay.
- An observed flyer creates a response that can actually target air; observed ships/transports create only reachable naval/shore responses.
- A stable match produces a purposeful attack wave and retarget/search behavior, while a transport operation receives escort or interception when risk justifies it.
- A hopeless AI concedes once through an authoritative event; recovery cancels pending concession.
- Win/loss/concession reaches the score screen in the runtime fixture.
