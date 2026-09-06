# Cross-stage hardening — progress, safety and integration contracts

This packet is mandatory implementation scope, not optional polish and not a new stage. It strengthens [shared decisions](01-shared-decisions.md) and every Stage 0–15 acceptance list. Where earlier wording permits a blocked reason without a bounded recovery obligation, or strict priority without service guarantees, this packet is authoritative. Keep the model/effort assigned to the owning stage.

Goal: the AI must turn decisions into delivered income, usable forces, completed missions and recoveries. A valid-looking trace, busy units, many commands or an expanding queue do not prove useful play. Safety means no illegal effects; progress means useful feasible work eventually executes. A safe but permanently idle AI fails.

## H1 — progress is a measured contract

Add typed `AiProgressContract`, `AiBlocker`, `AiProgressEvidence` and `AiRecoveryEpisode` to the Stage 2 contracts. Reuse existing plan IDs and tick types. Every active goal/child plan/order has:

- owner and parent; stable causal failure key; state and entered tick;
- independent progress measurement, prior/best value, last meaningful progress tick;
- expected completion tick, no-progress deadline, next evaluation tick and absolute phase deadline;
- typed blockers with observed supporting facts, dependency IDs and resolving action;
- retry/escalation level, cumulative failure age, permitted fallback and claim-release policy.

| Work | Meaningful evidence | Not evidence |
| --- | --- | --- |
| Economy | Resource delivered, useful harvest/growth/service progress, improved reachable income route | Gather order reissued, worker circling, predicted income with no delivery |
| Construction | Legal site applied, actual build progress, completed usable capacity with access | New plan ID, repeated placement proposal, abandoned foundations accumulating |
| Production | Queue item applied and advances, legal unit spawns and joins useful duty | Repeated train request, indefinitely reserved resources, blocked spawn reported as success |
| Scouting | Newly permitted information or a reached information objective | Orbiting explored terrain, resetting frontier list |
| Army | Advance along feasible mission route, objective effect, effective defense/denial, orderly recovery | Rally/retreat oscillation, repeated target changes, a cosmetic “attack” stance |
| Transport | Required passengers board, route advances, cargo unloads and resumes duty | Boat motion without cargo progress, manifest resets, empty voyages |
| Fortification | Useful reachable prefix/post completed; breach actually repaired or safe withdrawal achieved | More wall length alone, repeated planning of an unusable ring |
| Recovery | Cause removed, productive role restored, genuinely infeasible option abandoned for useful alternative | Deadline reset, same blocker renamed, new parent plan with identical failed purpose |

Measure route progress as best validated distance/waypoint advancement, not arbitrary position change. Phase changes count only when authoritative prerequisites for the new phase hold. Aggregate child progress at the parent only when it advances that parent's objective. Completed irrelevant chores cannot keep a failed attack or income plan alive.

Default no-progress window is 200 ticks **after expected evidence is due**. Compute an initial expected next milestone from actual remaining travel/build/train/service time; a 30-second queue item is not stuck after 10 seconds of legitimate work. Record expected evidence and test the estimator. Phase deadline starts at entry, initially `2 * estimatedRemainingWorkTicks + 400`, bounded by a scenario/map-configured ceiling; absent estimates use a bounded investigation state, never infinity. Known stun or a genuinely longer route may revise the estimate using new evidence, but retain cumulative blocked age and a finite revised deadline. Fixture ceilings are independently authored, not copied from each fresh candidate estimate; repeated estimate inflation must fail the same way as repeated deadline renewal.

At deadline: revalidate cause -> repair/reassign/alternate -> cancel obsolete optional work -> choose another feasible goal. After two failed recovery changes for the same causal family or 1,200 ticks of no useful recovery beyond expected work, escalate to the parent/controller supervisor. These are initial tunable limits, not permission to cancel healthy long-running work. Do not reset cumulative age/retry history by changing actor/site/plan IDs. A terminal optional-plan failure releases its safe-to-release commitments and resumes another duty; it cannot leave workers/army permanently ownerless.

A valid wait records why, what externally observable condition will resolve it, when it will be revisited and its maximum scope. Economic impossibility, navigation pending, and infrastructure failure are distinct. Never concede because of a broken adapter, unavailable path service or missing command acknowledgment; those are technical faults, not strategic defeat.

