# #759 current evidence

Updated 2026-10-27. This is the compact active snapshot; detailed run history belongs in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md). [HANDOFF.md](HANDOFF.md) owns the live cursor and next action.

Latest closed family: STRAT-04 report `1793069202745-passed.json`, base `2210ab7fe09d`, dirty-source digest
`fnv1a32:d22008af`, fixture digest `fnv1a32:4e15b8c2`. Latest attempted family: SCOUT-01 report
`1793071681087-failed.json` (four variants, 400 decisions / 8,004 ticks): physical information trips pass in all
branches; hidden-pair selected-intent parity remains open. Subsequent deterministic actor-order repairs are unrun.

## Validated outcomes

- Packages 1–2 are complete: production 8/8; economy/technology 16/16.
- SEQ-01 reaches two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 passes all six branches. STRAT-02 passes all five registered branches. STRAT-09 has passing evidence for all
  eight branches. One shared RAID-03 boat branch passes. Detailed artifacts and source provenance are archived.
- STRAT-03 passes all six branches at 150 decisions / 3,001 ticks: both minor branches and Skaduwee withdrawn win; both reinforced branches and Tivara withdrawn meet their expected branch outcomes. All branches retain their home and satisfy the native defense/offense predicates. Reports and source provenance are archived.
- STRAT-04 passes all six branches at 100 decisions / 2,001 ticks each. Quiet and harmless-noise controls preserve the committed goal and produce native damage through the attack squad; the real-threat controls adapt physically. Report and source provenance are archived.
- SCOUT-01 is partial, not closed: the latest report has no per-branch trip failures, but `scouting_hidden_world_altered_selected_intents` remains. Current source now orders macro workers, gathering sources/workers, recovery actors, and scout candidates by visible geometry before run-local IDs; recheck parity after the related scouting batch.
- Selected native obligations: **4/22 closed** (STRAT-05, STRAT-02, STRAT-03 and STRAT-04); 18 remain. Partial branch evidence does not close a family.
- Supported registration remains complete: pure 111/111 and native definitions/runtime recipes 115/115. These are
  authoring coverage, not behavior completion. Overall behavior percentage is unavailable until the existing evidence is
  reconciled across all supported rows.

## Active gaps

| Package | Remaining work |
| --- | --- |
| 3 — scouting, combat, access | Next SCOUT-02, then other SCOUT/DOMAIN and remaining RAID/FIGHT/C cases; return to SCOUT-01 parity after related scouting work. Seven real-peer obligations remain CI-owned. STRAT-09 needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | PLACE/EXP/WALL and H recovery cases; PLACE-03 transit/clearance and H-11 route/capture remain known failures. |
| 5 — authority and lifecycle | H-10 over-capacity variants, H-06/07, H-08/09 peer evidence, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission audit and final closure audit. |

CI already runs the registered runtime and peer matrix. Use local native runs only to answer a concrete question after an
affected change; do not repeat unchanged passing evidence. PR #814 remains draft and unchanged. The handoff records the
next branch and publication status.
