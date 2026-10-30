# #759 current evidence — single-player iteration

Updated 2026-10-30. HANDOFF owns the cursor; REMAINING-WORK owns acceptance and execution policy.
This file records evidence, not instructions to replay every scenario. Historical details remain in Git and
EVIDENCE-ARCHIVE.md. No gameplay/test execution occurred during Astra preparation.
Baseline: 3555fb04e21c (gameplay batch b9274bdd15d7). Check dependency changes before reusing old results.
"Retained pass" below means recorded earlier evidence, not a fresh validation at preparation time.
Raw artifacts are local/ignored; locate by report ID under tmp/ai-skirmish-matrix or the historical archive.
If an artifact is unavailable, say so; a prose summary alone cannot establish a new native claim.

## Iteration acceptance ledger

Update these rows in place with source/fixture/report references and focused-check results.
State vocabulary: pending, in_progress, validated, blocked. Partial evidence is stated explicitly.
An aggregate old scenario count is not this iteration's completion percentage.

| ID | State | Evidence / next gap |
| --- | --- | --- |
| A1 useful safe placement | in_progress | PLACE-01 diagnostic 1793301306256 used an uncommitted repeated-order fixture (`fnv1a32:7c33d7ef`): worker transit ended at a fallback tile, combat transit was retasked at tick 20, and a Field completed with only 59 ticks left for delivery. Do not repeat. Current PLACE-03 fixture `fnv1a32:440065ab`, source `5355fd47b`: `layout` passes for Tivara 1793316739013 and Skaduwee 1793317006476; `concurrent` passes for Tivara 1793317192393 and Skaduwee 1793317449881. Each passes native transits, competing placement, exit and prefix checks at 150 decisions/3001 ticks. Tivara `completion` passes 1793317628203 and `loss` 1793318260099 (3001 ticks, 17 workers, 11 army, 410.48 income, seven produced). Skaduwee `completion` 1793317870460 fails four prefix checks after a Granary covers `(41,24)`, the `production-army` route's start. That route has no matching active order in captured AI input; fix the fixture premise before counting it. Focused builder-loss native control passes on `76bec1347`: loss at tick 80, replacement builder assigned, same producer completes, history closed through tick 1200. PLACE-03 Skaduwee loss and a valid active-route completion premise remain open. |
| A2 useful passable walls | in_progress | Fortification gate regression proves a one-tile opening plus adjacent clear cells; focused manager/recovery/continuation/placement checks pass (41 tests). Incremental gzip parsing (`@discoveryjs/json-ext`) and a 1 GiB external-variant cap fixed capture transport (commit `219898da2`; parser regression and six artifact-codec tests pass). Long repeated army moves were fixture-invalid; short tick-1 on-route probes pass all 51 fixture tests (`831332ecc`). Tivara terrain `1793320599420-diagnostic_passed` (candidate `831332ecc`, fixture `fnv1a32:78650e80`) wins at 3001 ticks and passes native wall/route/effect checks. Skaduwee terrain `1793320854256-diagnostic_failed` also wins at 3001 but forms no fortification plan or paid wall despite 4000 stone and legal catalog definitions. Skaduwee no-value control `1793321331730-diagnostic_passed` wins at 3001 and declines obsolete remote fortification. Diagnose useful-wall trigger/layout before another such run. |
| A3 construction recovery | in_progress | Fortification retries stop after three failures; recovery/manager/continuation specs pass 25/25. H-11 failure 1793313593915 showed baseline clearance around existing walls blocking the builder at (31,22). Baseline now uses actual static passability; added clearance applies only around proposed/reserved footprints. Adjacent-wall regression plus food-infrastructure/placement suites pass 29/29. Both one-worker native branches pass on fixture `fnv1a32:76ff1345`, source `4b98966c7`: Tivara 1793316324413 (dirty `fnv1a32:d8adcf62`, 51 income) and Skaduwee 1793316467854 (dirty `fnv1a32:57a6838a`, 47.74 income); each reaches 4001 ticks, produces three and recovers to four workers. Focused native `builder_loss` recovery control passes (`76bec1347`, Playwright `--grep builder_loss`): one-time charge, original builder removed at tick 80, replacement assigned, same producer completed, capture closed through tick 1200. Initial site `(800,848)` was correctly rejected `invalid_footprint`; moved to `(1056,848)`. Route-prefix checks stay in dedicated PLACE-03 layout cases. |
| B1 safe expansion/recovery | in_progress | EXP-01 retained; Skaduwee home_pressure 1793304761105 passes. New EXP-02 `pressure_withdrawn` diagnostics pass for both factions on candidate `e792827ab66d`, dirty `fnv1a32:cc22f882`, fixture `fnv1a32:48f86832`: Skaduwee 1793313251345 (141s) and Tivara 1793313388623 (132s), each 150 decisions/3001 ticks. The safe source is native Tree11 at its legal 240 capacity; the fixture withdraws at tick 440 after serious home damage and before the first Tivara raider is lost. Recovery intent may use the first sample of a subsequently confirmed two-sample clear window; paid completion, safe-source delivery and retreat/death evidence remain independently required. Focused pressure/world-evaluator Playwright tests pass 5/5, fixture tests 3/3, scoped ESLint clean. Continue remaining B1 controls plus B2/B3. |
| B2 sustained fair scouting | in_progress | SCOUT-01/03/04 retained. H-14 harmless-control now passes for both factions: Tivara 1793303409673 and Skaduwee 1793305015091 (3001 ticks, win, native income/scouting; Skaduwee delivered 303.5 income and produced eight workers). The earlier Tivara evaluator false negative required a nominal wood source despite exact neutral stone/mineral delivery; exact native delivery is now accepted. Follow-up gaps: SCOUT-02 is deferred, and other B scouting/combat continuity evidence remains under review. |
| B3 combat continuity | in_progress | Retained controls include STRAT-04 harmless-noise `1793069202745` (six branches), FIGHT-02/03 six-branch reports `1793210845150`/`1793213533338`, FIGHT-04 eight-branch pass `1793167558976`, targeted RAID-01 branches, and three RAID-02 12,000-tick victory/reorientation repetitions. Applicability after later tactical/retreat changes needs review before closure; authoritative both-faction release wins remain E1. |
| C1 exactly-once ownership | validated | H-06/07 retained for both factions. A duplicate `dispatched` callback with the same identity but altered actor IDs could overwrite the original pending actor set and reset application progress. Reconciliation now ignores a second admission while pending. Regression failed before and passes after; focused reconciliation/adapter tests pass 12/12; pure reservation test passes 1/1. |
| C2 reservation/capacity/budget | validated | H-10 capacity passes. H-13 ownership failure was an evaluator false positive on each variant's first decision: no older provisional claim existed, yet it required a pre-selection snapshot. Evaluator now skips frames without older cash; focused checks pass, including rejection when older cash lacks evidence. Follow-up capture 1793300103293 (`candidate 9597a577f`, fixture `fnv1a32:1ce3d633`) confirms Tivara own-Field food extraction → offered cargo → balance-matched native credit, and a legal ordinary-new-base control with one charge and finished/indexed Sandhold at tick 1405. Its only diagnostic failure was requiring neutral ownership; evaluator now accepts exact delivery from owner 2 or neutral. Skaduwee diagnostic 1793300480186 passed in 154s with the same fixture, including a finished owned FrostForge. Focused delivery tests pass 8/8. A resource escrow regression proves a live provisional claim still blocks spend after the observed ledger contracts and is released at its exact due tick. Full gameplay suite passes 105 suites/611 tests; focused Phaser ownership/authority suite passes 20/20. No full H-13 replay needed solely to re-score these corrected checks. |
| C3 shared guard safety | validated | Reviewed command identity, duplicate-admission and epoch transitions in reconciliation/dispatch. Focused reconciliation, outcome adapter, intent dispatch and result dispatch tests pass 20/20, covering altered duplicate actor sets, partial terminal receipts, stale epoch outcomes and detached dispatch identity. |
| D1 SP save continuation | in_progress | H-31 grouped run 1793314979348 failed setup/premise and continuation checks. After fixing `HealthComponent` pre-init restore (focused Phaser spec 7/7), Tivara before-apply diagnostic 1793315665949 still diverges after 401 ticks: actor health now matches, while `systems.aiControllers` observation/access graph differs (136 vs 134 links; access products 24 vs 47). Keep decision/world equality strict; isolate this captured graph mismatch before another H-31 run. |
| D2 second SP match | in_progress | H-32 branch-aware SP dispatch is fixed; registration/selection/execution tests pass 58/58. Tivara `normal` 1793314086840 and `paid_queue` 1793314126658 pass diagnostic. Skaduwee `normal` 1793314649303 fails old-work shutdown proof (61 tick observers, old tick subject not stopped and shutdown event not observed); `pending_path` timed out in prior attempts. Do not replay unchanged. |
| E1 two-faction victory/recovery | pending | SEQ-01 retained; final affected-source applicability and SEQ-02 outstanding. |
| E2 ordinary-play quality | pending | Review release-pack timelines for concrete stalls/waste. |
| E3 checks/review/publication | pending | Final audits follow implementation. |

