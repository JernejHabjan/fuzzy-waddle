# RTS AI — evidence ledger

Updated 2026-10-31. T/S1/S2/S3 and SCOUT-02 are closed. Refresh the local regression pack after the final offense/observation change; remote CI remains.
Prior detailed ledger is preserved at commit 90e8d711a. Read it narrowly when provenance is needed.

## New acceptance

| IDs | State | Evidence / next action |
| --- | --- | --- |
| T1–T2 | complete | Phaser and portal-e2e owning `tsc --noEmit` both pass. Focused gameplay suites: 7 suites/47 tests; Phaser: 8/40; portal evidence helpers: 6 specs/40. One stale expansion test expected withdrawal tick 500 while manifest and factory specify 440; corrected and targeted test passed. |
| S1 | complete | Six behavior classes mapped below; proposal/admission/application/useful effect are recorded separately with exact current specs and native limits. |
| S2 | complete | Positive/negative controls verified across all six strategic behaviors; AI gameplay preflight passes 105 suites/630 tests. |
| S3 | complete | Native evidence covers scouting/intel (SCOUT-02), air response (DOMAIN-05), upgrade timing (TECH-01), harassment (RAID-01), and counterforce adaptation (STRAT-05). Details below. |
| R1–R4 | in_progress | Shared manifest command, strict boolean E2E hook and opt-in CI workflow are authored and locally exercised. Current-source pack passed: seven selected cases, all accounted for, 1,527,416ms (25m27s), within the 30m cap. Remote workflow execution remains. |
| F1–F3 | complete | Current full family `1793446488003-passed`: 10/10 variants, 1,200 decisions, 24,010 ticks, 23m10s; fixture `fnv1a32:c1a463c0`, dirty source `fnv1a32:b02a039e`. |
| C1–C3 | in_progress | Both owning TSC checks, focused changed-owner tests, changed-file lint (0 errors) and current-source regression pack pass. Task-owned commits are pushed. Full project lint still reports errors in unchanged legacy files; final audits are recorded. Remote workflow validation is blocked because GitHub has not indexed the new workflow on the default branch. |

## Retained single-player evidence

These are bounded historical passes, not automatic current full-family certification.
Source/fixture details remain in the ledger at 90e8d711a and ignored native reports; verify applicability before selection.

| Area | Evidence |
| --- | --- |
| Placement/recovery | PLACE-03 both-faction layout/concurrent/completion/loss. Corrected completion reports 1793328176798, 1793328339115; loss 1793328568541. H-11 both factions 1793316324413/1793316467854; builder-loss control at 76bec1347. |
| Walls | WALL-01 useful effect Tivara 1793320599420, Skaduwee 1793327749131; Skaduwee no-value 1793321331730. |
| Expansion | Withdrawal 1793329609190/1793329761479; combat-resolved 1793329279497/1793329456393; fixture fnv1a32:48f86832, source c31e56b1dc91. |
| Basic scouting | H-14 harmless physical trips Tivara 1793303409673, Skaduwee 1793305015091. This does not close SCOUT-02. |
| Ownership | Retained H-06/07 and H-10; H-13 Skaduwee 1793300480186 passed; Tivara 1793300103293 capture required evaluator correction. Do not label unrerun corrections as fresh native passes. |
| Victory/recovery | SEQ-01 1793395964724/1793396116011 wins. SEQ-02 Tivara 1793396298669 wins; Skaduwee 1793395560564 recovery established by temporal re-evaluation, not a fresh runtime pass. Source 74c05b455084 + fnv1a32:1cdae123; fixture fnv1a32:5406a5d4. |
| Save continuation | H-31 1793402499466/1793402579687 diagnostic passes; source digest fnv1a32:25e790cc, fixture fnv1a32:b3671489. Exact restore/first input, 15 continued decisions, 3 queue completions by tick401. Later physical observations diverge. |
| Next match | H-32 Tivara normal/paid_queue 1793314086840/1793314126658; Skaduwee normal 1793333000870 confirms old scene cleanup and one progressing controller. |
| Review fix | 90e8d711a defers restored hit target lookup until impact and cancels replaced timers; 3 focused regressions pass, scoped lint 0 errors. Native H-31 reports predate this fix. |

