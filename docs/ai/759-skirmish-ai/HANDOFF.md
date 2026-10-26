# #759 — resume here

Read this page, then the selected package in [REMAINING-WORK.md](REMAINING-WORK.md).
[CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) retains outcomes; [CI-RESUME.md](CI-RESUME.md) describes the existing matrix.

## Current scope and stop boundary — 2026-10-25

- Branch `feature/759-skirmish-ai`; source base `f083fddbc483a0741c35697c70c24c6c98414f94`; Node 24.18.0 / pnpm 11.14.0.
- Latest user direction supersedes the earlier batch stop: finish the two-faction victory gate, then continue through
  all remaining roadmap packages without stopping at each passing gate. Track progress and keep the next action explicit.
  No commit, push, PR change or merge is authorized.
- Packages 1–2 retain earlier evidence (8/8 production, 16/16 economy/technology). The new unexpected-producer-loss case
  exposes an additional recovery gap; do not treat those earlier results as proof of this case.
- Package 3 remains in progress after the SEQ-01 gate passed. Package 4 pure contracts pass; its first grouped native
  capture exceeded the result-artifact bound. A one-variant PLACE-01 capture exposed both native evidence overflow and
  a real contradictory order; the newly selected native obligations remain 0/22 closed, with packages 4–7 and the
  larger native/real-peer batch still outstanding.

## Supported findings and current blocker

- The old SEQ-01 product-map workload was contaminated: River Crossing starts with 59 opponent-owned showcase/campaign
  actors, compared with seven in the other variant. Native proof: v63 `1792872198351-failed.json` under
  `tmp/ai-skirmish-matrix/759-seq01-stale-retreat-order-v63/`. Core destruction alone is not the mode's victory rule.
- A frozen test-only bridge scene now retains terrain/resources and normal faction spawns. Plain natural starts won
  for both factions (v65), but each had only seven military units. The eight-unit assertion was retained. Two explicit
  faction-correct opponent producers are authored at scene markers to exercise force assembly; no runtime preset or
  resource grant is used. Old product-map compatibility remains a separate known failure, not silently validated.
- v68's committed input showed the placement veto: AnkGuard needs a radius-2 construction footprint, but the original
  18x18 observed home area had zero unblocked 5x5 footprints. Builders were reachable and resources exceeded cost.
  Radius-16 observation fixed producer rebuilding; native Tivara reached tick 8,000 with a completed replacement at a
  new site. The subsequent tactical capture found the mission-recovery liveness bug; its one-retry repair is retained.
- Full SEQ-01 with fixed radius 16 and mission retry passes both factions: Tivara wins at tick 18,000 (eight military,
  1,668 damage, four enemy losses); Skaduwee wins at tick 12,000 (eight military, 1,764 damage, four enemy losses).
  Artifact: `tmp/ai-skirmish-matrix/759-seq01-two-faction-recovery-retry/1792876589145-passed.json`, 30,000 aggregate
  ticks, one browser process, fixture digest `fnv1a32:5406a5d4`.
- User requested map coverage to grow as construction space is consumed. Adaptive observation starts at 12 tiles,
  ensures at least eight legal sites for the largest buildable footprint, and grows by four tiles to a maximum of 24.
  Focused projector/pipeline specs and the full two-faction runtime scenario pass on this rule.
- Focused recovery regression passes, including unfinished-site accounting. Broad gameplay: 516/517 tests pass, with one
  unchanged one-worker food-capacity failure. Gameplay/E2E typing,
  scoped lint, map topology tests and editor wiring pass. Phaser-wide typing has four existing map `tilemap` errors.
- Retained repairs include stale native move-destination replacement and valid anti-air/naval route distinction.
  The speculative longer core-memory and missing-hypothesis holds were removed; the earlier expiry diagnosis is superseded.

## Current cursor: Package 5 — authority, multiplayer and lifecycle

Package 4 remains open for route-safe placement and physical transit; its unchanged failures are recorded below. Package 5
is active. Linked pure contracts pass for H-06–15 and H-30–32 (13 scenarios, 37 suites, 219 assertions;
`tmp/ai-skirmish-matrix/760-package5-pure-owner-update/1792917048672-passed.json`). H-10's Tivara and Skaduwee
resumed-capacity diagnostics pass individually, but do not close the family. Chunked capture storage and CI's 8 GB Node
heap address prior report-sealing limits. Continue with source/fixture changes for open native causes; CI owns routine
repetition. Do not replay unchanged rows.

H-31's focused `before_apply` diagnostic fixed two harness/state blockers and reached 20 decisions / 401 ticks, but still
fails saved/restored and control/resumed parity plus native premise completeness. H-14 Skaduwee shows physical scout
movement and new visibility without proving the selected scout caused the reveal; keep its shared exact-arrival oracle.
Do not replay either case until the relevant cause changes.

H-30 throw now passes as a paired diagnostic: Tivara's changed-source capture held and released the native research
terminal at tick 2800, drained it in a later healthy decision, continued exact native worker deliveries, resumed planning
and won at tick 4000 (`tmp/ai-skirmish-matrix/760-package5-h30-tivara-terminal-receipt-v2/1792966085082-diagnostic_passed.json`).
The retained Skaduwee capture also has zero H-30 context/fault failures under the corrected terminal-receipt oracle
(`tmp/ai-skirmish-matrix/760-package5-h30-skaduwee-reconciled-window/1792963431748-diagnostic_failed.json`); its archived
report still records the obsolete oracle failure and has not been relabeled. Other H-30 fault branches remain CI matrix
coverage. Keep H-08/H-09 real peers on credentialed CI; selected native obligations remain 0/22.

H-32 pending-path now creates its exact pending route query at tick 20 and collects the route event, but the changed-source
same-realm replay still times out after transition. The old scene reports inactive/status 8 while its Phaser shutdown and
destroy listeners remain registered and uncalled; adding simulation-clock completion as a fallback did not settle it.
Focused route tests pass 9/9. Keep this native lifecycle boundary open; do not replay until the scene teardown owner is
identified. The run artifact is
`tmp/ai-skirmish-matrix/760-package5-h32-clock-disposal/1792968377392-failed.json`.

H-30 Skaduwee throw now also passes on the changed receipt window at 200 decisions / 4,001 ticks: six injected faults,
continued native gathering/planning, and two-faction terminal victory
(`tmp/ai-skirmish-matrix/760-package5-h30-skaduwee-receipt-window/1792969100377-diagnostic_passed.json`, 669,078 ms).
This pairs with Tivara's pass for the throw branch;
other H-30 fault families remain CI-owned.

H-15's detailed capture replay identifies `Scene is not of type ProbableWaffleSceneData`: all 120 selected-decision facts
exist, but only the first two have tactical snapshots. Passing the owner map index through actor identity, navigation
and visibility projection did not change the result (2/120 snapshots; same error). Focused owner specs and typing pass,
but do not run another H-15 match until the remaining scene-service caller is isolated with a bounded diagnostic.
Artifacts: `tmp/ai-skirmish-matrix/760-package5-h15-boundary-error/1792969705610-diagnostic_failed.json` and
`tmp/ai-skirmish-matrix/760-package5-h15-visibility-owner-index/1792970713061-diagnostic_failed.json`.