## H2 — reservations cannot deadlock the economy

Add typed dependency edges for plans waiting on resources, supply, workers, producers, routes and service slots. Detect self-dependency on admission and bounded strongly connected wait groups during the supervisor pass. Unknown dependencies stay pending with deadlines; cycles do not become assumed feasible.

- Separate speculative forecast, provisional reservation, dispatched obligation, applied spending and refundable work. Never cancel applied work by merely deleting AI state.
- Before reserving an expensive project, preserve the cost/actors needed for its immediate prerequisites and the cheapest **actual legal** recovery route for essential income. No unconditional worker/food reserve exists when the game has no feasible route.
- Grant resource bundles atomically per admitted action; avoid one proposal hoarding wood while another hoards stone and neither can execute.
- Provisional non-dispatched leases initially expire after 200 ticks without real dependency progress. Renew only from progress evidence, not decision cadence. In-flight commands follow H3 instead; lease expiry is not proof they were never applied.
- Break a detected cycle by releasing the lowest-priority reversible reservation in stable utility/ID order, then retry the feasible prerequisite. Never release another player's resources, spent money or unknown in-flight effects.
- Test worker -> food -> Field/Granary -> builder cycles, supply -> queued worker -> housing, producer -> technology -> shared queue, and transport -> builder -> island producer dependencies.
- Recompute margins after losses, source exhaustion, observed delivery changes and cancellations. Stale income estimates cannot keep admitting projects which cannot be funded.
- Expose resources tied up by waiting plans, dependency chains, lease age and the selected cycle-breaking action in debug.

Bound prerequisite expansion depth and candidate count. A definition cycle, unavailable faction capability or required but unreachable resource returns a typed unsupported/infeasible chain with alternatives. Do not recursively add the same building/tech demand forever.

## H3 — uncertain commands and host changes have one answer

Extend Stage 3's shared command/outcome protocol, not an AI-only side channel. Use match/authority epoch, player, monotonic sequence and stable effect/correlation identity with explicit compatibility rules. Reuse existing IDs where they already guarantee these properties.

1. Sent is not applied; applied is not completed. Store the lifecycle and link it to queue/site/actor/service state.
2. If a receipt/outcome is absent for two decision intervals, schedule bounded authoritative reconciliation through the existing command/application/state-recovery seam. Do not generate a new effect ID.
3. At 200 ticks without reconciliation, isolate the affected commitment and mark an authority-health incident. Continue unrelated safe decisions within budgets. Query an authoritative processed-sequence/outcome checkpoint and world linkage; a missing actor alone is not proof of non-application because it may have completed, been consumed, destroyed or cancelled.
4. Retransmit the same effect only when shared semantics permit idempotent retry. Retry with a new demand effect only after authoritative rejection/non-application is proven. Conflicting/unknown evidence triggers bounded state recovery, never optimistic double spending.
5. Keep dedup outcomes and compact watermarks/tombstones across saves and authority transfer. Evict detailed old entries only after an acknowledged replay/recovery boundary; commands older than a discarded safe watermark are rejected as stale, not applied again.
6. New host owns a fenced epoch and reconciles pending work before dispatch. Late old-host commands and callbacks cannot mutate the new epoch. On a repeated unrecoverable authority failure enter an explicit controller technical-fault state and surface it; do not silently reset the opening or declare a normal concession.

Bound pending backlog separately from debug trace. Never evict unresolved application records to satisfy a UI/history limit. Apply backpressure to new work rather than dropping mandatory outcomes. Batch order remains canonical; out-of-order arrival cannot alter its authoritative application order.

## H4 — priority does not starve whole subsystems

The old global priority list is an urgency ordering **within conflicts**, not permission to run only the first manager each tick.

