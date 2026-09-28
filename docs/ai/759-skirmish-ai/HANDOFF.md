# #759 skirmish AI handoff

Temporary cold-start ledger for unfinished work from #759. Product behavior and test policy live in the
[AI documentation](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/README.md); detailed
implementation routes live in the [subissue plans](follow-ups/README.md). Git/PR history owns completed narration.

## Quick resume

- Planning review (2026-09-28): use the compact batch table in [#816](follow-ups/runtime-matrix-ci.md).
  Pair #815 pure and #816 runtime authoring by family. Metadata is an authoring prerequisite; early-stop and repair
  clustering must exist before execution but do not block independent fixtures. Full-match victory is a final-gate
  obligation, not a prerequisite for writing short cases. Different shards may have different fixture-set digests;
  validate common source/run identity and each shard's expected fixture mapping. Final required evidence belongs
  after tuning, optimization and legacy retirement. This review changes the plan; runtime contracts remain pending.
- Current execution mode (latest user direction, 2026-09-27): implement source and author pure/Playwright scenarios,
  fixtures, and CI contracts, but **do not execute** tests, E2E, simulations, lint, type checks, builds, repository
  validation, `agent:doctor`, or `agent:context` during this sweep. Treat every new change as **unverified**.
  Batch all execution, repair, review, and calibration at the final gate below, and tell the user before starting it.
  This supersedes older per-issue instructions to run checks during the current sweep.

- Branch: `feature/759-skirmish-ai`; draft PR [#814](https://github.com/JernejHabjan/fuzzy-waddle/pull/814) targets
  `develop`. Verify local and remote tips before editing.
- Production-only sweep (unverified): #829 now requires a visible, positioned enemy near a protected asset for local
  threat posture; #827 grows a bounded force from evidenced required strength, adds throughput only for a dated deficit,
  distinguishes effective ranged weapons, bounds support composition, and can choose a ready useful raid over a larger
  objective that still needs reinforcements. Pure and runtime proof remains entirely at the final gate.
- #821 macro split (unverified): `AiMacroManager.propose` is now a 191-physical-line orchestrator in a 222-line file;
  its source-structure baseline exemption was removed. Opening, general labor, housing, food prerequisite/Field/labor,
  military force context, producer capacity, and affordable role-balanced unit proposals have focused owners. Preserve
  their existing intent/demand ordering, ordinal IDs, site reservations, and accepted-effect accounting; review those
  boundaries at the final gate. The matrix runner, compound contracts/serializer and observation pipeline now have
  unverified splits; #821 naming and other baselined legacy debt remain. No tests, Playwright, simulations, builds,
  lint, or type checks ran in this sweep.
- Implementation boundary audit: author #815/#816 and later #819/#823 tests and recipes now, but retain no passing
  evidence until the final gate. #817 difficulty tuning and #828 hot-path optimization require measured, paired runs;
  their preparation is already authored, but no threshold or hot path should be guessed now. #820 legacy removal is
  gated on #816/#819/#823 parity evidence and must not be done speculatively. #829/#827 production behavior remains
  unproven until the final gate; repair only the first evidenced failure then. #821 has remaining code-only structural
  work, but its final baseline removal and compatibility audit also require that gate.
- #821 matrix runner split (unverified): the 847-line `run-skirmish-matrix.mjs` now delegates fixture validation,
  pure/runtime execution, and shared I/O to focused modules; the CLI remains the dispatch/replay/report owner under
  400 physical lines, and its source-structure exemption was removed. The final gate must compare scenario selection,
  malformed-fixture rejection, pure/runtime report shape, replay/compare provenance, and CLI exit behavior. The Phaser
  observation pipeline has since been split as described below. The brain-state contract now has one persisted slice per
  type-only file behind its old import surface; the validator delegates to focused observation, transport, squad and
  dependency-edge owners; the canonical-value type is separate from serialization. Their three old baseline entries
  were removed, but none of these edits has passed type/lint/save/replay proof. Do not silently renew other exemptions.
  Plan compatibility before changing persisted IDs. Notify the user before the
  final gate; do not remove legacy fallback, tune difficulty, or claim performance improvement without evidence.
- #821 observation split (unverified): `phaser/.../observation/ai-observation-pipeline.ts` is now a 368-line capture,
  generation-commit, save/restore and disposal coordinator. Memory/work, actor/combat/catalog, permitted topology/map,
  access-product and auxiliary-context projection live in bounded neighboring modules. Its source-structure baseline
  exemption was removed. At the final gate, review fair visibility before live reads, generation fencing, memory and
  query-cursor persistence, invalidation, deterministic sorting and catalog contents; run focused Phaser/type/save/replay
  evidence. Do not rename persisted manager/effect/claim/trace IDs without migration and old-fixture proof. The broader
  stage-labelled source/test naming audit remains #821 work, not a reason to renew hashes.
- Pinned pre-change baseline: `de47f482889db30420692bf4406fba463d7db296`.
- Manifest authority: `tools/ai/fixtures/skirmish-v1.json`, 121 scenario IDs before variants.
- Latest testing-policy decision (2026-09-27): focused Playwright presets normally target 200–2,000 ticks and one
  isolated run per positive/control branch; explicit determinism assertions need at least two identical starts.
  Full-match victory/recovery cases are separate and may run longer than two simulated minutes when a measured,
  finite deadline is necessary for a real terminal result. At 50 ms/tick, two simulated minutes are 2,400 ticks.
  Existing three-repeat/12,000-tick recipes are migration work, not an endorsed default. The authoritative policy
  and exceptions are in [runtime E2E](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/runtime-e2e.md).
- #816 layout decision (unimplemented): split focused behavior/positive-control recipes from legal-start continuous
  matches, notably the mixed `stage-15-land-loop-runtime.json`; declare legal actor/resource/queue/event preset state
  for each focused case or a documented natural-opening exception. Extend the generated catalog to expose kind,
  starting state, branch/repetition counts and tick rationale from fixture data. Existing catalog rows still show
  the old counts/limits and do not yet summarize preset state. Keep TS/JS/MJS additions within the repo's 400-line
  file, 200-line method and 140-column rules; do not build another giant Playwright or generator file.
- #816 tooling-first update: `pnpm ai:skirmish:catalog -- --inventory` is now an authored read-only, bounded recipe
  summary with 19/120 registered runtime rows, 97 supported missing, four island-deferred, and nine current recipe
  files. It flags the mixed production/SEQ file, long focused waits and redundant repetitions; its new unit test
  has **not** run. Finish typed catalog metadata before mass fixture work and optional stop-on-evidence before the
  execution sweep. The current runner always advances through every checkpoint, so the latter is unimplemented.
  JetBrains semantic search was reachable in this worktree; future agents should probe once and fall back to narrow
  `rg` if their host has no IDE connection. No new global search/index tool is needed.
- #816 batched-repair decision (unimplemented): before the final broad game sweep, extend the existing single-report
  skirmish summarizer with provenance-checked cross-shard failure clustering and a compact repair list. A shared
  predicate is only a hypothesis; separate infrastructure/setup from gameplay and confirm one causal owner before
  repairing a cluster. One representative preflight at the final gate precedes family/map shards; after a repair,
  rerun affected shards, then establish final required evidence after all source changes. No test execution is
  authorized during this authoring sweep.
- The generated [scenario test catalog](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/scenario-catalog.md)
  joins all 121 requirements to their registered fixtures, spec references, current maps and tick bounds; it does not
  claim test execution. Its [frozen-map contract](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/test-map-contract.md)
  is a #816 authoring target, not a shipped map. A manifest/docs-derived catalog check is authored for non-draft PR
  and `develop` CI. Neither that check nor any scenario test has run in this sweep.
- Completed prerequisites: #824 repository tooling and #825 current-content domain/transport foundation.
- Current issues: #815, #816, active #827, and prerequisite #829. The latest SEQ-01 diagnostic is
  `1789968100579-failed.json` (2 variants, 24,040 aggregate ticks, 248,878 ms). Skaduwee found the bridge ground
  route and launched, but still had no terminal result by tick 12,020. The test remains red; do not relax its terminal
  assertion merely to close #827.
- Prior-economy behavior boundary: SEQ-02 passed both factions before the 200-resource start. The current low-resource
  SEQ-01/02 run is red and must be rechecked at the final gate. Full manager replacement no longer permits a later narrow
  projection to resurrect an obsolete squad, valid tactical domain children survive while their strategic parent does,
  and replaced queued pawn orders publish terminal cancellation outcomes.
- Earlier checkpoint work: continue #829 implementation from the committed low-resource economy checkpoint, then #827 strategy
  implementation; defer their validation to the final gate. Standard skirmish starts are now 200 of every resource for both players, so older SEQ balance evidence is
  diagnostic rather than calibration proof. The smallest #821 prerequisite slice extracted a typed economy policy;
  final macro-owner and spec splitting remains in #821 because both legacy files are still oversized.
  Continue #816 runtime families after #829/#827 stabilize. Definition-derived prerequisite recovery is implemented:
  completed opening history no longer suppresses live replacement, failed effects do not remain accepted commitments,
  and duplicate food drop-offs scale only with demanded Field throughput. In the retained seed, Skaduwee rebuilt/scaled to two
  Granaries and six Fields, launched at tick 2,820 and peaked at 19 military actors, but combat attrition reduced it to
  zero military actors and three workers by tick 12,020. River Crossing needs no air transport: its bridge is
  traversable by land.
- The last pre-sweep checked #827 strategy/recovery checkpoint is commit `e1215af5` on the remote branch. It contains a typed strategy
  assessment, opportunity ranking, tactical liveness and remote approach cells, worker recovery, debug projection, and
  the 12,000-tick cap. Its latest focused evidence is 48 gameplay tests, three debug-panel tests, and
  `apps/portal-e2e/tsconfig.json` type checking passing. Phaser/gameplay-wide `tsc` still emits unrelated
  existing spec errors. The latest local tactical regression (30 focused tests passed) lets an attack squad engage a
  nearby armed defender while retaining its strategic objective. Same seed and initial-world digest as the previous
  run improved survival but did not achieve victory. Demand-priced 600-tick resource forecasts, forecast-deficit labor,
  prerequisite recovery and bounded duplicate food infrastructure now have 25 passing focused macro/forecast tests.
  The latest runtime constructed 11 buildings, reached two Granaries and six Fields, produced 21 units and dealt 292
  damage, but lost 23 units and six buildings without destroying an enemy actor. A post-run null-position guard in
  immediate-threat selection kept the 30 focused tactics tests green. `nx lint probable-waffle-gameplay` remains red on
  26 source-structure violations in oversized/compound files touched by that checkpoint; no baseline hashes were
  renewed. #821 owns the required behavior-neutral splits. Recheck tactical move reissue before #827 stage close.
- Unrelated local `.run/start_portal.run.xml`, if present, is not AI scope.

Previously recommended commands (deferred until the final validation gate):

```bash
pnpm agent:doctor
pnpm agent:context -- --issue 821
pnpm ai:skirmish:report -- --report tmp/ai-skirmish-matrix/1789968100579-failed.json --details
```

Raw `tmp/` artifacts are ignored and may be absent in a cold worktree. If absent, trust only the compact evidence above
until one clean replacement run is necessary; do not reconstruct or dump the old JSON.

## Remaining execution order

**Build first, execute later (2026-09-28):** this grid is an authoring queue, not permission to run checks.
Complete source changes, multiplayer/lifecycle wiring and harnesses, legal fixtures, report tooling, and in-scope
splits/renames before the final gate. Fix defects established by source inspection now; leave runtime-dependent
diagnosis, measured tuning and legacy retirement until evidence exists. Do not postpone known implementation gaps
merely because their issue title mentions testing. All authored work remains unverified until executed.

| Order         | Issue                                                           | State         | Next boundary                                                     | Model / effort            |
| ------------- | --------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- | ------------------------- |
| 1 / as needed | [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | `partial`     | Split only the owners that block the next implementation slice    | Terra, medium             |
| 2             | [#829](https://github.com/JernejHabjan/fuzzy-waddle/issues/829) | `in_progress` | Finish labor, throughput and threat-budget authoring; defer proof | Sol, high → Terra, high   |
| 3             | [#827](https://github.com/JernejHabjan/fuzzy-waddle/issues/827) | `in_progress` | Finish sustained pressure/recovery policy; defer victory proof    | Sol, high → Terra, high   |
| 4 / paired | [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | `in_progress` | Author each pure family alongside its #816 runtime slice | Sol, high → Terra, medium |
| 4 / paired | [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | `in_progress` | Metadata first, then paired family batches and incremental maps | Sol, high → Terra, medium |
| 6             | [#828](https://github.com/JernejHabjan/fuzzy-waddle/issues/828) | `not_started` | Prepare probes now; measure/optimize only at final gate           | Sol, high → Terra, high   |
| 7             | [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | `not_started` | Prepare paired fixtures; baseline/D-06/soaks at final gate        | Sol, high → Terra, medium |
| 8             | [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | `not_started` | Build real relay/two-client harness, authority wiring and cases before gate | Sol, high → Terra, high |
| 9             | [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | `not_started` | Build lifecycle setup/restore/cleanup adapters and cases; network cases use #819 | Sol, high → Terra, medium |
| 10            | [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | `not_started` | Retire legacy controller only after parity proof at final gate    | Sol, high → Terra, medium |
| Before gate   | [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | `partial` | Finish in-scope splits/renames, compatibility and consumer updates; defer checks | Terra, medium |
| Final gate    | Required issues above | `deferred` | Announce, preflight, grouped execution, compact triage, repairs and final evidence | Sol, high → bounded Terra repairs |

Dependencies remain authoritative over model grouping. Every planning, authority, architecture, strategy, or causal-diagnosis
boundary starts on Sol/high; Terra resumes only once that boundary has a compact contract and focused acceptance evidence.
Do not reorder dependent work merely to avoid a model switch or downgrade a deep-reasoning boundary for cost.

Optional [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822) owns a future island map and natural
transport-required runtime. It is detached from #759 and does not block core readiness.

## Cross-session testing plan

Follow the dependency grid above; the following #816/final-gate sequence survives a new machine or agent. Current
fixture schedules and historical 12,000-tick diagnostics remain facts about authored/previous runs, not new policy.

0. Before mass authoring, add execution-kind/variant-role/deadline metadata to the existing catalog/fixture tools.
   Finish optional stop-on-evidence and cross-shard repair reporting before the broad execution sweep; independent
   family authoring can proceed meanwhile. The inventory is authored; these extensions remain pending. Defer their
   tests under the current no-validation rule. Use the #816 batch table and preserve one short resume record per batch.
1. During the authoring sweep, use the inventory to identify each registered browser recipe's causal branches,
   repetitions, earliest authoritative success/failure milestone, tick ceiling, map dependency and execution tier.
   Do not infer passing evidence from registration or a compact inventory flag.
2. Freeze the smallest open-economy test map first, then the bridge map when route/combat/full-match cases need it,
   then the fortified map when wall cases need it. Each can support CI independently. Add legal preset worlds and
   replace broad production, economy, defense and raid waits with focused 200–2,000-tick cases where possible.
   Preserve full real command and
   effect paths; document measured exceptions and leave full legal-start matches in a separate execution tier.
   Organize focused fixtures by behavior family and pair positive/control variants in the same small recipe; split
   the mixed production/SEQ fixture and keep the Playwright driver generic. No island-map dependency.
3. Migrate fixture repetition counts and the Playwright `determinismGroup` evaluator in one bounded change: one run
   per positive/control branch in ordinary PR coverage, at least two identical starts for explicit determinism,
   extra seeds/repeats and soaks in scheduled/manual coverage. Preserve fail-closed coverage/provenance and CI shard
   selection. Keep the catalog derived from the manifest/fixtures rather than maintaining parallel scenario counts.
   Add generated per-row kind, starting actor/resource/queue/event summary, branch/repetition counts and budget
   rationale; missing focused setup must remain visible. Keep generator/evaluator source within the size rules.
4. Finish required pure/runtime mappings for supported IDs in the 121-scenario manifest, with the four island-content
   runtime rows explicit and deferred. Author focused outcomes before relying on the small continuous-match tier.
   Finish #819/#823 implementation and harness preparation, #821 cleanup and the #816 readiness checklist first.
   Automated parsers must reduce retained results to bounded failure packets before agent review; passing rows need
   counts, not narrated checkpoints. Agents inspect batches only when judgment is needed, with detail on demand.
   During this sweep, do not execute tests, E2E, simulations, lint, builds or validation under the user direction above.
5. Before the final gate, tell the user. Preflight representative map/fixture infrastructure, then run compatible
   family/map shards as one retained sweep and generate a compact repair list. Confirm causal clusters from one
   representative each, repair shared owners in batches and rerun affected shards.
   Measure the shortest credible full-match deadlines, run paired difficulty/performance evidence and extended soaks,
   and finish code/omission review. A longer full-match deadline needs documented evidence; preserve mandatory
   terminal victory/recovery rather than passing on mere survival or elapsed ticks. Establish the final required
   matrix evidence after all repairs, tuning, optimization and legacy removal, reusing a complete passing sweep
   only if its relevant source/workload inputs still match.

## Final validation gate — not during the implementation sweep

Keep a single deferred gate for all changed behavior and newly authored tests. Do not interpret a passing result from
an older commit as evidence for newer unverified code. At the gate, run repository doctor/context and smallest focused
static/unit checks first, then representative map/fixture preflight and manifest-derived pure/Playwright family shards.
Generate the retained cross-shard repair list, fix confirmed shared causes in batches and rerun affected shards.
Establish continuous-match/multiplayer/lifecycle parity, then perform calibration, measured optimization and gated
legacy retirement. Finish required matrix evidence on the resulting revision, broader affected checks and code review.
A complete passing sweep with unchanged relevant inputs can be retained; repeat affected calibration/benchmark evidence
if later edits invalidate it. Treat the present 12,000-tick SEQ ceiling as a starting measurement, not a universal cap:
increase it only if a real full match needs more time and the cause, wall cost and finite terminal deadline are
recorded. Do not use a long natural match to paper over missing targeted fixtures. Retain compact reports, exact
seeds, digest/provenance, wall time, and known failures in this handoff until each result has a durable owner. Close each
subissue only after its authored requirements and final-gate evidence both pass; do not claim runtime, difficulty,
multiplayer, lifecycle, or performance acceptance from unrun tests. #822 island-map content remains optional and must
not block this gate.

## Active evidence and boundaries

- #829 now commits a bounded workforce/runway/budget snapshot into the AI state and projects it into the high-level
  economy debug line. Canonical state digests also include the existing posture and new workforce rationale. Contract,
  digest, and debug unit cases are authored but unrun. Four existing oversized/compound source owners needed reviewed
  source-structure hash updates; #821 owns their later split/removal, not a routine baseline refresh. At the final gate,
  check that committed snapshots follow decision boundaries and survive save/reload without changing planner authority.
  A paired, three-repeat, 200-resource STRAT-01 Playwright recipe now contrasts a dispatched Banshee raid with the
  otherwise identical safe world. Its independent oracle requires visible contact, a defense-favoring committed budget,
  an actual defense squad plus later applied command, and worker/income growth in the safe control. This is unrun;
  final-gate repair must establish real reaction and control growth rather than weaken the oracle.
  STRAT-01 also has a typed pure paired world: visible local raid versus safe, last-seen, and remote-contact controls,
  with three repeated decision digests, budget/workforce assertions, and bounded recovery. Its manifest and pure Jest
  selector are wired, but neither the pure case nor the browser pair has been executed.
  The safe/pressure classifier now measures visible enemy proximity to owned economic/base assets, excluding
  outbound military actors from the home-defense budget signal. A typed control is authored but unrun; final-gate
  pressure checks must still prove that workers, Fields, producers, and the core do trigger defense when threatened.
  The newest unverified threat-policy repair counts only nearby defenders compatible with the local enemy's movement
  domain; remote fighters and ground-only units cannot falsely cover an air raid. Pure cases cover both controls.

- #827 now prefers a confirmed reachable target over a higher-value unknown-route target. STRAT-07 has an authored
  three-repeat pure route-pair fixture and typed manager cases for direct worker attack, pending-core scouting fallback,
  and deterministic assessment. These are unrun and are not runtime/SEQ-01 victory proof; final-gate execution must
  check that non-actionable pending targets do not keep a stale attack mission alive.
  A near-term, ready finishing assessment now defers optional worker growth, while a safe world with no such
  assessment keeps growing; an unrun pure pair covers this policy. Final-gate runtime evidence must ensure this
  does not starve a failed finish or suppress necessary replacement after the mission ends.
  The STRAT-07 pure case also pairs an expired one-unit assembly against an undefended worker and a guarded worker;
  the former may force a bounded launch, the latter must keep forming instead of launching a token attack. This
  source/test change is unrun and needs the final-gate gameplay verification.
  STRAT-08 now shares this pure fixture with a separate known-route, four-guard, exposed-core finishing case. Its
  asserted intent and strategic choice are unrun; actual core destruction, victory/score authority, and optional
  spending suppression still require targeted runtime plus bounded SEQ evidence.
  STRAT-05/06 now have typed three-repeat pure pairs for visible counterforce versus an exposed core and for equal-tick
  healthy-force pressure versus workforce recovery. Their manifest/runner registration is authored but unrun; they do
  not establish sustained pressure, actual victory, or temporal redirection until final-gate runtime evidence.

- ECO-08 now has an authored three-repeat focused workforce variant from an exact 200-resource start: six real
  workers, two Fields, a Granary, and an independent oracle requiring growth/retention above six plus delivered
  income by tick 3,000. The old natural opening variants remain. This is unrun and must not be counted as proof
  until the final gate; repair real world/production issues rather than lowering the >6 acceptance bound. A #821
  structural slice moved browser setup and pre-tick verification out of the Playwright variant runner; both parts
  still require the final-gate type/lint/runtime checks.
  A separate typed ECO-08 pure fixture now covers both factions' zero-worker production, catalog-priced food claim,
  queued-worker accounting, two-worker checkpoint retirement, and repeated canonical digest. It is registered but unrun.

- ECO-04 labor ranking now discounts only measured delivered income within the bounded 600-tick horizon. A pure
  known-versus-unknown income case and matrix selector are authored but unrun. This estimate affects worker routing,
  not authoritative spending; verify low-resource throughput and that rising demand still adds useful labor at the
  final gate.
  A short ECO-04 preset-world runtime recipe is now authored with three idle workers, a neutral tree and an exact
  zero-wood start. Its independent oracle requires the applied zero balance, no preset worker orders, an observed ready
  wood source and a real worker Gather order by tick 900; three repeats are configured. Neither the recipe nor oracle
  has run. Confirm legal preset geometry and actual labor behavior at the final gate rather than weakening the oracle.

- TECH-05 now has unverified queued-counter accounting: compatible production queue items satisfy evidence-backed
  role demand before new counters are proposed. A focused pure case compares two queued counters with one queued
  counter under the same confirmed flyer evidence. Verify demand counting and no-cancel behavior at the final gate;
  TECH-05 as a whole still needs changing-composition and stale-evidence runtime coverage. The split adaptation
  manager is now removed from the source-structure baseline, and the pure runner selects the new focused spec;
  structural lint and executed scenario evidence still await the final gate.

- ECO-05 now has an unverified conservative surplus-to-deficit labor transfer and pure regressions for deterministic
  choice, food preservation, return/cargo ownership, and insufficient donor stock. The still-oversized macro owner
  needed a narrowly reviewed hash-baseline update, not a claim of structural compliance. #821 must split that owner
  and remove its baseline entry; do not refresh the hash again as a routine lint workaround. Verify behavior and
  source structure together at the final gate.

- ECO-03 now has a focused browser fixture: two pre-tick workers saturate a definition-backed tree, a third is
  free, and the oracle requires an observed alternate wood-source order without overassignment. Its preset-actor
  ID bridge, oracle tests, and three-repeat recipe are unexecuted; verify them at the final gate before counting
  ECO-03 as real runtime coverage. The matrix runner needed a reviewed temporary source-structure hash update;
  #821 owns its split and removal from the baseline.
  The fixture now also sets exact pre-tick wood to zero through normal resource events, independently checked by
  the runner; other balances remain ample. This scoped preset capability and its validation case are unrun.

- Unverified implementation-sweep batch: food runway now sums concurrent worker, standing-workforce and military
  demand; Field count reserves non-food labor; staffed Fields rank above speculative new Fields; worker replacement
  ignores terminally rejected/cancelled/failed leases. Focused pure tests were authored/updated but deliberately not
  executed. A later unverified batch counts queued population and disjoint ready/constructing/accepted housing capacity,
  records housing demand as a building count rather than population points, and makes non-credible offense pause below
  the six-worker recovery floor while preserving a ready finishing opportunity. The revised Field/housing targets change
  prior fixture expectations and need final-gate runtime evidence for both factions, especially renewable-food throughput,
  supply prebuilds, and attack continuation after losses.
- Latest unverified authoring: #829 now tags priced survival/economy/defense intents and uses the macro posture in
  shared resource arbitration. The arbiter protects an eligible competing purchase's share, permits survival to use
  the common stockpile, and reports `posture_budget` in the high-level debug blocker. Pure arbiter/helper cases are
  authored but unrun. Audit candidate filtering, quota behavior under sustained 200-resource play, and duplicate
  Field/housing effects at the final gate. #827 now remembers a completed failed offensive mission after squad
  removal, briefly rebuilds, increases same-target force need, and permits a stronger follow-up; its focused test is
  authored but unrun. Do not claim SEQ victory from these static changes.
- #829 now persists safe/pressured/emergency posture and delays de-escalation by at most 160 simulation ticks after
  the last visible local threat; escalation remains immediate. Its pure test is authored but unrun. The runtime budget
  and posture transition still need paired low-resource/threat evidence at the final gate.
- #827 failed-mission attribution now reads the completed squad's saved objective before a newer strategy assessment;
  the changed-target regression is authored but unrun. Follow-up victory and casualty recovery remain unproven.
- #828 now has optional per-variant setup/advance/settle/capture/perturbation and browser-long-task probes behind
  `AI_SKIRMISH_PROFILE=1`; the compact reporter summarizes normalized play time. This instrumentation is unrun.
  Measure paired identical workloads only at the final gate, then retain or reject a concrete hot-path optimization
  based on identical authoritative digests and measured gain. Its plan's stale 30,000-tick wording was corrected.
- #817 calibration metadata now uses 20 planned paired seeds plus a disjoint holdout, Easy/Normal and Normal/Hard
  comparisons, and only the two shipped maps. The former `transport-required` pseudo-map was removed; optional #822
  remains a later extension. This is unrun metadata, not a D-06 runtime adapter or difficulty proof. The present
  one-AI/human-slot browser runner cannot establish AI-versus-AI outcome ordering, so #817 still needs its own fair
  opponent harness and isolated baseline execution at the final gate.
- A behavior-preserving #821 structural slice moved the shared admission pass into `brain/ai-intent-arbiter.ts`, leaving
  `ai-brain.ts` as the decision coordinator. This split is unverified and needs its focused Jest and structural lint at
  the final gate; the much larger macro/runner owners remain #821 debt.
- #816 CI scaffolding now derives fail-closed required runtime shards directly from manifest group/fixture pairs and
  registers a non-draft PR job with retained reports/traces. Selector unit cases are authored but unrun. It will fail
  until all supported core rows have real runnable recipes; do not mark #816 complete or switch the draft PR to ready.
  `DOMAIN-03`, `DOMAIN-04`, `H-29`, and `SEQ-05` runtime rows are explicitly `deferred_content` to optional #822 because no
  island map ships; the first three pure rows remain required, while `SEQ-05` is runtime-only. This removes the island
  content dependency, not the core gap.
- #815 preparation: ECO-04 and ECO-07 now have authored typed pure subject/control fixtures for dated-resource labor and
  queued-population supply, including once-only housing commitments and three-run proposal digests. Their manifest
  registration and runner selection are wired but not executed; required real-runtime counterparts remain unimplemented
  under #816. Do not add them to the passing count until the final gate executes the fixtures and coverage report.
  ECO-05 now has an authored pure subject/control fixture that combines queued force, upgrade, expansion and supply
  wood demand, scarce-versus-surplus labor assignment, spendable-stockpile bounds and three-run digests. It is
  registered for pure execution but remains unrun; its real-runtime counterpart is still missing under #816.
- #815/#816 runner hardening is authored but unrun: pure selection now captures uncached per-project Jest JSON and fails
  closed unless every selected ID appears in a passing executed assertion title. This replaces the former broad-file
  proxy. The stale stage-named tactics/adaptation spec selector was also corrected to the actual responsibility-named
  specs. At the final gate, repair missing/compound scenario titles or missing semantic tests; do not suppress the
  reported IDs or count fixture registration as execution. Runtime fixture validation now checks the ECO-01/02 paired
  branch and its source/service geometry contract.
- #815 technology authoring is unrun: TECH-01/02 now explicitly pair an expensive early one-unit upgrade against a
  larger existing or queued beneficiary set, then suppress that same upgrade during visible pressure. Research scoring
  counts distinct queued production items, no longer treats an idle producer as a beneficiary, and requires a useful
  minimum score even for a tech archetype. A behavior-preserving #821 slice extracted adaptation evidence, role and
  research scoring so the touched manager and spec are below 400 physical lines; the split is unverified and still
  needs focused type/lint/test proof at the final gate. Do not count TECH-01/02 as passing until then.
- #816 preparation: the runtime checkpoint now captures actual ready housing, used/queued population and housing actor
  names. ECO-07 now has an authored, registered, short preset-world Playwright recipe with five real queued units,
  four workers, a shortfall branch and an ample-capacity control. Its positive oracle requires a real queue-driven
  shortfall and completed Olival gain; the control forbids unnecessary housing. Both repeat three times. This is
  **unrun**, so do not count it as passing runtime coverage until the final gate proves the actual starting capacity,
  legal queue, construction and deterministic outcomes. No fixed illustrative 47/50 value is assumed.
- Next implementation gaps before the final gate: catalog-priced resource claims and cross-manager posture spending
  arbitration are authored but unverified. Confirm that emergency defense, food recovery and offensive finish do not
  overpromise the same stockpile. #827's failed-mission follow-up is also authored but lacks real victory/recovery proof.
  #815/#816 still need the remaining scenario families and a fail-closed
  scenario-to-test/CI mapping; a shared Jest path pattern and authored fixture metadata alone are not execution proof.
  #828 profiling, #817 calibration/soaks, #819 socket multiplayer, #823 lifecycle, and #820 parity-gated retirement
  depend on those foundations or require the deferred validation gate, so none should be reported complete now.
- The resource-claim change is unverified: the new helper and pure-arbiter regression are authored, and existing
  Field/housing tests now assert catalog-priced claims. At the final gate, inspect claim reservation/reconciliation and
  paired low-resource ECO-04/07 outcomes before treating the spending fix as proven.

- The #829 checkpoint gives every standard player 200 of each resource. A two-worker minimum opening avoids serial
  starvation; six is the live recovery floor, not the cap. The typed economy policy prices dated demand, food runway,
  observed source capacity plus a bounded expansion buffer, credible local pressure and 65/35, 35/65 or emergency
  20/80 economy/defense budgets. Scarce food belongs to workforce recovery before optional reinforcements while a
  defender survives. Focused
  gameplay evidence is 27 passing tests, the protocol default-state test passes, and the portal development build
  passes. ECO-08 passed both factions in real Playwright runtime, including zero-worker bootstrap, in
  `1790009966016-passed.json`.
- The latest 200-resource SEQ-01/02 evidence is `1790011554849-failed.json`: one browser process, 48,084 aggregate
  ticks and 266,561 ms. The capacity-led demand requests eight or more workers, but renewable-food labor still delivered
  too slowly for sustained armies and the authored Skaduwee attack could destroy the economy. Inspection showed generic
  gather assignment and Field-specific labor authority overlapping while a farmer returned food, allowing two workers
  to resume on one single-capacity Field. The final focused repair makes the Field planner the sole assignment owner,
  waits for returning farmers to resume, counts occupied generic-source slots, and suppresses unaffordable infrastructure
  proposals. Its 27 focused tests pass, but it still needs one grouped runtime rerun. Do not increase the 12,000-tick
  ceiling.
- PRO-01–07 passed both factions in one runtime group: 1,442 decisions and 24,040 ticks. The focused PRO-05
  replacement fixture now passes three repeated runs, including one real authored queue item and an observed producer
  loss/return; its Skaduwee River Crossing experiment is retained only as a diagnostic because the starting world has
  three producers and late worker attrition.
- PRO-01–05 have deterministic typed pure coverage with three-run proposal/state digest equality. Last recorded pure
  mapping is 46/111; runtime mapping is 13/120. Recalculate from the manifest before reporting future totals.
- ECO-03 now has an unrun three-repeat pure source-saturation subject/control: an idle worker chooses the spare wood
  source rather than an already fully occupied one, and does not overfill the sole saturated source. It is registered
  in the manifest but does not increase the last validated coverage count; its runtime counterpart is still absent.
- ECO-01/02 now have unrun pure subject/control cases for compatible, priced local WorkMill construction, a justified
  same-type second deposit, and already-served suppression. The runtime catalog now exposes definition-backed accepted
  resource types; a separate resource-service proposer is registered and construction cells can include bounded owned
  vision around visible sources. An unrun focused Phaser recipe now pairs an underserved forest with an already-served
  control, checking an applied command and completed nearby WorkMill; the evaluator's focused cases are also unrun.
  Final-gate review must verify source visibility, footprint/path legality, accepted-site deduplication, actual travel
  gain, both factions' legal roster, and real runtime income. Do not increase the last validated coverage count yet.
- ECO-06 now maps to the resource-service pure fixture. An unrun three-repeat recovery case removes a destroyed
  drop-off, requires a compatible replacement, leaves a loaded returning worker's order intact, then suppresses
  rebuilding after service is restored or the source depletes. Carried wood remains unspendable. The manager now
  prefers idle builders and excludes returning/cargo-bearing workers. This is only partial ECO-06 coverage: alternate
  return-route behavior, crop-growth legality, bounded in-world recovery, and real Playwright runtime still need
  targeted authoring and final-gate execution. The pawn's existing ReturnResources branch can acquire another live
  drain, but that behavior has not been validated in this sweep.
- #816 preset-world schema/application now permits only definition-backed neutral resource-source actors with an
  explicit null owner. Queue producers remain player-owned. Validator cases are authored but unrun; this enables
  targeted resource-service worlds without counting any new runtime scenario as covered.
- SCOUT-05 compares two distinct hidden Banshee positions: neither is disclosed in the first committed observation and
  the first decision facts match. DOMAIN-06 and RAID-02 prove real air defense and mission redirection. The grouped
  focused run retained identical causal outcome digests in every repeated group. Runtime reports record wall time and
  browser-process starts. The #826 natural producer-loss control reached 12,020 ticks in 66,662 ms but did not replace
  its lost producer; the focused proof reached the same tick in 79,550 ms. This validates no speedup claim and leaves
  natural recovery behavior to #816/#827.
- `2b131ff3` restricts home defense ownership to actors that can target the threat domain; its focused Jest suite passed.
  The latest grouped run proves SEQ-02 for both factions and removes its former raid-recovery, mission-continuation and
  outcome-backlog failures. SEQ-01 still lacks terminal results for both factions and Skaduwee loses its worker economy.
- No shipped map reliably requires transport and no shipped flying container proves air shipping. #822 owns that optional
  future content; current generic route/transport contracts remain covered.
- Current Playwright uses real lobby/Phaser/shared command application, but not socket multiplayer; #819 owns that proof.
- SEQ-01/02 run at 100× simulation scale and are capped at 12,000 requested ticks; the browser checkpoint is at
  tick 12,020. River Crossing has a valid bridge/ground route. #827 owns fastest-credible-victory strategy, including
  recovery when the first Skaduwee attack trades poorly. The SEQ-01 Skaduwee fixture is Normal difficulty against a
  human-controlled lobby slot, not a higher-difficulty-versus-lower-difficulty AI matchup. #817 must use paired
  difficulty evidence before claiming that a smarter AI reliably wins. #828 owns profile-guided runtime speed and
  responsiveness; its [cold-start plan](follow-ups/runtime-performance.md) requires paired deterministic before/after
  evidence.
- The pure brain is used for configured skirmishes; unresolved player/faction identity still falls back to the legacy
  behavior tree. #820 owns evidence-backed removal.
- The manifest-derived pre-merge runtime CI wiring exists but is intentionally fail-closed while supported rows lack
  executable recipes. Isolated pinned-baseline execution, D-06 calibration, and soaks do not yet exist. Authored rows
  or one-time local passes are not release evidence.

## Execution and retirement rules

- A generic `continue implementing` resumes the first in-progress boundary above. Read only its linked plan, generated
  context packet, named fixture rows, first failing owner, and adjacent specs.
- For this implementation-only sweep, batch coherent code and test authoring without running checks. At the final
  validation gate, use focused checks to guide repairs and one grouped Playwright process per coherent batch. Follow
  the skirmish skill's bounded reporting and long-process rules then.
- A sequential agent may commit directly to this integration branch. Parallel work requires isolated worktrees and
  sub-PRs targeting `feature/759-skirmish-ai`.
- At each issue close, move proven contracts to code/tests or code-adjacent docs, update backlinks, remove resolved
  narration and its follow-up plan, then commit/push and report the next model/effort.
- Delete this handoff and the follow-up directory when all retained knowledge has an owner and #759 closes.