## Active failures — do not replay unchanged

| Owner | Retained evidence | Diagnosis and next action |
| --- | --- | --- |
| PLACE-01 | See A1 ledger; 1793293034206 and 1793301306256 | Original route/alignment failures plus invalid repeated-control probe: combat actor's native order was retasked and first worker endpoint used a fallback. Rebuild a small physical route premise before retry. |
| PLACE-02 | Prior safe-branch diagnostics; locate exact artifact via archive | Reserved-path overlap and incomplete physical transit; fixture corridor not continuously represented by orders. Establish active route premise before repair. |
| WALL-01 | Tivara terrain `1793320599420-diagnostic_passed`; Skaduwee terrain `1793320854256-diagnostic_failed`; Skaduwee no-value `1793321331730-diagnostic_passed`; fixture `fnv1a32:78650e80` | Tivara passes native connected wall, damage and route checks; Skaduwee's no-value control wins without obsolete remote wall spend. Skaduwee useful terrain still has no defensive plan/wall despite resources and definitions; no unchanged rerun. Remaining: diagnose plan rejection, Skaduwee wall effect and terrain/freestanding length comparison. Capture pipeline is fixed. |
| EXP-02 | Tivara home-pressure 1793291757838; Skaduwee home-pressure 1793304761105; withdrawal recovery Skaduwee 1793313251345 and Tivara 1793313388623 | Original Skaduwee capture 1793292575217 showed formation members leaving home defense while the retreat anchor stayed inside radius. Radius now accounts for maximum formation offset. Withdrawal runs pass at 3001 ticks on shared source/fixture and prove fair home damage, native withdrawal/kill resolution, and a productive new safe service after sustained danger clears. Preserve these results; no unchanged withdrawal replay. Combat-resolved positive recovery remains unverified. |
| H-14 | 1793294021197 false negative; Tivara 1793303409673 and Skaduwee 1793305015091 passed | Evaluator now accepts exact neutral resource delivery. Both harmless-control runs win at tick 3001 with native scouting/income; Tivara delivered 105.5 and produced six units, Skaduwee delivered 303.5 and produced eight workers. Harmless-control minimum covered for both factions. |
| H-13 | 1793296020629-failed; follow-ups 1793300103293-diagnostic_failed and 1793300480186-diagnostic_passed; candidate 9597a577f; fixture fnv1a32:1ce3d633 | Original eight variants: 1200 decisions/24008 ticks, ~17.4m. Each variant's only missing ownership snapshot was its first selected decision, where no older provisional claim exists; evaluator now skips it. Tivara `new_identity` delivered native owned-Field food through exact offer/credit and finished a legally placed, exactly charged base. Its remaining failure was the evaluator demanding neutral ownership; it now accepts exact owner-2 or neutral delivery. Skaduwee `new_identity` passed in 154s with the same fixture and finished an owned FrostForge. Focused helper tests pass. The full original family is not replayed solely to recompute these predicates. |