- Reconciliation, progress supervision and critical observation maintenance always receive bounded work first.
- Maintain separate proposal/continuation service lanes for essential economy, supply/production, scouting, army/threat response and optional infrastructure/tech. All configured lanes get their bounded evaluation turn, even when their proposals are rejected.
- Use canonical deficit-round-robin/age scheduling for non-emergency work, then utility within a lane. Initially each feasible non-emergency lane must get proposal consideration within four decisions and available compatible command service within eight decisions. If resources/actors truly conflict, expose the responsible commitment and recovery deadline; never promise an action without affordability.
- Hard danger may preempt units/resources, but not stop knowledge refresh, outcome reconciliation or recovery checks. Every emergency has threat evidence and an exit condition. Repeated harmless scouts cannot perpetually label all spending/units “emergency.”
- Limit one actor to one primary command owner and bound task switches. Separate manager-level evaluation from actor orders; a manager does not need to issue a fresh command to remain serviced.
- Preserve supply/worker survival without requiring a perfect economy before scouting or pressure. Optional expansions, walls, redundancy and upgrades compete with a dated military plan; they cannot continually consume its entire feasible budget.
- Budget violations defer optional work by stable cursor; do not skip already-due critical reconciliation. Size/reserve deterministic budgets explicitly and report lane service delay.

Test resource scarcity and genuine emergencies as well as abundance. “Every lane dispatched” under impossible resource constraints is not the acceptance criterion; bounded fair consideration and progress of feasible compatible work are.

## H5 — economy must be sustainable and useful

Keep the ledger/composition algorithms, with these additional requirements:

- Fit income estimates to delivered resource cycles with capacity, walking and safety bounds. Never multiply workers by ideal rate while ignoring path/service congestion. Use conservative deterministic smoothing and include sample age/confidence; stale forecasts reduce optional spending, not freeze all activity.
- Distinguish live recovery floors from aspirational worker targets. With one worker, sequence feasible food/wood/prerequisite work; do not assign simultaneous minimum workers to every resource. Evaluate legal zero-worker bootstrap explicitly.
- Supply planning includes available spawn positions and the completion time of capacity, not just nominal population. A full production exit requires clearing/repositioning through legal commands before more copies of the producer are proposed.
- Cap waiting optional infrastructure reservation exposure per player as well as per base. Default: no more than 25% of the per-resource budget left after dated essentials may be tied up by optional work that cannot dispatch yet. Compute this denominator before those optional reservations, not recursively from their already-reduced balance. Immediately executable, justified and affordable work is decided by ordinary utility/essential-funding rules; it does not need four times its cost in the bank merely to pass this waiting-exposure cap. Essential recovery can override with evidence. This is neither a lifetime spending limit nor a shared fictitious currency.
- Additional deposits/production are admitted by marginal local service/throughput/positioning value. Count all equivalent existing/in-flight capacity regardless of which old goal created it. New base or plan IDs cannot bypass duplicate accounting.
- Cancel optional projects when their purpose disappears, observing real sunk/refund cost. Do not repeatedly start and cancel construction to satisfy a nominal adaptation metric.
- Capacity that completes must be assigned productive work by the next two eligible decisions, or receive a real constraint/recovery contract. Repeated empty producers are a failed forecast even if each once had a convincing explanation.
- Reduced worker allocation needs a better useful job or a justified reserve; do not penalize all gathering of low-demand resources when safe reserves or future dated demand genuinely justify it.
- Preserve short and strategic horizons, but freeze commitment identity and recompute only unmet demand; forecasting itself cannot create infinite new purchases.

## H6 — attacks are complete missions, not issued orders

Every offensive mission records purpose, permitted target region/evidence, feasible travel/firing route, role/capability need, committed budget, force deadline, launch condition, retreat/regroup criteria, measurable success and next mission decision.

1. Select valuable reachable objective: pressure/raid/denial, vulnerable production, breach, map control that enables combat, or finish. Use observed uncertainty; do not require a hidden exact army comparison to leave the base.
2. Build/assemble a feasible force and merge reinforcements by stable ownership. One missing optional support unit or slow straggler cannot block everyone. Use indispensable-versus-optional membership, minimum useful force and bounded departure.
3. Keep 1.2 advantage as an initial preferred full-engagement threshold, not a universal permission to move, scout, raid or deny resources. Under uncertainty, gather information with a limited force or choose a lower-risk objective; do not wait forever for mathematical certainty.
4. Launch once mission-specific minimum is ready. Assess local fronts rather than comparing the whole friendly army against all enemy units visible anywhere.
5. Measure route advancement and objective effect. Lost/hidden target leads to legal investigation/retarget; it does not reset the entire mission.
6. Reinforce only when arrival can still be useful and safe. Merge stragglers at reachable rendezvous; do not feed isolated units down a lethal reinforcement route.
7. Retreat with a destination and regroup milestone; choose recovered force/replacement/alternate mission by deadline. Retreat/relaunch ping-pong at one choke is failure even if all moves are individually legal.
8. Replenish useful losses and take another mission when opportunity remains. Do not return permanently to booming after one token attack.

