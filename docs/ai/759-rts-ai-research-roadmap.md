# #759 RTS AI improvement research and implementation roadmap

## Document status

- **Issue:** [#759 — Further improve AI](https://github.com/JernejHabjan/fuzzy-waddle/issues/759)
- **Research PR:** [#764 — docs: add RTS AI improvement roadmap](https://github.com/JernejHabjan/fuzzy-waddle/pull/764)
- **Implementation dependency:** [#792 — fix(ai): make Stage 0 planner selection deterministic](https://github.com/JernejHabjan/fuzzy-waddle/pull/792)
- **Target mode:** skirmish first; reuse the same contracts for campaign where the information policy permits it.
- **Target experience:** a readable, fair, resilient casual/intermediate opponent that completes a classic RTS loop: establish an economy, avoid supply blocks, build a faction-valid army, scout, defend, pressure, expand, recover from disruption, and conclude the match.
- **Runtime technology:** deterministic, authored rules and utility scoring. Runtime ML/LLM inference and unbounded search are out of scope.
- **Last research pass:** 2026-09-04 against `research/759-rts-ai-roadmap`, current `develop`, the supplied reference list, the issue milestone, and the open Stage 0 PR.

### Research checklist

- [x] Inspect the controller, behavior tree, managers, blackboard, command path, deterministic clock, RNG, replay/save support, state hashing, match lifecycle, difficulty selection, and focused tests.
- [x] Compare the roadmap with the `Skirmish against AI` milestone acceptance criteria.
- [x] Review suitable RTS reference architectures and record licensing boundaries.
- [x] Define the classic-RTS behavior contract, target architecture, implementation sequence, deterministic evaluation harness, metrics, and release gates.
- [x] Reconcile this plan with the already-open Stage 0 implementation PR.
- [ ] Capture `baseline-v1` numbers after the fixture and batch harness exists.
- [ ] Implement the stages below as focused issues and PRs.

## Executive recommendation

Evolve the existing AI instead of replacing it. The repository already has a host-owned AI controller, a simulation-tick cadence, seeded randomness, a behavior tree, domain managers, command transport, saves/replays, and an authoritative state hash. The primary problem is not absence of AI modules; it is that their data and authority boundaries are loose, several behaviors are placeholders, and there is no repeatable way to prove that a change makes the player stronger without making it unfair or nondeterministic.

Use this end state:

```text
authoritative game state
  -> atomic, permitted AiObservation
  -> serializable AiKnowledgeState
  -> strategic goals + manager proposals
  -> deterministic intent arbitration and reservations
  -> squad/base/economy execution intents
  -> validated shared GameCommands
  -> command outcomes, trace, metrics, and canonical state digest
```

The behavior tree may remain as the coarse scheduler during migration. Managers must gradually stop mutating Phaser objects and instead produce typed intents. One arbitrator resolves conflicts and one adapter dispatches accepted work through shared commands. This creates a seam where macro, scouting, combat, and difficulty can improve independently and be evaluated from the same fixtures.

The roadmap is deliberately ordered so the first playable vertical slice arrives before advanced micro. A normal AI that reliably produces, scouts, attacks, recovers, and concedes is more valuable than sophisticated focus fire attached to a brittle economy.

## Classic RTS product contract

“Like Warcraft III or StarCraft II” is treated as a player-facing behavior contract, not as a request to clone either game's internals.

### What the skirmish player should observe

1. **An opening with intent.** The AI continuously creates workers, secures housing/supply before it blocks, builds production, and fields a first fighting force. It does not idle with enough money for obvious prerequisites.
2. **A coherent economy.** Workers are assigned by forecast demand, not merely current stockpile. Gatherers are replaced, unsafe workers retreat or transfer, depleted patches cause reassignment, and expansions are established when the main base cannot sustain the plan.
3. **Faction-valid production.** Build plans use the actual tech tree and available producers. The AI keeps production active, makes a useful composition from observed enemy capabilities, and can rebuild a destroyed prerequisite.
4. **Scouting under uncertainty.** The AI explores plausible enemy locations, updates remembered contacts when vision is gained, loses live targeting when vision is lost, and searches last-seen locations. Normal difficulty does not know hidden armies or bases.
5. **Purposeful armies.** Units belong to defense, attack, scout, reserve, or reinforcement roles. The AI assembles at a rally point, attacks an objective rather than one arbitrary actor, reinforces without constantly dissolving squads, and regroups or retreats when an engagement is poor.
6. **Legible tactics.** Units focus vulnerable or dangerous targets without extreme overkill, ranged units preserve distance when practical, damaged valuable units disengage, and defenders respond to threats before the main army resumes its plan.
7. **Resilience.** A lost worker, blocked building location, destroyed production structure, depleted resource, failed path, proxy building, or temporary supply block triggers a bounded recovery path instead of permanent inactivity or command spam.
8. **A complete match.** The AI wins through the normal victory rules and deterministically concedes only after a sustained unrecoverable position. Victory, defeat, or concession reaches the existing score screen with a valid final score.
9. **Readable difficulty.** Easy, normal, and hard differ in reaction delay, planning breadth, intentional error, risk, and tactical repertoire. Strategy personality is separate from difficulty. Any rules bonus is explicit in the lobby and result data.
10. **Fair and reproducible play.** The same seed and command stream produce the same decisions and state checkpoints. AI never bypasses shared validation, never acts on hidden IDs, and never uses render-frame timing as game time.

### Initial quality target

The first release target is not expert or tournament play. It is a normal-difficulty opponent that:

- completes a faction-valid opening on every supported skirmish faction/map pairing;
- produces workers and army continuously unless a trace gives a valid blocking reason;
- launches at least one purposeful attack or expansion in a stable 15-minute match;
- responds to an observed base threat within its documented decision delay;
- recovers from each authored disruption fixture or records a terminal reason;
- does not use hidden information or implicit economic/stat bonuses;
- concludes won/lost matches through the ordinary result and score flow;
- repeats exactly under the deterministic fixture matrix.

### Non-goals for the initial roadmap

- matching professional human micro or build-order optimization;
- copying Warcraft III or StarCraft II balance, races, or proprietary algorithms;
- replacing the human input/selection controller;
- runtime neural inference, LLM calls, imitation learning, or reinforcement learning;
- a general GOAP framework or a wholesale behavior-tree rewrite;
- expensive all-pairs combat simulation or per-unit pathfinding every AI step;
- hidden-information, resource, build-speed, or damage cheats by default;
- using win rate alone as proof of quality.

Shared order vocabulary such as attack-move, hold position, or patrol may need improvement for both human and AI players. That is a command-system dependency of this AI plan, not authorization for a broad human-controller redesign.

## Confirmed repository findings

### Foundations to retain

- `PlayerAiController` advances from `SimulationTickService` at a one-second AI cadence and limits catch-up work. This is the correct clock boundary for deterministic decisions.
- `RandomService` is seeded, counts operations, and can save/restore generator state.
- `PlayerAiControllerMdsl` already schedules map analysis, planning, production, repair, strategy, defense, attack, economy, logistics, technology, scouting, and combat tactics.
- Specialized managers already exist for economy, supply, production, repair, technology, scouting, targeting, base placement, adaptive thresholds, and combat micro.
- `CommandBusService` and `GameCommand` already provide the common path for production, research, and several actor orders. `AiPlayerHandler` creates strategic AI only on the host.
- Save/replay infrastructure preserves initial state, random state, and ordered command batches.
- `StateHashService` already builds a stable authoritative multiplayer projection with sorted actors, logical positions, ownership, health, queues, economy, combat/orders, player state, research, scenario data, and RNG state. Extend or extract this projection; do not create a competing world hash from scratch.
- `GameModeConditionChecker` and `ScoreTracker` already own victory/loss/tie evaluation and the score transition. AI completion should integrate with those authorities.

### Correctness and behavior defects

1. **Skirmish observation is omniscient.** `WorldStateSnapshotManager` applies a logical visibility radius only to a campaign fog policy. Normal skirmish gives targeting and combat code every non-owned actor.
2. **Non-owned is not the same as hostile.** Snapshot filtering does not consistently apply team or diplomacy, so team allies or other owned neutral actors can enter enemy consideration.
3. **Observation commits are not atomic.** `WorldStateSnapshotManager.update()` starts `refreshWorldState()` without awaiting it, advances its refresh timestamp, and lets the current step continue. Async path-distance results can expose mixed-age data or overwrite a later step.
4. **AI effects have multiple authorities.** Scouting and combat micro write pawn blackboards directly. Construction calls the building spawn path directly. Repair/logistics also call worker behavior methods directly. These paths bypass uniform command validation, relay, replay, and rejection telemetry.
5. **Deterministic ordering is incomplete.** Actor-index arrays, object iteration, equal-score sorts, random candidate selection, and “first” choices lack a universal stable-key rule.
6. **The base accessibility check has an async-filter defect.** Promises passed to `Array.filter()` are truthy, so unreachable locations are not removed. PR #792 addresses this and some stable candidate ordering; it does not deliver the rest of this roadmap.
7. **Difficulty is selected but unused by strategic AI.** `ProbableWaffleAiDifficulty` and lobby Easy/Normal/Hard choices exist, but the AI controller/managers do not consume the selected value. Today the three choices use the same behavior.
8. **Strategy polarity is wrong in one condition.** `IsEnemyPlayerWeak()` compares whether the AI's military strength is lower than the enemy's, despite its name, and feeds an aggressive branch. This must be fixed with a regression fixture, not patched without traceability.
9. **Some strategic actions are placeholders.** `GatherResources` and `StartUpgrade` can report behavior-tree success without completing the intended strategic action. The blackboard's `getMostNeededResource()` always returns `null`, disabling one logistics rebalance path.
10. **Blackboard state is duplicated and mutable.** It combines live Phaser references, top-level arrays, and mirrored economy/army/production slices. Reassignment can make those views diverge; broad `any` values make persistence and trace compatibility difficult to verify.
11. **Scouting has no useful information model.** Its fixed 32-unit spiral is centered on the map origin, not map bounds, bases, or plausible starts. It infers coverage from friendly military positions and has no typed last-seen contact, confidence, threat, route, or dedicated scout role.
12. **Combat is individual and churn-prone.** The attack branch sends all idle units to one live actor. Defenders only claim idle units. “Focus fire” mostly replaces invalid targets rather than coordinating damage; flank state is reset by snapshot refresh; retreat uses base center or `(0, 0)`; and scoring is effectively all owned units by all visible enemies.
13. **Production has no opening or demand forecast.** Force maintenance uses static/adaptive strength thresholds and queues at most one unit on a cooldown. It does not saturate producers, maintain worker/supply plans, reserve for prerequisites, or reason about time-to-completion.
14. **Base planning is not a base model.** The “base center” averages all owned actors and can drift with scouts/armies. Placement samples a few random points near that center, does not preserve worker/resource/production egress, and does not remember failed sites. Expansion is not modeled.
15. **Research is incomplete.** Spell research has a path, while the more general upgrade action is a no-op placeholder. There is no opportunity-cost or timing logic.
16. **Surrender is not classic skirmish behavior.** The AI can offer surrender only in limited modes and a human dialog can reject it forever. The heuristic uses instantaneous unit/building/resource counts, can concede despite recovery potential, then directly marks/destroys state. It lacks a sustained hopelessness window, typed reason, shared command, and deterministic end-to-end test.
17. **The milestone's anti-blocking requirement is not represented in current behavior.** A player can proxy or wall near AI production/resource lanes; placement and targeting do not reserve egress, validate post-build connectivity, prioritize hostile blockers, or recover from repeated failed movement/orders.
18. **AI persistence is incomplete.** Current AI save data preserves blackboard, telemetry, and enabled state, but not controller cadence accumulation, behavior-tree running state, manager cooldowns, scout coverage, assignments, squads, knowledge generation, or deterministic decision counters. Save/load can therefore change the next decision.
19. **Host migration ownership is not established.** Controllers are built when the initial scene is host. The inspected path does not prove that a new host reconstructs and resumes the exact AI brain state.
20. **Telemetry cannot prove improvement.** It emphasizes wall-clock spans, counters, and an untyped event buffer. It does not explain observation age, chosen/rejected goals, command outcomes, supply blocks, idle economy, scouting coverage, engagement outcomes, path failures, or recovery.
21. **State hashing exists but is not yet an AI evaluation harness.** It is multiplayer-oriented and its projection is private. It does not include AI knowledge, profile, plan, assignments, manager state, or decision cadence. The earlier claim that only commands are hashed is superseded by the inspected `StateHashService`; the implementation should reuse its canonical projection patterns.
22. **Focused coverage is narrow.** Snapshot and AI-handler tests exist, and PR #792 adds planner regressions, but there is no layered pure-decision suite or complete skirmish outcome matrix.

### Affected code map

Treat this as a discovery index, not a complete edit list. Search call sites before changing a contract because protocol changes cross libraries and runtime/server consumers.

| Concern | Current area |
| --- | --- |
| AI behavior tree, contracts, blackboard | `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/` |
| Phaser controller, agent, managers | `libs/games/probable-waffle/phaser/src/lib/player/ai-controller/` |
| Player/difficulty/save contracts | `libs/games/probable-waffle/protocol/src/lib/` |
| Game command union and transport | `libs/games/probable-waffle/protocol/src/lib/game-instance/probable-waffle/game-command.ts` and its consumers |
| Command queuing/application | Phaser command queue/action systems and server command validation |
| Match completion and scoring | `libs/games/probable-waffle/phaser/src/lib/world/state/GameModeConditionChecker.ts`, `ScoreTracker.ts` |
| Canonical authoritative hashing | `libs/games/probable-waffle/phaser/src/lib/world/services/recovery/state-hash.service.ts` |
| AI save/load | `libs/games/probable-waffle/phaser/src/lib/data/save-game.ts`, `load-game.ts`, protocol component data |
| Lobby AI settings | probable-waffle interface player-definition components and protocol player definitions |

## Research findings and boundaries

### Primary evidence

| Source | Useful transferable evidence | Decision / boundary |
| --- | --- | --- |
| [Blizzard s2client-api](https://github.com/Blizzard/s2client-api) and [SC2 protocol](https://github.com/Blizzard/s2client-proto/blob/master/s2clientprotocol/sc2api.proto) | A bot receives explicit observations and issues actions through a control protocol. SC2 also separates difficulty from AI build archetype and names cheat difficulties explicitly. | Use the observation/action seam and separate profile/personality model. Do not reproduce proprietary game behavior. Both repositories are reference interfaces, not dependencies. |
| [OpenRA AI configuration](https://github.com/OpenRA/OpenRA/blob/bleed/mods/ra/rules/ai.yaml) and [bot modules](https://github.com/OpenRA/OpenRA/tree/bleed/OpenRA.Mods.Common/Traits/BotModules) | Production bots separate base building, harvesting, unit production, repair, expansion, and squads. Profiles tune delays, composition fractions, construction limits, squad sizes, target types, and expansion behavior. | GPL-3.0. Reuse responsibility and configuration ideas only; copy no code or YAML. |
| [0 A.D. Petra BaseManager](https://docs.wildfiregames.com/javascript/petra/PETRA.BaseManager.html), [BasesManager](https://docs.wildfiregames.com/javascript/petra/basesManager.js.html), [AttackManager](https://docs.wildfiregames.com/javascript/petra/PETRA.AttackManager.html), and [construction plan](https://docs.wildfiregames.com/javascript/petra/queueplanBuilding.js.html) | Multiple bases have explicit state, territory/access regions, resource levels, serialization, recovery, and staged construction plans. Attack plans own objectives; construction revalidates prerequisites/builders/sites and delays repeatedly unbuildable plans. | 0 A.D. code is GPL-licensed/mixed by file. Adapt concepts only. The strongest lesson is to make base, attack, and construction lifecycle explicit and serializable. |
| [microRTS](https://github.com/Farama-Foundation/MicroRTS) | Scripted agents, partial/full observation, deterministic experimentation, and standalone batch runs support evaluation over maps/seeds rather than anecdotal play. | GPL-3.0 and deprecated. Use experimental method/metrics only; add no dependency and copy no implementation. |
| [UAlbertaBot](https://github.com/davechurchill/ualbertabot/tree/master/UAlbertaBot/Source) | Information, scouting, strategy, build-order, combat-command, and combat-simulation responsibilities are separated. | MIT. Still design independently around this repository's TypeScript and lockstep contracts. |
| [Portfolio Greedy Search](https://doi.org/10.1109/CIG.2013.6633643) | Choosing among a small portfolio of tactical scripts can bound a huge unit-action space. | Research only. Defer until a deterministic squad evaluator exists; do not begin with search. |
| [A Benchmark for StarCraft Intelligent Agents](https://cdn.aaai.org/ojs/12810/12810-52-16327-1-2-20201228.pdf) and [Starcraft AI Tournament Manager](https://github.com/davechurchill/StarcraftAITournamentManager) | A win against one opponent can be an exploit rather than general skill. Scenario scripts, metrics, repeated games, map/side variation, and retained artifacts are needed. | Adopt evaluation discipline. The tournament manager is MIT, but integrating a foreign runner is unnecessary. |
| [A Modular Multi-Scale Architecture for RTS Games](https://arxiv.org/abs/1811.03555) and [TStarBots](https://arxiv.org/abs/1809.07193) | Hierarchy and modular specialization reduce the decision space; learning can be confined to modules rather than owning the whole runtime. | Supports the architecture, not runtime learning. Rules remain easier to reproduce, inspect, and ship offline. |
| [Mistreevous](https://github.com/nikkorn/mistreevous) | Promise-returning actions remain running until resolution, which makes async lifetime, cancellation/generation, and save semantics important. | Keep the existing library. Do not depend on unresolved async snapshot writes or assume a running action is trivially serializable. |

### Supplied references not selected for initial implementation

- [Beyond All Reason](https://github.com/beyond-all-reason/Beyond-All-Reason) is useful for observing large-army behavior, but its repository contains mixed/asset-specific licensing. The supplied BARbarIAn repository URL was unavailable during research. Copy nothing from either without a new source/license review.
- Steamhammer demonstrates build selection and opponent modeling, but the supplied source URL was unavailable. Its maintainer's [documentation](https://satirist.org/ai/starcraft/steamhammer/) may inform vocabulary, not implementation.
- [BWAPI](https://github.com/bwapi/bwapi) is an LGPL-3.0 integration API and ecosystem index, not a directly suitable Fuzzy Waddle AI architecture.
- [BehaviorTree.CPP](https://github.com/BehaviorTree/BehaviorTree.CPP), [CrashKonijn GOAP](https://github.com/crashkonijn/GOAP), and [gdx-ai](https://github.com/libgdx/gdx-ai) show mature general tools. Replacing the repository's scheduler would not fix authority, observation, persistence, or evaluation gaps.
- [Gym-microRTS](https://arxiv.org/abs/2105.13807), [StarData](https://github.com/TorchCraft/StarData), and the supplied [LLM StarCraft project](https://github.com/histmeisah/Large-Language-Models-play-StarCraftII) are useful research context. Training/data provenance, reproducibility, and runtime determinism make them inappropriate for the initial product path.

### Research conclusion

The common useful pattern is `strategy -> domain manager -> squad/base plan -> unit command`, backed by an explicit observation model and a repeatable match harness. Mature RTS bots do not become good merely by adding more behavior-tree branches. They preserve ownership: one system decides what is known, one owns a plan, one reserves the means, and one legal command path changes the world.

## Target architecture and contracts

### 1. Immutable permitted observation

Create a pure, versioned `AiObservationV1` for one simulation tick. It contains no Phaser object, promise, render coordinate, wall-clock timestamp, callback, or mutable shared collection.

Suggested shape (names are illustrative and should follow existing conventions):

```ts
interface AiObservationV1 {
  readonly schemaVersion: 1;
  readonly tick: number;
  readonly playerId: string;
  readonly teamId?: string;
  readonly map: AiMapSummary;
  readonly economy: AiEconomySnapshot;
  readonly ownedActors: readonly AiOwnedActorSnapshot[];
  readonly visibleHostiles: readonly AiVisibleActorSnapshot[];
  readonly visibleAllies: readonly AiVisibleActorSnapshot[];
  readonly visibleResources: readonly AiResourceSnapshot[];
  readonly production: readonly AiProductionSnapshot[];
  readonly research: readonly AiResearchSnapshot[];
  readonly objectives: readonly AiObjectiveSnapshot[];
}
```

Rules:

- Collections are canonicalized by stable type then actor/player ID.
- Positions are authoritative logical/simulation positions, never interpolated render positions.
- Hostility comes from one diplomacy/team policy, not `owner !== self`.
- `visibleHostiles` contains live target IDs only while currently permitted.
- Map-derived summaries expose bounded regions/frontiers/access components rather than handing the pure brain a pathfinder.
- Expensive async queries execute into a candidate generation. Commit only when all required fields resolve and the generation is still current. An abandoned generation cannot mutate blackboard or knowledge.
- Campaign omniscience, scripted reveals, shared team vision, and spectator state are explicit `AiInformationPolicy` capabilities with tests.

### 2. Serializable remembered knowledge

`AiKnowledgeStateV1` is the only authority for information no longer visible:

```ts
interface AiContactMemoryV1 {
  readonly contactKey: string;
  readonly observedOwnerId: string;
  readonly observedType: string;
  readonly lastSeenTick: number;
  readonly lastSeenPosition: LogicalPoint;
  readonly lastSeenHealthBand: 'low' | 'medium' | 'high' | 'unknown';
  readonly confidence: number;
  readonly classification: 'worker' | 'army' | 'production' | 'tech' | 'defense' | 'unknown';
}
```

- Hidden contacts may create a search/defend hypothesis at a position; they cannot supply a live actor ID to an attack command.
- Confidence decays by simulation ticks using integer/fixed-point arithmetic where practical.
- Destroyed contacts are removed only from permitted evidence (observed death, explored-empty last position, or authoritative mode-specific knowledge).
- Enemy capabilities are inferred conservatively from observed types/production, with the evidence and age recorded.
- Knowledge, scout coverage, and start-location hypotheses are saved, loaded, traced, and hashed.

### 3. Strategic goals and authored plans

Use a small goal set with normalized integer utility, documented inputs, hysteresis, and reason codes:

- `survive_immediate_threat`
- `restore_economy`
- `restore_supply`
- `restore_prerequisites`
- `execute_opening`
- `grow_economy`
- `grow_army`
- `gain_intelligence`
- `defend_asset`
- `pressure_enemy`
- `expand`
- `tech_transition`
- `finish_match`

An opening is data, not a long conditional chain. It should state faction capability requirements and checkpoints rather than hard-code a single exact sequence:

```ts
interface AiOpeningPlanV1 {
  readonly id: string;
  readonly factionId: string;
  readonly archetype: AiStrategyArchetype;
  readonly steps: readonly AiOpeningStep[];
  readonly transitionConditions: readonly AiPlanCondition[];
  readonly fallbackPlanId: string;
}
```

Every step must answer: what capability is wanted, what prerequisites/resources/producer are needed, what may be reserved, when is it obsolete, and what fallback occurs if the site or producer is lost. Do not make plans depend on wall-clock completion or exact entity iteration order.

### 4. Typed intent proposals

Managers become proposal authorities and do not change the world:

```ts
type AiIntentV1 =
  | AssignWorkerIntent
  | ConstructIntent
  | TrainIntent
  | ResearchIntent
  | SetRallyIntent
  | ScoutIntent
  | FormSquadIntent
  | ReinforceSquadIntent
  | DefendIntent
  | AdvanceIntent
  | EngageIntent
  | RetreatIntent
  | RecoverPathIntent
  | ConcedeIntent;

interface AiIntentBaseV1 {
  readonly schemaVersion: 1;
  readonly intentId: string;
  readonly family: string;
  readonly createdTick: number;
  readonly expiresTick: number;
  readonly utility: number;
  readonly priorityClass: AiPriorityClass;
  readonly stableKey: string;
  readonly reason: AiReasonCode;
  readonly actorClaims: readonly string[];
  readonly resourceClaim?: AiResourceClaim;
  readonly tileClaim?: AiTileClaim;
  readonly preconditions: readonly AiPrecondition[];
}
```

Intent IDs and stable keys must derive from stable domain identifiers and monotonic per-brain counters, not random UUIDs or object identity. A manager can propose multiple alternatives, but it cannot assume acceptance or decrement resources preemptively.

### 5. Deterministic arbitration and reservations

`AiIntentArbitrator` is a pure reducer over observation, profile, prior reservations, and proposals.

Ordering:

1. discard expired or false-precondition intents;
2. sort by priority class, descending integer utility, then `stableKey`;
3. allocate exclusive actor, producer-slot, builder, tile/footprint, and resource claims;
4. enforce per-profile work and command budgets;
5. retain compatible reservations across steps until completed, invalidated, or timed out;
6. emit accepted/rejected records with stable reason codes;
7. produce one ordered execution list.

Required rejection examples: `stale_observation`, `not_visible`, `not_hostile`, `actor_claimed`, `producer_busy`, `insufficient_unreserved_resources`, `prerequisite_missing`, `site_blocked`, `path_unavailable`, `budget_exhausted`, `objective_obsolete`, and `command_validation_failed`.

Never rely on JavaScript sort stability alone. Every comparator ends with a unique stable domain key. Random choice occurs only after canonicalization and through a named deterministic RNG substream or recorded operation sequence.

### 6. Command adapter and outcome feedback

All accepted intents are revalidated and translated into shared `GameCommand` values. Necessary new commands must update, together:

- the protocol discriminated union and serialization guards;
- host/server validation and authorization;
- Phaser queue/application systems;
- replay, save, and recovery projections;
- human input adapter where the same player capability should be available;
- unit/integration tests for accept, reject, duplicate, stale, and replay behavior.

Construction and concession need first-class authoritative paths. Attack-move, hold-position, and patrol should be added only if the tactical implementation proves existing move/attack orders cannot express the behavior safely. Do not encode AI-only world mutations behind a generic debug command.

After dispatch, a typed `AiCommandOutcome` reports accepted, rejected, applied, superseded, failed, or timed out. Managers use outcomes to recover; they do not infer success merely because a command was emitted.

### 7. Brain state and scheduler

Create a versioned, serializable `AiBrainStateV1` containing at least:

- player/profile/archetype/opening identifiers and opening phase;
- knowledge and scouting coverage;
- base records and expansion candidates;
- worker, builder, producer, defender, scout, reserve, and squad assignments;
- current goals, objectives, reservations, and intent counters;
- manager cooldowns and failure/backoff state;
- squad state/lifecycle and damage reservations;
- difficulty error/cadence state;
- controller cadence accumulator and last completed observation/decision tick;
- required deterministic RNG state/substream counters;
- schema version and migration/default rules.

Do not serialize Phaser objects or unresolved promises. If the behavior tree has a running async action at save time, define an explicit safe-point policy: finish the current atomic decision before capturing, or cancel it and save a restartable phase. Save/load at a decision boundary must produce the same next observation, intent trace, command batch, and RNG operation count.

The behavior tree can initially call explicit phases:

```text
observe -> update knowledge -> evaluate outcomes -> propose -> arbitrate -> dispatch -> trace
```

Once all legacy mutation branches are migrated, assess whether the behavior tree still adds clarity. Replacing it then is a small evidence-based cleanup, not a prerequisite.

## Domain behavior design

### Economy and worker allocation

- Represent resource demand over a short deterministic horizon: next opening checkpoint, queued production, required supply, repair reserve, and desired expansion.
- Allocate workers by marginal value using resource need, known gather capacity/travel bucket, safety, and saturation. Exact pathfinding is not required for every worker; use cached region or distance bands and validate only selected orders.
- Preserve a minimum worker-production goal unless survival or supply recovery wins arbitration.
- Detect idle, dead-target, depleted-patch, unreachable, and unsafe gather states from command outcomes/observation. Reassign with exponential tick-based backoff to avoid spam.
- Reserve builders explicitly and return them to economy after completion/failure.
- Track income, idle-worker ticks, reassignment count, travel bucket, and gathering failures per resource.

### Supply, production, and technology

- Forecast `used + queued demand` against `capacity + housing completing within horizon`.
- Begin housing before expected block and escalate `restore_supply` only when the forecast or actual block crosses a threshold. Avoid repeated emergency housing when one valid structure is underway.
- Build and saturate a producer set. Choose the next unit from army role deficits, observed enemy capability, plan phase, affordability time, and producer opportunity cost.
- Keep at least a configurable defense floor before committing all production to a tech transition.
- Research only when prerequisites exist, a plan/counter supplies a reason, production survival is protected, and the opportunity cost fits the profile.
- On producer/prerequisite loss, invalidate affected reservations, create a restore intent, and fall back to a legal unit/plan rather than reporting success.

### Bases, expansion, and safe construction

Model a base as a serializable strategic object rather than the average position of all owned actors:

- stable base ID, anchor, access region, territory/defense radius;
- linked resources, estimated remaining resource life, saturation, and drop-off routes;
- owned production/tech/defense structures and active construction plans;
- worker count, rally/egress points, threat level, and evacuation state;
- construction exclusion/reservation zones and known site failures.

Placement is staged:

1. derive legal bounded candidates from map/building footprint and base/expansion context;
2. canonicalize candidates before any RNG sampling;
3. reject overlap, terrain, resource obstruction, and reserved footprint conflicts;
4. preserve minimum corridors between resource lines, worker spawn/drop-off, production exits, rally points, and the outside access region;
5. run bounded connectivity checks for shortlisted candidates, including hypothetical occupancy;
6. score strategic purpose, walking/access band, defense, clustering, future room, and threat;
7. reserve site and builder, then issue a construction command;
8. revalidate at application time and record a cooldown/failure reason if rejected.

Expansion selection compares resource life, access-region connectivity, distance band, defensive shape, threat/last-seen age, travel from a stable base anchor, and opportunity cost. An expansion plan has `proposed -> reserved -> establishing -> active -> evacuating/lost` lifecycle states.

### Scouting and intelligence

- Derive regions/sectors from map bounds and path-access components, not the world origin.
- Initialize deterministic enemy-start hypotheses from scenario start locations and eliminate them only through permitted exploration.
- Score frontiers using coverage age, information value, route risk, distance band, strategic plan, and current threat. Canonicalize ties.
- Assign explicit scout roles; do not steal a builder, critical defender, or entire army without an arbitration claim.
- Use routes/checkpoints rather than continually retargeting a single point. Recall scouts when they discover a decisive threat, become too damaged, or complete the route.
- Convert visible actors into contact memory and summarized capability evidence. Keep confidence and evidence age visible in traces.
- Defense may react to remembered movement toward a base, but live attack commands still require a visible/legal target or an attack/search position supported by the command model.

### Threats, defense, and anti-exploit recovery

Create typed threat incidents from visible/remembered evidence:

- location/region, first/last observed tick, confidence, hostile role/value, threatened base/asset, arrival estimate band, urgency, assigned squad, and resolution reason;
- worker harassment, main-army pressure, hostile static defense, proxy production, blocking building, trapped exit, and unknown contact are distinct classifications.

Defense chooses the smallest sufficient available squad plus reinforcements, preserves an economy evacuation path, and may preempt lower-priority pressure/scout intents through arbitration. It must not be limited to units that happen to be idle.

The anti-blocking recovery ladder is a release requirement:

1. detect repeated order/path failures, no-progress windows, trapped production/rally cells, and unreachable resource/base access;
2. retry with a canonical alternate point or route after bounded backoff;
3. reassign the actor, builder, resource, producer, target, or construction site;
4. cancel/replace a friendly blocking plan through a legal command when recovery requires it;
5. classify an observed hostile proxy/blocker as an urgent objective and form a clearing squad;
6. if no legal recovery exists, downgrade/replace the strategic plan and trace the terminal reason.

Never solve blocking by teleporting units, deleting hostile structures, targeting hidden IDs, or bypassing construction/order validation.

### Armies, squads, and objectives

Every combat unit has at most one primary assignment: base defense, threat response, attack squad, reserve/reinforcement, scout, or recovery. Squads contain ordered actor IDs and a stable lifecycle:

```text
forming -> assembling -> rallying -> advancing -> engaging
                   \-> defending
engaging -> regrouping -> advancing
engaging -> retreating -> recovering -> reserve/disbanded
objective invalid -> searching last-seen -> retarget/disbanded
```

An objective is usually a location/asset class with evidence, not one immortal actor reference. Initial objective priorities:

1. immediate threat to a base/economy;
2. hostile blocker/proxy preventing normal operation;
3. exposed army that can be engaged favorably;
4. observed production/tech/economy target;
5. last-seen base/search location;
6. map-control or expansion denial point.

The engagement evaluator should begin as deterministic integer/fixed-point heuristics over visible local value, health, range/mobility class, target access, static defense, reinforcements, objective value, retreat route safety, and confidence. Avoid pretending an inaccurate full combat simulator is ground truth.

Initial squad scripts:

- `hold_and_intercept`
- `assemble_and_advance`
- `focus_priority_targets`
- `kite_or_screen`
- `retreat_to_safe_rally`
- `search_last_seen`
- `clear_blocker`

Use damage reservations to reduce overkill: reserve estimated pending damage by target for the current decision window, then prefer the next legal target once lethal damage is covered. Apply target-switch hysteresis so a marginal score change does not churn commands. Units unable to follow a squad order enter a bounded recovery state instead of repeatedly receiving the same order.

### Difficulty and strategy personality

Do not overload `ProbableWaffleAiDifficulty` with opening style.

```ts
type AiStrategyArchetype =
  | 'balanced'
  | 'rush'
  | 'macro'
  | 'turtle'
  | 'tech';
```

Only expose archetypes that have faction-valid plans; a future air archetype depends on actual roster support. Selection may be explicit in the lobby later or deterministic from match seed and faction. The chosen archetype is visible in debug trace/result metadata, not silently changed mid-match.

Recommended fair profiles:

| Knob | Easy | Normal | Hard |
| --- | --- | --- | --- |
| Strategic response | slower tick delay | current one-second class | faster but bounded |
| Candidate/intent budget | small | standard | larger |
| Opening set | one forgiving plan | several legal plans | several plans + adaptation |
| Tactical scripts | hold/advance/basic retreat | full initial set | full set + better evaluation budget |
| Information memory | shorter/noisier deterministic confidence | standard fair memory | longer fair memory |
| Intent error | occasional seeded suboptimal legal choice | low | none/minimal |
| Target-switch hysteresis | high | standard | tuned by engagement |
| Rules/resources/stats | identical | identical | identical by default |

All profiles obey identical visibility, validation, and deterministic work limits. The existing `aiAdvantageResources` modifier should be audited and wired only as a separately named, explicitly displayed rules option if product wants it. Never hide it inside “Hard.”

### Match conclusion and score flow

Replace dialog-veto AI surrender with a host-authoritative, replayable concession flow for skirmish:

- calculate recoverability from surviving builders/workers, legal production paths, income access, army/defense value, queued completions, and known hostile pressure;
- require hopelessness for a sustained tick window and cancel the candidate if recovery evidence returns;
- emit a typed reason such as `no_rebuild_path`, `no_economy_access`, `overwhelming_force`, or `all_assets_lost`;
- revalidate on the host and apply through a shared match-state command/event;
- announce the concession without asking the opponent to approve it;
- let normal `GameModeConditionChecker`/`ScoreTracker` finalize victory and reach the score screen;
- preserve score/result/reason in replay/save where applicable.

If product explicitly keeps the current offer dialog, rejection must not permanently disable later valid offers and the underlying state mutation still must become authoritative/replayable. The recommended default is automatic concession after a conservative sustained threshold.

## Determinism, persistence, and observability

### Canonical state and decision hashes

Extract/share the stable serialization/projection machinery behind `StateHashService` where possible. Do not duplicate actor projection rules that can drift. The AI harness needs two related digests:

1. **Authoritative state digest:** existing world/player/RNG projection, callable in single-player and headless fixtures at configured checkpoint ticks.
2. **AI decision digest:** profile/archetype, permitted observation, knowledge, brain state, proposals, arbitration result, command outcomes, and deterministic counters.

Exclude wall time, logging spans, render state, object identity, promises, stack traces, and unordered maps. Include schema/version IDs in projections. On divergence, report the first tick and first normalized path/value difference, not only two opaque hashes.

### Decision trace

One bounded `AiDecisionTraceV1` per decision tick should contain:

- observation tick/generation/age and information policy;
- active goals with scores, evidence, hysteresis, and winner;
- proposed, accepted, and rejected intents with reason codes;
- reservation delta and released claims;
- dispatched commands and outcomes;
- manager work counts and budget exhaustion;
- RNG operation range/substream used;
- knowledge contacts added/updated/expired;
- recovery transitions and current plan/squad/base states.

Use a bounded ring buffer in runtime and structured export in tests/debugging. Avoid free-form text as the only evidence; stable reason codes make regression assertions durable.

### Performance budget

Deterministic work quotas are correctness constraints:

- maximum observations/contacts processed per step;
- maximum goal and intent proposals;
- maximum placement/path candidates and path queries;
- maximum threat/engagement pairs;
- maximum commands and target switches;
- maximum trace events retained.

Defer excess work by stable cursor/order to later simulation ticks. Wall-clock p50/p95 and memory are reported by benchmarks but must not decide which action wins or when runtime work stops.

## Evaluation system

### Level A — pure decision fixtures

Run in the gameplay library without Phaser rendering. Feed versioned observations/outcomes into the brain and assert exact knowledge, goal, intent, arbitration, and state transitions.

Required fixtures:

1. permuted input produces identical trace and digest;
2. equal utility resolves by stable key;
3. ally/neutral/hostile classification is correct;
4. hidden contact loses live ID and becomes a last-seen hypothesis;
5. stale async generation cannot commit;
6. worker demand changes allocation without double assignment;
7. forecast supply block reserves one valid housing plan;
8. destroyed prerequisite creates a rebuild fallback;
9. resource and producer conflicts produce one explained winner;
10. save/restore at a decision boundary preserves the next trace/RNG count;
11. unfavorable engagement retreats; favorable engagement advances;
12. damage reservations reduce overkill deterministically;
13. repeated command failure advances the recovery ladder;
14. hopelessness must remain sustained before concession.

### Level B — real runtime scenarios

Run authored fixed-seed scenarios through the simulation clock, command bus, and actual relevant systems:

1. faction-valid opening to worker, housing, producer, and first squad;
2. actual and forecast supply block recovery;
3. early rush defense and worker preservation;
4. unseen enemy, discovery, lost vision, last-seen search, rediscovery;
5. favorable attack, reinforcement, objective destruction, retarget;
6. unfavorable engagement, regroup, and survivor recovery;
7. blocked construction candidate and alternate-site selection;
8. friendly layout that could trap workers/production but is rejected;
9. hostile proxy/wall blocking base egress and clearing response;
10. depleted resource and gatherer reassignment/expansion;
11. destroyed builder/producer/prerequisite and plan recovery;
12. save/load at opening, squad, and concession-candidate boundaries;
13. host-generated AI commands replayed/applied by another runtime;
14. AI loss/concession through final score-screen state;
15. pause and speed changes without decision-order changes.

Run each focused fixture three times in normal CI and compare commands plus authoritative/AI digests. Use 20 repetitions across more seeds in an explicit/nightly soak.

### Level C — batch candidate versus baseline

- Freeze the pre-behavior current implementation as `baseline-v1`; record commit, schema, map, seed, side, faction, profile, archetype, and rules modifiers.
- Run mirrored starting sides over a versioned seed/map/faction/opponent-style matrix.
- Compare the candidate against baseline, scripted probes (rush/turtle/proxy/idle), and self-play where it answers a specific question.
- Preserve compact JSON summary, first-divergence data, replay/trace references for failures, and a Markdown report as CI artifacts. Do not commit large generated replays.
- Report counts and uncertainty (for example Wilson intervals) until sample size supports stronger statistical claims.
- Promote a baseline only through an explicit reviewed process. Never silently compare a candidate with its own changed behavior.

### Manual blind playtest

After automated gates pass, compare labeled-only-as-A/B builds:

- small/large and open/chokepoint maps;
- every supported faction and mirrored start;
- passive macro, early rush, turtle, worker harassment, hidden expansion, mixed mobility/air where roster support exists, proxy building, and wall/block exploitation;
- easy/normal/hard and each supported archetype;
- pause/speed changes, save/load near 5 and 15 minutes, reconnect/host migration once supported.

Reviewers score fairness, legibility, challenge, repetition, recovery, suspected cheating, and match completion. Every report records build commit, seed, map, side, faction, profile, archetype, rules modifiers, outcome, and replay/trace reference.

## Metrics and acceptance policy

### Hard correctness gates

- repeated fixed-seed scenarios have identical command, authoritative-state, and AI-decision digests;
- zero live target IDs outside permitted current observation;
- zero ally/neutral targets unless an explicit scenario rule permits them;
- zero AI commands from a non-authoritative host;
- zero strategic world/order mutations outside the approved command/application authority;
- stable save/restore continuation at documented safe points;
- every accepted/rejected intent and failed command has a reason;
- deterministic per-step work quotas are never exceeded;
- all match outcomes reach one final result and score flow exactly once.

### Macro metrics

- tick of first worker, supply/housing, production building, military unit, scout, research, expansion, attack, and recovery completion;
- worker idle ticks and allocation by resource;
- income and spend by resource; unspent float area-under-curve;
- reserved-but-unused value and reservation age;
- producer idle ticks, queue utilization, and unit composition by role;
- supply-block ticks, forecast accuracy, recovery delay, and premature-housing cost;
- prerequisite/site/order failure counts and recovery outcomes;
- base resource-life estimate, saturation, and expansion establishment time.

### Intelligence and control metrics

- explored coverage and coverage-age distribution;
- contact count, age/confidence, capability inference, and rediscovery delay;
- illegal hidden/ally target attempts (must remain zero after validation);
- threats detected, response delay, false/obsolete threat count;
- intents proposed/accepted/rejected by reason;
- invalid/dropped/repeated commands and command-to-applied latency;
- target switches, actor claim conflicts, stuck/no-progress incidents;
- candidates and path queries consumed per decision.

### Combat and outcome metrics

- army value committed, destroyed, lost, surviving after retreat, and reinforcement latency;
- damage/army-value efficiency and estimated overkill;
- objective completion/abandonment, regroup time, base damage prevented;
- win/loss/draw/concession reason, duration, final economy/army value, and score-screen completion;
- crash, unhandled rejection, desync, stuck-match, and no-progress timeout counts.

### Merge policy for behavior changes

The harness initially gates deterministic correctness and scenario-specific regressions. Numerical improvement thresholds must be set only after `baseline-v1` variance is measured. Every behavior PR states its primary metric, guardrails, fixture set, and observed candidate/baseline result. A single win, hand-picked seed, or subjective “looked smarter” playthrough is not sufficient.

## Implementation roadmap

Each stage is a focused issue/PR. A stage may be subdivided when its protocol surface is too large, but acceptance criteria must not disappear. Branch every stage from current `develop` after required dependencies merge; do not stack undocumented behavior changes on the research branch.

### Release Gate A — trustworthy decision foundation

#### Stage 0 — land the existing deterministic planner fix

**Status:** implementation already exists in PR #792; do not duplicate it in a new branch.

**Scope**

- Correct async base-site accessibility filtering.
- Add stable coordinate/actor-ID tie-breakers to the selection paths touched by that PR.
- Preserve behavior outside the defect.

**Before continuing**

- Rebase/update PR #792 onto current `develop`; its historical build failure was the application bundle budget before PR #794's lazy-loading correction.
- Review current diff and run the smallest relevant planner/AI checks plus repository-required build.
- Repair only failures attributable to #792; do not merge automatically.

**Acceptance**

- Unreachable sites are excluded after awaited evaluation.
- Permuting equal-score candidates yields the same selected stable actor/coordinate.
- Focused tests pass on current `develop`; PR is reviewable and green.

#### Stage 1 — correct static logic and introduce versioned trace contracts

**Dependencies:** Stage 0 can be reviewed in parallel, but reconcile overlapping planner tests before merge.

**Scope**

- Add regression tests and correct `IsEnemyPlayerWeak()` polarity.
- Turn no-op success in `GatherResources`, `StartUpgrade`, and always-null resource need into explicit unsupported/failure behavior or the smallest real legal implementation; never claim success for no effect.
- Define stable reason codes and versioned trace/metric envelopes without changing all production manager boundaries yet.
- Replace new `any` boundaries with typed values; document canonical comparison/key rules.

**Acceptance**

- Each confirmed static defect has a failing-before/passing-after test.
- Unsupported actions cannot return success and silently unblock a behavior branch.
- Trace values serialize deterministically and bound their retained event count.
- No intentional strategic expansion is bundled into this correctness PR.

#### Stage 2 — pure observation, knowledge, intent, profile, and brain contracts

**Scope**

- Add `AiObservationV1`, `AiKnowledgeStateV1`, `AiIntentV1`, `AiDifficultyProfileV1`, `AiStrategyArchetype`, `AiBrainStateV1`, arbitration result, command outcome, and schema migration defaults.
- Create canonical serialization/stable-key helpers and a minimal pure fixture runner.
- Add adapters from a small existing snapshot subset but keep current production behavior active.

**Acceptance**

- No Phaser/live object crosses the pure boundary.
- Permuted equivalent fixtures serialize and digest identically.
- Save/default/migration tests reject unsupported future schemas clearly.
- One fixture explains accepted and rejected dummy intents.

#### Stage 3 — single authoritative AI command path

**Scope**

- Inventory every AI mutation and classify command/application ownership.
- Add authoritative construction and concession command/event contracts.
- Migrate scout, combat micro, repair, logistics, and construction effects from direct pawn/spawn calls to the shared command adapter.
- Add outcome feedback, duplicate/stale rejection, replay projection, and host authorization.
- Decide attack-move/hold/patrol individually from demonstrated executor needs.

**Acceptance**

- Exact repository search plus reviewed allowlist finds no strategic AI mutation outside the adapter.
- Host emits and a second runtime/replay applies the same ordered commands.
- Invalid ownership, ally/hidden targets, stale commands, illegal sites, and insufficient resources are rejected with stable outcomes.
- Protocol, server/transport, Phaser application, replay, and tests change together.

#### Stage 4 — atomic fair observation and diplomacy

**Scope**

- Build tick-stamped immutable snapshots with generation-safe async commit.
- Apply team/diplomacy and shared `AiInformationPolicy` consistently across modes.
- Add visible-now contacts and minimal serializable last-seen knowledge.
- Remove live enemy Phaser references from decision-facing blackboard paths.

**Acceptance**

- Normal skirmish cannot see/target hidden actors or allies.
- Loss of vision removes live IDs while preserving permitted last-seen positions.
- A late older async generation cannot commit or change the next decision.
- Campaign/scripted omniscience is explicit and covered separately.
- Save/load preserves knowledge and next observation deterministically.

### Release Gate B — measurable classic RTS vertical slice

#### Stage 5 — deterministic harness, shared state projection, and baseline

**Scope**

- Extract/reuse `StateHashService` canonical projection for single-player/headless checkpoints.
- Add AI decision projection, first-difference reporting, work counters, and structured trace export.
- Implement Level A foundation and the initial Level B opening/supply/visibility/save/replay scenarios.
- Freeze and run `baseline-v1`; archive JSON/Markdown artifacts.

**Acceptance**

- Three identical scenario runs match command/world/AI digests.
- An injected actor and AI-state divergence reports the first tick and normalized field path.
- Baseline report records commit, contract versions, map/seed/side/faction/rules.
- CI gates work counts, not wall-clock timing.

#### Stage 6 — goal scoring, arbitration, and real difficulty wiring

**Scope**

- Add the initial strategic goal utility/hysteresis/reason layer.
- Add actor/resource/producer/site reservations and deterministic arbitration.
- Map lobby difficulty to explicit fair profiles.
- Separate deterministic archetype/opening selection from difficulty.
- Keep legacy managers behind adapters until migrated.

**Acceptance**

- Conflicting intents have exactly one reproducible winner and explained losers.
- Resources/actors/producers cannot be double-reserved.
- Easy, normal, and hard produce documented reproducible differences.
- All difficulties retain identical visibility and rules by default.
- Any enabled rules bonus appears in configuration, trace, replay/result metadata, and UI.

#### Stage 7 — reliable opening, workers, supply, and production

**Scope**

- Add at least one forgiving faction-valid opening per supported faction.
- Implement demand-forecast worker allocation, minimum worker production, supply forecasting, producer construction/utilization, and prerequisite recovery.
- Replace placeholder gather/upgrade behavior with intent-based execution.
- Add a basic legal army-role composition before advanced counters.

**Acceptance**

- Every supported faction/map fixture reaches worker, housing, producer, and first-squad milestones.
- AI neither remains supply-blocked nor queues redundant emergency housing in authored fixtures.
- Idle workers, production idle time, and unexplained resource float improve versus baseline or meet reviewed bands.
- Destroyed builder/producer/prerequisite recovers through a valid fallback.
- No stage acceptance depends on an enemy standing idle.

#### Stage 8 — basic scouting, threat response, attack wave, and match completion

**Scope**

- Add map-bound/base-relative scouting, start hypotheses, last-seen search, and scout role.
- Add threat incidents and one defense squad path.
- Add one attack squad lifecycle with rally, advance, objective invalidation, and reinforcement.
- Integrate sustained AI concession with the existing result/score flow.

**Acceptance**

- Normal AI finds an unseen opponent through legal exploration.
- An observed early threat receives a defense response within the profile delay.
- A stable match produces a purposeful attack wave and retarget/search behavior.
- A hopeless AI concedes once through an authoritative event; recovery cancels pending concession.
- Win/loss/concession reaches the score screen in the runtime fixture.

Release Gate B is the first end-to-end playable milestone. Do not postpone it for sophisticated micro.

### Release Gate C — resilience, bases, and anti-exploit behavior

#### Stage 9 — explicit bases, safe placement, and expansion lifecycle

**Scope**

- Replace moving average “base center” with stable base records/access regions.
- Add staged, footprint-aware placement, site reservations, failure memory, and egress checks.
- Add resource-life/saturation-driven expansion selection and lifecycle.
- Preserve production, worker, rally, and resource corridors.

**Acceptance**

- Friendly construction does not trap authored worker/production lanes.
- Rejected/blocked sites enter bounded cooldown and a legal alternate is selected.
- Expansion establishes on a safe connected candidate before main resources cause permanent idle.
- Base identity does not move when an army/scout crosses the map.
- Placement candidates/path queries remain within profile budgets.

#### Stage 10 — stuck detection, hostile blocker recovery, and robust economy

**Scope**

- Add command no-progress/failure aggregation and the recovery ladder.
- Detect trapped exits, inaccessible resources, hostile proxy/blocking structures, and unsafe workers.
- Form `clear_blocker` objectives and reassign workers/resources/builders after failure or depletion.
- Add alternate rally/site/route selection and legal friendly-plan cancellation where required.

**Acceptance**

- The milestone proxy/wall fixture cannot leave the AI permanently inert.
- Observed hostile blockers are prioritized without using hidden IDs.
- Depleted/unreachable gather targets are replaced and idle workers recover.
- Repeated failures back off and transition state; they do not emit equivalent commands forever.
- No recovery teleports/deletes actors or bypasses validation.

### Release Gate D — stronger combat, adaptation, and release evaluation

#### Stage 11 — squads, engagement evaluation, and tactical scripts

**Scope**

- Generalize squad ownership/lifecycle for defense, pressure, reserve, and reinforcement.
- Add bounded local engagement evaluation, safe rally/retreat, target hysteresis, focus-fire damage reservations, and initial script portfolio.
- Migrate remaining legacy per-unit combat mutation and dead flank state.

**Acceptance**

- Each combat actor has at most one primary squad assignment.
- Favorable engagement objective completion does not regress; unfavorable retreat survival improves or meets baseline-derived bands.
- Target switches, repeated orders, and estimated overkill improve in focused fixtures.
- Disconnected/slow units recover or leave squad state without stalling it.
- Tactical work remains quota-bounded and deterministic.

#### Stage 12 — observed composition adaptation, tech, and archetype breadth

**Scope**

- Infer enemy capability from permitted observations and age/confidence.
- Add role-deficit composition, legal tech timing, opening transitions/fallbacks, and reviewed faction-valid rush/macro/turtle/tech archetypes.
- Add defensive/expansion adaptation without allowing per-tick personality thrash.

**Acceptance**

- Composition changes only from recorded permitted evidence and obeys hysteresis.
- Tech spending does not violate survival/supply/prerequisite reservations.
- Every exposed archetype completes its supported faction opening and recovers from a destroyed prerequisite.
- Hidden enemy composition cannot influence the decision digest.

#### Stage 13 — batch evaluation, tuning, performance, and host recovery

**Scope**

- Add one-command Level C matrix, candidate/baseline report, retained failure artifacts, and reviewed promotion rules.
- Tune profiles from metrics plus blind playtests, not individual wins.
- Validate save/load, reconnect/host migration AI reconstruction, long-match work bounds, and result uniqueness.
- Document supported maps/factions/archetypes and remaining limitations.

**Acceptance**

- Published matrix runs from a clean checkout and identifies candidate/baseline versions.
- No deterministic, crash, hidden-information, anti-blocking, outcome, or score-screen gate fails.
- Host recovery creates exactly one AI controller per AI player and resumes the same brain state, or multiplayer AI is explicitly restricted with a tracked follow-up before release.
- Performance report shows bounded work and no unreviewed regression on representative large matches.
- Product-reviewed numerical thresholds and blind-playtest results support release.

### Deferred Stage 14 — bounded tactical search or offline learning

Only open this stage if Stage 11 metrics show a tactical ceiling and the pure engagement evaluator is fast and predictive enough to compare script outcomes. Any search must use deterministic work units, canonical inputs, and a small authored script portfolio. Offline build-order/opponent modeling also requires licensed/provenanced data, reproducible training, versioned artifacts, a deterministic runtime policy, and a demonstrated gain over authored rules. Runtime LLM/RL inference remains out of scope.

## Release gates summary

| Gate | User-visible result | Blocking evidence |
| --- | --- | --- |
| A — trustworthy foundation | AI decisions become fair, command-routed, explainable, and saveable | deterministic fixtures, no hidden/allied targets, no direct mutation |
| B — playable vertical slice | normal AI opens, produces, scouts, defends, attacks, concedes, and reaches scores | opening/visibility/threat/attack/concession runtime scenarios |
| C — resilient skirmish | AI builds/expands safely and recovers from walls, proxies, depletion, and failures | anti-blocking and recovery fixtures, bounded retries |
| D — stronger/releasable | squads, adaptation, real difficulty, batch evidence, host/save robustness | candidate/baseline matrix, blind playtest, performance and lifecycle gates |

## Risks and controls

- **Architecture migration stalls:** migrate one intent family at a time behind adapters; keep the behavior tree until all mutation paths have contract tests.
- **AI becomes fair but too weak:** establish legal scouting/memory and basic macro in the same release gate; measure weakness rather than reintroducing omniscience.
- **Smarter but less fun:** combine outcome/macro/combat metrics with blind human ratings and readable traces. Do not optimize only win rate.
- **Metric gaming/overfitting:** use multiple probe opponents, mirrored sides, holdout seeds/maps, and baseline versioning.
- **Determinism regression:** canonical inputs, complete tie-breaks, tick time, atomic generations, seeded RNG, command-only effects, state/decision digests, and save continuation are hard gates.
- **Performance spikes:** use cached spatial summaries, stable cursors, candidate shortlists, and deterministic quotas. Never stop planning based on elapsed wall time.
- **Command scope expands uncontrollably:** add only demonstrated shared capabilities and update all protocol/validator/application/replay consumers in the same stage.
- **Difficulty feels like cheating:** keep strategy separate, enforce information parity, and surface any optional bonus in lobby, trace, replay, and result data.
- **Surrender fires too early:** require sustained multi-signal hopelessness and cancel on recovery.
- **Reference contamination:** copy no GPL/mixed-license code or data. Record provenance and license before considering any reusable MIT/Apache artifact.
- **Plan drifts from product:** keep milestone gates user-visible and attach scenario/metric evidence to every behavior PR.

## Product defaults and open decisions

These defaults allow implementation to begin without another research gate:

1. **Target:** credible casual/intermediate normal AI; easy/hard are fair quality profiles.
2. **Fairness:** human-equivalent information and identical game rules on all difficulties by default.
3. **Strategy:** archetype is independent from difficulty and deterministically selected until lobby UX explicitly exposes it.
4. **Mode:** skirmish first; campaign uses the same core with an explicit information/objective policy.
5. **Authority:** host-owned brain, shared validated commands, replayable outcomes.
6. **Concession:** automatic after sustained unrecoverability; no opponent veto; existing match/score systems finalize the result.
7. **Technology:** deterministic rules/utility and squad state machines; search/learning deferred.
8. **Evaluation:** correctness first, then baseline distributions and blind playtest; never one match.
9. **Human controller:** no broad redesign; shared order capabilities may be added when AI execution demonstrates a need.

The following decisions are non-blocking until their named stage:

- **Optional hard-mode rules bonus (Stage 6):** recommended `off`. If retained, expose it separately from difficulty and audit the existing `aiAdvantageResources` modifier end to end.
- **Strategy selection UI (Stage 12):** recommended deterministic automatic archetype first; explicit lobby selection can follow after each exposed plan is supported.
- **Attack-move/hold/patrol commands (Stage 3/11):** add the minimum shared semantics proven necessary by squad fixtures.
- **Host migration support (Stage 13):** recommended required for networked AI; otherwise explicitly restrict unsupported lobbies and track removal of that restriction.

## Cold-start handoff for the next implementation agent

This section is intentionally operational. A new agent should be able to begin without repeating the research pass.

### Repository and branch state at handoff

- Research lives on `research/759-rts-ai-roadmap` in PR #764 and should contain documentation only.
- Current implementation dependency is PR #792 on branch `fix/759-ai-stage-0-correctness`.
- PR #792 fixes async planner accessibility and deterministic candidate selection; it does **not** fix atomic observation, omniscience, commands, difficulty, macro, squads, persistence, or evaluation.
- At the 2026-09-04 research pass, PR #792's recorded build failure was the old application bundle budget. Current `develop` includes PR #794's lazy-loading/budget work, so rebase and verify before diagnosing it as an AI failure.
- The research branch was behind current `develop`; do not implement by piling feature commits onto it. Start focused implementation branches from freshly updated `develop` after dependencies merge.

### Mandatory first actions

1. Read repository `AGENTS.md`, then the smallest matching repo workflow, task-tracking/debugging, Phaser, Angular, or NestJS skills before changing code.
2. Fetch remote state and inspect issue #759, research PR #764, Stage 0 PR #792, and this roadmap.
3. Check whether #792 is merged:
   - if open, update/rebase that branch on current `develop`, review its exact diff, run focused tests and the repository-required build, repair only task-owned failures, push it, and leave it for review—never merge automatically;
   - if merged, update local `develop` and start Stage 1 on a new focused branch.
4. Before Stage 1 edits, re-open the named symbols/call sites because paths may have moved. Confirm the defect still exists and write the failing regression first.
5. Keep an internal numbered acceptance checklist. Inspect contracts, implementations, registrations, transport/application consumers, saves/replays, documentation, and tests for every touched symbol.
6. Run the smallest applicable format/lint/type/test/build checks permitted by the issue lane. Repair task-caused failures and perform separate omission and final-closure audits.

### Stage 1 first slice

Use a branch such as `fix/759-ai-static-correctness-traces` from current `develop` after reconciling Stage 0. Keep it narrow:

1. Add a regression fixture proving the existing `IsEnemyPlayerWeak()` polarity is wrong and correct it with unambiguous naming if call-site semantics permit.
2. Audit the behavior-tree status of `GatherResources`, `StartUpgrade`, and `getMostNeededResource()`. No action may report success when it has no effect. Prefer explicit failure/unsupported status plus trace over a speculative large implementation in this PR.
3. Define initial `AiReasonCode` and bounded/versioned decision trace envelope in the gameplay library; avoid Phaser references and `any`.
4. Add deterministic serialization/order tests for the new trace values. Do not yet rewrite every manager or add tactical behavior.
5. Update this roadmap only if implementation reveals a materially wrong assumption; record evidence and keep the stage acceptance intact.

### High-value symbols to inspect first

- `PlayerAiController`, `PlayerAiControllerAgent`, `PlayerAiControllerMdsl`
- `PlayerAiBlackboard`, `WorldStateSnapshotManager`, `TargetingManager`
- `BasePlanner`, `MapAnalyzer`, `ScoutingManager`, `CombatMicroManager`
- `EconomyManager`, `LogisticsManager`, `RepairManager`, `TechProgressManager`, `ForceMaintenanceManager`
- `GameCommand`, `CommandBusService`, `dispatchAiOrder`, command queue/application and server validators
- `AIBehaviorTreeStateData`, save/load AI controller state
- `ProbableWaffleAiDifficulty`, lobby player definition, `DifficultyModifiers`
- `StateHashService`, `GameModeConditionChecker`, `ScoreTracker`, `AiPlayerHandler`

### Invariants not to violate

- use simulation ticks, authoritative logical positions, and seeded RNG only;
- canonicalize before selection and finish every comparator with a stable unique key;
- never target a hidden actor by remembered live ID;
- never classify hostility from owner inequality alone;
- never add a strategic mutation that bypasses the command/application authority;
- never serialize live Phaser objects, promises, or wall-clock state;
- never mark a behavior-tree action successful unless its intended effect completed or was already satisfied;
- never tune from one playthrough or replace deterministic work quotas with time budgets;
- never copy GPL/mixed-license reference code into this repository;
- never auto-merge a PR.

### Copyable next-agent prompt

```text
Continue issue #759 using docs/ai/759-rts-ai-research-roadmap.md and PR #764. Do not repeat broad AI
research unless implementation invalidates a documented assumption. First inspect PR #792. If it is
still open, update/rebase fix/759-ai-stage-0-correctness onto current develop, verify its exact
planner tests and required build, repair only task-owned failures, push, and leave it unmerged. If it
is already merged, branch from current develop and implement Stage 1 only: regression-test/fix
IsEnemyPlayerWeak polarity; make GatherResources, StartUpgrade, and getMostNeededResource stop
silently reporting success/no-op; add versioned bounded typed AI reason/trace contracts plus stable
serialization tests. Preserve simulation-tick determinism, current comments, and shared command
authority. Inspect all call sites/persistence/tests, use the required repository skills, run permitted
focused verification, perform omission and closure audits, push a focused branch, and open/update a
draft PR. Never merge automatically.
```

## Omission audit for this roadmap

- [x] Issue milestone requirements are represented: basic production/attacks, AI surrender, score screen, anti-building/block exploit resilience, and general playable stability.
- [x] Current contracts, implementations, registrations/consumers, configuration/UI, persistence, replay/hash, lifecycle, and tests are mapped.
- [x] Fair observation includes team/diplomacy, not only fog of war.
- [x] Difficulty, strategy archetype, and optional rules bonuses are separated.
- [x] Economy, supply, production, tech, bases, expansion, scouting, memory, threats, squads, tactics, anti-blocking recovery, and concession all have staged acceptance criteria.
- [x] Command-only mutation includes construction, repair/logistics, combat/scouting, and concession.
- [x] Save/load, replay, state hash reuse, host ownership/migration, performance budgets, and first-divergence diagnostics are included.
- [x] Pure fixtures, runtime scenarios, batch evaluation, manual playtest, metrics, and baseline policy are included.
- [x] Open Stage 0 work is acknowledged so the next agent will not duplicate it.
- [x] External source/licensing boundaries and deferred ML/search conditions are recorded.

## Final closure audit for the research task

- [x] The roadmap has a measurable classic-RTS target instead of a generic “smarter AI” goal.
- [x] Architecture recommendations follow confirmed repository seams and correct the earlier state-hash assumption.
- [x] Stages form dependency-aware, reviewable increments with user-visible release gates.
- [x] Product defaults unblock foundation work while isolating later decisions.
- [x] The cold-start section identifies branch/PR state, first actions, first slice, symbols, invariants, and a copyable prompt.
- [x] No runtime implementation or copied third-party code is included in this research PR.
