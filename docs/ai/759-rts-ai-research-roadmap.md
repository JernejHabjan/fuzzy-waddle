# #759 RTS AI improvement research and implementation roadmap

## Status and recommendation

- [x] Inspect the current strategic AI, managers, blackboard, simulation clock, command path,
      deterministic RNG, replay support, and focused tests.
- [x] Review the supplied RTS references and record which ideas are useful and which source or
      licensing boundaries prevent reuse.
- [x] Define the target architecture, deterministic evaluation harness, metrics, staged work, and
      acceptance criteria.
- [ ] Capture numerical baselines after the evaluation harness exists.
- [ ] Implement the stages below as separate, reviewable issues and PRs.

**Recommendation:** improve the existing deterministic scripted AI rather than replacing it with
runtime ML, an LLM, GOAP, or expensive search. Keep the current behavior tree as orchestration while
introducing a typed, testable pipeline:

```text
permitted world state
  -> immutable observation + remembered intelligence
  -> goal/manager intent proposals
  -> deterministic arbitration and reservations
  -> validated CommandBus commands
  -> replay trace, state digest, and metrics
```

The first behavior milestone should be a credible casual/intermediate skirmish opponent that plays
by the same information rules as a human. The first engineering milestone must be measurement and a
single authoritative command path; otherwise a behavior change cannot be proved better or safe for
lockstep.

## Repository findings

### Existing foundations to retain

- `PlayerAiController` advances from `SimulationTickService` at a one-second AI cadence. Multiplayer
  therefore has a simulation-clock entry point instead of depending on render frame rate.
- `RandomService` is seeded, counts operations, and can save/restore its generator state.
- `PlayerAiControllerMdsl` already decomposes map analysis, base planning, production, repair,
  strategy, defense, attack, economy, logistics, research, scouting, and combat tactics.
- Specialized managers already cover economy sampling, supply, production, repair, technology,
  scouting, targeting, base placement, adaptive thresholds, and combat micro.
- `PlayerAiBlackboard` persists useful strategic state, reservations, cooldowns, and enemy summaries.
- AI production, research, and many actor orders already enter the shared command system. The host is
  the only runtime that creates strategic AI controllers.
- Replays preserve the initial game state, seed/random state, and ordered command batches. Existing
  tick digests normalize batches by player number.

These are valuable production foundations. A rewrite would add risk without first showing which
decisions are weak.

### Correctness and evaluation gaps found

1. **Skirmish AI has omniscient enemy candidates.** `WorldStateSnapshotManager` applies a logical
   visibility radius only when campaign fog policy is `normal`; normal skirmish returns every owned
   enemy actor. `TargetingManager` and combat scoring can therefore act on hidden information.
2. **Observation updates are not atomic.** `WorldStateSnapshotManager.update()` starts an async
   refresh without awaiting it. The same AI step then updates targeting from the previous/mid-refresh
   blackboard. Async distance/path queries can finish later and overwrite newer decisions.
3. **Not every AI action uses the authoritative command path.** Strategic gather/attack orders use
   `dispatchAiOrder`, but scouting and combat micro write directly to pawn blackboards. Building
   construction also calls the spawn path directly before ordering a worker. Those changes are not
   uniformly validated, relayed, or represented in the replay command trace.
4. **Deterministic iteration is implicit.** Actor-index arrays, equal-score sorts, object iteration,
   and first-candidate selection do not consistently use stable actor-ID tie-breakers. Seeded RNG
   cannot protect determinism if input ordering differs.
5. **One accessibility check is ineffective.** `BasePlanner.refineAccessibility()` passes an async
   callback to `Array.filter`; promises are truthy, so unreachable candidate spots are retained.
6. **Scouting is map-origin based and forgets useful enemy knowledge.** Its fixed sector spiral is not
   derived from map bounds or the AI base, tracks friendly military positions rather than actual
   visibility, and has no typed last-seen enemy memory/confidence decay.
7. **Combat micro is local and command-churn prone.** It scores per unit against all visible enemies,
   has no squad ownership or engagement evaluator, and directly replaces pawn orders. Retreat always
   uses the base center and focus-fire has no overkill/damage reservation.
