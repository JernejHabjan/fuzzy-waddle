# #759 current evidence

[HANDOFF.md](HANDOFF.md) owns continuation. Package 2 economy/technology remains open.

## Economy/technology checkpoint — 2026-10-15

**Package 2: 11/16 outcomes passed (68.75%); 5/16 remain (31.25%): one failed outcome and four unavailable native setups.**
Passed: ECO-01/02/03/04/07 and TECH-01–06. Failed: ECO-08. Missing native: ECO-05/06, H-16/H-18.
Tested base: `f3c5dd458ec72404c77b7ca050e86a1fceef3f5b` plus this publication's source/tests/fixtures.
No prices, harvest yields, construction times or combat values changed. This is a partial package checkpoint;
Package 3 has not begun. All short artifact paths below are ignored under `tmp/ai-plans/759-validation/`.

### Authored behavior and purpose

- Both faction openings secure the Granary before military infrastructure. Priced outstanding opening work informs
  workforce growth; two workers can bootstrap one Field, and ready Fields can be staffed before military construction.
  Food claims precede general gathering; all earlier actor claims are excluded from later gathering/housing selection.
- Unaffordable new opening construction keeps its demand but does not claim a worker needed to gather missing wood.
  Initial supply accepts existing ready capacity covering current/queued population plus one spare slot; historical
  checkpoint completion does not suppress later necessary housing. Housing requires a capable, unclaimed builder.
- Public visible air-production capability admits one precaution; distinct confirmed flyers scale the counter target
  up to six. Cooldown gates target changes rather than filling an admitted deficit. Native output joins accepted
  counter intent, legal product, producer and actual queue completion; planner targets alone cannot pass.
- A pause inside a multi-tick render frame now stops additional ticks while retaining accumulated time. The runner
  pauses through the existing tick stream at exact requested ticks (horizon + 1 for a closed authority prefix).
  Manual/lockstep tests preserve other pause reasons and subscriber delivery; no observer architecture was added.
- Clean-map supply/opening setups remove inherited campaign main buildings. Finished starting houses are not new
  construction attempts. Technology recipes use legal prerequisites, inherited starting-army identity and an actual
  armoured FrostForge. ECO-08 requires delivered food alongside a ready owned Field, projected from existing resource
  observations; the score's collected-food metric is not reliable proof for this Field path.

### Accepted evidence union and exact limits

| IDs                  | Evidence / outcome                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ECO-01/02/03         | `economy-and-armour-regression/1792079799788-failed.json`: all three pass across retained resource-service/saturation worlds. That grouped command failed the then-overshooting ECO-04 digest; it is not relabelled passed.                                                                                                                                                                                       |
| ECO-04               | Final `economy-supply-opening-final/1792082168359-failed.json`: all three exact-tick repetitions pass. Earlier exact-tick pass also retained at `exact-tick-economy-closure/1792080596968-failed.json`.                                                                                                                                                                                                           |
| ECO-07               | Final grouped command above: six clean-map shortage/control worlds pass; no unnecessary control housing.                                                                                                                                                                                                                                                                                                          |
| ECO-08               | Final grouped command: renewable food succeeds in all five worlds, but both ordinary starts miss first-producer completion by 3000. Both have four workers, 20 food, 110 wood; Granary completes640 and Field is ready900. The three growth repetitions complete the producer500 and retain8/9/8 workers; their outcomes diverge after900 despite exact ticks. Deadline, growth and determinism remain unchanged. |
| TECH-01/02           | `technology-research-matchup-final/1792079481748-failed.json`: both pass across three native worlds. One beneficiary withholds research; a large eligible army completes it once; emergency spending delays it until safe. The grouped command's old matchup setup failed.                                                                                                                                        |
| TECH-03–05           | `technology-counter-rechecked.json`: all three pass from four shared native worlds. Counters actually complete; paid output can finish after withdrawal without new stale admissions or gratuitous cancellation. Fresh two-world TECH-03 confirmation is in `exact-tick-economy-closure/1792080596968-failed.json`.                                                                                               |
| TECH-06              | `economy-and-armour-regression/1792079799788-failed.json`: both actual-armour/executable-versus-unavailable counter branches pass. Pure effective/weak matchup and retreat controls also pass.                                                                                                                                                                                                                    |
| ECO-05/06, H-16/H-18 | Native recipes remain unavailable. Their executed pure forecast/housing/service controls do not replace the missing physical budget/depletion/recovery branches.                                                                                                                                                                                                                                                  |
| PRO-04 regression    | Final grouped command: all eight composition worlds pass after shared opening/housing/gathering changes. Package1 remains8/8 validated on the retained production evidence below.                                                                                                                                                                                                                                 |

The final grouped native command executes22 distinct worlds, 2025 decisions /40500 ticks, in215201ms.
Source dirty digest `fnv1a32:78e120ac`; fixture digest `fnv1a32:07739c35`. Its overall status is failed solely on
ECO-08's digest and two opening checkpoints. Later review removes one duplicate identical housing filter and renames
local gathering variables, plus formatting of tests/JSON; no simulated behavior changes after this run.

