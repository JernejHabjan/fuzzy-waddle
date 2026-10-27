# #759 current evidence

Updated 2026-10-27. This is the compact active snapshot; detailed run history belongs in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md). [HANDOFF.md](HANDOFF.md) owns the live cursor and next action.

Latest STRAT-03 focused run used source `4a3956e74` plus dirty-source digest `fnv1a32:2b729d16` and fixture digest
`fnv1a32:f5a564bd`. Report:
`D:\ai-skirmish-work\matrix\1793060456153-diagnostic_passed.json`.

## Validated outcomes

- Packages 1–2 are complete: production 8/8; economy/technology 16/16.
- SEQ-01 reaches two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 passes all six branches. STRAT-02 passes all five registered branches. STRAT-09 has passing evidence for all
  eight branches. One shared RAID-03 boat branch passes. Detailed artifacts and source provenance are archived.
- STRAT-03 Tivara reinforced passes on the current focused change: the 3,001-tick match wins, retains the home, observes
  all 12 reinforcements and records scaled physical defense. This is one of six STRAT-03 branches; the family stays open.
- Selected native obligations: **2/22 closed** (STRAT-05 and STRAT-02). Partial branch evidence does not close a family.
- Supported registration remains complete: pure 111/111 and native definitions/runtime recipes 115/115. These are
  authoring coverage, not behavior completion. Overall behavior percentage is unavailable until the existing evidence is
  reconciled across all supported rows.

## Active gaps

| Package | Remaining work |
| --- | --- |
| 3 — scouting, combat, access | Five STRAT-03 branches; STRAT-04; SCOUT; DOMAIN; remaining RAID/FIGHT/C cases; seven real-peer obligations remain CI-owned. STRAT-09 complete evidence needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | PLACE/EXP/WALL and H recovery cases; PLACE-03 transit/clearance and H-11 route/capture remain known failures. |
| 5 — authority and lifecycle | H-10 over-capacity variants, H-06/07, H-08/09 peer evidence, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission audit and final closure audit. |

CI already runs the registered runtime and peer matrix. Use local native runs only to answer a concrete question after an
affected change; do not repeat unchanged passing evidence. PR #814 remains draft and unchanged. The handoff records the
next branch and publication status.
