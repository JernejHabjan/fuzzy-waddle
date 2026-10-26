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

- Branch `feature/759-skirmish-ai`; latest pushed source checkpoint is `b77e5bac7`; STRAT-09 path-outage repair and evidence are current local work. Latest CI diagnostics read at `86e18064408edc57cc51ee615a6c9bfe0c8927ad`. Node 24.18.0 / pnpm 11.14.0.
- Packages 1–2 are validated; two-faction SEQ-01 passes with the adaptive build-space rule.
- Package 5 current focused evidence: H-14 Skaduwee harmless passes one of its branches. H-10 passes below-capacity,
  at-capacity and resumed-capacity for both factions (6/8 variants); over-capacity remains for CI. Neither family is closed.
- Newly selected native obligations remain 0/22 closed. One passing branch is not family closure; seven real-peer cases
  require credentialed CI evidence.

## Latest source work

H-14 now passes its exact scout-trip, income and paid-output predicate. It exposed and fixed native evidence bounds:
2,048 movement groups and 4,096 caller identities (1,567 / 1,869 observed); the separate 256 route-order bound remains.

SCOUT-02 fixes now preserve/retry native frontier moves through contact, release completed neutral claims, and keep
tactical withdrawal priority. Checks: focused gameplay 44/44; full gameplay 103 suites / 541 tests; scouting-evidence
Playwright 2/2; movement/scout/route Playwright 76/76; portal type-check; exact-file ESLint (0 errors, 9 existing
non-null warnings); combat-evidence Playwright 2/2; `git diff --check` clean. Its changed-source native replay exceeded
the 13-minute one-variant budget and produced no artifact; do not repeat locally.

DOMAIN-05's changed-source Tivara artifact (`tmp/ai-skirmish-matrix/760-package3-domain05-air-range-approach/1793003668761-diagnostic_failed.json`)
records paid air output and three exact native damage events on a visible authored target. The evaluator now accepts that
physical outcome without a separate movement-arrival record; `nativeWeaponHits` remains strict. Artifact replay clears
the old predicate; this is one branch only. The older Skaduwee artifact (`f083fddbc483`) predates adaptation commit
`ba8e896`; recomputed current evidence sees two exposed backline clues absent from that old selected decision. It cannot
prove current behavior; use CI evidence.

CI diagnostics on pushed HEAD `86e1806` show `skirmish-runtime-plan`, `skirmish-multiplayer` and `skirmish-runtime`
skipped because PR #814 is draft. An old STRAT-02 artifact has 0 decisions / 0 ticks and a browser-context timeout.
PLACE-03's latest capture also fails route clearance and worker/army arrival; its `protectedRoutes` are evaluator-only,
not AI input. Its movement controls begin at tick 200 while static probes run from baseline and opening build tick 20.
Treat this as a fixture/input contract gap, not a permanent ban on iterating the placement owner: make the route observable
before construction or scope the probe to native movement, then use one changed-source replay. Do not repeat unchanged.

The Package 3 pure audit passes 40 scenarios / 46 suites / 278 tests with no missing bindings. STRAT-09 has passing
native evidence for all eight branches. Run 814 closes Tivara path-outage on current local source: its authored
FrostForge at (25,29) receives 34 range-compatible native hits after tick 800, then dies at tick 994; the 4,001-tick
case ends with six workers. Artifact `tmp/ai-skirmish-matrix/814-strat09-tivara-path-outage-middle-range/1793042862573-diagnostic_passed.json`.
Runs 804–805 predate the final useful-objective selector change, so treat them as retained branch evidence and revalidate
source-affected branches in the registered matrix/final grouped gate; do not stall Package 3 on unchanged local replays.
The changed owner releases an underpowered working target for another feasible observed objective while retaining
objectives with live attack orders or useful effect progress.

Skaduwee raid now passes after the fixture puts its authored WorkMill at (26,26), inside the actual ranged units' legal
3–7 tile firing band. Changed-source run 804 passes all predicates at 200 decisions / 4,001 ticks, with 1 worker, 1 army
unit, 749 total damage and 2 enemy losses. The root evidence was native range: at the old location the force's attack
attempts were 8–10 tiles away or inside melee minimum range. The attack selector also now retains a recent remembered
objective through its hypothesis ID while the active squad pursues it, without issuing direct attacks through fog.
Focused gameplay passes 103 suites / 547 tests and `pnpm nx build portal` succeeds (existing bundle budget warning).

STRAT-09 is now 8/8 branches with passing native evidence. Tivara denial run 805 passes at 200 decisions / 4,001 ticks,
with 8 workers, 6 army units, 1,810 damage and 5 enemy losses; its target is at (21,30), within Slingshot range.
Tivara path-outage run 814 passes at the same horizon with 6 workers and 2,061 total damage. Its FrostForge target at
(25,29) records 34 range-compatible post-800 native hits and dies at tick 994. Runs 804–805 predate the final selector
change; revalidate affected branches in the grouped matrix/final gate. Do not repeat unchanged fixtures. Full branch
chronology and artifacts 790–814 are in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md).

To make long combat evidence usable, the browser now gzip-compresses full production captures before Playwright transfer;
the Node side restores the same record. The shared fact cap is 32,768, above the 27k facts required by these 4,000-tick
matches, and its overflow boundary has a focused passing test. Skaduwee denial (788) and path-outage (789) both pass at
200 decisions / 4,001 ticks with workers alive and native target effects. Do not rerun these unchanged.
## Package cursor and known open work

| Package | Open work |
| --- | --- |
| 3 — scouting, combat, access | STRAT-09 has passing evidence on all eight branches; current-source path-outage is closed. Revalidate affected branches in the grouped matrix/final gate. SCOUT, STRAT-02/03, DOMAIN, RAID, FIGHT and C families remain. |
| 4 — placement, walls, recovery | PLACE-03 route clearance and physical transit; H-11 construction path returns `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07 fixture/evaluator gaps; H-08/09 peer evidence; remaining H-10 over-capacity CI variants; remaining H-14/H-15 branches; H-31/H-32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and remaining supported SEQ/D cases; D-06 legacy comparison remains unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery and legacy audits, omission and final closure audits. |

### Next action

The SCOUT-02 and DOMAIN-05 owner repairs are pushed; latest pushed source before this local checkpoint is `b77e5bac7`.
The path-outage source/fixture/evidence checkpoint is currently local. PR #814 remains draft; its runtime matrix runs only after
`ready_for_review`, and the existing handoff forbids changing PR status. Runs 804–805 close only the Skaduwee raid and
Tivara denial branches; run 814 closes Tivara path-outage. Advance now to the next Package 3 family with concrete
registered evidence; do not repeat SCOUT-02's timed-out local match without a harness change. Leave its changed-source
result and DOMAIN-05's partial result for the grouped CI/final matrix. PLACE-03 can be revisited once route/movement inputs are observable. Preserve the CI
dependency for H-10's over-capacity variants and real-peer cases. Keep CURRENT-EVIDENCE concise; archive details only
when they aid a later causal repair.