### Native report size and retained proof

`technology-counter-rechecked.json` re-evaluates
`tmp/ai-skirmish-runtime-results/run-Qoe6mN/runtime.json`: source `f3c5dd458ec7`, dirty
`fnv1a32:1cbf6be4`, fixture `fnv1a32:501c9b4e`, 203 decisions /4095 ticks, required frontiers closed at1000.
The native report says passed, but its outer command rejects the319MB artifact against a256MiB ceiling. The outer
command remains failed. Current-reader reprojection retains the native facts; future full captures use bounded
scenario/variant batches and then check the complete required branches together. The byte ceiling was not raised.

### Checks and audits

- Selected16-ID pure gate: `economy-tech-pure-final/1792081979083-passed.json`,26 suites /118 tests,16 executed IDs,
  none missing. H-16/H-18 now have explicit mappings and TECH-06 an explicit semantic control.
- Affected gameplay:16 suites /70 tests (`economy-gameplay-final.log`). Phaser clock/fixture controls:2 suites /15
  tests (`economy-tech-phaser-controls-final.log`). E2E supply/technology/growth oracles:9 pass
  (`economy-tech-oracles-final.log`), including missing food channel, unfinished Field and wrong-producer controls.
- App/gameplay/E2E type checks pass (`economy-{app,gameplay,e2e}-types-final.log`). Standalone Phaser retains the
  same eight baseline errors (`economy-tech-phaser-types-final.log`, compared to
  `certification-phaser-type-baseline.json`); no task-owned error remains. Scoped gameplay/Phaser/E2E lint passes;
  E2E retains two existing non-null warnings in the supply reader.
- Matrix/catalog/metadata tools:8 pass (`economy-tech-tools-final.log`); result/contract tools:11 pass
  (`economy-tech-fixture-tools-final.log`). Catalog regenerated and checked. Formatting and diff whitespace checked.
- Omission Audit: selected16 IDs are mapped to actual pure/native evidence or the four explicit missing setups;
  dispatch, desired counts and partial branches do not close native acceptance. Shared callers, registrations,
  faction legality, negative controls, pause subscription/page teardown and existing-capture reuse reviewed.
- Final Closure Audit: Package2 stays open at11/16; no thresholds weakened, no new machinery, unrelated migration
  ancestry preserved. Only task-owned source/tests/fixtures/docs publish. Final checked 43-file content SHA-256: `2479a6dae0a7c25f3c9f0f34d00b3797b0684a31cab0734752cbba6cf987c955`. Exact paths/hashes are in the ignored
  `economy-tech-source-provenance-final.json`; excludes this plan directory and the generated catalog.

## Production checkpoint — 2026-10-15

**PRO-01–07 and H-17: 8/8 required scenario outcomes pass (100%); 0/8 remaining (0%); no unavailable setup.**
This closes production, not the overall AI roadmap. Evidence combines 31 distinct native outcomes and all eight
ID-specific pure assertion groups. H-17 shares four existing future-demand worlds; it adds no redundant native runs.

Tested base: `ca0e3cac06915c8cde4659b9739820a3a511396e`, plus the containing commit's tests/readers/fixture changes.
No AI production policy, queue/spawn authority, movement implementation or balance values changed in this batch.
Final checked 26-file source/fixture/test diff SHA-256: `17d4e35246dd5b717e96e6b9344743a84588836bbd0c6c2b1153871f89161662`
(excludes this plan directory and the generated catalog); exact paths are in `certification-source-provenance.json`.
Native source/fixture identities remain those embedded in each raw artifact; final assertion guards/formatting do not
change their simulated worlds.

All following artifacts are ignored under `tmp/ai-plans/759-validation/`; no raw captures/logs are committed.

| IDs          | Outcome evidence                                                                                 | Status / exact limits                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRO-01/02    | `production-certification/1792041441642-failed.json`: four shared capacity worlds, both factions | Both scenario predicates pass. That grouped command failed solely on the old PRO-04 setup; do not relabel its process result as passed. PRO-01's full dated-force delivery also reuses the retained PRO-03 future-committed worlds.                                                                                                                      |
| PRO-04       | `production-composition-corrected/1792041648788-passed.json`                                     | Fresh eight-world command passes; 246 decisions, 4984 ticks, 81 seconds. Target 12, two new useful copies, horizon 600 and stable retention 200 remain. Fixture digest `fnv1a32:aad05935`, runtime dirty digest `fnv1a32:4a2d6fcf`.                                                                                                                      |
| PRO-05       | `production-certification/1792041441642-failed.json`: three native producer-loss repetitions     | All three repetitions pass their native replacement predicates. Both-faction pure controls separately cover the one-to-three capacity transition, 100 decisions after fulfillment, duplicate/late callbacks and one necessary replacement.                                                                                                               |
| PRO-03/06/07 | `staging-combined-results.json`: 16 authority worlds and all three pair gates                    | Retained unaffected evidence. The last checkpoint's two contention runs use permanent housing rallies/contact-range movement; the other 14 worlds use unchanged semantics. Original provenance is in their raw setup and Git checkpoint `ca0e3cac0`.                                                                                                     |
| H-17         | `certification-retained-worlds.json`                                                             | Reprojection of four retained future-demand worlds through current H-17 predicates: four pass, both pair gates pass. Abandoned at 320; paid Tivara producer finishes at 553, Skaduwee at 629, with no obsolete producer/product admission. Both ground/water blocked-spawn, failed queue terminal/next-output and pure lease-cleanup controls also pass. |

