# #759 current evidence

Updated 2026-10-29. This is the compact active snapshot; detailed run history belongs in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md). [HANDOFF.md](HANDOFF.md) owns the live cursor and next action.

## Active placement checkpoint

PLACE-03's owned-vision lookup skips inactive or foreign-scene actors from the owner index. Static protected-route
clearance excludes mobile actors while retaining buildings and terrain, and army/retreat corridors use one-tile
margin. The native move probes run before the first AI refresh; a caller-attributed stop exactly on the requested tile
counts as physical arrival even when the replacement order makes the movement callback return false. Focused Phaser,
movement-reader, fixture, and lint checks pass. All eight current-source branches pass: Tivara/Skaduwee layout
(`1793271744227`, `1793271939462`), concurrent transit (`1793271356103`, `1793271551642`), completion
(`1793269763307`, `1793269950849`), and loss (`1793270079707`, `1793270290082`), totaling 1,200 decisions / 24,008
ticks across independently bounded runs. The layout routes use the authored alternate open lane; concurrent branches
target the observed physical endpoint. Earlier failures exposed stale vision sources, static clearance treating mobile
actors as blockers, overly wide one-tile routes, same-tick order replacement at endpoint contact, and a retreat route
crossed by a valid Granary footprint. PLACE-03 is closed; do not rerun unchanged. The eight-variant invocation still
exceeds the 30-minute cap and is not needed. Continue with registered PLACE-01, then PLACE-02/EXP/WALL and recovery.

Resource admission now records each accepted resource claim amount and subtracts unresolved provisional/dispatched claims
before authorizing another spend; legacy pending claims without an amount fail closed. Applied spending is accounted for
through the observed balance. Focused production-authority, brain, planner and reservation-reconciliation checks pass 22/22;
no native scenario evidence is claimed yet.

H-11 closes on current source and generated fixture in `1793256850909-passed.json`: all six registered variants pass
(1,200 decisions / 24,006 ticks; source `806d51b377f16368bde5fd0b516f307c7196c9dd`, dirty digest
`fnv1a32:09357cfe`, fixture digest `fnv1a32:76ff1345`). The cause was an authored worker start tile that native navigation
marked non-navigable; moving it to the proved Granary approach restores construction and delivery. H-11's exact native
source-to-deposit evidence covers its recovery requirement, so its generic lifetime resource-coverage gate was redundant.
Do not replay H-11 or PLACE-03 unchanged; PLACE-03 protected-route clearance and physical worker/army transit are closed.

PLACE-01 Tivara room remains open. `1793273725059`, `1793274055574`, and `1793274485701` pass tick-1 probes and per-build
clearance but still miss food from five Fields and flag one baseline-path overlap. Nearest-worker pairing reduced misses
from ten to five; same-access-region preference and reachable-approach fallback did not change the final predicates.
Movement captures confirm some worker/Field pairs have no route. Focused planner/movement tests pass. Do not replay
unchanged; return after addressing accessible Field placement and the visibility of the authored route contract.

PLACE-02 Tivara safe `1793274245140` and wide-clearance recheck `1793274795985` failed: eight Fields lacked delivered
food, army transit was incomplete, and the retreat route became blocked after the second Field (tick 60, site `34,27`).
Observation now distinguishes visible stationary blockers from moving bodies, and construction connectivity includes
stationary blockers. Focused coverage passes; the current safe-branch run `1793275382806` (2,401 ticks / 117s, source
`d60b070f58b53668bcc42ea3f1ea65d8d13da379`, dirty source `fnv1a32:159da01b`, fixture `fnv1a32:2970391f`) no longer
reports a blocked retreat or production-army route. Five new Fields still lack native food delivery; a Field still
overlaps the declared reserve path, and physical army transit is incomplete. Do not replay unchanged. Next isolate the
remaining Field placement/delivery and transit predicates, then continue EXP/WALL/recovery.

