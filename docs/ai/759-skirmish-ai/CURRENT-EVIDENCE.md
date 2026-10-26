# #759 current evidence

Updated 2026-10-26. This is the active evidence snapshot. Detailed prior run notes are preserved in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md); use HANDOFF.md for the live cursor and next action.

Source checkpoint `5da21a50d89ea866972cead3b945d7e1a59b4897` is pushed; latest CI diagnostics were read at `86e18064408edc57cc51ee615a6c9bfe0c8927ad` (docs-only change afterward).
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

## Latest implementation and checks

- Stage 9 frontier scouts retain control of their native Move orders across changing search points so Stage 13 does not
  replace them with tactical positioning orders. This now covers engage/advance states too; retreat still takes priority.
- DOMAIN-05's changed-source Tivara backline capture contains a paid Alchemist and three exact positive native damage
  events against its visible authored target. The evaluator no longer demands an unrelated movement-arrival record in
  addition to that physical hit; the retained-artifact check clears the old predicate. This is one branch/artifact, not
  full DOMAIN-05 closure. The exact-damage reader spec passes 2/2.
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
| 3 — scouting, combat, access | SCOUT, STRAT-02/03, DOMAIN, RAID, FIGHT and C families remain; use their native evidence and CI rows in the archive/inventory. |
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