H-11 Tivara one-worker was replayed after the changed construction/navigation sources. At 200 decisions / 4,001 ticks,
the builder at `(33,21)` still got `no_path` to the legal outside endpoint `(31,22)` for the Granary; no construction or
income followed. The only scenario failure is `native_capture_channel_lost`, so this run is not closure evidence.
Artifact: `tmp/ai-skirmish-matrix/760-package4-h11-current-navigation/1792971090725-diagnostic_failed.json`.
Do not replay H-11 until the native connectivity cause and capture losses change.

PLACE-03 Tivara concurrent was replayed after owned Move/Gather/ReturnResources endpoint protection. It sealed at 150
decisions / 3,001 ticks (774,239 ms), but its first Granary placement at tick 20 covered the worker-service route's
from-tile; later prefixes retained that blockage. Physical worker and army transit also remained incomplete. The
decision observation had owned workers around the footprint, but the policy only reserved exact order endpoints and
whole-component connectivity. A new generic one-tile clearance ring around other owned gather/build workers now protects
their maneuvering space while leaving the active builder's approach available. Focused placement access specs pass 8/8.
Artifact: `tmp/ai-skirmish-matrix/760-package4-place03-current-endpoint-protection/1792971915347-diagnostic_failed.json`.

The worker-clearance replay reached 150 decisions / 3,001 ticks and found route/transit failures plus the shared tactical
boundary-reader error. That capture error is now fixed: visibility coverage accepts the owner-scene `NavigationService`
instead of resolving it through each actor's scene. Focused visibility/capture specs pass 8/8. The follow-up PLACE-03
replay captured tactical boundaries for all 150/150 decisions with no reader loss, but still failed route clearance on
later prefixes and both protected physical transits (workers 17, army 5, four enemy losses). Its exact report is
`tmp/ai-skirmish-matrix/760-package4-place03-owner-navigation/1792973519220-diagnostic_failed.json`.

On the same changed capture source, H-15 Skaduwee lethal now passes its exact diagnostic at 120 decisions / 2,401 ticks;
it records effective defense and withdrawal, 1,556 damage, seven enemy losses, five surviving workers and one army unit.
Artifact: `tmp/ai-skirmish-matrix/760-package5-h15-owner-navigation/1792974044197-diagnostic_passed.json`. This pairs with
the earlier Tivara lethal branch only; H-15's other branches remain open and selected obligations stay 0/22.

H-14 Skaduwee harmless is now isolated to its physical scout trip. Native recovery income is proven by worker
`sim-34fa6c15` harvesting 10 wood at tick 222 and the exact credit at tick 268; its one paid military completion has a
matching charge and legal spawn. The missing predicate is the scout trip: all four selected frontier scout effects had
movement histories ending in `stopped`/`returned_false`, with no original-destination arrival. The first route starts at
tick 20 toward `(3,3)`, is stopped at tick 80, and later tactical orders replace its effect identity. Artifact:
`tmp/ai-skirmish-matrix/760-package5-h14-skaduwee-harmless/1792953741166-diagnostic_failed.json`.

**Next local action:** trace why the primary scout order is displaced or returned false before reaching the fair waypoint;
make that scout movement retain or complete its native mission, then use one focused H-14 Skaduwee diagnostic. Do not
repeat PLACE-03 until its active route premise or source-level corridor model changes. Keep H-11/H-31/H-32 parked without
a new cause. Selected native obligations remain 0/22; CI owns routine registered rows and real-peer obligations.

