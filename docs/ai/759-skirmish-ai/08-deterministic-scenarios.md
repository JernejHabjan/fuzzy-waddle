# Deterministic strategic scenarios — implementation and acceptance specification

Required by the user's supplied “Deterministic AI Controller Scenarios” notes. This packet preserves their strategic outcomes and negative examples while resolving them against this game's actual capabilities. Read with [shared decisions](01-shared-decisions.md) and [final validation](07-final-validation.md). Model: Stage 5 harness on Sol/high; owning-stage fixtures on that stage's model; all fixture execution/repair and extensive release review/validation on Stage 15 Sol/xhigh.

- [ ] Stage 5 authors the schema, builders, independent assertion helpers, drivers, reporters and coverage manifest.
- [ ] Stages 6–14 author applicable cases with actual units/costs/bands without executing them. Include the mandatory [H1–H9 contracts](09-progress-and-hardening.md) and added H/SEQ cases for Stage 15.
- [ ] Stage 15 executes every mandatory case, its negative/control variants, determinism checks and runtime integration counterparts; repairs failures and publishes evidence.
- [ ] Final docs explain adding/replaying scenarios; no required case is passed merely because a test file exists.

The original 63 cases below are joined by H-01–32 and SEQ-01–08 in [the integration/fault packet](10-integration-and-adversarial-tests.md), C-01–06 and D-01–06 in [strategy/difficulty](11-classic-rts-and-difficulty.md), and DBG-01–06 in [debug workbench](12-debug-workbench.md): 121 named cases before paired variants. Apply [H1–H9](09-progress-and-hardening.md) progress/safety contracts to their assertions. In particular, a blocker string, optional expansion or token order does not establish useful recovery or offensive play.

## Two different questions, two kinds of assertions

1. **Is the decision sensible?** Assert allowed outcomes, budgets, spatial regions, reaction deadlines and invariants. Do not demand one exact tile, defender count, first train action or trace wording when multiple valid answers exist.
2. **Is the implementation deterministic?** Repeating the same version, seed, permitted observation/event stream and previous brain state must yield identical ordered decisions and hashes. Semantic flexibility between implementations does not permit different decisions between identical runs of one implementation.

Do not rely only on a planner's self-reported reason to pass a case. Check independent fixture facts plus accepted intent/state changes, and for runtime cases check actual command application and game outcomes. An AI claiming “defending” while leaving workers to die must fail. Conversely, emergency evacuation and local interception can both pass if they satisfy the authored safety and main-front constraints.

Use exact action/golden-trace assertions where identity/order is itself the contract: duplicate application, claim ownership, command authorization, save continuation and reproducibility. Version golden traces separately from semantic expectations. Never regenerate expected outcomes from candidate output.

## Required schema and file layout

Proposed new files, to be implemented rather than assumed present:

- Gameplay `src/lib/player/ai-controller/testing/`: typed scenario contracts, immutable observation/event builders, pure driver, independent assertion helpers and semantic reports; substantive exported types in their own files.
- Gameplay AI test fixtures grouped by `economy`, `production`, `strategy`, `scouting`, `combat`, `access`, `placement`, `recovery`, `lifecycle`.
- Phaser tests/runtime bridge: world setup through real actor definitions, normal components and shared commands, fixed-tick execution, permitted observation projection and independently measured results.
- `tools/ai/fixtures/skirmish-v1.json`: manifest linking stable IDs below to fixture files, owning stage, pure/runtime coverage, roster support, expected assertions, baseline compatibility and evidence.
- `tools/ai/run-skirmish-matrix.mjs`: one-command suite plus single-case replay/filter support. Add `--scenario <id>`, `--seed <integer>`, `--mode pure|runtime|both` to the Stage 15 interface; unknown IDs and failed/missing mandatory coverage return nonzero.

Each scenario requires:

| Field | Contract |
| --- | --- |
| Identity | Stable ID, schema/version, plain-English purpose, user requirement tags, owning stage |
| Supported context | Faction/profile/archetype, map/access pattern, legal capability mapping and explicit synthetic-only flags |
| Setup | Initial authoritative world, previous brain/goal state, stockpile/income/queues, ownership/vision, terrain/regions, seed and initial tick |
| Observation policy | What is visible/known/stale versus hidden; never feed fixture omniscience into the controller |
| Timeline | Ordered scripted events, ticks and deterministic opposing behavior; deadline/max ticks and warmup |
| Expected outcomes | Nonempty allowed outcome branches; each has required state/action/world predicates and numeric bands |
| Forbidden outcomes | Explicit negative predicates, checked throughout the observation window, not only at the final tick |
| Measurements | Committed capacity/count, throughput, travel, resource obligations, squad allocation, loss, response time and trace linkage as relevant |
| Runtime/determinism | Driver required, repetitions/seed set, render/order/save perturbations, comparable baseline support |
| Failure evidence | Candidate/config SHA, first failing tick and predicate, observed versus expected, command/trace/state excerpts and replay artifacts |

Use discriminated unions for assertion kinds rather than arbitrary executable strings in JSON. Validate manifests at the test boundary. Resolve actor names and numerical costs through real catalog definitions, then freeze resolved inputs in the report. Assertions should use fixture-authored expectations, not call the production planner to calculate the “expected” answer.

A pure scenario may supply a permitted observation sequence and acknowledged outcomes. A runtime scenario must start an actual world and derive observations from it. Do not script the candidate's future choices or feed “construction succeeded” without applying its command in runtime mode. Scenarios must have non-vacuity checks: sufficient resources, valid legal options and a reachable objective where the expected branch requires one.

## Default assertion conventions

- Decision response bound: at most two configured decision intervals after an observation is committed; navigation may add a fixture-declared bounded work allowance. Record event-to-observation latency separately. Never use wall-clock time.
- Infrastructure and production deadlines include actual build/train/travel time plus a stated service/decision allowance. The fixture records the numeric resolved bound before running.
- Unchanged fulfilled demand: observe at least 100 decision steps, including accepted-not-observed, active and completed states. **Duplicates are allowed until desired capacity is fulfilled.** A demand of three producers must not pass with only one.
- Local harassment fixture: use independently calculated compatible force bands. For the authored 30-unit main army / 4-raider case, make local defense sufficient with at most 30% of the army's compatible combat value and retain at least 70% on the original objective. These are fixture-specific bands, not a universal in-game rule. Escalated raids explicitly invalidate the small-response band.
- Placement: use tile regions, legal paths and geometry predicates rather than one tile. A forest/drop-off case should define a maximum round-trip path and, for example, at least 25% travel reduction versus the supplied far deposit when that geometry makes it achievable. Exclude reserved central footprints/corridors. A different safe, equally efficient tile passes.
- Composition: desired role/capability contribution is a range with useful strength/population accounting. Matchup expectations use the game's actual attacks/armour/range/target domains, not a fictional rock-paper-scissors table.
- Economic forecasts: verify resource demand is summed across consumers without double counting, adjusted worker assignment precedes the projected stall, and idle production is explained by real constraints.
- Persisted plan: small perturbations do not reset its identity, completed checkpoints or accumulated commitments. A material threat may cancel/suspend it with released/transferred claims and a new explained objective.
- Some examples mention archers, cavalry, stables, fishing or siege. Map them to a registered legal role where equivalent; otherwise use an explicitly synthetic pure capability fixture. Do not add those game mechanics or claim a production faction supports them. Keep the underlying throughput/counter/strategic-value test mandatory and provide a real-runtime equivalent where the game has one.
- Illustrative counts such as 47/50 supply must become valid states under the runtime fixture's real definitions; preserve the near-cap/queued-shortfall relationship if those exact totals cannot be constructed legally. Record the resolved numbers rather than changing live balance to fit an example.

## Scenario catalog

Every ID below is mandatory coverage. A row describing paired worlds requires separate positive and negative case variants. Stage ownership means author the focused subset here; Stage 15 executes the full matrix. These supplement, not replace, the root roadmap's low-level Level A/B cases.

