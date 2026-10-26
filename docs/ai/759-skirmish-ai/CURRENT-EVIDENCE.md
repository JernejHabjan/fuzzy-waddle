# #759 current evidence

Updated 2026-10-26. This is the active evidence snapshot. Detailed prior run notes are preserved in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md); use HANDOFF.md for the live cursor and next action.

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
  replace them with tactical positioning orders. A visible harmless contact leaves the selected scout route intact.
- The native scouting oracle matches `effect:`-prefixed accepted intents to movement execution IDs.
- Movement capture normalization now admits up to 2,048 execution groups; caller-history validation admits 4,096
  identities. The latest H-14 capture contained 1,567 movement executions and 1,869 caller identities; route-order
  identities numbered 235, so that independent 256 bound remains unchanged.
- Checks: gameplay scouting specs 5/5; scouting-evidence Playwright specs 2/2; movement/scout-evidence/route-order/route-caller
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
