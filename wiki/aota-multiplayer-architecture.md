# AOTA Multiplayer Architecture (Probable Waffle)

This document is the long-term reference for how multiplayer works in **Ashes of the Ancients (AOTA)** inside Probable Waffle.
It is written for maintainers and future LLM-assisted changes.

---

## 1. Design model in one page

1. **Simulation model**: deterministic lockstep at 20 Hz.
2. **Authority model**:
  - Gameplay state is not server-simulated.
  - Server is a validator + relay.
  - Host coordinates operational flows (snapshot serving, desync correction, reseed).
3. **Commit model**:
  - Every human player must commit one batch per tick.
  - Empty batch is a valid commit (heartbeat/no-op).
4. **Recovery model**:
  - Reconnect uses host snapshot + command tail replay.
  - Desync uses hash mismatch detection and host-driven correction.

---

## 2. Source-of-truth code map

| Area                            | Primary files                                                                            |
|---------------------------------|------------------------------------------------------------------------------------------|
| Client lockstep core            | `apps/client/src/app/probable-waffle/game/world/services/command-bus.service.ts`         |
| Client snapshot/reconnect       | `apps/client/src/app/probable-waffle/game/world/services/recovery/reconnect.service.ts`  |
| Client desync/hash              | `apps/client/src/app/probable-waffle/game/world/services/recovery/state-hash.service.ts` |
| Client actor-id authority       | `apps/client/src/app/probable-waffle/game/world/services/actor-id-authority.service.ts`   |
| Server gateway relay policy     | `apps/api/src/app/probable-waffle/game-instance/game-instance.gateway.ts`                |
| Server event validation/state   | `apps/api/src/app/probable-waffle/game-instance/game-state-server.service.ts`            |
| Server command validation       | `apps/api/src/app/probable-waffle/game-instance/game-command-validator.service.ts`       |
| Server reconnect grace tracking | `apps/api/src/app/probable-waffle/game-instance/player-disconnect-tracker.service.ts`    |
| Shared event contracts          | `libs/api-interfaces/src/lib/communicators/probable-waffle/communicators.ts`             |

---

## 3. Core multiplayer loop

1. Local input enters `CommandBusService.dispatch`.
2. Command is scheduled for `currentTick + INPUT_DELAY_TICKS` (2 ticks).
3. On each sim tick, client sends one batch for future tick (possibly empty).
4. Server validates ownership/sequence/payload and relays:
  - valid batch → relay as-is
  - payload/sequence invalid but authoritative slot → relay empty batch commit
  - ownership/security violation → hard drop
5. Clients buffer by `(tick, playerNumber)`.
6. Tick advances only when all required human players committed for the next tick.

**Critical invariant:** apply order is deterministic (`playerNumber` ascending) on every client.

### Commit ownership invariant

For lockstep correctness, the protocol assumes exactly one authoritative commit stream per player:

- Every human player owns one commit stream.
- Every stream advances by canonical tick sequence.
- For any `(tick, playerNumber)` pair, there must be at most one authoritative committed batch.

This invariant is what keeps reconnect replay, retries, and validation behavior coherent.

### Sequence guarantees vs transport guarantees

- Determinism does **not** rely on socket message arrival order.
- Determinism relies on validated `(tick, playerNumber)` assembly plus lockstep barrier checks.
- Tick buffering absorbs normal arrival variance and late packets.

---

## 4. Relay and authority policy by communicator

| Communicator               | Sender authority                      | Server behavior                                            | Client expectation                     |
|----------------------------|---------------------------------------|------------------------------------------------------------|----------------------------------------|
| `game-command`             | Player owner (or host for AI players) | Validate + room-broadcast                                  | Commit echoed batch only               |
| `snapshot-request`         | Reconnecting client/spectator         | Room relay                                                 | Host answers                           |
| `snapshot-response`        | Current host only                     | Validate + **targeted delivery** to `targetUserId` sockets | Non-target peers never process it      |
| `instance-reseed`          | Current host only                     | Recreate missing in-memory instance                        | Used after backend restart/memory loss |
| `instance-reseed-required` | Server-originated                     | Room-broadcast                                             | Host reacts and reseeds                |
| `desync-alert`             | Current host only                     | Validate + room relay                                      | Opens recovery UI                      |
| `pause-changed`            | Valid actor/user only                 | Validate + room relay                                      | Pause reasons stack                    |

---

## 5. Host migration policy (current)

Host migration is implemented and expected to work during normal disconnect/leave flows:

1. If current host leaves/disconnects, server elects the lowest eligible connected human player.
2. Server updates `currentHostUserId` and broadcasts `host-migrated`.
3. New host takes over control-plane responsibilities (snapshot serving, desync coordination, AI command authority).

If no eligible replacement exists, migration is skipped (no synthetic host is created).

---

## 6. Reconnect flow (network drop)

