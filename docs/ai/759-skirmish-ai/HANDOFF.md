# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-26

- Latest local source commit: `cb2ec8650` (`fix(ai): preserve STRAT-05 native retreat evidence`); it is ready to push with the progress-doc commit. Node 24.18.0 / pnpm 11.14.0.
- Packages 1–2 are validated; SEQ-01 completes the two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 Tivara reinforced now passes full native branch evaluation when run 830 is replayed against current source. The saved report originally failed because the evidence pipeline discarded history: 621 distinct route-order identities exceeded the 512 cap, and accepted move IDs include an `effect:` prefix absent from native execution IDs. Current-source replay preserves 566 normalized movements, recognizes nine physical retreats, and returns no branch failures. This is a checked branch, not family closure.
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

Run the STRAT-05 Tivara quiet control (`strat-05-tivara-quiet`) once. It is the next authored branch and checks offensive continuation without reinforcements. Reuse the same fixed evidence bounds; if it passes, advance to Tivara `blocked_retreat`, then move to Skaduwee branches. Do not replay reinforced unchanged; saved run 830 already passes the full evaluator on current source.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