The corrected H-06 run sealed after 600 decisions / 12,006 ticks
(`tmp/ai-skirmish-matrix/760-package5-h06-corrected-fault/1792927753810-failed.json`; summary wall time 1,578,850 ms).
It confirms held/released production receipts for Tivara and the Skaduwee late branch. The Skaduwee withheld/rejected
variants never request production; the unrelated-income guard also incorrectly expects wood from `own-source`, while
captured traffic is food/other resources credited to the owned base. H-06 remains open. H-07 is now running separately
with the corrected tick-1800 receipt window. It sealed after 480 decisions / 9,604 ticks
(`tmp/ai-skirmish-matrix/760-package5-h07-corrected-fault/1792929364799-failed.json`; summary wall time 1,423,625 ms).
Both destroyed-output variants pass their exact authority predicates; both living controls lack a production receipt.
Both cases also failed the unrelated wood-income check, which their acceptance criteria do not require. H-06/H-07
branches now share a faction-specific fixture identity, aligning ordinary AI choices; the evaluator skips the unrelated
income predicate for these receipt-specific cases. Fixture/artifact/report tests pass 42/42 and Portal E2E typechecking
passes. These source/fixture changes have not been runtime-replayed; CI owns the routine matrix. H-08 then ran as an
isolated eight-variant selection but completed only its two timeout variants (240 decisions / 4,802 ticks;
`tmp/ai-skirmish-matrix/760-package5-h08-next/1792932695121-failed.json`, 3,215,810 ms). Both hit the generic resource
coverage-loss guard after normal native economy changes. Both cancellation-race variants lack the original applied
receipt required for the native cancellation acknowledgment. All four peer host-order branches stopped before simulation
with `local_multiplayer_supabase_keys_required`; this PC has no configured Supabase keys. H-08 remains open. H-09's
peer leg has the same local prerequisite, so advance to independent single-player H-10 now; return to H-08/H-09 after
the cancellation fixture and narrow exact-evidence guard are repaired, and peer credentials are available through CI.
H-10's changed-source diagnostic is running for `h-10-tivara-resumed` under
`tmp/ai-skirmish-matrix/760-package5-h10-reservation-fix/`. The saved diagnostic isolated a repeat of the same Gather
operation while its original receipt was delayed, plus a false “settled work” assertion that began before the native
terminal failure arrived. The owner-binding oracle now waits until after the later of consumer release/native terminal,
with a regression test. The gameplay reservation reducer now advances all accepted intent claim bundles—not only
production-transition bundles—to `dispatched`/`applied_spending` on their actual effect outcomes and releases them on
terminal outcomes. This keeps the worker/source/effect owned across the provisional lease expiry. Targeted reducer,
production-identity and planner tests pass 3 suites / 6 tests; gameplay spec TypeScript and portal-E2E TypeScript pass.
The post-fix H-11–15 pure batch passes at
`tmp/ai-skirmish-matrix/760-package5-reservations-pure-after-h10-fix/1792933874048-passed.json`. H-10's changed-source
Tivara resumed-capacity diagnostic passes at
`tmp/ai-skirmish-matrix/760-package5-h10-reservation-fix/1792934322497-diagnostic_passed.json` (150 decisions / 3,001
ticks, one browser process, 556,841 ms). Its delayed-receipt retry and late-pending assertions both pass; this is one
variant, not full H-10 closure. H-11 Tivara one-worker first capture
`tmp/ai-skirmish-matrix/760-package5-h11-one-worker/1792934588131-diagnostic_failed.json` sealed after 200 decisions /
4,001 ticks (226,586 ms), but broad resource coverage was lost and the worker never started its Granary: the native
builder's fixed radius 1 excluded every approach tile outside its 3x3 footprint. The raw path evidence returned
`no_path` four times from `(33,21)` to the site at `(33,23)`. Construction range now derives from the target footprint;
focused Phaser/movement/command tests pass 3 suites / 19 tests and Phaser spec TypeScript passes. The second capture proved
that radius 2 was active but the endpoint selector still chose `(33,22)`, inside the Granary footprint; its navigation
grid may report occupied target tiles as navigable. The selector now hard-excludes all target footprint coordinates and
its focused regression passes (6/6). The third H-11 capture confirmed the endpoint is now outside the footprint at
`(31,22)`, but its native path query returned no route; broad resource history also remains incomplete. Path selection now
enumerates legal endpoints in deterministic distance order and tries each until a native route succeeds. The resulting
H-11 replay still found only one legal candidate, rejected by native pathfinding, and never constructed or delivered food:
`tmp/ai-skirmish-matrix/760-package5-h11-reachable-endpoint-fallback/1792945791852-diagnostic_failed.json` (200 decisions /
4,001 ticks, 221,868 ms). Focused selector spec passes 6/6; Phaser spec TypeScript passes. Keep H-11 open and do not
replay it until a specific source of additional legal endpoints or resource-history gaps is found. Advance to the independent
H-12 atomic-bundle case, then H-13–15; leave real-peer branches to credentialed CI. H-12 Tivara scarce capture
`tmp/ai-skirmish-matrix/760-package5-h12-tivara-scarce/1792946294897-diagnostic_failed.json` ran 150 decisions / 3,001
ticks (421,786 ms), authored real proposal-order events and completed the Field prerequisite. Its only scenario failure was
the broad resource-coverage guard; the H-12 exact bundle evaluator reported no other failed predicates, including complete
cost admission, physical charges/delivery and foreign-bank stability. Because those exact checks are the acceptance source,
H-12 now uses them without unrelated broad-history coverage; a focused scenario-context check passes. This is a checked
Tivara-scarce subset, not all eight H-12 branches. H-13 Tivara many-bases capture
`tmp/ai-skirmish-matrix/760-package5-h13-tivara-many-bases/1792947006926-diagnostic_failed.json` reached 150 decisions /
3,001 ticks (556,893 ms); its only reported failure was the same broad resource-history guard. H-13's exact evaluator passed
the multi-base premise, waiting exposure, optional spending and physical outcome checks. H-13 now also uses its exact
scenario evidence instead of unrelated broad history; a focused context guard was added. This remains one of eight H-13
branches, not full closure. H-14 Tivara harmless-noise capture
`tmp/ai-skirmish-matrix/760-package5-h14-tivara-harmless/1792947552643-diagnostic_failed.json` reached 150 decisions /
3,001 ticks (465,648 ms); its only failure was broad resource-history coverage. H-14's exact evaluator passed the visible
harmless-threat, native service and emergency-decay checks; H-14 now uses those exact scenario predicates. Context guard
tests cover H-12–14. This is one H-14 branch, not family closure. H-15 Tivara lethal capture
`tmp/ai-skirmish-matrix/760-package5-h15-tivara-lethal/1792948040709-diagnostic_failed.json` reached 120 decisions /
2,401 ticks (396,686 ms), with 119 emergency decisions, 583 hostile-damage facts and three held receipts. Its only failure
was broad resource history; the exact evaluator passed lethal attack, effective defense, fresh-generation and delayed-receipt
predicates. H-15 now uses its exact damage/defense/receipt evidence; the context guard test was added. This is one branch,
not H-15 family closure. H-15 Tivara resolved capture
`tmp/ai-skirmish-matrix/760-package5-h15-tivara-resolved/1792949237676-diagnostic_failed.json` reached 120 decisions /
2,401 ticks (446,261 ms). The emergency clears after the scheduled withdrawal, but the evaluator falsely expected a
completed production command to remain pending past tick 800: native execution completed it at tick 319 while the same
receipt remained held until tick 801, so pending ownership correctly drained before receipt release. The evaluator now
requires pending ownership while held, a native terminal result, and release of that same receipt; its synthetic regression
passes in the 11-test owner-binding suite. Portal E2E typechecking passes. The changed-source evaluator has not been applied
to a replay; CI owns that routine run. H-15 Tivara far control passed (`diagnostic_passed`, 120 decisions / 2,401 ticks,
562,827 ms) with no false emergency despite broad resource-history loss. Three Tivara H-15 branches now have targeted
native evidence; the resolved replay interpretation is fixed, and far control passes. Skaduwee counterparts remain
CI-owned. H-14 Tivara scarcity capture
`tmp/ai-skirmish-matrix/760-package5-h14-tivara-scarcity/1792948619979-diagnostic_failed.json` reached 150 decisions /
3,001 ticks (465,860 ms) but failed two real case predicates: no explicit resource blocker and no combined physical
economy/scouting output. Native facts show the zero-start budget still enabled wood harvesting and payment, but no mission
resource blocker; the scarcity lane should require physical income and the blocker, not discretionary scouting. Its evaluator
now makes that branch-specific distinction. Keep the missing blocker as an open fixture/workload issue; do not replay until
the case supplies an active resource-blocked demand. H-11 also remains open with one legal endpoint rejected by native
pathfinding; do not replay until its footprint/route selection has a concrete next change. Advance to independent H-30/H-32
fault and lifecycle cases now, then revisit H-14 and H-11 after the broader Package 5 owners. H-30 Tivara throw reached
120 decisions / 2,401 ticks (361,487 ms) with six native `brain_fault` events and no AI error. Its only scenario failure
was broad resource history; exact H-30 injection, resumed planning, continuing gathering, and held-receipt reconciliation
all passed. H-30 now uses those exact source-specific fault/outcome checks, with a context guard test added. H-32 Tivara
normal passed after 200 original-match ticks and 200 next-match ticks; it retained one controller/player, cleared old-scene
observers, and progressed the next match in the same realm (`tmp/ai-skirmish-matrix/760-package5-h32-tivara-normal/1792950997858-diagnostic_passed.json`).
H-32 Tivara paid-queue also passed: both late original completion calls returned null, and the next match progressed in the
same realm (`tmp/ai-skirmish-matrix/760-package5-h32-tivara-paid-queue/1792950738940-diagnostic_passed.json`; 20 original
ticks, 200 next-match ticks). Skaduwee normal and paid-queue also pass; both show clean old-scene disposal and active
same-realm next matches (`tmp/ai-skirmish-matrix/760-package5-h32-skaduwee-normal/1792951500456-diagnostic_passed.json`,
`tmp/ai-skirmish-matrix/760-package5-h32-skaduwee-paid-queue/1792951417599-diagnostic_passed.json`). These four samples
are not full H-32 closure. H-32 pending-path initially exposed first-match preset-event replacement; the runner now restores
that event record after lifecycle proof and Portal E2E typechecking passes. A changed-source replay still fails before any
decisions/ticks with `runtime_preset_events_incomplete`, so the route outage was never observed. Park this branch until its
fixture reliably induces a pending native path. H-32 host replacement requires authenticated real peers and stays CI-owned.
H-30 Skaduwee throw then ran 120 decisions / 2,401 ticks and recorded six throw injections, continued native income and
resumed planning, but no original held production receipt. Its only case failure is
`fault_mandatory_original_reconciliation_missing`
(`tmp/ai-skirmish-matrix/760-package5-h30-skaduwee-throw/1792951982190-diagnostic_failed.json`, 461,226 ms). This is a
missing receipt premise in this faction's fixture; do not replay without targeted producer/receipt setup. Continue another
independent P5 branch. H-31 Tivara `before_apply` stopped before any tick:
`runtime_checkpoint_not_committed` at the required save boundary (`tmp/ai-skirmish-matrix/760-package5-h31-tivara-before-apply/1792951092614-failed.json`).
This is missing native checkpoint evidence, not a save/load behavioral verdict. The distinct `applied_pending` branch also
stopped before simulation on Nx recursive webserver startup; `during_active` timed out waiting for the expected UI state
before any decisions/ticks (`tmp/ai-skirmish-matrix/760-package5-h31-tivara-during-active-nx-no-daemon/1792951248658-failed.json`).
Park H-31 locally; do not repeat these unchanged boundaries. H-15 Skaduwee lethal first reached 120 decisions / 2,401 ticks
but ended with zero workers; the runtime `worker_bootstrap` guard prevented the exact emergency evaluator from closing
(`tmp/ai-skirmish-matrix/760-package5-h15-skaduwee-lethal/1792952496878-diagnostic_failed.json`, 352,041 ms). The
checkpoint showed 20 unit losses, three enemy kills and eight buildings lost. All 11 combatants had been assigned to
defense, but the player-visible target was outside each unit's native vision. Defense now attacks only from per-unit
native visibility and moves the rest to intercept; the observation carries each owned VisionComponent's exact visible
enemy IDs, preferred over estimated range. Focused defense/tactics tests pass (31/31), Phaser projection passes (3/3), and
gameplay and Phaser spec typechecks pass. The changed-source replay had zero `hidden_target` rejections, workers 8→2 and
military 11→1, but still ended in defeat at tick 2,401. Its only scenario failure is
`native_decision_or_mission_boundary_missing`: native tactical-boundary capture is absent on 118/120 player decisions
after tick 40. H-15 remains open; do not replay until the boundary capture exception is identified and a separate
survivability cause changes. The H-15 far fixture had no orders keeping its 16 opposing actors at their
far start positions; the Skaduwee opponent advanced and triggered emergency. Added native hold controls and synchronized the
checked-in H-15 fixture JSON (its far branches previously had zero controls). The corrected Skaduwee far replay reached
120 decisions / 2,401 ticks and passed the distant-threat predicate; its only old-evaluator failure was the unrelated
held-production-receipt requirement (`tmp/ai-skirmish-matrix/760-package5-h15-skaduwee-far-distant-hold/1792956836875-diagnostic_failed.json`,
457,053 ms). The evaluator now requires that receipt only for lethal/resolved, and a regression confirms far control does
not need unrelated production. Native fixture suite passes 23/23, owner-binding suite 12/12, Portal E2E TypeScript passes.
H-15 Skaduwee resolved passed all exact withdrawal/receipt predicates at 120 decisions / 2,401 ticks
(`tmp/ai-skirmish-matrix/760-package5-h15-skaduwee-resolved/1792956133652-diagnostic_passed.json`). That supports the
corrected pending-through-held receipt semantics for this branch; H-15 Skaduwee lethal remains open.
H-14 Skaduwee harmless reached 150 decisions / 3,001 ticks but failed the exact combined physical economy/scouting/paid
output predicate (`tmp/ai-skirmish-matrix/760-package5-h14-skaduwee-harmless/1792953741166-diagnostic_failed.json`,
515,500 ms); the Tivara harmless branch passed. Treat this as an opposite-faction useful-work gap, not broad-coverage loss.
H-10 Skaduwee resumed-capacity passed all exact authority/reservation predicates at 150 decisions / 3,001 ticks
(`tmp/ai-skirmish-matrix/760-package5-h10-skaduwee-resumed/1792955704607-diagnostic_passed.json`, 645,796 ms), pairing
the earlier Tivara branch. This remains a one-branch sample, not full H-10 closure. Continue with the next dependency-ready
open P5 owner; do not stall on H-15's missing tactical-boundary capture or replay unchanged rows.
H-13 Skaduwee many-bases reached 150 decisions / 3,001 ticks but failed `resources_waiting_exposure_original_cash_or_ownership_missing`
(`tmp/ai-skirmish-matrix/760-package5-h13-skaduwee-many-bases/1792954451233-diagnostic_failed.json`, 681,693 ms). This is
an unmet native waiting-exposure premise; the Tivara exact-evidence case passed. H-12 Skaduwee scarce is the next paired
resource-bundle check. H-12 Skaduwee scarce then reached 150 decisions / 3,001 ticks but failed
`bundles_foreign_resource_bank_changed_or_was_not_observed`
(`tmp/ai-skirmish-matrix/760-package5-h12-skaduwee-scarce/1792955027637-diagnostic_failed.json`, 546,899 ms). The exact
foreign-bank premise is not established for this faction; do not replay unchanged.
Selected native obligations remain 0/22 closed.