### Economy, production and legitimate duplicates

| ID / stage | Setup and perturbation | Required decision/outcome and forbidden behavior |
| --- | --- | --- |
| ECO-01 / 7,10 | Goal gathers a forest with no suitable local deposit; legal WorkMill affordable | Plan and build a useful wood-compatible deposit near that forest; path/space bounds pass. No unrelated house/producer substitution |
| ECO-02 / 7,10 | Existing WorkMill serves forest A; distant forest B has valuable untapped income; control has an already-efficient B deposit | A second same-type deposit is admitted only in the beneficial world. Both remain owned/usable; no per-type uniqueness cap |
| ECO-03 / 7 | Small forest/service route saturated by 12 workers, better nearby source available | Worker 13 uses the alternative or its justified new deposit; do not increase congestion at the saturated source |
| ECO-04 / 7 | Plan six legal ranged units over 2,400 ticks; wood shortfall but other income sufficient | Increase useful wood assignment before the stall; preserve essential other income. Shared future resource consumers counted once |
| ECO-05 / 7 | Multiple queues, upgrade, expansion and supply consume the same resource; paired large surplus case | Respect aggregate obligations; cannot independently promise the same money. Transfer excess workers from surplus resource when another useful job exists |
| ECO-06 / 7,12 | Source nearly depleted, loaded worker, drop-off destroyed, crop still growing | Reroute/replace compatible service, preserve carried-versus-spendable accounting, keep tending/growth legal; no infinite farm/deposit rebuild |
| ECO-07 / 7 | Supply 47/50 with enough queued demand to exceed capacity; paired ample-free-supply case | Start enough real housing before block and count timely committed capacity once. No extra housing in the control; allow multiple houses for larger demand |
| ECO-08 / 7 | Both actual faction starts, including no worker; food depletion interrupts opening | Bootstrap worker/income and sustainable food, resume checkpoints; no assumption a worker already exists |
| PRO-01 / 7 | Dated 12-unit production goal exceeds one producer's attainable throughput; economy supports more | Admit sufficient extra same-type production capacity and associated resource/supply demand; complete deadline or explain a genuine infeasibility |
| PRO-02 / 7 | Same desired throughput with sufficient existing/queued capacity or insufficient supporting economy | Do not add empty producers just because cash is available; resolve the actual bottleneck |
| PRO-03 / 7 | Committed economic-to-military transition begins after construction lead time; current queues not busy | Prebuild justified capacity in time, link it to future demand; paired speculative/abandoned transition releases unspent optional claims |
| PRO-04 / 7 | Composition requires multiple copies of the same useful legal type | Queue enough repeated units to fill demand; no uniqueness/diversity rule suppresses useful copies; cease excess after commitments satisfy target |
| PRO-05 / 6,7 | Demand of 1, then 3 producers; accepted commands observed late, callbacks duplicated/out of order, one producer lost | Reach each requested capacity exactly once over 100 decisions after fulfillment; no blanket one-producer cap, no duplicate side effects, one still-needed replacement |
| PRO-06 / 7,12,14 | One exposed producer is strategically critical; safe redundancy is affordable; paired low-value/no-demand case | Fund evidenced resilient capacity or a safer replacement, rebuild useful lost capacity; decline needless redundancy |
| PRO-07 / 7,14 | Shared research/train queues, cancellations and pay-over-time obligations | No overbooked lane/resource, no predicted refund spent before application, no cancellation/requeue loop |

### Technology, counters and information

