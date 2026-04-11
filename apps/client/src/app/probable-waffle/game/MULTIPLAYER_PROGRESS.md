# Multiplayer Replication Progress

## Open questions / blockers
- Build placement, pause commands, control groups, and real desync correction are still outstanding.

## Steps

| # | Status | What |
|---|--------|------|
| 01 | [x] | **CommandBus service** – central command dispatcher; wire PlayerActionsHandler + GameObjectActionAssigner → CommandBus; MovementSystem + ActionSystem subscribe to CommandBus; remove scattered `emitEventIssueActorCommandToSelectedActors` / `emitEventIssueMoveCommandToSelectedActors` |
| 02 | [x] | **Remove HealthComponent state-sync** – delete `sendActorEvent` calls for health/armor from HealthComponent (health is now a derived outcome, not a pushed delta); remove the old `ComponentSyncSystem` scaffolding |
| 03 | [x] | **Fixed-timestep SimulationTickService** – 20 Hz deterministic tick from scene UPDATE; CommandBus stamps commands; single-player keeps zero input delay |
| 04 | [x] | **Initial actor ID seeding** – host generates IDs in `spawnFromSpawnList`, broadcasts seed map `[{spawnIndex, actorId}]`; non-host blocks until seed arrives then uses provided IDs |
| 05 | [x] | **`pauseUntilAllPlayersAreReady` barrier** – replace 100ms setTimeout hack with `ReadyBarrier`: each client sends `player.scene-ready`, host waits for all acks then broadcasts `StartingTheGame`; reusable primitive |
| 06 | [x] | **Command relay over socket** – add `game-command` communicator type; `GameCommandCommunicator` in `ProbableWaffleCommunicatorService`; 2-tick input delay in MP; per-tick command buffer; stall before advancing tick until all players' commands are buffered |
| 07 | [x] | **Server-side validation** – gateway validates playerNumber ownership, enforces per-player seqNum monotonicity, rate-limits (≤30 cmds/tick), rejects unknown command types |
| 08 | [x] | **AI command relay** – `PlayerAiController` (host-only, already gated) emits orders through CommandBus with `playerNumber = AI player`; other clients receive and apply them identically |
| 09 | [x] | **Desync hash** – every 60 ticks hash `{id, health, logicalPos, owner}` for all actors; exchange via new `state-hash` communicator event; server or host compares; log mismatch with player/tick/subsystem; show visual indicator |
| 10 | [x] | **Desync recovery dialog** – after confirmed hash mismatch: 5s grace, then pause all + show "Player X desynced – Kick / Wait"; teleport correction; anti-grief: 1 pause/60s per player, 3 pauses/match max |
| 11 | [x] | **Snapshot serialisation** – `SnapshotService`: full state blob (actors + playerState + tickNumber); host refreshes every 60s; basis for reconnect + spectator join |
| 12 | [x] | **Reconnect flow** – server holds slot 60s; rejoining client re-joins the room, requests a fresh targeted snapshot, rebuilds from snapshot, and resumes at the host tick; distinguish disconnect (timeout/network) vs quit (unload event) |
| 13 | [x] | **Spectator support** – spectators receive command stream, never emit; on mid-match join they request a targeted host snapshot; no fog-of-war for spectators |
| 14 | [x] | **Replay recording/playback** – `ReplayRecorder` writes `{version, compatibilityVersion, mapId, seed, players, commands[]}` into replay records; playback reseeds from `rndSeed` and feeds recorded command batches back through `CommandBusService` at their original ticks |
| 15 | [x] | **Host migration** – on host disconnect server elects the lowest connected human player number, broadcasts `host-migrated`, updates `currentHostUserId`, and the promoted client starts host-only AI/snapshot duties |
| 16 | [x] | **Queue actions through CommandBus** – production/research start + cancel become deterministic commands consumed by buildings instead of direct local UI/AI method calls |
| 17 | [ ] | **Server-side queue validation** – validate production/research queue payloads against actor ownership and building capabilities |
| 18 | [ ] | **Pause / resume commands** – turn pause into a relayed player command with cooldown/limit enforcement |
| 19 | [ ] | **Control groups in MP** – sync assign/recall commands while leaving local camera/selection visuals local |
| 20 | [ ] | **Desync correction** – snapshot-backed host correction instead of pause-only detection |
| 21 | [ ] | **Hash widening + determinism audit** – include economy/research/queues in hashes and remove multiplayer-relevant nondeterminism |

