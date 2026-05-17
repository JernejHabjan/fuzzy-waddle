# Probable Waffle — Netcode Reference

Canonical multiplayer/netcode reference. All paths described here are live code.

---

## Model: Deterministic Lockstep

- **20 Hz** fixed simulation tick (`TICK_INTERVAL_MS = 50ms`)
- **2-tick input delay** (`INPUT_DELAY_TICKS = 2` = 100ms window)
- Server is a **pure relay** — no simulation, no game state authority
- Every client runs the same simulation; correctness is enforced by hash comparison

Single-player uses the same code paths. All networking is a no-op when there are no peers
(communicators are `undefined`; `CommandBusService` skips buffering and dispatches immediately).

---

## Service layout (current)

- `game/world/services/command-bus.service.ts` — lockstep input delay, per-tick heartbeat, stall/unblock barrier
- `game/world/services/simulation-tick.service.ts` — deterministic 20 Hz tick + reason-based pause set
- `game/world/services/recovery/state-hash.service.ts` — periodic hash exchange + desync detection/escalation
- `game/world/services/recovery/snapshot.service.ts` — host snapshot capture/serve
- `game/world/services/recovery/reconnect.service.ts` — reconnect/snapshot restore on non-hosts
- `game/world/services/recovery/connection-recovery.service.ts` — reconnect pause UX + lockstep unblock on leave
- `game/world/services/recovery/desync-recovery.service.ts` — room-wide desync dialog flow (wait/kick)
- `game/world/services/recovery/host-migration.service.ts` — host handoff hooks
- `game/world/services/replay/replay-recorder.service.ts` — batch recording to replay saves
- `game/world/services/replay/replay-playback.service.ts` — deterministic replay batch injection

---

## Match Startup

```
All clients load scene
       │
       ▼
ReadyBarrier (each client)
  Non-host: sends "player.scene-ready" every 500ms until start
  Host:     counts received ready signals
       │
       │ all human players ready (or 30s timeout)
       ▼
Host sends sessionState = StartingTheGame
       │
  ┌────┴────────────────────────────────┐
  │ HUD: shows 3-2-1 countdown         │
  │ (Matchmaking / SelfHosted only)    │
  └────────────────────────────────────┘
       │ 3 seconds (real-time, cosmetic — sim not running yet)
       ▼
Host sends sessionState = InProgress
  → All clients resume scene → simulation starts
```

Non-host clients do **not** send `InProgress` — they wait for the host broadcast.

---

## Core Command Loop (per tick)

```
Player clicks / AI decision
       │
       ▼
CommandBusService.dispatch(command)
  ├─ SP:  stamp tick=now, emit on command$ immediately
  └─ MP:  stamp executionTick = currentTick + 2
          queue in pendingOutbound[executionTick]

       │
       ▼  (on every tick T)
CommandBusService sends batch for tick T+2 over socket
  (even if empty — empty batch = lockstep heartbeat)

       │
       ▼
Server (NestJS gateway)
  ├─ validate (see Server Validations below)
  └─ relay batch to all clients in the room

       │
       ▼
All clients receive batch → buffer[tick][playerNumber]

       │
       ▼  (before advancing to tick T+1)
Bus checks: has every human player committed for T+1?
  ├─ YES → flush commands in playerNumber order → command$ → systems execute
  └─ NO  → pauseTick("lockstep") → sim stalls until missing batch arrives
            (stall logged after 150ms)
```

Commands are flushed in **ascending playerNumber order** on every client — this is
the determinism guarantee. Same inputs, same order, same result.

---

## Simulation Tick

`SimulationTickService` emits `tick$` at 20 Hz via `setInterval`.

**Pause reasons** (string keys in a `Set` — sim stalls while Set is non-empty):

| Reason              | Who sets it                         | Who clears it                          |
|---------------------|-------------------------------------|----------------------------------------|
| `lockstep`          | CommandBusService (missing batch)   | CommandBusService (batch arrived)      |
| `player`            | PauseSyncService (in-game pause)    | PauseSyncService (resume)              |
| `reconnect`         | ConnectionRecoveryService           | ConnectionRecoveryService              |
| `snapshot-restore`  | ReconnectService.applySnapshot()    | ReconnectService.applySnapshot()       |
| `desync`            | DesyncRecoveryService               | DesyncRecoveryService / ReconnectService |
| `desync-correction` | ReconnectService (desync path)      | ReconnectService                       |

Multiple reasons can stack. Sim resumes only when all are cleared.

---

## Desync Detection

`StateHashService` — active in multiplayer only.

- Every **20 ticks (1 second)** compute a hash of all actor states
- Hash scope per actor: `{id, health, tileX, tileY, owner}` — actors sorted by ID
- Hash is broadcast to all peers via `stateHashChanged` communicator

```
Tick 20: local hash computed + sent to peers
                │
  peer hash arrives (usually within 1–2 ticks)
                │
       ┌────────┴──────────┐
       │ match             │ mismatch
       │                   ▼
       ✓       PendingCorrection created
               5s grace period (allows late hashes to land)
                │
                │ still mismatched after 5s
                ▼
       Host broadcasts desync-alert → DesyncRecoveryService
```

On mismatch: desynced client shows a red "DESYNC" text overlay immediately.

---

## Desync Recovery

