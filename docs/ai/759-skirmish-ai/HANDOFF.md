# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-27

- Tested this batch on `e9022b2d5` plus dirty-source digest `fnv1a32:469f1efd`; Node 24.18.0 / pnpm 11.14.0. The change set is validated and being published on `feature/759-skirmish-ai`.
- Packages 1–2 are validated; SEQ-01 completes the two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 is validated across all six registered branches. Tivara reinforced run 830 replays cleanly after preserving 621 route-order identities (limit 1,024), matching accepted `effect:` IDs to native movement IDs, and recognizing nine physical retreats. Tivara quiet run 831 replays cleanly: 14 hits on the spent contact through tick 222, then eight hits on `front-target-b` at ticks 468–741. Tivara blocked-retreat run 833 passes on the corrected world: its opening target is forward of a homeward barrier and its bounded alternative requires a plan change plus physical counterforce damage. Skaduwee reinforced run 834 passes at 120 decisions / tick 2,400 with closed history and no AI errors. Skaduwee quiet run 835 replays cleanly: 15 contact hits by tick 150, then a hit on `enemy-home` at tick 835 before the AI withdraws under losses. Skaduwee blocked-retreat run 836 passes at 120 decisions / tick 2,400 with closed history and no AI errors. Current-source evaluator replays clear all original report failures; full chronology is in the archive. STRAT-05 and STRAT-02 account for two closed obligations.
- STRAT-02 is validated across all five branches: Skaduwee quiet run 837, Tivara quiet run 838 replay, Tivara air raid run 839, Skaduwee air raid replay from `run-QitzIS`, and the current-source boat run. The air-raid capture has 15 rotating defenders, a peak of 10 simultaneously, and 142 post-contact hits; the evaluator uses the peak. The boat branch passes natively, and its shared setup also passes RAID-03 Skaduwee boat. Full run details are in the evidence archive.
- STRAT-03 and STRAT-04 remain open. Do not repeat a branch without a new causal hypothesis, but iterate on the same branch when capture evidence identifies a specific setup, control or evaluator defect; keep native outcome requirements fixed. STRAT-09 has passing branch evidence; revalidate affected rows in the grouped CI/final gate.
- H-10 has local evidence for six of eight variants; over-capacity and seven real-peer obligations remain with CI. Two of the 22 selected native obligations are closed: STRAT-05 and STRAT-02. The other 20 still require complete family/source evidence.

## Package cursor

| Package | Current state |
| --- | --- |
| 3 — scouting, combat, access | STRAT-05 and STRAT-02 are validated; one affected RAID-03 boat branch passes. Continue with STRAT-03/04, SCOUT, DOMAIN, remaining RAID, FIGHT and C cases. |
| 4 — placement, walls, recovery | PLACE-03 route/transit evidence; H-11 `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07, H-08/09 peer evidence, H-10 over-capacity CI, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission and final closure audits. |

## Next action

Next inspect STRAT-03 run 822's retained native response timeline and form a concrete pressure/visibility hypothesis for the two unmet outcomes (visible reinforcements and native damage to the original Sandhold). Change the authored control/world only if the capture supports that cause, then run only the affected reinforced Tivara branch. If no specific cause is supported, move to STRAT-04 noise rather than replaying run 822 unchanged. Continue through dependency-ready families; the registered runtime/peer matrix is the final regression gate and PR #814 remains draft.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
