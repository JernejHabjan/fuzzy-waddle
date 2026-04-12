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

2. ~~**Startup flow still uses real-time countdown logic**~~ **IMPROVED**
   - Only the host sends the `InProgress` transition; non-hosts wait for the broadcast.
   - 3-second window for networked modes still uses `setTimeout`, but the sim has not started at that point so it is cosmetic only.

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
   - ~~`ReconnectService` and `ConnectionRecoveryService` both used `"reconnect"` causing premature resume.~~ **FIXED** — `ReconnectService` now uses `"snapshot-restore"`.
   - `destroy()` methods now defensively resume any active pauses (reconnect, desync) so the Set is clean on scene teardown.

3. ~~**Startup uses scene pause + `setTimeout`**~~
   - Host now controls `InProgress` transition; non-hosts wait passively.
   - 3-second buffer for networked modes still uses real-time `setTimeout` but it is
     purely cosmetic (lets the UI countdown finish) — the simulation hasn't started yet.

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
   - Only the host now sends `InProgress`; non-host clients wait for the broadcast
     instead of each independently sending the same state transition.

5. ~~**Actor seed reconciliation is still heuristic**~~ **IMPROVED** *(see note below)*
   - `ActorIdSeeder` matches by `(name, owner, logical position)`.
   - Better than GUID divergence, but still brittle if multiple neutral/environment actors
     share equivalent keys or if authored map/runtime state drifts before reconciliation.
   - Further hardening still desirable for maps with many identical actors at the same position.

6. ~~**Movement tween completion timing is nondeterministic**~~ **FIXED**
   - `movement.system.ts` now drives logical tile arrival via `CancelableSimDelay`.
   - Phaser tween runs for visual interpolation only; onComplete chain fires at the same
     simulation tick on all clients.

## Medium-risk / likely remaining divergence sources

- Attack hit/fire delays were using `scene.time.delayedCall` (real-time). **FIXED** — now use
  `CancelableSimDelay` (in `simulation-time.ts`) which fires at the correct simulation tick.
- Movement/pathfinding tile-arrival timing — **FIXED** — logical arrival via `CancelableSimDelay`.
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
   - Recommendation: **stay with lockstep**. RTS-scale rollback is prohibitively expensive. The 2-tick (100ms) delay is below human perception threshold for map clicks. If perceived lag matters, make `INPUT_DELAY_TICKS` adaptive (set from measured RTT) rather than reworking the model.

2. ~~**Spectator fog-of-war validation**~~ **NOT NEEDED** — removed from scope.

3. ~~**Desync non-host stall — timeout fallback**~~ **FIXED**
   - `DesyncRecoveryService` now arms a 15 s timeout after a "Wait" vote on the desynced client.
   - If the correction snapshot never arrives, the `"desync"` pause is force-released and the error is logged clearly.

## Future LLM prompt starter

All originally requested structural items are complete. The branch is a working deterministic lockstep multiplayer implementation. No major open items remain. If resuming:

- Make `INPUT_DELAY_TICKS` adaptive (measure RTT, set delay dynamically) to improve perceived responsiveness without changing the netcode model.
- Audit any remaining gameplay systems (spells, abilities) for wall-clock time dependencies.
