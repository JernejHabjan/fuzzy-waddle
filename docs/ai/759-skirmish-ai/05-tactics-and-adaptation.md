# Stages 13–14 — tactics, adaptation, and completed debug experience

Read [runbook](00-start-here.md), [shared decisions](01-shared-decisions.md), [debug contract](06-debug-panel.md), and research sections on combat/support and difficulty/archetypes. Dependencies: Stages 0–12 at least `implemented_unvalidated`. Apply [hardening](09-progress-and-hardening.md) and author [focused cases](10-integration-and-adversarial-tests.md); Stage 15 executes full acceptance. Any older “run” or `stage_checked` wording below means author/defer or `implemented_unvalidated` under the runbook's latest policy.

## Stage 13

Complete [C2/C4 timing, bounded pursuit and post-battle exploitation](11-classic-rts-and-difficulty.md), including C-02/05/06 and D-05. Finish [packet 12's debug workbench](12-debug-workbench.md): isolated tick/decision stepping, named breakpoints, pure what-if, capture/replay/diff and DBG-01–06 using the Stage 5 runner/bridge. Live history navigation never steps or pauses a multiplayer match. Calibrate predicted versus actual local combat outcomes offline; do not make estimator confidence self-proving.

Model: Sol / high. Source anchors: CombatMicroManager, TargetingManager, Attack/Healing/Health/Spell/Status components, attack/high-ground/projectile helpers, pawn behavior, squad/transport/fortification reducers.

1. Generalize squad state to forming/assemble/rally/advance/engage/defend/regroup/retreat/recover/reserve with explicit transitions and one primary owner per actor. Coordinated ground/air/naval task forces contain domain-specific squads; passengers transfer ownership only after actual unloading/regroup.
2. Extract a bounded pure engagement estimator using runtime-consistent effective health/armour application, selected attack damage/cooldown/min-range/high-ground/arrival time, visible statuses, area shapes and nearby eligible support. Use local region shortlists and pair quota. Never use hidden current HP/cooldowns or a made-up damage multiplier table.
3. Initial full-engagement bands: attack at estimated local advantage >=1.2 with safe retreat; retreat below 0.8 or critical asset/health danger; hold/regroup or choose a limited mission in the middle. H6 prevents permanent holding/uncertainty and retreat/relaunch oscillation; mission progress and deadlines apply independently of this local micro preference. Missing/uncertain data reduces confidence and aggression. Use objective risk, not solely raw totals; transports/cargo and temporary support have distinct value.
4. Choose among deterministic scripts: hold-front, advance/focus, ranged-distance, spread-against-area, protected retreat, intercept air/transport, naval control, escort, land/regroup, rampart defend/reinforce/withdraw. Score a small authored portfolio; no tactical search or online learning.
5. Assign legal positions per domain and formation role using bounded spacing/occupancy candidates. Preserve weapon firing opportunities/windup, issue only materially changed orders, and avoid moving ranged units inside min range. Target changes need a >=20% useful-score improvement or invalid/dead target; persist existing target within commitment.
6. Add damage reservations through expected impact. Release on rejection, death, expired shot, changed target and authoritative miss. Estimate actual armour absorption semantics, and avoid having every archer fire at a nearly dead target when enough damage is already pending.
7. Support proposer consumes real spell availability/cooldown/research/effect flags. Reserve caster window plus useful target effect/healing capacity; respect pawn autocast ownership. Area candidates are bounded observed clusters/ally groups with stable tile tie-break. Healing utility caps at missing health and pending heals. Same-type status refresh is not full extra stacking value.
8. Avoid harmful observed zones on movement/rally/landing; use beneficial zones when safe. Stun/slow influence deadline and strength. Temporary summons have expiry and cannot become permanent economy/base/surrender evidence.
9. Implement reachable elevated posts, protected stair reinforcement, observed approach concentration and evacuation on topology loss, while retaining a mobile reserve.
10. Finish ALL debug panels, plan/command drilldown, scrolling/empty states, snapshot history/export and overlays in packet 06. Remove mutable live queries and wall-clock strategy calculations from the current labels.
11. Complete H6/H9: mission-effect/loss accounting, false-progress/retreat oscillation, protected reinforcement routes, optional proposer isolation and finite numeric guards. Run H-23–26/30 plus the core match smoke; tactics cannot make an otherwise productive macro AI permanently hover outside a fight.

Output: purposeful coordinated combat/support across actual domains, with every action explained and no actor/caster ownership conflicts. Author geometry/effect/cooldown/overkill/retreat/air/naval/rampart and UI projection fixtures. No required panel may remain a count-only placeholder.

### Strategic objective selection and scenario obligations

Include [the STRAT, RAID and FIGHT scenarios](08-deterministic-scenarios.md) in the squad/objective implementation, not only micro targeting. Generate bounded objective candidates for exposed economy/production, unfinished expansions, resource denial, reinforcement interception, important terrain, exploitable breaches and finishing the enemy core. Estimate permitted value, compatible available force, route/travel, likely losses and opportunity cost to the main front. Use a small harassment squad when its mission can succeed; withdraw/redirect when response makes it unfavorable. A safe decisive finishing objective outranks optional economic optimization. When behind but recoverable, compare feasible higher-risk denial/raid/all-in/expansion alternatives using the same observed facts; do not treat a desperation flag as permission for cheating or unsupported units. Explain why the chosen objective beats alternatives in the panel.

Stage 9 owns initial squads/incidents; Stage 13 completes severity-scaled simultaneous-front allocation, terrain/opportunity/harassment scoring, escalation, retreat and reinforcement. Stage 14 links changed confidence/threat to composition and technology. A generic goal label without these connected behaviors does not fulfill the scenario contract.

### Stage 13 retained final acceptance

- Each combat actor has at most one primary squad assignment.
- Every squad path, target, rally, repair, and retreat location is legal for its movement and weapon domains; transport passengers return to ordinary squad ownership only after verified regroup.
- Favorable engagement objective completion does not regress; unfavorable retreat survival improves or meets baseline-derived bands.
- Target switches, repeated orders, and estimated overkill improve in focused fixtures.
- Disconnected/slow units recover or leave squad state without stalling it.
- Rampart defenders occupy distinct reachable posts, retain a mobile reserve, and can withdraw through a valid protected route.
- Tactical work remains quota-bounded and deterministic.

## Stage 14

Model: Terra / xhigh. Source anchors: TechProgressManager, ForceMaintenanceManager, research definitions/QueueComponent, actor-level-utils, tech-tree and lobby/profile contracts.

1. Extend Stage 7 composition with evidence-backed capability demands: observed flyers -> real anti-air; contested water/transport -> escort/intercept/shore fire; observed area damage -> spacing/ranged/support where useful; static fortified target -> legal range/air/alternate objective rather than a fictitious siege roster. Unknown capabilities stay unknown.
2. Every evidence item stores type, observed tick, confidence, source contact and permitted facts. Use existing memory decay and require support at two consecutive eligible decision evaluations before non-emergency composition transition, subject to the profile cooldown. Re-reading the same fact may establish persistence, never independent corroboration or additional enemy mass/confidence (C3/C-04). Keep committed production unless cancellation utility exceeds real refund/progress cost.
3. Derive role targets from strategic objective and known available roster. Recompute planned strength across ready/queued/accepted assets; do not train redundant counters because one unit satisfies primary role and a capability constraint. Retain viable fallback when a producer/tech path is lost.
4. Score research as estimated benefit over current useful army plus the next 1,200 ticks of likely production, minus resources, queue delay and survival cost. Only actor/spell upgrades actually available in the owning player's tech tree are candidates. Existing and newly produced actors use applied/runtime resolved level; update cargo and vision/attack capability after upgrade.
5. Implement authored profiles for balanced/rush/macro/turtle/tech and capability-available air-control/naval/expeditionary. They share legal macro/ledger behavior; vary role budgets, timing, defense/expansion utility and supported opening branches. No archetype can skip essential worker/supply/prerequisite recovery.
6. Initial variation: rush targets first safe smaller pressure force; macro raises worker/expansion utility; turtle raises justified fortification budget and home defense; tech values a legal upgrade after survival floor; air/naval/expeditionary requires relevant roster and map access. Unsupported selection falls back deterministically to balanced and explains why. Save archetype; ordinary threat response never rerolls it.
7. Finish lifecycle integration: lobby selected difficulty -> host brain -> save/load/replay/host migration -> score metadata/debug. Clean up migrated legacy mutation paths, orphan timers/cooldowns and dead flank/currentStrategy state; adapters still in use must be explicitly named and single-authority. Preserve existing comments or request direction only for a genuine comment-preservation conflict.
8. Ensure every mandatory component coverage entry has implementation, test ID, debug field, persistence owner and no unresolved required placeholder. Record concrete integration issues for Stage 15; do not falsely claim runtime validation. Write implementation architecture docs beside the owning AI modules now; refine verified learnings/skills at final closure.
9. Finish H1–H9 ownership coverage and live debug fields, adapt/cancel commitments without forgetting causal history, and author H-31/32 save/host/second-match lifecycle smoke. Record invalidated earlier evidence for mandatory Stage 15 reruns; close as `implemented_unvalidated`.

Output: completed connected behavior with focused gates authored but not run. Confirm Stages 0–14 are at least `implemented_unvalidated`, capture candidate provenance, audit/commit/push this stage and stop. Hand off Stage 15 with Sol / xhigh; start it only on the next user request. Do not proceed to deferred Stage 16.

### Stage 14 retained final acceptance

Finish packet 11's supported branch/timing library, difficulty behavior and persisted profile provenance. Run C-01/02/04, D-02/03/05; prepare the paired D-06 calibration manifest for Stage 15. Distinct enum labels alone do not implement difficulty. Easy keeps essential counters, economy, legal transport, defense and recovery; no errors or hidden bonuses are enabled to manufacture a challenge gap.

- Composition changes only from recorded permitted evidence and obeys hysteresis.
- Tech spending does not violate survival/supply/prerequisite reservations.
- Every exposed archetype completes its supported faction opening and recovers from a destroyed prerequisite.
- Air/naval/expeditionary archetypes are unavailable when the faction, map access graph, producer path, or objectives cannot support them.
- Hidden enemy composition cannot influence the decision digest.
