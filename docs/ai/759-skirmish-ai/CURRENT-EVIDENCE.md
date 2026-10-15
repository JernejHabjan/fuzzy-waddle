# #759 current evidence

[HANDOFF.md](HANDOFF.md) owns continuation. Package 1 is validated; resume package 2 economy/technology.

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

| IDs | Outcome evidence | Status / exact limits |
| --- | --- | --- |
| PRO-01/02 | `production-certification/1792041441642-failed.json`: four shared capacity worlds, both factions | Both scenario predicates pass. That grouped command failed solely on the old PRO-04 setup; do not relabel its process result as passed. PRO-01's full dated-force delivery also reuses the retained PRO-03 future-committed worlds. |
| PRO-04 | `production-composition-corrected/1792041648788-passed.json` | Fresh eight-world command passes; 246 decisions, 4984 ticks, 81 seconds. Target 12, two new useful copies, horizon 600 and stable retention 200 remain. Fixture digest `fnv1a32:aad05935`, runtime dirty digest `fnv1a32:4a2d6fcf`. |
| PRO-05 | `production-certification/1792041441642-failed.json`: three native producer-loss repetitions | All three repetitions pass their native replacement predicates. Both-faction pure controls separately cover the one-to-three capacity transition, 100 decisions after fulfillment, duplicate/late callbacks and one necessary replacement. |
| PRO-03/06/07 | `staging-combined-results.json`: 16 authority worlds and all three pair gates | Retained unaffected evidence. The last checkpoint's two contention runs use permanent housing rallies/contact-range movement; the other 14 worlds use unchanged semantics. Original provenance is in their raw setup and Git checkpoint `ca0e3cac0`. |
| H-17 | `certification-retained-worlds.json` | Reprojection of four retained future-demand worlds through current H-17 predicates: four pass, both pair gates pass. Abandoned at 320; paid Tivara producer finishes at 553, Skaduwee at 629, with no obsolete producer/product admission. Both ground/water blocked-spawn, failed queue terminal/next-output and pure lease-cleanup controls also pass. |

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

Package 2: ECO-01–08, H-16/H-18 and TECH-01–06. Reconcile existing delivered-income/worker/supply/research evidence,
map missing aggregate-budget/depletion/recovery/counter cases, then repair shared owners together. It must establish
both factions' renewable income from the normal 200-resource start and useful optional spending after essential
recovery. No diagnostic architecture expansion is planned; machinery necessity review remains the last roadmap task.
