# #759 archived evidence history

Historical snapshots through 2026-10-26. This file preserves detailed diagnostic notes from earlier checkpoints; it may
contain superseded observations and next actions. Use HANDOFF.md and CURRENT-EVIDENCE.md for the active status.

## 2026-10-26 — STRAT-03 tactical ownership repair

- Run 821 exposed `invalid_ai_tactical_order_owner:squad:defense:home` after the attack-squad membership repair removed
  the corresponding attack fault. A shared helper now filters ordered actor IDs, assigned positions and damage
  reservations to current squad members, and both attack and home-defense squad reconstruction use it. Regression tests
  cover ownership filtering; gameplay tests pass 104 suites / 549 tests.
- Run 822 (`tmp/ai-skirmish-matrix/822-strat03-defense-ownership/1793048522716-diagnostic_failed.json`) completed 150
  decisions / 3,001 ticks. The original Sandhold survives; no AI technical faults remain. The reinforced Tivara branch
  still fails its strict post-800 reinforcement visibility / scaled physical defense predicate and native damage to the
  original home. Do not call the family closed or repeat the same branch without a new hypothesis.
- STRAT-03's authored offensive target is now durable through raid contact: FrostForge for Tivara and WatchTower for
  Skaduwee. Native fixture audit passes 27/27. Advance to STRAT-04 while preserving STRAT-03 for a targeted follow-up.

## 2026-10-26 — STRAT-04 Tivara harmless-noise investigation

- Runs 823–825 reached the 2,001-tick horizon. Run 823 lost frontier history when a committed force deadline exceeded
  the authored 2,000-tick horizon. The frontier recorder now ignores only deadlines beyond that horizon while still
  rejecting late in-horizon deadlines (5/5 focused tests). STRAT-04's native oracle now skips unrelated broad resource
  ledger coverage because it asserts exact strategy and combat evidence instead (scenario-context Playwright 12/12).
- Run 825 then exposed the strategic defect: after scout contact the AI escalates to a visible enemy core needing 21
  units while its current objective needs 3, despite having 8 ready. A current mission with members and an unexpired
  effect deadline now counts as committed; fresh native movement toward visible objectives also counts as pursuit. The
  focused selector spec passes 16/16.
- Runs 826–827 still fail `strategy_minor_noise_reset_commitment_or_stopped_useful_offense`. Run 827 retains the original
  objective through tick 600 but switches to the core by tick 800; the match records no native damage against the authored
  `contact-group`. Do not repeat this branch unchanged. Revisit only with a targeted native-order/route hypothesis and
  advance to STRAT-05 meanwhile.

## Latest checkpoint - 2026-10-26

- **STRAT-09 changed-source Tivara raid:** two focused runs reached 200 decisions / 4,001 ticks. The latest fails the
  comeback attack/effect predicates and `worker_bootstrap`; no native damage reached `main-target`, and all eight workers
  were lost. Broad resource coverage was correctly removed from the exact scenario oracle. Sorting local threats by
  protected-asset distance did not stop the losses. Latest artifact:
  `tmp/ai-skirmish-matrix/763-package3-strat09-defense-focus/1793011443483-diagnostic_failed.json`.
- **Package 3 pure audit:** 40 scenarios, 46 suites and 278 tests pass with no missing bindings. STRAT-09 has one partial
  owner contract; its native raid, denial, unrecoverable and path-outage branches remain open.
- **PLACE-03 changed-source access check:** 150 decisions / 3,001 ticks still fail static route clearance and worker/army
  arrival. Transit controls begin at tick 200, while probes apply at baseline and opening builds at tick 20. Do not replay
  unchanged; make the route observable first or bind the probe to native movement.

- **H-10 Tivara below-capacity:** exact native backlog predicates pass at 150 decisions / 3,001 ticks; the AI retains
  eight workers, continues gathering, and wins at the checkpoint. Artifact:
  `tmp/ai-skirmish-matrix/760-package5-h10-tivara-below-capacity-next/1792997974373-diagnostic_passed.json`.
  Skaduwee below-capacity also passes (`tmp/ai-skirmish-matrix/760-package5-h10-skaduwee-below-capacity-next/1792998520782-diagnostic_passed.json`).
  Tivara at-capacity also passes at 150 decisions / 3,001 ticks
  (`tmp/ai-skirmish-matrix/760-package5-h10-tivara-at-capacity-next/1792999002384-diagnostic_passed.json`). Together
  Skaduwee at-capacity passes too (`tmp/ai-skirmish-matrix/760-package5-h10-skaduwee-at-capacity-next/1792999530939-diagnostic_passed.json`).
  Both factions now have local evidence for below, at, and resumed capacity (6/8 variants); over-capacity variants remain
  for CI's registered matrix, so H-10 stays open pending those results.
- **Latest focused H-30 progress:** Tivara throw now passes after binding a research-specific receipt fault through tick
  2800 and extending the native horizon to 4000; its terminal research receipt was held/released and drained by a later
  healthy decision, while exact native worker deliveries, resumed planning, and two-faction victory all passed
  (`tmp/ai-skirmish-matrix/760-package5-h30-tivara-terminal-receipt-v2/1792966085082-diagnostic_passed.json`, 200
  decisions / 4001 ticks). H-30's recovery income oracle now accepts any authored worker only when its exact source→cargo→
  deposit credit chain is present. H-30 Skaduwee throw re-evaluates with no context or fault failures under the corrected
  terminal-receipt oracle; its archived report retains its old diagnostic status. Other fault branches remain CI-owned.
- **H-30 Skaduwee throw:** the updated receipt window now captures its first production completion. The branch passes at
  200 decisions / 4,001 ticks, with six fault injections, continued gathering/planning and a win
  (`tmp/ai-skirmish-matrix/760-package5-h30-skaduwee-receipt-window/1792969100377-diagnostic_passed.json`, 669,078 ms).
  Together with Tivara this closes the paired throw diagnostic subset, not the full H-30 fault family.
- **Latest H-32 pending-path result:** the event-history handoff issue is repaired and the route outage now creates a
  genuine pending query at tick 20. The same-realm transition still fails to settle it: the old scene becomes inactive
  with status 8, but Phaser shutdown/destroy listeners remain uncalled; a simulation-clock completion fallback also does
  not fire. Focused route-outage tests pass 9/9, but the native lifecycle requirement stays open. Artifact:
  `tmp/ai-skirmish-matrix/760-package5-h32-clock-disposal/1792968377392-failed.json` (68,771 ms, zero decisions by design;
  failure occurs during lifecycle teardown). Do not replay this branch until the teardown owner is understood.
- **H-15 Skaduwee lethal:** the shared owner-navigation fix now captures every decision's tactical boundary and the exact
  lethal/withdrawal diagnostic passes at 120 decisions / 2,401 ticks. Result: five workers, one army unit, 1,556 damage
  and seven enemy losses. Paired with Tivara lethal only; other H-15 branches remain open. Artifact:
  `tmp/ai-skirmish-matrix/760-package5-h15-owner-navigation/1792974044197-diagnostic_passed.json`.
- **H-14 Skaduwee harmless:** a changed-source diagnostic now passes the exact physical-economy/scouting/paid-output
  predicate at 150 decisions / 3,001 ticks. The selected frontier scout retained its native route, physically reached
  the original destination, and exposed new geography; recovery income and a paid military output also passed. The fix
  leaves native search moves to Stage 9 across changing frontier questions, normalizes the `effect:` prefix when matching
  accepted intents to movement evidence, and raises bounded movement/caller history limits to fit this measured capture.
  Focused gameplay scout regression passed 5/5, scouting evidence passed 2/2, and movement/scouting/route-order/caller
  evidence suites passed 76/76. Artifact:
  `tmp/ai-skirmish-matrix/760-package5-h14-route-bound-fix/1792997406812-diagnostic_passed.json`. This is one branch,
  not H-14 family closure; the selected native obligation count remains 0/22.
- **H-11 Tivara one-worker recheck:** the changed source still gets `no_path` from builder `(33,21)` to legal outside
  endpoint `(31,22)` beside its Granary at tick 20; no construction or income follows. It reaches 200 decisions / 4,001
  ticks, but the sole scenario failure is `native_capture_channel_lost`, so it is not closure evidence. Artifact:
  `tmp/ai-skirmish-matrix/760-package4-h11-current-navigation/1792971090725-diagnostic_failed.json`. Park until route
  connectivity and capture-channel causes change.
- **PLACE-03 Tivara concurrent:** the 150-decision changed-source run found its first Granary footprint covers the
  worker-service clearance route's first tile, then subsequent prefixes inherit the blocked route; worker/army physical
  transit also remains incomplete. The observation showed nearby owned workers, while placement only protected exact
  order endpoints and connected map cells. A one-tile maneuvering clearance ring around other owned gather/build workers
  is now enforced. Focused placement access specs pass 8/8. Artifact:
  `tmp/ai-skirmish-matrix/760-package4-place03-current-endpoint-protection/1792971915347-diagnostic_failed.json`.
- **PLACE-03 owner-navigation replay:** the scene lookup cause is fixed and tactical boundaries now exist for all 150/150
  decisions. The native run still fails route clearance on later prefixes and both protected physical transits; outcome
  workers 17, army 5, four enemy losses. Focused visibility/capture specs pass 8/8. Artifact:
  `tmp/ai-skirmish-matrix/760-package4-place03-owner-navigation/1792973519220-diagnostic_failed.json`.
- **Next local owner:** continue with the next dependency-ready open Package 5 family (H-06/H-07 or H-10), using existing
  artifacts to avoid unchanged replays. H-14 needs its remaining branches; one passing branch does not close it. Revisit
  PLACE-03/H-11/H-31/H-32 when a changed hypothesis can answer their specific open question. Package 5 and peer obligations
  remain open; CI owns routine rows.

- The user authorized continuing through the remaining Skirmish AI checks without stopping at each passing gate. Do not commit,
  push, open/update a PR or merge. CI already owns routine registered runtime rows; use local native runs only for targeted
  evidence after a relevant source/fixture change. Keep one browser process at a time and do not replay unchanged failures.
- Latest: H-32 normal and paid-queue lifecycle samples pass for both Tivara and Skaduwee, with clean same-realm next-match
  ownership and late-work fencing. Pending-path still stops at zero ticks with `runtime_preset_events_incomplete` after its
  event-history handoff fix; its route outage is not observed. H-32 host replacement remains real-peer CI work.
  H-30 Skaduwee throw reached 120 decisions / 2,401 ticks and showed six injections, continued native income, and resumed
  planning, but generated no held production receipt; its only failed predicate is original-receipt reconciliation. The
  fixture needs a real producer/receipt premise before another replay. H-15 Skaduwee lethal reached 120 decisions / 2,401
  ticks but ended with no workers (`worker_bootstrap`); record as a survivability failure, not an emergency-proof pass.
  Diagnosis found the player-visible threat was outside each defender's native vision. The AI now carries each owned unit's
  native visible enemy IDs and uses them before issuing attacks. Focused defense/tactics tests pass (31/31), Phaser
  projection passes (3/3), and gameplay and Phaser spec typechecks pass. The changed-source H-15 replay had zero
  `hidden_target` rejections and retained two workers (previously zero), but military fell 11→1 and it still lost at tick
  2,401. The only scenario predicate is `native_decision_or_mission_boundary_missing`: tactical boundary capture is absent
  for 118/120 decisions after tick 40, so this cannot close H-15. Identify the capture exception and continue other P5
  owners before replay. Its far control initially
  failed the distant-strength predicate; the synchronized hold fixture now passes that scenario predicate.
  H-15 Skaduwee resolved passes the corrected native delayed-receipt/withdrawal predicates at 120 decisions / 2,401 ticks;
  lethal remains open. Its far replay with synchronized hold controls passed the distant-threat predicate; the only old
  evaluator failure was an unrelated receipt requirement, now scoped away for the far control. Fixture contracts pass 23/23,
  owner-binding checks 12/12, and Portal E2E TypeScript passes.
  H-14 Skaduwee harmless reached 150 decisions / 3,001 ticks but failed the physical-economy/scouting/paid-output predicate;
  Tivara harmless had passed the exact threat/service/decay checks. Keep the Skaduwee useful-work gap open.
  H-13 Skaduwee many-bases reached 150 decisions / 3,001 ticks but lacked the native original-cash/ownership premise for
  waiting-exposure evaluation; Tivara's exact branch passed.
  H-12 Skaduwee scarce then failed its foreign-bank observation/stability predicate after 150 decisions / 3,001 ticks;
  the paired fixture/evidence premise needs repair before replay.
  H-10 Skaduwee resumed-capacity passed at 150 decisions / 3,001 ticks, pairing Tivara's earlier pass; this is one branch,
  not full H-10 closure. Next: continue other dependency-ready P5 owners; keep H-15 open until its tactical-boundary
  capture issue and remaining survivability cause have changed.
  H-31 Tivara `before_apply` stopped because the native commit checkpoint was missing; `applied_pending` was blocked at Nx
  startup, and `during_active` timed out waiting for UI state before any decisions/ticks. Park these unchanged boundaries
  locally and continue with independent checks; H-32 host replacement and remaining save/peer branches stay CI-owned.
- **Latest focused follow-up:** H-14 Skaduwee search-order capture (`tmp/ai-skirmish-matrix/760-package5-h14-skaduwee-harmless-search-order/1792961263429-diagnostic_failed.json`)
  records actor-attributed movement from `(31,26)` toward `(3,3)` to `(9,3)` and previously hidden search points becoming
  visible. The oracle still requires exact arrival at the original waypoint; do not weaken the shared predicate without
  proving the selected scout caused the discovery. H-31 `before_apply` now saves before the first decision and reaches
  20 decisions / 401 ticks after omitting the unavailable tick-19 observation/catalog checkpoint. Its corrected-source
  diagnostic (`tmp/ai-skirmish-matrix/760-package5-h31-tivara-before-apply-undefined-state-fix/1792962106190-diagnostic_failed.json`)
  still fails world parity after load and continuation, full decision-tail parity, and native capture-gap requirements.
  The state digest had rejected an explicitly undefined optional base `expansion`; the base manager now omits that field.
  Keep H-31 open and advance to a different owner. Next local owner: repair H-30 Skaduwee's receipt window, which currently
  ends at tick 600 although its first production queue begins at tick 1260 and completes at 1459. Then rerun only that
  changed branch and continue; selected native obligations remain 0/22.
- **Package 5 is active.** H-06–15/H-30–32 linked pure contracts pass (13 scenarios, 37 suites, 219 assertions;
  `tmp/ai-skirmish-matrix/760-package5-pure-owner-update/1792917048672-passed.json`). H-06/H-07 corrected captures
  exposed fixture/evaluator gaps; H-08 timeout captures exposed broad resource-coverage failures, cancellation setup
  without an original applied receipt, and four peer branches requiring CI Supabase credentials. Keep H-08/H-09 peer
  proof on credentialed CI. Chunked capture storage and 8 GB CI heap address the prior report-sealing limits.
  H-10 had two evaluator defects plus repeated Gather while a delayed receipt was unresolved. Generic command-linked
  reservation retention now covers actor/effect claim bundles. Focused Playwright owner tests pass 10/10, gameplay
  reservation/planner tests pass 3 suites / 6 tests, gameplay spec and Portal E2E TypeScript checks pass. The H-11–15
  pure batch passes (`tmp/ai-skirmish-matrix/760-package5-reservations-pure-after-h10-fix/1792933874048-passed.json`).
  Changed-source H-10 Tivara resumed-capacity diagnostic passes (150 decisions / 3,001 ticks, one browser, 556,841 ms;
  `tmp/ai-skirmish-matrix/760-package5-h10-reservation-fix/1792934322497-diagnostic_passed.json`). This is a single
  variant, not H-10 closure. H-11's first Tivara one-worker capture sealed after 200 decisions / 4,001 ticks in 226,586
  ms, but failed the broad capture-history guard. Its raw native path records found the real blocker: fixed construction
  radius 1 returned `no_path` four times from the builder at `(33,21)` to its Granary at `(33,23)`, whose 3x3 footprint
  blocked the entire allowed arrival radius. Construction approach range now derives from the site's occupied footprint.
  The next capture confirmed radius 2 was active, but endpoint selection chose `(33,22)` inside the Granary because
  navigation can report target-footprint tiles navigable. The selector now excludes target-footprint coordinates; its
  focused spec passes 6/6. The third capture selected a legal outside tile `(31,22)` but its native path query had no
  route; broad resource history also remains incomplete. The path routine now tries all legal endpoints in deterministic
  distance order. The latest H-11 diagnostic still finds only one legal endpoint; its native route fails, construction and
  food delivery remain zero, and broad resource coverage remains incomplete
  (`tmp/ai-skirmish-matrix/760-package5-h11-reachable-endpoint-fallback/1792945791852-diagnostic_failed.json`; 200 decisions /
  4,001 ticks, 221,868 ms). Keep H-11
  open; do not replay until the cause of the single legal endpoint and the required resource-history gaps are addressed.
  Phaser/movement/command checks previously passed 3 suites / 19 tests; selector spec passes 6/6 and Phaser spec TypeScript
  passes. H-12 Tivara-scarce native capture reached 150 decisions / 3,001 ticks (421,786 ms) and completed its Field;
  its only failure was the broad resource-coverage guard. The exact bundle evaluator passed its checks for definition costs,
  atomic admission, physical payment/delivery, actual proposer order and foreign-bank stability. H-12 now relies on these
  exact proofs instead of broad unrelated history; its context guard spec passes. This is one checked branch, not H-12
  closure. H-13 Tivara many-bases also reached 150 decisions / 3,001 ticks (556,893 ms); its only failure was broad resource
  history, while the exact evaluator passed multi-base waiting exposure, optional spending and physical outcomes
  (`tmp/ai-skirmish-matrix/760-package5-h13-tivara-many-bases/1792947006926-diagnostic_failed.json`). H-13 now relies on
   those exact predicates and has a focused context guard. This is one checked branch, not H-13 closure. H-14 Tivara
   harmless-noise reached 150 decisions / 3,001 ticks (465,648 ms); its only failure was broad resource history, while the
   exact evaluator passed its harmless-threat, native-service and emergency-decay checks
   (`tmp/ai-skirmish-matrix/760-package5-h14-tivara-harmless/1792947552643-diagnostic_failed.json`). H-14 now also uses its
   exact predicates without unrelated broad history, and the context guard tests cover H-12–14. This is one branch, not
   H-14 family closure. H-15 Tivara lethal reached 120 decisions / 2,401 ticks (396,686 ms), with 119 emergency decisions,
   583 hostile-damage facts and three held receipts; its only failure was broad resource history, while exact lethal-defense,
   fresh-generation and delayed-receipt checks passed (`tmp/ai-skirmish-matrix/760-package5-h15-tivara-lethal/1792948040709-
   diagnostic_failed.json`). H-15 now uses its exact damage/defense/receipt evidence and is covered by a focused context
    guard test. This is one branch, not H-15 closure. H-14 Tivara scarcity reached 150 decisions / 3,001 ticks
    (465,860 ms) but failed two real predicates: no explicit resource blocker and no combined physical-economy/scouting
    output (`tmp/ai-skirmish-matrix/760-package5-h14-tivara-scarcity/1792948619979-diagnostic_failed.json`). Native facts
    show the zero-start budget still enabled wood harvesting and paid work, but no mission resource blocker; the scarcity
    branch should require physical income and an explicit blocker without requiring discretionary scouting. The evaluator
    now separates that branch; the missing blocked-demand premise remains an open fixture issue. Do not repeat until the
    fixture supplies an active resource-blocked demand. H-15 Tivara resolved reached 120 decisions / 2,401 ticks
    (446,261 ms); emergency cleared after the scheduled withdrawal, but the evaluator incorrectly required the completed
    producer command to remain pending past receipt release. Native execution completed it at tick 319; release came at
    tick 801, after pending ownership correctly drained. The evaluator now requires pending while held, a native terminal
    outcome, and release of the same receipt. The synthetic regression and 11-test owner-binding suite pass; Portal E2E
    TypeScript passes. No runtime replay was needed for this evaluator-only correction; CI owns the updated full matrix.
    H-15 Tivara far passed with no false emergency
    (`tmp/ai-skirmish-matrix/760-package5-h15-tivara-far/1792949928016-diagnostic_passed.json`, 120 decisions / 2,401
    ticks, 562,827 ms), despite broad resource-history loss. Three Tivara H-15 branches now have targeted evidence;
    Skaduwee counterparts remain CI-owned. H-14's active blocked-demand premise and H-11's single unreachable legal endpoint
    remain open. H-30 Tivara throw reached 120 decisions / 2,401 ticks (361,487 ms) with six native `brain_fault` events;
    its only failure was broad resource history, while exact fault injection, resumed planning, gathering and original-receipt
    reconciliation passed (`tmp/ai-skirmish-matrix/760-package5-h30-tivara-throw/1792950409961-diagnostic_failed.json`).
    H-30 now relies on those exact checks and has a context guard test. H-32 Tivara normal and paid-queue lifecycle
    diagnostics passed: each retained one owner per player, disposed the first scene, fenced late work, and advanced a
    distinct next match in the same realm. Artifacts:
    `tmp/ai-skirmish-matrix/760-package5-h32-tivara-normal/1792950997858-diagnostic_passed.json` and
    `tmp/ai-skirmish-matrix/760-package5-h32-tivara-paid-queue/1792950738940-diagnostic_passed.json`. These are two
    branches, not H-32 closure. Pending-path hit an event-history overwrite at first; the runner now preserves the original
    match's preset-event record across the UI transition, and Portal E2E typing passes. The changed-source replay stopped
    before Playwright due Nx recursive webserver startup, with zero simulated ticks. Host replacement needs authenticated
    peers and remains CI-owned. Next local branch: H-31 single-player save continuation; return once to pending-path after
    clean startup. H-11/H-14 remain parked until their missing endpoint/blocked-demand premises change.
- **Package 4 native check:** focused placement access tests pass 4/4. A changed-fixture PLACE-03 Tivara concurrent run
  completed 150 decisions / 3,001 ticks (767,760 ms; source `f083fddbc483`, dirty `fnv1a32:86af2577`, fixture
  `fnv1a32:a080c4f7`) but failed clearance from its first applied prefixes and worker/army physical arrival. H-27's earlier
  capture showed a legal Olival covering the protected worker-service route origin at `(32,23)`. The selector gets no
  `protectedRoutes` from runtime presets; those are test-side oracles, so this is both a real site-safety failure and a
  missing fair movement-endpoint contract. Do not replay either capture unchanged. Next: derive route endpoints from
  observable owned movement/service facts or revise the oracle to measure those facts, then repair the shared placement
  owner and physical transit.
- **Two-faction victory and adaptive observation are complete:** current SEQ-01 run passes both faction orientations at the
  18,000-tick horizon. The adaptive home observation starts at 12 tiles, guarantees at least eight legal sites for the largest
  buildable footprint, and grows by four to a 24-tile cap. Do not repeat this unchanged full match locally.
- **Package 3 progress:** STRAT-01 paired pressure passes six repetitions. STRAT-02 native capture remains blocked by throughput /
  timeout (pure 7/7); STRAT-03 pure passes 30 tests / 7 suites but its native attempt timed out before sealing decisions. DOMAIN-01's
  corrected irrelevant control passes for both catalogs: Tivara
  `tmp/ai-skirmish-matrix/759-domain01-tivara-irrelevant-corrected/1792911974491-diagnostic_passed.json` and Skaduwee
  `tmp/ai-skirmish-matrix/759-domain01-skaduwee-irrelevant-corrected/1792912278394-diagnostic_passed.json` (100 decisions / 2,001 ticks
  each; source `fnv1a32:55d9103b`, fixture `fnv1a32:52d1c5db`). The RAID-03 Tivara air-raid capture then stalled: its
  worker stayed alive for about 75 minutes with under eight minutes CPU and no sealed result file. It was interrupted as
  infrastructure-only. RAID-03's pure contract now passes in the combat audit below; the unchanged native capture is not being
  replayed.
- DOMAIN-02's pure selection passes; its coast run pays and completes a VikingBoat but no compatible objective hit occurs. The boat
  no longer goes to ground reserve; native moves to water positions `(36,42)` / `(36,46)` fail while `(27,19)` is reachable. Keep
  the route issue open and do not replay until path/position selection changes.
- DOMAIN-05 pure positive/suppression controls pass (focused adaptation 10/10). Four native anti-air/no-value controls pass. A changed
  Tivara backline run now pays and completes a TivaraAlchemist, but records no native damage to the required target; the home-reserve
  order remains unexpected. Keep both positive faction branches open and do not replay until the air assignment/effect cause changes.
- **Scouting remains open:** SCOUT-02's scheduling-only capture passed the trip predicate but revealed a duplicated Stage-9/Stage-13
  command at tick 520. Strategic Stage-9 actor claims removed SCOUT-03's duplicate-command failure. SCOUT-02 and SCOUT-03 still fail
  the physical information-trip predicate after the claim change; SCOUT-01/04 also remain open. Do not replay these branches unchanged.
  Batch the scout dispatch/mission-persistence cause across them after isolating it.
- Focused route tests pass 5/5; focused adaptation tests 10/10; manager/offense/tactics tests 25/25; gameplay TSC passes. A mistaken
  Nx file-filter invocation ran the full gameplay suite: 524/526 passed, with failures in the one-worker renewable-food expectation
  and the two-member stale-objective scout expectation. These are recorded in HANDOFF; the intended route spec passed under direct Jest.
  The selected native-obligation count remains **0/22**; registration or partial intent evidence does not close an obligation.

### Latest Package 3 audit — 2026-10-25

- The linked pure audit passes: `tmp/ai-skirmish-matrix/760-package3-combat-pure-linked/1792914563012-passed.json`.
  Eight rows / 36 suites / 214 tests, zero missing IDs. Seven rows have partial owner-contract bindings; this does not
  assert native acceptance. C-01/02/04/06 retain explicit unfinished phase-transition, opportunity-window,
  decision-consequence or multi-opponent native branches.