Fresh grouped command:
`node tools/ai/run-skirmish-matrix.mjs --scenarios PRO-01,PRO-02,PRO-04,PRO-05 --mode runtime --output tmp/ai-plans/759-validation/production-certification`.
Affected rerun:
`node tools/ai/run-skirmish-matrix.mjs --scenario PRO-04 --mode runtime --output tmp/ai-plans/759-validation/production-composition-corrected`.
Summaries use `node tools/ai/summarize-skirmish-report.mjs --report <path> --failures-only --details`.

## Changes and causal evidence

- The old composition setup added ten/twelve authored troops on top of the normal starting soldier. Checkpoint 20
  already had eleven/thirteen; those were initial units, not newly trained output. A checked `starting-army` binding
  now replaces one authored troop, and the outcome reader counts that real inherited identity. An undeclared extra
  actor still fails. Strict faction/roster checks run before tick zero.
- Old producers at `1000,480` and `1000,1150` repeatedly failed native spawns. They now occupy `800,848` and `800,1152`
  in the established test area; all eight corrected runs deliver the required output or correctly retain their control.
  Pure scenario targets, prices, matched balances, queue provenance and native oracle thresholds stay unchanged.
- New capacity controls exercise both factions through actual macro/brain admission, with callback duplication,
  delayed site visibility and late earlier-sequence callbacks; three deterministic repeats agree. H-17 fails an
  actually admitted output, releases its lease and prevents obsolete work after demand withdrawal. Native tests also
  require null spawn/no created actor, exactly one failed queue terminal, then a distinct successful next completion.
- PRO-07 now maps to the existing independent slot/resource/refund admission controls and a 100-decision compatible
  queued-counter control. These pure controls supplement, rather than replace, four retained native authority worlds.
- A pre-existing capacity-priority fixture omitted required `growthReadyTick`. It now explicitly marks that value
  unknown; its builder-priority semantics and both-faction assertions still pass.

## Checks and audits

- All-production pure matrix `--scenarios PRO-01,PRO-02,PRO-03,PRO-04,PRO-05,PRO-06,PRO-07,H-17 --mode pure`:
  **23 suites / 104 tests pass**, all eight IDs have executed assertions, no missing IDs.
  Artifact: `production-certification-pure-final/1792041666690-passed.json`.
- Final capacity/capacity-priority Jest: **2 suites / 8 tests pass** (`certification-capacity-final.log`). Native spawner
  plus shared-queue controls: **2 suites / 16 tests pass** across the retained spawner and final queue results
  (`certification-spawn-controls.log`, `certification-queue-final.log`).
- Focused Playwright oracle controls: **14 pass** (`certification-reader-controls.log`); the final affected composition-reader rerun also passes all nine controls
  (`certification-composition-reader-final.log`). Fixture/catalog/pure-evidence
  Node controls: **23 pass** (`certification-tools-final.log`). These are synthetic/tool controls, not additional matches.
- Portal application, gameplay and portal-E2E TypeScript configs pass (`certification-app-types.log`,
  `certification-gameplay-types-final.log`, `certification-e2e-types-final.log`). Standalone Phaser types still report the same eight previously proven baseline diagnostics, with no new ones
  (`certification-phaser-types.log`, `certification-phaser-type-baseline.json`); that extra config is not a pass.
- Catalog generation/check, owned ESLint (zero errors, one pre-existing non-null warning), diff checks and exact staged review complete at publication. No production
  build or full-manifest release/calibration run is claimed. The owned managed server is stopped.
- Omission Audit: every selected ID is registered and connected to semantic assertions; native identity, full horizons,
  both required factions, delayed/negative/recovery controls and retained-source equivalence are accounted for.
  Final Closure Audit: only changed readers/fixtures/tests/docs publish; historical failed PRO-04 evidence is superseded,
  unaffected predicates remain retained, and no unrelated gameplay/migration changes are staged.

## Next batch

Continue the unfinished economy/technology package using HANDOFF's current cursor and the four concrete remaining
recovery/budget controls in REMAINING-WORK. Do not reopen completed technology registration or advance to combat
while Package 2 remains open. Machinery review/removal remains the last roadmap task.