8. **Strategy has labels but no explainable goal competition.** Aggressive/defensive/economic
   thresholds exist, but there is no normalized utility output showing why one goal beat another or
   whether resources/actors conflict across managers.
9. **Telemetry cannot establish gameplay improvement.** It records wall-clock spans, counters, and an
   untyped `any` event buffer, but not command validity, observation age, resource float, supply-block
   time, idle workers, scouting coverage, engagement outcomes, or decision reasons.
10. **Replay digests hash commands, not authoritative simulation state.** Equal command streams can
    still produce different state. There is no automated fixed-seed AI tournament or baseline report.

These findings make “add smarter tactics” the wrong first PR. Fixing only omniscience would be useful,
but it could make the AI substantially weaker without the scouting memory and measurements needed to
explain the result.

## Research evidence and reusable ideas

### Primary references

| Source | Evidence useful here | Decision and licensing boundary |
| --- | --- | --- |
| [microRTS](https://github.com/Farama-Foundation/MicroRTS) | Its environment explicitly supports deterministic/non-deterministic and full/partial observation, scripted agents, search agents, and standalone batch execution. This supports evaluating one policy over a seed/map matrix rather than judging one playthrough. | GPL-3.0. Reuse the experimental method and metric ideas only; copy no implementation. The project is deprecated, so do not add it as a dependency. |
| [OpenRA bot modules](https://github.com/OpenRA/OpenRA/tree/bleed/OpenRA.Mods.Common/Traits/BotModules) | Production AI is split into base building, harvesting, unit construction, repair, expansion, support power, and squad modules. Its [squad state machines](https://github.com/OpenRA/OpenRA/tree/bleed/OpenRA.Mods.Common/Traits/BotModules/Squads) reinforce strategy/manager/squad/unit ownership. | GPL-3.0. Adapt the responsibility boundaries, not code or configuration. |
| [UAlbertaBot](https://github.com/davechurchill/ualbertabot/tree/master/UAlbertaBot/Source) | Separate information, scouting, strategy, build-order, combat-command, and combat-simulation authorities show how to keep remembered knowledge and strategic selection distinct from execution. | MIT, but this plan still recommends an independent TypeScript design matched to Fuzzy Waddle contracts. No source is copied. |
| [Portfolio Greedy Search and Simulation for Large-Scale Combat in StarCraft](https://doi.org/10.1109/CIG.2013.6633643) | Searching assignments of a small portfolio of scripts reduces the enormous multi-unit action space and fits a bounded tactical evaluator better than raw action search. | Research result, not an implementation dependency. Consider only after squads, deterministic snapshots, and a fast combat abstraction exist. |
| [Gym-microRTS](https://arxiv.org/abs/2105.13807) | Demonstrates the importance of fast batch environments and ablations, but also reports substantial training even for a small RTS environment. | Use its evaluation discipline. Runtime or trained RL is not justified for the current game/team. |

### Supplied references not selected for initial implementation

- [Beyond All Reason](https://github.com/beyond-all-reason/Beyond-All-Reason) remains useful for
  large-scale product observation, but its repository has mixed/asset-specific licensing and the
  supplied BARbarIAn repository URL is no longer available through GitHub. Do not copy from it.
- Steamhammer is a useful example of build selection and opponent memory, but the supplied GitHub URL
  is not available. Its maintainer's [Steamhammer documentation](https://satirist.org/ai/starcraft/steamhammer/)
  can inform terminology; do not reuse code unless a current source and license are verified.
- [BWAPI](https://github.com/bwapi/bwapi) is an LGPL-3.0 integration API, not an AI architecture.
  It is useful for discovering research bots, not as a dependency or code source.
- [BehaviorTree.CPP](https://github.com/BehaviorTree/BehaviorTree.CPP),
  [CrashKonijn GOAP](https://github.com/crashkonijn/GOAP), and
  [gdx-ai](https://github.com/libgdx/gdx-ai) demonstrate mature general-purpose tools. The repository
  already has a behavior tree and domain managers; replacing them would not address the measured gaps.
- [StarData](https://github.com/TorchCraft/StarData) and the supplied
  [LLM StarCraft project](https://github.com/histmeisah/Large-Language-Models-play-StarCraftII) do not
  declare a GitHub-detected license. Treat them as research demonstrations only. Offline replay
  analysis may become useful later, but nondeterministic network inference must not enter runtime
  lockstep.

### Research conclusion

The most transferable pattern is hierarchical, explainable control with a strict information model:

- behavior tree or state machine for orchestration;
- pure utility/rule scoring for frequent strategic choices;
- managers that propose work without mutating the world;
- squads that own units for a bounded objective;
- stable arbitration of competing intents;
- search only over a small script portfolio in an isolated tactical evaluator;
- batch replay/scenario evaluation before and after every behavior change.

## Proposed architecture

### 1. Observation and intelligence

Add a Phaser adapter that creates an immutable `AiObservation` at a specific simulation tick. Every
collection is sorted by stable actor ID. It contains only information permitted by a shared
`AiInformationPolicy`, independent of game mode:

- owned actors, resources, housing, queues, research, cooldowns, and logical positions;
- currently observable enemies and neutral/resource observations;
- map bounds, passability/threat summaries, and known objectives;
- no Phaser objects, wall-clock timestamps, promises, or render state.

Maintain a separate serializable `AiKnowledgeState` with `lastSeenTick`, last logical position,
observed type/owner/health band, and confidence. A hidden actor may inform a search location or threat
estimate, but never be issued as a live target ID. Campaign/scripted omniscience must be an explicit
policy capability, not a side effect of mode checks.

The adapter must build a complete candidate snapshot, await any required bounded query, verify its
generation/tick, and commit once. A newer generation invalidates older async results.

### 2. Goal and manager proposals

Keep managers, but make their decision portion pure where practical. They receive
`AiDecisionContext { observation, knowledge, profile, previousPlan }` and return typed proposals such
as:

```ts
type AiIntent =
  | TrainIntent
  | ResearchIntent
  | ConstructIntent
  | GatherIntent
  | ScoutIntent
  | FormSquadIntent
  | EngageIntent
  | RetreatIntent;
```

Each intent carries actor IDs, target ID or logical position, utility, reason code, preconditions,
resource reservation, expiry tick, and stable tie-break key. It does not mutate Phaser state.

Add a small goal layer above existing managers. Initial goals are `survive`, `recover-supply`,
`stabilize-economy`, `grow-army`, `gain-intelligence`, `defend`, and `pressure`. Normalize scores to a
documented range and record all winning/rejected reasons. The existing behavior tree can invoke the
goal evaluator and execution stages; it need not be replaced.

### 3. Deterministic arbitration and command execution

An `AiIntentArbitrator` sorts by priority/utility and then stable key, enforces per-step budgets,
reserves resources and actors, rejects stale/conflicting work, and returns an ordered accepted list.
The command adapter revalidates ownership, visibility/knowledge rules, availability, resources,
reachability, and target activity immediately before dispatch.

All gameplay effects must enter existing command contracts and `CommandBusService`, including scout,
focus-fire, retreat, flank, and construction. Direct pawn-order mutation and direct building spawn are
removed from strategic AI paths. AI commands then become replayable, host-relayed, sanitizable, and
countable through one authority.

### 4. Squads and tactical policies

Introduce squads only after the pipeline is stable. A squad owns an ordered set of actor IDs, one
objective, a rally/regroup point, stance, and lifecycle. Initial deterministic scripts should be:

- `hold`: remain in a defensible radius and intercept threats;
- `advance`: move as a group toward a known location;
- `focus-fire`: allocate damage without excessive overkill;
- `kite-or-retreat`: preserve vulnerable/ranged units when local power is unfavorable;
- `search-last-seen`: inspect remembered positions without targeting hidden IDs.

Start with utility selection among these scripts. Do not add playout/search until the pure tactical
evaluator is fast, deterministic, and demonstrably limited by fixed work units rather than wall time.

### 5. Difficulty profiles

Difficulty should configure decision quality transparently, not fork the architecture:

- observation/response delay in simulation ticks;
- maximum intents, squads, path queries, and tactical candidates per AI step;
- enabled goals/scripts and planning horizon;
- deterministic score noise/error rate from `RandomService`;
- retreat/aggression/risk thresholds.

Recommended default is no hidden information and no resource/stat bonuses. If bonuses are ever
desired, define them as explicit game contracts visible in lobby/campaign configuration and metrics.

## Deterministic evaluation and replay harness

Build three test levels so most iteration does not require rendering a full Phaser match.

### Level A: pure decision fixtures

Feed versioned `AiObservation` sequences to the decision core. Assert exact intent traces, rejection
reasons, reservations, and knowledge transitions. Fixtures cover equal-score tie-breaking, hidden
enemy transitions, stale observations, supply recovery, worker allocation, attack/retreat, and
save/restore continuation.

### Level B: fixed-seed runtime scenarios

Run small authored scenarios through the real simulation clock and command bus:

1. opening economy and first production building;
2. supply block and recovery;
3. nearby rush defense;
4. unseen enemy, scout discovery, loss of vision, and last-seen search;
5. favorable attack and unfavorable retreat;
6. blocked construction candidate;
7. save/restore at an AI decision boundary;
8. host-generated AI commands replayed by another runtime.

For each scenario run the same seed at least three times in the focused suite and compare command and
state digests. A nightly/explicit soak can use 20 repetitions and more seeds.

The existing command digest is retained. Add a canonical state projection at configured checkpoint
ticks, sorted by stable IDs and keys, containing only authoritative state: player resources/housing,
actor type/owner/logical transform/health/order, production/research queues, AI knowledge/plan state,
simulation tick, and deterministic RNG state. Exclude object identity, render coordinates, wall time,
logs, and performance spans.

On mismatch, emit the first divergent tick plus normalized observation, accepted/rejected intents,
commands, RNG operation count, and state projection. This makes a desync actionable instead of merely
reporting a final hash.

### Level C: batch match evaluation

Run candidate versus frozen baseline policies across a versioned map/seed/starting-side matrix.
Archive JSON and a short Markdown summary as CI artifacts rather than committing large replay output.
Compare distributions, not one match. Until enough samples exist, report win/loss/draw counts and
Wilson intervals; do not claim improvement from a single win-rate percentage.

## Metrics

### Hard correctness gates

- deterministic command and state digest equality for repeated fixed-seed scenarios;
- zero live target IDs for actors outside the permitted observation;
- zero commands from non-host AI and zero strategic world mutations outside the command adapter;
- zero invalid/dropped commands after arbitration in fixture scenarios;
- stable save/restore continuation trace;
- bounded work counters per AI step (observations, scored candidates, path queries, intents, commands).

Wall-clock p50/p95 decision duration is useful diagnostics but not a deterministic assertion. CI gates
work counts; a benchmark job reports time and memory.

### Gameplay and readability metrics

- milestone ticks: first worker, housing, production building, military unit, scout, expansion,
  attack, and research;
- economy: worker idle ticks, gatherer allocation, income by resource, resource float area-under-curve,
  reserved-but-unused value, and production idle ticks;
- supply: blocked ticks, time to recovery, and housing built too early/late;
- intelligence: explored-sector coverage, observation age, remembered contacts, and illegal target
  attempts;
- combat: army value committed/lost/destroyed, damage efficiency, retreat survival, overkill estimate,
  regroup time, and objective completion;
- control quality: accepted/rejected/invalid commands, repeated equivalent commands, target switches,
  actor assignment conflicts, and path-query count;
- outcome: win/loss/draw, game duration, remaining economy/army value, and surrender reason.

Capture the current AI as `baseline-v1` before behavior changes. Initial CI acceptance is deterministic
correctness plus no material regression outside the scenario targeted by a PR. Numerical improvement
thresholds are set in the relevant follow-up only after baseline variance is known.

## Staged implementation issues

Each stage should be a separate issue/PR. Stages 0–3 are prerequisites; later behavior stages may then
run in parallel when they own separate pure managers.

### Stage 0 — Fix known deterministic AI correctness defects

**Scope:** fix async `Array.filter` in base accessibility, add stable actor-ID tie-breakers to touched
selection/scoring paths, and add focused regression tests.

**Acceptance criteria:** unreachable sites are removed; equal-score candidates resolve identically
under permuted input; no behavior expansion; Phaser AI tests pass.

### Stage 1 — Add typed AI traces and pure fixture contracts

**Scope:** define versioned observation, knowledge, intent, rejection, trace, profile, and metric
contracts; remove `any` from new boundaries; create stable serialization/digest helpers; add the pure
fixture runner with no production behavior change.

**Acceptance criteria:** a fixture produces byte-stable traces under permuted input; trace explains
accepted and rejected choices; save/restore schemas are versioned; no Phaser object crosses the pure
decision boundary.

### Stage 2 — Route every strategic AI effect through commands

**Scope:** add/extend construction and actor-action command adapters; migrate scouting and combat
micro away from pawn-blackboard mutation; migrate direct construction spawn; instrument validation
and rejection.

**Acceptance criteria:** repository search finds no strategic AI world/order mutation outside the
adapter; host commands appear in replay batches; a second runtime applies the same commands; invalid
ownership/targets are rejected; focused multiplayer/replay tests pass.

### Stage 3 — Build atomic permitted observations and remembered intelligence

**Scope:** shared information policy for skirmish/campaign/scenarios, atomic tick-stamped snapshots,
generation cancellation, stable ordering, last-seen memory, confidence decay, and visibility tests.

**Acceptance criteria:** normal skirmish cannot target hidden actors; losing vision removes live IDs
but retains permitted last-seen data; stale async generations cannot commit; explicit scripted
omniscience is opt-in; save/restore preserves knowledge deterministically.

### Stage 4 — Add runtime state digests and scenario metrics

**Scope:** canonical state projection/checkpoint digest, first-divergence report, the eight Level B
scenarios, metric collector, and JSON/Markdown report generator.

**Acceptance criteria:** three repeated runs per fixture match command/state digests; an injected
state difference identifies the first divergent tick; baseline-v1 report is archived; work budgets
are visible.

### Stage 5 — Add goal utility, arbitration, and difficulty profiles

**Scope:** pure goal scoring, typed intent arbitration/reservations, reason codes, and easy/normal/hard
profiles using cadence, budgets, scripts, thresholds, and deterministic error.

**Acceptance criteria:** conflicts have one stable winner; no double resource/actor reservation;
normal has no cheats; profile behavior is reproducible; UI/config displays any explicit bonus.

### Stage 6 — Improve scouting and threat intelligence

**Scope:** map-bound sectors, base-relative frontier choice, scout suitability/risk, last-seen search,
threat grid, and defense triggers based on observed/remembered evidence.

**Acceptance criteria:** scouting coverage/age improves over baseline on the matrix; scouts do not
target outside map bounds; hidden enemies are never live-targeted; defense responds within its
profile delay; path-query budget is respected.

### Stage 7 — Add squads and engagement evaluation

**Scope:** squad ownership/lifecycle, objective assignment, local power evaluation, regroup/retreat,
focus-fire damage reservation, and the initial script portfolio.

**Acceptance criteria:** every controlled combat unit has at most one squad owner; unfavorable fixture
survival and favorable engagement completion do not regress; target churn/overkill improve; all
orders use the command adapter.

### Stage 8 — Improve openings, production, and adaptation

**Scope:** faction-valid opening plans, demand-driven composition, production utilization, expansion
choice, and opponent-observation adaptations. Keep authored opening data separate from execution.

**Acceptance criteria:** opening milestones stay within baseline-derived bands; supply-block and
resource-float metrics improve; plans recover from destroyed prerequisites and blocked sites; each
faction passes the seed/map matrix.

### Stage 9 — Add candidate-versus-baseline batch evaluation

**Scope:** frozen baseline policy selection, headless/accelerated batch runner, side/seed matrix,
statistical summary, artifact retention, and an explicit update process for the baseline.

**Acceptance criteria:** one command runs the published matrix; candidate and baseline versions are
recorded; failures retain replay/trace artifacts; policy regressions block only after variance-backed
thresholds are approved.

### Deferred research — bounded tactical search or offline learning

Only investigate script-portfolio search after Stage 7 shows a tactical ceiling and supplies a pure,
fast combat evaluator. Offline build-order/opponent modelling may use licensed replay data after
provenance, privacy, versioning, and reproducibility are designed. Runtime LLM/RL inference remains
out of scope because it conflicts with lockstep determinism, latency/cost budgets, offline play, and
explainability.

## Manual playtest matrix

After automated gates pass, compare baseline and candidate without revealing which is which:

- small and large maps; each supported faction; mirrored starting sides;
- passive opening, early rush, turtling, worker harassment, hidden expansion, and air/ground mix;
- easy/normal/hard; pause/speed changes in single-player; save/load at 5 and 15 minutes;
- host migration/reconnect when AI occupies a slot, once the multiplayer command migration exists.

Reviewers score perceived fairness, readability of intent, challenge, repetition, recovery from
disruption, and obvious cheating. Attach replay IDs and seed/map/profile to every report.

## Risks and controls

- **Smarter but less fun:** optimize scenario metrics and blind human ratings together; never use win
  rate alone.
- **Metric gaming:** keep outcome, economy, intelligence, combat, churn, and work-budget metrics; use
  holdout seeds/maps for milestone decisions.
- **Determinism regressions:** stable IDs/tie-breaks, tick-based expiry, seeded RNG, atomic snapshots,
  state hashes, and command-only mutation are hard gates.
- **Performance spikes:** deterministic work quotas and cached spatial summaries; avoid per-unit
  pathfinding or full pairwise scoring every tick.
- **Architecture migration stalls:** retain the behavior tree, migrate one intent family at a time,
  and keep adapters compatible until each path has fixture and replay coverage.
- **Difficulty feels like cheating:** default to information parity and surface every optional bonus.
- **Reference contamination:** copy no GPL/mixed-license source; record provenance if any reusable
  MIT/Apache input is later considered.

## Product decisions

The user has asked for a practical improvement plan, not another research gate. The following defaults
are therefore recorded as recommendations and do not block Stages 0–4:

1. **Target:** credible casual/intermediate normal AI; easy and hard are profile variants.
2. **Fairness:** normal AI uses human-equivalent information and no implicit resource/stat bonuses.
3. **Mode order:** skirmish first, then reusable campaign integration; networked AI remains host-owned
   and must pass replay/lockstep checks before wider matchmaking use.
4. **Technology:** deterministic scripted/utility AI in runtime; offline learning and tactical search
   are deferred evidence-driven experiments.
5. **Regression policy:** establish baseline variance before choosing numeric merge thresholds.

One product question remains before Stage 5, but not before infrastructure work:

### Explicit hard-mode bonuses

**Question:** May hard difficulty offer an optional, clearly disclosed economy/stat bonus, or must all
difficulties use identical game rules?

**Recommended default:** identical rules; scale decision cadence, budget, strategy breadth, and
deterministic error instead.

**Deferral impact:** none for Stages 0–4. Stage 5 can ship easy/normal and leave the hard bonus field
disabled until answered.

**Reply:** `Accept recommendation`, `Use: <bonus policy>`, or `Defer`.

## Copyable implementation prompt

```text
Implement #759 Stage 0 and Stage 1 from docs/ai/759-rts-ai-research-roadmap.md as separate focused
draft PRs. Treat the roadmap's confirmed architecture and product defaults as authoritative. First
fix the base-planner async accessibility defect and deterministic tie-break coverage without changing
AI behavior intentionally. Then add versioned pure AI observation/knowledge/intent/trace/profile
contracts, stable serialization, and deterministic fixture tests without routing production behavior
through the new pipeline yet. Use repository skills, inspect all call sites and persistence contracts,
run focused formatting/lint/typecheck/tests, perform omission and closure audits, and do not merge.
```
