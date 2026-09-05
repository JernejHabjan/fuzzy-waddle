# Shared implementation decisions

Read after [the runbook](00-start-here.md), together with mandatory [progress and hardening contracts](09-progress-and-hardening.md). These defaults close design choices for all stages. Numbers are initial authored tuning values, not measured optimal balance; Stage 15 evaluates and tunes them with recorded evidence. Preserve actual game costs, damage, capacity, and faction rules from definitions.

## Source and destination map

All paths below are repository-relative. Resolve against the checkout, not a fixed machine path. Existing symbols are discovery anchors; target directories are deliberate new code destinations.

| Area | Existing authority | New code destination / responsibility |
| --- | --- | --- |
| Pure AI | `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/` | `contracts/`, `brain/`, `planning/`, `profiles/`, `debug/`, `testing/`; no Phaser imports |
| Runtime AI | `libs/games/probable-waffle/phaser/src/lib/player/ai-controller/` and `ai-behavior/` | `observation/`, `execution/`, `persistence/`; adapters around existing controller/managers |
| Definitions | Phaser `prefabs/definitions/actor-definitions.ts`, `prefab-definition.ts`, `data/tech-tree/tech-tree.service.ts` | Runtime capability projection into pure catalog; no copied balance table |
| Commands | `libs/games/probable-waffle/protocol/src/lib/game-instance/probable-waffle/game-command.ts` | Explicit command payloads and serialization guards, shared by human/AI execution |
| Authorization | `libs/games/probable-waffle/server/src/lib/probable-waffle/game-instance/multiplayer/game-command-validator.service.ts`, gateway/state-server consumers | Transport/schema/player authorization; world preconditions also checked at runtime apply |
| Application | Phaser `world/services/multiplayer/command-bus.service.ts`, `entity/systems/{queue-command,action}.system.ts`, `dispatch-ai-order.ts` | Typed dispatch/outcomes and application identity; eliminate silent drops |
| Saves/hashes | Phaser `data/{save-game,load-game,actor-data}.ts`, `world/services/recovery/{state-hash,snapshot,host-migration}.service.ts` | Reuse canonical world projection plus versioned AI brain/knowledge/outcome projection |
| Navigation | Phaser `world/services/navigation.service.ts`, water/height graph and occupancy helpers | Cached region/route inputs; pure brain gets data, not mutable pathfinder |
| Debug | Phaser `prefabs/gui/debug/ai-controller/AiControllerDebugPanel.ts`, `AiControllerDebugLabel.ts`, associated `.scene` files, `world/services/DebuggingService.ts` | Read-only view model and bounded UI/overlay adapters; see debug packet |
| Final harness | existing Phaser/server/interface Jest configs, `tools/testing/jest-node-preset.cjs`, `apps/portal-e2e/` | Pure Jest target, real runtime scenario bridge, deterministic batch runner/report |

Use one exported substantive type/class per file and existing path aliases. Reuse `PlayerNumber`, actor ID, `ObjectNames`, `ResourceType`, faction/order/command types rather than copying the illustrative string IDs from the research document. Add named plan/squad/claim IDs where needed. Stable collections serialize as sorted arrays; convert to lookup maps inside pure reducers if useful.

## Brain composition and lifecycle

One host-owned brain per AI player. `PlayerAiController` owns cadence and lifecycle; `AiBrain.step(observation, previousState, orderedOutcomes)` is the pure decision boundary and returns `{nextState, acceptedIntents, trace, debugSnapshot}`. Managers receive read-only data and produce proposals. The runtime adapter applies no strategic choice after arbitration except revalidation/rejection.

Create `AiBrainStateV1` and `AiObservationV1` as named subcontracts instead of growing a new god blackboard. Required brain slices: strategy/opening, knowledge, bases, economy/production demand, reservations/pending outcomes, squads, transport, fortification, support, recovery, scheduler/RNG, and monotonically increasing IDs. Each slice has a default, migration policy, and serializer. A named reducer owns writes to each slice. Existing MDSL only schedules the phase pipeline during migration; remove duplicate legacy actions once their intent family is migrated.

Fixed update order: reconcile applied outcomes/ownership/deaths -> commit permitted observation -> update knowledge/capabilities -> update existing plan phases -> score goals -> collect proposals -> arbitrate -> record pending execution -> emit shared commands -> publish trace/debug snapshot. Command feedback received after a decision is consumed at the next decision in stable tick/sequence order. Never double-spend the same observation's resources.

