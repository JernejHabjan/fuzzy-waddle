# Integration gates and adversarial match testing

Read [the runbook](00-start-here.md), [scenario contract](08-deterministic-scenarios.md), [hardening rules](09-progress-and-hardening.md) and [Stage 15](07-final-validation.md). This packet is mandatory. It adds fault/progress cases and continuous match sequences to the original 63 strategic cases; it does not replace them.

The user's follow-up approves hardening including lightweight checks during implementation. The earlier prohibition on all checks until Stage 15 is superseded. Extensive build/release review, broad seed matrices, tuning and long playtests remain Stage 15.

## Verification ladder

Include the owning-stage C/D cases from [packet 11](11-classic-rts-and-difficulty.md) and DBG cases from [packet 12](12-debug-workbench.md). Extend this same runner/coverage manifest; do not create a disconnected debug simulator or defer foundational capture contracts until final UI work. The combined catalog now contains 121 named cases before variants.

### Every implementation stage

1. Read/review the changed code and immediate consumers, including errors, cleanup, defaults, docs and tests. Run scoped formatting/lint, actual-source type checks, and affected focused unit/contract regressions. Use the repository's actual current targets; Stage 2 supplies missing pure/protocol targets.
2. Run the owning row's focused cases from packet 09. Before Stage 5's runtime driver exists, use existing narrow planner/command/application tests. Do not claim they prove a full match.
3. From Stage 5 onward, run the small real-runtime smoke subset affected by the stage, plus the previously established core-loop smoke when shared behavior changes. Default seeds 1 and 2; same-seed repeat for determinism, not a broad balance sweep. Both factions for economy/opening changes; real supported roster for transport.
4. Fix task-caused failures before dependent implementation proceeds. An unrelated base failure needs evidence and every remaining relevant check; a required unavailable check stays blocked. Record exact command, revision/dirty-diff digest, fixture/config version and outcome.
5. Mark `stage_checked` only after the focused gate passes. This is not final release validation. A partially written stage or failed check remains `in_progress`/`blocked`; do not merely rename it to advance. After the gate and closure audits, commit, push/verify and stop; hand off the next stage/model/effort without executing it.

Full production builds are final by default. Run a targeted earlier build when changed packaging, bundling, code generation or editor assets cannot be meaningfully checked otherwise. Such a build is an integration necessity, not a reason to run the full product matrix after every change. Never disable CI, runtime validators or relevant safety tests to preserve the old schedule.

### Minimum executable vertical slices

| Checkpoint | Must really work together before continuing |
| --- | --- |
| Stage 5 | Real-world creation -> host AI/adapter -> shared command apply -> observable outcome -> safe save/replay; oracle rejects a deliberately bad outcome |
| Stage 7 | Actual faction start -> legal worker -> delivered income -> supply -> useful producer -> repeated useful unit production; no artificial fixture income to conceal a stall |
| Stage 9 | Normal land skirmish -> scouting -> assembled attack -> route/objective effect -> reinforcement/retreat/next decision -> ordinary result; retain economy during a minor raid |
| Stages 10–14 | The prior core loop still works while the new expansion/fortification/transport/tactics/adaptation behavior is connected |
| Stage 15 | All supported contexts, interacting failures, long matches, human-facing launch/debug/results and release evidence |

Stage 9 may need to repair earlier contracts to make the vertical slice work; do not record “integration later” for its basic economy/attack/recovery path. Sophisticated tactical refinement stays Stage 13. A short real-runtime focused match is permitted before Stage 15; extensive human review and large batches remain final.

## Harness integration and safe fault injection

Extend the Stage 5 CLI with explicit modes:

- `--suite stage-smoke --stage <0..14> --working-tree`: run an implemented smoke manifest against the current task tree; report HEAD plus changed-source/fixture digest. No baseline required. Unsupported stage or missing required driver fails rather than becoming a no-op.
- `--scenario <id> --seed <n> --mode pure|runtime|both`: reproduce a named scenario. Pure/runtime support is declared, not guessed.
- `--suite release --candidate <sha> --baseline <sha>`: clean isolated candidate/baseline sources and versioned complete manifest; includes original strategic cases, H-cases and SEQ-cases below.

These flags are required new tool work, not existing commands. Keep one runner/manifest and assertion library; do not build an unrelated smoke simulator. Report which implementation, real systems and assertion paths executed.

Faults attach to explicit test-only seams: dropped/delayed acknowledgment after real apply; reordered deliveries before canonical apply; stale query completion; blocked service; authority replacement; topology/ownership changes through actual runtime effects. Label transport/network infrastructure injection separately from scripted opponent combat. Never expose arbitrary spawn/resource/kill/owner setters as ordinary multiplayer debug commands. Compile/developer-gate the bridge and enforce the same protections server-side.

Every event has a fixed tick or a deterministic milestone trigger, latest trigger deadline, stable ordering and application count. If its prerequisite never occurs, fail the scenario; do not skip the event and count a pass. Runtime observation still obeys visibility. No mid-scenario cheat income, owner reset, teleport or direct planner-state repair unless the case explicitly tests boundary rejection and expects no gameplay effect.

