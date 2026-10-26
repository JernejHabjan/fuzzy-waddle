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

- Branch `feature/759-skirmish-ai`, source checkpoint `5da21a50d89ea866972cead3b945d7e1a59b4897`, Node 24.18.0 / pnpm 11.14.0.
- Packages 1–2 are validated; two-faction SEQ-01 passes with the adaptive build-space rule.
- Package 5 current focused evidence: H-14 Skaduwee harmless passes one of its branches. H-10 passes below-capacity,
  at-capacity and resumed-capacity for both factions (6/8 variants); over-capacity remains for CI. Neither family is closed.
- Newly selected native obligations remain 0/22 closed. One passing branch is not family closure; seven real-peer cases
  require credentialed CI evidence.

## Latest source work

A changed H-14 diagnostic exposed a tactical claim conflict that replaced the primary scout's moving search route. Stage 13
now preserves native frontier Move orders across changing search points. The capture also exposed two evidence-reader defects:
`effect:`-prefixed intent IDs did not match native execution IDs, and bounds of 512 movement groups / 1,024 caller identities
were below a measured capture (1,567 movement groups / 1,869 identities). The bounds are now 2,048 and 4,096; the
independent route-order identity bound remains 256 (235 observed). H-14 then passed its exact physical scout-trip,
income and paid-output predicate.

Focused checks on the current scouting worktree:

- Focused scouting, tactical-scouting, neutral-claim and tactical-combat specs: 44/44.
- After the range-aware air-position change, the broader gameplay suite passed 103/103 suites and 541/541 tests; exact-file ESLint passed with existing non-null warnings.
- Scouting-evidence Playwright tests: 2/2.
- Movement, scout evidence, route order and route caller Playwright suites: 76/76.
- Exact-file ESLint: no errors; existing non-null assertion warnings remain.
- The full gameplay suite exposed two related edge cases; both were repaired and the four focused suites now pass.
- One changed-source SCOUT-02 runtime attempt exceeded its 13-minute one-variant test budget. The owned runner and
  Playwright process tree were stopped; no result artifact was produced. This is a local harness/runtime blocker, not a
  behavior result. Do not launch another local SCOUT-02 attempt; leave it for the registered CI matrix.
- `git diff --check` passes after the current edits.

DOMAIN-05 backline evidence exposed an evaluator mismatch. The changed-source retained capture at
`tmp/ai-skirmish-matrix/760-package3-domain05-air-range-approach/1793003668761-diagnostic_failed.json` records a paid
Tivara Alchemist and three positive native damage callbacks against the exact, previously visible `contact-group`.
The callbacks prove the physical useful effect, while the movement ledger has no matching original-destination arrival;
requiring both discarded the stronger outcome evidence. The DOMAIN-05 backline predicate now requires paid output plus
exact live native damage to the visible authored target. The strict range-aware `nativeWeaponHits` reader is unchanged.
The retained-artifact evaluator diagnostic clears the former failure and the physical-damage attribution spec passes
2/2. This reclassifies this artifact only; it does not close all DOMAIN-05 branches.

The old Skaduwee backline capture (`f083fddbc483`) has no paid air output and predates the current adaptation-manager
change (`ba8e896`). Recomputing its tick-20 observation with current adaptation logic finds two exposed backline clues;
the old selected decision recorded none. This confirms the capture cannot establish the current branch result. Do not
tune from it; CI must supply current native evidence.

PLACE-03's latest owner-navigation artifact (`1792973519220-diagnostic_failed.json`, source `f083fdd`) reports fixture
route-clearance failures plus missing worker/army transit arrivals. The fixture's `protectedRoutes` are evaluator-only;
they are not part of the AI observation. Before changing site selection, reconcile the authored probes with visible native
orders/objectives so the case does not require the AI to preserve hidden route metadata.

## Package cursor and known open work

| Package | Open work |
| --- | --- |
| 3 — scouting, combat, access | SCOUT, STRAT-02/03, DOMAIN, RAID, FIGHT and C families. |
| 4 — placement, walls, recovery | PLACE-03 route clearance and physical transit; H-11 construction path returns `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07 fixture/evaluator gaps; H-08/09 peer evidence; remaining H-10 over-capacity CI variants; remaining H-14/H-15 branches; H-31/H-32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and remaining supported SEQ/D cases; D-06 legacy comparison remains unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery and legacy audits, omission and final closure audits. |

SCOUT-02's first recheck on `1f96d11b1` confirmed that the scout reached `(3,3)` only under a Stage 13 engage order; the
accepted Stage 9 route was interrupted when a visible enemy changed the squad state. The evaluator correctly rejected
that unrelated arrival. A second capture showed the native order had become `Attack`, but Stage 9 still considered its
search effect dispatched and never retried. Stage 9 now redispatches when its active mission no longer has a native Move
to the frontier. Tactical orders preserve a selected or active scout route, while direct search routing is retained for
scouts without an active route and tactical withdrawals keep priority. Completing a neutral scout claim now releases its
unit for frontier scouting in the same decision. Local tests pass, but the changed-source native replay has not produced
evidence and SCOUT-02 remains open.

### Next action

The SCOUT-02 and DOMAIN-05 source/evaluator repairs are committed at `5da21a50d`; focused and broad checks pass, but
SCOUT-02's local native replay exceeded its configured timeout and produced no artifact. Push the source checkpoint and
this handoff update. PR #814 remains draft; its runtime matrix runs only after `ready_for_review`, and the existing
handoff forbids changing PR status. Do not repeat the local SCOUT-02 match. Continue Package 3 from its next
evidence-ready, source-actionable case; leave current SCOUT-02/DOMAIN-05 native outcomes for CI. Do not change PLACE-03
site selection until its fixture stops asserting hidden `protectedRoutes`. Preserve the CI dependency for H-10's two
over-capacity variants and real-peer obligations. Keep CURRENT-EVIDENCE concise; archive only details that aid a later
causal repair.