| ID / stage | Setup and perturbation | Required decision/outcome and forbidden behavior |
| --- | --- | --- |
| TECH-01 / 14 | Expensive upgrade affects only a few units early; paired large existing/committed eligible army | Early opportunity cost delays upgrade; larger beneficiary population raises priority and can justify research |
| TECH-02 / 14 | Useful optional upgrade competes with immediate base attack/supply recovery | Delay optional spending, preserve emergency capacity; resume only when survival permits |
| TECH-03 / 9,14 | Visible air production capability, no confirmed fleet yet; later actual flyers arrive | Limited anti-air preparedness plus information gathering, then strength-scaled real anti-air response; not full economy conversion from one clue |
| TECH-04 / 14 | Four observed units of one role versus repeated sightings/production and confirmed mass | Scale counter commitment by confidence and strength; maintain viable mixed plan under sparse evidence |
| TECH-05 / 14 | Confirmed hostile composition changes and old evidence ages | Change future production toward executable counters with hysteresis; no permanent stale composition and no gratuitous cancellation of useful queued units |
| TECH-06 / 13,14 | Actual heavy/armour/range matchup with legal effective alternative; paired unavailable counter tech | Use runtime-consistent matchup benefit; if unavailable choose valid tech/position/avoidance fallback, never invent a counter unit |
| SCOUT-01 / 9 | Unseen enemy starts plus unknown expansions/resource/access routes | Assign reachable information objectives; discover legally rather than target hidden IDs |
| SCOUT-02 / 9 | Enemy army unseen for long interval, previously observed composition stale | Increase relevant scouting; reduce stale certainty; no current hidden HP/location/queue leakage |
| SCOUT-03 / 9,13 | Scout discovers force, threatened escape route exists; paired unsafe escape | Preserve scout or use bounded risk fallback, update knowledge; don't automatically sacrifice every scout |
| SCOUT-04 / 9 | Discover production/tech, expansion, bridge/island and alternate approach | Knowledge changes relevant objectives/access plans; observed facts and inferred risks remain distinct |
| SCOUT-05 / 4,9,14 | Two worlds have identical permitted observations but different hidden enemy economy/army | Identical AI decisions/digest until legitimate observation differs; strategic reactions cannot consult fixture omniscience |

### Strategic purpose, simultaneous fronts and recovery

| ID / stage | Setup and perturbation | Required decision/outcome and forbidden behavior |
| --- | --- | --- |
| STRAT-01 / 6,9 | Early committed attack hits fragile economy | Suspend lower-priority spending/offense, protect workers through legal defense/evacuation/emergency production; bounded response and restored economy |
| STRAT-02 / 9,13 | Main force of 30 attacks expansion; 4 raiders land by boat or air at home, local response sufficient | Allocate limited compatible defense, protect economy and retain main objective; no whole-army recall or ignoring raid |
| STRAT-03 / 9,13 | STRAT-02 raid reinforced into serious economic/base-loss threat | Increase defense, partially/fully recall when needed; old offense commitment cannot lock out survival |
| STRAT-04 / 6,9 | Committed attack goal; one harmless scout appears, then disappears | Handle locally and preserve goal/step/claims through noise; no strategic flip-flop every tick |
| STRAT-05 / 6,13,14 | Same goal, then visible major counterforce blocks it | Suspend/retarget/retreat and adjust future plan; do not blindly continue an unfavorable attack |
| STRAT-06 / 6,7,14 | Same elapsed game time, two worlds: strong economy/ready force versus damaged workforce/weak defense | Different state-driven phases: pressure/buildup versus stabilize/recover; no time-only build-order script |
| STRAT-07 / 9,13 | Enemy army elsewhere, exposed expansion/unfinished producer, defeated army or newly open breach | Exploit a safe high-value opportunity with an appropriate force; do not keep all army idle while doing low-value economy optimization |
| STRAT-08 / 9,13 | Overwhelming legal force and reachable exposed enemy core | Choose finishing objective and complete ordinary victory/score path; unnecessary farms/upgrades cannot indefinitely delay the win |
| STRAT-09 / 6,9,14 | Significantly behind but viable raid/denial/hidden-base/all-in route; paired truly unrecoverable mode state | Choose an evidenced higher-risk feasible comeback instead of normal booming; do not fabricate hidden knowledge or concede a recoverable match |
| STRAT-10 / 7,12 | Lose half workers, critical producer and most army during offense | Reduce ambition, rebuild worker/income/minimum defense and needed production before resuming unsupported aggression |
| STRAT-11 / 9,13 | Important choke/bridge/resource/reinforcement location versus low-value terrain | Control when marginal safety/economic/offensive value justifies commitment; do not spend heavily on meaningless map positions |
| STRAT-12 / 9,13 | Enemy depends on exposed resource deposit; own critical deposit becomes threatened | Compare denial/harassment against frontal fighting and defend own dependency proportionately |
| STRAT-13 / 9,13 | Two simultaneous substantial fronts with separate compatible forces/routes | Maintain independent squads/objectives and reinforcement priorities; no default single blob or uniform division ignoring severity |