On viable standard land fixtures, Normal must launch a purposeful offensive mission by 12,000 ticks (10 simulated minutes), earlier if the authored opening supports it. After a viable opportunity is independently established, launch/redirect within 1,200 ticks plus documented force-readiness work; uncertainty requires active reconnaissance rather than a silently extending deadline. Mission effect deadline includes actual travel, engagement and service bounds fixed by the fixture. During each subsequent viable five-minute opportunity window, require objective progress or a new effective mission. Expansion alone does not satisfy offensive acceptance. Do not force suicide attacks during a genuine losing/survival state.

An objective effect is independently observed useful damage/denial, worker evacuation forced, a strategic route opened, a valuable position held for the authored duration, or enemy defeat—not command count or a trace label. Use matchup-specific minimum effects and loss budgets. At least one standard enemy-economy pressure case must actually reach and contest/damage its target; don't let all attacks pass as distant “map control.”

## H7 — environment, knowledge and access cannot globally stall

- Atomically publish immutable observation generations, but do not require every optional expensive path query to finish before urgent permitted local defense works. Keep a complete last committed generation and bounded independent query products; never mix partial enemy/owner state.
- Model known-unreachable, temporarily blocked, unknown/unexplored and service-failed separately. Unknown access creates an information job; service failure creates a technical/recovery job, not a false strategic impossibility.
- Process navigation deterministically in work chunks or a fixed logical barrier independent of Promise completion time. If required work is incomplete, defer its dependent objective only. Repeated invalidation must retain useful stable subregions/cursors and receive guaranteed service.
- Retry stale query generations with bounded lifetime and one owner. Storms of topology changes must not allocate unbounded requests or keep every route permanently pending.
- Evaluate actual unit footprint/clearance and source/destination service room, not only region connectivity. A thin corridor “connected” for one worker may not serve an army or transport unload.
- Static geometry, known dynamic occupancy and threat freshness have separate revisions. Do not fully rebuild the whole map for an unrelated actor move.
- No target absence becomes destruction without permitted evidence. Search covered last-known areas and reachable alternative regions in bounded order; a stale invincible enemy hypothesis must not prevent finishing a match.
- Handle compatible faction/map combinations explicitly. No viable travel/weapon/production path to any opponent is a gameplay-support limitation that needs a clear preflight warning/restriction or legitimate mode outcome, not endless transport requests. Do not silently remove supported maps from the release denominator after failures.

## H8 — transport and fortification have bounded ownership and cost

Transport: reserve only seats/services needed for an actual mission; ensure pickup, unload, onward route and safe failure plan before investment. A trip may carry multiple unit copies and share geographically compatible routes without conflicting seat/time claims. Partial boarding rules cannot leave indispensable workers behind. Repeated unsafe unloads must reroute, retain safe cargo or abort; an escort's failure cannot steal all home defense. Economy workers resume a valid delivered-income job after handoff. Returning empty assets become available for a later mission, not permanently reserved.

Fortifications: evaluate enemy ground paths and friendly access together. With no gates, an intentional opening may remain an enemy route; credit **measured approach restriction and defended coverage**, not imaginary sealed security. Include minimum hostile detour/exposure value and occupied reachable posts in runtime assertions. Repeated prefix plans cannot bypass base/player wall budgets. Stop adding wall length when the protected area has lost value. Destroyed stairs trigger defender withdrawal or bounded repair, not teleportation or abandonment in a permanent unreachable state.

Economic placement: reserve corridors with actual clearance and destinations. Revalidate after each applied building and after capture/destruction. AI recovery from its own construction must use legal cancel/remove actions only if the game supports them; prefer alternate routes/sites or avoiding the bad placement. Do not silently delete existing player structures as “unstuck.”