- Wider package-3 pure recheck passes current source: `tmp/ai-skirmish-matrix/760-package3-pure-wide/1792914665791-passed.json`;
  39 scenarios / 48 suites / 280 assertions, zero missing IDs. Twenty-four rows have partial owner-contract coverage.
- The audit exposed a scheduling conflict: a question scout could consume a unit needed to finish an actionable visible
  core, leaving the force one unit short. A visible core now defers a new frontier scout. Focused manager/opportunity/
  boundary specs pass 25/25; gameplay TypeScript checking passes.
- FIGHT-01 `fight-01-tivara-reinforced` ran alone, then was stopped manually after about 13 minutes without an artifact.
  The prior configured Playwright minimum was 20 minutes, so this was not a runner timeout or gameplay verdict. Runtime
  timeout now has a 10-minute floor plus 10 minutes per serial variant and 3 minutes startup/sealing; four arithmetic
  regression tests pass. Do not replay the unchanged branch.
- SCOUT-02/03 still lack physical information trips after their prior actor-claim changes; those artifacts are not being
  replayed unchanged. DOMAIN-02 naval route, DOMAIN-05 air effect, and RAID-03 capture stall remain open.

## Package 3 historical debugging log — current cursor is above

- Windows pure-runner quoting was fixed by launching `node_modules/jest/bin/jest.js` directly through Node. An exploratory
  42-case selection passed 47 suites/259 tests, but properly failed evidence closure for seven cases with native
  recipes and no bound pure assertion (STRAT-09, DOMAIN-02/05, C-01/02/04/06). The scoped 35-case pure-contract batch
  then passed all 35 selected cases: 47 suites, 259 assertions, zero missing scenario bindings. Artifact:
  `tmp/ai-skirmish-matrix/759-package3-pure-contracts/1792850156005-passed.json`. This is pure-contract coverage only;
  newly selected native obligations remain 0/22 closed.

- CI shard selector repair accepts H-21's positive issue #759 deferral; focused Node controls pass. Dynamic selector
  resolves 103 runtime shards while preserving five explicit content deferrals. Windows `pnpm.cmd` harness controls
  pass (2/2).
- SEQ-01 Skaduwee source-base run failed: `1792831930713-diagnostic_failed.json`, 600 decisions/12,000 ticks,
  2812 damage, eight enemy losses, no authoritative victory. The AI changed objectives early and ended on a damaged
  FrostForge target. This is a gameplay failure, not infrastructure.
- Repair: visible enemy building identity was omitted by the Phaser observation projector although owned building
  identity was present. Project visible/owned main-building identity; retain fog-of-war for `last_seen`. Focused
  projector spec passes 2/2. This changes the Skaduwee attack assessment to `finish` against FrostForge.
- Corrected-source SEQ-01 still fails at 12,000 ticks: 600 decisions, 4702 damage, 12 enemy losses, 32 produced,
  income/min 401. FrostForge is the `finish` target. Bounded report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-visible-core-v2/1792832588729-diagnostic_failed.json`.
- Added actor ID, owner and known main-building status to bounded checkpoint facts. Trace v3 shows enemy FrostForge
  and Sandhold both have main-building role while visible; both turn into role-less `last_seen` contacts by tick 12000,
  when the AI selects Owlery. The run fails victory with 4129 damage and 13 enemy losses. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-objective-trace-v3/1792832974387-diagnostic_failed.json`.
- Contact memory now retains the last observed main-building role with the old position/tick only. No hidden health,
  queue, or live actor handle is persisted. Projector+memory focused specs pass 9/9; Phaser and portal E2E type checks
  pass. The v4 rerun still fails at tick 12,000: 4702 damage, 12 enemy losses. Remembered Sandhold core remains
  available, but attack squads target Stairs at 94% health; no transport plan exists. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-memory-core-v4/1792833360982-diagnostic_failed.json`. Next capture
  strategy alternatives. Trace v5 shows Sandhold is absent from target candidates because last-seen actors lack an
  access-node ID. The selector rejects the core before routing; report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-alternatives-v5/1792833712136-diagnostic_failed.json`.
- Repair: for a last-seen contact, derive the nearest known current-graph access region from its remembered position,
  then use the normal route scorer. Tactics scout/approach without attacking through fog. Focused offense controls
  pass 8/8; gameplay and E2E type checks pass. SEQ-01 Skaduwee run v6 still fails at tick 12,000 (1813 damage,
  eight enemy losses).
  Sandhold now appears in alternatives at score 400; FrostForge at 746. The strategic target remains PirateScimitar
  while its active attack squad is retreating. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-remembered-route-v6/1792834146796-diagnostic_failed.json`.
- Retreat/recovery attack states now release strategic objective hysteresis. Regression and offensive-opportunity
  specs pass 9/9, gameplay typecheck passes. Route-aware approach selection adds ground region IDs to visible tactical
  cells and filters cells with no known graph route from each member. Disconnected-region regression passes;
  observation specs pass 10/10; gameplay, Phaser, and portal E2E typechecks pass.
- v9 still misses authoritative victory at 12,000 ticks: 3,631 damage, four buildings destroyed, four enemy unit
  kills, 33 units produced, and 42 application failures (87 in v7). Two attackers remain at `(43,4)` and `(43,17)`,
  assigned cells near `(34,14)` and `(35,16)`; the graph permits those routes, but native movement fails. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-route-aware-approach-v9/1792835445820-diagnostic_failed.json`.
  Next trace graph-to-native path disagreement. Lower failure counts do not close the victory outcome.
- v10 records ground height links as directional. The one-way ramp graph regression and approach/selection tests pass
  19/19, but native results match v7: 4,450 damage, five buildings destroyed, six enemy unit kills, 87 application
  failures, and no victory. Directionality alone is not the blocker. Adapter review found same-height fallback links
  are admitted on diagonals without a corresponding native height-graph edge. Add a blocked-corner regression, then
  rerun the unchanged victory fixture:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-directed-ground-routes-v10/1792835947673-diagnostic_failed.json`.
- v11 prevents equal-height diagonal fallback links without native height-graph edges; adapter regression passes 3/3
  and gameplay/Phaser typechecks pass. Native result still matches v7 at 12,000 ticks: 4,444 damage, five buildings
  destroyed, six enemy unit kills, 87 application failures, no victory. Directionality and diagonal filtering alone
  are not the blocker. Capture native move completion phase and candidate-cell route evidence before another
  pathfinding change. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-no-corner-cut-routes-v11/1792836383163-diagnostic_failed.json`.
- v14/v18 native movement diagnostics showed tactical Move orders being replaced during active movement and a unit
  stranded at `(43,4)`, which the native height graph marks nonnavigable. Tactical projection now preserves an active
  Move across an order-signature change when its prior assignment/anchor is within four tiles of the new target. The
  regression plus manager/liveness tests pass 16/16; gameplay typecheck passes and changed-file ESLint has no errors
  (two existing non-null warnings). v19 ran without movement capture to reduce memory: 12,000 ticks/600 decisions,
  5,963 damage, 10 buildings destroyed, eight enemy kills, 15 own unit losses and 36 application failures, with 99
  cancellations. It still lacks authoritative victory. At the final checkpoint the attack squad is engaging visible
  AnkGuard; several other enemy structures and units are last-seen, and no enemy main-building role is currently
  visible. Treat this as a new scouting/target-priority question, not proof that all cores were removed. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-order-hysteresis-v19/1792853568451-diagnostic_failed.json`; runtime data:
  `tmp/ai-skirmish-runtime-results/run-nBq2RN/runtime.json`. The run completed in 229s at about 2.0 GB peak worker
  working set with `--max-old-space-size=8192`; no recorder was enabled.
- v20 preserved the original assignment baseline as the active Move continued. This was too sticky: the same 12,000
  tick fixture ended with only 3 buildings destroyed, six enemy kills, 13 own losses, 45 application failures and 79
  cancellations; Sandhold remained visible at 92.8% health. The last objective switched to Sandhold, so the run did
  not meet the victory oracle. Report `tmp/ai-skirmish-matrix/759-seq01-skaduwee-stable-move-target-v20/1792853989607-diagnostic_failed.json`;
  runtime artifact is `tmp/ai-skirmish-runtime-results/run-eKo0XF/runtime.json`. The guard is now narrowed to cases
  where the strategic target ID stays unchanged, and the latest assignment becomes the next comparison point. The
  v21 result below shows this heuristic is still insufficient.
- v21's narrowed four-tile guard still failed victory: 3,880 damage, four buildings destroyed, five kills, 11 own
  losses, 65 application failures and 49 cancellations. Both enemy core roles remain last-seen at the deadline. This
  rejects distance-only suppression as a sufficient fix. The Phaser projector now includes the native tile destination
  on owned active/pending orders; tactical projection suppresses a replacement only when that exact active Move target
  matches the newly assigned target. Contract/projector and tactics regressions pass, focused gameplay/Phaser
  typechecks pass; v22 showed this one-tile threshold was too strict.
- v22 used exact active Move target matching within one tile, but still failed: 4,322 damage, four buildings, seven
  kills, 18 own losses, 33 application failures and 107 cancellations; Sandhold remained last-seen. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-exact-active-move-target-v22/1792854726293-diagnostic_failed.json`.
  The threshold was too strict for small tactical-anchor shifts. v23 now tolerates a four-tile Manhattan difference
  from the native order's fixed endpoint (which prevents cumulative drift) and reissues at five tiles; boundary
  regression tests pass 17/17 and gameplay/Phaser typechecks pass. v23 still missed victory at 12,000 ticks, with
  6,104 damage, nine buildings destroyed, ten kills, 14 own losses, 101 Move application failures and 23 cancellations.
  The last checkpoint shows the attack squad repeatedly receiving `Move - Movement Failed` every 20 ticks for
  `sim-ef33c9b4` and `sim-b755739d`; a separate reserve actor also fails. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-fixed-endpoint-hysteresis-v23/1792855057317-diagnostic_failed.json`.
  Despite reduced cancellation count, repeated native movement failures are the immediate blocker. v24 bounded capture
  confirms the first actor reaches `(45,6)` around tick 3306 and the second is at `(39,16)` by tick 4143; both source
  tiles are nonnavigable and all later native routes fail from them. The trace shows repeated movement invocations
  under stable destinations, but query capture began at tick 9000 after stranding. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-movement-failure-v24/1792855406369-diagnostic_failed.json`. v25 capped
  tick-zero path queries for the two stuck actors. `sim-ef33c9b4` has a valid route from `(45,7)` to `(44,3)` whose
  next cell is `(46,6)`, yet movement is canceled while the diagonal tween is between cells and the actor is left at
  nonnavigable `(45,6)`. The route graph is not creating that tile; cancellation preserves an intermediate position.
  Report `tmp/ai-skirmish-matrix/759-seq01-skaduwee-early-native-paths-v25/1792855870588-diagnostic_failed.json`.
- v26 changed tile-step cancellation to snap to the nearer validated endpoint. This removed captured nonnavigable
  query sources but regressed the battle to 329 damage, zero enemy kills by the deadline, 14 unit losses, and seven
  building losses. Report `tmp/ai-skirmish-matrix/759-seq01-skaduwee-cancel-tile-snap-v26/1792856443212-diagnostic_failed.json`.
- v27 changed cancellation to complete the validated next tile and coalesced concurrent same-order movement calls.
  Focused movement tests pass 20/20 and the Phaser spec typecheck passes. The 12,000-tick result improved over v26
  (1,596 damage, one building destroyed, six kills) but failed victory with 25 unit losses and three buildings lost.
  The capture shows no nonnavigable movement-query sources and no six-tick same-order restart loop; instead, the
  attack squad alternates every 20 ticks between tactical `position` and `protected_retreat` move orders, generally
  toward `(25,7)` and `(42,5)`. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-single-order-movement-v27/1792856838620-diagnostic_failed.json`.
- v28's retreat hold did not change the result; v29 improved to 3,039 damage, three buildings destroyed, five kills,
  13 own losses, and two buildings lost, but still missed victory. v30 expanded capture to five actors and regressed
  to 1,230 damage. v31 made interrupted tile movement snap to the validated endpoint and reject rather than report
  success; captured actors no longer queried from nonnavigable sources. v31 still failed at 12,000 ticks (1,850
  damage, one building, three kills, 15 losses, two buildings lost), mostly with nonnavigable requested targets.
  Their reports remain in the corresponding `tmp/ai-skirmish-matrix/759-seq01-skaduwee-*-v28` through `*-v31`
  folders.
- v32 searches a deterministic Manhattan radius of two for reachable tiles only when a requested location is
  nonnavigable, and AI range treats the adjacent tile as arrival. Focused Phaser movement tests pass 40/40 and the
  spec typecheck passes. Native SEQ-01 Skaduwee still misses victory at 12,000 ticks: 4,343 damage, six enemy
  buildings destroyed, five kills, 12 own losses, and three buildings lost. Capture: 403 facts, 82 path queries,
  zero no-path queries from nonnavigable sources, and one blocked-target no-path followed by a reachable neighboring
  route. The attack squad still alternates between position and retreat orders. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-nearby-approach-v32/1792858834692-diagnostic_failed.json`;
  runtime data: `tmp/ai-skirmish-runtime-results/run-DroneH/runtime.json`.
- v33 raised the retreat-release bar but still alternated between retreat and position, and lost the minimum army
  count. At 12,000 ticks it had 3,354 damage, three enemy buildings destroyed, three kills, eight own unit losses,
  and two buildings lost. The same bounded capture had zero failed sources on nonnavigable tiles and one no-path to
  a nonnavigable target followed by a reachable approach. It completed under `--max-old-space-size=4096`; the sampled
  largest process stayed around 1.9 GB. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-retreat-hysteresis-v33/1792859280723-diagnostic_failed.json`;
  runtime data: `tmp/ai-skirmish-runtime-results/run-qYXgP7/runtime.json`.
- v34 carried retreat identity into `recover` and held the squad until contact looked favorable, but its native order
  trace still cycled between retreat and position from ticks 320–400. Results regressed to 1,852 damage, two enemy
  buildings, four kills, 13 own losses, and one building lost; minimum military count and victory both failed. Capture
  had 106 facts, 17 path queries, no failed query from a nonnavigable source, and one blocked-target no-path. It
  completed under the 4 GB Node ceiling in 199.5s. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-recover-lock-v34/1792859631039-diagnostic_failed.json`;
  runtime data: `tmp/ai-skirmish-runtime-results/run-ZUoxg3/runtime.json`.
- Current source also holds during an 80-tick local-contact commitment, preserves the no-enemy reconsideration exit,
  and permits the explicit one-count rapid-oscillation release rule. Focused combat/liveness/manager tests pass 39/39
  and gameplay spec typecheck passes. v35 is the next native check; v34 does not validate this refinement.