## Prior Package 3–4 diagnostic log

Follow the [required gates before another full match](../../../plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-skirmish-ai/references/runtime-triage.md).

1. Adaptive coverage and full two-faction SEQ-01 are validated. The run passed on the final adaptive implementation:
   artifact `tmp/ai-skirmish-matrix/759-seq01-two-faction-adaptive-site-budget/1792877168188-passed.json`, 30,000
   aggregate ticks, one browser process, fixture digest `fnv1a32:5406a5d4`. Do not rerun this unchanged full scenario
   locally; the PR CI runtime matrix owns routine repetition.
2. Package 4 pure contract batch passed: PLACE-01/02/03, EXP-01/02, WALL-01–05, H-01–05, H-27/28 (17 scenarios,
   39 suites, 228 tests; artifact `tmp/ai-skirmish-matrix/759-package4-placement-pure/1792877363995-passed.json`).
   Selector access regression initially passed 4/4 focused tests. A changed-source guard now also keeps owned Move,
   Gather and ReturnResources destinations clear; the focused regression passes 5/5, linked PLACE-03 pure check passes,
   and gameplay TypeScript checking passes. Its single-variant native recheck
   `tmp/ai-skirmish-matrix/760-place03-tivara-concurrent-owned-endpoints/1792916886302-diagnostic_failed.json`
   completed 150 decisions / 3,001 ticks in 726,801 ms, won the match, but reproduced the same first-prefix route failures
   and both transit failures. The declared probe endpoints do not correspond to the AI's current observable order goals.
   Keep this small generic destination safeguard; don't mistake it for route clearance closure. Do not repeat PLACE-03
   until the route evidence is tied to fair current movement/service observations or the native recipe is corrected.
   Before implementing more placement guesses, advance to independent Package-5 authority/lifecycle checks.
   The initial next-native PLACE-03 Tivara concurrent diagnostic
   completed 150 decisions / 3,001 ticks in 767,760 ms, but failed clearance at the first applied build prefixes and
   both worker/army physical-transit predicates; artifact
   `tmp/ai-skirmish-matrix/759-place03-tivara-concurrent-next/1792915997972-diagnostic_failed.json`.
   This confirms the same placement gap seen in H-27 is shared across layouts, not an H-27-only site choice. The
   selector preserves the builder-connected observed ground component and known shore transfers; native test
   `protectedRoutes` declarations are not inputs to the AI observation, so wiring those coordinates into production
   policy would leak scenario-only data. Do not replay unchanged H-27/PLACE-03; return to them after placement route
   evidence is grounded in fair observable paths and the transit failure has a changed cause.