## Strategic checks audited

- G = libs/games/probable-waffle/gameplay/src/lib/player/ai-controller.
- G/planning/ai-adaptation-manager.spec.ts: TECH-01/02 upgrade benefit/emergency controls; DOMAIN-05
  exposed valuable air objective versus irrelevant/anti-air-covered target.
- G/planning/ai-adaptation-scenarios.spec.ts: air clue versus confirmed mass, distinct sightings, executable counters.
- G/planning/ai-scouting-admission.spec.ts: reachable objectives, available scout, answered goals and exclusive claims.
- RAID-01/02 and STRAT cases specify sensible harassment/withdrawal; audit actual test/native evidence before claiming coverage.

## Strategic decision audit (S1/S3)

| Behavior | Decision evidence | Native/effect evidence and boundary |
| --- | --- | --- |
| Start useful scouting | `ai-scouting-admission.spec.ts`, `ai-scout-search-questions.spec.ts`, `ai-skirmish-offense.spec.ts`: reachable/unanswered questions get a scout; answered/unreachable/claimed goals release or preserve the right pawn. | SCOUT-01 four variants and H-14 both factions have retained physical-trip evidence. Basic discovery/service passes; stale-intel closure is separate. |
| Investigate stale intel | `ai-adaptation-manager.spec.ts` TECH-04 ages last-seen evidence without refreshing on memory; search/answer tests cover questions and re-dispatch. | Full SCOUT-02 native family `1793446488003-passed` proves physical service, confidence decay, no hidden-state input/intent differences, and both factions' controls. |
| Justify air production | `ai-adaptation-manager.spec.ts` DOMAIN-05 positive exposed-value and negative irrelevant/observed-anti-air tests assert demand suppression. | DOMAIN-05 `1793447721151-passed`: six native exposed-value, anti-air and no-value branches. |
| Harass and withdraw | `ai-skirmish-offense.spec.ts` reserves limited force for an exposed worker/economy raid while the main force keeps its objective; defended targets and home defense suppress excess reassignment. | RAID-01 `1793453795782-passed`: 8/8 variants across both factions, exposed workers/expansion/unfinished producer and protected controls; 960 decisions, 19,208 ticks, 17m21s; fixture `fnv1a32:164d5d1c`, source `fnv1a32:4542cb24`. |
| Time upgrades | `ai-adaptation-manager.spec.ts` TECH-01/02 delays research for a small beneficiary army, funds useful mass, and protects emergency survival. | TECH-01 `1793446778377-passed`: small/mass Tivara controls; the small force defers the Maceman upgrade and the mass case completes it once. Source `fnv1a32:62b2edfa`. |
| Adapt composition/strategy | `ai-adaptation-scenarios.spec.ts` distinguishes repeated from distinct sightings and selects executable counters; offense tests split fronts and proportional defense. | STRAT-05 family `1793454820881-failed` had one over-narrow evaluator predicate on Tivara reinforced. Captured decisions show defend stance, a populated defense squad and attacks on discovered reinforcements. The evaluator now accepts that response; focused spec passes and selected replay `1793455109552-diagnostic_passed`. Five other variants passed in the family; diagnostic replay does not certify full-family coverage. TECH-04/05/06 and STRAT-02/03/08/09/RAID-03 remain outside this evidence. |

## Shared local/CI regression command (R1–R4)

- Pack: `tools/ai/fixtures/ai-regression-v1.json`; exact selected cases are PLACE-03 completion (both factions),
  WALL-01 Skaduwee terrain/no-value pair, H-13 Skaduwee new-identity, and SEQ-01 victory (both factions).
  Historical estimate 22.5 minutes; hard total cap 30 minutes. Other variants are explicitly listed with reasons in
  the generated `tmp/ai-skirmish-regression/selection.json`; they are not certified by the core pack.
- `pnpm ai:regression -- --list` resolves current manifest/fixture identities; `pnpm ai:regression` runs the pack.
  `pnpm e2e` runs normal E2E; only exact `RUN_AI_REGRESSION=true` adds the pack. Invalid boolean values fail.