- v35 kept minimum military count (no minimum-army failure), trained 25 units, and delivered 3,913 damage, four enemy
  buildings destroyed, five kills, 12 own losses, and no victory. It still oscillated early, then stabilized mostly
  on position orders. The v35 order trace captured 113 `no_path` dynamic-blocker retries around tick 6451 from a
  cluster of 99–100 blockers; none originated from a nonnavigable source. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-retreat-commitment-v35/1792860009995-diagnostic_failed.json`;
  runtime data: `tmp/ai-skirmish-runtime-results/run-QfEFt6/runtime.json`.
- v36 adds a priority for visible directly reachable enemy main buildings even when the current force is below the
  local-threat threshold; a regression proves the core stays selected while force assembles. Focused offense/combat
  tests pass 32/32 and gameplay spec typecheck passes. In native SEQ-01 Skaduwee, strategy selected visible Sandhold
  (main building) over Owlery, and both attack squads were engaged near it. Still no victory: Sandhold remained at
  full health at tick 12,000; 3,017 damage, three buildings destroyed, six kills, 16 own losses, two buildings lost.
  Only 40 movement facts and seven path queries were captured because the prior focus actors were no longer the attack
  group. Report:
  `tmp/ai-skirmish-matrix/759-seq01-skaduwee-core-target-v36/1792860419829-diagnostic_failed.json`;
  runtime data: `tmp/ai-skirmish-runtime-results/run-hhlufD/runtime.json`.
- Next v37 capture should focus on the current attack members so position and attack orders can be followed through
  their repeated cancellations near the deadline. The 4 GB heap ceiling completed v35/v36; observed process use
  remains about 2.0–2.1 GB at peak, then drops after the run.
- Memory samples put the portal development server at about 2 GB both in the no-recorder v19 run and the recorded
  v32 run; the v32–v34 Playwright workers were about 0.2 GB and report/runtime JSON files about 0.6–1.1 MB each.
  This does not indicate recorder growth or Node heap exhaustion. The 8 GB ceiling is not preallocated memory; 4 GB
  also completes these native runs, so use it unless measured heap pressure requires more.
- A broad Phaser command started because Nx did not honor `--testPathPattern`; it was stopped after unrelated
  failures in queue continuation and drain-credit tests. The focused projector test passed with Jest
  `--runTestsByPath`. No package closure is claimed yet.
- Overall newly selected native obligations remain 0/22 until source-specific runtime evidence closes them; 14 SP
  need usable native evidence, seven need real-peer evidence, and D-06's legacy comparison remains unsupported.
  For current state and next action, read [HANDOFF.md](HANDOFF.md).

## Five-item non-browser batch — checked (2026-10-22); CI status updated (2026-10-24)

User explicitly requested all five items in one batch. **5/5 checked (100%);0/5 remaining in this selected batch.**
Base83f835f90a72e6e1533bda32c2040fc2d0f5f040, branch feature/759-skirmish-ai, same authority-recovery worktree.
The containing commit owns these changes; verify local/remote equality at publication. Actual model/effort unknown.
No browser, game/server start, native recipe, calibration, soak or machinery removal ran. Playwright below executes
only assertion functions with no browser fixtures and no webServer configuration.

Requirement-to-evidence / Omission Audit:

1. **Typing/lint/pure checks — checked.** Fixed the intentionally partial runtime-result fixture's explicit unknown
   cast. All3 actual-source tsc projects pass. ESLint across82 code files from the previous checkpoint plus this batch:
   0 errors,24 warnings (nonnull/unused declarations retained). Node tools109/109. Selected pure matrix15/15 mappings,
   196 assertions/37 suites, artifact tmp/ai-skirmish-matrix/759-five-pure/1792697244139-passed.json,
   fixtureDigest fnv1a32:ccb3fc22. No native acceptance asserted by that matrix.
   Schema regression corrected the former582 count:580 presets plus6 D-06 and2 H-32 non-preset dispatch variants
   equals588 variants. All84 native bindings are referenced; the test pins every permitted non-preset ID.
2. **Resources/deposits — checked.** GathererTargetSelection.findClosestResourceDrain rechecks live carrier/cargo,
   same-scene readiness and current team after native path lookup. Regression covers destroyed/killed/captured
   deposit, lost carrier, changed cargo and an unchanged valid control. ResourceDrainComponent fences scene shutdown:
   a simulation wait waking on shutdown releases unload capacity but returns0, preserving the carrier's pile.
   Existing exact paid-handle cancellation, duplicate/reentrant purchase/refund, gather/return overlap and native
   destroyed-deposit Stop/source-slot/cargo controls pass. Existing per-tick PayOverTime pricing/refund policy was
   inspected and preserved; no new economy formula or balance change was inferred from absent match evidence.
3. **Construction recovery — checked.** BuilderComponent.getClosestConstructionSite uses the same live predicate
   before/after path lookup, rejecting cancelled/finished/full/captured/destroyed candidates while retaining valid
   jobs. Existing site worker release, reassignment, dead-worker cleanup, abandoned-site no-charge resume and cargo
   protection controls pass. The new native-adapter regression supplies controlled distances, not physical path proof.
4. **Attack/retreat/reinforcements — checked.** decideAiTacticalSquad now considers emergency retreat before the
   strategic launch hold, so assembling forces can withdraw while still forbidden from launching prematurely.
   New losing-assembly regression failed before the repair. Existing target eligibility/domain, commitment,
   reinforcement dispatch, retreat hysteresis/reinforcement release, readiness and bounded mission recovery pass.
   No launch threshold, combat balance or route-pending timeout was relaxed.
5. **Result readers — checked.** nativeDebugParityProofFailures validates all quota/history/shutdown counters as
   nonnegative safe integers, exact ownership booleans and matching quota. nativeSaveProofFailures requires positive
   integer trace counts, a nonempty equal trace digest and explicit overflow/difference state. New erasure,
   fractional/nonfinite/absent counter and empty-digest controls failed before and pass after. Required actor-role
   rejection still passes; no synthetic record counts as native proof.

Final affected results: Phaser124/124 across11 suites (including580-world schema check); gameplay82/82 across13 suites;
assertion-only readers6/6; Node109/109; matrix15/15 with196 assertions. Counts overlap across layers; do not add them
into a unique scenario or gameplay-pass total. Three final type-check logs empty; final diff whitespace check passes.

Exact commands (from repository root; all Jest runs single-worker):

```sh
node --test tools/ai/*.test.mjs
NX_DAEMON=false pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
NX_DAEMON=false pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.spec.json
NX_DAEMON=false pnpm exec tsc --noEmit -p libs/games/probable-waffle/gameplay/tsconfig.spec.json
NX_DAEMON=false pnpm exec jest --config libs/games/probable-waffle/phaser/jest.config.cts --runInBand \
  --testPathPatterns='(resource-drain-lifetime|gatherer-target-lifetime|builder-target-lifetime|builder-membership|construction-worker-membership|construction-site-component|shared-queue-resource|gatherer-resource-execution|pawn-resource-drain-loss|pawn-resource-order-lifetime|ai-runtime-registered-configs)\.spec\.ts$'
NX_DAEMON=false pnpm exec jest --config libs/games/probable-waffle/gameplay/jest.config.cts --runInBand \
  --testPathPatterns='(ai-tactics.*|ai-construction-recovery-proposal|ai-builder-delivery|ai-resource-cost-claims|ai-field-labor-return|ai-decision-cycle)\.spec\.ts$'
NX_DAEMON=false node tools/ai/run-skirmish-matrix.mjs \
  --scenarios D-02,D-03,D-04,D-05,H-05,H-08,H-09,H-20,H-23,H-31,H-32,DBG-01,DBG-03,DBG-04,DBG-05 \
  --mode pure --output tmp/ai-skirmish-matrix/759-five-pure
```

Lint invoked pnpm exec eslint with exact changed TS/JS/MJS paths since b2c9868bb plus the two new specs, via argument
array rather than shell interpolation; /tmp/759-five-lint.log. No unrelated files staged. Assertion-only reader runner:
create an ignored tmp/759-five/readers.config.ts exporting testDir equal to the absolute repository e2e directory,
workers1, reporter list, timeout30000 and testMatch for skirmish-ai-native-debug-parity.spec.ts,
skirmish-ai-native-save-evaluation.spec.ts and skirmish-ai-native-scenario-context.spec.ts; no use/browser/webServer.
Then pnpm exec playwright test --config tmp/759-five/readers.config.ts. These specs request no browser/page fixtures.
Local logs /tmp/759-five-{tools,final-phaser,gameplay,readers,pure,lint}.log and
/tmp/759-five-final-{e2e,phaser,gameplay}-types.log are ignored/not transferred.
Changed code provenance (sorted path/content-SHA256 manifest,14 files):
sha256:d6c20d635517842a327fcfffb895ba903ba0b8035ba0d0d31dc3a1a16c85968a.

**Separate Final Closure Audit:** the five requested non-browser items are implemented/reviewed with passing affected
controls; no unregistered new tests or weakened gameplay thresholds, and no new tooling subsystem. This closes the
selected audit/repair batch only. All22 retained native obligations remain unclosed (14 SP unproved,7 peer setup blocked,
1 D-06 expensive run deferred/legacy comparison unsupported). Native startup/path arrivals/income/victory still need
runtime CI evidence. The pull-request shard selector currently fails on H-21 because its deferred-issue allowlist
does not accept the manifest's issue759 user deferral; repair this before relying on the matrix. Context generator
issue_plan_count:759:6 remains an unrelated tool limit; doctor passed. Machinery review stays last overall. The former
other-PC D-03 startup probe is removed; see [CI-RESUME.md](CI-RESUME.md).

## Cross-PC checkpoint — scoped controls checked, native acceptance open (2026-10-22)

The user requested publication of unfinished work and no further browser runs on the thermally constrained PC.
This is a historical checkpoint. Current instructions start at [HANDOFF.md](HANDOFF.md), then [CI-RESUME.md](CI-RESUME.md). Implementation base:
b2c9868bba35818afd4ddad026121732cb6f668b; verify the commit containing this record and remote equality.
The older authoring-only record below is historical, superseded for the selected batch by explicit execution authority.

1. **Request transport — implemented/checked:** digest-bound, exclusive-create local requests capped8MiB replace
   oversized environment-variable payloads. Node tooling109/109 includes two transport controls. Raw proof is local;
   model summaries remain capped8192 bytes.
2. **Native config repairs — implemented/checked:**580/580 actual preset configs accepted by the browser schema.
   Empty route declarations removed, route endpoints normalized to2D, H-26 rally points to an owned front actor.
   Outcome requirements and the strict schema were not weakened. Six D-06 and two H-32 descriptors have no ordinary preset.
3. **Reader/test integration — implemented/partially checked:** repaired actual-source types, required-role guards,
   Playwright test registration and lifecycle test fixtures. Phaser90/90, gameplay60/60, UI9/9, reader groups13/13
   and16/16 passed. Three project type checks passed. Minor later fixture/import edits require final affected rechecks;
   complete changed-file lint has not been repeated after focused repair of its four errors.
4. **Pure mapping — checked:**15/15 selected mappings,196 assertions/37 suites. H-32 and DBG owner controls now
   bind real existing assertions; these are explicitly owner-contract proof, never native acceptance.
5. **Native outcomes — blocked/unproved:**0/22 selected obligations newly closed. Fourteen SP-capable rows have
   no usable gameplay evidence; seven real-peer rows are environment-blocked; D-06 expensive execution is deferred.
   Last D-03 attempt2160074ms,0 ticks/decisions, browserContext.close protocol error; no causal gameplay conclusion.
6. **Omission Audit:** registrations complete; no new IDs needed. Native behavioral proof, final affected rechecks,
   multiplayer environment and D-06 baseline compatibility remain explicit gaps, not silently passed requirements.
7. **Final Closure Audit:** publication is an unfinished checkpoint by user direction. No native acceptance or full
   stage closure claimed; no browser run remains active. No unrelated main-checkout edits, raw reports, local secrets,
   dependencies or ignored tmp artifacts belong in the commit. No machinery removal; that remains last overall.

The current CI runtime path and resume status are in [CI-RESUME.md](CI-RESUME.md).

## Continuous registration batch — authoring complete, all new bindings unrun (2026-10-22)

Publication base6fbae050665f0ef10a13b2b3596c047451205f68 plus task-owned D-06 source; verify containing commit/remote.
Same authority-recovery worktree/feature branch.
The user requested all23 remaining registrations together. All original23 are accounted:22 authored registrations plus human-deferred H-21.
Execution/acceptance remains open; registration authoring is complete. Actual model/effort unknown; no subagent or model switch.

Numbered acceptance map / Omission Audit for the current slice:

1. **Twenty-two full source registrations authored:** D-02/D-03/D-04/D-05/D-06, H-05/H-08/H-09/H-20/H-23/H-31/H-32,
   SEQ-03/04/06/07/08, DBG-01/03/04/05/06. Manifest, native bindings, fixtures and mandatory ID readers are connected.
   Factory84 bindings/588 variants; supported registration115/115 (100%),0/115 active unbound (0%). Pure111/111 unchanged.
   All new premises, timing, predicates and behavior remain unrun; no passing count or overall completion claimed.
2. **Difficulty:** all three policies/both factions receive real hidden-position/health/queue/contact controls,
   same paired match identity, exact permitted inputs/intents and actual profile/cadence checks. Easy starts with
   ordinary faction actors and its original200-resource bank, earns workers/production, then faces pressure and
   recovery. Pressure uses actual selected scheduler rejection alongside independently damaging emergency combat;
   domain partitions count as one voluntary mission. Missing pressure/confirmation is a failure, not a skip.
3. **Release/recovery:** user approved H-05 native cancellation/paid/uncertain plus pure saved-claim release;
   synchronous selection/dispatch cannot expose the originally requested intermediate world boundary. Terminal
   optional recovery releases forecasts as well as provisional leases. Saved stale lists cannot remove currently
   paid, dispatched or foreign-owned claims. Withheld-history work reconciles after the actual original release;
   no re-created command/effect identity is substituted. Native topology changes require real graph progress,
   original-actor arrival/income and actual pending-query scene shutdown.
4. **Island establishment added by explicit user direction:** ai-island-establishment.ts seeds the existing
   transport owner from permitted offshore resources after local exhaustion, with an affordable service building,
   a legal water route, an indispensable builder/protection and optional workers. The actual native H-23 preset
   has land enclosed by water and an initially owned CommonBoat in either faction; no claim that Skaduwee can
   recruit that carrier, and no public island map added. The AI authors boarding/travel/unload/build commands.
   Native assertions require actual cargo, original readiness/departure deadline, landing, paid useful deposit
   and source-specific income into that deposit. Required-builder delay must recover or cancel boundedly.
   Saved establishment purpose retains the actual definition-priced foothold budget. Admission protects that cash
   from unrelated purchases until the real service commitment takes over, without another charge/escrow or blocking
   survival spending. Cancellation, observed depletion and actual service ownership release the policy hold.
   Optional gathering can release a straggler at sufficient original readiness; death never lowers the original
   capacity denominator. Only reversible actor leases are released. Resource-service builders need a direct
   route when the admitted graph/source nodes are available, preventing another mainland builder being selected.
5. **Continuous sequences:** one physical world each retains original partial packs/queues, exact native losses,
   genuine cancellation/research refund, restored paid economy/production, repaired defense/passage and subsequent
   useful combat. Real cancel-research controls pin the original paid queue handle rather than its shifting index.
   Original ceilings stay fixed. Artificial grants, labels and accepted commands alone cannot satisfy outcomes.
6. **Debug:** actual pre-dispatch input/state/outcomes/catalog/profile feed the exact shared production brain factory
   for isolated decision replay and first-field comparison. What-if/comparison must leave original world/RNG and
   artifact unchanged. Hidden/shown/category-filter/export modes compare exact selected decisions and canonical
   native state under the same deterministic instance. Actual scene-owned incident quota uses a declared16KiB
   functional-control policy; ordinary policy remains64MiB. Cumulative session bytes include evicted episodes,
   so eviction cannot replenish quota or grow an unlimited episode set. History overflow and pending authority
   retention are checked separately; actual shutdown releases capture, subscriptions and the original pending route.
7. **Explicit deferral:** user2026-10-21 deferred H-21 larger-unit/formation native clearance until suitable content
   exists. Pure coverage remains. Manifest support/parser/catalog now distinguish this #759 deferral from the four
   #822 island rows. The H-23 island addition does not silently claim those broader content obligations completed.
8. **Last four bindings now authored:** SEQ-08, DBG-01/03 and D-06 have dedicated native paths described below.
   No generic command-count or partial-owner control substitutes for those obligations. All remain unrun.
9. **Execution deliberately deferred:** no recipe/test/lint/type/formatter/build/browser/server/doctor/context or
   dedicated validator ran. Source/diff review and fixture/catalog authoring only. New tests include erasure,
   identity drift, release authority, quota/eviction/disposal, original research identity and cargo-readiness controls.
   Runtime premises, source typing, compilation and all passing claims remain for the later authorized gate.
10. **H-32 native lifecycle registered:** eight worlds cover both factions and normal, pending-path, paid-queue,
    real host-replacement branches. Actual UI hitboxes enter the game menu; Leave and the skirmish lobby retain
    the browser realm. Original native queue handles, navigation promises and tick emitters survive in retained
    closures only long enough to try late delivery. A physical paid completion now rejects disposed producers,
    inactive actors and stopped scenes before touching navigation/spawning. The original early pending route
    is retained at20, before combat could invalidate the premise; no deadline is extended.
    The host branch uses actual authenticated clients, a relayed seed, an original applied AI command and native
    host promotion. The survivor starts the next match through ordinary UI; full canonical world/RNG must remain
    identical while original callbacks run. Owner counts, empty old tick subscriptions and new paid-decision
    progression are required. Shared matrix execution selects the actual multiplayer server/auth configuration;
    missing infrastructure cannot fall back to a single-player host flag. Other H-32 branches use native SP scenes.
    Native first-match histories and next-match proof remain separate. Per-page error collectors replace only their
    previous owned listeners. Save groundwork preserves saved identity/seed, skips preset reseeding on restore and
    drives the actual shortcut/encrypted repository/Load UI; continuous SEQ-08 chains still require binding.
11. **DBG-05 native import registered:** twelve worlds cover both factions and malformed JSON, oversized bytes/counts,
    schema mismatch, traversal, markup and ordinary-peer authorization. A real native selected boundary supplies
    source/map/catalog/profile provenance and a host-confidential runtime artifact through the original scene bridge.
    The localhost developer-only UI invokes the bounded decoder and renders text; it never applies imported state or
    claims replay. Native canonical world/RNG before/after the actual handler must match. A valid import control is
    required before each negative. A real two-client peer must be denied both import and the shared native capture
    entry point before any world inspection. Artifact bytes stay local; reports retain only digests and bounded results.
    Parser depth/node/array/byte limits precede recursive manifest inspection, and scene cleanup removes the UI/listener.
12. **Product-scope correction from user:** multiplayer does not have save/load. H-31 now explicitly covers SP native
    save/load; H-09/D-02/SEQ-08 use independent supported SP save/replay and real MP authority/reconnect legs. Durable
    specifications and drafts have been reconciled. Coordinated MP save/load is not planned and is not a missing feature
    blocking these registrations. No MP save/load implementation was added.
13. **H-31 SP continuation now registered:** eight faction/branch worlds use actual quicksave/encrypted storage/Load UI.
    Original continuation is sealed before rewind; separate saved/restored and uninterrupted/resumed boundaries compare
    full canonical world/sharedQueue/RNG, live brain, cadence, authority and exact selected-decision fingerprints.
    Actual original held-applied receipt, paid construction/training/research and aged retry debt are mandatory premises.
    Future external fixture inputs cannot vanish across restore. Native speed-change stepping uses the actual clock.
    Pure saved-lease controls preserve absolute expiry/retry debt and paid/uncertain ownership without inventing a native
    boundary inside synchronous selection/dispatch. New saves retain confirmed pending delivery sampling and sample age;
    legacy saves still reset unsafe net-income estimates. Full continuation omits measured telemetry only.
    Raw captures remain local, proof reports retain bounded digests/first difference. All controls remain unrun.
14. **D-02 configuration continuation now registered:**18 native variants cover all three lobby-selected policies and
    both factions. SP before-eligible/pending-application legs reuse real codec continuation and exact decision traces.
    Separate actual two-client socket disconnect/reconnect legs require a current original host checkpoint, then actual
    promotion with exactly one restored AI owner. Brain, cadence, blackboard, confirmed income and observation memory
    must survive, followed by the exact next eligible tick/sequence under the selected profile. Authority epoch changes
    intentionally; snapshot-backed transfer does not claim lossless abrupt failover without an available AI checkpoint.
    AiPlayerHandler now restores actual reconnect-owned AI state when creating the promoted controller. It previously
    discarded that available continuation. Optional undefined wire fields are normalized through JSON before native
    digesting, matching codec serialization without erasing defined gameplay fields. Negative source controls reject
    stale snapshots, fresh openings/cadence, profile fallback, duplicated owners and reset sequence. All remain unrun.
15. **H-08 late authority now registered:** eight faction/branch worlds require real shared application while its
    consumer receipt/history is held through1800. Unobserved application must retain ownership through its actual900-tick
    uncertainty deadline; actual release1801 and selected reconciliation after1820 cannot duplicate output or resurrect it.
    Cancellation at199 addresses the original native AI-backed queue item, records its real request identity, then requires
    native original cancellation plus exactly one lineage-priced, callback/balance-checked refund and no produced actor.
    Separate real two-client snapshot-backed host transitions retain original command/applied receipt and deliver both
    orders. Actual application count, epoch, processed watermark, next sequence and original identity must remain fenced.
    Physical effects and full gameplay continuation are compared separately from expected rejection-history entries;
    pending command state/age, brain/claims, cadence, blackboard, receipt income and observation memory are still required.
    Native detailed captures stay local. New oracles and negative controls remain authored/unrun; no MP save/load is added.
16. **H-09 retention now registered:** six faction/branch variants cross the actual2048-entry native detail limit with
    2049 ordinary human rally commands. Actual admission and successful completion witnesses fingerprint the original
    input stream; no sequence/dedup editing, fake command or generic bounded-map-size pass is allowed. The original paid
    AI envelope comes from its real dispatch receipt. Its detailed entry must be absent while exact unresolved execution
    remains active, then the actual sequence-watermark rejection must block old replay without authority/gameplay changes.
    SP codec coverage saves at199, restores the exact full world/queue/authority in the same realm and rejects the same
    retained original before resuming actual native decisions through201 without another charge or output. H-31 separately
    covers equivalent-input full-tail parity; original and restored segments are never concatenated. A separate actual
    two-client leg completes bounded64-command relayed batches on both peers and requires matching input fingerprints,
    native effects and independent stale rejections. No MP save/load. Shared reconnect setup is factored through
    prepareNativePeerCheckpoint; Load waits for real scene/AI readiness and supports ordinary score-screen/home UI.
    Full harness projection now includes food and all other balances; the legacy multiplayer digest is unchanged.
    New negative/source controls remain unrun. Full traces/IDs stay local; bounded fingerprints enter summaries.
17. **SEQ-08 continuous supported lifecycle now registered:** eight faction/branch variants retain genuine SP saves
    before first application, with a held original application or with progressing paid construction/training/research.
    The autonomous original continues through its actual terminal tick before rewind. Native codec replay must match
    every bounded selected decision, complete terminal world and independently read final result/income/production/damage.
    The real end-game dialog and score screen precede a same-realm second match; an early quit cannot satisfy finish.
    The independent MP leg uses actual reconnect/checkpoint/promotion, original old-command/receipt delivery, then continues
    that promoted scene to a native result. Original authority and scene work are delivered again after disposal and must
    not change the new native scene. Income, production, useful combat, original identity/profile and unique owners are
    mandatory. Loss/tie supports lifecycle coverage but does not close the separate both-faction victory gate. Shared
    driver hooks now keep their contexts alive for these continuations; ordinary callers retain their previous boundaries.
    All source controls remain authored/unrun, including the terminal-aware full-frame and ordinary end-dialog paths.

18. **DBG-01/03 native reproduction and workbench registered:** twelve grouped faction variants capture an aged
    native recovery incident, its real opaque codec record and a witnessed closed autonomous599–801 interval. The actual
    selected decision separately replays through the production brain factory. Physical replay initializes a distinct
    context through ordinary native gameplay/quicksave, transfers only the untouched original encoded record into that
    isolated repository, then uses ordinary codec Load. No synthetic actor/brain restoration substitutes for native state.
    Complete native world/queues/resources/controller and every selected fingerprint must reproduce. Range removal,
    missing decisions, truncation and source/map/config copies refuse exactness before replay; unrecorded human input
    and future scripted faults/events are unsupported, never silently omitted. Encrypted records/inputs remain local.
    Named bounded tick/decision/original paid-queue progress steps require actual settled boundaries and identical resumed
    state. Actual live two-client history/bookmark handlers must preserve full native projection/pause reasons synchronously
    and exchange later matching peer hashes; attached MP stepping rejects before advancement. Ctrl+click bookmarks and
    Alt+click returns to a retained snapshot; bounded16 metadata entries are released with the panel. Source review repaired
    an assumed queue-item ID to the actual native command-context ID and used the real pause-reason accessor. New oracles,
    negative controls and the fixture/catalog authoring are unrun; no physical reproduction or playtest pass is claimed.

19. **D-06 frozen calibration source registered:** dedicated matrix dispatch runs core first, then actual legal two-AI
    matches in detached candidate/baseline sources with their own lockfiles/builds.20 predeclared seed cells cover
    both maps/factions and five existing Normal openings, both sides and three policies. Up to80 reserved seeds
    extend uncertainty;5 separate holdout seeds never tune, and3 soaks require the full72000 native ticks each.
    Native results, banks, queue/strategy/recovery samples and exact policy identities feed seed-clustered paired
    comparisons with family-wise confidence. Incomplete/fairness/short-terminal cases cannot silently pass.
    A narrow pinned-source adapter exposes native legal starts/clock/hash/results; no candidate AI code is copied.
    **Pinned legacy difficulty/opening policies are absent: comparison unsupported, acceptance remains failed/open.**
    Reports retain exact source/spec/fixture/adapter identities and actual completed denominators. Match bodies cap
    128KiB locally; model-facing summaries cap8192 UTF-8 bytes. The six catalog descriptors are dispatch groups.
20. **Source repairs and authored negative controls:** D-02 checks now use actual saved string profile identities.
    Config rejects privilege fields, saves/presets and invalid roles/policies; native role preparation prevalidates
    both slots before mutation. Angular controls preserve banks/factions. Statistical and fixture-reader controls
    cover missing/duplicate pairs, changed legal starts, holdout isolation, unsupported baseline and short soaks.
    Empty draft catalogs remain readable and negative-reader controls use their own populated fixture.

Separate Final Closure Audit for this source slice: traced factory inputs and strict parsers through native controls,
selected ownership, independent physical/paid effects, mandatory readers and manifest consumers. Reviewed paired
instance identity, observer gating, finite faults, original queue handles, safe claim release, quota accounting and
scene cleanup. Repaired source-review findings above. **The all-registrations authoring batch is complete.**
All active IDs are bound; H-21 remains explicitly deferred. No native execution or gameplay certification is claimed.
Source/config/fixture/callers, error/cleanup paths, bounded outputs, draft/catalog consumers and documentation
were reviewed separately after repairs. No recipe, test, lint, type check, formatting, build, install, server, browser
or dedicated validator ran. Only fixture/catalog --write generation ran as authoring. No skill/tool expansion was added.
Publish exact owned paths normally and verify remote SHA; no force push, merge or PR. Next requires explicitly
authorized scoped controls and native core execution, shared-owner repairs, then deferred victory/calibration gates.
Legacy/closure follows; machinery necessity/removal stays last overall.

## D-01 registration batch — authored, not executed (2026-10-20)

Publication base63297db700c51dde27ca013407560a4f34b066fa on feature/759-skirmish-ai in
/home/jernej/.codex/worktrees/skirmish-authority-recovery/fuzzy-waddle. Actual model/effort unknown.
User redirects work to registrations. No subagent, new plan, gameplay rebalance or runtime execution.

Numbered acceptance map / Omission Audit:

1. **Native lobby bindings — authored:** native-difficulty-worlds.mjs and native-scenario-registration.mjs generate
   d-01-native-runtime.json with six genuine lobby choices: Easy/Normal/Hard × both factions. Same legal roster,
   resources, map and seed; no fixture grants or strategic state injection. First sample40 avoids polling Easy
   before its first committed decision. All native selected boundaries are captured from tick0 through2000.
2. **Actual consumed policy — authored:** capture-ai-decision-input.ts receives the controller's own profile,
   shared with its pure brain, and copies it only with an installed listener. Optional legacy omission fails D-01.
   Selected dispatch also carries nextState policy version/difficulty so stale saved state cannot hide behind
   correct controller configuration. No saved/wire protocol change, always-on observer or new report channel.
   Both projections are fixed-size primitive data.
3. **Semantic reader — authored:** skirmish-ai-native-difficulty-evaluation.ts is connected to the mandatory native
   scenario reader. Independently pinned full profile, actual lobby source difficulty, every scheduled tick and
   completed-before sequence, accepted proposal/command quota lineage, selected save-owned policy version/difficulty
   and checkpoint difficulty plus real AI application
   are mandatory. Sparse/duplicate selections, relabelled Normal defaults and absent profiles fail closed.
   This does not claim quota saturation, every quota's behavioral effect, fairness comparisons or challenge ordering:
   those remain D-03/D-05/D-06. No broader difficulty scenario was promoted.
4. **Invalid configuration / negative controls — authored:** actual controller resolveProfile boundary rejects99
   before scheduling; existing factory rejection and new controller control are linked in D-01's pure binding.
   There is no invalid lobby option. Predicate controls erase/corrupt cadence/profile/quota evidence; factory controls
   require all six exact difficulty/faction variants and reject fallback drift. These are tests, not execution evidence.
5. **Registrations and tracking — authored:** manifest, native bindings, draft removal, factory/pure control links,
   generated catalog, testing guide, inventory and handoff agree. Supported runtime93/116 (80.2%) registered,
   23/116 (19.8%) unbound; pure111/111 unchanged. Factory62 bindings/400 variants;21 partial owner worlds retained.
   Difficulty1/6 registered (16.7%),5/6 unbound (83.3%). H-08/H-09/H-31/H-32 remain0/4 fully registered.
6. **Verification — deliberately deferred:** no recipes/tests/lint/types/formatters/builds/browser/server/doctor/
   context/dedicated validator ran. Only source/diff review, fixture authoring and catalog --write generation.
   Runtime behavior, timing premises, typing and test correctness remain unverified. No passing status asserted.

Separate Final Closure Audit: traced lobby selection → actual controller profile → selected-input capture → native
reader → manifest/factory/catalog. Reviewed diagnostic gating/detachment, six branch identities, same roster/seed,
first Easy sample and original ceiling, invalid-input owner coverage, fail-closed evidence and exact owned Git scope.
No unresolved implementation item was silently promoted from the four peer/save/lifecycle IDs. Publication is checked
against local/remote HEAD after commit; no PR/merge/force-push. Machinery review stays last overall.

**Next authoring:** D-03 paired native hidden position/HP/queue controls under all three difficulties and both factions,
plus a legitimate-contact control. Require real premise changes, allowed-input invariance and ordinary resource/stat
rules; reuse existing sight/resource/content authority. Keep native execution deferred. Recommend Sol6.1/high for
causal comparison design; this is task judgment, not an automatic model change.

[HANDOFF.md](HANDOFF.md) owns continuation. Read this current batch; older sections retain historical evidence.

## Grouped authority/save/lifecycle source repairs — native integration still unfinished, 2026-10-20

Publication base7c9654ca4dcac1f7640c71d4fc4d5d9c43cb006d; worktree/branch in HANDOFF. Actual model/effort unknown.
No delegation/model switch. No recipes/tests/lint/types/formatters/builds/browser/server/doctor/context/validators ran.
Source/diff review and catalog --write are authoring only. Existing scenario registrations and retained behavior counts
are unchanged: runtime92/116 (79.3%),24 unbound (20.7%); pure111/111. Current four IDs remain0/4 fully registered.

### Numbered acceptance map and Omission Audit — authored source, not passing evidence

1. **Original admitted ownership across epochs:** CommandAuthority retains admitted commitments and per-actor progress
   when the host fence advances. Late original completion can settle that original; stale dispatch/rejection cannot cancel
   paid work. AiCommandReconciliation keeps only admitted old pending identities with original age, while a former epoch's
   completion cannot raise the new terminal cursor. Full AI state transfer onto a previously passive peer remains open.
2. **Duplicate delivery versus actual failure:** runtime reconciliation uses shared non-settling rules. Duplicate/stale/
   lost/backpressure diagnostics do not release the original effect or reach pure claim release as terminal rejection.
   A positively identified different never-applied request rejected by the original commitment may close only itself.
   Tests cover original replay, conflicting new request and original completion separately.
3. **Identity through retention pressure:** active progress persists the original execution envelope beyond the512 outcome
   history and2048 detailed-ID limits. Matching command ID with wrong epoch/sequence/intent/effect cannot settle it.
   Real bus admission/JSON restore control crosses the configured ID limit. It uses Concede envelopes and is explicitly
   not acknowledged native peer compaction, rendered gameplay, payment proof or H-09 certification.
4. **Actual unsent cancellation on host fence:** the bus captures and removes its own pendingOutbound input before epoch
   advancement, records original cancellations and preserves those terminal records for pure claim release. It does not
   manufacture cancellation from timeout, disappearance or an absent receipt. Server-accepted/unacknowledged input is
   outside that definitely-unsent set and still needs the authoritative tail at the native integration boundary.
5. **Snapshot correction retains unsent input:** resetCommandLockstep filters actual unsent input against saved epoch,
   detailed IDs/watermark and exact authoritative tail identities, then re-times delivery above the seed frontier without
   restamping identity. The existing echo gate still controls application. Helper extraction keeps the transport owner
   bounded; source review repaired a leftover bare-this receiver in the extraction. No validator/test executed.
6. **Before-apply save input:** SaveGame captures detached pendingCommandBatches with authority/clock. Strict whole-tail
   restore validates original ownership/identity/capacity before publishing; rejects malformed tails without partial
   enqueue; excludes already-admitted work. Relay startup seeds above the restored tick instead of restarting at1/2.
   Codec, saved-clock/input and echo controls are authored. These are not a real paired codec/scene reload driver.
   Client-local unsent batches are deliberately excluded from the peer-independent simulation digest.
7. **Old scene work cannot revive transport:** disposed CommandBus entry points reject dispatch and ignore replay,
   outcome, epoch and reset mutations. CommandLockstep clears owned buffers/subscriptions, cannot reinitialize and
   avoids duplicate initialization. SaveGame cannot emit after a delayed screenshot returns to a disposed scene.
   HostMigrationService rejects duplicate/out-of-order transitions and cannot reinitialize after disposal.
8. **Cross-match Angular lifetime:** generation fences prevent late socket creation/teardown from replacing/destroying
   a newer communication owner. Local listeners detach before awaits. Event bindings retain their original instance ID
   and stop old autosave/checkpoint state. Late cleanup/Stopped completion cannot clear a replacement instance.
   A restored-world navigation checks its original instance; save dialogs use captured campaign scope and event bus.
9. **Bounded client split:** the existing root service/API now inherits one shared context, subscription lifetime and lobby
   layer, leaving save/replay/exit orchestration on the root facade. No second root instance/provider was added.
   Moved method bodies preserve existing contracts except the named lifetime fixes. The old hash-baselined oversized
   client file is split rather than refreshing its baseline. Angular DI/inherited API checks remain deferred, not passed.
10. **Native H-08 host branch:** explicit localhost/session opt-in retains at most16 genuine admitted AI envelopes,
    pins one actual applied world link and records at most32 outcomes with explicit overflow failure. The authored
    Playwright control uses the existing two-human/AI relay lobby and real server host promotion, then replays the
    original through the native application fence. It requires unchanged application count, original stale rejection
    and continued AI commands. It does not send that old packet over the network or prove all H-08 requirements.
    A retained replay callback seam exists for H-32, but no same-realm UI second-match driver was authored here.

### Scenario disposition and immediate next work

| ID   | Implemented source/control                                                                                 | Still required before full native registration                                                                                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-08 | Admitted/unsent epoch ownership, original identity fences, native host branch authored unrun               | Actual timeout/cancellation ordering, original delayed callbacks and canonical peers/network redelivery                                                             |
| H-09 | Original active metadata after real bus retention pressure/JSON restore, authored unrun                    | Acknowledged native peer compaction, real codec/scene restore, original paid effects and unresolved replay                                                          |
| H-31 | Original unsent-input persistence/restore, saved-clock relay startup and previous detached/live save fixes | Actual paired codec/scene reload versus uninterrupted play at before/during/after apply; chronic blocker/lease, full queue/debt/RNG and authoritative accepted tail |
| H-32 | Disposed bus/transport/save, host event and asynchronous client ownership fences; retained callback seam   | Ordinary UI second match in same realm, distinct seed/identity, pending path/receipt callbacks, host replacement and controller/effect counts                       |

These four remain specifications, not complete native bindings. Cumulative selected13 stays9/13 registered (69.2%),
4/13 unbound (30.8%); factory61 bindings/394 variants plus21 partial owner worlds remain unrun. Do not create another
preparation-only package or count this as four completed scenarios. Continue by finishing the actual native drivers.
Prior H-05/H-20/H-21/H-23 gaps and supported gameplay/multiplayer/calibration requirements remain on the same roadmap.

### Final Closure Audit — separate source/publication review

- Reviewed authority -> callback -> pure reservation release, actual unsent save/reset -> echo/application, protocol codec
  fields, scene shutdown and Angular root/communicator consumers. Controls distinguish original replay from a different
  rejected request and definite unsent cancellation from missing evidence. No manual authority edits or fake native
  strategic input were introduced. Headless Concede controls and the native host branch retain explicit limits.
- Source review repaired receiver extraction, malformed-tail atomic publication, duplicate-request settlement, callback
  cloning cost (cheap epoch read avoids full history cloning per ordinary callback), asynchronous instance replacement
  and test snapshot typing. All test/typing/lint/runtime outcomes remain unverified under the user's deferral.
- Model summaries stay capped8192 UTF-8 bytes. No generated fixture/raw report scan, new performance suite, baseline
  refresh, balance change, dependency or global diagnostic capture was added. The probe is finite, explicitly opted in,
  observes actual envelopes and detaches with scene diagnostics. No skill/tool expansion was made.
- Next grouped work is the four native integration drivers above, not another resource/planner refactor. Recommendation:
  Sol6.1/high for peer/save/UI causality. Machinery necessity review remains last overall.
- Publish only this worktree's owned source/tests/docs with hooks disabled, push normally, verify remote equality and
  pause. Verify the containing commit on resume; publication is not acceptance or a self-referential source SHA.

## Historical recovery/fault/save authoring — three registered, save integration incomplete, 2026-10-20

Publication base80ded317d129e57fb0a42aa6cb1a60404efc0cba; new managed worktree and branch in HANDOFF.
Actual model/effort unknown; no delegation/model switch. Source/diff review and fixture/catalog --write authoring only.
No recipe/test/lint/type/format/build/browser/server/doctor/context or dedicated validator ran. Publication is not readiness.

### Numbered acceptance map and Omission Audit — source review only

1. **H-11 — registered unrun,6 variants:** renewableFoodReserve prices the missing definition closure;
   proposeAiWorkerRecovery preserves it before extra workers; proposeAiFoodEconomy permits one-worker bootstrap.
   Observation catalog includes the content-permitted Field definition before its Granary prerequisite, while ordinary
   authority still checks eligibility. applyAiRuntimeRecoveryStart independently prices native definitions at tick0,
   inventories/exhausts all existing sources and sets only the exact chain budget. Native reader checks independent
   closure, paid Granary/Field completion, delivered food, renewed worker output and genuine infeasibility.
2. **H-12 — registered unrun,8 variants:** user explicitly chose native prevention plus pure recovery because shared
   admission already accepts whole bundles atomically. The adversarial contract, manifest, binding and pure selectors
   now agree on that scope; no partial native holds were invented. Reservations persist original admission priority.
   selectAiCycleVictim traverses known cycles, excludes feeders, ranks original priority and protects the entire plan if
   any sibling is dispatched/paid/refundable or original lifecycle evidence proves dispatch. Missing legacy rank retains
   ownership. Pure controls cover reverse enumeration, original priority, paid neighbors and lagging provisional labels.
   Native reader requires actual individually affordable but jointly scarce projects, complete-price admission/payment,
   later physical completion and field income, actual reversed proposer output, paid neighbor and foreign bank controls.
3. **H-30 — registered unrun,10 variants:** collectAiProposals quarantines invalid/throwing optional batches and patches
   before arbitration; saved bounded failures retry at1/2/4/8 intervals. projectAiDebugSafely preserves valid accepted work
   on debug failure and emits an honest unavailable projection. Mandatory state/observation/authority failures stay thrown
   and sticky technical health is surfaced by the controller. Test-only hooks require dev preset/player2, finite ticks,
   real emitted proposals and shutdown ownership. Metadata is bounded and does not trigger heavy world samples.
   Native reader joins original raw terminal receipts/epoch/sequence, useful native income, preserved orders and recovery;
   only the explicit injected mandatory error marker is exempted from the ordinary runtime error gate.
4. **H-31 — partial, unbound:** SaveGame freezes detached state before screenshot; game-instance client and save storage
   preserve that boundary across name/repository awaits. SimulationTickService restores clock before actors/controllers.
   SnapshotService and AI-only hash continuations capture live AI/research/authority, not stale last-save state.
   PlayerAiController consumes live authority before admission and stores the post-dispatch frontier. Authored controls
   cover real AES-GCM/protocol codec reconstruction, mixed queues/original identity, clock and live projection.
   **Missing:** real ordinary scene reload paired with uninterrupted continuation before/during/after apply, including
   multiplayer outbound tail/epoch. Single-player apply is synchronous; codec/JSON round trips do not certify this.
5. **Registrations and immediate consumers:** all three factory recipes, finite DTO parsers, pre-tick setup/capture,
   shutdown cleanup, native reader dispatch, manifest, removed draft rows, mutation/negative specifications and generated
   catalog are wired. Native factory61 bindings/394 variants plus21 partial owner worlds are authored unrun.
   Latest3 IDs/24 variants; cumulative selected13:9/13 registered (69.2%),4/13 unbound (30.8%).
   Current four-ID scope3/4 registered (75%), H-31 unbound1/4 (25%). Runtime92/116 (79.3%),24/116 unbound (20.7%).
   Pure111/111 registered. No new gameplay validation or overall completion percentage is claimed.
6. **Unresolved/deferred obligations:** H-08/H-09/H-31/H-32 stay specification-only; prior H-05/H-20/H-21/H-23 gaps
   remain. Shared gameplay/save changes need affected-source evidence at the authorized final gate. Existing large
   game-instance-client.service.ts is source-structure hash-baselined; changing its save boundary invalidates that legacy
   exemption. No baseline was refreshed. A bounded owner decomposition or explicitly reviewed cleanup exception remains
   necessary before a clean lint claim. This is an explicit gate constraint, not a passed check.

### Final Closure Audit — separate source/publication review

- Reviewed input-to-owner-to-capture-to-predicate wiring and public save consumers, prior pending ownership, optional
  quarantine/retry persistence, strict preset parsing and absence of fixture state injection. All four selected obligations
  have a disposition; H-31 stays open rather than being registered with a fake native boundary. Native geometry/timing,
  imported APIs/type checking and run outcomes remain unverified under the user's no-execution instruction.
- Authoring repairs: corrected an early writer syntax error before it executed; moved a branch-dependent command minimum
  out of the global factory header; H-11's infeasible branch has no arbitrary minimum-command requirement while feasible
  readers independently require real paid work/income. Catalog --write completed after the final H-12 contract updates.
  These are source-authoring events, not test execution or passing evidence.
- Model summaries remain capped8192 UTF-8 bytes; generated fixtures/raw reports were not loaded wholesale. Existing root
  fact budgets remain unchanged. No skills/tool/baseline expansion, game-balance change or performance suite was added.
- Next grouped batch: H-08/H-09/H-31 real peer/epoch/compaction/save integration so pending AI work retains exactly-once
  ownership through actual interruption. Then H-32 same-realm second-match/host replacement. Machinery review stays last.
  Recommended Sol6.1/high for unresolved causal integration design; current settings were not changed.
- Publication: commit only this worktree's owned changes with hooks disabled, push feature/759-skirmish-ai normally,
  verify remote equality and pause. The next agent verifies the containing commit; no self-referential SHA is invented.

## Historical command/resource authoring — six bound, seven incomplete, 2026-10-20

Publication base c681f7c94d489e1e2788039aaf73b5684a4ac53b; same worktree/branch as HANDOFF. No delegation/model change.
Source/diff review and fixture/catalog authoring only. No recipe/test/lint/type/format/build/browser/server/doctor/context
or dedicated validator ran. The catalog --write authoring initially found incorrect manifest references introduced by
an over-broad text edit; those references were corrected within their original rows and catalog authoring then completed.
This does not constitute executed gameplay or test evidence.

### Thirteen selected obligations — source-only disposition

| Obligation                         | Authored change / purpose                                                                                                                                                    | Registration and missing evidence                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-06 delayed/rejected/late receipt | Consumer-only hold/release; real queue contention via ordinary shared production; actual checkpoint reconciliation after two decision intervals                              | Registered unrun,6 variants; original shared charge/completion, identity retention and no optimistic retry required                                                  |
| H-07 output already absent         | Destroy original completed actor through native damage at next simulation tick; postpone checkpoint while loss is pending, retain original history                           | Registered unrun,4 variants; original death-before-reconciliation and living control required. Legal consumption conditional on actual product support, not invented |
| H-08 epoch/cancellation race       | Existing epoch fence and disposed-consumer guard retained; reusable original-receipt seam authored                                                                           | Unbound; real cancellation/host-promotion race and canonical peer outcomes missing                                                                                   |
| H-09 dedup retention/restore       | No arbitrary authority-state edits or fake save                                                                                                                              | Unbound; acknowledged compaction pressure, native save/restore and old/unresolved redelivery driver missing                                                          |
| H-10 backlog capacity              | Arbiter admission backpressure, no eviction/synthetic terminal failure,512 recent outcomes for128-command drain; unavailable history control and timed FIFO release          | Registered unrun,8 variants; actual127/128 pending identities, attempted over-admission and native drain/income required. Resume branch restores at1201 versus1801   |
| H-11 scarce recovery               | Missing complete-chain and independent source-exhaustion requirements recorded rather than promoting a zero-bank approximation                                               | Unbound; definition-priced complete cheapest chain, legal bootstrap and physically infeasible control missing                                                        |
| H-12 dependency bundles            | Follow all outgoing dependencies, detect actual membership rather than a feeder into another plan's cycle; reversed graph and acyclic controls authored                      | Unbound; real competing claims, original lowest-priority victim, paid/foreign neighbors and reversed proposer enumeration missing                                    |
| H-13 optional budgets              | Four real bases, paid ordinary fifth-base construction, scarce/executable/essential branches; per-resource denominator reconstructed from original selected claim tick/owner | Registered unrun,8 variants; optional proposals must exist, waiting exposure stay bounded and real useful paid work complete                                         |
| H-14 lane fairness                 | Consideration no longer implies service; accepted commands update service tick; actual applied outcome within eligible window required                                       | Registered unrun,6 variants; native harmless sightings, scouting/income, scarcity blocker and emergency decay required                                               |
| H-15 genuine emergency             | Native lethal/withdrawn/distant force; delayed receipt and unavailable checkpoint during attack; relevant native hits rather than arbitrary combat                           | Registered unrun,6 variants; fresh observation and actual original receipt reconciliation while survival remains effective                                           |
| H-30 optional faults               | Exact remaining proposer/debug fault and retry/cooldown requirements recorded                                                                                                | Unbound; scoped real throw/NaN/invalid-cost/debug controls and mandatory-authority negative control missing                                                          |
| H-31 save continuation             | Existing save-owned cadence/queue identities preserved; no counterfeit JSON restore                                                                                          | Unbound; ordinary codec/reload, unchanged input continuation and full sharedQueue/RNG/debt paired comparison missing                                                 |
| H-32 clean next match              | Shutdown fences policy/queued work before cleanup; restore after disposal throws; retained old receipt callback cannot mutate disposed reconciliation                        | Unbound; same-realm UI restart, native second-match controller count and real host-replacement controls missing                                                      |

### Omission Audit — source review only

1. All13 IDs have a disposition; six actual manifest bindings retain original outcomes, forbidden predicates,
   branches/ceilings and both factions. Seven keep fixture:null and explicit named missing-owner requirements.
   Previous H-05/H-20/H-21/H-23 gaps remain; a reusable receipt seam is not H-05 atomic-release proof.
2. Shared application is untouched by consumer faults. Raw native bus/charge/completion/death remain independent;
   only matching original AI effect receipts are held. Other players do not enter that consumer policy.
   Raw late receipts retain original epoch/sequence/identity; new effect IDs for uncertain original demand fail.
3. Installer caps128 selected commands,512 callbacks and1024 narrow metadata events, releases at fixed simulation ticks,
   unregisters hooks/listeners on expiry/shutdown and drops shutdown-held callbacks. No fault policy is installed in ordinary play.
   Existing root fact limits are unchanged; transport metadata does not trigger full world samples.
4. Selected mission capture adds complete bounded authority/pending/wait/lane/scheduler/query slices. Loss returns null;
   no convincing truncation. Model summaries remain capped8192 UTF-8 bytes. No raw fixture/report scan is model input.
5. Construction evidence now joins stripped runtime effect identity to prefixed selected intent identity, matching the real
   dispatch adapter. This repairs a source-only mismatch; it does not validate earlier construction scenarios.
6. Authored unrun controls cover preserved uncertainty, checkpoint availability, late callback disposal, player isolation,
   128-terminal drain, admission slots, lane consideration/service, branching cycles and acyclic convergence,
   strict receipt options, installer expiry/shutdown, fixture mutations and reader negatives. No baseline is refreshed.

### Final Closure Audit — separate source/publication review

- Current selected registration6/13 (46.2%),7/13 (53.8%) remain unbound. This is explicitly partial implementation;
  full thirteen-case acceptance is not closed. Runtime total89/116 (76.7%),27 unbound (23.3%); pure111/111 registered.
  Native factory58 bindings/370 faction-control variants plus21 partial owner worlds remain unrun.
- Contracts, parser, setup timing, native owners, capture cleanup, reader dispatch, manifest/drafts/factory and documentation
  were reviewed together. Missing physical premises must fail at the later gate; geometry/timing/capacity is unmeasured.
  Shared repairs require affected-source acceptance; historical production/economy passes are historical evidence only.
- Source-only publication boundary: stage exact owned paths, exclude unrelated run XML/ALL_VISIBLE edits, commit/push
  with hooks disabled to honor execution deferral, verify exact remote SHA and pause. Publication is not test success.
- Next grouped authoring: H-11/H-12 real recovery chains and proposal-order/priority ownership. Then H-30/H-32 native
  fault/restart and H-08/H-09/H-31 real peer/save integration; reuse receipt control for H-05 without skipping its claims.
  Keep existing topology/clearance/cargo and remaining supported families on the roadmap. Machinery review stays last.
  Recommended next model/effort: Sol6.1/high for unresolved causal integration design; no settings changed.

## Recovery/liveness authoring — eight bound, four incomplete, 2026-10-19

Publication base f1c14ffd8fcffbf5da239de5b3f9372f5cbc4b29; same branch/worktree. Actual model/effort unknown.
No delegation/model switch. Verify containing commit and remote. No recipes, tests, lint, types, formatter, builds,
browser/server, doctor/context or dedicated validators ran. Catalog --write and fixture construction are authoring only.

### Acceptance map — source review, not gameplay evidence

| Selected obligation                     | Implementation / immediate consumers                                                                                                                                                                 | State / deferred evidence                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| H-01 cumulative deadline                | native-recovery-worlds.mjs: original enclosed actor, fixed early/late native door loss and alternate duty; native-recovery-evidence.ts freezes first obligation and causal record                    | Registered unrun; establish actual initial obligation, fault interception, escalation before release and original-actor native effect |
| H-02 false motion / renamed purpose     | Native loop moves remain distinct from causal due/entry fields; native-recovery-evaluation.ts compares same-objective age across replacement squad names                                             | Registered unrun; real movement must occur; deadline/age cannot renew from motion or naming                                           |
| H-03 healthy long work                  | Original four paid queue items, native growing Field/harvest and long original travel versus fixed failed-route control; exact native queue identity/progress/completion and source-delivery readers | Registered unrun; actual >200-tick work/growth/travel and retained useful completion must be established                              |
| H-04 unrelated child progress           | Native wood obstruction plus separate worker food harvest; selected original recovery ownership/deadline separated from delivered food; attack-parent income control                                 | Registered unrun; original parent ownership, unrelated native delivery, bounded escalation and original worker duty remain required   |
| H-19 optional route failure             | Existing route outage gains explicit finite pending/error modes; real nearby attacker/shared attack; native defense hit before fault release and original route continuation                         | Registered unrun; missing interception or defense during the actual window fails                                                      |
| H-24 uncertain force                    | Real hidden16-unit reserve, exposed information/raid/denial and visible losing control; native fog fairness, physical scout/damage and survival reader                                               | Registered unrun; hidden premise, opportunity and bounded effect still need native proof                                              |
| H-25 choke recovery                     | Actual water choke, native armed guards and finite recurring opponent moves; alternate objective, paid changed force and bounded optional closure                                                    | Registered unrun; early effective avoidance can pass; cosmetic state changes/renaming alone cannot                                    |
| H-26 reinforcement safety               | Four original normally paid outputs, native guard coverage, actual grouping/alternate transit/stop-feeding/guard-loss control and continuing original-front effect                                   | Registered unrun; actual paid identities, physical route and native loss budgets are required                                         |
| H-05 uncertain receipt / atomic release | Existing AiCommandReconciliation plus independent shared application; exact missing receipt hold/release obligation recorded in native-scenario-recipes.json                                         | **Unbound**; scheduling a human command does not prove unknown AI application ownership                                               |
| H-20 topology storm / shutdown          | Existing navigation adapter/runner; exact finite churn, work/cursor capture and outside-scene shutdown boundary obligation recorded in draft                                                         | **Unbound**; pending fault cleanup source/tests do not prove native scene-disposal/query fencing                                      |
| H-21 physical clearance                 | Existing navigation native movement and static placement probes; exact small versus larger-unit/formation transit obligation recorded in draft                                                       | **Unbound**; tileMargin and graph clearance cannot substitute for physical body/service transit                                       |
| H-23 indispensable cargo                | Existing native transport membership and mission ownership; exact original AI transport-worker/departure control obligation recorded in draft                                                        | **Unbound**; human-scripted cargo cannot establish an AI-owned indispensable prerequisite                                             |

### Shared source review and Omission Audit

- All12 selected IDs have a disposition above; only eight move from draft to manifest-backed executable registration.
  Bindings preserve the original required/forbidden outcomes, checkpoint ceiling and both factions. The strict source
  factory includes every authored input; mutation tests cover erased obstruction, healthy work and pending/error modes.
  Four incomplete IDs retain fixture:null and explicit named missing seams; no full12-ID closure is asserted.
- Existing listener-gated mission capture now includes complete bounded recovery, blocker and transport slices.
  Overflow loses the entire selected boundary instead of truncating convincing ownership. No save/wire/planner input changes.
- Pending route faults hold at most32 calls; native destinations/callers are retained, release occurs FIFO at fixed
  simulation ticks, overload is explicit and shutdown resolves held calls null without invoking native navigation.
  Retained wrappers return null after shutdown and owned hooks/subscriptions restore without clobbering later hooks.
  Old null-response fixtures remain compatible. Mode parser rejects non-string and unknown modes.
- New guard, reader-negative, selected-capture and fault lifecycle specs are authored **unrun**. Source review does not
  establish geometry, timings, native applicability, TypeScript correctness, eventual route progress or absence of leaks.
  No additional observer, raw-report channel, balance/planner edit or skill change was introduced.

### Final Closure Audit — authoring publication only, selected batch incomplete

- Eight native recipes/54 faction-control variants, independent readers, strict factory/dispatch and catalog are wired.
  Four selected requirements remain named implementation gaps, not silent skips or unavailable test execution.
  Selected authoring8/12 (66.7%),4/12 (33.3%) unbound; gameplay passing count is not newly measured.
- Supported registration83/116 (71.6%),33 unbound (28.4%), excluding4 deferred island rows. Definitions116/116 consist
  of83 bindings plus33 specifications. Native factory52 IDs/332 variants and21 partial owner worlds remain unrun.
- Publication must include only owned source/fixtures/docs/tests. Preserve unrelated run XML and fog changes. Commit,
  push, verify exact remote SHA and pause. No recipe/test/lint/type/build execution, PR, merge or force push is authorized.
- Next finish H-05/H-20/H-21/H-23 together before selecting another family. Source anchors and missing premises are
  in the remaining draft records. Sol6.1/high is recommended for that unresolved causal design; active settings unknown.
  Both-faction victory and broader gate stay later; machinery necessity review remains last overall.

## Fourteen mission/domain/classic registrations — authored unrun, 2026-10-19

Publication base47aedcb062097a54af85ea94022c8435bc4c0e2b; same branch/worktree as HANDOFF. Actual model/effort unknown,
no delegation or model switch. Verify the containing commit and remote on resume. No recipes, tests, lint, typing,
formatter, builds, browser/server, doctor/context or dedicated validators ran. Fixture/catalog --write is authoring only.

### Acceptance map and source ownership

1. **Fourteen registrations authored:** STRAT-02/03/08/09, DOMAIN-01/02/05, RAID-03 and C-01–06 retain original
   obligations in native-scenario-bindings.json. native-strategic-worlds.mjs, native-domain-worlds.mjs and
   native-classic-worlds.mjs declare real actors, terrain, paid queue/research inputs and shared opponent commands.
   native-scenario-registration.mjs authors84 faction/control variants and their strict matrix bindings.41 drafts remain.
2. **Defense and strategic outcomes authored:** native-raid-strategy-evaluation.ts joins hidden physical raid arrival,
   real home damage, limited useful defense versus escalated recall, main-front pressure and delivered home income.
   Finishing needs AI-owned native core damage and the ordinary score win. Comeback needs fairly seen superior enemy
   force and an applied shared AI attack producing useful damage; actual elimination supplies the losing control.
   The elimination control need not dispatch a token command to satisfy a generic command count.
3. **Domain outcomes authored:** native-domain-evaluation.ts requires consumed water/air capability, paid native output,
   actual compatible addressed hits and useful transit. Irrelevant/unreachable controls cannot justify water purchases;
   observed anti-air and low-value contacts constrain air investment. DOMAIN-02 uses the real third Tivara opponent
   for hostile ship interception; no foreign Skaduwee ship is invented.
4. **Classic outcomes authored:** native-classic-evaluation.ts checks original paid work/completed-asset retention,
   normal cancellation/refund, dated upgrade/window changes, repeated affordable useful output and settled demand,
   dated contact deduplication/question service, bait/leash/follow-up and coherent three-player retargeting.
   native-mission-evidence.ts reuses real queue charge/completion/spawn, native hit and original landing/transit readers.
5. **Bindings use existing authority:** board/unload commands translate through the shared bus. Native transport membership
   and public team/defeat state extend the existing explicitly opted-in bounded tactical sample. Initial passive health-bearing
   assets/carriers are included in that opt-in lifetime proof; ordinary capture keeps its previous actor selection. Three-player variants use
   the existing AI Multiplayer map and ordinary Add A.I. lobby route; extra opponents arm/read the same observer. Their
   duplicate shared recipient ledger is omitted before browser transfer. No second observer, report interpreter or raw
   report scan is added. Existing8192-byte model-facing summaries and local raw-proof policy remain.
6. **Finite infrastructure/terminal support authored:** routeOutages targets original actor handles only over a fixed
   interval, records its first actual null-response interception and restores owned query hooks at expiry/shutdown.
   It is test infrastructure, not changed terrain or proof of strategic defeat. Normal event collection now validates
   actual outage identities/timing instead of discarding the event. Setup waits for navigation readiness. STRAT-08 seals
   an authoritative win tick before reading both native histories; only its explicitly checked win allows a shorter sealed
   prefix. Other history gaps and all default full-horizon requirements still fail. Readers refuse post-horizon arrivals/output.
7. **Explicit current-content limits:** ships are offered only by Sandhold. Boat raids require a Tivara human; Skaduwee's
   missing ship capability is tested from its actual catalog. Both factions retain real armed air-raider branches. No
   in-match diplomacy command exists, so C-06 tests ordinary defeat/retargeting and initial allied-team control; dynamic
   diplomacy remains unsupported, not a passed transition. No fishing or island-establishment coverage is invented.
8. **Unrun controls authored:** strict recipe/source/faction/branch drift, missing boat/outage/extra-player/team/terminal
   metadata, original query identity, fixed bounds, retained-wrapper/later-hook cleanup, bounded boarding/unload parser,
   incomplete or foreign/late outage results, missing sealed intervals and nonterminal/gapped histories. Prior controls
   remain authored/unrun. No new gameplay planner or balance repair is claimed.
9. **Progress:**75/116 supported runtime registrations (64.7%),41 remaining (35.3%), plus4 deferred island rows;
   pure111/111 (100%). Definitions116/116 comprise75 bindings and41 specifications. Latest84 variants are0/84 executed,
   0/84 validated. Prior194 variants and21 partial owner worlds remain unrun. No overall AI completion percentage.

### Omission Audit — source only

- Traced original14-ID obligations through source factories, faction-specific branches, strict fixture guard, manifest,
  ordinary lobby/frame runner, additional native opponent histories, per-ID assertions and full-case coverage.
- Reviewed board/unload ownership, actual container membership, player/team/defeat premises, paid original queue lineage,
  failed-route query scope, missing/late event collection and terminal prefix sealing. Repaired deferred navigation setup,
  missing outage result collection, a generic-command requirement that incorrectly penalized actual elimination controls,
  post-horizon native arrival/output borrowing, and missing initial passive-asset/carrier lifetime tracking. Added unrun regression/drift controls.
- Source review cannot establish legal footprints, actual boarding/landing visibility, response-force adequacy, timing,
  actual window closure, native fleet spawning or semantic reader correctness. Those remain gate premises. Missing proof
  must remain unavailable/failed; do not extend deadlines, invent capability or weaken outcomes for a pass.
- Three-player local focus is not real socket-peer or host-migration evidence. Explicit unsupported dynamic diplomacy is
  not counted as validated behavior. Raw proof remains local; ordinary play installs no preset route fault or combat capture.

### Final Closure Audit — authoring publication only

All14 selected IDs have concrete supported-branch factories, strict registrations and native reader consumers; current
content limits remain visible rather than dropped. Fixture/catalog data and HANDOFF/REMAINING-WORK/SCENARIO-INVENTORY
plus owning testing guidance are refreshed. No additional intended source-authoring gap was identified; execution,
typing/style and native correctness remain unverified. This closes this authoring batch, not gameplay acceptance.
Unrelated run XML/fog edits are excluded. Next group H-01–05/H-19–21/H-23–26 (12 IDs) for deadline/progress, safe release,
route/builder service and tactical liveness recovery; authority/lifecycle/peers, SEQ, difficulty/debug and later victory
remain. Machinery necessity review stays last. Commit/push exact owned paths, verify remote and pause.

## Thirty native registrations — authored unrun, 2026-10-19

Publication base c07d24b5177bdfe260710bff955c496911554194; same branch/worktree as HANDOFF. Actual model/effort unknown,
no delegation. Verify the containing commit and remote on resume. No recipes, tests, lint, types, formatting, builds,
browser/server, doctor/context or dedicated validators ran. Fixture JSON creation and catalog --write are authoring.

### Acceptance map and source ownership

1. **Thirty concrete case bindings authored:** PLACE-01–03/EXP-01/WALL-01–05/H-27/28; SCOUT-01–04/H-22;
   STRAT-04–07/10–13; RAID-01/FIGHT-01–05. tools/ai/native-scenario-bindings.json retains the original required/forbidden
   obligations. native-scenario-world-layout.mjs and native-scenario-worlds.mjs supply concrete native actor/terrain inputs
   and ordinary shared controls. native-scenario-registration.mjs authors30 fixtures/194 faction-control variants.
   Manifest rows now point to those fixtures;55 remaining specifications retain explicit missing bindings.
2. **Normal execution path wired, unrun:** skirmish-runtime-native-scenario-fixture.mjs refuses missing branches,
   input drift, generic-count downgrades and capture omissions. Existing matrix/registered-variant/variant-evaluation
   owners dispatch to skirmish-ai-native-scenario-evaluation.ts and full-case pairs. Individual diagnostic or partial
   owner worlds cannot certify a complete case. EXP-01 reuses the existing expansion geometry and paid-service reader.
3. **Native outcomes authored:** separate scouting, strategy, combat, placement and fortification readers require real
   fair sight/knowledge decay, physical useful travel/firing, independent squad ownership, useful opportunity/recovery,
   actual paid completed productive construction, friendly/hostile passage, occupied compatible fire and cumulative cost.
   SCOUT-02 hidden script pairs may share an initial world; equal permitted inputs/intents remain required until fair
   information differs. STRAT-07 breach destroys a pinned real wall; H-28 depletes initial sources to hold its budget fixed.
4. **Existing capture extended, not a new authority:** selected mission/input slices remain listener-gated and bounded.
   Explicit captureCombat adds native weapon request/commit, heal return, status apply/remove and spell-cooldown boundaries
   to the existing fact budget. Passive tactical truth is oracle-only; no privileged information enters planner inputs.
   Actor removal/root disposal fence retained call-through wrappers and preserve later owners' hooks. Missing/overflowed
   capture fails. Native initial footprints, source stocks, terrain and damaged durability are actual test setup inputs.
5. **Content and source-review repairs:** Firestorm/FrostNova/HealingRain now require AnkGuard, which already offers them,
   instead of InfantryInn. Prices/durations are unchanged; no new research menu or field rebalance. Native scheduled losses
   now consume armour before health because one native hit does not carry excess armour damage into HP. Test-only loss
   perturbations have no AI damage credit. Shared preset command translation was extracted without another runner.
6. **Unrun negative controls:** fixture/branch/source/control/terrain/research drift, bounded invalid inputs, native tile
   mutation ordering, damaged setup, call-through returns/throws, append failure, cleanup/later-hook retention, unwatch
   fencing, armour-first original loss and faction spell availability are authored in adjacent specs/tool tests.
7. **Registration progress only:**61/116 supported runtime IDs (52.6%),55 remaining (47.4%), plus4 deferred island rows;
   pure111/111 (100%). New batch0/194 variants executed or validated. Prior21 partial owner worlds remain unrun.
   No aggregate gameplay completion percentage, new victory, measured throughput or native scenario pass is claimed.

### Omission Audit — source only

- Traced descriptor → generated fixture → manifest/strict guard → normal runner → real opponent capture → per-variant
  native readers/full-case pairs. Original acceptance metadata is retained; fixed outer deadlines are not extended.
- Reviewed parser keys, event/control ownership, native setup, shared dispatch and actor/listener cleanup. Corrected stale
  hidden-pair assumptions, actual breach setup, fixed-budget source income, retained-wrapper fencing, research faction
  prerequisites and armour-first scheduled loss. Added unrun regression controls with their owning changes.
- Concrete geometry, safe versus threatened positions, exact one-site constrained premise, opportunity/pursuit durations,
  research/cast timing, status expiry, weapon compatibility and semantic oracle correctness remain unmeasured. They must
  be established at the authorized gate. Registration authoring is not proof that native preconditions can all occur.
- Weapon/damage matching is conservative and rejects ambiguity after a spell cast; it is not native projectile-identity
  tracing. Missing proof remains a failure/unavailable premise, never a generic damage-count pass.
- Raw reports remain local. Model-facing summaries retain the existing8192-byte bound and omission counts; no whole-report
  scan, second report interpreter or additional always-on game diagnostic system was added.

### Final Closure Audit — authoring publication only

Selected30 IDs have concrete factory inputs, fixed branches, native reader consumers and strict registration contracts.
Regenerated fixtures/catalog and updated HANDOFF/REMAINING-WORK/SCENARIO-INVENTORY plus owning test guidance and remaining
hook limitations. Source inspection identified no further intended authoring omission; execution/typing/style/native
correctness are explicitly unverified. This checkpoint closes authoring, not validation or the broader AI feature.
Unrelated run XML/fog edits remain excluded. No new index, skill/tool system, observer or model switch was introduced.
Next grouped authoring selection is the14 land strategy/domain/raid/classic-counter IDs in HANDOFF; H recovery/authority,
real save/replay/peers, continuous play, calibration/debug and later victory remain. Machinery review stays last.

## EXP-02 native scenario registration — authored unrun, 2026-10-18

Base56f775897a40e7f6b32a93696e6418ed5fad016d; same branch/worktree as HANDOFF. Actual model/effort unknown,
no delegation. Mechanical7b012d31e extracts unchanged workforce fixture predicates to keep the general validator bounded.
User requests continued registration with the existing no-execution policy. No recipes, tests, lint,
types, formatting, builds, browser/server, doctor/context or dedicated validators ran. Pure fixture-data generation,
catalog --write authoring and source review are the only evidence of this checkpoint.

### Acceptance map

1. **Full EXP-02 binding authored:** expansion-pressure-runtime.json is now the manifest's runtime fixture. Eight
   normal-lobby fixed-frame worlds cover safe/home-pressure/withdrawal/combat recovery for both factions. Six reuse
   existing branches and two combat branches are new. The row's former prose specification was moved into the runnable
   fixture's acceptance metadata and removed from the85 remaining draft cases. Catalog generation reflects registration.
2. **Real pressure and useful recovery authored:** four original opposing melee actors issue stamped shared attacks.
   The oracle requires multiple fair danger decisions with at least two armed visible threats, at least10% native home
   damage and retained original home. It refuses accepted remote overextension during danger. Every attacker must leave
   through real movement or die from exact AI-owned native damage. Productive paid construction and exact wood delivery
   must follow actual resolution, using callback order for same-tick effects. No forced kill, progress, AI input or cash credit.
   Withdrawal requires at least one actual surviving retreat; all attackers dying cannot masquerade as tested withdrawal.
3. **Positive comparison authored:** each faction has a productive safe control and combat subject with identical shared
   economic input. Pressure and withdrawal branches share that same economic world too. A safe service commitment must
   occur at a corresponding observed danger decision tick and become natively productive. Absence of demand, a later
   unrelated build or a successful command receipt cannot stand in for pressure-caused restraint. Missing/duplicate
   variants, changed budgets/stocks/queues/map/seed and scripted combat resolution fail closed.
4. **Native capture integration authored:** runRegisteredRuntimeVariant wraps the original lobby/frame runner and arms
   the existing observer for the real human opponent only for this bound case. captureCombat is a separate strict marker
   requiring captureProduction. AiRuntimeProductionWorldCapture subscribes to native ScoreDamage only under that marker;
   scalar health/armour and detached victim/initiator identities retain native clock/restore/scene boundaries. Disposal
   removes the listener. Ordinary games and previous unmarked captures gain no listener or changed fact stream.
   Opponent browser reads omit the shared recipient ledger already retained by the AI record; no second buffer/observer.
5. **Unrun controls authored:** fixture/manifest/branch drift; unknown or missing branches; different economic inputs;
   scripted kills/withdrawal in combat; native damage ownership/clock/scene/restore; loss without lethal damage; a surviving
   second attacker; opt-in forwarding and listener cleanup; standalone factory versus registered-data identity. No test ran.
6. **Progress:** supported runtime registration31/116 (26.7%),85remaining (73.3%), plus4 deferred island rows. Pure111/111
   (100%). Definitions116/116 now mean31 runnable bindings plus85 specifications. The owner-world union is21, all unrun;
   EXP-02's eight matrix variants are0/8 executed,0/8 validated. Native premises and actual timing remain unmeasured.
   There is no overall AI completion percentage, new gameplay pass, balance change or planner repair.

### Omission Audit — source only

- Traced manifest selection and strict fixture metadata through normal lobby setup, both native histories, per-variant
  predicates, complete paired evaluation, diagnostics and local raw report output. A diagnostic single-world run cannot
  close EXP-02. Existing negative or absent proof remains unavailable/failed rather than silently accepted.
- Reused shared commands, native health event, existing observer/fact budget, frame runner, movement/closed-history and
  paid-service readers. Only explicitly marked recipes capture damage. No new always-on gameplay system or balance edits.
- Strict source/setup identity, native kill event ordering, original home/attacker lifetimes, unavailable withdrawal,
  actor ownership, useful delivered service and bounded model-facing report paths were reviewed. Raw proof stays local.
- Source review cannot establish that pressure is serious long enough or that the safe commitment aligns; the later gate
  must report missing premises honestly. Do not weaken those checks or fabricate an opening to force a pass.
- PLACE-01–03/EXP-01/WALL-01–05/H-27/28 remain authoring gaps. M11, native save/replay/peers, calibration/debug, later victory
  and machinery-last review remain open. Unrelated run XML/ALL_VISIBLE fog changes are excluded; no skill/tool changes.

### Final Closure Audit — registration authoring checkpoint

All selected EXP-02 declarations have matrix/native reader/capture consumers and unrun negative coverage. The handoff,
execution plan, scenario inventory, recipe hook limits, owning guide and generated catalog were updated. Publication
certifies authored registration only; TypeScript, formatting/lint and native correctness remain unverified. Verify the
containing commit and remote on resume. Next authoring: group wall-prefix/firing/useful-cost with constrained/threatened
field controls, retaining EXP-01 utility/lease work. EXP-02 awaits authorized execution; machinery review stays last.

## Land expansion and physical wall-access bindings —14 additional worlds authored unrun, 2026-10-18

Base00a708a4ff85fe1bec6e612d6926db16252c01bb; same branch/worktree as HANDOFF. Actual model/effort unknown.
No delegation. User retains source-only authoring: no recipes, tests, lint, types, formatter, build, browser/server,
doctor/context or dedicated verification execution. Reading source/diffs and authoring files are the only review evidence.

### Acceptance map

1. **Ordinary movement/opponent actions implemented, unverified:** existing bounded preset controls now accept Move,
   movement to an actual owned role's native tile, and Attack against an actual opposing role. Commands keep human
   controller provenance and ordinary shared validation. World positions are finite/bounded; enemy movement targets,
   allied attacks and neutral attack roles are rejected. A dead original actor settles as unavailable with no command;
   no replacement or successful dispatch is manufactured. Actual native outcomes remain distinct from controller phase.
2. **Inherited source setup implemented, unverified:** optional exact logical positions disambiguate inherited actors.
   Neutral bindings require exact position and an actual native ResourceSourceComponent. Ambiguous, moved, dead,
   reused, cross-owner and non-resource matches abort. Existing owned bindings remain compatible. Expansion inputs
   bind all8 frozen-map deposits and set their real initial component stocks to zero instead of adding synthetic
   depleted sources beside an accidentally rich inherited map. This is setup, not a claimed native extraction event.
3. **Human authority reuses the existing capture, unverified:** opt-in host captureHuman forwards the original human
   boundary reader and can arm the existing closed history at paused0. It supplies no AI decision/knowledge and adds
   no second observer or buffer. Retained disposed AI/human handles now throw before rearming history. Native proof,
   actor watches and scene cleanup retain their existing ownership. Existing deposits without queues/weapons are pinned
   before first delivery. Counter-only, dropped or reordered history fails.
4. **Six physical fortification controls authored, unrun:** stairs present/missing, worker/army opening, sealed ring,
   native destroyed-wall breach. The actual prefab topology is assembled on the frozen open map, not a fictitious
   fortified map label. Normal shared Move witnesses must be attributed to exact native execution/order lifetimes and
   original endpoint arrival; stopped, fallback or receipt-only evidence cannot substitute. Closed physical position
   must show the actor at native wall height. A blocked branch needs a terminated native attempt and no destination
   occupancy. Breach requires pinned original loss/unregistration and later actual passage. These are human-owned
   physical controls, not AI wall construction, hostile passage, tower firing/value, shore/air or budget acceptance.
5. **Eight expansion controls authored, unrun:** expand/served/home-pressure/pressure-withdrawn for both factions.
   Real scouts, actual120/360-stock source definitions and enemy WatchTower supply fair choices/risk. No completed
   opening is injected. The native oracle joins accepted service identity to actual placement, one original available
   builder, physical arrival, one charge/completion, retention and an identified economic worker's wood delivered into
   that exact new deposit. A native WorkMill or faction main is eligible; a nearer deposit must improve service distance.
   Already-served branches
   require actual delivery to their original service and refuse redundant nearby expansion. Pressure requires actual
   scripted shared Attack, fairly observed danger, damaged surviving original home, and suppressed
   overextension. Withdrawal requires actual native movement or independently captured native raider loss, then a
   resumed productive expansion after that actual resolution. Horizon3000 does not extend EXP-02. Explicit positive-safe
   pairing, exhaustive utility/lease and combat-removal
   branches remain open; neither family receives a full manifest registration from these owner controls.
6. **Shared source-delivery reader implemented, unverified:** field delivery delegates to the same extraction/next
   offered-cargo/exact successful-deposit join as expansion. Source owner, worker, deposit, resource and time window
   are explicit. Another source/reset/transfer, resource grants and later generic cash cannot satisfy the contract.
7. **Source-found repairs:** prior strict browser roster logic omitted construction-created role IDs and would reject
   all three construction owner worlds. Its identity/count check now includes these roles without pretending they
   were seeded finished actors. New API consumers/nullable owners were traced; unsafe property narrowing was repaired.
   Source caveat: AiBaseManager's aggregate local-resource/income trigger may hold the new-main path while renewable
   food remains healthy; cheaper useful native service is also eligible. No runtime failure is claimed and no planner
   behavior was altered to make a fixture pass. Physical controls bind the request before synchronous native dispatch,
   not an incorrectly assumed ordering after the receipt.
8. **Progress:**14 additional owner worlds;19 total with the prior5.0/19 executed,0/19 validated. Unrun is not failed.
   Pure111/111, supported full runtime30/116 (25.9%),86 unbound (74.1%) and4 deferred island rows are unchanged.
   Definitions remain116/116, including86 full-scope specifications. No new scenario pass or global completion claim.
   Raw records remain local single-copy artifacts; bounded summaries/assertions expose at most12 failure details.

### Omission Audit — source review only

- Traced declarations, strict parser, exact native actor/owner/position bindings, shared Move/Attack dispatch,
  original control outcomes, observer lifetime, physical movement/closed history, completed service and resource credit.
  Controller phases, branch names, copied coordinates and fake paid/opening state cannot stand in for outcomes.
- Reused the existing runtime lobby/frame driver, movement normalizer, production capture/frontiers and resource
  join. No new scenario interpreter, map label, always-on gameplay observer, balance value or AI planner change.
- New/updated unrun controls cover neutral ambiguity/position/owner, roster construction-role regression, bounded
  moves/attack ownership/unavailable actors/shutdown, disposed capture handles, forwarding human history, initially pinned
  deposits, exact source/worker/deposit ownership and live usable deposits, missing native proof and closed counters
  without intervals. Source and tests were authored
  and reviewed; they were not compiled or executed. These controls do not certify the unrun worlds.
- Full AI placement prefixes/hostile passage, occupied firing/marginal value/shore/spend, constrained/threatened fields,
  full expansion utility/lease/combat controls, actual save/replay/peers and M11 remain open. No metadata-only row was
  upgraded to full executable registration. Catalog rendered counts are unchanged; no catalog checker was run.
- Unrelated run XML/ALL_VISIBLE fog changes remain excluded. Existing roadmap order, user execution deferral,
  four island-content deferrals and machinery-last policy are retained. No skill/tool expansion was made.

### Final Closure Audit — authoring checkpoint, not full selected-scenario closure

Reviewed immediate contracts/callers and native owner boundaries after source repairs, including normal-game opt-out,
retained handles, null-owned sources, mixed human/AI capture and bounded failure/raw artifact routing. Updated HANDOFF,
inventory, recipe reuse/limitations and owning testing guide. This checkpoint publishes authored code only; TypeScript,
format/lint and runtime correctness remain unverified. Verify containing publication commit/remote on resume.

Next: reuse these19 worlds for actual AI wall prefixes/occupied firing/useful cost, constrained/threatened fields and
remaining expansion utility/lease/combat controls. Complete full ID-specific bindings before changing30/116 full runtime
coverage. Native save/replay/peer H-31/SEQ-08 follow; machinery review is last. Recommend Sol6.1/high; no automatic switch.

## Native construction/static-prefix bindings and five owner worlds — authored unrun, 2026-10-18

Batch baseedff27f95c815e2e154a7f177c2a50d1aa586bfb; mechanical extraction87d2b0216,
queue hash/lifecycle behavior982a3aaf5; verify the containing fixture publication commit/remote on resume.
Same branch/worktree as HANDOFF; actual model/effort unknown, no delegation. User authorizes binding implementation,
missing support and limits, while retaining no recipe/test/lint/type/format/build or dedicated verification execution.

### Acceptance map and current limits

1. **Mixed queue hash support implemented, unverified:** StateHashService delegates its native projection to
   StateHashProjection; serializeActorQueueState includes all saved lanes/items, exact remaining work, original
   prices/refund policy, empty lanes and stamped command identity in peer digest and AI state. Object keys have
   deterministic order, lane/item order is preserved, explicit empty shared state supersedes legacy work, and old
   legacy-only serialization remains. Non-finite queue values fail. Versioned queue/save shapes are unchanged.
2. **Lifecycle support implemented, unverified:** repeated init replaces listeners and clears old hash/correction
   state. Destroy detaches its exact shutdown/snapshot handlers and clears cached hashes. Old scene shutdown cannot
   detach a new scene's owner. Position-only mismatch tolerance now rejects unequal state-tail lengths. These are
   narrow source-found prerequisite repairs, not validated reconnect/host-transfer acceptance.
3. **Native unfinished-site setup implemented, unverified:** constructionOrders uses ordinary shared Construct at
   paused tick zero. Native eligibility, payment admission, builder assignment, footprint/collision and actual indexed
   site identity remain the shared owners' responsibility. The browser compares declared builder/site roles with actual
   stamped application. No construction progress, finished prefab, paid flag, AI decision or success label is injected.
   Bounds:8 orders,8 builders/order, finite world positions, unique roles, same-owner groups and one initial primary
   job per worker; simultaneous construction/gathering and duplicate site/worker roles are rejected.
4. **Native interruption implemented, unverified:** pinned cancel_unfinished_site uses actual unfinished-site
   teardown/refund; finished/missing/dead/replacement targets cannot substitute. Pinned losses still use native damage.
   Cancellation is a developer native owner control, not a new relayed multiplayer cancel command. Tick/shutdown
   subscription lifetime remains bounded by the existing event installer.
5. **Three executable standalone worlds authored, unrun:** skirmish-ai-construction-worlds.spec.ts, explicit
   AI_CONSTRUCTION_WORLD_E2E=1. Ordinary lobby/fixed frames plus existing opt-in capture cover builder loss, intact
   work and cancellation. Independent oracle joins original site/application/worker, actual paid start and native
   completion/retention or exactly-once refund/removal. It refuses dropped/unclosed/missing/reordered intervals and
   requires real replacement-builder duty or the cancelled worker's later native income/build effect. Another site,
   generic commands, fixture labels and closed-tick counters cannot substitute for missing native effects.
   Summary failure details are bounded with omission counts; existing single-copy storage retains raw proof locally.
   Native interruption is tick80, below the earliest20s/four-builder/50ms completion; the oracle also requires an actual
   earlier started lifecycle, so an unstarted site is not accepted as an interruption. Initial queues cannot name sites
   that are created later in setup, and a construction-created role cannot masquerade as an initial builder.
6. **Static prefix and field branches implemented, unrun:** protectedRoutes is strictly owned and requires explicit
   captureProduction. Baseline and every placement use current native terrain/object/height builders without altering
   navigation/caches. Bounds:8 declarations, tile margin0–2,16384 cells/search,512 path tiles,256 prefix reads.
   The reader joins every applied shared Construct to its exact earlier same-tick footprint; unavailable/overflow,
   dropped/reordered history, wrong width/identity and intermediate seals fail. This proves only static tile envelopes,
   not unit transit/collider clearance, spawn or continuous moving occupancy. Tests cover narrow/wide passages,
   corner squeezing, native exact-height stair/wall ports, an early sealed/later open layout and capture loss.
   skirmish-ai-field-placement-worlds.spec.ts (AI_PLACEMENT_WORLD_E2E=1) adds both-faction safe-room owner branches:
   actual ordinary workers/buildings and native demand, no initial Field or injected food/crop state. At least two new
   paid completed retained fields, an aligned pair, no overlap with reserved baseline lanes, and delivered food from
   every new field are required. Food attribution joins actual extraction to next offered cargo and exact successful
   deposit; another field/reset/transfer, grant or generic cash increase cannot substitute. Summaries and assertion
   messages are bounded; raw evidence remains local single-copy storage. No balance values changed.
7. **Full selected bindings remain in progress:** five owner worlds do not close full PLACE-01/03
   acceptance or all12 PLACE/EXP/WALL/H-27/28 fixtures. Actual per-prefix unit transit/spawn, constrained/threatened
   field alternatives, useful expansion service/home-pressure pairs, real wall/stair/shore geometry, occupied defense
   value and cumulative native fortification spend still need concrete bindings/oracles. Actual native UI save/replay,
   interrupted construction and real peer/host continuation for H-31/SEQ-08 are also open. Hash equality alone does
   not close them; no fake map or placeholder full-scenario fixture was registered.
8. **Unrun controls authored:** queue codec/hash sensitivity to mixed order, exact progress, paid/refund policy and
   command metadata; uninterrupted versus restored queue trajectories at before/during/after-output boundaries;
   hash owner lifecycle and mismatch exception; construction schema/role conflict/pinned cancellation controls;
   native oracle missing-history and missing-effect controls. Tests were written and source-reviewed, never executed.
   No automatic verification/formatting command, browser/server, inspector profile or broad matrix was run.
9. **Progress/ownership:** pure111/111 unchanged; supported executable matrix registration30/116 (25.9%),86 unbound
   (74.1%) plus4 deferred island rows. Native definitions116/116 include the86 unchanged full-scope specifications.
   Standalone owner worlds:5 authored,0/5 executed and0/5 validated; unrun is not failed. No newly validated scenario
   or truthful overall gameplay percentage. Preserve unrelated run XML/ALL_VISIBLE fog edits. Existing historical
   production/economy/victory evidence belongs to older source; new queue/hash/fixture behavior has no current pass.

### Omission Audit — implementation/source review only

- Traced Construct request through shared validation, actual indexed world-link role, setup publication/wait,
  existing loss/cancellation installer, native capture, owner oracle and bounded report. Rejections do not become
  fixture success. Native capture remains opt-in; no new always-on observer or second scenario interpreter.
- Traced actual ActorManager sharedQueue snapshot into both peer digest and AI projection. Empty/mixed lanes, zero
  remaining work and command/paid policy enter serialization; authored real-codec paired controls require matching
  trajectories/effect counts. Real save UI, full replay, peer promotion and old-host callback fencing remain separate.
- Reviewed the large hash owner's extraction/public forwarding API and strict preset parser split. Each extracted
  responsibility/type has its owning file; no lint baseline/config relaxation. Source review repaired enum literals,
  unchecked array access, world-role narrowing, lost validation locals and invalid direct Window assumptions.
- Traced protected-route declarations through strict capture opt-in, actual pre-build baseline, fresh native builders,
  same-boundary placement fact, exact applied command/identity and independent prefix reader. Ordinary scenes gain
  no geometry observer; probes have explicit limits and never certify actual unit movement or hostile safety.
- Traced both-faction worker/producer/housing names to definitions and field demand to the existing policy. Food
  starts at zero, fields are not seeded, and native growth/harvest/deposit must produce the effect. Field walkability
  cannot hide reserved-space occupation. Source review repaired wrong faction prefab names and replaced an entry
  cargo sample with the actual positive extraction mutation; source-mixed cargo cannot satisfy two fields.
- Explicitly retained full12-world gaps instead of counting five owner worlds as scenario completion. Native recipe
  blocker/reuse metadata names implemented support and still-unproved physical/authority boundaries. Four island rows,
  original121 requirements and fixture references are unchanged; M11 and machinery-last policy stay intact.
- No Angular service/component, balance, resource yield or gameplay planner behavior changed. Temporary authoring
  scripts remain ignored. New metadata/Phaser/Playwright tests are meaningful controls, but no passing claim exists.

### Final Closure Audit — support slice only

After repairs, reviewed immediate schema/type/caller consumers, callback cleanup, proof ownership and authored test
negative paths. HANDOFF, remaining inventory and owning testing guide distinguish implemented support, standalone
owner controls, full fixture registration and validated behavior. The larger binding batch remains in progress.
Publication owns only the named source/test/docs paths; unrelated run/fog files are excluded. No release gate passed.

Next authoring action: real per-prefix unit transit/spawn, constrained/threatened field alternatives and useful
expansion/home-pressure pairs for PLACE-01–03/EXP-01/02; verified fortified geometry/oracles for WALL-01–05/H-27/28,
reusing constructionOrders, static prefix readers and these five worlds. Native
save/replay/real-peer continuation then uses the complete queue projection. Keep execution deferred until authorized.
Recommend Sol6.1/high for physical/authority integration; no automatic switch or new task.

## Native recipe authoring only —86 specifications, 2026-10-18

Base709e5e3c87a9162c5b1df9f629aecee13adf8293; same branch/worktree as HANDOFF. Actual model/effort unknown.
User requested creation and source review in one pass, explicitly without executing recipes, tests, lint or similar
checks. No subagents, browser/server, gameplay/balance change, new scenario IDs or diagnostic runtime engine.

### Acceptance and limits

1. **Authoring coverage implemented:** native-scenario-recipes.json contains86 case-specific specifications matching
   the86 supported runtime-null rows. Each retains its original requirement/source, legal-world prerequisites,
   actual opponent/fault actions, native measurements, required/forbidden outcomes, control branches, finite outer
   ceiling and planned checkpoints. Existing pure owners are linked for reuse; no counter is substituted for an effect.
   Original121 requirements,111 pure registrations,30 executable runtime rows and4 island deferrals remain intact.
2. **Executable tests not implemented by these records:** every case retains native_case_binding plus its explicit
   owner-specific executionBlockers. Concrete paused actor/tile bindings, action scheduling and native oracles still
   need implementation. Wall/height geometry and multi-opponent roster setup are specifically unavailable. Do not
   mistake these contracts for runnable tests or claim all116 native scenarios are registered/passing.
3. **Source review/repairs:** inspected actual preset/control/variant/checkpoint/assertion contracts, runtime
   evaluation/runner, perturbation implementation, native navigation/exposure diagnostics, actual map registry,
   topology fixture, calibration fixture and StateHashService whitelist. Corrected navigation/combat proof wording
   because existing diagnostics explicitly leave continuity unavailable. Preserved D-06's existing maps/seeds/holdout/
   opponents rather than silently applying the open-economy default; three separate72000-tick soaks retain their
   60-minute scope and cannot count early terminal samples as full soaks. Corrected paired-world policy: controls may
   deliberately change observed risk/workforce; only hidden-state fairness pairs require identical permitted input.
   sharedQueue hashing remains an explicit prerequisite, not falsely reported as fixed. ALL_VISIBLE fog is unrelated
   dirty work and preserved; fair-scout execution must use a candidate with the declared ordinary visibility rules.
4. **Discoverability without false registration:** runtimeRecipeDraft links every specification in the manifest.
   Existing manifest reader validates its authoring shape/reference; the matrix's runtimeFixtureReference still
   returns only fixture. The catalog links authored/unbound status and the inventory counts drafts separately without
   reducing missing executable cases. A small authoring reader rejects malformed identities, unknown hook references,
   missing outcomes/branches, invalid checkpoint ordering and execution-evidence labels. It does not execute recipes.
5. **No execution evidence:** no recipes, Jest/Node/Playwright tests, lint, type checks, formatters, doctor/context,
   catalog --check, git diff --check or other dedicated validators ran. Only source/diff inspection, file authoring
   and catalog --write generation. New metadata controls are authored **unrun**. Prior194 gameplay/16 tooling passes
   certify the previous source only; changed tooling is not claimed checked. Static generation is not behavioral proof.
6. **Progress/delivery:** native definitions116/116 (100%):30 existing executable plus86 new specifications.
   Executable native registration30/116 (25.9%),86 unbound (74.1%);4 island rows deferred separately. Pure111/111
   unchanged. No new scenario behavior pass and no overall AI completion percentage. Preserve unrelated run XML/fog
   edits, commit/push only task-owned paths and verify remote equality at publication; the containing commit records
   its own exact source without embedding a self-referential SHA here.

### Omission Audit — source inspection, not an execution gate

- All86 original supported runtime gaps have distinct authoring records; none of the4 island cases was relabeled as
  supported land acceptance. Existing fixture and pure registration values remain unchanged.
- Assertions include negative/recovery controls, actual applied outcomes, causal identity and deadline preservation,
  legitimate fog/contact, per-unit clearance, exactly-once payment/effects, real peer boundaries and ordinary victory.
- Missing concrete bindings are not empty passing adapters, skipped assertions or generic minimum-decision recipes.
  They remain named implementation work; executable runtime coverage therefore stays30/116.
- Native metadata readers and their immediate manifest/catalog/inventory consumers are connected. New tests cover
  identity/count mapping, unknown/inherited hook rejection, authoring-versus-runtime labels, checkpoint limits and
  exclusion from executable coverage. These test functions were reviewed, not invoked.
- No gameplay service, map, paid cost, balance, queue, state hash or existing pass oracle was modified. No framework
  service/component change requires additional Angular coverage. No plan files or runtime observer were added.

### Final Closure Audit — authoring boundary only

After source repairs, reviewed the authoring-to-manifest-to-catalog/inventory path and runner exclusion. The current
handoff, remaining-work inventory and86 scenario rows distinguish authored, executable, executed and validated states.
Only the agreed authoring work is ready for publication; executable binding and behavioral correctness remain open.
Publication scope excludes the two unrelated dirty files and ignored one-off authoring script. No release gate passed.

Next: implement concrete native placement/recovery bindings, sharing interrupted construction/training/research
continuation and sharedQueue StateHashService adoption. Resolve actual fortified geometry before registering its
cases. Existing peers/replay, M11, combat/scout native integration, calibration and debug obligations remain concrete
in the specifications; do not repeat the design just to create another batch. No-execution policy remains current.
Recommend Sol6.1/high for unresolved native/restore authority work; no automatic model switch.

## Remaining43 pure fixture registrations — one batch, 2026-10-18

Base18503d9a5b519186838a5de7083c6533d236fb7d; same worktree/branch as HANDOFF. Actual model/effort unknown;
no delegation. User explicitly requested all43 in one pass, with one publication boundary. No gameplay production
behavior, balance, native recipes or diagnostic capture architecture changed. Full-match/broad regression stay deferred.

### Acceptance map

1. **All requested registrations:** controller-contract-scenarios.json registers SCOUT-01–04/H-22;
   STRAT-02–04/10–13; DOMAIN-03/04/H-19–21; RAID-03/FIGHT-03/05/H-26; PLACE-01/02/H-01–15;
   C-03/05, D-01/04 and DBG-02. The manifest has111/111 pure fixtures,0missing, up from68/111.
   All43 new cases have setup/expected text, exact executable selectors and explicit remaining branches.
2. **Meaningful reuse:**73 scenario-to-test bindings select existing semantic owner assertions plus11 new controls.
   Shared controls may serve several IDs;73 is not the count of distinct tests. New controller tests cover stable causal
   age despite renewed decision/retry identities, long-work milestone preservation, unrelated child versus parent
   progress, deterministic wait-cycle release preserving paid work, exact difficulty profiles and nonmutating why-not
   lookup. New combat tests cover legal/blocked escape, independent fronts and Easy retreat with retained deadline.
   New economic-placement tests cover distinct aligned eligible sites with central reservations and paired safe/exposed
   alternatives. The initial exposure fixture lacked current threat identity/timestamps; corrected the authored input,
   preserving fair visibility checks rather than changing production safety rules.
3. **Real execution required:** optional pureCases bind exact repository-relative file and assertion title.
   The existing runner selects those files and requires every binding to pass exactly once. Missing/skipped/failed,
   wrong-file and duplicate ambiguous matches fail. An incidental passing ID-named test cannot satisfy a bound case.
   Parser rejects unsafe paths, empty/duplicate/missing cases, unscoped evidence and invalid coverage declarations.
   Existing ID-named fixture evidence remains compatible and is covered by tooling tests.
4. **Honest compact reports:** bound evidence carries coverage, remaining and bindingsComplete. All43 current cases
   are owner_contract evidence, not complete scenario certification. Existing summary output reports owner/scenario
   scope counts and projects a selected ID's remaining branch without raw Jest output. Selecting a pure case no longer
   falsely reports a missing runtime scenario. The same UTF-8 output bound remains in force.
5. **Documentation/cold start:** generator links bound specs even when the old tests do not mention an ID. Generated
   catalog,43 inventory rows, family missing counts and handoff are reconciled. Owning testing README explains bindings,
   coverage limits and bounded summaries. Catalog command guidance now uses the working direct node command rather
   than the extra pnpm separator that caused the previous observed usage error.
6. **Ownership/delivery:** preserve unrelated run XML and ALL_VISIBLE fog changes. No broad matrix/browser/server,
   new journal, model switch, extra task or PR. Task-owned commit/push with remote verification, then pause.

### Focused checks and source provenance

Ignored artifacts use tmp/ai-plans/759-validation/pure-registration-\*. Only bounded projections are model inputs.

- Combined selection: `node tools/ai/run-skirmish-matrix.mjs --scenarios <controller-contract-scenarios.json scenarioIds joined by commas> --mode pure`
  — **43/43 IDs,73/73 declared bindings,36 suites194 tests pass**,0missing bindings. Exact list is fixture.scenarioIds;
  pure-registration-matrix-final.log points to `tmp/ai-skirmish-matrix/1792302617582-passed.json`.
  Resume without reconstructing a list: read fixture.scenarioIds and pass it to the existing CLI's --scenarios argument.
- Tooling: `node --test tools/ai/pure-scenario-evidence.test.mjs tools/ai/generate-skirmish-test-catalog.test.mjs tools/ai/summarize-skirmish-report.test.mjs`
  — **16/16 pass**, tools-final.log. `node tools/ai/generate-skirmish-test-catalog.mjs --check` passes.
- `pnpm exec nx lint probable-waffle-gameplay` passes; lint.log. Explicit source-structure ESLint over every owned
  TS/MJS file passes with0errors; structure.log. No baseline or config changes. Selected source formatting/diff pass.
- Actual source typing: `pnpm exec tsc -p apps/portal/tsconfig.app.json --noEmit` passes; types.log.
  Additional new-test typing uses ignored pure-registration-tsconfig.json extending gameplay/tsconfig.spec.json with
  exactly the three new test files; test-types.log passes. The initial helper inferred only known-position actors;
  its input now uses the existing AiObservationV1 contract instead of narrowing away legal unknown observations.
- `node tools/ai/summarize-skirmish-report.mjs tmp/ai-skirmish-matrix/1792302617582-passed.json --max-bytes 2048`
  retains43executed/0missing and ownerContracts43/scenarioContracts0/nativeAcceptance not asserted; summary.txt.
  Missing raw lines are explicitly counted. No large native report or raw Jest payload was scanned.
- pure-registration-source.json records base, exact owned paths and ordered path/NUL/bytes/NUL SHA256.
  Owned-path manifest excludes run/fog edits. Publication/remote equality is checked at delivery; the containing
  commit is deliberately not self-referentially embedded here.

### Omission Audit

Manifest comparison accounts for every one of the43 originally missing IDs exactly once. Every declared selector
executes in the combined run; no scenario passes solely because a file mentions its ID. Legacy evidence remains
supported. Parser, matrix selection, summaries and catalog consumers are wired and checked. All new tests use
existing real owner functions with authored expectations; no duplicated planner/oracle computes its own expected result.
No pure transport/landing setup is presented as native execution or absent island content as a passed world.

Pure registration is **111/111 (100%),0remaining (0%)**. Supported runtime is unchanged **30/116 (25.9%),
86remaining (74.1%)**, plus4 content-deferred cases. These counters do not close Packages3–5 or overall gameplay.
The43 per-case remaining fields are the concrete semantic follow-up inventory: e.g. scout risk/knowledge integration,
actual landed raids, scarcity-chain recovery, actual priority dispatch, native fronts/access and complete Easy behavior.
The previous sharedQueue hash/snapshot/replay gap, real peers/host transfer, M11 history, calibration and final machinery
review also remain open. Full-match victory and broad regression remain explicitly deferred.

### Final Closure Audit — registration batch

After fixture/type repairs,43/43 selections and all73bindings pass;11 new controls are included in194 executed tests,
and16 tooling controls pass. Rechecked exact file/title ambiguity handling, preserved legacy semantics, fixture/schema
coverage labels, bounded summary output, generated catalog and local links. This is self-review, not independent review.
No gameplay fix is claimed from registering existing coverage. No supported native recipe was added or removed.

Next resume native placement/fortification recipes for the previous nine IDs together with interrupted construction,
training/research snapshot/replay and sharedQueue StateHashService adoption. Reuse new field-placement controls where
feasible. This proves actual access and matching paid-work continuation; do not add another pure-registration phase.
Recommend Sol6.1/high for that restore/authority integration; recommendation changes no active setting.

## Ten-item placement and paid-work continuation batch — 2026-10-18

Base25beec7fd4a01a4c132be2c137af9e81b3a5d3ba; mechanical registry/protocol split2b25935bd precedes behavior changes.
Actual model/effort unknown. User approved this grouped implementation and focused publication checks; full matches
and broad regression stay deferred. No browser/server, new diagnostic architecture, delegation or balance change.

### Acceptance map — focused implementation checked; package acceptance open

1. **Placement:** `ai-construction-access` is wired through `ai-construction-site-selector`. Flood the bounded
   observed ground component, combine each footprint with earlier reservations, reject disconnected sites and shore
   occupation, and preserve remaining reachable approaches. Placement-access controls cover corridor alternatives,
   disconnected ground, simultaneous nonoverlapping prefixes and occupancy versus travel. Native topology remains pending.
2. **Expansion:** `ai-expansion-site` reuses construction-recovery reachability and economy-site safety in
   `ai-base-manager`. Occupied/blocked candidates permit alternatives; cargo, transfer, delivery, construction and live
   actor leases exclude a worker. Credible visible home pressure postpones optional expansion; memory alone does not.
   Eight expansion controls pass. Complete island establishment and native safe-access outcomes are not certified.
3. **Walls/openings:** layout rejects occupied cells; connectivity requires the exact intentional opening rather than
   substituting a neighboring cell. Existing shore/domain/choke controls and new continuation controls pass. Actual
   friendly army/worker passage through a native constructed prefix still requires the runtime recipe.
4. **Construction recovery:** `ConstructionWorkerMembership` retains unique unresolved saved IDs but counts only live
   resolved workers. New assignment supersedes unresolved old intent; removed IDs cannot reappear. Existing compatible
   unfinished-site recovery, lost/dead builder release and impossible-job controls remain passing. Healthy work is retained.
5. **Fortification recovery:** retained owner controls cover attempt-specific rebuild effects, abandonment, lost base,
   blocked footprints and distinct available builders. New saved-graph continuation and cumulative other-base budget
   controls pass without creating another graph. Tests were split by responsibility; original controls were retained.
6. **Construction save/cancel:** partial restore preserves absent membership fields, explicit empty lists clear them,
   and missing saved workers cannot advance construction/repair. Saved cancellation and unchanged payment/refund controls
   pass. Shutdown unsubscribes without cancellation/refund; late restore/destruction cannot repay a disposed site.
7. **Training save/load:** versioned optional protocol `sharedQueue` carries exact mixed lanes, empty lanes, remaining
   work, original policy and command context via ActorManager/actor-data into QueueComponent. Validate replacement before
   mutation; explicit snapshot supersedes legacy component lists. Ready work completes once without another installment.
   Production creation and its terminal outcome now settle synchronously before the tick returns to a save capture.
8. **Research save/load:** retain the original research cost/refund policy; legacy restore replaces rather than appends
   research while preserving production. Tech-tree/completion reentry guards prevent repeated upgrades/notifications.
   Remove cancellation handles before refunds; nested and failed callbacks cannot cancel/refund the next paid handle.
9. **Obsolete callbacks:** queue generations and exact-head checks reject old completion/purchase continuations after
   restore or disposal; progress callbacks cannot cancel one unit and complete its neighbor. Research completion also
   rechecks generation after native callbacks. Builder async seeking checks disposal/current ownership after awaiting.
10. **Cleanup/restart:** builder, site, production, queue and command listeners/subscriptions release on shutdown.
    Disposed owners reject new work/restore; a fresh queue starts independently. Component lifecycle controls pass;
    an actual second lobby match and host transfer are separate integration evidence.

### Checks and bounded evidence

Ignored artifacts use `tmp/ai-plans/759-validation/placement-restore-*`; do not feed raw large runtime reports to an LLM.

- Gameplay: `pnpm exec nx test probable-waffle-gameplay --runInBand --testPathPatterns='ai-placement-access-scenarios.spec|ai-expansion-access-scenarios.spec|ai-construction-site-selector.spec|ai-expansion-cost.spec|ai-base-manager.spec|ai-fortification-(manager|recovery|continuation).spec|ai-construction-recovery-proposal.spec|ai-macro-construction.spec'`
  —10 suites62 tests pass; gameplay-final.log.
- Native: `pnpm exec nx test probable-waffle-phaser --runInBand --testPathPatterns='queue-continuation.spec|shared-queue-resource.spec|queue-resource-history.spec|research-(preflight|continuation).spec|actor-manager-ai-save.spec|construction-(lifecycle|worker-membership|payment).spec|construction-resource-history|builder-membership.spec|production-spatial-spawn.spec|snapshot.service.spec|advance-shared-queue-item.spec|mutate-shared-queue-item.spec'`
  —16 suites136 tests pass; native-final.log. Combined owner checks **198/198 (100%),0 failing**.
- Tooling: `node --test tools/ai/generate-skirmish-test-catalog.test.mjs tools/ai/pure-scenario-evidence.test.mjs`
  —3/3 pass; tools-final.log. Catalog `node tools/ai/generate-skirmish-test-catalog.mjs --check` passes.
- Registration: `node tools/ai/run-skirmish-matrix.mjs --scenarios PLACE-03,EXP-01,EXP-02,WALL-01,WALL-02,WALL-04,WALL-05,H-27,H-28 --mode pure`
  passes; `tmp/ai-skirmish-matrix/1792301313618-passed.json`,9 IDs,10 suites51 tests (overlaps owner checks; do not add
  to198). Per-ID passing assertions3/2/1/2/1/3/1/1/2; missing IDs[]. Fixture explicitly limits evidence to selected owners.
- `pnpm exec nx run-many -t lint -p probable-waffle-gameplay probable-waffle-phaser probable-waffle-protocol` passes;
  lint-final.log. Actual app source typing `pnpm exec tsc -p apps/portal/tsconfig.app.json --noEmit` passes; types-final.log.
  Flat ESLint config does not currently enable source-structure limits, so explicit owned-source
  `pnpm exec eslint --rule fuzzy-waddle/source-structure-limits:error <owned TypeScript paths>` also passes:
  structure-final.log,0 errors/91 warnings. No baseline/config relaxation. Selected source formatting/diff checks pass.
- `placement-restore-source.json` records base, ordered owned paths and path/NUL/bytes/NUL SHA256, including the
  mechanical prerequisite. Owned path manifest excludes unrelated run/fog edits. Containing commit/remote equality
  is checked on publication; no self-referential commit SHA is embedded in this ledger.

### Omission Audit

All ten requested implementation items have wired owners, causal/recovery controls and explicit evidence limits above.
Save contracts retain old-save fallback and explicit empty replacements. New snapshot validation rejects malformed
progress/payment/cost before replacing paid work. Caller cancellation outcomes now reflect actual admission rather
than reporting a successful cancellation on rejected reentry. Definitions/cost formulas and final native admission
remain authoritative. Durable placement and lifecycle docs explain the new invariants; no temporary plan is imported.

Manifest-derived registration is **68/111 pure (61.3%),43remaining (38.7%)**; supported runtime remains
**30/116 (25.9%),86remaining (74.1%)**, plus4 content-deferred rows. Nine inventory rows/catalog links updated.
No new runtime recipe or full-scenario certification is claimed. PLACE-01/02, H-01–05 and unexercised semantic branches
remain open, along with full-match/broad gates, M11 history, sockets/host transfer, calibration and final machinery review.

### Final Closure Audit — focused checkpoint only

After repairs, all selected owner/tooling checks pass. Rechecked production spawn callers, research tech-tree/refund
ownership, exact mixed-lane restore wiring, worker pending/live membership, shutdown listeners and unchanged legacy
fallback. Scope excludes unrelated run/fog edits and baseline changes. This is self-review, not independent review.

**Concrete next integration gap:** ActorManager saves carry `sharedQueue`, but
`phaser/src/lib/world/services/recovery/state-hash.service.ts` still whitelists legacy production/research data;
new lane/command metadata is not hashed. Next group adopts that field with matching-state tests, creates native
placement/fortification recipes for the nine IDs, and exercises interrupted construction/training/research through
snapshot/replay. Native passage, full interrupted world/peer behavior and second-match acceptance remain open.
Packages4/5 are not closed. The agreed publication boundary is task-owned commit/push, remote verification and pause;
recommend Sol6.1/high for these restore/hash authority questions. No automatic model change or next-stage execution.

## Grouped placement/fortification and native payment recovery — 2026-10-17

Base4e10c89e7b65ee419a15993733eb4999a041d9a9; behavior-neutral split319fd3153, then repairs below.
Actual model/effort unknown. Full-match/broad regression remain user-deferred; no browser/server run, new diagnostic
machinery or balance change. Logs/manifests below are ignored under tmp/ai-plans/759-validation/.

### Acceptance map and evidence

1. **Fortification recovery:** ai-fortification-recovery retains completed attempt identities, advances destroyed nodes,
   matches current effect reservations, preserves abandonment and abandons lost-base plans. ai-fortification-orders
   uses attempt-specific claims, skips blocked footprints and selects distinct available/unleased workers without cargo
   or transfers. Old-reservation replacement reaches actual shared arbiter admission. Existing opening, shore,
   connectivity, budget-floor, partial-site dependency and stair-breach controls remain. Initial additions:5red/9green
   (fortification-before.log). Source split retained all original9 controls, lint and app typing before its separate commit.
2. **Native membership:** BuilderComponent transfers/removes build/repair membership, clears vanished-site and pending
   restore references on leave, and cleans membership on death. Duplicate assignment cannot multiply work. Consuming
   builders iterates a snapshot, so native death callbacks cannot skip later workers. Real component controls cover
   transfer, denied transfer, vanished site, death, duplicate assignment and synchronous list mutation.
3. **Exactly-once cancellation:** ConstructionSiteComponent settles before refund callbacks, with a transient guard
   protecting its earlier resource-history fence. It snapshots builder cleanup, preserves the first failure and cannot
   replay a refund attempt. Payment-time cancellation waits for returned payment and stays terminal. Optional saved
   cancellationSettled prevents repayment/restart after restore; old saves omit it. Existing loss fence covers the new
   terminal mutation. Initial lifecycle additions:4red (cancellation-before.log). Real reentrant emissions charge11 then
   refund2 at the unchanged configured progress/factors, leaving91 food.
4. **Resource payment:** ProbableWafflePlayer samples one cost vector and preflights it before any debit. Invalid keys,
   negative/nonfinite amounts are denied; exact balances and zero amounts remain legal. Initial controls:5red/2green
   (payment-before.log). Passive observation now records the rejected vector with unchanged balances, replacing its old
   expectation of the partial-debit defect. No new resource ledger or mutation API.
5. **Scope/delivery:** public manager exports and saved identity formats remain compatible. Construction adds only the
   optional terminal marker. Preserve unrelated run/fog edits. Scenario registration, full native execution, sockets,
   host transfer, replay, broad interrupted saves and M11 history are not closed by these focused controls.

### Focused commands and provenance

- Gameplay: `pnpm exec nx test probable-waffle-gameplay --runInBand --testPathPatterns='ai-fortification-manager.spec|ai-construction-recovery-proposal.spec|ai-macro-construction.spec|ai-builder-delivery.spec|ai-proposal-reservation-boundary.spec'`
  —5 suites43 tests pass (recovery-authority-gameplay.log).
- Native: `pnpm exec nx test probable-waffle-phaser --runInBand --testPathPatterns='construction-lifecycle.spec|construction-payment.spec|construction-resource-history-lifecycle.spec|construction-resource-history.spec|builder-membership.spec|pawn-construction-order-lifetime.spec|shared-queue-resource.spec|queue-resource-history.spec'`
  —8 suites92 tests pass (recovery-authority-native.log).
- Protocol: `pnpm exec nx test probable-waffle-protocol --runInBand --testPathPatterns='player-payment.spec|player-resource-observation.spec|player.spec'`
  —3 suites13 tests pass (recovery-authority-protocol.log). Total16 suites148 controls,148/148(100%),0 failing.
- All three project lints pass: recovery-authority-lint.log plus final affected gameplay rerun
  recovery-authority-final-gameplay-lint.log and recovery-authority-final-native-lint.log.
  The intermediate gameplay syntax/lint failure was repaired before those final reruns. Actual source typing passes:
  `pnpm exec tsc -p apps/portal/tsconfig.app.json --noEmit` (recovery-authority-types.log).
  Native lint retains eight unused-disable warnings in unchanged, task-unowned files; no lint errors remain.
- recovery-authority-source.json records ordered path/NUL/bytes/NUL SHA256 and source base. The owned-path manifest
  excludes unrelated run/fog edits. Formatting and staged diff checks pass; containing publication/remote SHA is verified
  at delivery, not embedded self-referentially here.

### Omission Audit

All five selected items have wired owners and focused evidence. Shared placement/arbitration, native definitions,
configured costs/refunds, cargo ownership, healthy partial work and old-save compatibility were reviewed. Component
cancellation restore is covered; full replay/multiplayer remains open. Inventory registration counts stay unchanged;
owner regressions are not runtime recipes. M11 Stage32/36 obligations require unrestricted aliases/replacements,
net-zero undo and continuous access/safety history; missing observable boundaries remain explicit. No complete/useful
metric channel is asserted. No skill/tool change was warranted.

### Final Closure Audit — focused implementation checkpoint

Rechecked current effect/claim consumers, cancellation reentry/failure/restore, membership mutations and native payment
admission after repairs. Selected16 suites148 tests, scoped lint, actual source types and formatting pass. No required
focused failure remains. Full-match/broad regression and package-level acceptance remain deferred. Next batch groups
remaining placement/expansion/fortification scenario setups with interrupted construction/queue/research continuation.
Machinery necessity/removal stays last. Publish only owned files, verify remote, report and pause.

## Historical grouped combat, construction and resource correctness — 2026-10-17

Base5478ae7cd0a773cf4c68f33d17113ce61f10a443. User defers full-match victory reruns and broad regression.
No browser match/server was started; actual model/effort unknown. All logs below are ignored under
tmp/ai-plans/759-validation/. Publication follows focused evidence; no raw report or new machinery was needed.

### Acceptance map and evidence

1. **Readiness:** select-ai-offensive-force checks each origin/domain and combines independently direct cohorts.
   Disconnected reinforcements do not inflate readiness; transport routes remain executable per cohort; ground
   anti-air can target a flyer. Only compatible hostile weapons inflate counterforce. Published selector fails4/4
   route controls (force-routing-published-before.log); final five pass. Developed-base control retains the eight-unit
   requirement and three home reserves while launching eight mixed-domain members.
2. **Continuity/combat:** useful progress protects mission members from quiet reserve during a native job gap until
   the existing deadline. mission-reserve-before.log:1red/8green; final passes. Tactical ranking/commitment rejects
   untargetable and known blocked/failed objectives, retaining shots already in range. Initial eligibility3red;
   final five pass. Existing retreat, counterforce, reinforcement and domain-projection controls are included.
3. **Construction:** recovery chooses a reachable compatible worker, reclaims cancelled/finished jobs and stops a
   known impossible Build when reassignment is unavailable. Assigned/loaded/busy/automatic/finished negatives remain.
   Initial cancelled-job regression fails; final ten recovery controls pass, including missing advisory regions.
   Native construction payment rejects
   synchronous reentry; source-payment-before.log reproduces the duplicate-charge risk. Affordability, callback-visible
   pre-payment state, denial/retry and ordinary native cancellation controls remain intact.
4. **Food:** unchanged. Retained match food327.68/min,90 stock and empty queues does not establish starvation.
   Native field harvest/growth/cargo/return controls pass; yield, worker capacity, costs and stats stay unchanged.
5. **Resource correctness:** drain validates surviving physical endpoints and recipient after waiting, locks repeated
   carrier returns and respects unload capacity. Outdoor drains advertise service without a container. Source/drain
   slots release after entry/wait/exit failures; invalid amounts are rejected; extraction cannot deduct stock after
   endpoint loss. Lost drain/recipient returns zero, preserving surviving cargo. Initial drain11red; final13 pass.
   Existing converted-owner/campaign policy is retained. M11 alias/net-zero/restore authority remains open.

### Focused commands and provenance

- `pnpm exec nx test probable-waffle-gameplay --runInBand --testPathPatterns=...`: ten selected specs cover offense
  routing/recovery, construction recovery, target eligibility, tactical combat, squad projection, skirmish offense,
  macro construction and builder delivery: **10 suites82 tests pass** (continuity-resource-gameplay.log).
- `pnpm exec nx test probable-waffle-phaser --runInBand --testPathPatterns=...`: twelve selected specs cover drain
  lifetime/credit/history, source history, construction payment/lifecycle, gatherer execution/source switching/food,
  shared queue resources, pawn construction order lifetime and drain loss: **12 suites91 tests pass**
  (continuity-resource-native.log). Both logs retain the exact copyable selectors.
- Both project lints pass (continuity-resource-lint.log); final helper revision passes affected gameplay lint
  (continuity-resource-final-gameplay-lint.log). Actual source typing passes:
  `pnpm exec tsc -p apps/portal/tsconfig.app.json --noEmit` (continuity-resource-final-types.log).
- SHA256 over17 ordered owned non-Markdown paths, each path + NUL + bytes + NUL:
  `93e188f0482bfb776d179e091843ea7cab4df2d7b2bad69cc8a756fda2a29c55`.
  continuity-resource-source.json excludes the unrelated run configuration and ALL_VISIBLE fog edits.

### Omission Audit

All five selected areas have implemented/focused-evidenced repairs or an evidence-based no-change decision (food).
Actual macro/skirmish/tactical/shared native consumers are wired; no scaffolds, new scenario IDs, saved/wire fields
or diagnostic expansion. Cargo, healthy work, retreat, firing range, reserves, affordability and campaign policies
have controls. Arbitrary aliases, mutation-complete resource history, restores and integration remain explicit gaps.

### Final Closure Audit — implementation checkpoint; release gate deferred

**173/173 focused controls (100%),0 failing across22 suites.** Owned formatting/diff/staged scope checks precede
commit/push/remote verification. This is not scenario/package/global AI completion. Historical production8/8,
economy16/16, selected native7/8 and full victories1/2 belong to their earlier source; affected native rechecks and
victory remain user-deferred. Next implementation combines placement/fortification/recovery and remaining resource
boundary gaps, reusing existing coverage. Multiplayer/save/lifecycle/calibration and machinery review remain open;
machinery review stays last. No skill/tool change justified. Publish only owned work and pause.

## Historical housing, worker recovery and combat batch — 2026-10-17

Published base50266799471a2804243bd147a759deca2873c150; mechanical4d75589aa and behavior5478ae7cd were published
before the current batch. Artifact paths below are ignored under tmp/ai-plans/759-validation/.
Raw native proof stays local; ordinary summaries cap8192 UTF-8 bytes and disclose omissions.

### Implemented behavior and purpose

- Housing fixture workers start on legal cells; replacement physically completes863 before unchanged1200 deadline.
  The five paid outputs, exact one-house payment/count and intact control remain required. An available compatible
  builder resumes abandoned worker-built sites without repayment; automatic construction needs no assigned builder.
- Monotonic order revisions fence delayed construction/movement callbacks. Lost compatible drop-off stops gather/return,
  releases source/container slots and preserves cargo. Immediate-credit sources remain valid. Completed construction
  refreshes source/drain membership through the existing actor index, with listener cleanup and no duplicate counts.
- Fair owned-vision scouting uses real information destinations. Hidden-pair evidence compares exact committed intents
  and permitted inputs until legitimate reveal; H-18 omits only duplicate normalized payload, retaining raw/V2 authority.
- Strategy and tactics retain current goals and disjoint reinforced domain membership. Defense uses actual weapon
  threats; economy avoids exposed harvesting/placement and saves definition-priced reinforcements without abandoning
  survival labor. Missing housing prerequisites fund one legal capacity provider at actual catalog cost.
- Combat estimates combine force damage and durability; an ordinary firing cooldown no longer triggers withdrawal.
  Nearby same-mission domains coordinate estimates. Defense counts toward home reserves. Live native attacks survive
  advisory route rebuilds; distant launches use legal attack-move approaches and direct attacks retain native vision checks.
- Domain children inherit their parent mission's launch permission. Fighting members and distant reinforcements now
  receive independent attack/approach orders; a local damage reservation cannot strand other members. Native attacks
  against visible reachable objectives retain mission commitment instead of being diverted by newly ranked opportunities.
  Tactical retreat, effect deadlines, cancellation and target disappearance remain responsible for release/recovery.
- Shared definition prices: melee food100→60 both factions, Skaduwee archer100→70, Tivara sling120→80; ranged wood25.
  Before this adjustment delivered food168–262/min supported1.7–2.6 melee/min. No worker/building price, combat stat,
  training time, yield or prerequisite changed. Field yield/worker-capacity changes are authorized if fresh evidence
  identifies food as the bottleneck; current food323–346/min and idle/diverted forces prioritize order ownership first.

### Current evidence and remaining outcome

- Package1 retained8/8 and Package2 rechecked16/16 (100% each); affected native economy/composition/scouting pass.
  Full-match gate retains1/2 factions passed (50%),1/2 remaining. Broader Package3 is open; no overall AI percentage.
- Seeded continuous IDs and timer-independent paths agree through2000 coarse/fine checkpoints:
  initial fnv1a32:7a156db3; opening SHA256 c1bb249ea07b21baa51e746de6fb1f6cc3c7954aaa0bc98ac142253e6975ce49.
  continuous-cadence-after.log passes. Earlier salted-ID/timer-sensitive runs remain historical evidence only.
- domain-launch-victory-resumed-native/1792250765990-failed.json: Tivara wins6000; Skaduwee8 workers/9 army,
  36 produced,345.63food/min,4379damage/11 enemy losses; only victory missing. Dirty1f40b206, fixture0c6acf03,
  900 decisions/18000 ticks,209975ms. Ground child engages, proving the former assemble deadlock is gone.
- Bounded committed-input replay shows distant reinforcements idle while nearby members have damage reservations.
  reinforcement-approach-before.log:1red/19green; repair plus active-front-attack negative gives20green.
  reinforcement-approach-ai-controls.log:82 suites409 pass; lint/app types and selected29 pure IDs pass.
- reinforcement-approach-victory-native/1792261075135-failed.json: Tivara wins6000; Skaduwee8 workers/11 army,
  35 produced,323.02food/min,5907damage/17 enemy losses; only victory missing. Dirtyde29360a, fixture0c6acf03,
  900 decisions/18000 ticks,292385ms. At12000 Sandhold342permille is abandoned for WatchTower while its native
  damage orders are cancelled. Live-objective regression fails before repair; inactive/destroyed-target negatives pass.
- live-objective-grouped-native/1792262521219-failed.json passes7/8 selected rows (87.5%): PRO-04 (eight worlds),
  ECO-05/06/07/08,H-18,SCOUT-05. Only SEQ-01 fails. Work3130 decisions/62602ticks;1205426ms; dirtyb3fa0872,
  fixture5df422ef. Tivara wins6000; Skaduwee8 workers/13 ground army,36 produced,355.88food/min,4852damage/12 losses.
- Read-only live-objective-input-probe.json captures permitted inputs6000/8000/10000/12000; bounded tactical/selection
  replays pass. Its separately sampled trajectory differs from the official match, so it is causal input, not evidence
  that the full late match is deterministic. The original checkpoint cadence/seed/deadline assertions stay unchanged.
- Progress-continuity extension retains useful effect through a job gap until the existing effect deadline.
  progress-objective-before.log:1red/7green; progress-objective-ai-controls.log:82 suites415 pass. Lint/app types and
  progress-objective-final-pure selected29 IDs pass. No new saved field or timer; missing/expired targets release.
- progress-objective-victory-native/1792264457766-failed.json: Tivara wins6000; Skaduwee8 workers/8 ground military,
  35 produced,327.68food/min,5059damage/13 enemy losses;90food and empty producer queues. Only victory missing.
  Dirty79042edc, fixture0c6acf03,900 decisions/18000ticks,211824ms. This result does not close the batch.
- Retained unaffected controls: native lifecycle/navigation20 suites167; graph/vision/navigation5 suites9;
  interface2 suites7; reader9/report-budget9; mechanical extraction60 parity cases. Graph4096cell budget finishes
  supported50×50 maps; larger-map continuation stays bounded. This has red/green controls and a brief native timing
  sanity observation only; no performance suite is scheduled. Standalone Phaser's eight known type errors are not clean.

### Omission Audit — final native closure pending

1. Housing/payment/deadline: legal paired fixture and physical completion evidenced; H-18 fresh recheck passes.
2. Cancellation/site recovery: macro recovery registered after opening; actual builder catalog and callback generation
   owners covered, including busy/cargo/replacement/automatic-site negatives. No speculative movement fallback retained.
3. Lost deposit: shared pawn behavior validates before walk/tend/extract, Stop releases membership once and retains cargo;
   immediate credit, delayed replacement order, compatible alternate drain and index destruction controls pass.
4. Economy/technology: rechecked16/16; changed shared prices/owners pass the grouped affected native gate.
5. Fair scouting/commands: owned vision and exact paired readers covered; native target visibility unchanged.
   SCOUT-05 fresh pair passes; no broader SCOUT-family completion claimed.
6. Combat/access/victory: actual call sites, domain launch/merge/projection, force estimate, order continuity, mixed-cohort
   advancement and live-target commitment have typed controls. Both-faction authoritative victory remains mandatory/open.
7. Balance/report scope: shared four definition values apply to human/AI; PRO-04 eight composition worlds pass. Raw proof is ignored,
   model-facing reads bounded. No new diagnostics architecture, profiling suite, subagent, chat, goal or automation.
8. Delivery: exact task-owned scope only; exclude .run/start_portal.run.xml and ALL_VISIBLE fog edit. Managed server95532.
   Final Closure Audit, final provenance/format review, stop, commit/push and remote equality remain pending.

## Final Closure Audit — checkpoint publication, batch not complete

- Implementation review followed the shared resource, construction, strategy, tactical and projection owners and their
  callers. New production helpers are registered; typed positive/replacement/cancellation and ownership controls pass.
  Separate Omission Audit above keeps every mandatory user requirement visible.
- Housing/site recovery, dead-drop-off cleanup, report bounds, composition and fair hidden-pair work have focused
  evidence and the retained grouped native passes. Package1 remains8/8; Package2 retained16/16; selected native rows7/8.
- **Required failed gate:** SEQ-01 Skaduwee authoritative victory remains absent at12000. Tivara wins; full-match gate1/2.
  Focused controls and greater damage do not satisfy victory. Broader Package3 and the authorized continuous batch remain open.
- Source/fixture provenance is recorded above and in HANDOFF. Latest task-source SHA256
  e0c2202abf5660a0bd56399dc7dac989d32a9ca7f7261f50f4adda2a54e177f6,110 non-Markdown paths/118 total owned paths.
  The two unrelated portal-launch/fog edits are excluded. Raw reports remain ignored and outside model context.
- Publication is an in-progress checkpoint under the requested commit/push policy, not a release-ready result.
  Pause at the user's stronger-reasoning boundary; recommend Sol6.1/high for early force/route selection and native
  mission continuation together. No further economy rebalance without a demonstrated delivery/queue bottleneck.
- Before publication: scoped format, catalog, diff/staged-scope review and managed-server stop. Verify remote equality
  after the normal push; no PR, force-push or merge. HANDOFF owns the next concrete causal pass.

## Historical published economy checkpoint

## Native delivered income and economy recovery — 2026-10-16

Tested base: `34d58154f769cc07b7db2d5df624f808b4d9c3bb` plus this checkpoint's task-owned source.
**Package2:15/16 passed (93.75%);1/16 remaining (6.25%): H-18 failed; no unavailable native setups.**
Package1 remains8/8. Newly passed ECO-05/06 and H-16 join unchanged ECO-01–04/TECH-01–06 and rechecked ECO-07/08.
All short artifact paths below are ignored under `tmp/ai-plans/759-validation/`; they are local evidence, not committed
product assets. Prior sections are historical checkpoints and retain their original counts/failures.

### Changed behavior and purpose

- `creditGatheredResource` reports confirmed native harvest credits to the scene's economy manager. Grants/refunds,
  starting cash and purchases cannot create or subtract delivered income. Sampling retains existing units/smoothing;
  restore resets derived estimates and shutdown detaches the subscription. This does not close Package5's full native
  exactly-once/save/replay obligations.
- Native extraction/return exposes in-flight ownership; owned observations expose exact cargo even when its type clears.
  Planner/recovery owners preserve busy or loaded workers and can move empty excess labor to useful/housing resources.
  Surplus acceptance joins the transferred worker to an actual positive receipt, not just an issued order.
- Immediate crop credit retains the source ownership component across extraction, because depletion can destroy the
  source. Neutral crops credit the carrier; owned sources retain their live beneficiary. No costs, yields or times changed.
- ECO-05/H-16 use four physical shared-budget/surplus/poor-delivery worlds. ECO-06 uses actual partial cargo2/capacity3,
  pinned drop-off destruction at160, a surviving alternate drain, depleted source reacquisition and crop growth/credit.
  Pre-tick `sourceStocks` sets native components; it does not inject cargo or future income. Initial Gather orders permit
  neutral or same-owner sources, never enemy sources.
- Existing opt-in decision input now retains its consumed four-resource vector. Economy readers use it for aggregate
  cash admission, plus scoped native receipt facts. This is narrower than complete production/M11 authority; broader
  alias/lifetime coverage remains partial. New economy worlds retain raw capture, avoiding duplicated full V2 payloads.

### Native evidence and remaining failure

- `delivery-economy-native-final/1792135048123-failed.json`:4 worlds,240 decisions/4800 ticks,214691ms;
  dirty `fnv1a32:5900562f`, fixture `fnv1a32:97facfe0`. No AI errors. ECO-06/H-16/surplus pass directly.
  The original budget reader incorrectly required an arbitration rejection, although housing preservation suppresses
  competing optional Fields before arbitration. It stays failed; do not relabel this artifact.
- `delivery-economy-native-rechecked.json` reruns all three ID-specific readers on those retained native facts and passes.
  Budget proof requires competing positive priced demand, at least one admitted funded purchase, and every aggregate
  selected claim within actual cash minus reservations/due obligations. No floor/deadline/cash ceiling was weakened.
  Reader SHA256 `290714bae45eec1bf13fbb84df5f889d27d2006dd699775bc5645d212676570d`.
- `delivery-opening-housing-final/1792135514118-failed.json`:13 worlds,1770 decisions/35402 ticks,344719ms;
  dirty `fnv1a32:5697a4a3`, fixture `fnv1a32:b221ef1e`. ECO-07's6 and ECO-08's5 worlds pass, including both ordinary
  openings and three workforce-growth repetitions. H-18's intact control and all five paid outputs pass.
- H-18's subject now accumulates100wood and places `sim-c0e67d3f` at33,16 on860. Assigned worker `sim-23746d63`
  remains at33,18, with no Build order at880–1040; replacement stays0% at1201. The command reports active
  `construction_started` without subsequent native construction lifecycle progress. Preserve the1200 deadline.
  The next repair must trace shared CONSTRUCT → ActionSystem Build → pawn cancellation/order handoff and existing-site
  reassignment. Root cause is not yet established; do not assume another discount or a generic movement rewrite.
- Earlier housing/ownership, malformed seeded queue, oversized full-proof serialization, crop-owner and obstructed
  carrier runs remain failed diagnostic attempts. They do not count as gameplay passes. The corrected crop beneficiary,
  legal starting positions and bounded raw capture are covered by the retained final worlds above.

### Checks and audits

- `delivery-package-pure/1792133655340-passed.json`:28 suites/133 tests, all16 selected IDs executed.
  `delivery-final-phaser-controls.log`:9 suites/93 tests; `delivery-oracle-final-controls.log`:4 reader controls.
  `delivery-native-recheck.log`:retained-world reevaluation passes. `delivery-tools-final.log`:8 tool controls pass.
- App/gameplay/E2E types pass (`delivery-final-{app,gameplay,e2e}-types.log`); final reader types pass
  (`delivery-oracle-final-types.log`). Scoped lint passes with existing warnings; standalone Phaser's eight known
  baseline type errors remain outside this gate. Catalog, changed-source format and whitespace checks recorded at close.
- Omission Audit: production credit callers, beneficiary/object identity, reset/shutdown, cargo/busy projection privacy,
  all three manifest/recipe/assertion registrations, negative receipt/budget/history readers and raw/full capture routing
  are connected. Package5 authority, multiplayer and arbitrary lifecycle correctness are explicitly not closed.
- Final Closure Audit: three previously unavailable outcomes now pass; H-18 is an explicit failed acceptance criterion,
  so Package2 remains open. No new observer/profiler architecture, balance change, deferred island expansion or unrelated
  Nx work was added. Publish this checked partial checkpoint; resume the named builder-handoff repair before Package3.
  Source SHA256 provenance is retained in `delivery-final-source-sha256.json`. Final E2E types/lint pass in
  `delivery-close-e2e-{types,lint}.log`; changed-source formatting passes in `delivery-close-format.log`.
  Managed server PID46372 was stopped through `agent:process`; no native run remains active. Commit/push the exact
  task-owned checkpoint, verify remote equality and pause. Next resume verifies the containing commit rather than
  relying on a self-referential SHA in this record.

## Fixed-frame opening and funded supply recovery — 2026-10-16

Tested base: `d4ef507a2e858c4ef2b60b93dea0a9cea77f9faa`, plus this checkpoint's source, recipes and tests.
**Package 2: 12/16 passed (75%); 4/16 remain (25%): H-18 failed, ECO-05/06 and H-16 lack native setups.**
Passed IDs: ECO-01/02/03/04/07/08 and TECH-01–06, combining the unaffected earlier evidence below with this gate.
All short artifact paths below are ignored under `tmp/ai-plans/759-validation/`.

### Authored behavior and purpose

- **Native pacing:**100x render frames emitted many simulation ticks before asynchronous movement/resource actions
  could settle. Exact checkpoint pauses alone did not solve this distortion. Opted-in recipes now drive complete50ms
  native Phaser headless frames and yield between them. Ordinary gameplay is untouched; existing scene timers,
  pathfinding, physics and shared commands still run. This proves fixed-frame repeatability, not arbitrary rendered
  cadence or multiplayer equivalence.
- **Housing savings:** extra60-wood Fields repeatedly consumed cash before it reached the100-wood housing price.
  Additional Fields/Granaries now preserve the catalog-priced unmet housing cost. First usable food access remains
  eligible; already committed housing, unspent claims and due obligations count once. No new saved state, subscription
  or payment owner. No prices, yields, times or combat values changed: evidence identified spending priority as the cause.
- **H-18 physical proof:** the paired recipe starts with genuinely ample macro-buffer supply, five natively paid queue
  items and100wood, then destroys one pinned house only in the subject. The reader checks closed history, setup cash
  debit, item/producer/product/output identity, distinct physical completions, native cancellation records and exactly
  one completed replacement. The intact control must avoid speculative housing. Seeded shared-controller items lack
  AI-selected effects, so their completions join the existing native capture channel directly.

### Retained causal runs and limits

- ECO-08 before housing savings: `recovery-fixed-frame-complete/1792083018841-passed.json`, five worlds,
  750 decisions /15000 ticks,125803ms; dirty `fnv1a32:44ffc24d`, fixture `fnv1a32:e7bb305a`.
  Both normal200-resource openings finish military infrastructure by unchanged3000 and retain6 workers; three growth
  repeats all retain13 workers /4 military with identical digests. Earlier single rendered fixed-frame diagnostic:
  `recovery-fixed-frame-opening/1792082822589-diagnostic_passed.json` (producer complete1760).
- H-18 pre-repair: `recovery-paid-supply-ample/1792095634090-failed.json`,120 decisions /2402 ticks,114112ms;
  dirty `fnv1a32:c03f241f`, fixture `fnv1a32:9eb3360d`,188405584bytes (below unchanged256MiB ceiling).
  All paid outputs and the ample control pass; subject housing recovery fails because optional Fields consume savings.
  The run stays failed. Earlier zero-grant configuration rejection supplied no runtime evidence; a force quit interrupted
  the first corrected attempt without a retained result. Neither counts as a gameplay outcome. Another early run used
  insufficient control supply and omitted controller-seeded completion joins; both setup/reader errors were corrected.
- Final grouped native evidence: `recovery-savings-native-final/1792130020313-failed.json`,21 distinct worlds,
  2010 decisions /40202 ticks,471093ms; dirty `fnv1a32:ced95cf0`, fixture `fnv1a32:86ed3d20`.
  ECO-07's6, ECO-08's5 and PRO-04's8 worlds pass. Both ordinary openings and all three identical growth repeats pass.
  H-18's paid outputs and intact control pass; the subject still lacks a replacement by1200. One Field spends60wood
  before loss at200; after loss, the savings guard prevents more optional Fields but cash reaches only90 at1201.
  No deadline/price change masks this real remaining income/gathering recovery failure. Raw runtime185753365bytes
  remains below the unchanged ceiling. The cancellation-aware final reader rechecks the same retained facts:
  `recovery-final-h18-reader.json`; only the missing replacement fails. No expensive native repetition was needed
  for that reader-only hardening. Production remains8/8; Package2 does not advance.
- **Next causal owner:** `ai-behavior/economy-manager.ts` measures net stockpile change while
  `player-ai-agent-context.ts` exposes it as delivered income. Grants inflate it and purchases reduce it. Group actual
  native receipt accounting with ECO-05/H-16 controls, ownership/save/restore and cleanup. ECO-06 still needs loaded-cargo,
  depleted-source, destroyed-drop-off and crop-growth native recovery. No unproven cases are closed.

### Checks and closure status

- Selected16-ID pure gate: `recovery-savings-pure/1792129506251-passed.json`,27 suites /127 tests, all16 IDs
  executed. Final typed resource-authority fixture:4 tests pass (`recovery-authority-final.log`). Housing/food controls:
  5 suites /30 tests (`recovery-housing-savings-after.log`); a pre-repair control demonstrates extra-Field starvation.
- E2E frame/supply readers:8 pass (`recovery-final-oracle-audit.log`), including native cancellation despite a completion,
  wrong scene/producer, restore, missing history/payment, duplicate output and absent replacement. Actual supply recipe
  validator:2 pass (`recovery-fixture-validation.log`), including zero-grant rejection.
- App/gameplay/E2E types pass (`recovery-final-{app,gameplay,e2e}-types.log`); final reader E2E types pass
  (`recovery-final-audit-types.log`). Scoped gameplay/Phaser/E2E lint passes; two pre-existing supply-reader non-null
  warnings remain. Standalone Phaser retains the previously documented eight baseline errors; no new broad rerun claimed.
- Matrix/catalog/metadata controls:8 pass (`recovery-final-tools.log`); catalog checked. Changed source/new JSON
  formatting passes (`recovery-final-format.log`); unrelated compact manifest rows retain their layout.
- Omission Audit: runner checkpoint/event paths use the same opt-in frame driver; H-18 registration, recipe validation,
  payment/completion/cancellation joins and food-admission test mapping are connected. Loaded/returning workers retain
  existing ownership. Page teardown closes test frame driving; savings adds no state/listeners requiring save/disposal.
  The three missing native setups remain explicit; no observer/profiler or skill expansion was added.
- Final Closure Audit: all batch obligations are implemented/checked or explicitly remaining. ECO-08 closes; H-18's
  failed physical recovery and three missing native setups stay open. Payment joins, food exceptions, immediate callers,
  ownership, registrations, immutable deadlines, byte cap and task-only scope reviewed. No unrelated Nx ancestry changed.
  No machinery-removal gate was moved forward. Final checked23-file content SHA-256: `b80b5206e76461611450555ef3a0ce696eb8b34e1f2ffc5c5a3045d39a9bd8e2`;
  exact paths/hashes in `recovery-source-provenance-final.json`, excluding this plan directory/generated catalog.
  Publication is the containing checkpoint; verify its HEAD against the remote. Native server is stopped at publication.

## Previous economy/technology checkpoint — 2026-10-15

**Package 2: 11/16 outcomes passed (68.75%); 5/16 remain (31.25%): one failed outcome and four unavailable native setups.**
Passed: ECO-01/02/03/04/07 and TECH-01–06. Failed: ECO-08. Missing native: ECO-05/06, H-16/H-18.
Tested base: `f3c5dd458ec72404c77b7ca050e86a1fceef3f5b` plus this publication's source/tests/fixtures.
No prices, harvest yields, construction times or combat values changed. This is a partial package checkpoint;
Package 3 has not begun. All short artifact paths below are ignored under `tmp/ai-plans/759-validation/`.

### Authored behavior and purpose

- Both faction openings secure the Granary before military infrastructure. Priced outstanding opening work informs
  workforce growth; two workers can bootstrap one Field, and ready Fields can be staffed before military construction.
  Food claims precede general gathering; all earlier actor claims are excluded from later gathering/housing selection.
- Unaffordable new opening construction keeps its demand but does not claim a worker needed to gather missing wood.
  Initial supply accepts existing ready capacity covering current/queued population plus one spare slot; historical
  checkpoint completion does not suppress later necessary housing. Housing requires a capable, unclaimed builder.
- Public visible air-production capability admits one precaution; distinct confirmed flyers scale the counter target
  up to six. Cooldown gates target changes rather than filling an admitted deficit. Native output joins accepted
  counter intent, legal product, producer and actual queue completion; planner targets alone cannot pass.
- A pause inside a multi-tick render frame now stops additional ticks while retaining accumulated time. The runner
  pauses through the existing tick stream at exact requested ticks (horizon + 1 for a closed authority prefix).
  Manual/lockstep tests preserve other pause reasons and subscriber delivery; no observer architecture was added.
- Clean-map supply/opening setups remove inherited campaign main buildings. Finished starting houses are not new
  construction attempts. Technology recipes use legal prerequisites, inherited starting-army identity and an actual
  armoured FrostForge. ECO-08 requires delivered food alongside a ready owned Field, projected from existing resource
  observations; the score's collected-food metric is not reliable proof for this Field path.

### Accepted evidence union and exact limits

| IDs                  | Evidence / outcome                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ECO-01/02/03         | `economy-and-armour-regression/1792079799788-failed.json`: all three pass across retained resource-service/saturation worlds. That grouped command failed the then-overshooting ECO-04 digest; it is not relabelled passed.                                                                                                                                                                                       |
| ECO-04               | Final `economy-supply-opening-final/1792082168359-failed.json`: all three exact-tick repetitions pass. Earlier exact-tick pass also retained at `exact-tick-economy-closure/1792080596968-failed.json`.                                                                                                                                                                                                           |
| ECO-07               | Final grouped command above: six clean-map shortage/control worlds pass; no unnecessary control housing.                                                                                                                                                                                                                                                                                                          |
| ECO-08               | Final grouped command: renewable food succeeds in all five worlds, but both ordinary starts miss first-producer completion by 3000. Both have four workers, 20 food, 110 wood; Granary completes640 and Field is ready900. The three growth repetitions complete the producer500 and retain8/9/8 workers; their outcomes diverge after900 despite exact ticks. Deadline, growth and determinism remain unchanged. |
| TECH-01/02           | `technology-research-matchup-final/1792079481748-failed.json`: both pass across three native worlds. One beneficiary withholds research; a large eligible army completes it once; emergency spending delays it until safe. The grouped command's old matchup setup failed.                                                                                                                                        |
| TECH-03–05           | `technology-counter-rechecked.json`: all three pass from four shared native worlds. Counters actually complete; paid output can finish after withdrawal without new stale admissions or gratuitous cancellation. Fresh two-world TECH-03 confirmation is in `exact-tick-economy-closure/1792080596968-failed.json`.                                                                                               |
| TECH-06              | `economy-and-armour-regression/1792079799788-failed.json`: both actual-armour/executable-versus-unavailable counter branches pass. Pure effective/weak matchup and retreat controls also pass.                                                                                                                                                                                                                    |
| ECO-05/06, H-16/H-18 | Native recipes remain unavailable. Their executed pure forecast/housing/service controls do not replace the missing physical budget/depletion/recovery branches.                                                                                                                                                                                                                                                  |
| PRO-04 regression    | Final grouped command: all eight composition worlds pass after shared opening/housing/gathering changes. Package1 remains8/8 validated on the retained production evidence below.                                                                                                                                                                                                                                 |

The final grouped native command executes22 distinct worlds, 2025 decisions /40500 ticks, in215201ms.
Source dirty digest `fnv1a32:78e120ac`; fixture digest `fnv1a32:07739c35`. Its overall status is failed solely on
ECO-08's digest and two opening checkpoints. Later review removes one duplicate identical housing filter and renames
local gathering variables, plus formatting of tests/JSON; no simulated behavior changes after this run.

### Native report size and retained proof

`technology-counter-rechecked.json` re-evaluates
`tmp/ai-skirmish-runtime-results/run-Qoe6mN/runtime.json`: source `f3c5dd458ec7`, dirty
`fnv1a32:1cbf6be4`, fixture `fnv1a32:501c9b4e`, 203 decisions /4095 ticks, required frontiers closed at1000.
The native report says passed, but its outer command rejects the319MB artifact against a256MiB ceiling. The outer
command remains failed. Current-reader reprojection retains the native facts; future full captures use bounded
scenario/variant batches and then check the complete required branches together. The byte ceiling was not raised.

### Checks and audits

- Selected16-ID pure gate: `economy-tech-pure-final/1792081979083-passed.json`,26 suites /118 tests,16 executed IDs,
  none missing. H-16/H-18 now have explicit mappings and TECH-06 an explicit semantic control.
- Affected gameplay:16 suites /70 tests (`economy-gameplay-final.log`). Phaser clock/fixture controls:2 suites /15
  tests (`economy-tech-phaser-controls-final.log`). E2E supply/technology/growth oracles:9 pass
  (`economy-tech-oracles-final.log`), including missing food channel, unfinished Field and wrong-producer controls.
- App/gameplay/E2E type checks pass (`economy-{app,gameplay,e2e}-types-final.log`). Standalone Phaser retains the
  same eight baseline errors (`economy-tech-phaser-types-final.log`, compared to
  `certification-phaser-type-baseline.json`); no task-owned error remains. Scoped gameplay/Phaser/E2E lint passes;
  E2E retains two existing non-null warnings in the supply reader.
- Matrix/catalog/metadata tools:8 pass (`economy-tech-tools-final.log`); result/contract tools:11 pass
  (`economy-tech-fixture-tools-final.log`). Catalog regenerated and checked. Formatting and diff whitespace checked.
- Omission Audit: selected16 IDs are mapped to actual pure/native evidence or the four explicit missing setups;
  dispatch, desired counts and partial branches do not close native acceptance. Shared callers, registrations,
  faction legality, negative controls, pause subscription/page teardown and existing-capture reuse reviewed.
- Final Closure Audit: Package2 stays open at11/16; no thresholds weakened, no new machinery, unrelated migration
  ancestry preserved. Only task-owned source/tests/fixtures/docs publish. Final checked 43-file content SHA-256: `2479a6dae0a7c25f3c9f0f34d00b3797b0684a31cab0734752cbba6cf987c955`. Exact paths/hashes are in the ignored
  `economy-tech-source-provenance-final.json`; excludes this plan directory and the generated catalog.

## Production checkpoint — 2026-10-15

**PRO-01–07 and H-17: 8/8 required scenario outcomes pass (100%); 0/8 remaining (0%); no unavailable setup.**
This closes production, not the overall AI roadmap. Evidence combines 31 distinct native outcomes and all eight
ID-specific pure assertion groups. H-17 shares four existing future-demand worlds; it adds no redundant native runs.

Tested base: `ca0e3cac06915c8cde4659b9739820a3a511396e`, plus the containing commit's tests/readers/fixture changes.
No AI production policy, queue/spawn authority, movement implementation or balance values changed in this batch.
Final checked 26-file source/fixture/test diff SHA-256: `17d4e35246dd5b717e96e6b9344743a84588836bbd0c6c2b1153871f89161662`
(excludes this plan directory and the generated catalog); exact paths are in `certification-source-provenance.json`.
Native source/fixture identities remain those embedded in each raw artifact; final assertion guards/formatting do not
change their simulated worlds.

All following artifacts are ignored under `tmp/ai-plans/759-validation/`; no raw captures/logs are committed.

| IDs          | Outcome evidence                                                                                 | Status / exact limits                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRO-01/02    | `production-certification/1792041441642-failed.json`: four shared capacity worlds, both factions | Both scenario predicates pass. That grouped command failed solely on the old PRO-04 setup; do not relabel its process result as passed. PRO-01's full dated-force delivery also reuses the retained PRO-03 future-committed worlds.                                                                                                                      |
| PRO-04       | `production-composition-corrected/1792041648788-passed.json`                                     | Fresh eight-world command passes; 246 decisions, 4984 ticks, 81 seconds. Target 12, two new useful copies, horizon 600 and stable retention 200 remain. Fixture digest `fnv1a32:aad05935`, runtime dirty digest `fnv1a32:4a2d6fcf`.                                                                                                                      |
| PRO-05       | `production-certification/1792041441642-failed.json`: three native producer-loss repetitions     | All three repetitions pass their native replacement predicates. Both-faction pure controls separately cover the one-to-three capacity transition, 100 decisions after fulfillment, duplicate/late callbacks and one necessary replacement.                                                                                                               |
| PRO-03/06/07 | `staging-combined-results.json`: 16 authority worlds and all three pair gates                    | Retained unaffected evidence. The last checkpoint's two contention runs use permanent housing rallies/contact-range movement; the other 14 worlds use unchanged semantics. Original provenance is in their raw setup and Git checkpoint `ca0e3cac0`.                                                                                                     |
| H-17         | `certification-retained-worlds.json`                                                             | Reprojection of four retained future-demand worlds through current H-17 predicates: four pass, both pair gates pass. Abandoned at 320; paid Tivara producer finishes at 553, Skaduwee at 629, with no obsolete producer/product admission. Both ground/water blocked-spawn, failed queue terminal/next-output and pure lease-cleanup controls also pass. |

Fresh grouped command:
`node tools/ai/run-skirmish-matrix.mjs --scenarios PRO-01,PRO-02,PRO-04,PRO-05 --mode runtime --output tmp/ai-plans/759-validation/production-certification`.
Affected rerun:
`node tools/ai/run-skirmish-matrix.mjs --scenario PRO-04 --mode runtime --output tmp/ai-plans/759-validation/production-composition-corrected`.
Summaries use `node tools/ai/summarize-skirmish-report.mjs --report <path> --failures-only --details`.

## Changes and causal evidence

- The old composition setup added ten/twelve authored troops on top of the normal starting soldier. Checkpoint 20
  already had eleven/thirteen; those were initial units, not newly trained output. A checked `starting-army` binding
  now replaces one authored troop, and the outcome reader counts that real inherited identity. An undeclared extra
  actor still fails. Strict faction/roster checks run before tick zero.
- Old producers at `1000,480` and `1000,1150` repeatedly failed native spawns. They now occupy `800,848` and `800,1152`
  in the established test area; all eight corrected runs deliver the required output or correctly retain their control.
  Pure scenario targets, prices, matched balances, queue provenance and native oracle thresholds stay unchanged.
- New capacity controls exercise both factions through actual macro/brain admission, with callback duplication,
  delayed site visibility and late earlier-sequence callbacks; three deterministic repeats agree. H-17 fails an
  actually admitted output, releases its lease and prevents obsolete work after demand withdrawal. Native tests also
  require null spawn/no created actor, exactly one failed queue terminal, then a distinct successful next completion.
- PRO-07 now maps to the existing independent slot/resource/refund admission controls and a 100-decision compatible
  queued-counter control. These pure controls supplement, rather than replace, four retained native authority worlds.
- A pre-existing capacity-priority fixture omitted required `growthReadyTick`. It now explicitly marks that value
  unknown; its builder-priority semantics and both-faction assertions still pass.

## Checks and audits

- All-production pure matrix `--scenarios PRO-01,PRO-02,PRO-03,PRO-04,PRO-05,PRO-06,PRO-07,H-17 --mode pure`:
  **23 suites / 104 tests pass**, all eight IDs have executed assertions, no missing IDs.
  Artifact: `production-certification-pure-final/1792041666690-passed.json`.
- Final capacity/capacity-priority Jest: **2 suites / 8 tests pass** (`certification-capacity-final.log`). Native spawner
  plus shared-queue controls: **2 suites / 16 tests pass** across the retained spawner and final queue results
  (`certification-spawn-controls.log`, `certification-queue-final.log`).
- Focused Playwright oracle controls: **14 pass** (`certification-reader-controls.log`); the final affected composition-reader rerun also passes all nine controls
  (`certification-composition-reader-final.log`). Fixture/catalog/pure-evidence
  Node controls: **23 pass** (`certification-tools-final.log`). These are synthetic/tool controls, not additional matches.
- Portal application, gameplay and portal-E2E TypeScript configs pass (`certification-app-types.log`,
  `certification-gameplay-types-final.log`, `certification-e2e-types-final.log`). Standalone Phaser types still report the same eight previously proven baseline diagnostics, with no new ones
  (`certification-phaser-types.log`, `certification-phaser-type-baseline.json`); that extra config is not a pass.
- Catalog generation/check, owned ESLint (zero errors, one pre-existing non-null warning), diff checks and exact staged review complete at publication. No production
  build or full-manifest release/calibration run is claimed. The owned managed server is stopped.
- Omission Audit: every selected ID is registered and connected to semantic assertions; native identity, full horizons,
  both required factions, delayed/negative/recovery controls and retained-source equivalence are accounted for.
  Final Closure Audit: only changed readers/fixtures/tests/docs publish; historical failed PRO-04 evidence is superseded,
  unaffected predicates remain retained, and no unrelated gameplay/migration changes are staged.

## 2026-10-26 STRAT-09 capture transport and Skaduwee closure

- Runs 777–783 repeatedly timed out before returning authority captures. Runs 783/784 reached tick 4,000; 784 traced advance, settle, checkpoint, economy, strategy and transport as complete, leaving the final production capture boundary.
- Run 785 bounded that final `page.evaluate` at 120s. Run 786 proved capture internals completed (reconcile 1ms, snapshot read 2ms, clone 3ms, proof read 403ms, filter 2ms, final clone 4,195ms) with 22,510 owner facts, but the Playwright result transfer stalled. Both are harness failures, no gameplay evidence.
- Browser gzip + Node inflate was committed as `5f8356a3e`. Run 787 returned the complete record in 12s; its horizon stop at tick 4,000 intentionally failed closed-history checks and exposed 1,995 AI / 257 opponent fact drops.
- The shared fact cap increased from 24,576 to 32,768 in `fa9faa363`; the focused overflow-boundary Jest spec passes. Full horizon run 788 passes Skaduwee denial at 200 decisions / 4,001 ticks (8 workers, 2,410 damage, 8 enemy losses). Run 789 passes Skaduwee path-outage (8 workers, 2,244 damage, 9 enemy losses).
- Artifacts: 785 `tmp/ai-skirmish-matrix/785-package3-strat09-skaduwee-denial-production-trace/1793033264306-failed.json`; 786 `tmp/ai-skirmish-matrix/786-package3-strat09-skaduwee-denial-internal-capture-trace/1793034162502-failed.json`; 787 `tmp/ai-skirmish-matrix/787-package3-strat09-skaduwee-denial-compressed-capture/1793034463190-diagnostic_failed.json`; 788 `tmp/ai-skirmish-matrix/788-package3-strat09-skaduwee-denial-fact-budget/1793035029740-diagnostic_passed.json`; 789 `tmp/ai-skirmish-matrix/789-package3-strat09-skaduwee-path-outage/1793035279226-diagnostic_passed.json`.

## STRAT-09 viable branches before capture-budget repair

- Run 769 (Tivara denial) reached 200 decisions / 4,001 ticks; 7 workers survived, but no authored-target damage. Run 771's reverted pressure-window experiment retained the producer objective to tick 400 without damage and ended with 2 workers. Its bounded trace showed Macemen at distance 2 from an InfantryInn with native range 1; tick-20 observation had no tactical/construction cells. Attack request is not impact evidence. Do not replay without a tested approach/target hypothesis.
- Run 773 (Tivara unrecoverable) and 774 (Skaduwee unrecoverable) pass after the STRAT-09-only worker bootstrap exemption for authored elimination variants.
- Run 775 (Skaduwee raid) failed authored-main-target attack/effect and worker survival; it attacked nearby `enemy-deposit` and logged failed Stage 13 approaches. Run 776 (Tivara path-outage) failed target attack/effect while retaining 7 workers / 10 military; it selected `enemy-deposit` despite `main-target` ranking first, then switched to enemy home by tick 800.
- Run 767 (Tivara raid) passed its registered predicates with 8 workers, 10 enemy losses and 1,925 damage; it did not damage authored `main-target`. STRAT-09's latest branch evidence is 5/8 passing, with the three failures above.

## 2026-10-26 Skaduwee raid target-separation follow-up

- The duplicate Skaduwee raid `enemy-deposit` remains moved to (7,28), and the fixture regression checks that Skaduwee denial is unchanged. Runs 790–792 failed authored-target predicates; at (16,30), native attempts were outside attacker range or later diverted to a worker. The active mission also changed its objective ID to `hypothesis:<evidenceId>` on first loss of vision.
- Runs 793–797 isolated invalid initial army tiles, then validated x36 home-flank starts and footprint-aware approach filtering. Run 797 passed target application but not native target damage; it selected a local worker after the authored target became last-seen.
- Run 798 was blocked before the browser match by a TypeScript compile error in the new order evidence predicate. Run 799 fixed compilation and kept the mission through the hypothesis ID, but it released after attackers reached approach cells; target effect still failed and one worker survived. Run 800 kept the assignment through tick 440, but it changed to a visible core by tick 540 and ended with zero workers; no target damage. Run 801 did not compile because `position()` returns `undefined`; no runtime payload.
- Run 802 kept the remembered mission through tick 520 but still failed target effect and ended with one worker. This established that pursuit retention alone cannot cause damage through fog. Run 803 moved the target to (22,26) but had no target damage: native attempts were at distance 8–10 for ranged units (range 6–7) and distance 2 for melee (minimum range 3).
- Run 804 moves only the Skaduwee raid WorkMill to (26,26), inside its actual ranged units' 3–7 distance band. Changed-source diagnostic passes every STRAT-09 predicate at 200 decisions / 4,001 ticks, ending with 1 worker, 1 army unit, 749 total damage and 2 enemy losses. Artifact: `tmp/ai-skirmish-matrix/804-strat09-skaduwee-target-range/1793040184130-diagnostic_passed.json`. Treat this as one branch closure, not STRAT-09 completion. Next is Tivara denial, then Tivara path-outage; don't rerun this passing branch unchanged.
- Saved Tivara denial artifact 771 showed the chosen target was an InfantryInn at (16,30), a Maceman attacked from distance 2 with range 1, and the Slingshot remained about 10 tiles away with range 5. Run 805 moves only Tivara denial's authored target to (21,30); the changed-source diagnostic passes every predicate at 200 decisions / 4,001 ticks, with 8 workers, 6 army units, 1,810 total damage and 5 enemy losses. Artifact: `tmp/ai-skirmish-matrix/805-strat09-tivara-denial-range/1793040547246-diagnostic_passed.json`. This closes the denial branch; path-outage is STRAT-09's one remaining failing branch.

## 2026-10-26 Tivara path-outage closeout

- Run 811 proved the 400-HP InfantryInn died by tick 756, before the post-outage evidence window. Run 812 changed it to FrostForge at (21,24); it survived to tick 986 and received 37 post-800 hits, but the attack starts were outside recorded weapon range. Run 813 moved the target to (25,25); legal range improved, but it died at tick 744.
- Run 814 places the same legal FrostForge at (25,29), balancing durability and legal range. It passes all STRAT-09 predicates after 200 decisions / 4,001 ticks, ends with six workers, and records 34 range-compatible native hits after tick 800; the target dies at tick 994. Total damage is 2,061, enemy losses 9. Artifact: `tmp/ai-skirmish-matrix/814-strat09-tivara-path-outage-middle-range/1793042862573-diagnostic_passed.json`.
- Both target durability and recorded native range were required; `nativeWeaponHits` remains unchanged. STRAT-09 now has passing branch evidence for all eight branches. Runs 804–805 predate the final useful-objective selector change, so revalidate source-affected branches in the grouped matrix/final gate.

## 2026-10-26 SCOUT-01 capture-bound and parity follow-up

- Run 815 (`tmp/ai-skirmish-matrix/815-package3-scout01/1793043423636-failed.json`) showed Tivara route histories with 309 / 352 identities against the 256 cap; broad resource coverage also falsely rejected hidden-pair history for this scenario. Run 816 raises the route-order identity limit to 512 and opts the pair comparison out of unrelated resource coverage.
- Run 816 (`tmp/ai-skirmish-matrix/816-scout01-neutral-scout-retention/1793044713767-failed.json`) clears those false capture failures. Canonical permitted inputs match at tick 20, while selected intents differ in authored worker/scout roles. Tivara hidden-b's selected scout movement reaches an alternate destination after tactical interruption, so it fails the strict native information-trip predicate. Do not count the alternate arrival or treat the family as closed.
- The same change protects a moving neutral scout from premature attack/defense recruitment. Focused gameplay passes 103 suites / 547 tests; `pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json` passes. The registered runtime remains open; advance to STRAT-02 while the SCOUT-01 candidate-order / fixture hypothesis is unresolved.

## 2026-10-26 STRAT-02 durable-target and service-evidence follow-up

- Run 817 established the air-raid branch's initial evaluator and capture issues. Run 818 changed only the STRAT-02 main objective to a durable, reachable FrostForge (Tivara) / WatchTower (Skaduwee), then captured Tivara air-raid for 120 decisions / 2,401 ticks. It wins with six workers, 34 army units, 2,602 damage and 11 enemy losses. Native post-400 hits reach the main objective; a reserve squad targeting the raiders physically intervenes without stopping the main offensive.
- Run 818's saved diagnostic initially reports only `raid_home_service_never_continued_after_contact`, because the prior predicate required a neutral Wood source. Replaying the exact source→cargo offer→successful credit proof against the same capture confirms player-owned Food delivery after contact. The evaluator now accepts any of the native resource types from either neutral or player-owned sources to an owned drop-off, while retaining full causal proof. STRAT-02 remains open until its other supported branches and registered CI evidence are covered.
- `tools/ai/fixtures/d-05-native-runtime.json` was stale against its generated registration, blocking all native runtime selection before execution. Regenerating its authored fields restores the 26/26 native fixture audit; STRAT-02 fixture fields were also regenerated from its recipe.
- Validation: portal-e2e TypeScript check passes; focused Playwright specs pass 19/19; exact-file ESLint and `git diff --check` pass. Source checkpoint `8d1cfcee1` is pushed; run artifact `tmp/ai-skirmish-matrix/818-strat02-durable-objective/1793046114901-diagnostic_failed.json` is retained with its original runner status, and the updated service predicate was independently replayed against its captured facts.

## 2026-10-26 — STRAT-05 Tivara reinforced evidence replay

- Run 830 originally failed `strategy_counterforce_reassessment_or_control_continuation_missing`. Its production capture has 621 distinct route-order identities (above the 512 cap), 2,269 movement fact records and no dropped facts. Route-order overflow suppressed all normalized movement evidence; after raising the identity cap to 1,024, 566 movement groups normalize. `nativeRetreats` also needed to normalize the accepted-intent `effect:` prefix to the native execution ID.
- Replaying the saved run through the full `evaluateNativeScenarioVariant` with current source yields no failures. It contains nine physically arrived retreats and clear counterforce response; the original JSON remains a historical diagnostic-failed artifact. This validates only `strat-05-tivara-reinforced`; quiet, blocked-retreat and Skaduwee branches remain.
- Focused Playwright checks pass 64/64, portal-e2e TypeScript passes, exact ESLint has no errors (one existing warning), and `git diff --check` is clean. Source commit: `cb2ec8650`.

## 2026-10-26 — STRAT-05 Tivara quiet control

- Run 831 (`tmp/ai-skirmish-matrix/831-strat05-tivara-quiet/1793051339095-diagnostic_failed.json`) records 14 valid native hits on `contact-group` through tick 222. That target was spent; the AI moved to authored `front-target-b` and dealt eight native hits at ticks 468–741. The old evaluator checked only the original contact target after tick 400 and falsely rejected the quiet control.
- The quiet predicate now accepts exact post-400 hits on the authored contact or either authored front target. A regression confirms a valid retarget passes and absence of continued effect still fails. Full evaluator replay returns no failures; original report status remains unchanged. Tivara quiet is checked, not the whole STRAT-05 family.
- Focused evaluator test 1/1; portal-e2e TypeScript, ESLint and `git diff --check` pass. Source commit: `d252d7164`.