1. Disconnect tracker starts grace timer (60s).
2. Peers receive `player-disconnected` and pause with reconnect reason.
3. Reconnected client rejoins room and requests snapshot.
4. Host sends snapshot + command tail.
5. Client snapshot-restore sequence:
  - pause
  - replace actors/state
  - fast-forward tick
  - `commandBus.resetAfterSnapshot(...)`
  - resume
6. Peers receive `player-reconnected` and clear reconnect pause.

If grace expires, server evicts and client lockstep set removes the player.

### Snapshot determinism boundary

Current snapshot payload includes:

- authoritative actor definitions/IDs (`actors`)
- simulation tick (`snapshot.tick`)
- per-player gameplay state (`playerStates`)
- control group state (`playerSelectionGroups`)
- research ownership (`playerResearch`)
- post-snapshot authoritative command tail (`commandTail`)

Current snapshot payload intentionally excludes presentation-only state (UI/interpolation/FX).

RNG/deterministic scheduler internals are not modeled as a dedicated top-level snapshot field.
The current design relies on actor/player/research state plus command-tail replay for correction.

---

## 7. Backend-restart reseed flow

1. Server receives an event for missing game instance.
2. Server emits `instance-reseed-required` to room.
3. Host submits `instance-reseed` payload (full instance data).
4. Server recreates instance, clears validator/history state, re-enables initial high tick bootstrap.
5. Normal reconnect/snapshot flow continues.

**Why host-only reseed:** without server simulation authority, coordinator must be stable and singular.

---

## 8. Desync detection and correction

1. Every second (20 ticks), each client emits deterministic state hash.
2. Host compares remote hash vs local hash.
3. On mismatch:
  - host sends correction snapshot to divergent player
  - if mismatch persists after grace window, host sends `desync-alert`
4. Recovery dialog flow handles wait/kick.

### Payload policy

- Steady-state hash traffic keeps diagnostics disabled to reduce room-wide payload cost.
- Mismatch reasoning falls back gracefully when diagnostics are absent.

---

## 9. Deterministic state vs presentation state

Deterministic state must converge across peers and affects gameplay outcomes:

- actor data used by sim commands and combat/economy processing
- player resources/housing/research
- command commit ordering/tick progression

Presentation state may differ safely and should not be treated as authority:

- particles/animations/audio timing
- UI-only widgets/dialog visibility
- interpolation/smoothing artifacts

Only deterministic state should influence lockstep validation, hashes, and snapshot correctness.

---

## 10. Method rationale (branch additions/changes)

| Method / block                                                    | Why it exists                                                                                                            |
|-------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| `GameInstanceGateway.emitTargetedActionToUser(...)`               | Prevent room-wide snapshot-response fan-out; send large snapshot payload only to requester sockets.                      |
| `GameStateServerService.getCurrentHostUserId(...)`                | Central host resolution for server-side authority checks (`snapshot-response`, `desync-alert`, reseed flows).            |
| `GameCommandValidatorService.allowInitialTickBootstrap(...)`      | Allows first post-reseed high tick so recreated instances do not fail sequence gate immediately.                         |
| `PlayerDisconnectTrackerService.getActiveSocketIdsForPlayer(...)` | Enables targeted relay to a user that may have multiple active sockets.                                                  |
| `SceneActorCreator.syncHostActorState()`                          | Immediate host actor-state sync after create/destroy to reduce validation races against actor index updates.             |
| `ActorIdAuthorityService.createDeterministicId(...)`              | Derives actor IDs from shared simulation context so all peers compute identical IDs without host seed patching.            |
| `StateHashService` diagnostics toggle                             | Reduces steady-state network volume by not shipping full diagnostics on every hash tick.                                 |

---

## 11. Anti-cheat and trust expectations

This architecture is intentionally not server-authoritative simulation.

- Primary goal: deterministic peer consistency and operational recovery.
- Server-side validation blocks obvious protocol abuse and ownership violations.
- Server-side validation is **not** equivalent to full anti-cheat authority.

Treat this as a medium-trust multiplayer model, not a zero-trust competitive authority model.

---

## 12. Guardrails for future changes

1. Do not add server-side simulation assumptions unless architecture is intentionally changed.
2. Do not bypass server echo for local command commits in multiplayer mode.
3. Any new command communicator must define:
  - authority (who may emit),
  - relay scope (room vs targeted vs ingestion-only),
  - lockstep effect (commit vs control-plane only).
4. Keep reconnect and desync pause reasons independent (`snapshot-restore`, `reconnect`, `desync`, `desync-correction`).
5. If you change actor identity generation, keep deterministic-ID basis stable across peers and preserve replay/snapshot IDs when explicitly provided.

---

## 13. LLM quick context

When editing AOTA multiplayer code, start from these invariants:

- Lockstep progresses by per-player tick commits, including empty commits.
- Determinism comes from validated tick assembly, not socket arrival order.
- Server validates and relays; it does not execute gameplay simulation.
- Host is coordinator for recovery control-plane actions.
- Snapshot-response is targeted; reseed is host-only.
- Reconnect and desync must preserve deterministic command ordering guarantees.