Latest closed family: SCOUT-03 report `1793174968627-passed.json` (four variants, 400 decisions / 8,004 ticks), source
digest `fnv1a32:05a85282`, fixture digest `fnv1a32:ebc75582`. Previous closed family: STRAT-04 report
`1793069202745-passed.json`, base `2210ab7fe09d`, dirty-source digest `fnv1a32:d22008af`, fixture digest `fnv1a32:4e15b8c2`.
SCOUT-01 closes on current source in `1793232028064-passed.json` (four variants, 400 decisions / 8,004 ticks;
7.5m; candidate `2f4b6e54e323189bc6135d0d964d27138188e588`, dirty source `fnv1a32:ce97eb16`, fixture
`fnv1a32:ed43adfd`). All four physical scouting trips and hidden-world selected-intent parity pass. The final
divergence was native gatherer drop-off tie-breaking by run-local actor ID, which sent equal-distance workers to
different drains and changed later positions/orders. Geometry/name now precede ID; the focused Phaser regression
passes 7/7. Do not replay unchanged.

DOMAIN-02 COAST closes on current source. `1793237263373` exposed the remaining cause: the shore approach had a valid native path, but tactics replaced it with its assembly/rally move, cancelling both orders in turn. The tactics projection now preserves a water attacker's active move when its destination is a compatible firing position. Regression coverage passes; current-source diagnostic `1793237720842-diagnostic_passed.json` passes at 150 decisions / 3,001 ticks in 129s (dirty source `fnv1a32:7f19c784`, fixture `fnv1a32:d0955369`). The boat reaches (26,5), attacks the visible target, and the native oracle accepts its objective damage. Four older attempts document fixture/route issues; do not replay unchanged. Next is ESCORT's paid-fleet objective effect.

ESCORT diagnostic `1793242080163-diagnostic_failed.json` is still failing only `domain_paid_ship_has_no_compatible_native_objective_hit` after 3,001 ticks (7m39s), despite the shore-threat counterforce adjustment. Its captured decision keeps the paid ship in water reserve and issues another rally while the hostile ship is visible. The shore-threat explanation was not sufficient and is no longer treated as a confirmed cause. The planner regression was tightened: it now preserves a ground-core primary mission and requires a separate naval raid from a one-ship reserve; focused offense suite passes 9/9. No further runtime retry until the remaining difference between the captured decision and the focused planner case is identified and repaired. Runtime invocations remain capped at 30m.

SCOUT-02 report `1793073090904-failed.json` (ten variants, 1,200 decisions / 24,010 ticks): both visible controls pass;
hidden and withdrawn variants fail trip/stale-job/survival predicates, and hidden-world permitted-input parity remains
open. The focused Tivara visible diagnostic `1793083017398-diagnostic_failed.json` passes contact/fairness and
stale-certainty checks but lacks a physical information trip. Current withdrawn diagnostics `1793209460328` and
`1793209831885` show accepted scout intents whose native moves fail before physical movement; resume SCOUT-02 only with
a concrete navigation diagnosis.
SCOUT-03 report `1793174968627-passed.json` closes all four branches on one current source and fixture. Its escape setup
uses fast flying scouts versus slower compatible anti-air pursuers, with the contact hidden at opening; a retained legal
retreat waypoint prevents route oscillation. SCOUT-04 report `1793074230112-failed.json` ran all six variants
(720 decisions / 14,406 ticks). The original objective-switch-only predicate failed all six; retained evidence shows all
six contacts entered ranked alternatives within 400 ticks and took later AI-caused native damage.

FIGHT-01 passes all eight native branches in `1793088416093-passed.json` (960 decisions / 19,208 ticks). The captured
runtime source is `441d72399` with fixture digest `fnv1a32:13bf9dd1`; the outer report was finalized after a documentation-only
commit. The evaluator follows native attack-commit behavior and excludes irrelevant long-horizon resource coverage.
FIGHT-02 has verified 40% health starts. Current-source report `1793210845150-passed.json` closes all six branches
(600 decisions / 12,006 ticks) on source `564c499c7` and fixture `fnv1a32:119a13f6`. Safe firing positions, movement
completion, and directing nearby allies at credible threats to wounded ranged units all hold across both factions.