Use the current 20 Hz simulation clock; all stored times are integer simulation ticks. On each profile decision tick run one bounded step; cap catch-up at two and save the accumulator/cursor. Presentation refreshes do not invoke the brain. For async navigation, allocate a generation and snapshot input at tick T, finish into an isolated candidate, and commit only as one still-current generation. Completion order must not choose a winner: use deterministic work scheduling or a logical barrier for each required result set, canonicalize it and isolate optional/dependent queries per H7 so one slow path cannot stall all observations or local defense. Never use “whichever Promise finished first.”

## Purpose and strategy

Persist one strategic stance: `opening`, `stabilize`, `defend`, `pressure`, `expand`, `recover`, or `finish`. Record `enteredTick`, chosen goal, evidence, target objective, commitment deadline, exit conditions, and suspended goal/step. Economy/supply maintenance continues while another stance owns the army. A temporary defense incident suspends the opening; it does not reset step 0 or recreate completed buildings.

Apply H4's fair service lanes first; priority resolves actual resource/actor conflicts, not which entire manager gets to execute. Urgency classes in descending order: imminent survival/mode loss; restore income/supply/prerequisites; resume opening; defend assets/ally; execute committed army/transport/expansion; improve economy/tech/intelligence. Inside a class use integer utility 0–1000. Initial generic score: clamp to 0–1000 the sum `4*urgency + 3*benefit + 2*confidence - 3*risk - 2*opportunityCost`, with each input 0–100 and component scores included in trace. Different goal scorers may use documented domain inputs, but cannot bypass classes/reservations.

Commit a non-emergency strategic goal for 200 ticks (10 s). After that, switch only when a competitor exceeds incumbent utility by 100 for two consecutive decision steps, or when the goal completes/is impossible. Immediate danger/dead target can interrupt at once. Default opening ends once worker/economy infrastructure and first squad checkpoints are met; next stance uses threat, resource life, and feasible enemy/base objectives. No uniform random strategy/building/unit selection. Seeded variety is restricted to one canonical supported archetype choice at match start and explicit easy-mode legal error; save the choice and RNG use.

## Demand ledger and idempotence — prevent building/unit spam

Duplicate **types** are legal and often necessary. Idempotence suppresses a repeated fulfillment of the same demand/commitment, not a second WorkMill, producer, house, tower, or unit of the same type. Desired counts may be greater than one when affordable and justified; physical/map/population limits and bounded per-step planning still apply. Separate local drop-off service areas and army tasks may need the same capability. Allocate each physical asset to compatible demands explicitly so two managers do not independently promise its full capacity.

Every requirement has a stable demand key: `(player, base-or-task, capability/role, purpose)`. A demand stores desired count/strength, satisfied instances, queued instances, accepted/in-flight intent IDs, site/producer ownership, failure/backoff, and last evidence. A construction child additionally has one stable site/node key. Do not key a request by current tick or a new random ID.

```text
effectiveCommitted = cardinality(unique ready + queued + constructing + acceptedNotObserved identities)
unmet = max(0, desired - effectiveCommitted)
if unmet == 0: propose nothing; trace demand_satisfied or commitment_in_flight
otherwise: propose <= unmet legal alternatives; arbitrator accepts compatible winners
```

The sets are disjoint views of one commitment lifecycle. When a command becomes a queue item, construction site, and then finished actor, migrate its identity/link; do not count each representation separately. Introduce correlation keys in shared execution metadata/outcomes as needed. One accepted command is `proposed -> reserved -> dispatched -> applied -> active -> completed`, or `rejected/cancelled/failed`. Distinguish dispatch receipt from world application. Retrying an uncertain application reuses an idempotency key and first reconciles applied state; it never creates a fresh world effect.

The cardinality formula above applies to count demands. Type each demand's unit explicitly: actor count, population, cargo seats, useful combat contribution or production work per horizon. For capacity/strength demands, sum each unique compatible commitment's allocated contribution, not its actor count. A house providing eight population is not one population; two lanes and two queue items are not equivalent producer capacity. Pending assets contribute only after their predicted ready tick. Split shared capacity into non-overlapping allocations where several goals may use one asset, and reconcile those allocations once before computing deficits.

Separate proposal reservations from money already spent and from pay-over-time obligations. Available resource per type is actual stockpile minus unspent accepted reservations minus obligations due within the planning horizon; never subtract spent resources twice. Refunds count only after application. Shared production/research slots and queue identities are claimed together. Player command IDs/tick/sequence drive deterministic deduplication with a bounded retention window covering replay/recovery; persist its watermarks and active IDs.

