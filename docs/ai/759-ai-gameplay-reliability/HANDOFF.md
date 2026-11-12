# AI gameplay reliability and performance

## Retained evidence

- Eight gameplay and performance packets were validated at their recorded revisions on
  `feature/759-skirmish-ai`, PR [#814](https://github.com/JernejHabjan/fuzzy-waddle/pull/814).
- **R1/R8 final:** baseline and measured commit `33b9c5680` use matched seed, fixture, 240 ticks and 12 decisions.
  Combat median: 23.36→17.41s (−25.5%); two-AI median: 20.06→14.95s (−25.5%), retaining 12 decisions per AI.
  Current p95/p99 frame times are no worse than baseline in either workload, and all six final samples report no
  errors. Baseline run-to-run spread is at most 3.5%; both reductions are well beyond it. A separate controlled
  comparison measured 86.76% lower polygon self-time; camera-bounded drawing stays under 2,000 tiles on a 144×144
  map while complete logical visibility/exploration sets remain intact. Same-revision full/bounded fog state hash
  `d9f51b4d` matched. Evidence: `fog-performance-{baseline,comparison}.json`, current reports under
  `rendered-{combat,multi_ai}/33b9c5680f1cd6deabc2bfebe244a940d9a5e4b2-*`,
  `fog-native-state-{bounded,full}.log`; current rendered repetitions contain two state digests per workload, while
  the controlled full/bounded fog pair is equal. Focused fog work-bound tests pass in Phaser's 1,286-test suite.
  The earlier handoff did not preserve a numeric minimum target; use the measured 3.5% baseline spread as the
  closure threshold and retain the original frame-work controls, without adding a wall-clock CI gate.
- **R2 validated:** manual, quick and auto load restore human ownership, camera, selection and movement; three reloads
  preserve elevated workers, Temple, Owl and real River Crossing stones. Teardown and fresh-start controls pass.
  Evidence `editor-stone-manual.log`, `load-all-kinds-input-browser-arg.log`; fixes through `ec38d7785`.
- **R3 validated locally:** the native congestion fixture now places legal staging pockets beyond both ends of a clear
  three-tile corridor, so arrived units do not seal the route before their teammates cross. All 12 opposing workers
  cross to distinct exact destinations, settle through tick 720, and complete their one move command; no facts drop.
  Evidence: `tmp/ai-gameplay-reliability/traffic-pocket-valid/`; Phaser movement boundary (35) and path-execution
  (14) tests pass, and Phaser lint passes with seven existing warnings. The older sealed-mouth geometry was not a
  feasible arrival layout; exact arrival and one-command assertions remain.
- **R4 validated:** all seven native pursuit modes pass on `fe5b6f24f`: moving-target hits, human-order replacement,
  autonomous squad pursuit, equal-speed escape, removed target, bounded unreachable retries and route reopening
  (`AI_GAMEPLAY_RELIABILITY=1 pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts apps/portal-e2e/src/e2e/probable-waffle/skirmish/ai/reproduction/movement/skirmish-gameplay-pursuit.spec.ts --workers=1`; 7 passed, 1.4m; `test-results/`).
  Native adjacent melee selection/damage also passes (`close-range-final.log`).
- **R5/R6 validated:** six native counter modes pass (both factions, ready archer, three ground raiders, hidden-air
  timing, missing Temple); 18 ground-defense hits. Command: `AI_GAMEPLAY_RELIABILITY=1 pnpm exec playwright test
  --config apps/portal-e2e/playwright.config.ts apps/portal-e2e/src/e2e/probable-waffle/skirmish/ai/reproduction/combat/skirmish-gameplay-air-counter.spec.ts
  --workers=1` (6 passed, 6.4m; `ready-counter-trace.json`). Adaptation checks: 22 pass; a 12-unit control leaves most
  troops free against harmless contact (`adaptation-audit.log`, `defense-audit.log`). Large-army pair 2/2: original
  fighters move and damage after fixture-paid production; plan-slot changes issue no replacement Moves
  (`tmp/ai-gameplay-reliability/large-army-order-oracle/`).
- The focused Tivara deficit reproduction paid for four Macemen, completed them at ticks 119/219/319/419 and
  recorded 116 native hits by tick 4000 with no drops on `33b9c5680`. The follow-up review isolated the smaller
  starting army in the focused test and restored the registered C-03 comparison. Evidence for the prior focused
  run is under `tmp/ai-gameplay-reliability/ai-production-continuity-final/`. Full C-03 matrix evidence remains open.
- **R7 validated:** current five-case retreat file passes on the strategy/movement worktree: minor injury in a favorable
  fight, critical infantry/ranged withdrawal, and ground/mixed reinforcements re-engaging after retreat. Command:
  `AI_GAMEPLAY_RELIABILITY=1 pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts apps/portal-e2e/src/e2e/probable-waffle/skirmish/ai/reproduction/combat/skirmish-gameplay-retreat.spec.ts --workers=1`
  (5 passed, 1.5m; `retreat-post-R6/`). Scout withdrawal persists through new search questions and moves
  (`scout-threat-final.log`); mixed domains continue damaging after withdrawal (`mixed-force.log`, `mixed-injury.log`);
  earlier favorable-fight evidence is `quiet-combat-replay.json`.
- Retained artifacts are local under ignored `tmp/ai-gameplay-reliability/`. Ordinary CI passed on
  [`b6b50efdb`](https://github.com/JernejHabjan/fuzzy-waddle/actions/runs/43066672427). The later
  [PR run at `0af96b86c`](https://github.com/JernejHabjan/fuzzy-waddle/actions/runs/43193401305) passed lint
  and catalog freshness but failed three tool tests on the altered C-03 binding. The review restored that binding,
  regenerated the catalog, and verified all 167 AI tooling tests locally.

## Follow-up review

- A replacement movement path now supersedes a path waiting for traffic. Cancelled fallback searches stop after
  the in-flight query, before spending more path work or reserving another tile.
- Attack range checks reject targets from another scene. Defense preserves existing attacks against home threats
  and can recall units attacking a distant target.
- The focused Tivara production test now derives its smaller roster without changing the registered C-03 pair.
  Only damage by completed AI-trained Macemen counts toward its result. The air-defense and large-army checks
  narrow nullable or optional capture data before using it.
- The owning TypeScript and focused checks cover the review changes. Retained gameplay and performance results above
  belong to their recorded revisions. [Coverage and follow-ups](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/coverage-status.md)
  owns the remaining work. Git history retains the original execution plan.