## H9 — bounded degradation, saves and debugging

- Validate finite numeric inputs, units, schema versions and stable IDs at boundaries. Unexpected NaN/negative cost/invalid capability is a diagnosed invalid input; it cannot rank as best utility or reserve corrupt capacity.
- If an optional proposer fails, isolate its generation and retain valid existing orders. Record a bounded fault and retry only after a cooldown/state change. Do not silently swallow exceptions or let a debug-render failure stop simulation. Mandatory authority corruption follows H3's technical fault policy, not an unsafe fallback.
- Save debt, deadlines, leases, query cursors/revisions, causal recovery age and command authority epoch. Pause/game speed must not age them by wall time. Reload cannot clear a chronic failure or create fresh duplicate demand.
- Use match lifecycle dispose/fence on new game, reload and host replacement. Test two consecutive matches in one app session; old callbacks, subscriptions and actor references cannot issue orders into the new game.
- Debug shows last **useful** progress, due milestone, blocker age, dependency/cycle, service starvation, reserved exposure, command uncertainty and mission outcome. Differentiate waiting legitimately, recovering, failed optional goal, technical fault and strategic defeat.
- Keep bounded data/history per player and scenario; reports/logs must not reveal hidden current enemy state to ordinary players. Debug export and detailed world diagnostics remain authorized developer/host tooling.

## Stage allocation and focused gates

Under the latest runbook policy, “focused evidence before advancing” below means the owning stage must author the named fixture/oracle and record it as `authored_not_run`. Stage 15 executes every focused and integrated gate. Stages 3–14 close as `implemented_unvalidated` after manual audits, commit, and verified push.

These additions extend existing stages, not postpone core recovery to Stage 12:

| Stage | Required hardening increment | Focused evidence before advancing |
| --- | --- | --- |
| 0 | Preserve planner prerequisite and pinned source provenance | Existing accessibility/permutation regressions |
| 1 | Real success predicates, invalid-capability reasons | Polarity, housing, no-op and reason tests |
| 2 | Typed H1–H4 contracts, invariant guards, units/defaults | Serialization/migration, numeric guards, dependency identity |
| 3 | H3 applied-once reconciliation/epoch fencing | Lost/late/duplicate outcomes, stale host, applied-versus-completed |
| 4 | H7 generation/query isolation and fair evidence | Delayed query/local defense, invalidation storm, hidden-world equivalence |
| 5 | Real-runtime driver, progress/oracle assertions and restart artifacts | One real-world bootstrap/command/save replay plus deliberately failing oracle controls |
| 6 | H1/H2/H4 supervisor, wait cycles, lane fairness and basic recovery | Starvation, atomic grants, false progress, lease versus uncertain command |
| 7 | H5 economy and dated military capacity | Both-faction opening/income/supply smoke, circular bootstrap and idle producer recovery |
| 8 | H7/H8 journey progress/cleanup | Actual boat trip and failed landing/boarding recovery |
| 9 | H6 initial mission lifecycle and strategic supervisor | First complete supported land match; attack continuation and minor-raid/main-front smoke |
| 10 | Clearance, multi-base exposure and economic fallback | Spawn/corridor blockage, useful duplicate deposits, safe expansion |
| 11 | Actual wall defensive effect and bounded cumulative budget | Hostile route through opening, stairs/post access, prefix-budget bypass |
| 12 | Complete causal recovery across all domains | Cascaded losses and unchanged blocker/deadline evasion |
| 13 | H6 mission completion, loss limits and reinforcement safety | Retreat/relaunch oscillation, stragglers, local-versus-global strength |
| 14 | Counter evidence stability, adapted commitments and full integration | Stale-tech overreaction, reservation release, same-app second match |
| 15 | Complete fault/longitudinal/stress/holdout coverage | All packets, full review/builds, evidence-based closure |

Use the existing source/destination map: pure contracts/reducers and assertion helpers belong in gameplay AI; authority, path/actor adapters and actual outcomes belong in shared protocol/server/Phaser ownership seams. Do not implement a second global scheduler or simulation engine solely for hardening. Every H-section needs a named implementation owner, debug field, persistence policy, focused test ID and final runtime case in the coverage ledger.
