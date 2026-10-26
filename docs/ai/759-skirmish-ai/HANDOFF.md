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

- Branch `feature/759-skirmish-ai`, source commit `65a367d891886c90b9bd80b84b4cb156ee9df3dd` (committed, not yet pushed); latest CI diagnostics read at `86e18064408edc57cc51ee615a6c9bfe0c8927ad`. Node 24.18.0 / pnpm 11.14.0.
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

STRAT-09 has one bound pure owner contract; the Package 3 audit passes 40 scenarios / 46 suites / 278 tests with no
missing bindings. Its changed-source Tivara raid (`tmp/ai-skirmish-matrix/764-package3-strat09-defense-objective/1793012199028-diagnostic_failed.json`)
reaches 200 decisions / 4,001 ticks but still fails native attack/effect against `main-target` and worker survival (all
eight workers lost). A Stage 13 guard that keeps defense squads on their committed threat passes a focused targeting
spec, but did not change the match outcome. The report shows repeated failed Stage 13 movement applications and the
attack squad still in `recover`; do not repeat this match unchanged. Next inspect the Stage 9-to-Stage 13 target/order
handoff and native movement-failure causes, then use a focused owner test before deciding whether another replay can
answer a changed hypothesis.

## Package cursor and known open work

| Package | Open work |
| --- | --- |
| 3 — scouting, combat, access | STRAT-09 native target/effect and worker-survival failure; SCOUT, STRAT-02/03, DOMAIN, RAID, FIGHT and C families. |
| 4 — placement, walls, recovery | PLACE-03 route clearance and physical transit; H-11 construction path returns `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07 fixture/evaluator gaps; H-08/09 peer evidence; remaining H-10 over-capacity CI variants; remaining H-14/H-15 branches; H-31/H-32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and remaining supported SEQ/D cases; D-06 legacy comparison remains unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery and legacy audits, omission and final closure audits. |

### Next action

The SCOUT-02 and DOMAIN-05 source/evaluator repairs are pushed at `5da21a50d`; the latest STRAT-09 source and evidence
update is committed and pushed at the next checkpoint. PR #814 remains draft; its
runtime matrix runs only after `ready_for_review`, and the existing
handoff forbids changing PR status. Do not repeat the local SCOUT-02 match. Continue Package 3 from its next
evidence-ready source action after addressing STRAT-09's target/effect and worker-survival failure; advance if the next
hypothesis needs a fixture change or external CI. Leave current SCOUT-02/DOMAIN-05 native outcomes for CI. PLACE-03 can
be revisited once route/movement inputs are observable, as described above. Preserve the CI dependency for H-10's two
over-capacity variants and real-peer obligations. Keep CURRENT-EVIDENCE concise; archive only details that aid a later
causal repair.