3. Grouped PLACE-01/02/03 and isolated four-variant PLACE-01 wrote a 387,730,185-byte runtime result, above the
   former 256 MiB reader limit. This is a transport bound, not a gameplay verdict. A PLACE-01 single-variant diagnostic
   is consumable: `tmp/ai-skirmish-matrix/759-place01-tivara-room-diagnostic/1792880516839-diagnostic_failed.json`.
   It ran 120 decisions / 2,401 ticks and showed 258 facts dropped at the shared 12,288-fact cap (11,838 retained for
   production, 450 opponent), plus `resourceCoverage.lost`. Its tick-40 decision also emitted a protected-retreat
   move and a defense attack for the same two actors; the stage-9 attack carried no actor claims. These are distinct
   evidence and behavior issues. Reading the prior full-row artifact under the new ceiling confirms it timed out after
   three of four variants at the old 20-minute test limit; subsequent rows lost their browser context. The capture
   budget is now 24,576, the reader ceiling 512 MiB, and runtime timeout scales by selected serial variants (10
   minutes each plus three minutes overhead). Stage-9 defense orders now claim their actors with a focused regression.
   Placement keeps its stricter complete-fact frontier, exact charge/completion and harvest-to-deposit checks; it no
   longer requires the unrelated resource-coverage side channel that normal world mutations invalidate. A changed-source
   PLACE-01 variant completed at `tmp/ai-skirmish-matrix/759-place01-tivara-room-fixed-claims/1792881991671-diagnostic_failed.json`
   (120 decisions, 2,401 ticks, complete 16,384-budget capture). The duplicate order and capture overflow are gone.
   Actual findings: three later AI fields intersect baseline protected paths; four new fields have no native completed
   food delivery (the first field was harvested for five food but no cargo offer/deposit followed); the worker transit
   physically reached its declared endpoint at tick 495, while the army transit stopped at tick 220. The transit
   evaluator also expects an `applied` outcome although the shared dispatcher records `dispatched`; worker endpoint
   evidence confirms the physical-arrival predicate needs review. This is a behavior/evidence diagnosis, not a closed
   PLACE result.
4. EXP-01 `exp-01-tivara-expand` reached its 4,001-tick checkpoint and won (12 army, 10 produced). The first capture
   needed about 20,196 facts; the 24,576 budget rerun retained all 20,196 with no dropped facts and closed history.
   Artifact `tmp/ai-skirmish-matrix/759-exp01-tivara-expand-budget24576/1792883557230-diagnostic_failed.json` is 219 MB.
   Its remaining failure is the broad resource-coverage side channel, invalidated at tick 2,719 by routine native actor,
   source and service changes. The captured exact evidence includes safe-source wood deposits into the new Sandhold
   with successful credits at ticks 1,960, 2,148, 2,260 and 2,298. Since EXP-01 separately requires exact paid build,
   builder arrival, and source-to-new-deposit cargo proof, its generic context now exempts only this broad side channel;
   portal E2E typecheck passes. The unsafe branch then reached scenario assertions and reported only
   `expansion_has_no_productive_new_safe_deposit`. Its native facts show this is an evaluator binding mismatch:
   selected effect `effect:expansion:1` is stamped on the shared command as `expansion:1`; the same facts prove exact
   400/400 payment, builder arrival, completion and safe-source wood credits to the new Sandhold. The evaluator now strips
   the `effect:` label before matching, with a focused regression passing 1/1. Do not rerun the unchanged match; neither
   artifact is counted as a full EXP-01 closure. A WALL-01 terrain diagnostic reached its 3,001-tick win with complete
   11,377-fact history and zero drops, but the generic resource-coverage gate failed after routine actor/source mutation.
   Exact construction/effect gates make the broad channel unnecessary for WALL/H-27/H-28, so these cases now use the
   same scoped exemption. A different freestanding branch reached its fortification checks and failed: no paid native
   wall prefix or defensive effect, plus the fixture's `worker-service` baseline route is `blocked` (visited one tile).
   Artifact `tmp/ai-skirmish-matrix/759-wall01-tivara-freestanding-scoped-context/1792885966781-diagnostic_failed.json`.
   It wins the match, but this branch is not valid evidence of fortification success. The shared transit helper also
   rejected the native `dispatched/accepted_for_dispatch` receipt before checking physical arrival; it now accepts that
   receipt while still requiring caller-attributed endpoint arrival. Focused owner-binding tests pass 7/7 and E2E
   typecheck passes. The H-27 fixture now starts its attacker at the uncovered opening and issues its attack at tick 20
   (the old tick-200 control came after the attacker died at tick 118); the wall-family worker route starts outside the
   occupied wall tile. Regenerated fixtures pass all 22 native-fixture validation tests. The changed H-27 run records
   actual home damage at ticks 60 and 84, so the attack premise now works. It still fails: no paid defensive placement,
   and an accepted Olival at tile (32,23) blocks worker-service and retreat routes; later fields remain on blocked
   prefixes. Baseline routes are now valid, making this a real site-selection/access regression. Physical worker/army
   transits remain incomplete after the receipt fix. Artifact
   `tmp/ai-skirmish-matrix/759-h27-tivara-uncovered-fixture-fixed/1792887640897-diagnostic_failed.json`.
   This points to shared route-preserving placement work; log it and do not repeat fortification variants. Keep PLACE-01
   and H-27 open; continue remaining packages by dependency readiness.
5. **SCOUT-01 hidden-start diagnosis:** the original hidden-b fixture exposed nearby enemy buildings/workers and prompted
   an attack. The corrected fixture moves those assets outside opening vision; bindings pass 22/22 and the changed match
   confirms no enemy is visible at tick 20 and an accepted scout order. The required physical-arrival plus newly-visible
   search-point predicate still fails. Focused scouting/ownership tests pass 6/6 after assigning one question scout,
   preferring it over the neutral scout and letting an existing information trip persist during an attack. Latest artifact:
   `tmp/ai-skirmish-matrix/759-scout01-tivara-scout-mission-continues/1792890799244-diagnostic_failed.json`; it ends with a
   zero-member scout and no qualifying trip. Do not repeat hidden-b unchanged. Keep SCOUT-01 open; continue with SCOUT-02,
   starting at `scout-02-tivara-visible`, then SCOUT-03/04 and STRAT/DOMAIN/RAID/FIGHT/C. Newly selected native
   obligations remain 0/22 closed.
