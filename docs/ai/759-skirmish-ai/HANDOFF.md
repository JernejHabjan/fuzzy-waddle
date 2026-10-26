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

- Branch `feature/759-skirmish-ai`, source checkpoint `f982f1df4` (evaluator fix committed; push pending); latest CI diagnostics read at `86e18064408edc57cc51ee615a6c9bfe0c8927ad`. Node 24.18.0 / pnpm 11.14.0.
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
missing bindings. Runtime evidence advanced from failed attack/effect and worker survival (764), through a Stage 13
pressure-commitment attempt (765) and an ineffective tactical-target guard (766), to a changed-source Tivara raid that
passes its registered native predicates (767). The 767 report records 200 decisions / 4,001 ticks, 10 enemy losses,
1,925 native damage and all eight workers alive. It does not damage `main-target` specifically; record this as one passing
raid branch, not target destruction or family closure. The owner fix releases an unproductive, underpowered working
objective when another observed target already meets its force requirement, while retaining objectives with active
native attack orders or useful effect progress. Focused gameplay gate: 103 suites / 546 tests. The separate Tivara denial
branch on this source was attempted: run 768 exhausted Node before producing a payload (infrastructure only); run 769
completed 200 decisions / 4,001 ticks and failed only `comeback_feasible_risky_objective_has_no_native_effect` (7 workers
survived, 7 enemy losses, 2,097 damage, no damage to `main-target`). A pressure-window experiment replayed as 771 kept the
attack mission's target on the producer through tick 400, but still produced no producer damage and ended with only two
workers; that unproven source experiment was reverted. Artifact:
`tmp/ai-skirmish-matrix/771-package3-strat09-denial-pressure-objective/1793018412392-diagnostic_failed.json`. The 771
capture shows repeated native attack requests against the `InfantryInn` at (16,30), while a Tivara Maceman at (18,31)
has native distance 2 and range 1. Tick-20 observation has no tactical or construction cells, so the AI has no public
legal approach-cell set to position melee units against this target. This is a geometry/input-contract lead, not proof
that range alone blocks damage: attack-request/committed capture means cooldown started, not that impact occurred. Next
determine how the runtime can expose legal approach cells (or whether this fixture should use a reachable target), add a
focused geometry/input test, and only then replay denial. Advance other Package 3 cases between attempts; do not extend
pressure commitment alone or rerun this branch unchanged.

The Tivara unrecoverable branch then reached its expected loss after its fixture removed the last worker and home at
tick 800, but failed the generic evaluator's unconditional `worker_bootstrap` check. That contradicted STRAT-09's
authored elimination control. The check is now exempt only for variant IDs ending in `-unrecoverable` under STRAT-09; the
focused evaluator test confirms raid/denial branches and other scenarios still require a worker. Changed-evaluator replays
pass for both `strat-09-tivara-unrecoverable`
(`tmp/ai-skirmish-matrix/773-package3-strat09-unrecoverable-worker-oracle/1793019529045-diagnostic_passed.json`) and
`strat-09-skaduwee-unrecoverable`
(`tmp/ai-skirmish-matrix/774-package3-strat09-skaduwee-unrecoverable-worker-oracle/1793019662573-diagnostic_passed.json`),
each at 200 decisions / 4,001 ticks with an authoritative loss after elimination. The Skaduwee raid branch (775) then
failed three predicates: no applied attack on authored `main-target`, no native effect there, and final worker survival.
It selected a nearby second `WorkMill` (`enemy-deposit` at 17,28) over `main-target` at 16,30; the first attack-move used
that deposit's tile, the later direct attack also targeted it, and multiple Stage 13 approach moves failed natively.
The match reached 200 decisions / 4,001 ticks, ending with `quit`, zero workers and one enemy loss. Artifact:
`tmp/ai-skirmish-matrix/775-package3-strat09-skaduwee-raid/1793020426279-diagnostic_failed.json`. This establishes a
fixture/objective ambiguity and physical approach failure lead; do not rerun unchanged. STRAT-09 then had 3 passing and 2
failing native branch evidence out of 8, with 3 branches unrun; this was not family closure. The Tivara path-outage branch
(776) also reached 200 decisions / 4,001 ticks and failed the same authored-target attack/effect predicates. It kept 7
workers and 10 military units. At tick 20 it selected `enemy-deposit` as the working pressure target while `main-target`
ranked first among alternatives; by tick 800 it had changed to the enemy home as a finish objective. This supports an
objective/attack-application issue rather than economic collapse. Artifact:
`tmp/ai-skirmish-matrix/776-package3-strat09-tivara-path-outage/1793021312931-diagnostic_failed.json`. STRAT-09 now has
3 passing and 3 failing native branch evidence out of 8, with 2 branches unrun. The first Skaduwee denial attempt (777)
reached 4,000/4,001 ticks, but Playwright's 780-second timeout closed the browser before the final tick and evidence seal;
the resulting artifact has zero captured decisions/ticks, so it is not branch evidence. The timeout budget was sized for
roughly 2,400 ticks, not these 4,001-tick matches. It is being increased to 15 minutes per selected runtime variant
(18 minutes including startup/sealing), then 777 will be replayed once. Do not replay 775/776 unchanged. Continue the
remaining open STRAT-09 branch after correcting the harness budget.

## Package cursor and known open work

| Package | Open work |
| --- | --- |
| 3 — scouting, combat, access | STRAT-09: Tivara raid and both unrecoverable branches pass; Tivara denial, Skaduwee raid and Tivara path-outage fail; two branches remain; SCOUT, STRAT-02/03, DOMAIN, RAID, FIGHT and C families. |
| 4 — placement, walls, recovery | PLACE-03 route clearance and physical transit; H-11 construction path returns `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07 fixture/evaluator gaps; H-08/09 peer evidence; remaining H-10 over-capacity CI variants; remaining H-14/H-15 branches; H-31/H-32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and remaining supported SEQ/D cases; D-06 legacy comparison remains unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery and legacy audits, omission and final closure audits. |

### Next action

The SCOUT-02, DOMAIN-05 and STRAT-09 feasible-objective repairs are pushed through `cbb0c0425`; the STRAT-09 elimination
oracle repair is pushed at `f982f1df4`. PR #814 remains draft; its
runtime matrix runs only after `ready_for_review`, and the existing
handoff forbids changing PR status. Do not repeat the local SCOUT-02 match or STRAT-09 Tivara raid. Continue Package 3
with remaining evidence-ready STRAT-09 branches and other Package 3 cases; resolve the denial/raid fixture and approach
lead before replaying those failures. Advance if the next hypothesis needs a fixture change or external CI. Leave current
SCOUT-02/DOMAIN-05 native outcomes for CI. PLACE-03 can
be revisited once route/movement inputs are observable, as described above. Preserve the CI dependency for H-10's two
over-capacity variants and real-peer obligations. Keep CURRENT-EVIDENCE concise; archive only details that aid a later
causal repair.
