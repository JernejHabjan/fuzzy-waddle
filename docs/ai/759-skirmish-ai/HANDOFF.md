# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-26

- Latest local source commit: `5480ef0b3` (`fix(ai): accept authored STRAT-05 home continuation`); it is ready to push with the progress-doc commit. Node 24.18.0 / pnpm 11.14.0.
- Packages 1–2 are validated; SEQ-01 completes the two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 Tivara reinforced and quiet pass full native branch evaluation on saved current-source replays. Reinforced run 830 now preserves 621 route-order identities (limit 1,024), matches accepted `effect:` IDs to native movement IDs, and yields nine physical retreats. Quiet run 831 records 14 hits on the spent contact through tick 222, then eight hits on authored `front-target-b` at ticks 468–741; its oracle now allows that authored retarget. Tivara blocked-retreat passes changed-fixture run 833 at 120 decisions / tick 2,401 with closed native history and no AI errors. Its former closed terrain ring made the opening target unreachable; the fixed fixture places that target forward of a homeward barrier. The bounded alternative requires objective-plan change plus physical counterforce damage when retreat is unavailable. Skaduwee reinforced passes run 834 at 120 decisions / tick 2,400 with complete native history and no AI errors. Skaduwee quiet run 835 also passes on current-source replay: the contact group took 15 native hits by tick 150, then the AI landed a valid hit on authored `enemy-home` at tick 835 before withdrawing under losses. The quiet oracle includes authored enemy-home retargets; replay clears the only original failure. Five checked branches are not family closure.
- STRAT-03 and STRAT-04 remain open; do not rerun unchanged. STRAT-09 has passing branch evidence; revalidate affected rows in the grouped CI/final gate.
- H-10 has local evidence for six of eight variants; over-capacity and seven real-peer obligations remain with CI. Newly selected obligations remain 0/22 closed until full family/source gates are satisfied.

## Package cursor

| Package | Current state |
| --- | --- |
| 3 — scouting, combat, access | Continue STRAT-05 branches, then SCOUT, STRAT-02/03/04, DOMAIN, RAID, FIGHT and C families. Preserve concrete open hypotheses and advance between cases. |
| 4 — placement, walls, recovery | PLACE-03 route/transit evidence; H-11 `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07, H-08/09 peer evidence, H-10 over-capacity CI, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission and final closure audits. |

## Next action

Run the final STRAT-05 Skaduwee blocked-retreat branch (`strat-05-skaduwee-blocked-retreat`) once. Do not replay the five checked branches unchanged.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