## Added hardening scenarios

Each row gets independent semantic predicates, forbidden outcomes, resolved numeric deadlines and a failing-oracle control. Author in the owning stages from packet 09; run focused cases then and all applicable variants in Stage 15.

| ID | Setup / injection | Required result |
| --- | --- | --- |
| H-01 | Same recoverable blocker persists while its displayed next-check tick is renewed | Cumulative episode deadline still escalates and restores useful duty; no infinite explained inactivity |
| H-02 | Worker/army circles, flips state or changes plan ID without advancing purpose | Best-progress/cause tracker detects false progress; renamed plans cannot clear failure age |
| H-03 | Legitimate long training, crop growth or journey exceeds 200 ticks | Healthy work is retained with observed progress/expected milestone; watchdog does not repeatedly cancel it |
| H-04 | One child makes unrelated progress while parent income/attack remains stalled | Parent deadline still fires; unrelated chores cannot keep it alive |
| H-05 | Optional goal becomes infeasible while other useful work exists | Atomic safe release and bounded reassignment; no orphan actors or global concession |
| H-06 | Missing authoritative outcome after effect already applied | Same effect identity reconciles to actual state exactly once; no duplicate/refund assumption |
| H-07 | Effect completed and resulting actor was consumed/destroyed before reconciliation | Authoritative history proves application; absence of actor cannot cause second purchase |
| H-08 | Old outcome arrives after timeout, cancellation request or new host | Canonical epoch/sequence fencing and correct lifecycle; no resurrection of obsolete plans |
| H-09 | Duplicate command arrives after detailed dedup entry eviction/save restore | Safe watermark rejects stale reapplication; unresolved records were not evicted |
| H-10 | Outcome backlog reaches configured capacity | Backpressure preserves required records and unrelated safe progress; explicit bounded technical recovery if needed |
| H-11 | Food/worker/Granary/Field prerequisite cycle under scarcity | Cheapest legal feasible recovery chain or independently confirmed strategic infeasibility; no circular reservation wait |
| H-12 | Two projects each hold one resource needed by the other | Cycle detected, reversible reservation chosen deterministically, feasible work proceeds |
| H-13 | Many bases start optional projects and evade per-base caps | Player-wide exposure remains bounded; legitimate committed military/essential economy retains funding |
| H-14 | Repeated minor scouts or supply forecasts monopolize priorities | Emergency decays; feasible scouting/production/army lanes receive bounded service |
| H-15 | Genuine lethal attack competes with normal lane service | Survival preempts appropriate actors/resources while observation/reconciliation continue; no artificial “fairness” suicide |
| H-16 | Forecast shows high income but congested unsafe workers deliver little | Forecast corrected, optional commitments reduced, alternate useful jobs restored |
| H-17 | Producer completes but spawn is blocked or its planned unit demand vanished | Clear/reassign/cancel useful future obligation; don't build an endless series of empty producers |
| H-18 | Supply drops while high-cost military purchases are reserved | Reconcile queued/active supply and reversible reservations; legal recovery funded, no double subtraction |
| H-19 | Optional path never completes during an observed nearby attack | Local permitted defense still executes; query failure cannot freeze the whole brain |
| H-20 | Frequent topology changes invalidate generations | Bounded backlog/cursors, eventual stable-route publication and unrelated progress |
| H-21 | Region connected but actual unit/formation cannot clear corridor | Correct footprint/service route, alternate or bounded failure; no impossible mission loop |
| H-22 | Last enemy contact becomes stale; vacated region is explored | Hypothesis retired, legal search progresses; no permanent fear of nonexistent current enemy |
| H-23 | One straggler/optional support unit never reaches assembly | Useful force launches or changes to feasible mission by deadline; indispensable cargo rules remain respected |
| H-24 | No favorable full-army certainty, but safe raid/scout/denial opportunity exists | Bounded useful probe/mission, not permanent assembly or forced suicide |
| H-25 | Squad repeatedly retreats and relaunches at same choke | Detect oscillation, alter objective/force/route and achieve recovery/progress |
| H-26 | Reinforcement stream would feed isolated units into lethal route | Reachable grouping/alternate route or stop feeding; preserve useful main-front decision |
| H-27 | Wall opening gives direct hostile access; towers/posts are ineffective | Planner cannot claim sealed defense; improve measured coverage/topology or reject the layout |
| H-28 | Repeated short fortification prefixes bypass single-plan budget | Cumulative base/player commitments counted; stop unjustified new nodes |
| H-29 | Boat succeeds but cargo workers never resume income or boat remains reserved | Handoff releases/reassigns both passenger and transport roles; delivered-income/next-mission progress |
| H-30 | Optional proposer/debug throws or produces NaN/invalid utility | Boundary guards isolate faulty output, preserve valid orders and surface incident; no best-score corruption |
| H-31 | Save/load occurs during chronic block, lease expiry and authority reconciliation | Failure age, debt, claims, epoch and next legitimate decisions preserved; no reset exploit |
| H-32 | Second match starts in same app after disposal/host replacement | Exactly one current controller/player; old callbacks cannot act or leak state across matches |

