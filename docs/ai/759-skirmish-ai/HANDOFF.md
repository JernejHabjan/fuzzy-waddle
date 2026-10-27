# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-27

- Base `2210ab7fe09d`; current STRAT-04 source/fixture changes are uncommitted. Node 24.18.0 / pnpm 11.14.0.
- STRAT-04 passes all six registered branches in report `1793069202745-passed.json`: 600 decisions / 12,006 ticks; source base `2210ab7fe09d`, dirty-source digest `fnv1a32:d22008af`, fixture digest `fnv1a32:4e15b8c2`. Root repairs and branch outcomes are archived.
- Packages 1–2 and SEQ-01 are complete. STRAT-02/03/04/05 and STRAT-09 are validated. H-10 still has six of eight local variants; its over-capacity and seven real-peer obligations remain CI-owned. Selected native obligations closed: **4/22**.
- Packages 1–2 and SEQ-01 are complete. STRAT-02/03/05 and STRAT-09 remain validated. H-10 still has six of eight local variants; its over-capacity and seven real-peer obligations remain CI-owned. Selected native obligations closed: **3/22**.

## Package cursor

| Package | Current state |
| --- | --- |
| 3 — scouting, combat, access | STRAT-04 is validated. Next run SCOUT-01, then SCOUT/DOMAIN and remaining RAID/FIGHT/C cases. STRAT-09 needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | PLACE-03 route/transit evidence; H-11 `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07, H-08/09 peer evidence, H-10 over-capacity CI, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission and final closure audits. |

## Next action

Next execute SCOUT-01's complete registered family, repair only concrete native failures, and advance through dependency-ready Package 3 cases. The registered runtime/peer matrix is the final regression gate and PR #814 remains draft.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