### Air, water, transport and harassment

| ID / stage | Setup and perturbation | Required decision/outcome and forbidden behavior |
| --- | --- | --- |
| DOMAIN-01 / 8,9,14 | Water present, no worthwhile water economy/route/threat/objective | No naval demand solely from water existence |
| DOMAIN-02 / 8,9,14 | Supported naval capability can escort transport, control key route, intercept ships or attack valuable coast | Select mission-specific useful fleet; reject unreachable/irrelevant water regions. Water-based economy variant only when an actual or explicitly synthetic fixture supplies that mechanic |
| DOMAIN-03 / 8,9 | Island objective, costly land detour or defended ground entrance; legal transport alternative | Compare end-to-end routes, fund needed seats/escort, board/travel/unload/regroup; no impossible direct ground order |
| DOMAIN-04 / 8,12 | Transport destroyed, landing unsafe, indispensable passenger late, cargo capacity changes | Bounded recover/reassign/abort with reconciled ownership; no stranded permanent plan, duplicate passengers or endless ship production |
| DOMAIN-05 / 9,14 | Legal air capability reaches exposed backline, distant economy or vulnerable valuable unit | Choose air when travel/target value makes it useful; paired strong anti-air/no useful objective rejects excessive investment |
| DOMAIN-06 / 8,13 | Real anti-air/air/naval units plus ground-only weapons and mixed-domain squads | Assign reachable compatible intercept/escort/combat roles; don't count incapable defenders as adequate protection |
| RAID-01 / 9,13 | Exposed workers/drop-off/remote expansion/unfinished producer/reinforcement route | Choose valuable feasible harassment target and limited squad, not necessarily main army frontal attack |
| RAID-02 / 13 | Raid target reinforced overwhelmingly; another target open or safe retreat exists | Withdraw/redirect to preserve force; no suicide lock on old target |
| RAID-03 / 8,9,13 | Amphibious or air-delivered enemy harassment during own offensive | Exercise STRAT-02/03 through real landing/visibility/combat, not only an injected threat flag |

### Placement, expansion and fortifications

| ID / stage | Setup and perturbation | Required decision/outcome and forbidden behavior |
| --- | --- | --- |
| PLACE-01 / 10 | Food expansion needs multiple fields; central production/defense slots and corridors reserved | Efficient aligned field layout in safe economic space, valid tending/deposit access; no valuable central/corridor occupation when a suitable alternative exists |
| PLACE-02 / 10 | Safe outer fields versus exposed perimeter with safer inner alternative | Outer placement only when sensible; avoid a rigid “always outer” policy |
| PLACE-03 / 10 | Several housing/drop-off/producer footprints and simultaneous proposals | Preserve production spawn, worker/resource, army/rally, retreat and future building access in whole and incremental layouts |
| EXP-01 / 10 | Local depletion/congestion, distant valuable deposits, several expansion options | Select defensible high-benefit reachable site, including complete island establishment when needed |
| EXP-02 / 10 | Same expansion options while serious home pressure exists | Delay/redirect expansion to survival; no aggressive overextension solely due to resource abundance |
| WALL-01 / 11 | Important ground entrance between cliffs/water/buildings | Useful connected defense exploits terrain, covers assets and reduces required artificial wall length |
| WALL-02 / 11 | No working gate prefab; friendly workers and army need entrance | Preserve intentional opening and access through every construction prefix; no promise of a sealed enemy-only gate without runtime support |
| WALL-03 / 11 | Wall-top defense needs protected stairs and distinct tower coverage | Reachable posts, legal elevated firing and marginal tower coverage; no repeated useless towers or trapped defenders |
| WALL-04 / 11,12 | Breached wall/stair; paired no-longer-valuable perimeter | Repair/rebuild needed nodes and reposition defenders, or abandon invalid perimeter; do not restart full duplicate wall graph |
| WALL-05 / 11 | Ground wall proposal beside transport shore and observed air threat | Preserve shore/egress; don't credit walls with stopping flight or generic towers with nonexistent anti-air |

