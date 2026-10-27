# #759 current evidence

Updated 2026-10-27. This is the compact active snapshot; detailed run history belongs in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md). [HANDOFF.md](HANDOFF.md) owns the live cursor and next action.

Latest closed family: STRAT-04 report `1793069202745-passed.json`, base `2210ab7fe09d`, dirty-source digest
`fnv1a32:d22008af`, fixture digest `fnv1a32:4e15b8c2`. Latest attempted family: SCOUT-01 report
`1793071681087-failed.json` (four variants, 400 decisions / 8,004 ticks): physical information trips pass in all
branches; hidden-pair selected-intent parity remains open. Latest attempted family is SCOUT-02 report
`1793073090904-failed.json` (ten variants, 1,200 decisions / 24,010 ticks): both visible controls pass; hidden and
withdrawn variants fail trip/stale-job/survival predicates, and hidden-world permitted-input parity remains open.
The focused Tivara visible diagnostic `1793083017398-diagnostic_failed.json` uses an opening contact outside attack range;
it passes contact/fairness and stale-certainty checks but still lacks a physical information trip.
SCOUT-03 report `1793073566880-failed.json` ran four variants (400 decisions / 8,004 ticks): trapped branches pass;
both escape branches fail physical scout survival. SCOUT-04 report `1793074230112-failed.json` ran all six variants
(720 decisions / 14,406 ticks). The original objective-switch-only predicate failed all six; retained evidence shows all
six contacts entered ranked alternatives within 400 ticks and took later AI-caused native damage.

## Validated outcomes

- Packages 1–2 are complete: production 8/8; economy/technology 16/16.
- SEQ-01 reaches two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 passes all six branches. STRAT-02 passes all five registered branches. STRAT-09 has passing evidence for all
  eight branches. One shared RAID-03 boat branch passes. Detailed artifacts and source provenance are archived.
- STRAT-03 passes all six branches at 150 decisions / 3,001 ticks: both minor branches and Skaduwee withdrawn win; both reinforced branches and Tivara withdrawn meet their expected branch outcomes. All branches retain their home and satisfy the native defense/offense predicates. Reports and source provenance are archived.
- STRAT-04 passes all six branches at 100 decisions / 2,001 ticks each. Quiet and harmless-noise controls preserve the committed goal and produce native damage through the attack squad; the real-threat controls adapt physically. Report and source provenance are archived.
- SCOUT-01 is partial, not closed: the latest report has no per-branch trip failures, but `scouting_hidden_world_altered_selected_intents` remains. Current source now orders macro workers, gathering sources/workers, recovery actors, and scout candidates by visible geometry before run-local IDs; recheck parity after the related scouting batch.
- SCOUT-02 is partial, not closed: both visible controls pass, while the eight withdrawn/hidden branches do not sustain useful information service or keep the authored contact alive through the horizon. Hidden-world permitted-input parity also fails. A focused visible diagnostic with improved opening spacing passes contact/fairness and stale-certainty checks but still misses a physical information trip. Full branch details and runtime provenance are archived.
- SCOUT-03 is partial, not closed: both trapped branches pass; Tivara and Skaduwee escape branches fail `scouting_surviving_physical_escape_missing`.
- SCOUT-04 is closed on all six retained branches: contact consideration occurs within 400 ticks and each branch has later AI-caused native damage.
- Selected native obligations: **5/22 closed** (STRAT-05, STRAT-02, STRAT-03, STRAT-04 and SCOUT-04); 17 remain. Partial branch evidence does not close a family.
- Supported registration remains complete: pure 111/111 and native definitions/runtime recipes 115/115. These are
  authoring coverage, not behavior completion. Overall behavior percentage is unavailable until the existing evidence is
  reconciled across all supported rows.

## Active gaps

| Package | Remaining work |
| --- | --- |
| 3 — scouting, combat, access | DOMAIN-01/05/06 pass. DOMAIN-02's two negative controls and INTERCEPT pass; COAST pays for a ship but leaves it in reserve, and ESCORT landing depth remains open. SCOUT-04 passes all six retained branches. SCOUT-03 trapped branches pass; escape branches remain open after `1793082577283` still showed first-sample target visibility and continued enemy sight. Next: grouped SCOUT-01/02 behavior, then revisit SCOUT-03 after an escape change. RAID-02 remains open although it shares DOMAIN-06's recipe. Seven real-peer obligations remain CI-owned. STRAT-09 needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | PLACE/EXP/WALL and H recovery cases; PLACE-03 transit/clearance and H-11 route/capture remain known failures. |
| 5 — authority and lifecycle | H-10 over-capacity variants, H-06/07, H-08/09 peer evidence, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission audit and final closure audit. |

CI already runs the registered runtime and peer matrix. Use local native runs only to answer a concrete question after an
affected change; do not repeat unchanged passing evidence. PR #814 remains draft and unchanged. The handoff records the
next branch and publication status.
