# Probable Waffle Multiplayer README

Lean handoff for future LLM work. This is a branch review against `develop`, using the original multiplayer request as the target design.

## Branch status in one sentence

The branch implements a large multiplayer stack and fixes many real desync/reconnect issues, but the resulting model is still **deterministic lockstep with small input delay plus snapshot correction**, not the originally requested **optimistic predict-and-correct** model.

## What is implemented

- Central multiplayer command relay via `CommandBusService`
- Fixed-step simulation via `SimulationTickService` at 20 Hz
- Host-seeded initial actor ID reconciliation via `ActorIdSeeder`
- Ready barrier before match start via `ReadyBarrier`
- Periodic state hashing and desync diagnostics via `StateHashService`
- Full host snapshots for reconnect/desync correction via `SnapshotService` and `ReconnectService`
- Replay recording/playback around command batches
- Host migration hooks
- Separate reconnect and desync recovery dialogs
- Single-player transport is now local-only and does not relay gameplay traffic to the server

## What is implemented differently from the original request

1. **Netcode model mismatch**
   - Current branch: small input-delay lockstep (`INPUT_DELAY_TICKS = 2`) with command buffering and stall-on-missing-peer.
   - Requested model: local optimistic execution with correction if authoritative ordering differs.
   - Consequence: this branch is safer for determinism, but it still accepts click/input latency instead of true predict-and-correct.

2. **Startup flow still uses real-time countdown logic**
   - `SceneGameState` pauses the scene on `MovingPlayersToGame` and advances to `InProgress` with `setTimeout(..., 3000)`.
   - This is not driven by `SimulationTickService`, so startup countdown/pause is still outside the deterministic tick path.
   - HUD countdown visibility was reduced for offline modes, but the underlying 3-second startup delay logic still exists.

3. **Recovery is snapshot-first, not rollback**
   - Divergence is detected by hashes, then corrected with a host snapshot.
   - This is a teleport-and-restore flow, not rollback/re-sim.

## How reconnect and state restore work now

1. A reconnecting or desynced client requests a snapshot from the host.
2. The host captures the full actor/player/research state.
3. The server appends a `commandTail` from recent relayed command history.
4. The client pauses, destroys local actors, recreates actors from the snapshot, restores player state, fast-forwards sim tick, resets `CommandBusService`, re-buffers command tail, then resumes.

## Why the game can still "freeze"

These are the main freeze/stall classes that still matter:

1. **Lockstep waiting on the wrong player set**
   - `CommandBusService.humanPlayerNumbers` is initialized once and then used forever.
   - If a player leaves/disconnects/host-migrates and that list is not updated correctly, the bus can keep waiting for batches from a player who should no longer block progression.

2. **Pause reasons stack**
   - `SimulationTickService` pauses by string reasons stored in a `Set`.
   - If reconnect/desync/lockstep/startup pauses are not resumed symmetrically, the tick stays paused even after one recovery path completes.

3. **Startup uses scene pause + `setTimeout`**
   - Match start is still controlled by scene pause/resume and real-time timeout, not by the same simulation barrier primitive used elsewhere.

4. **Desync is often a symptom, not the root cause**
   - Snapshot correction can recover a client, but if the root deterministic bug remains, the same actor can drift again and trigger another correction or stall.

## Confirmed high-risk problems still on the branch

> **Updated**: Items 1–4 below have been fixed. Items 5 and 6 remain open.

1. ~~**AI command ownership likely fails on the server**~~ **FIXED**
   - Server now allows the current host to submit commands for AI-owned slots (userId=null).

2. ~~**Static lockstep participant set**~~ **FIXED**
   - `CommandBusService` now removes players from the blocking set on graceful leave and
     on permanent eviction (`reconnectWindowSeconds === 0`).

3. ~~**Reconnect history window is small**~~ **FIXED**
   - `COMMAND_HISTORY_LIMIT` increased from 256 to 1024 (~51 s at 20 Hz); overflow now logged.

4. ~~**Startup sequencing not fully deterministic**~~ **FIXED**
   - `SceneGameState` now skips the 3-second `setTimeout` for non-networked modes
     (Skirmish / InstantGame / Replay); only Matchmaking and SelfHosted wait.

5. **Actor seed reconciliation is still heuristic**
   - `ActorIdSeeder` matches by `(name, owner, logical position)`.
   - Better than GUID divergence, but still brittle if multiple neutral/environment actors
     share equivalent keys or if authored map/runtime state drifts before reconciliation.

6. **Movement tween completion timing is nondeterministic** *(new finding)*
   - `movement.system.ts` uses Phaser tweens for tile-to-tile animation. Tween durations are
     in real-time milliseconds; the `onComplete` fires at a wall-clock time, not a fixed tick.
   - Result: the tick at which a unit "arrives" at the next tile and starts chasing the next
     waypoint can differ by 1 tick between clients.
   - Fix path: drive tile arrival via `waitForSimulationDuration` (already exists in
     `simulation-time.ts`) and use tweens only for visual interpolation between logical
     tile positions. This is a non-trivial refactor.

## Medium-risk / likely remaining divergence sources

- Attack hit/fire delays were using `scene.time.delayedCall` (real-time). **FIXED** — now use
  `CancelableSimDelay` (in `simulation-time.ts`) which fires at the correct simulation tick.
- Movement/pathfinding tile-arrival timing — see item 6 above (open).
- `Math.random()` in movement sound selection and some spell audio is cosmetic-only; does not
  affect simulation state.
- Ambient/random actor behavior was reduced, but this is mitigation, not proof.
- Spectator behavior and fog-of-war semantics still need explicit validation.

## What is already good

- The branch now has a clear central command path instead of fully scattered ad hoc action sync.
- State-hash diagnostics are much better than before and actually useful for narrowing the first mismatch.
- Reconnect/desync recovery is materially better than the earlier broken versions.
- Single-player now uses local-only communicators instead of leaking gameplay events to the server.

## Recommended next steps

1. **Decide whether to keep lockstep or rework toward true predict-and-correct**
   - If the original product intent still stands, this is the biggest architectural gap.

2. **Fix AI ownership validation**
   - Allow host-issued commands for AI players, or model AI ownership explicitly on the server.

3. **Make lockstep participant tracking dynamic**
   - Update the blocking player set when players disconnect, reconnect, leave, or host migration changes responsibilities.

4. **Move startup sequencing onto simulation time**
   - Replace the real-time `setTimeout` startup countdown with a sim-tick-based transition.

5. **Harden reconnect restoration**
   - Increase command history coverage or make snapshot/tail semantics explicit enough that reconnect cannot silently restore an incomplete state.

6. **Continue the determinism audit**
   - Focus on movement, projectiles, targeting, and any remaining gameplay-affecting wall-clock/frame-time logic.

## Future LLM prompt starter

Use this branch as a partially working lockstep-based multiplayer implementation, not as a finished answer to the original prompt.

Priorities:

- preserve the thin-server model
- treat commands as the network truth
- keep single-player as a no-op networking path
- fix freezes by auditing participant tracking and pause reasons
- fix AI command ownership on the server
- decide whether to stay with lockstep+correction or rework to true optimistic predict-and-correct
- continue the determinism audit, especially movement/combat
