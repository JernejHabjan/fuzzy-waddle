# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. The active evidence snapshot is
[CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md); detailed earlier run history is preserved in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md). [CI-RESUME.md](CI-RESUME.md) describes the existing CI runtime matrix.

## User direction and workflow

- Continue through all remaining skirmish-AI steps; track progress here and in CURRENT-EVIDENCE. Revisit an open case when
  its evidence gives a concrete next hypothesis. Do not stop at a passing checkpoint or repeat an unchanged successful run.
- CI already runs registered runtime cases, including the peer matrix. Use local captures for targeted questions after a
  relevant source/fixture/evidence change. There is no second-PC probe requirement.
- The user authorized commits and pushes on `feature/759-skirmish-ai`; no PR update or merge is authorized.
- Do not report CPU or memory usage in routine updates.

## Current checkpoint — 2026-10-26

- Branch `feature/759-skirmish-ai`, source HEAD `09841abdc8996069c0f79d5ca0c422161d8e910a`, Node 24.18.0 / pnpm 11.14.0.
- Packages 1–2 are validated; two-faction SEQ-01 passes with the adaptive build-space rule.
- Package 5 current focused evidence: H-14 Skaduwee harmless passes one of its branches. H-10 passes below-capacity,
  at-capacity and resumed-capacity for both factions (6/8 variants); over-capacity remains for CI. Neither family is closed.
- Newly selected native obligations remain 0/22 closed. One passing branch is not family closure; seven real-peer cases
  require credentialed CI evidence.

## Latest source fix

A changed H-14 diagnostic exposed a tactical claim conflict that replaced the primary scout's moving search route. Stage 13
now preserves native frontier Move orders across changing search points. The capture also exposed two evidence-reader defects:
`effect:`-prefixed intent IDs did not match native execution IDs, and bounds of 512 movement groups / 1,024 caller identities
were below a measured capture (1,567 movement groups / 1,869 identities). The bounds are now 2,048 and 4,096; the
independent route-order identity bound remains 256 (235 observed). H-14 then passed its exact physical scout-trip,
income and paid-output predicate.

Focused checks:

- Gameplay scouting regression: 5/5.
- Scouting-evidence Playwright tests: 2/2.
- Movement, scout evidence, route order and route caller Playwright suites: 76/76.
- Exact-file ESLint: no errors; existing non-null assertion warnings remain.
- `git diff --check`: clean.

## Package cursor and known open work

| Package | Open work |
| --- | --- |
| 3 — scouting, combat, access | SCOUT, STRAT-02/03, DOMAIN, RAID, FIGHT and C families. |
| 4 — placement, walls, recovery | PLACE-03 route clearance and physical transit; H-11 construction path returns `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07 fixture/evaluator gaps; H-08/09 peer evidence; remaining H-10 over-capacity CI variants; remaining H-14/H-15 branches; H-31/H-32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and remaining supported SEQ/D cases; D-06 legacy comparison remains unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery and legacy audits, omission and final closure audits. |

### Next action

Commit and push the focused H-14 scout/evidence-reader repair and this condensed progress update, then inspect the existing CI
matrix results for the remaining H-10 variants and peer obligations. Continue from the first actionable failure, then advance
through packages 3–7. Keep CURRENT-EVIDENCE as a concise active snapshot; put detailed historical diagnostics in the archive.
