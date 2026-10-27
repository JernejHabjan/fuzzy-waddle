# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-27

- Latest native evidence: base `7b88f9441dd6`, dirty-source digest `fnv1a32:cf530ad0`, fixture digest `fnv1a32:a86d7fbd`; Node 24.18.0 / pnpm 11.14.0. STRAT-03 passes all six registered branches; the focused change batch is being committed/pushed.
- Packages 1–2 are validated; SEQ-01 completes the two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 is validated across all six registered branches. Tivara reinforced run 830 replays cleanly after preserving 621 route-order identities (limit 1,024), matching accepted `effect:` IDs to native movement IDs, and recognizing nine physical retreats. Tivara quiet run 831 replays cleanly: 14 hits on the spent contact through tick 222, then eight hits on `front-target-b` at ticks 468–741. Tivara blocked-retreat run 833 passes on the corrected world: its opening target is forward of a homeward barrier and its bounded alternative requires a plan change plus physical counterforce damage. Skaduwee reinforced run 834 passes at 120 decisions / tick 2,400 with closed history and no AI errors. Skaduwee quiet run 835 replays cleanly: 15 contact hits by tick 150, then a hit on `enemy-home` at tick 835 before the AI withdraws under losses. Skaduwee blocked-retreat run 836 passes at 120 decisions / tick 2,400 with closed history and no AI errors. Current-source evaluator replays clear all original report failures; full chronology is in the archive. STRAT-05 and STRAT-02 account for two closed obligations.
- STRAT-02 is validated across all five branches: Skaduwee quiet run 837, Tivara quiet run 838 replay, Tivara air raid run 839, Skaduwee air raid replay from `run-QitzIS`, and the current-source boat run. The air-raid capture has 15 rotating defenders, a peak of 10 simultaneously, and 142 post-contact hits; the evaluator uses the peak. The boat branch passes natively, and its shared setup also passes RAID-03 Skaduwee boat. Full run details are in the evidence archive.
- STRAT-03 is validated across all six branches. Tivara minor and reinforced win (reinforced retains Sandhold, observes all 12 reinforcements and records scaled defense); Tivara withdrawn quits after defense and post-recall offense. Skaduwee minor and withdrawn win; reinforced quits after defense. All finish at 150 decisions / 3,001 ticks; artifacts and branch metrics are in the archive. STRAT-04 is next; STRAT-09's passing branch evidence needs grouped final recheck after affected changes.
- H-10 has local evidence for six of eight variants; over-capacity and seven real-peer obligations remain with CI. Three of the 22 selected native obligations are closed: STRAT-05, STRAT-02 and STRAT-03. The other 19 still require complete family/source evidence.

## Package cursor

| Package | Current state |
| --- | --- |
| 3 — scouting, combat, access | STRAT-05, STRAT-02 and STRAT-03 are validated; one shared RAID-03 boat branch passes. Continue STRAT-04, SCOUT, DOMAIN, remaining RAID/FIGHT/C cases. |
| 4 — placement, walls, recovery | PLACE-03 route/transit evidence; H-11 `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07, H-08/09 peer evidence, H-10 over-capacity CI, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission and final closure audits. |

## Next action

Next investigate STRAT-04's retained native failure with a targeted route/order hypothesis, then execute its supported branches. Continue dependency-ready Package 3 families, advancing between concrete failures rather than looping on unchanged evidence. The registered runtime/peer matrix is the final regression gate and PR #814 remains draft.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
