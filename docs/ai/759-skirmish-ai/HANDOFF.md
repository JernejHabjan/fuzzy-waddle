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
| 1 / as needed     | [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | `partial`     | Finish macro/spec splits and broader source cleanup later          | Terra, medium             |
| 2                 | [#829](https://github.com/JernejHabjan/fuzzy-waddle/issues/829) | `in_progress` | Revalidate capacity-led growth above six and raid recovery          | Sol, high → Terra, high   |
| 3                 | [#827](https://github.com/JernejHabjan/fuzzy-waddle/issues/827) | `in_progress` | Revalidate sustained pressure and recovery on the new economy      | Sol, high → Terra, high   |
| 4                 | [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | `in_progress` | Recalculate coverage; complete pure families paired with #816      | Sol, high → Terra, medium |
| 5                 | [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | `in_progress` | Recalculate runtime rows and add required CI shards                | Sol, high → Terra, medium |
| 6                 | [#828](https://github.com/JernejHabjan/fuzzy-waddle/issues/828) | `not_started` | Optimize measured long-match hot paths after behavior stabilizes   | Sol, high → Terra, high   |
| 7                 | [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | `not_started` | Isolated baseline, D-06, paired difficulty and soaks               | Sol, high → Terra, medium |
| 8                 | [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | `not_started` | Real multiplayer relay/lockstep AI evidence                        | Sol, high → Terra, high   |
| 9                 | [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | `not_started` | Save/replay/reconnect/repeated-match evidence                      | Sol, high → Terra, medium |
| 10                | [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | `not_started` | Retire legacy controller after parity dependencies                 | Sol, high → Terra, medium |
| 11 / final        | [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | `not_started` | Finish naming and source-structure cleanup                         | Terra, medium             |

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
  executed. The revised Field target changes prior fixture expectations and needs final-gate runtime evidence for both
  factions, especially renewable-food throughput after losses.

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
