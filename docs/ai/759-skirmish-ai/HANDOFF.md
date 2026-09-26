# #759 skirmish AI handoff

Temporary cold-start ledger for unfinished work from #759. Product behavior and test policy live in the
[AI documentation](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/README.md); detailed
implementation routes live in the [subissue plans](follow-ups/README.md). Git/PR history owns completed narration.

## Quick resume

- Current execution mode (user direction, 2026-09-26): prepare the remaining implementation and test cases in dependency
  order, but do **not** run unit tests, Playwright, simulations, lint, type checks, builds, repository validation,
  `agent:doctor`, or `agent:context` during this implementation sweep. Treat every new change as **unverified**. Batch
  the full validation, repair, review, and calibration at the final gate below. This supersedes older per-issue
  verification instructions in this handoff and linked follow-up plans for the current sweep.

- Branch: `feature/759-skirmish-ai`; draft PR [#814](https://github.com/JernejHabjan/fuzzy-waddle/pull/814) targets
  `develop`. Verify local and remote tips before editing.
- Pinned pre-change baseline: `de47f482889db30420692bf4406fba463d7db296`.
- Manifest authority: `tools/ai/fixtures/skirmish-v1.json`, 121 scenario IDs before variants.
- Completed prerequisites: #824 repository tooling and #825 current-content domain/transport foundation.
- Current issues: #815, #816, active #827, and prerequisite #829. The latest SEQ-01 diagnostic is
  `1789968100579-failed.json` (2 variants, 24,040 aggregate ticks, 248,878 ms). Skaduwee found the bridge ground
  route and launched, but still had no terminal result by tick 12,020. The test remains red; do not relax its terminal
  assertion merely to close #827.
- Prior-economy behavior boundary: SEQ-02 passed both factions before the 200-resource start. The current low-resource
  SEQ-01/02 run is red and must be rechecked at the final gate. Full manager replacement no longer permits a later narrow
  projection to resurrect an obsolete squad, valid tactical domain children survive while their strategic parent does,
  and replaced queued pawn orders publish terminal cancellation outcomes.
- Exact next work: continue #829 implementation from the committed low-resource economy checkpoint, then #827 strategy
  implementation; defer their validation to the final gate. Standard skirmish starts are now 200 of every resource for both players, so older SEQ balance evidence is
  diagnostic rather than calibration proof. The smallest #821 prerequisite slice extracted a typed economy policy;
  final macro-owner and spec splitting remains in #821 because both legacy files are still oversized.
  Continue #816 runtime families after #829/#827 stabilize. Definition-derived prerequisite recovery is implemented:
  completed opening history no longer suppresses live replacement, failed effects do not remain accepted commitments,
  and duplicate food drop-offs scale only with demanded Field throughput. In the retained seed, Skaduwee rebuilt/scaled to two
  Granaries and six Fields, launched at tick 2,820 and peaked at 19 military actors, but combat attrition reduced it to
  zero military actors and three workers by tick 12,020. River Crossing needs no air transport: its bridge is
  traversable by land.
- The current #827 strategy/recovery checkpoint is commit `e1215af5` on the remote branch. It contains a typed strategy
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

| Order             | Issue                                                           | State         | Next boundary                                                      | Model / effort            |
| ----------------- | --------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ | ------------------------- |
| 1 / as needed     | [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | `partial`     | Split only the owners that block the next implementation slice      | Terra, medium             |
| 2                 | [#829](https://github.com/JernejHabjan/fuzzy-waddle/issues/829) | `in_progress` | Finish labor, throughput and threat-budget authoring; defer proof  | Sol, high → Terra, high   |
| 3                 | [#827](https://github.com/JernejHabjan/fuzzy-waddle/issues/827) | `in_progress` | Finish sustained pressure/recovery policy; defer victory proof     | Sol, high → Terra, high   |
| 4                 | [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | `in_progress` | Author remaining typed pure families; execute only at final gate    | Sol, high → Terra, medium |
| 5                 | [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | `in_progress` | Author targeted runtime recipes and CI contracts; do not run yet   | Sol, high → Terra, medium |
| 6                 | [#828](https://github.com/JernejHabjan/fuzzy-waddle/issues/828) | `not_started` | Prepare probes now; measure/optimize only at final gate             | Sol, high → Terra, high   |
| 7                 | [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | `not_started` | Prepare paired fixtures; baseline/D-06/soaks at final gate         | Sol, high → Terra, medium |
| 8                 | [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | `not_started` | Author relay/lockstep cases after #816 runtime contract exists      | Sol, high → Terra, high   |
| 9                 | [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | `not_started` | Author save/replay/reconnect/repeated-match cases after #819        | Sol, high → Terra, medium |
| 10                | [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | `not_started` | Retire legacy controller only after parity proof at final gate     | Sol, high → Terra, medium |
| 11 / final        | [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | `not_started` | Finish naming/source cleanup, then run final validation gate        | Terra, medium             |

Dependencies remain authoritative over model grouping. Every planning, authority, architecture, strategy, or causal-diagnosis
boundary starts on Sol/high; Terra resumes only once that boundary has a compact contract and focused acceptance evidence.
Do not reorder dependent work merely to avoid a model switch or downgrade a deep-reasoning boundary for cost.

Optional [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822) owns a future island map and natural
transport-required runtime. It is detached from #759 and does not block core readiness.

## Final validation gate — not during the implementation sweep

Keep a single deferred gate for all changed behavior and newly authored tests. Do not interpret a passing result from
an older commit as evidence for newer unverified code. At the gate, run repository doctor/context and smallest focused
static/unit checks first, repair in batches, then manifest-derived pure and targeted preset-world Playwright groups,
followed by bounded SEQ-01/02, real multiplayer/lifecycle scenarios, pinned-baseline and D-06 calibration, long-match
performance comparisons, broader affected checks, and a final code/omission review. Keep the 12,000-tick SEQ ceiling;
do not use a 30,000-tick natural-match run to paper over missing targeted fixtures. Retain compact reports, exact seeds,
digest/provenance, wall time, and known failures in this handoff until each result has a durable owner. Close each
subissue only after its authored requirements and final-gate evidence both pass; do not claim runtime, difficulty,
multiplayer, lifecycle, or performance acceptance from unrun tests. #822 island-map content remains optional and must
not block this gate.

## Active evidence and boundaries

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
- A behavior-preserving #821 structural slice moved the shared admission pass into `brain/ai-intent-arbiter.ts`, leaving
  `ai-brain.ts` as the decision coordinator. This split is unverified and needs its focused Jest and structural lint at
  the final gate; the much larger macro/runner owners remain #821 debt.
- #816 CI scaffolding now derives fail-closed required runtime shards directly from manifest group/fixture pairs and
  registers a non-draft PR job with retained reports/traces. Selector unit cases are authored but unrun. It will fail
  until all supported core rows have real runnable recipes; do not mark #816 complete or switch the draft PR to ready.
  `DOMAIN-03`, `DOMAIN-04`, and `H-29` runtime rows are explicitly `deferred_content` to optional #822 because no
  island map ships; their pure rows remain required. This removes the island content dependency, not the core gap.
- #815 preparation: ECO-04 and ECO-07 now have authored typed pure subject/control fixtures for dated-resource labor and
  queued-population supply, including once-only housing commitments and three-run proposal digests. Their manifest
  registration and runner selection are wired but not executed; required real-runtime counterparts remain unimplemented
  under #816. Do not add them to the passing count until the final gate executes the fixtures and coverage report.
  ECO-05 now has an authored pure subject/control fixture that combines queued force, upgrade, expansion and supply
  wood demand, scarce-versus-surplus labor assignment, spendable-stockpile bounds and three-run digests. It is
  registered for pure execution but remains unrun; its real-runtime counterpart is still missing under #816.
- #816 preparation: the runtime checkpoint now captures actual ready housing, used/queued population and housing actor
  names. ECO-07 now has an authored, registered, short preset-world Playwright recipe with five real queued units,
  four workers, a shortfall branch and an ample-capacity control. Its positive oracle requires a real queue-driven
  shortfall and completed Olival gain; the control forbids unnecessary housing. Both repeat three times. This is
  **unrun**, so do not count it as passing runtime coverage until the final gate proves the actual starting capacity,
  legal queue, construction and deterministic outcomes. No fixed illustrative 47/50 value is assumed.
- Next implementation gaps before the final gate: catalog-priced resource claims and cross-manager posture spending
  arbitration are authored but unverified. Confirm that emergency defense, food recovery and offensive finish do not
  overpromise the same stockpile. #827's failed-mission follow-up is also authored but lacks real victory/recovery proof.
  #815/#816 need remaining scenario families and a fail-closed
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
  vision around visible sources. Final-gate review must verify source visibility, footprint/path legality, accepted-site
  deduplication, actual travel gain, both factions' legal roster, and real runtime income; the runtime recipes remain
  unimplemented, so these cases do not increase the last validated counts.
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
- Required manifest-derived pre-merge runtime CI, isolated pinned-baseline execution, D-06 calibration, and soaks do not
  yet exist. Authored rows or one-time local passes are not release evidence.

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
