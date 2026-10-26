# #759 current evidence

Updated 2026-10-26. This is the active evidence snapshot. Detailed prior run notes are preserved in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md); use HANDOFF.md for the live cursor and next action.

The STRAT-09 elimination evaluator repair is pushed on `feature/759-skirmish-ai`; latest CI diagnostics were read at `86e18064408edc57cc51ee615a6c9bfe0c8927ad` (runtime jobs skipped on draft PR #814).
GitHub reports `skirmish-runtime-plan`, `skirmish-multiplayer` and `skirmish-runtime` skipped because PR #814 is draft;
the runtime matrix starts on `ready_for_review`. PR status is left unchanged per the existing handoff boundary. H-10's two
over-capacity variants and real-peer obligations still need that matrix evidence.

## Completed gates

- Packages 1–2: production 8/8 and economy/technology 16/16.
- Two-faction SEQ-01 victory passes at the 18,000-tick horizon. Adaptive site observation starts at 12 tiles, keeps at
  least eight legal sites for the largest buildable footprint, then grows by four tiles to a 24-tile cap.
  Artifact: `tmp/ai-skirmish-matrix/759-seq01-two-faction-recovery-retry/1792876589145-passed.json`.
- Package 5 focused evidence: H-14 Skaduwee harmless passes exact physical economy/scouting/paid-output predicates at
  150 decisions / 3,001 ticks (`tmp/ai-skirmish-matrix/760-package5-h14-route-bound-fix/1792997406812-diagnostic_passed.json`).
  H-10 below-capacity and at-capacity pass for both factions; resumed-capacity passes for both factions too. Six of eight
  H-10 variants have local evidence. Both over-capacity variants remain for the registered CI matrix.
  H-10 artifacts are listed in HANDOFF.md.
- Package 3 pure batch: 40 scenarios, 46 suites and 278 tests pass with no missing scenario bindings. STRAT-09 now has a
  passing owner-level test but its eight native branches remain open.

## Latest implementation and checks

- Stage 9 frontier scouts retain control of their native Move orders across changing search points so Stage 13 does not
  replace them with tactical positioning orders. This now covers engage/advance states too; retreat still takes priority.
- DOMAIN-05's changed-source Tivara backline capture contains a paid Alchemist and three exact positive native damage
  events against its visible authored target. The evaluator no longer demands an unrelated movement-arrival record in
  addition to that physical hit; the retained-artifact check clears the old predicate. This is one branch/artifact, not
  full DOMAIN-05 closure. The exact-damage reader spec passes 2/2.
- STRAT-09 now abandons an underpowered, inactive working target when a second observed objective already meets its
  force requirement. It preserves objectives with a live native attack order or useful effect progress. The gameplay gate passes 103 suites / 546 tests. Changed-source
  Tivara raid artifact `tmp/ai-skirmish-matrix/767-package3-strat09-feasible-objective/1793014878089-diagnostic_passed.json`
  passes all registered predicates at 200 decisions / 4,001 ticks, with 10 enemy losses, 1,925 damage and all eight
  workers alive. It records no damage to authored `main-target` specifically, so this is one predicate-passing raid
  branch, not target destruction or scenario-family closure. Tivara denial run 768 failed before payload creation; 769
  completed but failed the native-effect predicate with 7 workers and no damage to `main-target`. Experimental replay 771
  retained the producer target through tick 400, still had no target damage, and ended with 2 workers; those pressure-window
  code edits were reverted. Its bounded trace shows melee attack requests against an `InfantryInn` at (16,30) from an
  actor at (18,31), native distance 2 vs range 1; the tick-20 AI observation exposes no tactical/construction cells.
  This suggests missing usable approach geometry, but attack-request/committed facts do not establish hit attempts. Resolve
  the geometry/input contract before another denial replay, while advancing other Package 3 cases. Do not repeat 768–771
  unchanged. The Tivara unrecoverable run 772 then exposed an evaluator contradiction: its authored events intentionally
  destroy the final worker and home at tick 800, while the generic runtime rule always required a final worker. The new
  exception is limited to STRAT-09 variant IDs ending in `-unrecoverable`; a focused test verifies other STRAT-09
  branches and unrelated scenarios retain the worker requirement. Changed-evaluator native replays pass for Tivara and
  Skaduwee unrecoverable branches at 200 decisions / 4,001 ticks: artifacts 773 and 774. They prove the intended native
  elimination control, not viable-comeback closure. Skaduwee raid run 775 failed the authored main-target attack/effect
  predicates and ended with zero workers (`quit`). At tick 20 it chose a nearby second `WorkMill` (`enemy-deposit` at
  17,28) over the authored `main-target` at 16,30; its attack-move and later direct attack targeted the deposit, while
  multiple Stage 13 approach moves failed. Treat this as a fixture/objective and approach lead; do not rerun unchanged.
  Tivara path-outage run 776 reached 200 decisions / 4,001 ticks and failed the authored-target attack/effect predicates
  with 7 workers and 10 military units. It selected `enemy-deposit` as the tick-20 working pressure target despite
  `main-target` ranking first among alternatives, then selected the enemy home as a finish objective by tick 800. This
  supports objective/attack application trouble, not economic collapse. Artifact:
  `tmp/ai-skirmish-matrix/776-package3-strat09-tivara-path-outage/1793021312931-diagnostic_failed.json`. Current STRAT-09
  branch evidence: 5 passes / 3 failures / 0 unproven of 8; overall closure remains open. Skaduwee runs 777/778/781/782/783
  (denial) and 779 (path outage) timed out before recording decisions/ticks. Runs 783/784 reached tick 4,000 in about 630s;
  784 showed checkpoint, economy, strategy and transport capture complete within 65ms combined. Runs 785/786 confirmed
  the final authority call stalls while transferring its large result: browser-side capture completes, with 22,510 owner
  facts and a 4.2s final clone, but Playwright serialization does not return within 120s. Run 787 showed browser gzip +
  Node inflate returns the full record in 12s. Its diagnostic stop still reported closed-history gaps and fact overflow
  (1,995 AI / 257 opponent facts dropped); the shared cap is raised to 32,768 with a focused overflow-boundary test.
  Run 788 passes Skaduwee denial (200 decisions / 4,001 ticks; 8 workers, 2,410 damage, 8 enemy losses); 789 passes
  Skaduwee path-outage (same horizon; 8 workers, 2,244 damage, 9 enemy losses). All STRAT-09 branches now have evidence.
  Fixture runs 790–792 moved Skaduwee raid's duplicate deposit away and kept the attack squad on authored `main-target`
  through tick 360, but failed both authored-target predicates. Native attackers stayed near x=25 while the target sat at
  x=16, recorded no damage to it, then auto-targeted a nearby worker and switched to raid bait; run 792 ended with two
  workers. Selector-only retention experiments were discarded because they did not repair the native behavior. Next
  investigate the approach/path that leaves the force nine tiles from target; then separately solve the worker retarget
  and remaining Tivara denial/path-outage cases. Do not repeat 790–792 unchanged. Artifacts and detail: HANDOFF.md.
- The native scouting oracle matches `effect:`-prefixed accepted intents to movement execution IDs.
- Movement capture normalization now admits up to 2,048 execution groups; caller-history validation admits 4,096
  identities. The latest H-14 capture contained 1,567 movement executions and 1,869 caller identities; route-order
  identities numbered 235, so that independent 256 bound remains unchanged.
- SCOUT-02's first changed-source replay on `1f96d11b1` still lacked a Stage 9 physical trip: Stage 13 redirected the scout
  into engage on visible contact, then happened to reach the same coordinate under its own effect ID. That arrival is not
  credited. A follow-up showed the scout's order was Attack, while Stage 9 incorrectly treated its earlier selection as
  still dispatched. Stage 9 now retries when the native Move to the frontier is gone. Tactical orders preserve a selected
  or active scout route, keep direct search movement when they own it, and let tactical withdrawals take priority. A
  completed neutral claim releases its unit for a new frontier claim immediately. Four focused gameplay suites pass
  44/44. The changed-source runtime replay exceeded its 13-minute one-variant test budget; the owned runner and
  Playwright process tree were stopped without a result artifact. SCOUT-02 remains open for CI; do not repeat this local
  match without a harness fix.
- Checks: focused gameplay suites 44/44; scouting-evidence Playwright specs 2/2; movement/scout-evidence/route-order/route-caller
  Playwright suites 76/76; exact-file ESLint completed with no errors; `git diff --check` passes. Two existing non-null
  assertion warnings remain in route specs and two in the gameplay scouting spec.

## Open work by package

| Package | Status |
| --- | --- |
| 3 — scouting, combat, access | STRAT-09 native comeback/effect and worker-survival predicates fail. SCOUT, STRAT-02/03, DOMAIN, RAID, FIGHT and C families remain. |
| 4 — placement, walls, recovery | PLACE-03 still has route-clearance and worker/army transit failures. H-11 has one legal construction endpoint returning `no_path` and capture-channel loss. Other PLACE/EXP/WALL/H cases remain. |
| 5 — authority and lifecycle | H-10 awaits over-capacity CI results. H-14 is one passing branch only. H-06/07 retain fixture/evaluator gaps; H-08/09 require credentialed peers. H-15, H-31/H-32, M11, #819 and #823 remain open. |
| 6 — continuous play and difficulty | SEQ-02 and remaining supported SEQ/D cases; D-06 legacy difficulty comparison is unsupported and remains an explicit blocker. |
| 7 — debug and closure | DBG cases, #820/#821, final machinery/legacy audit and closure review remain. |

Newly selected native obligations remain 0/22 closed. Registration or a passing single branch does not close a family.
Seven real-peer obligations depend on credentialed CI evidence; do not substitute local single-player runs.

## Evidence rules

- CI already runs the registered runtime matrix. Use a local native run only when it answers a specific open question after a
  source, fixture, capture or evaluator change. Do not repeat an unchanged passing run or a blind unchanged failure.
- Iterate on an existing failure when its evidence yields a concrete next hypothesis. Advance to other ready cases between
  retries so one difficult case does not stall the roadmap.
- Do not report CPU or memory usage in routine progress. Record it only when needed to explain an infrastructure failure.
