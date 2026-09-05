# #759 RTS AI improvement research and implementation roadmap

## Document status

**Implementation entry point:** [agent-ready runbook and stage packets](759-skirmish-ai/00-start-here.md). This file retains research evidence and design rationale. The runbook owns the latest execution policy; the [scenario catalog](759-skirmish-ai/08-deterministic-scenarios.md) incorporates the user's deterministic test requirements. Documentation readiness is not runtime completion.

**Hardening revision:** the user's later approval supersedes the earlier all-checks-at-the-end policy. Run focused stage checks and integrated core-loop smoke during implementation; retain extensive release validation at Stage 15. [H1–H9](759-skirmish-ai/09-progress-and-hardening.md) and [fault/continuous-match gates](759-skirmish-ai/10-integration-and-adversarial-tests.md) strengthen all older acceptance wording. In particular, an explained blocker is not progress, an expansion is not an attack, and a pending command is not safe to retry under a new identity.

- **Issue:** [#759 — Further improve AI](https://github.com/JernejHabjan/fuzzy-waddle/issues/759)
- **Research PR:** [#764 — docs: add RTS AI improvement roadmap](https://github.com/JernejHabjan/fuzzy-waddle/pull/764)
- **Implementation dependency:** [#792 — fix(ai): make Stage 0 planner selection deterministic](https://github.com/JernejHabjan/fuzzy-waddle/pull/792)
- **Target mode:** skirmish first; reuse the same contracts for campaign where the information policy permits it.
- **Target experience:** a readable, fair, resilient casual/intermediate opponent that completes a classic RTS loop: establish an economy, avoid supply blocks, build a faction-valid multi-domain army, scout, move forces across land/water/air access boundaries, fortify, defend, pressure, expand, recover from disruption, and conclude the match.
- **Runtime technology:** deterministic, authored rules and utility scoring. Runtime ML/LLM inference and unbounded search are out of scope.
- **Last research pass:** 2026-09-04 against `research/759-rts-ai-roadmap`, current `develop`, the supplied reference list, the issue milestone, and the open Stage 0 PR.
- **Component coverage audit:** 2026-09-05 on research-branch commit `d29d29c6`; evidence below describes this checkout. Recheck changed runtime contracts against current `develop` before implementing each slice.

### Research checklist

- [x] Inspect the controller, behavior tree, managers, blackboard, command path, deterministic clock, RNG, replay/save support, state hashing, match lifecycle, difficulty selection, and focused tests.
- [x] Compare the roadmap with the `Skirmish against AI` milestone acceptance criteria.
- [x] Review suitable RTS reference architectures and record licensing boundaries.
- [x] Define the classic-RTS behavior contract, target architecture, implementation sequence, deterministic evaluation harness, metrics, and release gates.
- [x] Reconcile this plan with the already-open Stage 0 implementation PR.
- [x] Audit registered prefab capabilities, runtime components/systems, pawn behavior, shared queues/orders, ownership, victory conditions, and persistence for additional AI responsibilities.
- [ ] Capture `baseline-v1` numbers after the fixture and batch harness exists.
- [x] Split the research into implementation-ready stage packets, model guidance, debug requirements and deterministic strategic scenarios.
- [ ] Implement Stages 0–14 sequentially on the integration branch, then complete Stage 15 validation/repair/closure.

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
6. **Legible tactics.** Units focus vulnerable or dangerous targets without extreme overkill, ranged units preserve distance when practical, damaged valuable units disengage or receive useful healing, spells support squad objectives, and units avoid observed harmful zones. Defenders respond to threats before the main army resumes its plan.
7. **Resilience.** A lost worker, blocked building location, destroyed production structure, depleted resource, failed path, proxy building, or temporary supply block triggers a bounded recovery path instead of permanent inactivity or command spam.
8. **Multi-domain movement and warfare.** The AI distinguishes ground, water, air, elevated, and future amphibious access. It does not order ground armies toward unreachable islands. It can create a persistent water or air transport operation, choose safe boarding/landing points, escort cargo, contest air/water threats, and use only units or weapons capable of reaching and damaging a target.
9. **Purposeful fortifications.** When the map, faction, strategy, and threat justify the cost, the AI builds connected wall lines with towers at valuable coverage points, stairs on the protected side, accessible wall-top defenders, and deliberate openings reserved for future gates. It does not surround itself blindly or seal its own economy and army inside.
10. **A complete match.** The AI wins through the normal victory rules and deterministically concedes only after a sustained unrecoverable position. Victory, defeat, or concession reaches the existing score screen with a valid final score.
11. **Readable difficulty.** Easy, normal, and hard differ in reaction delay, planning breadth, intentional error, risk, and tactical repertoire. Strategy personality is separate from difficulty. Any rules bonus is explicit in the lobby and result data.
12. **Fair and reproducible play.** The same seed and command stream produce the same decisions and state checkpoints. AI never bypasses shared validation, never acts on hidden IDs, and never uses render-frame timing as game time.

### Initial quality target

The first release target is not expert or tournament play. It is a normal-difficulty opponent that:

- completes a faction-valid opening on every supported skirmish faction/map pairing;
- produces workers and army continuously unless a trace gives a valid blocking reason;
- establishes useful income and launches a purposeful offensive mission by 10 simulated minutes in viable standard fixtures, with independent objective effect and continuing pressure in later viable windows; an expansion alone is not sufficient;
- responds to an observed base threat within its documented decision delay;
- creates a connected, traversable defensive line in fortification fixtures without blocking required ground access;
- recognizes ground-disconnected objectives and either completes a legal transport/air/naval plan or selects a reachable alternative with an explained reason;
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
- a Stronghold-scale castle/city simulation or optimal full-map wall solver in the initial release;
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
- `Wall`, `WatchTower`, and `Stairs` already provide the core fortification pieces. Walls are drag-placeable; walls and towers expose elevated navigation; stairs connect ground to wall height; `StructureTopologyService` refreshes adjacent structure topology; and the height-navigation graph already tests wall/tower connectivity. The AI should plan against these capabilities instead of recreating movement rules.
- `MovementTerrainType` already distinguishes Ground, Water, Air, and future Amphibious traversal. `NavigationService` owns separate ground/water queries and shore helpers; flying actors bypass ground pathfinding; `ContainerComponent`/`ContainableComponent` support capacity and boarding; `CommonBoat` is a water transport; `VikingBoat` is a naval combat unit; and attacks expose `canTargetAir`. These are reusable runtime capabilities, but they are not yet a strategic route/transport/combat model.

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
23. **Fortifications have mechanics but no strategic planner.** Workers can construct walls, watch towers, and stairs, and units can traverse connected elevated structures, but AI planning treats buildings as isolated candidates. It has no wall-line objective, protected-region model, tower coverage score, stair/access requirement, construction order, wall-top defender assignment, breach recovery, or future gate slot.
24. **The strategic AI is effectively ground-only.** It has no access-region graph, naval/air force roles, transport operation, cargo/seat reservation, island expansion, shore/landing-site scoring, escort/interception, or domain-aware objective feasibility. Current production merely notices visible flight and asks for “ranged” infantry, which does not prove the selected weapon has `canTargetAir`. Existing pawn AI can coordinate boat boarding at a shore, but strategic AI does not own the full passenger/transport/destination lifecycle, and unloading is not represented as a shared strategic command. No current flying prefab combines flight and container capability, so air transport is a supported future capability rather than shipped behavior.

25. **Housing requests select the wrong capability.** In the audited checkout, `SupplyPlanner.getHousingObjectName()` returns `WorkMill`, which is a wood drop-off without housing. This can leave the supply deficit unresolved despite repeated construction. Stage 1 resolves actual housing (`Olival`/`Emberstone`), and Stage 7 adds demand/commitment accounting so legitimate capacity is built once per need. This is a confirmed cause to address, not proof that every repeated-building report has the same cause.
26. **The current debug UI is too shallow.** The existing AI controller panel/label provides limited categories and truncated lines; it cannot show the full strategic plan, demand lifecycle, alternatives, routes and failure ownership. The debug packet specifies read-only projections from committed brain state instead of independent live strategy calculations.

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
| Walls, towers, stairs, and elevated topology | `libs/games/probable-waffle/phaser/src/lib/prefabs/buildings/tivara/`, `StructureTopologyService`, `HeightNavigationGraphBuilder`, and movement/navigation systems |
| Ground/water/air access and transport | `MovementTerrainType`, `NavigationService`, `WaterNavigationHelper`, `FlyingComponent`, `ContainerComponent`, `ContainableComponent`, boat definitions, pawn `EnterContainer` behavior, production spawn/rally logic, and attack capability definitions |

### Additional component and system coverage audit

This audit follows `ComponentsDefinition`/`SystemsDefinition`, `pwActorDefinitions`, `actor-data.ts` registration, executable component/system methods, pawn behavior, and their command/save consumers. A definition, scene prop, enum, or comment alone is insufficient evidence that a mechanic works. The stages in this table are mandatory additions to the existing stages, with detailed behavior and acceptance below.

| Existing area and evidence | What AI must consider | Owning stages / boundary |
| --- | --- | --- |
| `SpellComponent`, `SpellCastingSystem`, `spellDefinitions`, pawn `CastAutocastSpell`, and `AoeZoneManager` | Researched spell availability, cooldowns, effect polarity, area coverage, friendly targeting, cast range, persistent hazards, summons, and coordinated casts. Existing autocast targets the closest enemy for ground spells; it does not coordinate area value or healing. `SpellTargetType.Actor` is used by Healing Light but has no matching autocast switch case. | 3–5 for execution/observation correctness; 13–14 for coordinated use and research value. Preserve useful pawn autocast with explicit ownership. |
| `StatusEffectComponent`, `HealthComponent`, `HealingComponent`, worker healing, and Healing Totem | Stun/freeze/slow, damage/healing over time, current health/armour, regeneration, triage, repair capacity, and recovery time affect effective strength and whether an order can progress. | 4, 7, 12–14. Observe active runtime effects; do not invent mana, resistances, dispel, or immunity mechanics from familiar RTS games. |
| `AttackData`, `AttackComponent`, `high-ground.helper.ts`, weapon/projectile definitions, and combat runtime | Minimum range, attack windup/fire/hit timing, projectile arrival, melee area shape, flight/elevation, and per-weapon high-ground range bonuses affect position and target value. `HealthComponent.takeDamage` currently consumes a separate armour pool before health; damage-type labels alone do not establish a Warcraft-style counter multiplier table. | 4–5, 11, 13–14. Reuse actual combat rules and prove evaluator agreement with runtime. |
| `GatherData`, `ResourceSourceComponent`, `ResourceDrainComponent`, Granary/WorkMill/MiningCamp, and pawn gather/return behavior | Carry capacity, compatible resource type, gatherer slots, travel/deposit latency, drop-off occupancy, remaining/locked resources, and destruction of a return destination determine income. Despite its name and the misleading registry comment, `ResourceDrainComponent` deposits gathered resources into the player's economy; it is not upkeep consumption. | 4, 7, 10, 12. Separate economy deposit service slots from transport cargo. |
| Field `resourceSource`/`tendable`, `TendableComponent`, and pawn tending behavior | A Field requires a Granary, a tender to grow in the current definition, harvesting, return trips, and repeated regrowth. It is walkable, has capped tender/gatherer slots, and is not immediately spendable food when constructed. | 4–5, 7, 10, 12. Use runtime growth calculation: current code applies one boost when any tender exists, despite a definition comment suggesting a per-tender multiplier. |
| `QueueComponent`, `ProductionComponent`, `ResearchComponent`, `PaymentType`, and cancellation commands | Production and research share queue ownership; parallel queues, waiting items, ongoing payments, actual refunds, and prerequisite loss affect reservations and time-to-ready. | 3–7, 14. A producer is not simultaneously free for research and production in the same queue slot. |
| `LevelComponent`, `applyLevelOverrides`, `TechTreeService`, `upgradeActorToLevel`, and research completion | Research can upgrade existing actors and future production, changing attacks, health, vision, and container capacity. Actor aliases and faction prerequisites must resolve through definitions. | 4, 7–8, 14. Distinguish player researched level from an individual actor's applied runtime level; no XP/hero-item system is implied. |
| `ConstructionSiteDefinition`, `BuilderComponent`, and construction/repair execution | Automatic construction, builder/repairer caps, consumed-builder rules, initial vulnerability, completion time, and refunds change how much labor and protection a plan requires. | 3, 7, 10–12. In particular, current Field construction needs no assigned builder; a generic builder requirement would stall it. |
| `ConvertibleComponent`, `OwnerComponent`, editor conversion settings, and actor index | An unowned convertible actor can become owned by proximity. Scout/claim utility, contested approach risk, and ownership changes matter; old targets and assignments must be invalidated on conversion. | 4–5, 9–10. This is proximity claiming of eligible unowned actors, not a general enemy mind-control or building-capture spell. |
| Team definitions, vision queries, healing/spell effect filters, and `GameModeConditionChecker` | Legal ally assistance, contested fronts, existing team information policy, and actual victory/loss settings influence objectives and concessions. The checker implements elimination, time, kills, resource stockpile, actor-count/type, and maximum-time tie conditions. | 3–5, 9, 13. Read exact configured evaluation/precedence; do not assume every match is elimination or that teammates automatically share vision/orders. |
| `ContainerComponent` on economy structures versus mobile boats; wall/tower elevated navigation | A container can service deposits, while a mobile transport carries squads. Walking on a tower is distinct from being contained inside it; the inspected watch-tower container declaration is commented out. | 4, 7–8, 11. Infer roles from combinations of executable capabilities, not the existence of `container` alone. |
| `SceneLightingService`, scenery/animal/mob definitions, `PlacementRestrictionComponent`, and campaign registries | Audit exclusions explicitly: day/night is presently lighting; an animal/monster/ruin/catapult sprite does not by itself imply food, loot, creep rewards, siege, or a capturable objective. `PlacementRestrictionComponent.canPlace` is a TODO returning false and the inspected tree has no call-site registration. Campaign-only rules need a mode adapter. | Capability audit in 2–4; unsupported mechanics remain explicit limitations. Do not introduce stealth/detection, trade, upkeep, heroes/items, weather penalties, or neutral-camp rewards without executable evidence. |

#### Additional correctness dependencies discovered during the audit

- **Spell effects have authority seams beyond strategic commands.** Projectile spells call their gameplay impact from Phaser tween completion; target selection uses render bounds and owner equality for ally filtering. Route casting/autocast settings through validated shared semantics, apply impacts on simulation ticks using logical positions and team policy, and treat tweens as presentation. A tick-driven brain alone does not make these effects deterministic or team-safe.
- **Persistence coverage must be expanded by mechanic.** Spells/status effects and area zones have existing save paths, but the inspected state hash's combat slice covers attack/heal/builder/gather cooldowns, not complete spell/status/zone state. `TendableComponent` has growth/tender state without a demonstrated serialization contract. In-flight spell effects, summon expiry, deposit work, and ownership transitions also require save-continuation audits. Reuse and extend existing authorities; do not declare persistence complete because a top-level save field exists.
- **Conversion tie resolution needs a regression.** `ConvertibleComponent.checkProximity` takes the first qualifying indexed player/actor and returns early on an inactive actor. Simultaneous claims therefore need canonical arbitration and inactive-actor handling before AI claims depend on it. Keep the shared simulation as the owner of conversion; AI only issues legal approach orders and observes the result.

These are research findings and required implementation dependencies, not fixes delivered by this PR. Keep the initial Stage 1 slice narrow; attach focused regressions to the owning later stages below.

## Research findings and boundaries

### Primary evidence

| Source | Useful transferable evidence | Decision / boundary |
| --- | --- | --- |
| [Blizzard s2client-api](https://github.com/Blizzard/s2client-api) and [SC2 protocol](https://github.com/Blizzard/s2client-proto/blob/master/s2clientprotocol/sc2api.proto) | A bot receives explicit observations and issues actions through a control protocol. SC2 also separates difficulty from AI build archetype and names cheat difficulties explicitly. | Use the observation/action seam and separate profile/personality model. Do not reproduce proprietary game behavior. Both repositories are reference interfaces, not dependencies. |
| [OpenRA AI configuration](https://github.com/OpenRA/OpenRA/blob/bleed/mods/ra/rules/ai.yaml) and [bot modules](https://github.com/OpenRA/OpenRA/tree/bleed/OpenRA.Mods.Common/Traits/BotModules) | Production bots separate base building, harvesting, unit production, repair, expansion, and squads. Profiles tune delays, composition fractions, construction limits, squad sizes, target types, and expansion behavior. | GPL-3.0. Reuse responsibility and configuration ideas only; copy no code or YAML. |
| [0 A.D. Petra BaseManager](https://docs.wildfiregames.com/javascript/petra/PETRA.BaseManager.html), [BasesManager](https://docs.wildfiregames.com/javascript/petra/basesManager.js.html), [AttackManager](https://docs.wildfiregames.com/javascript/petra/PETRA.AttackManager.html), and [construction plan](https://docs.wildfiregames.com/javascript/petra/queueplanBuilding.js.html) | Multiple bases have explicit state, territory/access regions, resource levels, serialization, recovery, and staged construction plans. Attack plans own objectives; construction revalidates prerequisites/builders/sites and delays repeatedly unbuildable plans. | 0 A.D. code is GPL-licensed/mixed by file. Adapt concepts only. The strongest lesson is to make base, attack, and construction lifecycle explicit and serializable. |
| [0 A.D. Petra NavalManager](https://docs.wildfiregames.com/javascript/petra/navalManager.js.html) and [TransportPlan](https://docs.wildfiregames.com/javascript/petra/transportPlan.js.html) | Land and sea access regions, shore landing-zone maps, separate transport/war/fishing fleets, persistent boarding/sailing phases, cargo assignment, destination validation, escort risk, retry/split behavior, and serialization show that cross-water movement must be a plan—not an isolated board command. | GPL-licensed reference. Reuse only the domain separation, lifecycle, and evaluation questions; design an independent TypeScript contract around existing Fuzzy Waddle containers and commands. |
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
- The map summary contains stable ground, water, elevated, and air access regions plus legal transfer edges such as shore rendezvous, bridge/crossing, stairs, and container transport. Air reachability still considers map bounds, valid landing/unload space, and threat; it is not treated as cost-free teleportation.
- Actor snapshots project movement domain, current access region, container/cargo capacity and occupancy, transport eligibility, weapons' target-domain capability (including `canTargetAir`), and legal producer/spawn domain from definitions.
- Extend permitted snapshots with applied level/capability version, owned shared queue/payment state, carried resources and deposit service occupancy, growth/tender/harvest state, health/armour, usable spells and cooldowns, active status/zone effects, temporary-object expiry, observed convertible opportunities, and configured match objectives. Enemy private cooldown/research/queue details remain unavailable unless the human information policy exposes them; unknown values stay unknown.
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
- `establish_access_route`
- `secure_transport_capacity`
- `control_air`
- `control_water`
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
  | ConstructFortificationPieceIntent
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
  | AssignRampartDefenderIntent
  | RepairFortificationIntent
  | OperateGateIntent
  | EstablishTransportRouteIntent
  | BoardTransportIntent
  | MoveTransportIntent
  | UnloadTransportIntent
  | EscortTransportIntent
  | CastSpellIntent
  | SetAutocastIntent
  | HealIntent
  | AssignTenderIntent
  | ClaimNeutralApproachIntent
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
3. allocate exclusive actor, producer-slot, builder, tile/footprint, resource, cargo-seat, rendezvous/landing-slot, and route claims;
4. enforce per-profile work and command budgets;
5. retain compatible reservations across steps until completed, invalidated, or timed out;
6. emit accepted/rejected records with stable reason codes;
7. produce one ordered execution list.

Required rejection examples: `stale_observation`, `not_visible`, `not_hostile`, `actor_claimed`, `producer_busy`, `insufficient_unreserved_resources`, `prerequisite_missing`, `site_blocked`, `path_unavailable`, `movement_domain_mismatch`, `transport_capacity_unavailable`, `rendezvous_unreachable`, `landing_zone_unsafe`, `weapon_cannot_target_domain`, `budget_exhausted`, `objective_obsolete`, and `command_validation_failed`.

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

Connected fortification construction may be represented as an ordered group of ordinary construction commands with one shared plan ID; it does not need an unsafe “spawn wall line” shortcut. Future gate operation, if it changes passability, must be a first-class command whose application rebuilds or invalidates the same navigation/topology authority used by movement.

`EnterContainer` supplies part of the current pawn-level boarding path, but strategic transport also needs authoritative, replayable unload/disembark semantics and outcomes. Loading, moving, and unloading must validate ownership, capacity, cargo eligibility, movement domain, shore/landing accessibility, and destination occupancy. Air transports should use the same capability-driven plan/commands without inheriting boat-only shore assumptions.

After dispatch, a typed `AiCommandOutcome` reports accepted, rejected, applied, superseded, failed, or timed out. Managers use outcomes to recover; they do not infer success merely because a command was emitted.

### 7. Brain state and scheduler

Create a versioned, serializable `AiBrainStateV1` containing at least:

- player/profile/archetype/opening identifiers and opening phase;
- knowledge and scouting coverage;
- base records and expansion candidates;
- fortification plans, topology nodes, deliberate openings/gate slots, breaches, and defender posts;
- access-region graph version, transport plans, cargo/seat claims, rendezvous and landing reservations, fleet/air-wing assignments, and route failure state;
- capability catalog version, crop/deposit service plans, support/ability claims and autocast policy, observed hazard summaries, neutral-claim and allied-support objectives, and mode-specific goal state;
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

### Capability coverage and runtime truth

Create a versioned `AiCapabilityCatalogV1` projection from existing registries, tech-tree resolution, component registration, and current runtime state. Each gameplay-relevant capability must map to an observation field, proposing manager, execution authority, outcome, persistence projection, and regression fixture, or an explicit unsupported/not-applicable reason. This is a checked projection of the game, not a second balance database. Compare registered capabilities with this coverage map whenever a prefab, level override, command, or component changes.

Resolve aliases deterministically and distinguish faction-producible units from scenario-only actors. Require a working component **and** its execution system before advertising a spell, production, movement, or interaction capability. Invalidate derived capabilities on research completion, actor level/owner change, construction completion/destruction, or relevant topology change. Capabilities observed on enemy actors must come from permitted information, not private research/queue state.

The transport capability predicate must require a mobile, cargo-eligible container with valid load/unload behavior. Economy buildings with containers are deposit services; their workers and capacity belong to economic operations. Model physical seat ownership separately from the parent operation so economy and transport cannot allocate the same contained actor. An elevated defender standing on a wall is not garrisoned cargo. Add garrison combat bonuses only if a runtime rule later supplies them.

### Economy and worker allocation

- Represent resource demand over a short deterministic horizon: next opening checkpoint, queued production, required supply, repair reserve, and desired expansion.
- Allocate workers by marginal value using resource need, known gather capacity/travel bucket, safety, and saturation. Exact pathfinding is not required for every worker; use cached region or distance bands and validate only selected orders.
- Preserve a minimum worker-production goal unless survival or supply recovery wins arbitration.
- Detect idle, dead-target, depleted-patch, unreachable, and unsafe gather states from command outcomes/observation. Reassign with exponential tick-based backoff to avoid spam.
- Reserve builders explicitly and return them to economy after completion/failure.
- Track income, idle-worker ticks, reassignment count, travel bucket, and gathering failures per resource.

#### Deposits, renewable food, and worker service roles

- Score expected **delivered** income from gather amount/cooldown, carry capacity, source gatherer cap, distance to a compatible drop-off, deposit delay/capacity, safety, and required return behavior. Sources that credit directly and sources that require returning are distinct. Carried or growing resources are forecast income, not spendable stockpile.
- Reserve source and deposit service capacity without monopolizing a whole building. Re-evaluate WorkMill/MiningCamp/Granary placement by saved worker travel and throughput; one additional drop-off is justified by benefit and saturation, not a fixed repeated-building request. Losing a drop-off reroutes loaded workers or creates one replacement plan.
- Give renewable food a persistent `grow -> harvest -> deliver -> regrow` plan, linked to Field, Granary, tender, gatherer, and service claims. Allocate only the working tender/gatherer capacity, anticipate growth delay, and bridge short-term food demand with legally available sources. Do not rebuild a depleted renewable Field or count its locked resources as available food.
- Arbitrate each worker's primary task across gathering, tending, depositing, building, repairing/healing, scouting, and transport. Temporary pawn sub-actions inherit that owner. Interruptions must safely release/transfer claims; finished support work returns workers to a valid economic assignment.
- Construction scheduling derives labor from the actual site: automatic progress, maximum builders/repairers, builder consumption, and current completion/health. Allocate scarce workers where their marginal completion benefit is useful. Repair and construction compete with harvesting and military spending explicitly.

### Supply, production, and technology

Multiple buildings or units of one type are allowed and often required. Suppress duplicate fulfillment of one commitment, not useful repeated types. Forecast throughput and construction lead time, local resource-service travel/congestion, production resilience and desired army composition justify additional capacity; existing/in-flight assets satisfy that demand once. See the [concrete macro algorithm](759-skirmish-ai/03-macro-and-access.md).

- Forecast `used + queued demand` against `capacity + housing completing within horizon`.
- Begin housing before expected block and escalate `restore_supply` only when the forecast or actual block crosses a threshold. Avoid repeated emergency housing when one valid structure is underway.
- Build and saturate a producer set. Choose the next unit from army role deficits, observed enemy capability, plan phase, affordability time, and producer opportunity cost.
- Keep at least a configurable defense floor before committing all production to a tech transition.
- Research only when prerequisites exist, a plan/counter supplies a reason, production survival is protected, and the opportunity cost fits the profile.
- On producer/prerequisite loss, invalidate affected reservations, create a restore intent, and fall back to a legal unit/plan rather than reporting success.

Shared queue and research rules:

- Forecast one timeline per actual queue, including research occupying the same queue, waiting work, parallel queues, payments still due, and population demand. Derive completion estimates from the existing payment/progress rules; a queued item is not completed capacity or combat strength.
- Count existing, accepted/reserved, queued, and under-construction assets against demand exactly once. Expire abandoned plans and reconcile accepted-but-not-yet-observed commands before proposing replacements. This rule applies to farms, drop-offs, research, healers, transports, and military producers as well as housing/walls.
- Use existing production/research cancellation commands only when the measured survival or strategic benefit exceeds the actual lost progress/refund cost. Credit a refund only after authoritative application; avoid cancel/requeue oscillation with stable item IDs and cooldowns.
- Score research by its benefit to surviving actors, expected reinforcements, vision, transport capacity, and useful spell access versus its queue/resource opportunity cost. Recompute after completion using both applied runtime capabilities and player tech state. Never grant upgrade effects from the AI's prediction.
- Reconcile newly created/replaced/upgraded/captured actors into assignments, supply, role deficits, queues, and transport capacity. Already full transports retain legal manifests if capacity changes; invalid changes trigger an explicit shared-rule outcome, not silent passenger loss.

### Support, spells, effects, and combat geometry

Create a bounded tactical ability proposer integrated with squad arbitration. It consumes permitted caster/target/effect observations and proposes `CastSpellIntent`, `SetAutocastIntent`, `HealIntent`, or a support-position/movement intent. Existing research and actor-action capabilities should be reused; add explicit shared spell payloads/settings only where the current command vocabulary is insufficient. Prove actor-target and ground-target coordinate semantics end to end.

- Give each caster one cast owner per decision window. Coordinated mode reserves a spell/cooldown and target/effect window; pawn autocast operates under a documented fallback policy and cannot spend the same cooldown concurrently. Apply equivalent policy semantics to human commands and replay.
- Choose targets from effect flags and runtime target rules as well as `SpellTargetType`. A ground-targeted healing zone still needs damaged allies. Evaluate useful healing capped by missing health, area damage/control over legal visible targets, existing effects, travel/impact time, cast opportunity cost, and safe caster positioning.
- Coordinate heals and crowd control with expiring reservations. Respect the actual status rule that reapplying the same effect type refreshes it; do not assume repeated casts stack damage/control value. Reserve emergency support and avoid redundant full-health healing or unnecessary control refreshes.
- Treat stuns/freeze as temporary inability, and slows as reduced travel speed, when estimating combat strength, rendezvous deadlines, retreat, or no-progress recovery. Avoid retrying an impossible movement action every tick while the unit is disabled. Re-evaluate after effect expiry.
- Observe only permitted persistent zones and their ally/enemy eligibility, remaining lifetime, and damage/heal effects. Penalize harmful zones on rally/retreat/landing candidates and spread squads against observed area threats, using bounded candidate sampling. Beneficial zones can justify a safe recovery point; risk and visibility still apply.
- Support units and worker repair/heal teams need protection, reachable patients, capped assignments, and a release-to-duty condition. Compare field recovery with retreat/replacement; do not pull every worker from food production to repair a low-value asset.
- Summoned objects such as Healing Totem contribute support while their effects and remaining lifetime justify it. They are not permanent production, housing, expansion anchors, or a guaranteed rebuild path. Their destruction/expiry invalidates support reservations and objectives through normal outcomes.
- Evaluate actual weapon choices, minimum/maximum range, high-ground bonus, attack cooldown/windup, projectile arrival, and melee area geometry. Preserve firing opportunities where sensible, avoid interrupting every windup with move orders, and release predicted damage claims on miss/failure/target loss. Counter values must reflect actual armour-pool and damage application rules; use no invented damage-type matrix.
- Separate authoritative spell impact/effect/summon lifetime from visual animation. Author and run focused regressions in Stages 3–5, then execute the full matrix in Stage 15 to prove equal results across rendering rates, pause/speed changes, save/replay, and teammate targets before claiming the strategic ability proposer release-ready.

### Ownership, neutral opportunities, allies, and match objectives

- Expose observed proximity-convertible neutral opportunities separately from hostiles and harmless scenery. Score acquisition value, approach risk, competing visible claimants, and distraction from survival/economy. Move one eligible claimant through normal orders, await the authoritative owner transition, then assign the new asset. Do not issue a fictitious capture spell or assume enemy actors can be converted.
- Ownership changes invalidate old attack/heal/repair targets, reservations, resource routes, squad membership, transport manifests, and contribution estimates. Revalidate at command application as well as proposal. An ally becoming hostile or a claimed neutral becoming friendly must not receive a stale effect based on old owner equality.
- Help threatened teammates using a bounded allied-defense objective and safe reinforcement/escort roles when ownership, diplomacy, and information policy permit. Keep a local defense/economy floor. Allies retain command authority over their units; cross-AI cooperation uses permitted requests/claims, not pooled hidden observations or stealing each other's workers.
- Prioritize surviving/winning under the configured game mode: protect the last required building, preserve required actors, accumulate a resource stockpile when that is the objective, pursue kills when legal, or survive until the configured time. A stockpile objective can deliberately retain resources that generic macro would spend. Match condition precedence and combination semantics come from `GameModeConditionChecker`, including its time/tie order.
- Feed the same objective/recoverability projection into strategy and concession. A low army count does not imply hopelessness when a timed or stockpile win is feasible; a strong fleet does not prevent a configured building-elimination loss. Campaign economy modes, scripted restrictions, and objectives require the existing explicit campaign policy; they must not leak into ordinary skirmish.
- Only treat visible wildlife/mobs as food, hazards, hostile combat targets, or claim opportunities when their runtime components and policy establish that role. The audit does not establish neutral-camp rewards, loot, hero XP, shops, or general scenery harvesting.

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

### Access domains, transports, air power, and naval power

Strategic reachability must answer “how can this force get there?” before target scoring. Euclidean distance or one ground path is insufficient when the map contains islands, separated shores, elevated structures, flying units, ships, or transports.

#### Multi-domain access graph

`MapAnalyzer` should derive a stable graph from existing navigation authorities:

- **Ground regions:** mutually reachable ground tiles, including bridges/crossings when usable.
- **Water regions:** mutually reachable water tiles with viable shore rendezvous/landing boundaries.
- **Elevated regions:** connected wall/tower/stair surfaces linked to their ground access points.
- **Air region:** bounded map airspace for actors with flight/air capability, annotated with legal destination/unload tiles and observed anti-air threat rather than obstacles alone.
- **Future amphibious edges:** supported by the contract but enabled only when an actor definition actually exposes working amphibious movement.
- **Transfer edges:** ground-to-water boarding at a compatible shore pair, water-to-ground unloading, ground-to-air loading/unloading for a flying container, stairs between ground/elevated regions, and any scenario-authored portals/crossings explicitly permitted by policy.

Each actor and objective projects a current access node plus mobility/capability set. A pure route query returns one or more feasible route plans such as `ground`, `water_transport`, `air_transport`, `air_direct`, `naval_direct`, or `unreachable`, along with required assets, transfer points, risk, capacity, and deterministic cost bands. It must not issue commands or run unbounded pathfinding.

Rules:

- Ground squads may receive a direct objective only when source and destination ground access regions connect.
- Flying combat units can cross terrain but still need a legal map-bounded destination, valid combat target, safe retreat/rally point, and sufficient survivability against observed anti-air.
- Water units remain in their water region and need reachable water rally/attack points; they cannot be scored as ordinary ground reinforcements.
- A mixed task force coordinates domain-specific sub-squads. Do not put ground, naval, and air actors into one formation that assumes a shared path.
- When no route is feasible, reject the objective with `movement_domain_mismatch` or `transport_capacity_unavailable`; do not repeat an impossible move/attack order every AI step.

#### Persistent transport operations

Transport is a multi-actor transaction with explicit ownership and rollback:

```text
proposed -> reserving -> gathering passengers/transport/escort
         -> rendezvous -> boarding -> transit -> landing
         -> unloading -> regrouping -> objective handoff -> completed
         -> recovering/rerouting/cancelled/failed
```

`AiTransportPlanV1` should record plan ID, source/destination access regions, transport mode, passenger squad and stable order, transports, capacity/seat assignments, escorts, rendezvous points, landing/unload points, final objective, phase, deadlines/backoff, command outcomes, and recovery state.

- Choose passengers and transport capacity together. Never dispatch half an essential squad accidentally because remaining seats were double-booked.
- Reserve passengers so attack/defense managers cannot steal them during boarding, while allowing emergency threat arbitration to cancel the whole transport plan safely.
- For water transport, choose compatible water-side shore and adjacent ground rendezvous tiles reachable by both parties. Score room, route length, observed threat, naval control, congestion, and distance to the final ground objective.
- For an air container, use the same plan but choose a legal ground pickup/drop zone. The current repository has flying units and containers but no inspected flying-container prefab; keep this path capability-driven and fixture it with a test definition until such a unit ships.
- Begin transit only after the required passenger threshold boards or a documented partial-departure timeout wins. Record missing/dead/failed passengers and release their seat claims.
- Do not unload until the destination still has valid space and risk is acceptable for the profile. After unload, verify passengers occupy the intended ground region before handing them to an attack/expansion squad.
- If a transport dies, the destination becomes unsafe, boarding stalls, or the route closes, choose a bounded alternate shore/drop zone, split/reassign capacity, return surviving transports, or cancel. Never silently destroy or strand units to make plan state convenient.
- Save/load during every phase must restore exactly one owner for each transport, passenger, seat, rendezvous, and objective.

Transport objectives include island expansion (builder plus initial protection), reinforcement, evacuation, flanking assault, scouting insertion, and recovery of stranded units. The utility calculation includes transport production opportunity cost, cargo value-at-risk, escort requirement, extra travel time, and expected strategic value.

#### Air and naval production/combat

- Project unit roles from definitions/capabilities: movement domain, container capacity, attacks, range, damage/target type, `canTargetAir`, health/armour, vision, production requirements, and cost. Never equate “ranged” with “anti-air.”
- Maintain domain-specific force demands: ground army roles, anti-air coverage, air scout/harassment/air-control roles, water transport capacity, naval escort/combat roles, and shore-defense coverage.
- Only demand naval production when the map exposes a relevant reachable water region, valid spawn/producer path, and useful water objective. Only demand transport when a valuable destination is otherwise unreachable or the transport route clearly beats alternatives.
- Air units may scout, intercept, harass, reinforce, or directly attack an otherwise ground-inaccessible objective when their weapons can legally damage it. They must account for observed anti-air and retain a safe retreat region.
- Naval combat squads own water-region objectives: escort transports, secure a crossing/landing lane, intercept hostile transports, defend coast/producer assets, attack reachable naval targets, or provide shore fire only when weapon/range rules permit.
- Target selection filters by both reachability and weapon capability before utility. An actor unable to attack air cannot be assigned to intercept a flyer; a ground-only attacker cannot chase a ship across water; a transport without weapons cannot count as combat strength.
- Composition adaptation uses permitted observations: observed flyers raise actual `canTargetAir` demand; observed warships/transports and contested shores raise naval/shore-defense demand; absence/staleness decays the response with hysteresis.
- Rally, retreat, regroup, reinforcement, and repair locations are selected in the actor's domain. Fleet and air-wing strength are evaluated separately from ground strength, then combined only for a shared objective with explicit support relationships.

#### Interaction with bases and fortifications

- Expansion feasibility uses the access graph. An island base requires a complete transport route, builder seat, safe unload/build site, and ongoing reinforcement/evacuation plan before reserving the expansion cost.
- Base records track adjacent water regions, usable shores, air approach exposure, transport staging space, and domain-specific defense coverage.
- Walls redirect ground movement but do not stop air and generally do not control open water. Fortification scoring must preserve anti-air and naval/shore coverage where those threats exist.
- Towers contribute only the target-domain coverage their actual weapon exposes. A tower incapable of targeting air must not satisfy an anti-air defense requirement.
- Gate/opening and shore staging areas must not conflict: a fortification cannot reserve the only legal transport rendezvous, landing, or reinforcement route.

### Defensive layouts: walls, towers, stairs, and future gates

Fortification must be planned as one topology-aware defensive project, not as many unrelated requests to construct the cheapest defensive building. The current runtime already supplies most of the mechanical substrate: wall segments update their appearance and navigable connections from adjacent structures, watch towers connect at wall height, stairs expose ground-to-elevated access, and units can move across the resulting height-navigation graph.

Add a serializable plan that owns the whole layout:

```ts
type AiFortificationNodeRole = 'wall' | 'tower' | 'stairs' | 'gate-slot';

interface AiFortificationPlanV1 {
  readonly id: string;
  readonly baseId: string;
  readonly purpose: 'choke' | 'resource-screen' | 'base-front' | 'fallback-line';
  readonly protectedAssetIds: readonly string[];
  readonly interiorAccessRegion: string;
  readonly approachRegionIds: readonly string[];
  readonly nodes: readonly AiFortificationNodeV1[];
  readonly constructionOrder: readonly string[];
  readonly stoneBudget: number;
  readonly lifecycle: 'proposed' | 'reserved' | 'building' | 'operational' | 'breached' | 'rebuilding' | 'abandoned';
}
```

The planner should work in five high-level steps:

1. **Choose what to protect.** Start from a stable base record and identify the town center, production exits, worker/resource lanes, vulnerable approach regions, and retreat/rally areas. A wall is useful only if it protects valuable space without sacrificing the base's operation.
2. **Generate short defensive fronts.** Prefer a short line between terrain obstacles or across a high-traffic approach over a costly full ring. Candidate fronts come from chokepoints, navigation-region boundaries, threat arrival directions, and base/resource envelopes. Canonicalize candidates before scoring or seeded sampling.
3. **Lay out one connected graph.** Place wall nodes along the front; use towers at endpoints, corners, intersections, or high-coverage positions; put stairs on the protected side; and reserve an intentional opening as a `gate-slot`. Validate every footprint and adjacency against the same topology and height-navigation rules used by runtime movement.
4. **Validate both sides of the defense.** The plan must make hostile ground approach meaningfully longer or narrower while keeping a legal route from the base to resources, production exits, rally points, the stairs, the wall top, and the outside. Validate hypothetical occupancy of the entire plan, not only one segment at a time.
5. **Build incrementally and reassess.** Reserve a total budget and segment count, construct in an order that remains useful while incomplete, and stop when the threat disappears, the economy needs the resources, or the layout becomes invalid. Recompute affected connectivity after completion, destruction, capture, or a neighboring topology change.

Placement rules:

- A fortification plan has one stable ID and one active intent per node, preventing the “build the same wall/tower twenty times” failure.
- Existing, reserved, under-construction, completed, and recently failed nodes count toward the plan; managers cannot independently duplicate them.
- Use definition/registry capabilities such as constructability, footprint, navigable ports, defensive attack, vision, and drag placement. Do not hard-code one prefab name into the pure planner.
- Require at least one protected-side stair/access node for every wall-top connected component that receives defenders. Additional stairs may be justified by wall length, reinforcement time, or breach risk.
- Towers are scored by threat-lane coverage, vision, support from the wall line, distance from other towers, protected asset value, and reachable wall-top reinforcement. Avoid overlapping towers with little added coverage.
- Preserve a configurable minimum open/gated width for workers, army movement, construction access, and retreat. Until a real gate exists, the `gate-slot` remains an intentionally unbuilt gap that other construction plans reserve and cannot fill.
- Reserve enough space around a future gate for its footprint, approach tiles, opening arc/animation if needed, and inside/outside waiting areas. This avoids redesigning every old wall plan when gates ship.
- Cap total cost, wall length, towers, simultaneous builders, and path/topology queries by strategy/difficulty profile. Apply diminishing utility to additional segments so a turtle AI still builds an economy and army.
- Use terrain as part of the barrier. Do not pay for walls along already impassable edges unless a segment is needed to close a verified gap.

Wall-top defense:

- Create persistent `rampart` posts from reachable wall/tower navigation nodes and their firing/vision coverage. A post is an assignment location, not a live Phaser reference.
- Prefer suitable ranged units for posts while retaining a mobile ground reserve. Do not place the entire army on walls or use a unit that cannot legally reach the selected elevated component.
- A wall-defense squad assembles through protected-side stairs, spreads across distinct posts, concentrates near an observed approach, and can withdraw through a known stair route before it is cut off.
- Towers supply their own attack where defined; occupied wall/tower surfaces add unit fire and vision through normal combat rules rather than an AI-only bonus.
- Defender commands use the shared movement/attack command path. Elevation, range, line-of-sight, and target legality remain runtime authorities.

Future gate behavior:

- Introduce a gate as a structure capability/role that can satisfy an existing `gate-slot`; do not make the planner depend on a `Gate` prefab before one exists.
- Once gates are available, the plan can replace the deliberate gap with a gate only if friendly pathing and construction access remain valid.
- Gate open/close state must be an authoritative, replayable command. A basic policy opens for an approved friendly crossing when no immediate hostile crossing is possible and closes on nearby observed threat, while avoiding trapping a retreating friendly squad.
- Destroyed, captured, jammed, or unavailable gates become breaches and trigger the same defense/recovery lifecycle as a destroyed wall segment.

Repair and breach recovery:

- Prioritize repairs by whether the structure closes a critical route, supports an occupied elevated component, protects a high-value asset, or is likely to survive the repair attempt.
- A destroyed segment creates a typed breach incident. The AI may assign a mobile defense squad, evacuate exposed workers, withdraw wall-top units whose stair route is threatened, rebuild the node, or abandon the line if the position is no longer economical.
- Rebuilding reuses the plan/node identity and reservation state; it must not create an unbounded stream of new wall intents.

### Scouting and intelligence

- Derive regions/sectors from map bounds and path-access components, not the world origin.
- Track coverage separately for ground, shore/water, air-accessible, and elevated observation routes; choose a scout whose movement domain can legally complete the route.
- Initialize deterministic enemy-start hypotheses from scenario start locations and eliminate them only through permitted exploration.
- Score frontiers using coverage age, information value, route risk, distance band, strategic plan, and current threat. Canonicalize ties.
- Assign explicit scout roles; do not steal a builder, critical defender, or entire army without an arbitration claim.
- Use routes/checkpoints rather than continually retargeting a single point. Recall scouts when they discover a decisive threat, become too damaged, or complete the route.
- Convert visible actors into contact memory and summarized capability evidence. Keep confidence and evidence age visible in traces.
- Defense may react to remembered movement toward a base, but live attack commands still require a visible/legal target or an attack/search position supported by the command model.

### Threats, defense, and anti-exploit recovery

Create typed threat incidents from visible/remembered evidence:

- location/region, first/last observed tick, confidence, hostile role/value, threatened base/asset, arrival estimate band, urgency, assigned squad, and resolution reason;
- worker harassment, main-army pressure, air raid, naval force, hostile transport/landing, hostile static defense, proxy production, blocking building, trapped exit, and unknown contact are distinct classifications.

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

Every combat unit has at most one primary assignment: base defense, threat response, ground/air/naval attack squad, transport escort, reserve/reinforcement, scout, rampart defense, or recovery. Squads contain actors that share a movement domain and ordered actor IDs; a cross-domain task force coordinates several squads without pretending they share one path. Their lifecycle is:

```text
forming -> assembling -> rallying -> advancing -> engaging
                   \-> defending
engaging -> regrouping -> advancing
engaging -> retreating -> recovering -> reserve/disbanded
objective invalid -> searching last-seen -> retarget/disbanded
```

An objective is usually a location/asset class with evidence, not one immortal actor reference. Initial objective priorities:

1. immediate threat to a base/economy;
2. hostile air/naval transport threatening a landing or stranded valuable cargo;
3. hostile blocker/proxy preventing normal operation;
4. exposed reachable army/fleet/air wing that can be engaged favorably;
5. observed production/tech/economy target with a feasible route;
6. last-seen base/search location;
7. air corridor, water lane, shore landing, map-control, or expansion-denial point.

The engagement evaluator should begin as deterministic integer/fixed-point heuristics over visible local value, health, range/movement domain, weapon target-domain compatibility, target access, static/anti-air/shore defense, transports and cargo risk, reinforcements, objective value, retreat route safety, and confidence. Avoid pretending an inaccurate full combat simulator is ground truth.

Initial squad scripts:

- `hold_and_intercept`
- `assemble_and_advance`
- `focus_priority_targets`
- `kite_or_screen`
- `retreat_to_safe_rally`
- `search_last_seen`
- `clear_blocker`
- `escort_transport`
- `intercept_air_or_transport`
- `naval_control`
- `land_and_regroup`

Use damage reservations to reduce overkill: reserve estimated pending damage by target for the current decision window, then prefer the next legal target once lethal damage is covered. Apply target-switch hysteresis so a marginal score change does not churn commands. Units unable to follow a squad order enter a bounded recovery state instead of repeatedly receiving the same order.

### Difficulty and strategy personality

Do not overload `ProbableWaffleAiDifficulty` with opening style.

```ts
type AiStrategyArchetype =
  | 'balanced'
  | 'rush'
  | 'macro'
  | 'turtle'
  | 'tech'
  | 'air-control'
  | 'naval'
  | 'expeditionary';
```

Only expose archetypes that have faction-valid plans and relevant map access. `naval` and `expeditionary` are invalid on a map without meaningful water/shore or disconnected objectives; `air-control` is invalid for a faction without the required producer/roster. `Expeditionary` means a transport-led combined-arms strategy, not that every unit has the future `Amphibious` movement capability. Selection may be explicit in the lobby later or deterministic from match seed, faction, and map capability. The chosen archetype is visible in debug trace/result metadata, not silently changed mid-match.

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
| Fortification candidates per planning pass | few/simple fronts | standard bounded fronts | more alternatives, same legal rules |
| Access/transport route candidates | few, safer routes | standard bounded alternatives | more route/landing alternatives, same legal rules |
| Rules/resources/stats | identical | identical | identical by default |

All profiles obey identical visibility, validation, and deterministic work limits. The existing `aiAdvantageResources` modifier should be audited and wired only as a separately named, explicitly displayed rules option if product wants it. Never hide it inside “Hard.”

### Match conclusion and score flow

Replace dialog-veto AI surrender with a host-authoritative, replayable concession flow for skirmish:

- calculate recoverability from surviving builders/workers, legal production and cross-domain transport paths, income access, reachable resources/expansions, army/fleet/air defense value, queued completions, stranded recoverable units, and known hostile pressure;
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

Author these in their owning stages, run focused cases there, and rerun the complete matrix in Stage 15. The [deterministic scenario specification](759-skirmish-ai/08-deterministic-scenarios.md) adds independent semantic assertions, positive/negative paired cases and reproducibility requirements; [packet 10](759-skirmish-ai/10-integration-and-adversarial-tests.md) adds progress/fault and continuous-match gates. Several sensible decisions may satisfy a scenario, but identical inputs to one version must still replay exactly.

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
15. one active fortification node cannot produce duplicate construction intents;
16. wall-front selection preserves required interior/exterior and wall-top access;
17. tower, stair, and future gate-slot constraints resolve deterministically;
18. a destroyed segment transitions the existing plan to one bounded breach response.
19. a ground-disconnected objective is rejected or receives a feasible air/water transport route;
20. anti-air production selects actual `canTargetAir` capability rather than the generic ranged label;
21. cargo seats, passengers, transport, escort, rendezvous, and landing claims cannot be double-assigned;
22. transport failure/reroute and save/restore preserve one deterministic lifecycle owner.
23. a container-backed deposit building never becomes a mobile transport and deposit workers cannot be stolen by boarding intents;
24. a Field growing with locked resources forecasts future food, reserves legal tender capacity, and re-enters growth after harvest without a duplicate field plan;
25. shared production/research queues, ongoing payment, cancellation/refund, and in-flight accepted commands cannot double-count resources, capacity, or demand;
26. a heal or area-control reservation avoids redundant casts, handles target/effect flags, and coordinates with autocast;
27. a stunned/slowed unit receives realistic progress/retreat estimates and is not classified as a permanent path failure;
28. capability changes from research, runtime level, ownership, or temporary-object expiry invalidate affected plans and strength estimates;
29. a stockpile/timed/last-building objective changes spend, defense, and concession decisions consistently with the configured match rules;
30. equal neutral claims and allied support proposals resolve by stable keys without hidden information or foreign-unit control.

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
16. short connected wall line between terrain anchors with a deliberate opening;
17. protected-side stairs and reachable ranged defenders across walls/towers;
18. tower coverage without redundant tower or wall spam and without sealing production/resource lanes;
19. wall breach, defender withdrawal/reinforcement, repair/rebuild, and plan abandonment when rebuilding is uneconomical.
20. water transport from one disconnected land region to another: gather, rendezvous, board, sail, unload, regroup, and continue the objective;
21. transport loss or unsafe landing causes bounded reroute/cancellation without duplicate cargo ownership or stranded command spam;
22. island expansion carries a builder and protection, establishes the base, and retains reinforcement/evacuation feasibility;
23. air scout/harassment and anti-air response use legal targets and observed capability only;
24. naval escort/interception and combat remain in reachable water regions and protect or attack transport objectives;
25. save/load during boarding, transit, and unloading preserves passengers, seats, routes, commands, and digests.
26. Field/Granary grow–harvest–deposit–regrow loop, tender interruption, source-slot saturation, drop-off destruction/replacement, and save/load preserve useful delivered income;
27. production and research contend for a shared queue, cancel through existing commands, apply the actual refund once, and update existing/new actors after an upgrade;
28. a wounded squad receives capped useful healing, avoids a hostile persistent zone, and resumes its objective when recovered; worker support does not starve the base;
29. researched actor/ground-target spells, friendly area healing, autocast/manual arbitration, active stun/slow, projectile impact, and summon expiry behave identically at differing render rates and after save/replay;
30. ranged units respect minimum range, actual high-ground bonuses, armour pools, and pending projectile damage; tactical orders do not repeatedly cancel their attacks;
31. two simultaneous proximity claimants, inactive actors in the index, and an ownership change during a queued action produce one stable owner and reject stale actions;
32. an allied base receives legal help without foreign-unit orders or hidden vision, while timed, resource-stockpile, and last-building modes finish through their actual result rules.

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
- passive macro, early rush, turtle, worker harassment, hidden/island expansion, mixed ground/air/naval forces, water and capability-available air transport, transport interception, proxy building, and wall/block exploitation;
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
- no accepted fortification plan blocks required friendly base access, and every occupied rampart post has a valid protected-side route.
- zero direct movement/attack objectives across incompatible access domains; every cross-domain passenger, cargo seat, transport, escort, rendezvous, and landing slot has at most one plan owner.
- zero double-owned caster cooldowns, worker primary tasks, deposit/cargo slots, or production/research queue slots; authoritative refunds and ownership changes are applied exactly once.
- active crop/deposit/spell/effect/temporary-object state continues deterministically across rendering, save/replay, and recovery boundaries for every advertised capability.
- configured victory conditions, team relationships, and effective runtime capabilities agree across planning, execution, and concession.

### Macro metrics

- tick of first worker, supply/housing, production building, military unit, scout, research, expansion, attack, and recovery completion;
- worker idle ticks and allocation by resource;
- income and spend by resource; unspent float area-under-curve;
- reserved-but-unused value and reservation age;
- producer idle ticks, queue utilization, and unit composition by role;
- supply-block ticks, forecast accuracy, recovery delay, and premature-housing cost;
- prerequisite/site/order failure counts and recovery outcomes;
- base resource-life estimate, saturation, and expansion establishment time.

### Access, transport, air, and naval metrics

- objectives by direct/transport/air/naval/unreachable route and impossible-order rejection count;
- discovered ground/water/elevated access regions, viable shore/landing pairs, and route recomputation count;
- transport capacity demanded/available/reserved/used, boarding and unload latency, utilization, and partial departures;
- passenger travel/regroup time, stranded units, cargo value delivered/lost, and transport plan completion/cancellation reason;
- landing-zone threat, reroute count, duplicate seat/plan conflicts, and save/restore continuation equality;
- ground, anti-air, air, naval, transport, and shore-defense strength/production by capability rather than label;
- air/naval objective completion, interception/escort success, retreat survival, and domain-invalid target attempts;
- island expansion establishment, reinforcement latency, evacuation feasibility, and disconnected-base idle time.

### Component coverage and interaction metrics

- registered executable capabilities covered by observation/intent/command/outcome/persistence/fixture, with explicit unsupported reasons for every remaining entry;
- delivered versus forecast income, deposit waiting/travel time, loaded-worker idle time, crop growth/harvest idle time, and tender/gatherer utilization;
- shared queue blocking by research/production, remaining payment obligations, wasted cancellations/refunds, duplicate demand, and time from upgrade to revised AI capability;
- useful healing versus overheal, support worker time away from economy, casts by reason, cooldown conflicts, redundant control refreshes, area value, and damage taken in avoidable observed zones;
- disabled-unit false stuck reports, interrupted attack windups, min-range violations, and evaluator/runtime outcome discrepancies;
- neutral claim success/cost, stale ownership actions rejected, permitted allied assistance, and mode-specific objective progress/concession correctness;
- save/replay equality during crop growth, deposits, active effects, in-flight spells, temporary support expiry, and ownership changes.

### Intelligence and control metrics

- explored coverage and coverage-age distribution;
- contact count, age/confidence, capability inference, and rediscovery delay;
- illegal hidden/ally target attempts (must remain zero after validation);
- threats detected, response delay, false/obsolete threat count;
- intents proposed/accepted/rejected by reason;
- invalid/dropped/repeated commands and command-to-applied latency;
- target switches, actor claim conflicts, stuck/no-progress incidents;
- candidates and path queries consumed per decision.

### Fortification metrics

- protected asset value and hostile path-distance/approach-width change per resource spent;
- planned/reserved/completed wall nodes, duplicate-node rejections, total wall length, and abandoned cost;
- tower marginal coverage, overlap, observed damage, and active firing time;
- wall-top post occupancy, defender travel/reinforcement time, and unreachable assignment attempts;
- number and age of protected-side stairs, deliberate openings/gates, and valid inside/outside routes;
- friendly worker/production/army path regressions caused by the plan (must remain zero in fixtures);
- breach detection/response time, survivors withdrawn, repair/rebuild success, and repeated-failure backoff.

### Combat and outcome metrics

- army value committed, destroyed, lost, surviving after retreat, and reinforcement latency;
- damage/army-value efficiency and estimated overkill;
- objective completion/abandonment, regroup time, base damage prevented;
- win/loss/draw/concession reason, duration, final economy/army value, and score-screen completion;
- crash, unhandled rejection, desync, stuck-match, and no-progress timeout counts.

### Merge policy for behavior changes

The integration PR remains draft/not release-validated through Stages 0–14, while each stage must pass focused checks and relevant core smoke before dependent work proceeds. Stage 15 runs the complete integrated harness, establishes baseline variance, reviews predeclared numerical thresholds and reports primary metrics, guardrails, fixture coverage and candidate/baseline results. Intermediate green gates are not passing releases. A single win, hand-picked seed, or subjective “looked smarter” playthrough is not sufficient. No automatic merge.

## Implementation roadmap

The authoritative execution entry point is [00-start-here.md](759-skirmish-ai/00-start-here.md). Implement Stages 0–14 sequentially on one isolated integration branch, author/run focused tests and integration checks with each stage, then perform extensive builds/playtests/whole-solution review and full validation in Stage 15. This is the latest user-approved hardening policy. Do not stop after Stage 1 or wait for intermediate PR merges. Runtime command validation is always active.

The stage acceptance lists are retained and strengthened in the packets below, with source paths, contracts, algorithms, defaults, debug obligations and fixture instructions. Release Gates A–D are capability groupings; focused dependency gates run during implementation, and complete release evidence is collected at Stage 15.

| Read order | Contents |
| --- | --- |
| [Start here](759-skirmish-ai/00-start-here.md) | Cold start, branch/prerequisite reconciliation, sequential execution, per-stage Terra/Sol model and effort recommendations, copyable kickoff |
| [Shared decisions](759-skirmish-ai/01-shared-decisions.md) | Source/destination map, pure brain lifecycle, purpose, demand ledger, legitimate duplicates, reservations, budgets, fairness and persistence |
| [Stages 0–6](759-skirmish-ai/02-foundation.md) | Correctness, typed contracts, commands, observations, scenario harness and strategic arbitration |
| [Stages 7–9](759-skirmish-ai/03-macro-and-access.md) | Actual faction openings, demand/throughput/composition, economy, routes/transports, scouts and a complete basic match |
| [Stages 10–12](759-skirmish-ai/04-environment.md) | Bases, efficient field/drop-off placement, expansion, connected defenses and recovery |
| [Stages 13–14](759-skirmish-ai/05-tactics-and-adaptation.md) | Tactics/support, threat-scaled fronts, counters/research/archetypes and integration cleanup |
| [Debug panel](759-skirmish-ai/06-debug-panel.md) | Purpose/build-order/composition and all domain views, decision drilldown, overlays and read-only history/export |
| [Stage 15](759-skirmish-ai/07-final-validation.md) | Extensive code review, automated/runtime checks, baseline matrix, tuning, docs/skill learning and closure |
| [Deterministic scenarios](759-skirmish-ai/08-deterministic-scenarios.md) | User-requested positive/negative strategic cases, independent semantic oracles, deterministic replay, runtime counterparts and coverage gate |
| [Cross-stage hardening](759-skirmish-ai/09-progress-and-hardening.md) | Measured progress, finite recovery, deadlock/uncertain-command handling, lane fairness, useful missions, access/cost/lifecycle safeguards and stage ownership |
| [Integration/fault gates](759-skirmish-ai/10-integration-and-adversarial-tests.md) | Focused-check ladder, executable core slices, 32 fault/progress cases, 8 continuous-match sequences and stronger final acceptance |
| [Progress](759-skirmish-ai/progress.md) | Persisted stage/step, actual model, implementation-versus-validation states and evidence ledger |

### Mandatory component-audit slices within the stages

Keep Stage 0–16 identifiers stable. These are mandatory scope, not optional suggestions. Implement dependent slices sequentially, run their focused checks and core smoke, then execute all final-evidence gates again at Stage 15. A stage_checked development implementation is not a validated release. Apply the H1–H9 stage table in addition to these component slices.

| Stage | Additional slice and acceptance |
| --- | --- |
| 2 — contracts | Add capability coverage entries, typed service/ability/neutral-claim intents, status/zone/growth/queue observations, and mode objective contracts. Every registered gameplay capability maps to an owner or an explicit unsupported reason. Keep visual-only metadata outside decisions. |
| 3 — shared commands | Audit cast/autocast, heal/repair, tend/gather/return, cancellation, and approach-to-claim paths through existing commands/application. Close missing spell payload/settings semantics and move gameplay spell impacts from tween completion to simulation ticks. Reject stale owners/targets and preserve applied-once outcomes. Automatic conversion remains a shared simulation event, not an AI owner setter. |
| 4 — observation and diplomacy | Project effective actor level, resource/growth/service state, active permitted effects/zones, and match objectives. Apply team policy to runtime spell/heal/zone application as well as observations; regression-test effect polarity and actor-versus-tile coordinates. Unknown enemy capabilities/cooldowns remain unknown. |
| 5 — harness and persistence | Add runtime regressions for spell render-rate independence, active effect/zone and summon expiry, crop growth/tender restore, deposit work, shared queue restore, and conversion ties. Extend the existing hash/save projection where absent. Author lifecycle/authority fixtures here; Stage 15 must repair failures before final release validation. |
| 6 — arbitration | Extend claims to source/tender/deposit service slots, shared queue items, caster cooldown/effect windows, and neutral/allied objectives. Reconcile pending commands and authoritative completion/refund/ownership events before admitting new proposals; one physical resource cannot be claimed by conflicting parent plans. |
| 7 — macro and labor | Implement renewable food and compatible deposits, shared production/research timelines, actual payment/refund semantics, builder/repairer caps and automatic construction. Field/Granary fixtures deliver repeatable income; automatic sites do not wait for nonexistent builders; duplicate accepted/queued work is suppressed. |
| 8 — transport | Exclude stationary deposit containers from fleet supply. Respect passengers temporarily in deposit service, reconcile upgrade capacity and ownership changes, and choose unload sites outside observed harmful zones. |
| 9 — exploration and match completion | Add bounded neutral acquisition and allied-defense objectives; read the configured win/loss/tie rules. Prove deterministic simultaneous claims, legitimate allied assistance, stockpile/timed decisions, and last-building-aware concession without changing authority. |
| 10–12 — bases, fortification, recovery | Place renewable food/drop-offs for delivered throughput; score actual elevated firing range; separate economic, support, and transport service space. Repair/heal teams retain an economy floor; stunned units wait/re-evaluate rather than triggering path retries; no farm/deposit duplication after disruption. |
| 13 — tactics and abilities | Add caster/autocast ownership, useful heal/control reservation, support protection, harmful-zone avoidance, temporary-support expiry, and actual min-range/windup/projectile/armour evaluation. Pass useful-heal, area-cast, stunned-retreat, elevated-range, and attack-interruption fixtures. |
| 14 — technology and adaptation | Value actual actor-level upgrades and useful spell access against shared queue opportunity cost. Existing/upgraded/new actors produce consistent capability updates. No unsupported damage-type counter table, hero XP, or unregistered spell execution is assumed. |
| 15 — release evaluation | Add the component interaction fixtures to candidate/baseline and save/host-recovery matrices. Publish capability support coverage and mode limitations; all mandatory runtime/fairness gates pass before claiming support. |

Release Gates A/B therefore include the relevant shared execution, farming/deposit, and mode foundations; Gate D includes coordinated ability tactics. Advanced casting follows the implemented command and persistence contracts. Existing pawn autocast remains available under its baseline policy; final validation proves compatibility and single-caster ownership.

### Deferred Stage 16 — bounded tactical search or offline learning

Stage 16 is explicitly outside this implementation. Reconsider only if Stage 13/15 evidence shows a tactical ceiling and a bounded pure evaluator can demonstrate a gain. Any future search uses deterministic work quotas and canonical inputs; offline learning requires licensed/provenanced data, reproducible training and versioned artifacts. Runtime LLM/RL inference remains out of scope.

## Release gates summary

| Gate | User-visible result | Blocking evidence |
| --- | --- | --- |
| A — trustworthy foundation | AI decisions become fair, command-routed, explainable, and saveable | deterministic fixtures, no hidden/allied targets, no direct mutation |
| B — playable multi-domain slice | normal AI opens, produces, discovers legal routes, transports when required, scouts, responds across air/water/ground, attacks, concedes, and reaches scores | opening/access/transport/visibility/threat/attack/concession runtime scenarios |
| C — resilient fortified skirmish | AI builds/expands safely—including reachable islands—creates traversable domain-aware wall/tower defenses, and recovers from transport loss, breaches, hostile walls, proxies, depletion, and failures | base/access/fortification topology, anti-blocking, and recovery fixtures with bounded plans/retries |
| D — stronger/releasable | domain-specific squads, combined task forces, adaptation, real difficulty, batch evidence, host/save robustness | ground/air/naval candidate/baseline matrix, blind playtest, performance and lifecycle gates |

## Risks and controls

- **Architecture migration stalls:** migrate one intent family at a time behind adapters; keep the behavior tree until all mutation paths have contract tests.
- **AI becomes fair but too weak:** establish legal scouting/memory and basic macro in the same release gate; measure weakness rather than reintroducing omniscience.
- **Smarter but less fun:** combine outcome/macro/combat metrics with blind human ratings and readable traces. Do not optimize only win rate.
- **Metric gaming/overfitting:** use multiple probe opponents, mirrored sides, holdout seeds/maps, and baseline versioning.
- **Determinism regression:** canonical inputs, complete tie-breaks, tick time, atomic generations, seeded RNG, command-only effects, state/decision digests, and save continuation are hard gates.
- **Performance spikes:** use cached spatial summaries, stable cursors, candidate shortlists, and deterministic quotas. Never stop planning based on elapsed wall time.
- **Walls make the AI weaker or trap it:** require whole-plan hypothetical connectivity, deliberate openings/gate slots, incremental cost limits, protected-side stairs, and post-build path assertions before a plan becomes operational.
- **Transports deadlock or strand valuable cargo:** make the journey one persistent owner with exclusive seat/rendezvous/landing claims, tick deadlines, typed outcomes, safe cancellation, bounded rerouting, and phase-by-phase save/load fixtures.
- **Air/naval production wastes the economy:** unlock demand only from relevant access regions, legal producer/spawn paths, reachable objectives, and observed threats; decay stale demand with hysteresis.
- **Mixed-domain forces become one incoherent blob:** keep ground, water, air, elevated, and passenger squads separate and coordinate them through a shared task-force objective and explicit support timing.
- **The catalog promises unsupported mechanics:** verify definition, registration, runtime execution, command, and persistence together; record visual-only or unfinished capabilities explicitly. Current lighting, scenery names, and the placement-restriction stub are not strategic game rules.
- **Micro competes with pawn autocast or starves economy:** reserve cast windows and support service slots, retain minimum economic assignments, and measure useful healing/control plus worker opportunity cost.
- **New AI depends on old nondeterministic effects:** make shared spell impact, farming/deposit continuation, and ownership tie regressions prerequisites of their consumers, not optional cleanup after tactical tuning.
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
10. **Fortifications:** walls/towers/stairs are a topology-aware strategic project used when valuable, especially by turtle/defensive plans—not a default ring around every base. Reserve a future gate slot now; implement gate mechanics separately when the structure exists.
11. **Access domains:** every objective is filtered through the stable ground/water/elevated/air access graph before utility scoring; cross-domain travel is a persistent transport plan rather than a sequence of opportunistic unit orders.
12. **Air transport:** use capability-driven container/flight contracts and test doubles now; do not advertise it as shipped until a real flying-container unit definition exists.
13. **Existing mechanics coverage:** renewable food, deposits, shared queues, upgrades, support/spells/status effects, neutral claims, team support, and configured match objectives are mandatory within the stage slices above. Visual-only and unfinished systems stay explicitly unsupported until their runtime rules exist.

The following decisions are non-blocking until their named stage:

- **Optional hard-mode rules bonus (Stage 6):** recommended `off`. If retained, expose it separately from difficulty and audit the existing `aiAdvantageResources` modifier end to end.
- **Strategy selection UI (Stage 14):** recommended deterministic automatic archetype first; explicit lobby selection can follow after each exposed plan is supported.
- **Attack-move/hold/patrol commands (Stage 3/13):** add the minimum shared semantics proven necessary by squad fixtures.
- **Host migration support (Stage 15):** recommended required for networked AI; otherwise explicitly restrict unsupported lobbies and track removal of that restriction.

## Cold-start handoff for the next implementation agent

Start with [the execution runbook](759-skirmish-ai/00-start-here.md), [shared decisions](759-skirmish-ai/01-shared-decisions.md), [hardening](759-skirmish-ai/09-progress-and-hardening.md), [integration gates](759-skirmish-ai/10-integration-and-adversarial-tests.md), [debug specification](759-skirmish-ai/06-debug-panel.md), [scenario specification](759-skirmish-ai/08-deterministic-scenarios.md), and [progress](759-skirmish-ai/progress.md). The runbook owns branch selection, current #792 reconciliation, model/effort guidance, ordering, focused stage gates and extensive final validation. This research PR contains no shipped runtime implementation.

PR #792 fixes async planner accessibility and stable candidate selection only. It does not deliver observations, commands, macro, composition, squads or evaluation. Inspect its current state at kickoff; integrate equivalent task-owned prerequisites on the implementation branch without modifying or waiting on the other PR. The old instruction to update #792 separately or implement “Stage 1 only” is superseded.

The source/evidence in this roadmap describes the research checkout and its dated audits. Reconcile moved symbols with narrow source inspection on current develop; do not rerun broad research. Keep these invariants while applying the concrete stage recipes:

### High-value symbols to inspect first

- `PlayerAiController`, `PlayerAiControllerAgent`, `PlayerAiControllerMdsl`
- `PlayerAiBlackboard`, `WorldStateSnapshotManager`, `TargetingManager`
- `BasePlanner`, `MapAnalyzer`, `ScoutingManager`, `CombatMicroManager`
- `EconomyManager`, `LogisticsManager`, `RepairManager`, `TechProgressManager`, `ForceMaintenanceManager`
- `GameCommand`, `CommandBusService`, `dispatchAiOrder`, command queue/application and server validators
- `AIBehaviorTreeStateData`, save/load AI controller state
- `ProbableWaffleAiDifficulty`, lobby player definition, `DifficultyModifiers`
- `StateHashService`, `GameModeConditionChecker`, `ScoreTracker`, `AiPlayerHandler`
- `Wall`, `WatchTower`, `Stairs`, their prefab definitions, `StructureTopologyService`, `HeightNavigationGraphBuilder`, and `NavigationService`
- `MovementTerrainType`, `WaterNavigationHelper`, `FlyingComponent`, `ContainerComponent`, `ContainableComponent`, and pawn `EnterContainer`/shore behavior
- `CommonBoat`, `VikingBoat`, flying unit definitions, `AttackData.canTargetAir`, water production spawn logic, and every command/save consumer of load/unload state
- `ComponentsDefinition`, `SystemsDefinition`, `pwActorDefinitions`, `actor-data.ts`, `TechTreeService`, `applyLevelOverrides`, and `upgradeActorToLevel`
- `GatherData`, `ResourceSourceComponent`, `ResourceDrainComponent`, `TendableComponent`, Field/Granary definitions, pawn tending/gather/return behavior, `QueueComponent`, `PaymentType`, and cancellation/refund handlers
- `SpellComponent`, `SpellCastingSystem`, `spellDefinitions`, pawn `CastAutocastSpell`, `AoeZoneManager`, `StatusEffectComponent`, `HealingComponent`, `HealthComponent.takeDamage`, and `high-ground.helper.ts`
- `ConvertibleComponent.checkProximity`, `OwnerComponent`, editor conversion registration, team/vision helpers, configured `WinConditions`/`LoseConditions`/`TieConditions`, and their result checker

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
- never approve a fortification node without whole-plan friendly ground access and protected-side elevated reachability;
- never score or order an objective before proving a movement-domain route and compatible weapon target capability;
- never assign a passenger, cargo seat, transport, escort, rendezvous, landing slot, or destination to conflicting transport plans;
- never treat “ranged” as anti-air without the selected attack's actual `canTargetAir` capability;
- never confuse drop-off containers with mobile transports, growing/carried resources with spendable resources, or actor upgrade metadata with applied runtime capabilities;
- never allow pawn autocast and a tactical caster plan to spend one cooldown concurrently, or let rendering determine a gameplay spell impact;
- never assume damage-type multipliers, neutral loot/XP, garrison bonuses, night vision penalties, or other unimplemented rules from names or familiar RTS conventions;
- never omit farming/deposit/effect/temporary-object continuation from saves and hashes once AI depends on those mechanics;
- never evaluate a match's goals or concession using different victory/diplomacy rules from shared execution;
- never auto-merge a PR.

### Copyable next-agent prompt

```text
Start implementing docs/ai/759-skirmish-ai/00-start-here.md and resume its progress ledger.
Complete Stages 0–15 sequentially on one isolated integration branch. Author and run focused
tests, type/lint checks and integration smoke with each stage; repair failures before advancing.
Keep extensive builds, playtests and whole-solution review/validation at Stage 15. Apply H1–H9,
the fault/continuous-match gates and purposeful duplicate capacity,
faction build orders, composition/counters, multi-domain access, fortifications, all audited
existing mechanics, and the full read-only AI debug panel. Continue between stages without
asking. At Stage 15 run and repair the complete scenario/runtime/replay/baseline matrix,
update docs and relevant skills with proven learnings, and push for review. Preserve unrelated
work, report real blockers, and never merge automatically. Use the model/effort guidance.
```

## Omission audit for this roadmap

- [x] Issue milestone requirements are represented: basic production/attacks, AI surrender, score screen, anti-building/block exploit resilience, and general playable stability.
- [x] Current contracts, implementations, registrations/consumers, configuration/UI, persistence, replay/hash, lifecycle, and tests are mapped.
- [x] Fair observation includes team/diplomacy, not only fog of war.
- [x] Difficulty, strategy archetype, and optional rules bonuses are separated.
- [x] Economy, supply, production, tech, bases, expansion, scouting, memory, threats, squads, tactics, anti-blocking recovery, and concession all have staged acceptance criteria.
- [x] Connected walls, tower coverage, protected-side stairs, wall-top defenders, breach recovery, duplicate suppression, and future gate slots have a dedicated topology-aware stage.
- [x] Ground/water/air/elevated access, water and future air transport, island expansion, air/naval combat, escorts/interception, and capability-correct counters have a dedicated staged design and fixtures.
- [x] Registered component/system coverage includes crops/deposits, worker service roles, shared queues/payments/refunds, actor upgrades, healing/spells/autocast, status/zones, combat geometry, neutral ownership, teams, and alternate match objectives.
- [x] Definition-only, visual-only, unregistered, and future mechanics are distinguished from executable behavior; newly found command/timing/persistence dependencies have owning stage gates.
- [x] Command-only mutation includes construction, repair/logistics, combat/scouting, and concession.
- [x] Save/load, replay, state hash reuse, host ownership/migration, performance budgets, and first-divergence diagnostics are included.
- [x] Pure fixtures, runtime scenarios, batch evaluation, manual playtest, metrics, and baseline policy are included.
- [x] User strategic scenarios include positive/negative capacity, economy, placement, scouting, multiple fronts, air/naval/transport, adaptation and recovery cases with independent semantic and replay assertions.
- [x] Legitimate repeated buildings and units are explicitly distinguished from duplicate commitments; advance throughput, local drop-off efficiency and resilience are covered.
- [x] Full debug panel ownership, cold-start packets, per-stage model/effort, sequential progress, focused stage gates and extensive final verification/learning closure are specified.
- [x] Hardening covers causal progress/deadlines, resource wait cycles, uncertain commands/epochs, starvation, useful capacity, repeated missions, query isolation, real wall/transport effect, saved fault state and consecutive matches.
- [x] Fault-injection and continuous-match gates require actual useful recovery, not a plausible explanation, optional expansion or token order.
- [x] Open Stage 0 work is acknowledged so the next agent will not duplicate it.
- [x] External source/licensing boundaries and deferred ML/search conditions are recorded.

## Final closure audit for the research task

- [x] The roadmap has a measurable classic-RTS target instead of a generic “smarter AI” goal.
- [x] Existing traversable wall/tower/stair mechanics are retained and given an AI planning, construction, defense, and recovery layer with future gate compatibility.
- [x] Existing flying, water-navigation, container, boat, and target-capability mechanics are retained and composed into a persistent strategic access/transport/combat design without claiming a nonexistent air-transport prefab.
- [x] Component audit findings are connected to observations, shared effects, plan ownership, mandatory stage slices, runtime fixtures, metrics, and cold-start symbols without renumbering earlier stages.
- [x] Architecture recommendations follow confirmed repository seams and correct the earlier state-hash assumption.
- [x] Stages form dependency-aware, reviewable increments with user-visible release gates.
- [x] Product defaults unblock foundation work while isolating later decisions.
- [x] The cold-start runbook identifies branch/PR reconciliation, first actions, ordered packets, symbols, invariants, progress, model/effort guidance and a copyable full-plan prompt.
- [x] No runtime implementation or copied third-party code is included in this research PR.
