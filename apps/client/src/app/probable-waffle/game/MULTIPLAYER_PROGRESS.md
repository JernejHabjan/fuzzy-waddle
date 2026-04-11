# Multiplayer Replication Progress

## Open questions / blockers
- None at start. Update as they arise.

## Steps

| # | Status | What |
|---|--------|------|
| 01 | [x] | **CommandBus service** – central command dispatcher; wire PlayerActionsHandler + GameObjectActionAssigner → CommandBus; MovementSystem + ActionSystem subscribe to CommandBus; remove scattered `emitEventIssueActorCommandToSelectedActors` / `emitEventIssueMoveCommandToSelectedActors` |
| 02 | [ ] | **Remove HealthComponent state-sync** – delete `sendActorEvent` calls for health/armor from HealthComponent (health is now a derived outcome, not a pushed delta); keep ComponentSyncSystem for future hashing |
| 03 | [ ] | **Fixed-timestep SimulationTickService** – 20 Hz deterministic tick from scene UPDATE; CommandBus stamps commands; single-player keeps zero input delay |
| 04 | [ ] | **Initial actor ID seeding** – host generates IDs in `spawnFromSpawnList`, broadcasts seed map `[{spawnIndex, actorId}]`; non-host blocks until seed arrives then uses provided IDs |
| 05 | [ ] | **`pauseUntilAllPlayersAreReady` barrier** – replace 100ms setTimeout hack with `ReadyBarrier`: each client sends `player.scene-ready`, host waits for all acks then broadcasts `StartingTheGame`; reusable primitive |
| 06 | [ ] | **Command relay over socket** – add `game-command` communicator type; `GameCommandCommunicator` in `ProbableWaffleCommunicatorService`; 2-tick input delay in MP; per-tick command buffer; stall before advancing tick until all players' commands are buffered |
| 07 | [ ] | **Server-side validation** – gateway validates playerNumber ownership, enforces per-player seqNum monotonicity, rate-limits (≤30 cmds/tick), rejects unknown command types |
| 08 | [ ] | **AI command relay** – `PlayerAiController` (host-only, already gated) emits orders through CommandBus with `playerNumber = AI player`; other clients receive and apply them identically |
| 09 | [ ] | **Desync hash** – every 60 ticks hash `{id, health, logicalPos, owner}` for all actors; exchange via new `state-hash` communicator event; server or host compares; log mismatch with player/tick/subsystem; show visual indicator |
| 10 | [ ] | **Desync recovery dialog** – after confirmed hash mismatch: 5s grace, then pause all + show "Player X desynced – Kick / Wait"; teleport correction; anti-grief: 1 pause/60s per player, 3 pauses/match max |
| 11 | [ ] | **Snapshot serialisation** – `SnapshotService`: full state blob (actors + playerState + tickNumber); host refreshes every 60s; basis for reconnect + spectator join |
| 12 | [ ] | **Reconnect flow** – server holds slot 60s; rejoining client requests snapshot + delta commands; rebuilds from snapshot then catches up; distinguish disconnect (timeout/network) vs quit (unload event) |
| 13 | [ ] | **Spectator support** – spectators receive command stream, never emit; on mid-match join host sends snapshot; no fog-of-war for spectators |
| 14 | [ ] | **Replay recording/playback** – `ReplayRecorder` writes `{version, mapId, seed, players, commands[{tick,cmd}]}`; playback reseeds RandomService and feeds commands at ticks; version field + compatibility dict |
| 15 | [ ] | **Host migration** – on host disconnect server elects new host (lowest playerNumber), broadcasts `host-migrated`; add `currentHostUserId` to metadata; new host spins up `AiPlayerHandler`; `isHost` uses `currentHostUserId` |

## Completed steps
- **01** Added `CommandBusService` (RxJS Subject) + `GameCommand` union (`MOVE | ACTOR_ACTION | STOP`). Rewired all 5 dispatch sites and 2 system subscribers. Removed `emitEventIssueActorCommandToSelectedActors` / `emitEventIssueMoveCommandToSelectedActors` from scene-data. Shift-key state now captured at dispatch time, not receive time.
