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

`AiBrainStateV1` owns persistent goals, knowledge, demand, reservations, bases, squads, transports, fortifications, recovery, scheduling and deterministic identity state. Every persisted deadline uses simulation ticks. Canonical serialization sorts set-like data while preserving intentionally ordered data such as RNG state.

Domain managers propose changes; they do not mutate the world. The brain merges each manager's owned state projection, resolves claims and budgets, and emits a deterministic intent order. A manager may replace only the state slice or keyed rows it owns.

The Phaser bridge converts accepted intents to the same command path used by other controllers. Server/runtime validation remains authoritative for ownership, prerequisites, resources, queues, placement, paths and targets. Applied, rejected, duplicated, delayed and stale outcomes return through typed reconciliation.

## Required invariants

- A tick has one command authority. Pure and legacy controllers never both issue orders.
- Identical observation, prior state, configuration and seed produce identical ordered decisions.
- Accepted-but-not-yet-observed work is counted once through stable effect identity.
- Missing, late or duplicate outcomes cannot cause duplicate payment or world effects.
- A debug projection is read-only and cannot call a planner or live pathfinder.
- Destroyed, cross-scene or incompletely initialized actors are excluded from observations.
- Terminal match state stops new strategic intents and releases controller lifecycle resources.

## Source anchors

- Pure contracts and brain: `gameplay/src/lib/player/ai-controller/contracts/` and `brain/`
- Domain managers: `gameplay/src/lib/player/ai-controller/planning/`
- Runtime bridge: `phaser/src/lib/player/ai-controller/player-ai-controller.ts`
- Observation projection: `phaser/src/lib/player/ai-controller/observation/`
- Shared command application: `phaser/src/lib/world/services/multiplayer/`
- Protocol and server validation: `protocol/` and `server/`
