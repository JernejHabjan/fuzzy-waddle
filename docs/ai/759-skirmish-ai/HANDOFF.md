# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-26

- Latest source commit: `a1c68beb5` (`docs(ai): close STRAT-05 native evidence`), pushed. Node 24.18.0 / pnpm 11.14.0.
- Packages 1–2 are validated; SEQ-01 completes the two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 is validated across all six registered branches. Tivara reinforced run 830 replays cleanly after preserving 621 route-order identities (limit 1,024), matching accepted `effect:` IDs to native movement IDs, and recognizing nine physical retreats. Tivara quiet run 831 replays cleanly: 14 hits on the spent contact through tick 222, then eight hits on `front-target-b` at ticks 468–741. Tivara blocked-retreat run 833 passes on the corrected world: its opening target is forward of a homeward barrier and its bounded alternative requires a plan change plus physical counterforce damage. Skaduwee reinforced run 834 passes at 120 decisions / tick 2,400 with closed history and no AI errors. Skaduwee quiet run 835 replays cleanly: 15 contact hits by tick 150, then a hit on `enemy-home` at tick 835 before the AI withdraws under losses. Skaduwee blocked-retreat run 836 passes at 120 decisions / tick 2,400 with closed history and no AI errors. Current-source evaluator replays clear all original report failures; full chronology is in the archive. Count one of the 22 selected native obligations as closed.
- STRAT-02 Skaduwee quiet passes on current source: run 837, 120 decisions / 2,401 ticks, complete history, no AI errors. Tivara quiet run 838 reaches the full horizon but fails its offensive-effect predicate: the main FrostForge receives 293 committed attack operations and zero native damage; the attack squad stays at 23–25 actors and allocates eight actors to local defense after enemy contact at tick 1,160. Investigate why the Tivara force cannot land damage before changing the evaluator. The first run attempt failed only while saving its report (disk full); run 838 is the valid capture. Six duplicate STRAT-05 runtime payloads were removed after confirming their complete captures remain inline in the matrix artifacts; reports and indexes remain.
- STRAT-03 and STRAT-04 remain open; do not rerun unchanged. STRAT-09 has passing branch evidence; revalidate affected rows in the grouped CI/final gate.
- H-10 has local evidence for six of eight variants; over-capacity and seven real-peer obligations remain with CI. One of the 22 selected native obligations is now closed: STRAT-05. The remaining rows still require their complete source-specific family evidence.

## Package cursor

| Package | Current state |
| --- | --- |
| 3 — scouting, combat, access | STRAT-05 is validated; STRAT-02 Skaduwee quiet passes, Tivara quiet has a concrete no-native-damage failure. Trace/fix Tivara offense, then advance across STRAT-02/03/04, SCOUT, DOMAIN, RAID, FIGHT and C. |
| 4 — placement, walls, recovery | PLACE-03 route/transit evidence; H-11 `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07, H-08/09 peer evidence, H-10 over-capacity CI, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission and final closure audits. |

## Next action

Trace STRAT-02 Tivara quiet (`strat-02-tivara-quiet`) using run 838: explain the 293 committed FrostForge attacks with zero native damage, fix the underlying combat/offense issue, and rerun this branch once. Then advance to a different ready STRAT-02 branch. Do not replay STRAT-05 unchanged; all six native branches pass. Keep the registered runtime/peer matrix as the final regression gate because PR #814 remains draft.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
