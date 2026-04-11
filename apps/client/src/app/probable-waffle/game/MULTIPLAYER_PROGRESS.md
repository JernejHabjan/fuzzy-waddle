# Multiplayer Replication Progress

## Open questions / blockers
- None at start. Update as they arise.

## Steps

| # | Status | What |
|---|--------|------|
| 01 | [x] | **CommandBus service** – central command dispatcher; wire PlayerActionsHandler + GameObjectActionAssigner → CommandBus; MovementSystem + ActionSystem subscribe to CommandBus; remove scattered `emitEventIssueActorCommandToSelectedActors` / `emitEventIssueMoveCommandToSelectedActors` |
| 02 | [x] | **Remove HealthComponent state-sync** – delete `sendActorEvent` calls for health/armor from HealthComponent (health is now a derived outcome, not a pushed delta); keep ComponentSyncSystem for future hashing |
| 03 | [x] | **Fixed-timestep SimulationTickService** – 20 Hz deterministic tick from scene UPDATE; CommandBus stamps commands; single-player keeps zero input delay |
| 04 | [x] | **Initial actor ID seeding** – host generates IDs in `spawnFromSpawnList`, broadcasts seed map `[{spawnIndex, actorId}]`; non-host blocks until seed arrives then uses provided IDs |
| 05 | [x] | **`pauseUntilAllPlayersAreReady` barrier** – replace 100ms setTimeout hack with `ReadyBarrier`: each client sends `player.scene-ready`, host waits for all acks then broadcasts `StartingTheGame`; reusable primitive |
| 06 | [x] | **Command relay over socket** – add `game-command` communicator type; `GameCommandCommunicator` in `ProbableWaffleCommunicatorService`; 2-tick input delay in MP; per-tick command buffer; stall before advancing tick until all players' commands are buffered |
| 07 | [x] | **Server-side validation** – gateway validates playerNumber ownership, enforces per-player seqNum monotonicity, rate-limits (≤30 cmds/tick), rejects unknown command types |
| 08 | [x] | **AI command relay** – `PlayerAiController` (host-only, already gated) emits orders through CommandBus with `playerNumber = AI player`; other clients receive and apply them identically |
| 09 | [x] | **Desync hash** – every 60 ticks hash `{id, health, logicalPos, owner}` for all actors; exchange via new `state-hash` communicator event; server or host compares; log mismatch with player/tick/subsystem; show visual indicator |
| 10 | [x] | **Desync recovery dialog** – after confirmed hash mismatch: 5s grace, then pause all + show "Player X desynced – Kick / Wait"; teleport correction; anti-grief: 1 pause/60s per player, 3 pauses/match max |
| 11 | [x] | **Snapshot serialisation** – `SnapshotService`: full state blob (actors + playerState + tickNumber); host refreshes every 60s; basis for reconnect + spectator join |
| 12 | [ ] | **Reconnect flow** – server holds slot 60s; rejoining client requests snapshot + delta commands; rebuilds from snapshot then catches up; distinguish disconnect (timeout/network) vs quit (unload event) |
| 13 | [ ] | **Spectator support** – spectators receive command stream, never emit; on mid-match join host sends snapshot; no fog-of-war for spectators |
| 14 | [ ] | **Replay recording/playback** – `ReplayRecorder` writes `{version, mapId, seed, players, commands[{tick,cmd}]}`; playback reseeds RandomService and feeds commands at ticks; version field + compatibility dict |
| 15 | [ ] | **Host migration** – on host disconnect server elects new host (lowest playerNumber), broadcasts `host-migrated`; add `currentHostUserId` to metadata; new host spins up `AiPlayerHandler`; `isHost` uses `currentHostUserId` |

## Completed steps
- **01** Added `CommandBusService` (RxJS Subject) + `GameCommand` union (`MOVE | ACTOR_ACTION | STOP`). Rewired all 5 dispatch sites and 2 system subscribers. Removed `emitEventIssueActorCommandToSelectedActors` / `emitEventIssueMoveCommandToSelectedActors` from scene-data. Shift-key state now captured at dispatch time, not receive time.
- **03** Added `SimulationTickService` (20 Hz from Phaser UPDATE, `tick$`, `pauseTick`/`resumeTick`). CommandBus stamps tick at dispatch time. SP executes immediately, MP delays by INPUT_DELAY_TICKS=2.
- **04** Added `ActorIdSeeder`; host-only calls `saveAllKnownActorsToGameState()`; non-host matches by (name, ownerNumber, x*10, y*10) and patches `IdComponent.id`.
- **05** Added `ReadyBarrier`; replaced broken 100ms setTimeout in `SceneGameState.listen()`; added `player.scene-ready` communicator event.
- **06** Added `game-command` TwoWayCommunicator; rewrote `CommandBusService` with MP path (INPUT_DELAY_TICKS=2, per-tick heartbeat, lockstep stall). Added `CommandBuffer` (per-tick per-player map).
- **07** Added `GameCommandValidatorService` on API: ownership, monotonic sequence, rate-limit (40/s), schema. Wired into `GameStateServerService`.
- **08** Added `dispatchAiOrder` utility; `PlayerAiControllerAgent` routes all 5 order-setting sites through CommandBus instead of directly mutating pawn blackboards. Non-host clients apply AI commands via existing `ActionSystem` → pawn blackboard path.
- **09** Added `StateHashService`: djb2 hash of all actors (`id:health:lx:ly:owner`) every 60 ticks; broadcasts via new `state-hash` TwoWayCommunicator (MP only); each client compares incoming peer hashes against its local stored hash for that tick; mismatch → `console.error([DESYNC] tick/player/local/remote)` + small inline Phaser overlay + `allScenes.emit("desync-detected")`. Added `ProbableWaffleStateHashEvent` interface; server relays without processing.
- **10** Added `DesyncRecoveryDialog` (Phaser scene + `.scene` file, follows `GameActionsLayer` pattern); `DesyncRecoveryService` subscribes to `"desync-detected"` on `allScenes`, 5s grace period, anti-grief (1 pause/60s, max 3/match), pauses sim tick then shows dialog; Wait → resume, Kick → warn + resume (kick networking deferred to step 12). Registered `DesyncRecoveryDialog` in `game-config.ts`; wired `DesyncRecoveryService` into `HudProbableWaffle.initializeWithParentScene`. Added `"desync-detected"` to `AllScenesEventData` union.
- **11** Added `ProbableWaffleSnapshotData` interface + `"snapshot-request"` / `"snapshot-response"` communicator types. `SnapshotService` runs on host only: captures actors via `ActorManager.getActorDefinitionFromActor`, player states (deep-clone), and `playerResearch` every 60 s (plus 500ms after spawn). Serves snapshot on `snapshot-request` via `snapshot-response`. Server relays both events without processing.
