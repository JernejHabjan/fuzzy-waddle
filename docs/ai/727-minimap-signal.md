# Issue 727: Minimap signal implementation plan

## Status

- Delivery lane: `decision-pr`
- Current stage: research complete; product and asset decisions pending
- Issue: [#727 — Minimap signal](https://github.com/JernejHabjan/fuzzy-waddle/issues/727)
- Reference behavior: Warcraft III-style signal button beside the minimap, one-shot targeting on the minimap or world, and an ally-visible signal at the selected location.

## Scope

Add an ephemeral, multiplayer-only minimap signal that lets a human player point out a map location to human teammates. The signal must be visible both in the game world and on each recipient's minimap without mutating fog of war or entering the deterministic simulation.

Recommended interaction:

1. Click the minimap signal button or press `Alt+G` to arm one signal.
2. Left-click the minimap or game world to send it.
3. Alternatively, `Alt+left-click` either target surface to send immediately.
4. Press `Escape` or right-click while armed to cancel.
5. The sender sees the signal immediately; connected human teammates receive the same tile, sender color, animation, and optional sound.

## Research findings

### Existing client flow

- `Minimap.ts` already converts every minimap diamond to a canonical tile coordinate. Its pointer branch currently chooses among camera movement, a right-click order, or a pending player action, so signal targeting belongs before those branches.
- `SingleSelectionHandler.getTileAndGameObjectsOnPointerClick` already converts a world pointer to an isometric tile. Reusing that conversion avoids a second coordinate system.
- `PlayerActionsHandler`, `SingleSelectionHandler`, and `MultiSelectionHandler` each consume pointer or keyboard input. A signal controller must expose its capture state to all three so one click cannot both ping and select/order.
- Phaser dispatches game-object pointer events before scene pointer events and supports `event.stopPropagation()`. Minimap clicks can therefore be consumed at the interactive diamond while the shared capture state suppresses world selection/order handlers. See [Phaser input events](https://docs.phaser.io/api-documentation/namespace/input-events).
- `HudProbableWaffle` already owns scene-backed buttons around the minimap and hides them below the minimap breakpoint. A new `MinimapSignalButton.scene`/`.ts` pair should sit immediately left of the chat button and follow the same responsive and campaign-suppression rules.
- The GUI atlas contains the reusable Cryo button frame, move marker, and rally icon, but no dedicated minimap-signal icon. The existing Cryo source is licensed CC BY 4.0 according to the [publisher page](https://paperhatlizard.itch.io/cryos-mini-gui); its attribution record currently names the source but omits the license.

### Existing multiplayer flow

- `ProbableWaffleCommunicatorService` creates a typed `TwoWayCommunicator` per realtime event and exposes the same surface through `ProbableWaffleCommunicatorServiceInterface` and a stub.
- Chat uses `ProbableWaffleGatewayEvent.ProbableWaffleMessage`, authenticates room access, then broadcasts to the whole game room. That path is useful transport precedent but cannot be reused unchanged because issue #727 requires allies rather than every participant.
- `GameInstanceGateway` can resolve the authenticated user to a current player and team through `GameInstanceService`. `PlayerDisconnectTrackerService.getActiveSocketIdsForPlayer` already supplies the targeted-socket primitive used by reconnect recovery.
- `ProbableWaffleLevels` exposes `widthTiles` and `heightTiles` for every supported map, so the server can validate the signal against the authoritative map selected by `gameMode.data.map`.
- Socket.IO rooms and socket-ID rooms are server-side subset channels. A server can emit once to a union of recipient rooms, and `socket.to(...)` excludes the sender. See [Socket.IO rooms](https://socket.io/docs/v4/rooms/).
- The lockstep command bus is the wrong authority point: a signal is transient presentation, does not change game state, must not wait for a simulation tick, and must not be persisted in saves or replays.

## Recommended architecture

```text
button / Alt+G / Alt+click
        |
        v
MinimapSignalController --canonical tile--> local presenter
        |
        v
typed minimap-signal communicator
        |
        v
authenticated server validator
  - owns sender identity
  - validates finite in-map tile
  - enforces cooldown
  - resolves current team
        |
        v
active sockets for human teammates only
        |
        v
remote controller --> world marker + minimap marker
```

### Contract and authority

- Add a dedicated `ProbableWaffleMinimapSignalEvent` and `ProbableWaffleCommunicators.MinimapSignal`; do not broaden the chat payload or use an untyped local event.
- Carry `gameInstanceId`, `emitterUserId`, `playerNumber`, and integer tile coordinates. The server must verify `user.id`, `playerNumber`, active participation, team membership, and coordinate shape instead of trusting the typed client payload.
- Derive effective team as `playerDefinition.team ?? playerNumber`; an unassigned/FFA participant is therefore allied only with itself and receives no network relay.
- Resolve recipients when the signal arrives so lobby/team state remains authoritative. Relay only to active human teammates, not opponents, AI slots, or spectators.
- Render the sender locally and exclude the sender socket from relay. Multiple active sockets for one teammate may each receive the event.
- Treat missing/invalid players, spectators, malformed coordinates, out-of-map tiles, and cooldown violations as rejected events with no relay.

### Client ownership and input arbitration

- Add a scene service `MinimapSignalController` that owns armed state, the hotkeys, transport subscription, cooldown feedback, and cleanup.
- Keep a consumed-pointer token through the end of the input frame. `PlayerActionsHandler`, `SingleSelectionHandler`, and `MultiSelectionHandler` must query it before issuing an order, changing selection, or beginning a drag.
- Let `Minimap` call the controller with its already-known tile and stop event propagation when the controller consumes the click. Normal camera/order behavior stays unchanged otherwise.
- Use `SingleSelectionHandler`'s existing pointer-to-tile helper for world targets. Reject clicks outside the tilemap instead of clamping them to an unrelated tile.
- Disable all shortcuts while an external modal is open, for spectators, in replays, and when no connected human teammate exists.

### Presentation

- Add a scene-backed `MinimapSignalButton` using the existing small-button frame and an original Phaser/vector concentric-ring icon. This avoids importing Warcraft artwork and removes the issue's bitmap dependency.
- Add a concise tooltip: `Minimap Signal (Alt+G)` plus the one-shot and `Alt+click` instructions.
- Render three expanding/fading rings for about 1.5 seconds at the target tile in the world and at the matching minimap point. Recompute the minimap point from the current responsive minimap geometry rather than storing screen pixels.
- Color the rings from `GameSetupHelpers.getHslColorForPlayer`, with a visible neutral fallback. Draw the world marker above fog without changing fog visibility or revealing actors.
- Own and destroy all tweens, graphics, keyboard listeners, pointer listeners, and communicator subscriptions on scene shutdown.

## Decisions requested

### D1 — Recipients

- Recommendation: sender plus connected human players whose effective team matches the sender; exclude spectators, AI, disconnected teammates, and opponents.
- Deferral impact: server routing and button availability cannot be finalized.
- Reply: `Accept D1`, `Use D1: <alternative>`, or `Defer D1`.

### D2 — Inputs

- Recommendation: button/`Alt+G` arms one signal, `Alt+left-click` sends directly, and `Escape`/right-click cancels armed mode.
- Deferral impact: input arbitration and tooltip copy remain unsettled.
- Reply: `Accept D2`, `Use D2: <alternative>`, or `Defer D2`.

### D3 — Anti-spam

- Recommendation: server-enforced one signal per player every 2 seconds, mirrored by a disabled/cooldown state on the local button. The controller sends and renders only after passing its local cooldown; the server independently rejects clients that bypass it.
- Deferral impact: the protocol can be implemented, but abuse behavior and optimistic rendering cannot be finalized.
- Reply: `Accept D3`, `Use D3: <duration/policy>`, or `Defer D3`.

### D4 — Signal sound

- Recommendation: source or create a short dedicated CC0/CC BY-compatible two-tone ping and add it to the existing `ui-feedback` audio sprite with full attribution. Do not reuse the countdown beep because it already communicates a different game state.
- Low-risk fallback: ship the visual signal and existing button-click feedback first, with remote signal audio deferred.
- Deferral impact: visual implementation can proceed, but the `assets-needed` label remains valid for audio.
- Reply: `Accept D4`, `Use D4: visual-only`, `Use D4: <approved asset URL>`, or `Defer D4`.

## Implementation stages

### Stage 1 — Shared event contract and transport

- [ ] Add the documented minimap-signal event contract and communicator mapping in `libs/games/probable-waffle/protocol`.
- [ ] Extend `ProbableWaffleCommunicatorServiceInterface`, its Angular implementation, and its stub with a dedicated optional `TwoWayCommunicator`.
- [ ] Initialize and destroy the communicator with the active multiplayer socket; keep it undefined in single-player.
- [ ] Add communicator lifecycle tests to `probable-waffle-communicator.service.spec.ts`.

Acceptance criteria:

- Signal payloads are typed end to end and are not part of chat, game-state mutation, saves, replays, or lockstep commands.
- Starting/stopping/reconnecting communication creates exactly one listener and leaves no stale subscription.

### Stage 2 — Server validation and ally relay

- [ ] Add a narrow minimap-signal validator with a named interface and matching stub.
- [ ] Validate authenticated ownership, human participant status, integer/finite tile coordinates, and the approved cooldown; resolve `gameMode.data.map` through `ProbableWaffleLevels` and reject coordinates outside `widthTiles`/`heightTiles`.
- [ ] Add a communicator-specific branch to the guarded message gateway; derive teammate recipients from current game-instance state and target their active socket IDs.
- [ ] Clear per-match cooldown state when the game instance is cleaned up.
- [ ] Unit-test sender spoofing, spectators, malformed/out-of-map coordinates, FFA/no-team behavior, same-team relay, opponent exclusion, multi-socket teammates, cooldown, and cleanup.

Acceptance criteria:

- An untrusted client cannot signal as another player or send to opponents.
- One accepted signal is delivered once to every active teammate socket and never mutates authoritative game state.

### Stage 3 — Input controller and HUD button

- [ ] Add `MinimapSignalController` and register it before consumers that can act on the same pointer release.
- [ ] Add a scene-backed `MinimapSignalButton.scene`/`.ts`, tooltip, armed/cooldown states, and responsive placement beside chat.
- [ ] Route minimap tiles through the controller and consume the Phaser game-object event when signaling.
- [ ] Route world clicks through the existing isometric pointer-to-tile conversion.
- [ ] Suppress selection, drag-selection, camera movement, and unit orders only for the consumed signal pointer.
- [ ] Support the approved hotkeys/cancellation and block them for modals, spectators, replays, and matches without a human teammate.
- [ ] Keep `HudProbableWaffle.scene` and generated TypeScript structurally synchronized.

Acceptance criteria:

- Every approved input path sends exactly one signal.
- The signal click never also moves the camera, changes selection, begins a selection rectangle, or issues a unit order.
- Non-signal input behavior remains unchanged.

### Stage 4 — World/minimap presentation and assets

- [ ] Add lifecycle-owned world and minimap ring presenters keyed by canonical tile coordinates.
- [ ] Use the sender's deterministic player color and a contrast-safe fallback.
- [ ] Add the approved sound to `UiFeedbackSfx` and the audio sprite, or record visual-only scope if D4 chooses the fallback.
- [ ] Update the Cryo GUI attribution with its CC BY 4.0 license when the new button reuses that frame.
- [ ] Add focused tests for coordinate projection, presenter cleanup, simultaneous signals, and responsive minimap redraw/resize.

Acceptance criteria:

- Sender and teammates see matching world/minimap signals for the same tile.
- Signals remain ephemeral, survive responsive repositioning for their lifetime, and clean up without leaking objects, tweens, timers, or listeners.
- The signal does not reveal fogged terrain state or hidden actors.

## Verification plan

Automated checks after implementation, serialized with `NX_DAEMON=false` in the worktree:

- `pnpm exec nx test probable-waffle-server`
- `pnpm exec nx test probable-waffle-interface`
- `pnpm exec nx test probable-waffle-phaser`
- `pnpm exec nx lint probable-waffle-protocol`
- `pnpm exec nx lint probable-waffle-server`
- `pnpm exec nx lint probable-waffle-interface`
- `pnpm exec nx lint probable-waffle-phaser`

Manual multiplayer playtest matrix:

- Two allied human clients: button, `Alt+G`, minimap target, world target, direct `Alt+click`, cancel, cooldown, and resize.
- Allied and opposing clients: teammates receive; opponents do not.
- FFA/no teammate: button and shortcuts unavailable; forged event rejected.
- Spectator and replay: cannot send; no selection/order regression.
- Fogged target: rings appear without changing fog or actor visibility.
- Reconnect/multiple tabs: only active teammate sockets receive; no duplicate listener after reconnect.
- Simultaneous teammate signals: independent colors/animations and complete cleanup.

## Out of scope

- Ping wheels or multiple semantic ping types (`attack`, `defend`, `retreat`).
- Persistent map markers, chat history entries, saved/replayed pings, AI reactions, mobile gesture redesign, or camera auto-centering.
- Refactoring the general input system beyond the narrow consumed-pointer checks required for this feature.

## Progress checklist

- [x] Inspect issue, screenshot, labels, and requested Warcraft-style behavior.
- [x] Trace minimap targeting, world coordinate conversion, HUD layout, input consumers, communicator lifecycle, server room relay, team data, socket targeting, and asset inventory.
- [x] Verify Phaser event-consumption behavior and Socket.IO subset routing against official documentation.
- [x] Verify the existing Cryo GUI source license and identify the missing license metadata.
- [x] Record implementation stages, acceptance criteria, tests, manual playtest path, risks, and out-of-scope work.
- [ ] Receive decisions D1–D4.
- [ ] Continue with Stage 1 on an implementation branch after the decision PR is approved.

## Continuation prompt

```text
Implement issue #727 from docs/ai/727-minimap-signal.md. Treat the reviewed answers to D1-D4 as authoritative, start with Stage 1, keep the plan checklist current, run the listed focused checks with NX_DAEMON=false, complete the omission and closure audits, then update the draft PR.
```
