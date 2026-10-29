# #759 current evidence — single-player iteration

Updated 2026-10-29. HANDOFF owns the cursor; REMAINING-WORK owns acceptance and execution policy.
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
| A1 useful safe placement | in_progress | PLACE-01 diagnostic 1793301306256 used an uncommitted repeated-order fixture (`fnv1a32:7c33d7ef`): worker transit ended at a fallback tile, combat transit was retasked to Attack at tick 20, and a Field completed at tick 2341 had only 59 ticks to deliver food. The probe edits were restored. Do not repeat; establish a smaller coordinate/ownership premise before native evidence. PLACE-03 remains retained. |
| A2 useful passable walls | in_progress | Manager regression failed before the layout fix: one-tile gate allowed a wall at (9,9) across owned Move (8,9)->(10,9) while whole-area connectivity passed. Layout now leaves center plus one tile on each side clear; five focused manager/recovery/continuation/placement suites pass (41 tests). Old native WALL-01 attempts built no wall. Capture decisions showed essential housing demand 2/4 gated optional fortification. The fixture now adds two named native houses (total 4) for both terrain variants; generator test passes. Capture attempts 1793301901609/1793302187843 hit browser JSON-string length; streamed gzip export and its 12k-fact Playwright regression pass, but 1793302528839 then hit Node's maximum string length (`0x1fffffe8`). Stop native retries until Node-side capture can be bounded/incrementally parsed. No native wall evidence. |
| A3 construction recovery | in_progress | Recovery now caps repeated terminal fortification failures: after two timed repairs fail (three total attempts), the node and plan become abandoned and emit no further intents. Regression failed before and passes; recovery/manager/continuation specs pass 25/25 and scoped ESLint passes. H-11/PLACE-03 remain retained native evidence; confirm their applicability to current fortification changes before closure. |
| B1 safe expansion/recovery | pending | EXP-01 branches pass; EXP-02 Skaduwee home loss remains. |
| B2 sustained fair scouting | in_progress | SCOUT-01/03/04 retained. H-14 Tivara harmless-control passes at 1793303409673 (3001 ticks; win, native income, scouting and paid output); prior 1793294021197 failure was an evaluator false negative requiring one nominal wood source despite exact neutral stone/mineral delivery. Skaduwee harmless-control remains required. |
| B3 combat continuity | pending | STRAT/FIGHT/RAID passes retained; invalidate only affected outcomes. |
| C1 exactly-once ownership | validated | H-06/07 retained for both factions. A duplicate `dispatched` callback with the same identity but altered actor IDs could overwrite the original pending actor set and reset application progress. Reconciliation now ignores a second admission while pending. Regression failed before and passes after; focused reconciliation/adapter tests pass 12/12; pure reservation test passes 1/1. |
| C2 reservation/capacity/budget | validated | H-10 capacity passes. H-13 ownership failure was an evaluator false positive on each variant's first decision: no older provisional claim existed, yet it required a pre-selection snapshot. Evaluator now skips frames without older cash; focused checks pass, including rejection when older cash lacks evidence. Follow-up capture 1793300103293 (`candidate 9597a577f`, fixture `fnv1a32:1ce3d633`) confirms Tivara own-Field food extraction → offered cargo → balance-matched native credit, and a legal ordinary-new-base control with one charge and finished/indexed Sandhold at tick 1405. Its only diagnostic failure was requiring neutral ownership; evaluator now accepts exact delivery from owner 2 or neutral. Skaduwee diagnostic 1793300480186 passed in 154s with the same fixture, including a finished owned FrostForge. Focused delivery tests pass 8/8. A resource escrow regression proves a live provisional claim still blocks spend after the observed ledger contracts and is released at its exact due tick. Full gameplay suite passes 105 suites/609 tests; focused Phaser ownership/authority suite passes 20/20. No full H-13 replay needed solely to re-score these corrected checks. |
| C3 shared guard safety | validated | Reviewed command identity, duplicate-admission and epoch transitions in reconciliation/dispatch. Focused reconciliation, outcome adapter, intent dispatch and result dispatch tests pass 20/20, covering altered duplicate actor sets, partial terminal receipts, stale epoch outcomes and detached dispatch identity. |
| D1 SP save continuation | pending | Pure continuation exists; native H-31 evidence needs checking. |
| D2 second SP match | pending | Inspect H-32 top-level peer restriction before running SP branch. |
| E1 two-faction victory/recovery | pending | SEQ-01 retained; final affected-source applicability and SEQ-02 outstanding. |
| E2 ordinary-play quality | pending | Review release-pack timelines for concrete stalls/waste. |
| E3 checks/review/publication | pending | Final audits follow implementation. |