FIGHT-03's revised unequal/loss fixture has a durable valuable main building, an isolated lower-value producer and six
additional compatible reinforcements. Full current-source report `1793211612520-failed.json` found the valuable
building died just before the authored tick-400 loss/escalation event and equal fronts competed with unrelated
targets. The refreshed fixture preserves the valuable front to the event, keeps equal fronts separated and observed,
and removes unrelated economy/noise targets. Fixture checks pass 42/42. Targeted branches pass reports
`1793212061756`, `1793212437251`, `1793212603730`, and `1793212773341`; current-source family report
`1793213533338-passed.json` closes all six branches (720 decisions / 14,406 ticks) on fixture `fnv1a32:dd74d4f1`.

FIGHT-04 Tivara HealingRain passes targeted report `1793133499341-diagnostic_passed.json` (source
`fnv1a32:816f98f7`, fixture `fnv1a32:4c6933e5`); periodic status refresh preserves its tick clock and capture records
real health increases. The other targeted passes are Skaduwee HealingLight `1793165477609` (source
`fnv1a32:3e29588c`, fixture `fnv1a32:7a4545ff`), Skaduwee summon expiry `1793164132277`, and both reachable-target
overkills `1793164782342` / `1793164999565`. HealingLight used `Actor` targeting but autocast previously recognized
only dedicated enemy/ally/self target types; autocast now derives its relation from Actor spell flags and selects the
wounded friendly. Focused Jest 2/2 and scoped ESLint pass. Tivara zone `1793166186099` also passes: the prior predicate rejected its actual enemy Burning statuses because zone effects intentionally omit caster source IDs and a self-owned enemy-only zone is reported as mixed from the caster view. The oracle now requires both an observed owned zone and native Burning on the opponent; focused Playwright checks pass 13/13. Both pending-effect branches pass (`1793166382249`, `1793166557067`). Combined current-source report `1793167558976-passed.json` passes all eight branches (960 decisions / 19,208 ticks) on source `98ef5f546` and fixture `fnv1a32:7a4545ff`. GitHub skipped the PR matrix because #814 is draft; the local combined runtime confirms the family.

FIGHT-05 now has passing evidence for all eight branches. The original report `1793097702563-failed.json` passed both
wall branches and Skaduwee target-loss/disconnected; focused current-fixture runs pass Tivara target-loss
(`1793108112989`), both status cases (Skaduwee slow `1793109580100`, Tivara stun `1793109870717`), both disconnected
cases (Tivara `1793110238361`, Skaduwee `1793110370152`), and Skaduwee target-loss (`1793110509861`). The status setup
pre-completes research and casts before the caster dies. Ground spells omit actor target IDs; spell-created statuses
carry the source actor ID; stunned actors cannot start attacks. Disconnected uses its terrain ring without an unavailable
tick-400 worker control, and accepts native damage against another reachable target rather than one hard-coded target.