- Current-source full local pack passed in 1,527s (25m27s): 7/7 selected variants, 105 suites/632 tests in
  preflight, no failed or skipped case, within the 30m hard cap. Aggregate:
  `tmp/ai-skirmish-regression/latest.json`; current run reports `1793455541889`, `1793455735562`,
  `1793456109928`, `1793456315840`, `1793456526733`, `1793456641577`, `1793456773733`. All reports use
  source revision `90e8d711a` plus current working-tree digest `fnv1a32:4f3eea29`; fixture digests and artifact
  paths are in the aggregate. The seven-case selection is diagnostic coverage, not full-family certification.
  Ordinary flag-off portal smoke also passed (`app.spec.ts`, one test/35.6s).
- PR/develop runtime selection is gated by repository variable `RUN_AI_REGRESSION` (unset/false by default).
  `.github/workflows/ai-regression.yml` exposes the manual boolean. Workflows are authored but no successful remote
  execution/artifact set exists; preserve the separate peer job and draft status of PR #814.

Coverage terms stay separate: a proposal is not an admitted order; an admitted order is not native application; application is not useful effect. Regression selection must cite exact manifest fixture and variant and retain the relevant exclusion reason.

## SCOUT-02 native closure (F1–F3)

- The reachable scout probe is selected for the primary information mission; current full capture demonstrates actual
  movement/coverage, aged evidence, hidden-state fairness and the contact's native survival/control predicates.
- Comparison uses a material stale interval of 360 ticks: the code decays visible evidence from 700 confidence by
  one per simulation tick, so the stale capture has at most 340 confidence while leaving time for service.
- Hidden-position target uses an accessible inland destination; paired branches share a faction-specific fixture ID
  so exact intent comparisons are not perturbed by unrelated generated actor identities.
- Full family `1793446488003-passed`: 10/10, 1,200 decisions, 24,010 ticks; fixture `fnv1a32:c1a463c0`, dirty
  source `fnv1a32:b02a039e`. No unchanged rerun is needed.

## Last-seen combat classification

- Last-seen contacts retain only `wasCombatant`, derived from actually observed military capability or positive attack;
  combat profiles, weapon stats, health and housing remain hidden. The marker persists in observation save state and
  expires with the existing 1200-tick contact lifetime.
- Gameplay routing spec: 8/8; Phaser observation-memory spec: 12/12; Phaser and portal-e2e owning TSC checks pass.
- RAID-01 full native confirmation `1793453795782-passed` exercises the cross-faction remembered-defender path.

## Closure audit

- Omission audit: T, all six S behaviours, R1–R4, SCOUT-02 F1–F3 and C1–C3 each have a ledger row above. Unsupported peer obligations, multiplayer, ESCORT/naval, D-06 calibration, optional islands and advanced replay remain excluded explicitly below.
- Final closure: task-owned changes are pushed in `795d2f8b2` and `1854f11c4`; local focused/native checks and the selected pack pass. Current-source S3 includes a diagnostic STRAT-05 replay, not full-family recertification. Full-project lint errors are limited to unchanged legacy files. Remote C2 is blocked by GitHub requiring the workflow on the default branch; therefore the overall goal remains open.

## Known limitations and exclusions

- Earlier SCOUT-02 reports failed before the route/identity corrections; the latest full family passes and supersedes
  those diagnostic outcomes for the current fixture only.
- CI jobs exist but skip draft PRs. The new workflow is pushed on this branch, but GitHub does not list it until it exists on the default branch; `gh workflow run .github/workflows/ai-regression.yml --ref feature/759-skirmish-ai` returned HTTP 404 `not found on the default branch`. Dispatch prerequisite: make the workflow available on the default branch, then dispatch with `run_ai_regression=true`. No successful new remote run recorded. PR #814 remains draft/unchanged.
- Seven historical peer obligations, ESCORT 1793242080163, D-06 comparison/calibration, optional islands and
  advanced replay certification stay outside this goal. Show exclusions in the regression report.

Update affected rows with command/result, source/fixture/report identity, coverage and next action.
Do not replace missing native proof with planner reason strings or successful command dispatch.