```
Host broadcasts desync-alert (tick, playerNumber, reason)
       │
       ▼
ALL clients: pauseTick("desync") + show DesyncRecoveryDialog

Dialog options:
  ┌── Wait ─────────────────────────────────────────────────────────────────┐
  │  Host:                  resends correction snapshot to desynced client   │
  │  Desynced non-host:     requests correction snapshot from host           │
  │                         15s stall guard armed (timeout → force-resume)  │
  │  Other clients:         resumeTick("desync") immediately                 │
  └─────────────────────────────────────────────────────────────────────────┘
  ┌── Kick ─────────────────────────────────────────────────────────────────┐
  │  Sends playerLeft event for the desynced player                         │
  │  All clients: resumeTick("desync")                                      │
  └─────────────────────────────────────────────────────────────────────────┘

When correction snapshot arrives on desynced client:
  ReconnectService.applySnapshot() → destroy actors → recreate → fast-forward tick
  → resumeTick("desync-correction") + resumeTick("desync")
  → "reconnect-snapshot-applied" event → 15s stall guard cancelled
```

Anti-grief: at most 1 forced desync pause per 60s, at most 3 per match.

---

## Reconnect Flow

```
Socket drops (network / tab backgrounded)
       │
       ▼
Client: "local-connection-lost" scene event
Server: starts 60s grace timer (PlayerDisconnectTrackerService)

Other clients:
  ConnectionRecoveryService shows "Player X disconnected" dialog
  pauseTick("reconnect") — sim waits

       │
       │  socket reconnects (Socket.IO auto-reconnect)
       ▼
Client re-joins socket.io room
  → requests full snapshot from host (reason = "reconnect")

       │
       ▼
Host SnapshotService captures full state + command tail (last 1024 batches)
  → sends snapshotResponse to reconnecting client

       │
       ▼
ReconnectService.applySnapshot():
  pauseTick("snapshot-restore")
  destroy all actors → recreate from snapshot
  restore player state / selection groups / research
  fastForwardTo(snapshot.tick)
  resetAfterSnapshot(commandBus, commandTail)
  resumeTick("snapshot-restore")
  emits "reconnect-snapshot-applied"

ConnectionRecoveryService:
  receives player-reconnected event → resumeTick("reconnect") → dialog closes
```

If the 60s grace timer expires without reconnect → server broadcasts playerLeft
→ `CommandBusService.removePlayerFromLockstep(playerNumber)` — game continues without them.

---

## Explicit Quit vs Network Drop

| Event                          | Server side                        | Client side                      |
|--------------------------------|------------------------------------|----------------------------------|
| Tab close / navigate away      | Socket fires "leave" room event    | Grace timer cancelled immediately; playerLeft broadcast at once |
| Network drop / crash           | Only socket disconnect fires       | 60s grace timer; reconnect window open |

---

## Host Migration

- If host socket disconnects, server elects the lowest remaining playerNumber as new host
- Broadcasts `host-migrated` event with `newHostUserId`
- All clients update `scene.isHost`
- AI command ownership transfers to new host (AI commands are validated per `currentHostUserId`)
- New host resumes snapshot-serving responsibilities

---

## Server Validations

Server rejects batches silently (no relay). What the client sees: **the batch is never applied**.
In multiplayer lockstep this means other clients committed for that tick but the source player's
batch never arrives → `pauseTick("lockstep")` stall on all peers → visible freeze.

| Validation              | Limit / rule                                              |
|-------------------------|-----------------------------------------------------------|
| **Ownership**           | JWT user must own the playerNumber (or be host for AI)    |
| **Rate limit**          | Max 40 batches/player/second (sliding window)             |
| **Sequence**            | Tick must advance; max jump of 10 ticks forward           |
| **Batch size**          | Max 100 commands per batch                                |
| **Actor IDs**           | actorIds must be non-empty, ≤100; each must exist in server's actor index |
| **Actor ownership**     | Each actor's ownerId must match the submitting playerNumber |
| **Command type**        | Must be one of: MOVE, ACTOR_ACTION, STOP, PRODUCTION, CANCEL_PRODUCTION, RESEARCH, CANCEL_RESEARCH |
| **Payload fields**      | Type-specific field checks (vectors, queue flag, actorName, researchType) |

**Frontend effect of a rejected batch:**  
The sending client never receives its own batch echoed back. Its command is silently lost.
Other clients stall on `"lockstep"` waiting for the missing tick. After ~150ms the stall is
logged as a warning. After the stall resolves via an empty heartbeat (if any), the commands
are simply absent — actors don't move.

---

## Replay

- `ReplayRecorderService` records every committed command batch (tick + playerNumber + commands)
- Format: `{ version: "lockstep-v1", seed, batches[] }`
- Replay = replay seed + replay feed to `CommandBusService` at correct ticks
- `ReplayPlaybackService` validates version string against `SUPPORTED_REPLAY_COMPATIBILITY_VERSIONS`
- Version dictionary allows old replays to play on newer compatible builds

---

## Single-Player

All networking is **skipped entirely**:
- Communicators resolve to `undefined` (local-only transport)
- `CommandBusService.dispatch()` executes immediately at `currentTick` (no delay, no buffer)
- `StateHashService`, `ReconnectService`, `DesyncRecoveryService` — all no-ops
- Session state advances without waiting for `ReadyBarrier` network signals
- No gameplay events reach the server socket
