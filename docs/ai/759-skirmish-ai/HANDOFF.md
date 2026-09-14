# #759 skirmish AI handoff

Temporary cold-start ledger for unfinished work from #759. Product behavior and test policy live in the
[AI documentation](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/README.md); detailed
implementation routes live in the [subissue plans](follow-ups/README.md). Git/PR history owns completed narration.

## Quick resume

- Branch: `feature/759-skirmish-ai`; draft PR [#814](https://github.com/JernejHabjan/fuzzy-waddle/pull/814) targets
  `develop`. Verify local and remote tips before editing.
- Pinned pre-change baseline: `de47f482889db30420692bf4406fba463d7db296`.
- Manifest authority: `tools/ai/fixtures/skirmish-v1.json`, 121 scenario IDs before variants.
- Completed prerequisites: #824 repository tooling and #825 current-content domain/transport foundation.
- Current issues: #815 and #816. Latest complete runtime evidence is report `1789412950848-failed.json` at
  `c2a017db`: 6,948 decisions and 120,095 ticks across SEQ-01/02.
- Current behavior boundary: domain-compatible defense fixed Skaduwee SEQ-01 base/worker collapse. SEQ-02 still loses
  the Skaduwee main between ticks 16,020 and 20,020; Tivara survives but does not resume useful offensive pressure and
  reports outcome-backlog overflow.
- Exact next work: trace SEQ-02 raid-force composition and persistent retreat/outcome ownership, add focused regressions,
  then run the grouped SEQ browser evidence once. Do not weaken recovery, terminal, or mission-continuation assertions.
- Unrelated local `.run/start_portal.run.xml`, if present, is not AI scope.

Start with:

```bash
pnpm agent:doctor
pnpm agent:context -- --issue 816
pnpm ai:skirmish:report -- --report tmp/ai-skirmish-matrix/1789412950848-failed.json --scenario SEQ-02 --failures-only --details
```

Raw `tmp/` artifacts are ignored and may be absent in a cold worktree. If absent, trust only the compact evidence above
until one clean replacement run is necessary; do not reconstruct or dump the old JSON.

## Remaining execution order

| Order             | Issue                                                           | State         | Next boundary                                                    | Model / effort              |
| ----------------- | --------------------------------------------------------------- | ------------- | ---------------------------------------------------------------- | --------------------------- |
| 1                 | [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | `in_progress` | Finish current SEQ-02 causal repair                              | Terra, medium               |
| 2                 | [#826](https://github.com/JernejHabjan/fuzzy-waddle/issues/826) | `not_started` | Authoritative preset-world E2E bridge and representative proof   | Sol, high → Terra, medium   |
| 3                 | [#818](https://github.com/JernejHabjan/fuzzy-waddle/issues/818) | `not_started` | Strategy/debug usability before strategy expansion               | Terra, medium               |
| 4                 | [#827](https://github.com/JernejHabjan/fuzzy-waddle/issues/827) | `not_started` | Fastest-credible-victory policy and sustained pressure           | Sol, high → Terra, high     |
| 5                 | [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | `in_progress` | Recalculate from 45/111; complete pure families paired with #816 | Terra, medium               |
| 5                 | [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | `in_progress` | Recalculate from 10/120; runtime families and required CI shards | Terra, medium               |
| 6                 | [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | `not_started` | Isolated baseline, D-06, paired difficulty and soaks after #827  | Sol, high → Terra, medium   |
| 7                 | [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | `not_started` | Real multiplayer relay/lockstep AI evidence                      | Sol, high → Terra, high     |
| 8                 | [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | `not_started` | Save/replay/reconnect/repeated-match evidence                    | Sol, high → Terra, medium   |
| 9                 | [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | `not_started` | Retire legacy controller after parity dependencies               | Terra, high → Terra, medium |
| As needed / final | [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | `not_started` | Bounded blockers, then final naming/structure cleanup            | Terra, medium               |

Dependencies remain authoritative over model grouping. Where evidence permits, keep the same Terra delivery context for
#826 then #818, and for #827 then the paired #815/#816 families. Use Sol only for the named authority/design boundaries;
do not reorder dependent work merely to avoid a model switch.

Optional [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822) owns a future island map and natural
transport-required runtime. It is detached from #759 and does not block core readiness.

## Active evidence and boundaries

- ECO-08 passed both factions in real Playwright runtime, including zero-worker bootstrap.
- PRO-01–07 passed both factions in one runtime group: 1,442 decisions and 24,040 ticks.
- PRO-01–05 have deterministic typed pure coverage with three-run proposal/state digest equality. Last recorded pure
  mapping was 45/111; runtime mapping was 10/120. Recalculate from the manifest before reporting new totals.
- `2b131ff3` restricts home defense ownership to actors that can target the threat domain; its focused Jest suite passed.
  `c2a017db` gives the four-variant land sequence a 20-minute harness budget. The subsequent real run removed the former
  Skaduwee SEQ-01 worker-bootstrap failure but left the SEQ-02 and terminal/continuation failures above.
- No shipped map reliably requires transport and no shipped flying container proves air shipping. #822 owns that optional
  future content; current generic route/transport contracts remain covered.
- Current Playwright uses real lobby/Phaser/shared command application, but not socket multiplayer; #819 owns that proof.
- The pure brain is used for configured skirmishes; unresolved player/faction identity still falls back to the legacy
  behavior tree. #820 owns evidence-backed removal.
- Required manifest-derived pre-merge runtime CI, isolated pinned-baseline execution, D-06 calibration, and soaks do not
  yet exist. Authored rows or one-time local passes are not release evidence.

## Execution and retirement rules

- A generic `continue implementing` resumes the first in-progress boundary above. Read only its linked plan, generated
  context packet, named fixture rows, first failing owner, and adjacent specs.
- Batch coherent repairs. Use focused checks when they guide the next change; run one grouped Playwright process after the
  batch. Follow the skirmish skill's bounded reporting and long-process rules.
- A sequential agent may commit directly to this integration branch. Parallel work requires isolated worktrees and
  sub-PRs targeting `feature/759-skirmish-ai`.
- At each issue close, move proven contracts to code/tests or code-adjacent docs, update backlinks, remove resolved
  narration and its follow-up plan, then commit/push and report the next model/effort.
- Delete this handoff and the follow-up directory when all retained knowledge has an owner and #759 closes.