## Completed steps
- **01** Added `CommandBusService` (RxJS Subject) + `GameCommand` union (`MOVE | ACTOR_ACTION | STOP`). Rewired all 5 dispatch sites and 2 system subscribers. Removed `emitEventIssueActorCommandToSelectedActors` / `emitEventIssueMoveCommandToSelectedActors` from scene-data. Shift-key state now captured at dispatch time, not receive time.
- **02** Finished the cleanup fully: `HealthComponent` now owns its own health/armor change reactions directly and the old `ComponentSyncSystem` / sync-options proxy scaffolding is gone.
- **03** Added `SimulationTickService` (20 Hz from Phaser UPDATE, `tick$`, `pauseTick`/`resumeTick`). CommandBus stamps tick at dispatch time. SP executes immediately, MP delays by INPUT_DELAY_TICKS=2.
- **04** Added `ActorIdSeeder`; host-only calls `saveAllKnownActorsToGameState()`; non-host matches by (name, ownerNumber, x*10, y*10) and patches `IdComponent.id`.
- **05** Added `ReadyBarrier`; replaced broken 100ms setTimeout in `SceneGameState.listen()`; added `player.scene-ready` communicator event.
- **06** Added `game-command` TwoWayCommunicator; rewrote `CommandBusService` with MP path (INPUT_DELAY_TICKS=2, per-tick heartbeat, lockstep stall). Added `CommandBuffer` (per-tick per-player map).
- **07** Added `GameCommandValidatorService` on API: ownership, monotonic sequence, rate-limit (40/s), schema. Wired into `GameStateServerService`.
- **08** Added `dispatchAiOrder` utility; `PlayerAiControllerAgent` routes all 5 order-setting sites through CommandBus instead of directly mutating pawn blackboards. Non-host clients apply AI commands via existing `ActionSystem` → pawn blackboard path.
- **09** Added `StateHashService`: djb2 hash of all actors (`id:health:lx:ly:owner`) every 60 ticks; broadcasts via new `state-hash` TwoWayCommunicator (MP only); each client compares incoming peer hashes against its local stored hash for that tick; mismatch → `console.error([DESYNC] tick/player/local/remote)` + small inline Phaser overlay + `allScenes.emit("desync-detected")`. Added `ProbableWaffleStateHashEvent` interface; server relays without processing.
- **10** Added `DesyncRecoveryDialog` (Phaser scene + `.scene` file, follows `GameActionsLayer` pattern); `DesyncRecoveryService` subscribes to `"desync-detected"` on `allScenes`, 5s grace period, anti-grief (1 pause/60s, max 3/match), pauses sim tick then shows dialog; Wait → resume, Kick → warn + resume (kick networking deferred to step 12). Registered `DesyncRecoveryDialog` in `game-config.ts`; wired `DesyncRecoveryService` into `HudProbableWaffle.initializeWithParentScene`. Added `"desync-detected"` to `AllScenesEventData` union.
- **11** Added `ProbableWaffleSnapshotData` interface + `"snapshot-request"` / `"snapshot-response"` communicator types. `SnapshotService` runs on host only: captures actors via `ActorManager.getActorDefinitionFromActor`, player states (deep-clone), and `playerResearch` every 60 s (plus 500ms after spawn). Serves snapshot on `snapshot-request` via `snapshot-response`. Server relays both events without processing.
- **12** Added server-side `PlayerDisconnectTrackerService` with a 60s reconnect grace window. `GameInstanceGateway` now distinguishes disconnect vs explicit leave, broadcasts `player-disconnected` / `player-reconnected`, and rejoining clients use `ReconnectService` to re-enter the room and request a fresh host snapshot targeted to that user before resuming simulation.
- **13** Spectators are now read-only in-scene: `CommandBusService` drops spectator dispatches, `PlayerActionsHandler` ignores command hotkeys/click-to-order/delete paths, and `ReconnectService` requests an initial targeted snapshot for spectator catch-up. `GameProbableWaffleScene` also skips `FogOfWarComponent` for spectators so they see the full map.
- **14** Added replay metadata to `startOptions` and two services: `ReplayRecorderService` records deterministic command batches from `CommandBusService` into replay saves, while `ReplayPlaybackService` re-injects those batches on their recorded ticks in replay mode. Replay records are stored through the existing storage backend and the load/replay UIs now split save files from replay files by game type.
- **15** Added `currentHostUserId` to metadata and a server-side host election path in `GameInstanceGateway`/`GameInstanceService`: when the current host leaves or disconnects, the server promotes the lowest connected human player number, emits metadata + `host-migrated`, and the promoted client starts snapshot serving plus AI controllers through `HostMigrationService`.
- **07** Tightened server validation beyond the original thin guardrails: command checks now validate actor capability, target existence, and isometric tile/world consistency instead of a blunt coordinate cap, while a new `PlayerStateValidatorService` rejects impossible resource spends, unexplained resource gains, invalid housing deltas, and selection spoofing on mirrored player-state events.
- **16** Production/research queue actions now use explicit `PRODUCTION | CANCEL_PRODUCTION | RESEARCH | CANCEL_RESEARCH` commands. UI queue clicks, hotkeys, and host-only AI all route through `CommandBusService`, `QueueCommandSystem` executes them on the targeted building, and the API now accepts and sanity-checks those command types.