6. **SCOUT-02 visible-contact control:** `scout-02-tivara-visible` completed 120 decisions / 2,401 ticks and failed only
   `scouting_useful_physical_information_trip_missing` at
   `tmp/ai-skirmish-matrix/759-scout02-tivara-visible-next/1792891305565-diagnostic_failed.json`. Unlike SCOUT-01, it
   initially emitted no scout intent: the visible-contact attack owned the combat roster before scouting ran. The
   changed scheduling capture `tmp/ai-skirmish-matrix/759-scout02-visible-question-scout-first/1792909943991-diagnostic_failed.json`
   reached the information-trip predicate but failed only a duplicate command at tick 520: Stage 9 issued a strategic
   attack-move for three actors while Stage 13 issued an assembly move for one of them. Stage-9 attack/scout intents now
   claim their actors; the focused regression plus manager/offense/tactics suites pass 25/25 and gameplay TSC passes.
   The actor-claim capture `tmp/ai-skirmish-matrix/759-scout02-visible-actor-claims/1792910644367-diagnostic_failed.json`
   returned to the missing-trip predicate. Tick-20 accepted a question-scout order, but its actor did not complete the
   physical information trip. Preserving that scout from local defense when another defender exists was added with a
   focused regression, but the final capture
   `tmp/ai-skirmish-matrix/759-scout02-visible-defender-exclusion/1792911202669-diagnostic_failed.json` still fails
   the same trip predicate. Do not replay SCOUT-02 unchanged; keep it open and diagnose dispatch/mission persistence
   only alongside a related scouting batch. The actor-claim change remains specifically relevant to SCOUT-03's known
   duplicate-order result; run that branch once, then advance to another package instead of looping on SCOUT-02.
7. **SCOUT-03 escape branch:** `scout-03-tivara-escape` completed 100 decisions / 2,001 ticks and failed
   `native_actor_commanded_twice_in_decision`, not the scout-trip predicate. Tick 120 contains a stage-13 defense move
   for `sim-ffe3bf01` overlapping the stage-9 attack group; `sim-ef3b2150` also has a stage-13 attack-position move
   while in that group. Artifact:
   `tmp/ai-skirmish-matrix/759-scout03-tivara-escape-next/1792891717145-diagnostic_failed.json`. Keep SCOUT-03 open and
   don’t replay unchanged. Strategic Stage-9 attack/scout commands now carry actor claims, and the changed capture
   `tmp/ai-skirmish-matrix/759-scout03-escape-actor-claims/1792911623912-diagnostic_failed.json` completed 100 decisions /
   2,001 ticks with only `scouting_useful_physical_information_trip_missing`; the prior duplicate-command predicate is
   gone. The shared claim repair therefore addressed this branch's command overlap but not the information trip. Keep
   SCOUT-03 open and do not repeat it unchanged. SCOUT-02 likewise remains open after the same scheduling change;
   schedule SCOUT-01/02/03/04 trip failures together after another dispatch/mission-persistence cause is isolated.
   Continue now with RAID-03's scenario-linked pure contract before another native attempt; do not restart scout rows or these unchanged controls.
8. **SCOUT-04 producer branch:** `scout-04-tivara-producer` completed 120 decisions / 2,401 ticks and failed only
   `scouting_useful_physical_information_trip_missing` at
   `tmp/ai-skirmish-matrix/759-scout04-tivara-producer-next/1792892271892-diagnostic_failed.json`. SCOUT-01/02/04 now
   share the missing-trip outcome with distinct triggers; SCOUT-03 exposes a duplicate tactical command. Keep all SCOUT
   rows open and batch the scout/attack scheduling repair with the command-ownership issue; do not replay these branches
   unchanged. Continue from item 11; do not restart these scout branches.
9. **STRAT-01 paired pressure row closed:** the original safe-control fixture included the two Banshee attackers, so it
   was not a safe control. Removing them exposed an overstrict full-world digest comparison. The fixture now keeps the
   safe arm free of attackers; the oracle compares fixture identity, owned roster, worker/resources and the complete
   non-Banshee actor roster while permitting the raid arm's authored Banshees. Pressure regression passes 3/3. The full
   registered row passes all six repetitions: 900 decisions / 18,000 ticks, artifact
   `tmp/ai-skirmish-matrix/759-strat01-normalized-pressure-pair/1792893572584-passed.json`. STRAT-02 is summarized in
   item 10 below; do
   not replay STRAT-01 unchanged.
   Reserve Omission and Final Closure audits for the end of supported scope, not an intermediate gate.
10. STRAT-02 pure contract check passes (7/7 tests; artifact
    `tmp/ai-skirmish-matrix/759-strat02-pure-next/1792896470848-passed.json`). The Tivara quiet and air-raid native
    branches both hit the default Node ~4 GiB heap limit after about 12 minutes with zero runtime payload. Raising the
    worker heap to 8 GiB avoided that crash but the quiet branch hit Playwright's 20-minute timeout while still
    advancing its fixed-step 2,400-tick match; no decisions/checkpoints were sealed. Artifacts:
    `tmp/ai-skirmish-matrix/759-strat02-tivara-quiet-next/1792894334404-failed.json`,
    `tmp/ai-skirmish-matrix/759-strat02-tivara-air-raid-next/1792895081370-failed.json`, and
    `tmp/ai-skirmish-matrix/759-strat02-tivara-quiet-heap8g/1792896363973-failed.json`. These are capture
    resource/timeout failures, not strategy verdicts. Do not replay unchanged; continue to STRAT-03 and revisit STRAT-02
    after bounded runtime-throughput/memory work. Combined STRAT-02/03/08/09 pure selection reports STRAT-09 lacks a
    pure binding (179 tests executed, 23 passed); it remains native-only and is not a gameplay failure.