RAID-01's current-source Tivara workers diagnostic `1793219068120-diagnostic_passed.json` passes (120 decisions / 2,401
ticks; fixture `fnv1a32:fba3bb14`). Captured native evidence joins the worker's successful drop-off to the raided
`contact-group` WorkMill; the dedicated raid causes physical damage while a distinct primary squad pressures its own
objective. Expansion diagnostics `1793219248061` and `1793219575377` exposed setup problems: the remote deposit was
unserved, its worker overlapped the WorkMill footprint and could not move, an idle worker decoy attracted the raid, and
the main squad hit `front-target-b` while the oracle demanded `front-target-a`. A follow-up showed a combat decoy diverted the raid into defense/intercept at tick 160. The fixture now puts an active worker
outside the remote deposit footprint, keeps a nearby gather source, removes the idle-worker economic decoy, and turns
the nearby contact into a passive Wall. The oracle accepts native raid damage to that verified serving worker or deposit,
and recognizes either authored main front when the assigned primary squad causes native damage. Fixture structure passes
both factions; native fixture checks pass 43/43, focused oracle checks 15/15 and changed-file ESLint passes. Current-source Tivara expansion diagnostic `1793220139730-diagnostic_passed.json` passes at 120 decisions / 2,401 ticks (dirty digest `fnv1a32:2f14f2ca`, fixture `fnv1a32:d127defe`). All four Tivara RAID-01 branches pass targeted current-source diagnostics: workers `1793219068120`, expansion `1793220139730`, unfinished `1793221894502`, and protected `1793222384126` (each 120 decisions / 2,401 ticks).
Skaduwee workers reports `1793222587736`, `1793223149911`, and `1793223401387` exposed the range-1 melee group and loss of the worker's WorkMill drop-off after moving it. Keep the worker's authored service path and use a faction-appropriate ranged `army-4` in this branch. Current-source report `1793223612728-diagnostic_passed.json` passes (120 decisions / 2,401 ticks; source `806c1f115`, fixture `fnv1a32:a2f2b6ec`). Both-faction structural checks pass 46/46 and scoped ESLint passes.
Skaduwee expansion's both-faction fixture invariants pass (focused RAID-01 fixture tests 4/4). Current-source diagnostic `1793223863135-diagnostic_passed.json` passes (120 decisions / 2,401 ticks; candidate `09c758a03`, fixture `fnv1a32:a2f2b6ec`, 123s runtime, no AI errors). Next is `raid-01-skaduwee-unfinished`.
Skaduwee unfinished passes its both-faction setup check. Current-source diagnostic `1793224074051-diagnostic_passed.json` passes (120 decisions / 2,401 ticks; candidate `3d2a56fb6`, fixture `fnv1a32:a2f2b6ec`, 134s runtime, no AI errors). Next is `raid-01-skaduwee-protected`.
Skaduwee protected diagnostic `1793224250744-diagnostic_failed.json` found seven of eight defenders overlapping the WorkMill footprint. Moving all eight to distinct clear approach tiles made them visible from tick 20 and prevented raid selection. Synchronized-fixture run `1793224685412-diagnostic_failed.json` fails only the main-pressure oracle: the primary selected the enemy core and caused 33 native damage events at ticks 2110–2399, while only authored front targets were accepted. The evaluator now accepts the enemy core as main-force continuation; the focused evaluator regression passes 4/4, RAID-01 fixture checks pass, gameplay offense suite passes 572/572, and scoped ESLint passes. Recheck only Skaduwee protected.
Skaduwee protected final diagnostic `1793224976887-diagnostic_passed.json` passes (120 decisions / 2,401 ticks; candidate `098a99865`, fixture `fnv1a32:164d5d1c`), with no dedicated raid and 33 primary native hits against the enemy core from ticks 2110–2399. All eight RAID-01 branches have targeted passing evidence; combined registered matrix remains CI-owned.

All three RAID-02 repetitions pass current source: `1793225531829-diagnostic_passed.json` (1),
`1793225177965-diagnostic_passed.json` (2), and `1793225333930-diagnostic_passed.json` (3); each uses fixture
`fnv1a32:ba424ce1`, reaches 600 decisions / 12,000 ticks, wins, delivers income and passes post-raid redirection.
Repetition 3 retains three raiders. The original repetition-1 report `1793104113441` was superseded because offensive
selection and tactics changed; the current-source recheck passes at candidate `0ede4fd46`.

## Validated outcomes

- Packages 1–2 are complete: production 8/8; economy/technology 16/16.
- SEQ-01 reaches two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 passes all six branches. STRAT-02 passes all five registered branches. STRAT-09 has passing evidence for all
  eight branches. One shared RAID-03 boat branch passes. Detailed artifacts and source provenance are archived.
