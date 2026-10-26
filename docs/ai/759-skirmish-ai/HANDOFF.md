# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-27

- Latest pushed source before this batch: `eb8721795` (`docs(ai): record STRAT-02 air-raid pass`). Node 24.18.0 / pnpm 11.14.0.
- Packages 1–2 are validated; SEQ-01 completes the two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 is validated across all six registered branches. Tivara reinforced run 830 replays cleanly after preserving 621 route-order identities (limit 1,024), matching accepted `effect:` IDs to native movement IDs, and recognizing nine physical retreats. Tivara quiet run 831 replays cleanly: 14 hits on the spent contact through tick 222, then eight hits on `front-target-b` at ticks 468–741. Tivara blocked-retreat run 833 passes on the corrected world: its opening target is forward of a homeward barrier and its bounded alternative requires a plan change plus physical counterforce damage. Skaduwee reinforced run 834 passes at 120 decisions / tick 2,400 with closed history and no AI errors. Skaduwee quiet run 835 replays cleanly: 15 contact hits by tick 150, then a hit on `enemy-home` at tick 835 before the AI withdraws under losses. Skaduwee blocked-retreat run 836 passes at 120 decisions / tick 2,400 with closed history and no AI errors. Current-source evaluator replays clear all original report failures; full chronology is in the archive. Count one of the 22 selected native obligations as closed.
- STRAT-02 branches: Skaduwee quiet run 837 passes; Tivara quiet run 838 passes current-evaluator replay after its 136 native hits destroy FrostForge before contact; Tivara air raid run 839 passes directly; Skaduwee air raid's complete capture (`run-QitzIS/runtime.json`, source `eb8721795`) passes current-evaluator replay. It has 15 distinct defenders across the response window but peaks at 10 simultaneously, and lands 142 post-contact hits. Its matrix wrapper could not be written on C:; the full native capture and request remain. The evaluator now bounds peak simultaneous defense. Use `AI_SKIRMISH_RUNTIME_RESULTS_DIRECTORY` and `--output` on the same alternate volume for remaining local captures.
- STRAT-03 and STRAT-04 remain open; do not rerun unchanged. STRAT-09 has passing branch evidence; revalidate affected rows in the grouped CI/final gate.
- H-10 has local evidence for six of eight variants; over-capacity and seven real-peer obligations remain with CI. One of the 22 selected native obligations is now closed: STRAT-05. The remaining rows still require their complete source-specific family evidence.

## Package cursor

| Package | Current state |
| --- | --- |
| 3 — scouting, combat, access | STRAT-05 is validated; four STRAT-02 branches pass current-evaluator replay. Continue Skaduwee boat, then remaining STRAT-03/04, SCOUT, DOMAIN, RAID, FIGHT and C cases. |
| 4 — placement, walls, recovery | PLACE-03 route/transit evidence; H-11 `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07, H-08/09 peer evidence, H-10 over-capacity CI, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission and final closure audits. |

## Next action

Run STRAT-02 Skaduwee boat control next, directing both runtime result and matrix report to an alternate volume. The four completed branches need no unchanged rerun. Then advance through the remaining dependency-ready cases and keep the registered runtime/peer matrix as final regression gate; PR #814 remains draft.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