11. STRAT-03 pure contracts pass (30 tests, 7 suites; artifact
    `tmp/ai-skirmish-matrix/759-strat03-pure-next/1792900606232-passed.json`). Its native Tivara-minor run remains
    open after a changed-source capture timed out with zero sealed decisions; do not replay unchanged. DOMAIN-01's
    registered positive useful-water branch contradicted its own requirement (“water alone does not create naval
    demand; positive control is DOMAIN-02”). Binding and fixture now retain only the two faction-correct irrelevant
    branches; fixture validation passes 22/22 and the generated catalog is refreshed. A corrected one-branch capture
    was interrupted before artifact sealing and closes nothing. DOMAIN-02 pure selection still lacks an ID-specific
    assertion (143 general tests and 23 UI tests passed; artifact
    `tmp/ai-skirmish-matrix/759-domain02-pure-next/1792900622756-failed.json`). Its Tivara coast native capture reached
    150 decisions / 3,001 ticks in 480,658 ms, artifact
    `tmp/ai-skirmish-matrix/759-domain02-tivara-coast-next/1792901125060-diagnostic_failed.json`. After reevaluating
    past generic resource-history invalidation, the real failures are no paid useful fleet and no compatible naval
    objective hit. The world exposes a legal VikingBoat producer but the AI emits no ship production; current macro
    force pressure is ground/air, and water-counter production only reacts to observed hostile water/transport units.
    Context now applies its scoped broad-coverage exemption consistently to the additional AI capture; focused context
    tests pass 4/4. The distinct `domain-02-tivara-intercept` attempt produced no sealed runtime artifact before its
    terminal session ended; treat it as infrastructure-only and do not replay unchanged. The coast trace identified
    the shared owner gap: adaptation only reacts to hostile water/transport actors, and the route selector had no
    shore firing-position candidate for a naval unit targeting land. Naval adaptation now recognizes visible valuable
    enemy production/drop-off actors with a known shore transfer, preserving the two-observation confirmation and
    one-ship-per-objective bound; offensive routing maps coastal ground objectives to verified shore water nodes.
    First changed-source coast capture reached 150 decisions / 3,001 ticks in 493,251 ms, artifact
    `tmp/ai-skirmish-matrix/759-domain02-tivara-coast-naval-fix/1792902933297-diagnostic_failed.json`. Naval evidence
    now proves one accepted/paid VikingBoat production at tick 40 and completion at tick 539; only the compatible hit
    remains missing. Native spatial facts show the boat was assigned to `squad:reserve:home`, repeatedly moved toward
    ground rally points, and returned `false` for those ground-to-water-invalid routes. Water combat units are now
    excluded from the ground home reserve; focused route/offense tests pass 8/8. Gameplay and portal E2E typechecks,
    fixture validation (22/22), Prettier/catalog checks pass; ESLint reports zero errors and 16 existing warnings.
    The bounded DOMAIN-02 pure selection now passes (artifact
    `tmp/ai-skirmish-matrix/759-domain02-pure-after-coast-fix/1792903672017-passed.json`). The one allowed changed-source
    coast capture after the reserve repair completed 150 decisions / 3,001 ticks in
    511,114 ms (`tmp/ai-skirmish-matrix/759-domain02-tivara-coast-reserve-fix/1792903562143-diagnostic_failed.json`).
    It confirms the boat is no longer ordered to ground rally points and is in `squad:reserve:home:domain:water`, but
    no objective hit occurred. Native commands target `(36,42)` and `(36,46)` and fail with `Move - Movement Failed`;
    the boat can reach `(27,19)`. Treat this as a water-path/position selection defect, not a reserve assignment issue.
    Do not replay this row until a distinct route repair or a related batch changes its inputs. SCOUT-01 hidden-b was
    captured after the frontier-owner repair at 100 decisions / 2,001 ticks, artifact
    `tmp/ai-skirmish-matrix/759-scout01-hidden-b-frontier-repair/1792904133064-diagnostic_failed.json`; it selected a
    question scout at tick 20 but its information trip never arrived. The tactical planner prioritized a visible
    enemy's position over that scout destination. The scout destination now takes priority outside retreat/recovery;
    focused tactical scouting tests pass 3/3. Its one changed-source capture still fails the information-trip predicate
    (`tmp/ai-skirmish-matrix/759-scout01-hidden-b-mission-anchor-fix/1792904641296-diagnostic_failed.json`): the stage-9
    move returned false at tick 180, then a stage-13 move reached the same point at tick 606 under a different effect,
    which does not satisfy the authored accepted-scout-effect requirement. Keep SCOUT-01 open and do not replay until
    the scout dispatch/receipt chain is repaired. DOMAIN-05 `domain-05-tivara-backline` completed 150 decisions / 3,001
    ticks in 400,038 ms but failed `domain_paid_air_output_has_no_physical_backline_effect` (artifact
    `tmp/ai-skirmish-matrix/759-domain05-tivara-backline-next/1792905101762-diagnostic_failed.json`). The run produced
    no air unit: its only accepted production was a TivaraSlingshotFemale at tick 1,420 while ground force projection
    was 12/12. DOMAIN-05 pure selection has no scenario-linked test: 144 gameplay tests and 23 UI tests passed, but
    `missingScenarioIds: ["DOMAIN-05"]` (`tmp/ai-skirmish-matrix/759-domain05-pure-next/1792905202368-failed.json`).
    Keep the positive branch open. The distinct `domain-05-tivara-anti-air` control passes at 150 decisions / 3,001
    ticks (`tmp/ai-skirmish-matrix/759-domain05-tivara-anti-air-next/1792905788682-diagnostic_passed.json`). The
    Tivara no-value control also passes at 150 decisions / 3,001 ticks
    (`tmp/ai-skirmish-matrix/759-domain05-tivara-no-value-next/1792906268958-diagnostic_passed.json`). Skaduwee
    backline positive also fails `domain_paid_air_output_has_no_physical_backline_effect` after 150 decisions / 3,001
    ticks (`tmp/ai-skirmish-matrix/759-domain05-skaduwee-backline-next/1792906678641-diagnostic_failed.json`); it
    emitted no production intent or air actor. The positive gap is shared across factions. Skaduwee anti-air passes
    all predicates at 150 decisions / 3,001 ticks
    (`tmp/ai-skirmish-matrix/759-domain05-skaduwee-anti-air-next/1792907263424-diagnostic_passed.json`). Skaduwee
    no-value passes at 150 decisions / 3,001 ticks
    (`tmp/ai-skirmish-matrix/759-domain05-skaduwee-no-value-next/1792907707768-diagnostic_passed.json`). This completes
    the six DOMAIN-05 native branches: four Tivara/Skaduwee anti-air and no-value controls pass; both backline positives
    fail because neither faction produced air in those earlier inputs. Evidence-backed air demand and a DOMAIN-05-linked
    pure contract are now implemented; pure selection passes at
    `tmp/ai-skirmish-matrix/759-domain05-pure-air-demand-fix-final/1792908044224-passed.json`, with focused adaptation
    tests 10/10. Four unchanged anti-air/no-value controls remain passing and were not replayed. The changed-source
    Tivara backline capture `tmp/ai-skirmish-matrix/759-domain05-tivara-backline-air-reserve-fix/1792909148095-diagnostic_failed.json`
    completed 150 decisions / 3,001 ticks in 473,390 ms, but still fails the physical backline effect predicate. It
    proves an accepted/paid air-pressure output completed as TivaraAlchemist at tick 239. The actor was ordered to the
    home reserve at tick 240, joined the air attack squad at tick 440, and received attack requests/commits against the
    enemy worker and WorkMills; captured native damage by this actor was zero. The attempted reserve exclusion did not
    prevent the first home-rally order, so its actual assignment path needs diagnosis before a repeat. Focused route
    capability regression passes 5/5. Gameplay typing passed. The first Nx focused-test invocation ignored its file
    filter and ran all gameplay specs: 524/526 passed; the two failures are the one-worker renewable-food expectation
    and SCOUT manager's expected two-member scout (actual one). Direct Jest invocation of the intended route spec
    passed. Do not repeat DOMAIN-05 until the observed air assignment/damage cause changes; keep the Skaduwee positive
    open for final grouped evidence. DOMAIN-02 pure now passes. **Next: repair the shared scout/attack scheduling and
    duplicate-command ownership defects isolated by SCOUT-01–04; run focused regressions, then advance to the next
    dependency-ready scenario without replaying unchanged native rows.** Batch the naval path/shore-target issue after
    the related route owner is repaired. Native obligations remain 0/22.