H-13 was the previously interrupted run; follow-up was one diagnostic branch (~116s). No new eight-variant run launched.
Do not use a reported win in its artificial world as evidence that its ownership assertions passed.
Earlier claims of fixes "in the working tree" referred to changes now included in the baseline commits; verify Git.

## Retained useful passes

| Area | Evidence |
| --- | --- |
| Production/economy/technology | Earlier packages record production 8/8 and economy/technology 16/16; detailed provenance in archive. Preserve subject to dependency review. |
| SEQ-01 | Recorded authoritative two-faction victory at 18000 ticks with adaptive build-space radius. Old one-faction-only statement is obsolete. |
| PLACE-03 / H-11 | Prior eight-branch pass summary has no retrievable artifact/provenance in the archive; do not count it. Current PLACE-03 layout/concurrent pass for both factions (1793316739013, 1793317006476, 1793317192393, 1793317449881); Tivara completion/loss pass (1793317628203, 1793318260099). Skaduwee completion 1793317870460 exposes an unsourced `production-army` oracle route; no active matching order was present. Native builder-loss control passes on code/fixture `76bec1347`; initial site at `(800,848)` was invalid, then corrected to `(1056,848)`. H-11 passes for both factions (1793316324413, 1793316467854). Skaduwee loss and active-route completion premise remain open. |
| H-06 / H-07 | 1793283838864-passed, ten variants, 1080 decisions/21610 ticks. Safe Gather-to-construct transfer and Field-return regressions also passed. |
| H-10 capacity | Tivara 1793288095255; Skaduwee 1793288214889; 150 decisions/3001 ticks each. Any valid neutral resource lane may prove recovered delivery; peer coverage separate. |
| H-15 emergency | 1793294898547-passed; source b9274bdd15d7, fixture fnv1a32:9ec64967; six variants, 720 decisions/14406 ticks. Lethal/resolved/far controls. |
| EXP-01 | Eight targeted branches recorded passing after weapon-range and duplicate-service/stale-base fixes. Combined family not certified by targeted evidence. |
| SCOUT-01 | 1793232028064-passed; four variants, 400 decisions/8004 ticks; source fnv1a32:ce97eb16, fixture fnv1a32:ed43adfd. Geometry-first drop-off tie fix. |
| SCOUT-03 | 1793174968627-passed; four variants, 400 decisions/8004 ticks; source fnv1a32:05a85282, fixture fnv1a32:ebc75582. |
| SCOUT-04 | Six retained variants re-evaluated passing contact consideration and subsequent native damage; no replay needed. |
| STRAT-02/03/04/05/09 | Prior recorded branch passes; STRAT-04 1793069202745-passed (six). STRAT-09 applicability after shared changes requires review. |
| FIGHT-01 | 1793088416093-passed; eight branches, source 441d72399. |
| FIGHT-02 / FIGHT-03 | 1793210845150-passed (six, source 564c499c7); 1793213533338-passed (six, source c66712f4b). |
| FIGHT-04 | 1793167558976-passed; eight branches, 960 decisions/19208 ticks. Actor-target autocast, native status/zone evidence repaired. |
| FIGHT-05 | Eight branches have retained targeted evidence; see archive for branch/source map, not a new run. |
| RAID-01 | Eight targeted passes: 1793219068120, 1793220139730, 1793221894502, 1793222384126, 1793223612728, 1793223863135, 1793224074051, 1793224976887. |
| RAID-02 | 1793225531829, 1793225177965, 1793225333930; three repetitions, each 12000 ticks, win/income/post-raid redirection. |
| DOMAIN/COAST | DOMAIN-01/05/06 recorded closed; COAST 1793237720842-diagnostic_passed, 3001 ticks. Naval approach no longer cancelled by tactical assembly. |

