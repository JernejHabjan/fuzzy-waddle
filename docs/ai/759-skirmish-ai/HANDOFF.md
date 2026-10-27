# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-27

- Source batch `4ca70b3fd` includes the STRAT-04 closure and SCOUT-01 evidence/order fixes, and is pushed. Node 24.18.0 / pnpm 11.14.0.
- STRAT-04 passes all six registered branches in `1793069202745-passed.json`; root repairs and branch outcomes are archived.
- Packages 1–2 and SEQ-01 are complete. STRAT-02/03/04/05 and STRAT-09 are validated. H-10 still has six of eight local variants; its over-capacity and seven real-peer obligations remain CI-owned. Selected native obligations closed: **4/22**.
- SCOUT-01 report `1793071681087-failed.json` confirms a physical scouting-information trip in all four branches; only paired hidden-world selected-intent parity remains red. Deterministic visible-position ordering has since been tightened in shared macro, gathering, recovery, and scout selection. The capture predates the last neutral-scout selector adjustment, so the current source still needs a later paired recheck.
- SCOUT-02 report `1793073090904-failed.json` ran all ten variants (1,200 decisions / 24,010 ticks). Both visible controls pass; hidden/withdrawn branches still fail useful scouting, stale-job service, and survival of the withdrawn contact, and hidden-world permitted-input parity fails. Full failure inventory is archived.
- SCOUT-03 report `1793073566880-failed.json` ran all four variants; only Tivara/Skaduwee escape branches fail `scouting_surviving_physical_escape_missing`. Both trapped branches pass. Continue to SCOUT-04 before grouping the scouting fixes.

## Package cursor

| Package | Current state |
| --- | --- |
| 3 — scouting, combat, access | SCOUT-01/02 parity and withdrawn-contact behavior remain open. SCOUT-03 trapped controls pass; escape survival fails for both factions. Next run SCOUT-04 and DOMAIN, then revisit all scouting gaps as one related batch. STRAT-09 needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | PLACE-03 route/transit evidence; H-11 `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07, H-08/09 peer evidence, H-10 over-capacity CI, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission and final closure audits. |

## Next action

Next execute SCOUT-04's complete registered family, then dependency-ready DOMAIN cases. Keep SCOUT-01/02 parity and contact survival, plus SCOUT-03 escape survival, open for one grouped scouting repair after SCOUT-04; do not repeat unchanged full matrices. The registered runtime/peer matrix is the final regression gate and PR #814 remains draft.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
