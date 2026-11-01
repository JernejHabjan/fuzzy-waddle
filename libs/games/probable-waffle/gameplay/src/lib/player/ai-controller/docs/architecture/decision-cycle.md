# AI decision cycle

## Authority flow

```text
authoritative world
  -> fair immutable observation
  -> durable pure brain state
  -> domain-manager proposals
  -> deterministic arbitration
  -> typed intents and claims
  -> shared command authority
  -> authoritative outcomes
  -> reconciliation, trace and next observation
```

`AiObservationV1` is the only strategic input. It contains owned facts, legitimately observed enemy knowledge and capability projections resolved from the runtime catalog. It must not expose live Phaser objects, hidden queues, current hidden positions or unrestricted navigation state.

In the Phaser adapter, `ai-observation-pipeline.ts` owns the visibility gate, generation commit, saved cursor and lifecycle.
Neighboring `observation/` modules project actors/combat, the capability catalog, permitted topology/map cells,
remembered contacts, access products and mode context. Keep any new live-world projector behind the same owned-or-visible
gate; a pure brain manager must never query Phaser directly.

Pure preparation and selection run synchronously inside the same simulation-tick callback. The adapter refreshes
owned resources/supply and delivered-income sampling, then calls `AiObservationPipeline.refreshNow`; a failed capture
cannot dispatch using the retained older observation. Awaiting even a resolved promise here can let a render frame's
remaining fixed ticks advance before selection, separating the consumed input from its native safety/authority facts.
Bounded access products remain pending when unavailable. The observation adapter performs no legacy enemy-route or targeting waits.

`AiBrainStateV1` owns persistent goals, knowledge, demand, reservations, bases, squads, transports, fortifications, recovery, scheduling and deterministic identity state. Every persisted deadline uses simulation ticks. Canonical serialization sorts set-like data while preserving intentionally ordered data such as RNG state.

Domain managers propose changes; they do not mutate the world. The brain merges each manager's owned state projection, resolves claims and budgets, and emits a deterministic intent order. A manager may replace only the state slice or keyed rows it owns.

`ai-intent-arbiter.ts` owns this shared admission pass: stable intent ordering, observation preconditions, exclusive
claims, real stockpile limits and posture-aware spending reservations. `ai-brain.ts` coordinates the pass and commits
accepted claims/state; domain managers must not implement a competing admission path.

Before collecting proposals, the brain reconciles reservations against the current tick and ordered outcomes using
the planner's shared reconciliation function. Managers and arbitration therefore agree on expired leases and terminal
commands. An expired gathering claim cannot hide a worker from required capacity for another decision; live claims
still exclude the worker, and builder eligibility still preserves cargo delivery and existing construction.

The Phaser bridge converts accepted intents to the same command path used by other controllers. Server/runtime validation remains authoritative for ownership, prerequisites, resources, queues, placement, paths and targets. Applied, rejected, duplicated, delayed and stale outcomes return through typed reconciliation.

## Required invariants

- A tick has one command authority: the pure planner dispatches through the shared command bus.
- Identical observation, prior state, configuration and seed produce identical ordered decisions.
- Accepted-but-not-yet-observed work is counted once through stable effect identity.
- Missing, late or duplicate outcomes cannot cause duplicate payment or world effects.
- A debug projection is read-only and cannot call a planner or live pathfinder.
- Destroyed, cross-scene or incompletely initialized actors are excluded from observations.
- Terminal match state stops new strategic intents and releases controller lifecycle resources.

## Controller ownership and compatibility

Configured skirmishes use only the pure brain. Invalid/missing player identity, unsupported faction or invalid
profile configuration throws before observation services, subscriptions or scheduling are installed. A missing pure
brain cannot invoke another strategy engine. Host demotion fences planning and dispatch without rewriting saved
campaign AI policy.

`PlayerAiControllerAgent` is an observation/income adapter. It owns no behavior-tree actions or command managers.
The controller disposes confirmed-income sampling at shutdown; the observation pipeline owns its scene-bound queries.
The pawn behavior trees still execute native unit orders and are independent of the removed player strategy tree.

The supported responsibilities of the retired player tree are owned by the production brain's registered managers:

| Responsibility | Pure owner |
| --- | --- |
| Opening, labor, supply, useful production | AiMacroManager and AiResourceServiceManager |
| Placement and expansion | AiBaseManager, shared construction validation |
| Fortification and staffing | AiFortificationManager |
| Scouting, defense, attack, regroup, concession | AiSkirmishManager |
| Compatible targeting, focus, retreat, support | AiTacticsManager |
| Counters and research | AiAdaptationManager |
| Causal repair and recovery | AiRecoveryManager and macro construction recovery |
| Transport and handoff | AiTransportManager |

The old direct flanking heuristic is retired; it is not a separately certified pure-planner feature. Objective/route
selection, domain missions and tactical targeting provide current maneuver behavior without reintroducing direct
pawn mutation.

`AIBehaviorTreeStateData` / `aiBehaviorTreeState` retain their existing wire names for save and host-checkpoint
compatibility. `PlayerAiBlackboard` remains a data/owned-world compatibility projection used by shared production
validation and existing saves; it does not choose or dispatch strategy. The data-only `MapAnalysis` shape remains
for that projection. No legacy map planner, targeting, production, research or scouting manager is instantiated.
Blackboard-only saves migrate one way through `migrateAiBrainState`, using current-world identity and treating the
old opening as completed. Versioned brain state retains checked canonical migration; unknown future schemas fail.
Save/load and real-peer certification limits are recorded in [coverage and follow-ups](../testing/coverage-status.md).

## Source anchors

- Pure contracts and brain: `gameplay/src/lib/player/ai-controller/contracts/` and `brain/`
- Domain managers: `gameplay/src/lib/player/ai-controller/planning/`
- Runtime bridge: `phaser/src/lib/player/ai-controller/player-ai-controller.ts`
- Observation projection: `phaser/src/lib/player/ai-controller/observation/`
- Shared command application: `phaser/src/lib/world/services/multiplayer/`
- Protocol and server validation: `protocol/` and `server/`