- STRAT-03 passes all six branches at 150 decisions / 3,001 ticks: both minor branches and Skaduwee withdrawn win; both reinforced branches and Tivara withdrawn meet their expected branch outcomes. All branches retain their home and satisfy the native defense/offense predicates. Reports and source provenance are archived.
- STRAT-04 passes all six branches at 100 decisions / 2,001 ticks each. Quiet and harmless-noise controls preserve the committed goal and produce native damage through the attack squad; the real-threat controls adapt physically. Report and source provenance are archived.
- SCOUT-01 is closed on current source: all four native variants pass physical-trip and hidden-world selected-intent parity in `1793232028064-passed.json`. The drop-off tie-break regression passes; no unchanged replay is needed.
- SCOUT-02 is partial, not closed: both visible controls pass, while the eight withdrawn/hidden branches do not sustain useful information service or keep the authored contact alive through the horizon. Hidden-world permitted-input parity also fails. A focused visible diagnostic with improved opening spacing passes contact/fairness and stale-certainty checks but still misses a physical information trip. Full branch details and runtime provenance are archived.
- Current-source withdrawn diagnostics `1793209460328` and `1793209831885` confirm scout intents are accepted after same-plan provisional lease renewal was enabled, but native movement still ends in `Move - Movement Failed`; no physical trip or stale-job service is recorded. Nearest-unseen-point ranking did not help and was reverted; later SCOUT-01 source now passes after independent parity repairs. SCOUT-02 remains open pending a concrete native navigation diagnosis and resulting trip.
- SCOUT-03 is closed on all four current-source branches: both trapped and both physical escape branches pass.
- SCOUT-04 is closed on all six retained branches: contact consideration occurs within 400 ticks and each branch has later AI-caused native damage.
- FIGHT-01 is closed on all eight native branches: favorable combat, changed-risk regrouping, and the quiet continued-fight control pass.
- FIGHT-02 and FIGHT-03 are closed on all six current-source branches each. FIGHT-03 combined report `1793213533338-passed.json` uses the corrected two-front and tick-400 loss fixture.
- FIGHT-04 and FIGHT-05 are closed across all eight native branches each; FIGHT-04 combined report `1793167558976-passed.json` passes 960 decisions / 19,208 ticks on current source. FIGHT-05 uses retained wall evidence and focused current-fixture runs for target-loss, status and disconnected setups.
- Selected native obligations: **10/22 closed** (STRAT-05, STRAT-02, STRAT-03, STRAT-04, SCOUT-03, SCOUT-04, FIGHT-01, FIGHT-04, FIGHT-05 and RAID-02); 12 remain. RAID-01's eight targeted branch passes await its CI-owned combined registered matrix. Partial branch evidence does not close a family.
- Supported registration remains complete: pure 111/111 and native definitions/runtime recipes 115/115. These are
  authoring coverage, not behavior completion. Overall behavior percentage is unavailable until the existing evidence is
  reconciled across all supported rows.

## Active gaps

| Package | Remaining work |
| --- | --- |
| 3 — scouting, combat, access | DOMAIN-01/05/06, DOMAIN-02 COAST and its two controls, INTERCEPT, SCOUT-01/03/04, FIGHT-01/02/03/04/05 and RAID-02 pass. All RAID-01 targeted branches pass; its combined registered matrix remains CI-owned. ESCORT's paid-fleet objective effect and SCOUT-02 native trip/service remain. Seven real-peer obligations remain CI-owned. STRAT-09 needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | H-11 and all eight PLACE-03 branches pass. PLACE-01/02, EXP-01/02, WALL-01–05 and remaining H-01–05/H-27–28 branches still need scoped semantic/evidence closure. |
| 5 — authority and lifecycle | H-10 over-capacity variants, H-06/07, H-08/09 peer evidence, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission audit and final closure audit. |

CI already runs the registered runtime and peer matrix. Use local native runs only to answer a concrete question after an
affected change; do not repeat unchanged passing evidence. PR #814 remains draft and unchanged. The handoff records the
next branch and publication status.