## Active failures — do not replay unchanged

| Owner | Retained evidence | Diagnosis and next action |
| --- | --- | --- |
| PLACE-01 | See A1 ledger; 1793293034206 and 1793301306256 | Original route/alignment failures plus invalid repeated-control probe: combat actor's native order was retasked and first worker endpoint used a fallback. Rebuild a small physical route premise before retry. |
| PLACE-02 | Prior safe-branch diagnostics; locate exact artifact via archive | Reserved-path overlap and incomplete physical transit; fixture corridor not continuously represented by orders. Establish active route premise before repair. |
| WALL-01 | See A2 ledger; 1793297656059, 1793297881648, 1793301901609, 1793302187843, 1793302528839 | Native wall remains unproven. Housing gate was identified and fixture corrected; full capture exceeds browser/Node string limits. No unchanged full-match retries; first bound capture or parse incrementally, then resume. |
| EXP-02 | Tivara pressure 1793291757838 passes; Skaduwee 1793292575217 fails | Optional service suppressed under credible pressure; local retreat fixes paid completion but original home dies around tick 918 under four Macemen. Diagnose defense/arrival/orders before pressure rebalance. |
| H-14 | 1793294021197-diagnostic_failed; corrected evaluator, 1793303409673-diagnostic_passed | Failure was a false negative: native resource authority showed neutral stone/mineral delivery, scouting trips and six paid outputs, but the evaluator required delivery from the fixture's nominal wood-source actor. It now accepts exact neutral delivery for any resource. Tivara harmless-control wins at tick 3001 with 105.5 delivered income and six units produced. Other branches and Skaduwee harmless-control not confirmed. |
| H-13 | 1793296020629-failed; follow-ups 1793300103293-diagnostic_failed and 1793300480186-diagnostic_passed; candidate 9597a577f; fixture fnv1a32:1ce3d633 | Original eight variants: 1200 decisions/24008 ticks, ~17.4m. Each variant's only missing ownership snapshot was its first selected decision, where no older provisional claim exists; evaluator now skips it. Tivara `new_identity` delivered native owned-Field food through exact offer/credit and finished a legally placed, exactly charged base. Its remaining failure was the evaluator demanding neutral ownership; it now accepts exact owner-2 or neutral delivery. Skaduwee `new_identity` passed in 154s with the same fixture and finished an owned FrostForge. Focused helper tests pass. The full original family is not replayed solely to recompute these predicates. |

H-13 was the previously interrupted run; follow-up was one diagnostic branch (~116s). No new eight-variant run launched.
Do not use a reported win in its artificial world as evidence that its ownership assertions passed.
Earlier claims of fixes "in the working tree" referred to changes now included in the baseline commits; verify Git.

## Retained useful passes

| Area | Evidence |
| --- | --- |
| Production/economy/technology | Earlier packages record production 8/8 and economy/technology 16/16; detailed provenance in archive. Preserve subject to dependency review. |
| SEQ-01 | Recorded authoritative two-faction victory at 18000 ticks with adaptive build-space radius. Old one-faction-only statement is obsolete. |
| PLACE-03 / H-11 | All eight PLACE-03 branches and H-11 construction recovery recorded passing. Locate report provenance narrowly in archive before relying on individual predicates. |
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