Construction counts are by need: housing is the minimum capacity that covers forecast demand; each opening production checkpoint initially wants one resolved producer. Additional producers require an evidenced throughput deficit, a scheduled affordable transition with construction lead time, or explicit resilience/positioning value. Busy queues are evidence, not a mandatory prerequisite that prevents advance planning. Drop-offs require local delivered-throughput gain; farms require worker/tender/food demand. Walls/towers belong to bounded graph plans. New demand, changed forecasts, replacement, redundancy, local service congestion and strategic placement can change desired counts. A per-step or concurrent-plan cap throttles admission; it is never a lifetime per-type cap. Cooldowns alone are not a duplicate-prevention mechanism.

Failure retry defaults: 40, 80, 160, then 320 ticks for equivalent failed candidate; after four attempts invalidate the candidate for 600 ticks and choose a bounded alternate or fail the parent. These counters survive saves. Releasing claims after failure is atomic. A dead worker/producer releases dependent claims; an uncertain command follows H3's bounded reconciliation, authority-health escalation and safe fencing; never wait without supervision or free unknown effects as though they were rejected.

## Initial profiles and budgets

| Setting | Easy | Normal | Hard |
| --- | --- | --- | --- |
| Decision interval, ticks | 40 | 20 | 10 |
| New intent proposals / step | 16 | 32 | 64 |
| Accepted command batches / step | 4 | 8 | 12 |
| Total actor orders / step | 16 | 32 | 48 |
| Placement candidates / step | 8 | 16 | 24 |
| New detailed path queries / step | 2 | 4 | 8 |
| Local engagement pairs / step | 32 | 64 | 128 |
| Route/landing alternatives / operation | 2 | 4 | 6 |
| Trace history, decisions | 128 | 256 | 256 |

All loops have a quota and saved stable continuation cursor. Bound graph construction and spatial-index updates separately (initial 256 dirty cells per decision step); new region generations become usable atomically. Pending summaries must expose `not_ready` rather than an invented route. Cache local threat/region summaries and invalidate on relevant changes. UI formatting/wall time never affects work admitted to a decision.

Reaction delays and budgets differ; visibility and game rules do not. Default intentional easy-mode error is off until Stage 15 can establish a useful legal-error rate. Default cheat/resource modifiers are off. Memory: mobile contact confidence decays linearly to zero over 1,200 ticks; buildings remain last-seen location hypotheses until explored empty, with diminishing confidence. These are planning guesses, never hidden live targets or proof of destruction.

## Observations, routes, targets, and runtime validation

Expose owned state fully, visible permitted hostile/ally state, known map terrain according to the mode's human information policy, and separate last-seen hypotheses. Unknown map cells are unknown; initial access components must not leak hidden dynamic blockers. Reuse static terrain knowledge only if humans receive it. Confirm passability at application. Attack feasibility means a reachable firing position with a compatible weapon and range, not necessarily reaching the target's occupied tile: shore fire and attacks between elevations remain legal where runtime allows them.

Observation filters are not authorization. Server validates envelope/version, player/host rights, cardinality, ID syntax, finite bounded coordinates, and allowed action kinds; runtime validates ownership, visibility/target policy, costs, prerequisites, collision/topology, capacities, cooldowns, and current target/effect eligibility. Preserve supported human queue/stop semantics and order cancellation. Protocol changes update producers, validators, relays, clients, saves, replays, and tests in one integration stage.

Saves capture a safe completed decision boundary plus pending shared commands, counters, RNG, plan/claim state, knowledge, current assignments, effects/zones, growth/deposit work, and summon/transport state. Mid-phase operations save a restartable phase and acknowledged progress, not a Promise. On load rebuild actor references by stable IDs and revalidate once without restarting opening/production. New host reconstructs exactly one brain, restores scheduler/RNG, and observes pending shared commands before issuing anything new.

## Lifecycle and support boundaries

An AI controller must dispose subscriptions, pending-generation ownership, debug observers, and planner state on match end/scene shutdown; temporary actors and captured actors update catalogs and assignments. Feature/version negotiation for multiplayer and saved AI schema must reject incompatible peers/saves explicitly or migrate known older saves with documented defaults. Unknown future schemas cannot silently reset the AI.

Required final support is both registered playable factions on supported skirmish maps with ordinary rules and Easy/Normal/Hard; all supported archetypes/transport modes require a legal producer and executable capability. Current FrostForge does not produce ships; do not grant Skaduwee Sandhold's boat roster. Resolve disconnected objectives with legal flight, neutral acquisition where authored, or an explicit inaccessible-objective/recoverability decision. Test water transport with a supported faction and future air-container behavior with an explicit test definition.

Prototype-only gates, amphibious movement, hero XP/items, trade, terrain debuffs, or neutral rewards remain excluded until a shared runtime rule exists. Necessary fixes to existing commands/effects/persistence are included, not deferred as unrelated once the new AI depends on them. Document genuine platform limitations in final evidence; do not call the full solution validated if a required skirmish/save/host gate is still blocked.