12. **DOMAIN-01 corrected irrelevant controls:** both faction catalogs pass the complete native branch at 100 decisions /
    2,001 ticks: Tivara artifact
    `tmp/ai-skirmish-matrix/759-domain01-tivara-irrelevant-corrected/1792911974491-diagnostic_passed.json` and
    Skaduwee artifact
    `tmp/ai-skirmish-matrix/759-domain01-skaduwee-irrelevant-corrected/1792912278394-diagnostic_passed.json`.
    Both use fixture digest `fnv1a32:52d1c5db` and source digest `fnv1a32:55d9103b`. This closes the corrected
    DOMAIN-01 negative control only; continue to DOMAIN-02/05 positive effects after the shared naval/air route issue
    has a causal repair. Next local check is RAID-03's `raid-03-tivara-air-raid` branch. Keep selected native obligations
    at 0/22 until the obligation mapping confirms an actual closure.

13. **RAID-03 Tivara air-raid attempt:** the selected runtime worker stayed alive for about 75 minutes but accumulated under
    eight minutes of CPU and emitted no row/index/runtime artifact. It was interrupted as a stalled capture; this is no
    gameplay verdict and closes nothing. Do not replay unchanged. Complete the ID-linked RAID-03 pure check, then use a
    fresh bounded runtime diagnostic only after confirming worker/runner timeout behavior. Continue to other dependency-ready
    package-3 checks if the capture again fails to seal within its bound.

14. **Combat pure audit:** the linked eight-row run passes: RAID-03, FIGHT-01 and C-01–06; 36 suites / 214 tests, zero
    missing IDs. It binds seven partial owner contracts; no pure result asserts native acceptance. C-01/02/04/06 bindings
    state their remaining scenario/native conditions explicitly. Artifact:
    `tmp/ai-skirmish-matrix/760-package3-combat-pure-linked/1792914563012-passed.json`.
15. **Package-3 wide pure recheck:** current source passes 39 scenarios / 48 suites / 280 assertions with zero missing IDs;
    24 rows are partial owner contracts and there is no native acceptance in this result. Artifact:
    `tmp/ai-skirmish-matrix/760-package3-pure-wide/1792914665791-passed.json`.
16. **Scout/offense ownership repair:** question scouting could consume a unit needed to finish a visible core, leaving
    the force one unit below its viable count. A visible actionable core now suppresses a new frontier scout; scouting
    remains first for other contacts, and actor claims keep scout and attack orders separate. Focused manager/opportunity/
    boundary specs pass 25/25; gameplay TypeScript checking passes.
17. **FIGHT-01 native capture:** `fight-01-tivara-reinforced` ran alone under
    `tmp/ai-skirmish-matrix/760-fight01-tivara-reinforced/`. It was stopped manually after about 13 minutes without an
    artifact; the configured Playwright minimum was 20 minutes, so this was not a runner timeout or gameplay result.
    The timeout formula is corrected to a 10-minute minimum plus 10 minutes per serial variant and 3 minutes for startup
    and sealing. Four formula tests pass. Do not replay this unchanged branch.
18. **Package-4 route finding:** H-27's retained native capture showed an accepted Olival at `(32,23)` covering the
    `worker-service` route's exact origin tile; the policy checked that every remaining tile in the builder's observed
    ground component stayed connected, but skipped candidate tiles themselves when checking post-build reachability.
    PLACE-03 concurrent now reproduces clearance failures from its first applied prefixes across worker-service and
    retreat, then production-army; it also fails worker/army physical arrival. Both registered families declare these
    probe routes only in the runtime preset/oracle, not in the AI observation. Treat this as a real shared placement
    safety failure plus an observability/fixture contract gap. Define a fair, scenario-independent source of active
    ground endpoints before selector repair; don't hardcode probe coordinates or rerun the unchanged captures.

## Remaining work after the current gate

Do not treat a passing SEQ-01 run as completion of #759, and do not keep rerunning it locally once its required gates
pass on the current inputs. The pull-request CI matrix already runs registered native runtime rows; use local runs for
specific behavior evidence or after a relevant source/fixture change. The result reader accepts up to 512 MiB; split
selections when a complete report would exceed that bound. An oversized report is infrastructure-only and closes no case.
After a bounded native diagnostic, record the actual predicate and advance to a different open row. Revisit a failed row
only after a source or fixture change tied to its evidence; do not spend another full match validating unchanged behavior.

1. **Package 5 — authority, multiplayer and lifecycle (active):** continue H-06–15, H-30–32, M11, #819 and #823;
   prove exactly-once resource/effect ownership, capacity/reconnect/host transfer with real peers, save continuation
   and clean next-match lifecycle across required boundaries. H-10's resumed-capacity branch is next; H-06/H-07
   findings and H-08's local peer-credential blocker are logged above. Do not stop after this
   batch passes; take the next dependency-ready IDs.
2. **Package 3 residuals:** SCOUT-01–04 physical information trips; STRAT-02/03 capture throughput; DOMAIN-02 naval
   objective, DOMAIN-05 air effect; RAID/FIGHT/C-family unfinished native outcomes. Keep unchanged failures parked and
   revisit by shared owner cause or changed fixture only.
3. **Package 4 residuals:** PLACE/EXP/WALL and H-01–05/H-27–28 need fair movement/service endpoints, placement safety,
   physical transit, and the remaining legal/blocked construction and recovery outcomes. The P4 findings are recorded
   above; continue P5 independently until a shared P4 owner is repairable as a batch.
4. **Package 6 — continuous play and difficulty:** rerun SEQ-02 after shared changes, finish supported SEQ/D cases,
   paired seeds and required soaks. D-06's pinned legacy comparison is still unsupported and must remain an explicit
   blocker until its baseline compatibility issue is resolved.
5. **Package 7 — debug and closure:** finish DBG/#820/#821 outcomes, audit legacy callers/parity, remove only proven
   obsolete code, then do machinery review and final evidence/omission/closure audits.

The selected native-obligation batch remains **0/22 closed**: 14 single-player cases need native evidence, seven need
real-peer evidence, and D-06's expensive comparison is unsupported. Track closures by their actual scenario evidence;
do not count registration or CI wiring as a behavior pass. Update this list as packages close, and advance rather than
ending a turn on a passing gate that has another authorized dependency-ready package.

## Execution guardrails

- One accelerated browser process at a time; movement recording off unless causally needed. The grouped placement run
  peaked around 4.5 GiB browser memory but did not fail from memory pressure. Its 388 MiB result exceeded the former
  reader ceiling; the bounded reader ceiling is now 512 MiB. Runtime tests now scale the timeout for serial variants.
  Keep reports in ignored `tmp/` and print bounded findings.
- CI already derives runtime shards and has a real-peer job. Do not restore the other-PC probe or duplicate scenario lists.
- Save/load proof is single-player; multiplayer proof requires actual peers. Registration, dispatch, planner labels and
  passing simplified fixtures never substitute for the required applied native outcome.