## Continuous match sequences

These are skirmish soak/interaction tests, not a new campaign game mode. Each uses one continuous world and brain without resetting between disruptions. Require economy, military and authority progress together. Individual paired unit cases cannot substitute for them.

| ID | Sequence | Measured acceptance |
| --- | --- | --- |
| SEQ-01 | Ordinary legal start -> opening -> scouting -> first attack -> retreat/regroup or success -> reinforcement -> second mission -> enemy core finish | Both factions, Normal, supported land map; first offensive launch by 10 min, objective effect within fixed travel/combat bound, continuing pressure in subsequent viable windows, normal victory/score |
| SEQ-02 | SEQ-01 first attack away -> small boat/air raid at home -> raid grows -> workers flee -> defense stabilizes -> offense resumes | Limited initial recall then severity-scaled response, productive workers restored, no permanent defense stance after threat clears |
| SEQ-03 | Income established -> resource depletion + local congestion -> loaded-worker drop-off destroyed -> safe alternate source -> sustainable food -> expansion | Delivered income recovers within independent service/build bounds; useful duplicate deposits allowed; no farm/worker dependency cycle |
| SEQ-04 | Military transition -> partial queued spending -> supply structure and critical producer lost -> optional upgrade waiting -> rebuild -> new force | No ghost reservations/double spending; recovery essentials outrank optional research; productive capacity and military mission return |
| SEQ-05 | Island builder/combat transport -> unsafe landing -> reroute -> unload -> economy established -> return trip/escort loss | Actual supported transport faction; all ownership phases reconcile, useful delivered island income and later mission/evacuation, no stranded hidden backlog |
| SEQ-06 | Fortified front with deliberate opening -> hostile ground approach -> wall/stair breach -> post withdrawal -> repair/alternate defense -> outside counterattack | Measured defense value, friendly clearance throughout, bounded repair spend, mobile force still fights outside; air threat not credited as blocked by walls |
| SEQ-07 | Initial enemy composition -> stale sightings -> confirmed tech/counter transition -> failed assault -> revised composition -> alternate objective | Proportionate evidence response, no queue churn, useful retained units, bounded tactical recovery and meaningful new pressure |
| SEQ-08 | Active economy/attack + pending command -> save -> reload -> host transfer -> late old events -> finish -> second match | Exact saved continuation for equivalent logical inputs, applied-once effects, no duplicated brain/claims/results, clean new match |

Fixed disturbance timing must preserve the scenario's declared feasibility. For losses modeled by an opponent, use deterministic legal attacks; for lifecycle faults, use labeled test transport seams. Report damage and assets removed. A fixture that destroys every recovery route cannot demand normal recovery and then fault the AI for obeying defeat rules.

For core SEQ-01/02/03/04/07 start with 20–30 simulated-minute bounds, derive milestone sub-deadlines from actual costs/routes, and allow early victory. Transport/fortification/lifecycle sequences get explicit workload-derived bounds. Stage 15 includes three 60-minute soaks from these sequences with sustained legal adversarial events; avoid extending a match by disabling victory or spawning hidden reinforcements unless that variant is explicitly a non-victory stress test.

## Stronger final acceptance and evidence discipline

- Viable standard games require both a functioning economy **and** meaningful offensive activity. An expansion, new plan name or token move does not substitute for an attack. A genuinely defensive/recovering position is independently labeled by scenario facts; the AI cannot grade itself as “not viable” forever.
- For every critical recoverable disruption require actual role/objective recovery by the predeclared deadline. A terminal reason passes only if the independent world predicate proves the particular optional goal infeasible, another useful goal proceeds, or the match is genuinely strategically lost. Technical faults fail supported-game acceptance.
- Define scenario opportunity windows, minimum effect/loss bands and expected recovery milestones before running the candidate. Freeze the release manifest/config and report its digest. Tuning uses training seeds; final evaluation uses untouched holdout seeds, with all failed cases retained.
- Do not weaken mandatory liveness/fairness/authority assertions or reclassify a failing supported map as unsupported to improve results. Balance thresholds may change only with documented rationale and a fresh full affected/holdout run; preserve old versus new results.
- Keep correctness, strategic effectiveness and subjective fun separate. Win rate cannot hide a reproducible stuck state. A fixed opponent being beaten once cannot establish useful challenge.
- Report time without useful income, military readiness versus time not launching, time trapped in assembly/retreat/recovery, longest causal block, unresolved authority age, per-lane service delay, project exposure, mission effects and losses. Include p95/worst cases, not just means.
- Include multiple opponents/two AI players in focused contention/lifecycle variants and standard supported player counts in release coverage. Player-local IDs, quotas and claims must not collide.
- Human blind A/B feedback remains explicitly pending if unavailable; automated gates must stand on their own evidence. Never claim human validation happened when only a scripted match ran.

Record the exact stage smoke/final command and source/config/fixture versions in progress. Every H/SEQ ID needs owning symbols, debug evidence, pure/runtime status and retained reproduction. Missing required runtime support is a blocker, not an empty green test.