### Combat preservation and control

| ID / stage | Setup and perturbation | Required decision/outcome and forbidden behavior |
| --- | --- | --- |
| FIGHT-01 / 13 | Favorable engagement becomes unfavorable due to reinforcements, lost support or goal completion | Reassess and retreat/regroup within bound; do not fight to last unit after purpose/risk changes |
| FIGHT-02 / 13 | Damaged valuable ranged/support unit with valid escape/heal cover | Reposition/preserve without illegal teleport/min-range behavior or constant windup cancellation |
| FIGHT-03 / 9,13 | One favorable valuable fight and several minor distant contacts | Reinforce useful front proportionately; don't divide evenly or attack every contact with entire army |
| FIGHT-04 / 13 | Overkill targets, useful heal/control, status refresh, harmful zones, temporary support | Coordinated damage/caster claims, useful effects, safe positions and actual runtime impact timing |
| FIGHT-05 / 12,13 | Stunned/slow unit, disconnected retreat, dead target, wall blocker | Respect status durations, bounded recovery and real route/weapon legality; no repeated impossible orders |

## Cross-cutting variants and the oracle's own tests

Apply these to representative cases from every family and to every affected authority/persistence boundary:

- Permute equivalent actor/candidate input order; repeat identical seed three times; compare full decisions and authoritative/brain checkpoints.
- Save/restore immediately before/after admission, command apply, queue/site observation, squad transfer and important event; continued commands and semantic outcome match uninterrupted run.
- Vary render rate, pause/resume and game speed without changing logical input stream. Debug hidden/shown/frozen/exporting cannot affect a decision.
- Repeat callback/outcome and inject stale generation/owner/target; no duplicate construction/training/cast/claim or invalid targeting.
- Run both legal factions and difficulty profiles where relevant. Difficulty budgets may change response bands, never fairness or hard invariants.
- Run combined stress cases, not only isolated winners: delayed wood income + emergency house + production expansion; home raid + overseas landing; wall breach + stairs lost + worker evacuation; producer loss during upgrade; stale intel during late-game finishing.
- Add deliberate broken-output fixtures for assertion helpers: duplicate construction while demand satisfied, zero production while duplicate demand unmet, empty “defend” trace, wrong-domain defenders, omitted actual application, blocked corridor, excess full-army recall. The assertions must fail these. Also accept two different legal placement/defense alternatives to prove the oracle isn't over-specific.
- Require evidence existence and exercised branch/count checks; skipped/zero-assertion/synthetic-only runtime cases cannot silently pass the suite. Track unsupported current roster separately from a failed generic capability contract.

## Reporting and final gate

One report row per ID and variant: authored file, stage owner, pure/runtime status, resolved roster, seed, first decision tick, decisive measurements, forbidden-condition checks, determinism/save result and replay path. Include missing/unsupported/blocked cases in the summary; do not drop them from the denominator.

On failure retain the smallest reproducible setup, ordered events, chosen/rejected intent evidence, debug snapshot, exact assertion delta, command outcome and first divergent state path. Minimize failures with bounded removal of irrelevant actors/events only if the failure still reproduces; never overwrite the original.

Stage 15 must publish the coverage map from every user requirement group and retained root acceptance case to executed scenario IDs. Pass means all mandatory behavioral invariants and runtime counterparts succeed, or a genuine unsupported future mechanic is explicitly marked synthetic-only with its general contract tested. A missing test runner, unexercised fixture, unavailable required runtime check or failed mandatory behavior leaves the plan unfinished. Authored scenarios are not evidence that the AI already works.
