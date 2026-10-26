# #759 current evidence

Updated 2026-10-26. This is the active evidence snapshot. Detailed prior run notes are preserved in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md); use HANDOFF.md for the live cursor and next action.

The STRAT-09 elimination evaluator repair is pushed on `feature/759-skirmish-ai` at `51c789217`; latest CI diagnostics were read at `86e18064408edc57cc51ee615a6c9bfe0c8927ad` (runtime jobs skipped on draft PR #814).
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
- Package 3 pure batch: 40 scenarios, 46 suites and 278 tests pass with no missing scenario bindings. STRAT-09 now has
  passing evidence for all eight native branches; run 814 closes its last branch on current local source.

## Latest implementation and checks

- Stage 9 frontier scouts retain control of their native Move orders across changing search points so Stage 13 does not
  replace them with tactical positioning orders. This now covers engage/advance states too; retreat still takes priority.
- DOMAIN-05's changed-source Tivara backline capture contains a paid Alchemist and three exact positive native damage
  events against its visible authored target. The evaluator no longer demands an unrelated movement-arrival record in
  addition to that physical hit; the retained-artifact check clears the old predicate. This is one branch/artifact, not
  full DOMAIN-05 closure. The exact-damage reader spec passes 2/2.
- STRAT-09's active attack now retains a recent last-seen objective across the actor-to-`hypothesis:<evidenceId>` transition
  when current mission members still have a native Move toward its last-known approach or have arrived nearby. This does
  not issue attacks through fog. Focused gameplay passes 103 suites / 547 tests; `pnpm nx build portal` passes with its
  existing initial-bundle budget warning. The footprint-aware approach filter excludes cells inside published building
  footprints. Changed-source Skaduwee raid run 804 passes all native predicates at 200 decisions / 4,001 ticks, including
  damage to the authored WorkMill; it ends with one worker and one army unit. The fixture places the raid target at (26,26)
  so ranged attackers fight within their legal 3–7 tile distance. Changed-source Tivara denial run 805 also passes all
  predicates at the same horizon, with 8 workers, 6 army units, 1,810 total damage and 5 enemy losses; its target is at
  (21,30), within the Slingshot's 5-tile range. Run 814 closes Tivara path-outage: FrostForge at (25,29) receives 34
  range-compatible native hits after tick 800, is destroyed at tick 994, and the 4,001-tick run ends with six workers.
  Artifact: `tmp/ai-skirmish-matrix/814-strat09-tivara-path-outage-middle-range/1793042862573-diagnostic_passed.json`.
  All eight STRAT-09 branches now have passing native evidence. Runs 804–805 predate the final useful-objective selector
  change; revalidate affected branches in the grouped matrix/final gate instead of repeating unchanged local variants.
  See HANDOFF.md and the evidence archive; move to the next Package 3 family.
- The native scouting oracle matches `effect:`-prefixed accepted intents to movement execution IDs.
- Movement capture normalization admits 2,048 execution groups and caller-history validation 4,096 identities. SCOUT-01
  run 815 recorded 309 / 352 route-order identities, exceeding the former 256 cap; run 816 and the new 512 identity
  boundary address that capture loss.
- SCOUT-02's first changed-source replay on `1f96d11b1` still lacked a Stage 9 physical trip: Stage 13 redirected the scout
  into engage on visible contact, then happened to reach the same coordinate under its own effect ID. That arrival is not
  credited. A follow-up showed the scout's order was Attack, while Stage 9 incorrectly treated its earlier selection as
  still dispatched. Stage 9 now retries when the native Move to the frontier is gone. Tactical orders preserve a selected
  or active scout route, keep direct search movement when they own it, and let tactical withdrawals take priority. A
  completed neutral claim releases its unit for a new frontier claim immediately. Four focused gameplay suites pass
  44/44. The changed-source runtime replay exceeded its 13-minute one-variant test budget; the owned runner and
  Playwright process tree were stopped without a result artifact. SCOUT-02 remains open for CI; do not repeat this local
  match without a harness fix.
- SCOUT-01 runs 815–816 also removed a false resource-history gate from hidden-pair comparison. Run 816 remains failed:
  canonical permitted inputs match at tick 20, but authored worker/scout choices differ; Tivara hidden-b's scout route
  ends at another destination after tactical interruption, so it earns no information-trip credit. Keep selected-intent
  parity and physical arrival strict. Advance to STRAT-02 while that candidate-order / fixture hypothesis is unresolved.
- Checks: focused gameplay suites 44/44; scouting-evidence Playwright specs 2/2; movement/scout-evidence/route-order/route-caller
  Playwright suites 76/76; exact-file ESLint completed with no errors; `git diff --check` passes. Two existing non-null
  assertion warnings remain in route specs and two in the gameplay scouting spec.

## Open work by package

| Package | Status |
| --- | --- |
| 3 — scouting, combat, access | STRAT-09 has passing evidence for 8/8 branches; current-source path-outage is closed. Revalidate affected branches in the final grouped gate. SCOUT, STRAT-02/03, DOMAIN, RAID, FIGHT and C families remain. |
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