## Explicit follow-ups, not iteration blockers by themselves

- SCOUT-02: 1793073090904-failed full family; later 1793209460328/1793209831885 still end native Move with
  Movement Failed. Accepted intent is not physical trip. Basic useful scouting remains required through B2.
- ESCORT: 1793242080163-diagnostic_failed; paid boat stays reserve/rally despite visible hostile ship.
  Separate naval-raider focused test passes but captured-world discrepancy unresolved. No unchanged replay.
- Multiplayer: seven old peer obligations remain unvalidated. Prior CI check 40878016593 skipped on draft PR #814;
  local peer runner previously blocked by Docker. No peer/infrastructure work this iteration.
- D-06: legacy difficulty/opening comparison unsupported. Do not claim calibration or force candidate fallback.
- Advanced debugger/replay certification, broad legacy retirement and optional island content remain follow-ups.
- Historical 13/22 selected native obligations is a mixed-scope snapshot, not a live progress metric. Use A1–E3 above.

## Recording a batch

Replace affected rows: acceptance ID, actual behavior, source commit/dirty digest, fixture digest, check command/result,
artifact reference, applicability/invalidation and next action. Keep unknown provenance explicitly unknown.
Do not append narratives or duplicate these results into HANDOFF. Raw payloads stay out of model context.
