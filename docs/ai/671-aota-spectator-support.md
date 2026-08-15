# Issue 671: AOTA spectator support plan

## Status

- Delivery lane: `decision-pr`
- Current stage: investigation and plan complete; implementation awaits D1-D3
- Issue: [#671 — Spectator AOTA](https://github.com/JernejHabjan/fuzzy-waddle/issues/671)
- Goal: make an authenticated spectator able to join before or during a multiplayer match, catch up to the host, watch the live simulation, and leave cleanly without gaining player authority.

## Scope

Complete the existing spectator scaffold as a distinct read-only runtime role. The first delivery should support public self-hosted AOTA matches from lobby discovery through match completion:

1. Join a not-started match as a spectator and remain in the lobby until the host starts it.
2. Join an in-progress match and request an authoritative host snapshot before the local simulation advances.
3. Continue consuming player command batches after catch-up without contributing a player heartbeat or mutating game state.
4. Move the camera, use the minimap, inspect actors, use chat, and view neutral match results.
5. Leave from the lobby, game, or score screen without affecting player slots, host migration, or lockstep membership.

## Investigation findings

### Existing support

- Platform and AOTA protocol models already distinguish `spectators` from `players`, serialize spectator data, and relay `spectatorDataChange` events.
- `GameInstanceClientService.joinGameInstanceAsSpectator` loads the instance, starts communicator subscriptions, emits a self-owned spectator join, and routes late spectators directly to `aota/game`.
- Socket room membership, lobby grids, room-list updates, and spectator leave events already exist.
- `ReconnectService` already sends `spectator-catch-up` snapshot requests and applies targeted host snapshots.
- `CommandBusService` already blocks spectator dispatch and can consume the real human players' relayed batches without assigning the spectator a lockstep slot.
- `GameProbableWaffleScene` already omits fog of war for spectators, and action handlers contain partial spectator guards.

### Confirmed failure boundaries

1. `getCurrentPlayerNumber` calls the throwing `scene.player` getter. Any spectator caller fails before it can receive `undefined`; HUD resources are one immediate startup path.
2. `GameProbableWaffleScene` constructs player-owned systems and HUD components for every role. `GameModeConditionChecker`, score/outcome ownership, player resources, selection groups, production controls, surrender/save surfaces, AI orchestration, and several recovery diagnostics still assume a local player.
3. `GameInstanceService.ensureCanMutateGameInstance` permits `SnapshotRequest` only for players. The existing spectator catch-up request is therefore rejected before `GameStateServerService` can relay it to the host.
4. Spectator catch-up is requested after initial actors and runtime services have started. The scene-bootstrap pause is released immediately, so stale initial state can advance before the authoritative snapshot arrives.
5. State-hash, pause, reconnect, and score-screen paths mix observer-safe receive behavior with player-only send/ownership behavior. Optional chaining such as `scene.player?.playerNumber` does not protect a throwing getter.
6. Spectator joins have ownership checking but no dedicated server validator for duplicate participation, stopped sessions, request reason, or role-specific mutation permissions.

## Recommended architecture

```text
Angular join flow
  -> authenticated spectator registration
  -> socket room membership
  -> Phaser observer bootstrap (paused)
  -> validated spectator snapshot request
  -> host snapshot targeted to spectator sockets
  -> snapshot apply + command-tail restore
  -> receive-only lockstep mirror
  -> neutral result / explicit leave cleanup
```

### Role and identity contract

- Treat `player`, `spectator`, and replay viewer as explicit local participation roles rather than inferring capabilities from a nullable player number at each call site.
- Keep `scene.player` strict for player-only code, but make observer-safe helpers use `playerOrNull` and return `undefined` when no player exists.
- Centralize spectator capability policy: camera, minimap, actor inspection, chat, read-only score projection, and connection recovery are allowed; gameplay commands, control groups, production, player resources, surrender, save, speed control, state hashes, pause requests, and AI authority are not.
- Register only role-compatible Phaser systems and HUD surfaces. Do not scatter guards across every update loop when scene composition can exclude a player-owned subsystem.

### Server authority

- Add a named spectator mutation validator at the existing game-instance/game-state authority boundary.
- Accept a spectator join only for the authenticated user, only when that user is not already a player or spectator, and only while the session is not stopped.
- Allow a registered spectator to send only its own leave event and a snapshot request whose reason is exactly `spectator-catch-up` and whose emitter matches the authenticated user.
- Continue rejecting spectator game commands, player state, state hashes, pause changes, desync events, snapshot responses, metadata changes, and host-only actions.
- Keep snapshot responses host-only and targeted through active socket IDs. Spectators must never become host-migration candidates or lockstep participants.

### Catch-up ordering

- Add a spectator-bootstrap pause reason before actor-dependent services begin advancing.
- Subscribe for the targeted snapshot before sending the request.
- Extend the snapshot contract with authoritative score data/history needed by a late observer; on success, apply actors, player state, score state, random state, command tail, and tick through the existing reconnect authority, then release only the spectator-bootstrap/snapshot pauses.
- On timeout, host loss, rejected access, or malformed snapshot, show a recoverable error and return to the lobby list instead of running a stale local simulation.
- After catch-up, reuse `CommandBusService` as a receive-only mirror: buffer every current human player's batch, advance only when the same barrier as players is satisfied, and never emit a local batch.

### Spectator presentation

- Use an omniscient map with no fog-of-war projection and no visibility mutation.
- Allow selection only as local presentation so spectators can inspect any visible actor; do not allow orders, production, rally points, spells, destructive debug actions, or selection-group persistence.
- Replace player economy/action surfaces with a small `Spectating` indicator and leave camera, minimap, clock, chat, and actor-information surfaces available.
- Route spectators to the existing score screen with neutral wording and the authoritative all-player score table; never derive victory/defeat from a nonexistent local player.

## Decisions requested

### D1 — Spectator visibility and inspection

- Recommendation: omniscient terrain and actors, with read-only selection/inspection of either team. Do not add player-perspective switching in the first delivery.
- Rationale: this matches the existing no-fog scaffold, keeps the role useful, and avoids coupling the first fix to perspective-specific fog/resource projections.
- Deferral impact: scene composition, HUD visibility, and selection behavior cannot be finalized.
- Reply: `Accept D1`, `Use D1: <alternative>`, or `Defer D1`.

### D2 — Join policy

- Recommendation: support public self-hosted matches before and during play; keep private-match spectator admission out of scope until an invitation/approval contract exists. Reject stopped matches and duplicate player/spectator membership.
- Rationale: the current read endpoint intentionally exposes public instances but provides no private spectator invitation token or host approval flow.
- Deferral impact: server admission rules and lobby availability remain ambiguous.
- Reply: `Accept D2`, `Use D2: <alternative>`, or `Defer D2`.

### D3 — Match completion

- Recommendation: send spectators to the existing score screen with neutral `Match complete` wording, all-player scores, and no personal victory/defeat state.
- Rationale: spectators should observe the full lifecycle, while player-specific outcome semantics must not be fabricated.
- Deferral impact: end-of-match routing and cleanup cannot be considered complete.
- Reply: `Accept D3`, `Use D3: <alternative>`, or `Defer D3`.

## Implementation stages

### Stage 1 — Role-safe identity and admission

- [ ] Introduce a typed local participation/capability helper shared by the AOTA scene and interface boundary.
- [ ] Make `getCurrentPlayerNumber` and observer-safe callers return `undefined` without evaluating the strict `scene.player` getter.
- [ ] Add server-side spectator join/leave validation for ownership, lifecycle state, and duplicate/cross-role membership.
- [ ] Add focused protocol/server/client-service tests for pre-game join, mid-game join, duplicate join, player-as-spectator, stopped match, and self leave.

Acceptance criteria:

- A spectator can be represented without a fabricated player number.
- Forged or invalid spectator mutations are rejected at one authoritative server boundary.
- Existing player, AI, replay, lobby, and private-instance access behavior is unchanged.

### Stage 2 — Authoritative late-join catch-up

- [ ] Permit only registered spectators to send self-owned `spectator-catch-up` snapshot requests.
- [ ] Add spectator-bootstrap pause/timeout ownership and request the snapshot only after the response subscription and socket room membership are ready.
- [ ] Extend capture/apply contracts with score data and score snapshots, apply the targeted host snapshot and command tail through `ReconnectService`, then transition to receive-only lockstep.
- [ ] Keep spectators out of outgoing state-hash, pause, desync, command-heartbeat, AI, host-migration, and replay-recording authority.
- [ ] Test allowed/rejected snapshot requests, targeted delivery, bootstrap ordering, timeout cleanup, receive-only command advancement, and no spectator outbound batches.

Acceptance criteria:

- A mid-game spectator first displays authoritative host state at the returned tick and then stays synchronized with live commands.
- No stale simulation tick advances before catch-up succeeds.
- A spectator cannot mutate the match or block players' lockstep barrier.

### Stage 3 — Read-only scene and HUD composition

- [ ] Register outcome mutation, economy, action, control-group, save, and other player-owned systems only for players; keep observer-safe world, camera, minimap, chat, clock, read-only score tracking/projection, and recovery services.
- [ ] Split read-only actor selection/inspection from command issuance and allow inspection for either team.
- [ ] Hide player resources, production/action controls, surrender, speed, and developer mutation controls; show a clear spectator indicator.
- [ ] Keep Phaser Editor `.scene` files synchronized for any changed HUD/prefab structure.
- [ ] Add focused Phaser tests for role composition, current-player safety, read-only selection, hidden controls, and cleanup of subscriptions/listeners.

Acceptance criteria:

- Spectator scene/HUD creation completes without a local player or non-null assertions.
- Camera, minimap, actor inspection, chat, and live simulation work.
- Every gameplay mutation path remains unavailable in UI and guarded below the UI.

### Stage 4 — Full lifecycle and regressions

- [ ] Preserve lobby-to-game navigation for pre-game spectators and direct navigation for in-progress spectators.
- [ ] Make score-screen routing and data projection spectator-safe according to D3.
- [ ] Ensure explicit leave and disconnect cleanup remove only spectator state/socket membership and never trigger player removal or host migration.
- [ ] Update `wiki/aota-multiplayer-architecture.md` with observer authority, snapshot ordering, and receive-only lockstep invariants.
- [ ] Run the complete automated and manual verification matrix, then perform omission and final-closure audits.

Acceptance criteria:

- One spectator can complete join-before-start, join-in-progress, watch, match-complete, and leave flows.
- Multiple spectators do not affect player capacity, game outcome, host election, command barriers, or one another's cleanup.
- Player-only multiplayer behavior remains unchanged.

## Verification plan

Automated checks after implementation, serialized with `NX_DAEMON=false`:

- `pnpm exec nx test probable-waffle-protocol`
- `pnpm exec nx test probable-waffle-server`
- `pnpm exec nx test probable-waffle-interface`
- `pnpm exec nx test probable-waffle-phaser`
- `pnpm exec nx lint probable-waffle-protocol`
- `pnpm exec nx lint probable-waffle-server`
- `pnpm exec nx lint probable-waffle-interface`
- `pnpm exec nx lint probable-waffle-phaser`
- Run the owning production builds if the implementation changes shared configuration or dependency resolution.

Manual multiplayer playtest matrix:

- Join a public lobby as spectator before start; verify lobby updates/chat and automatic game navigation.
- Join at least one minute into a two-player match; verify paused catch-up, current actors/resources/tick, then live command continuity.
- Use camera, edge/keyboard movement, zoom, minimap, chat, and cross-team actor inspection.
- Attempt keyboard, pointer, production, spell, rally, control-group, surrender, speed, save, and forged transport mutations; verify none changes authoritative state.
- Finish the match; verify neutral score presentation and clean exit.
- Test host disconnect/reconnect, spectator disconnect/reconnect, two spectators, player leave, spectator leave, backend restart/reseed, and snapshot timeout.
- Confirm players show no new stalls, duplicate commands, state-hash noise, host-migration changes, or spectator-dependent outcomes.

## Risks and guardrails

- Catch-up ordering is lockstep-sensitive; reuse the existing snapshot/reconnect authority instead of building a parallel spectator restore path.
- Hiding controls is not authorization. Server validators and command dispatch guards remain mandatory.
- Do not assign a watched player number to the spectator; presentation perspective and simulation authority must remain separate.
- Avoid a broad nullable-player refactor. Keep strict player-only getters and narrow observer-safe helpers/composition at the affected boundaries.
- A focused test reporting zero discovered tests is invalid; correct the filter or run the owning project suite.

## Out of scope

- Private-match invitation/approval flows, spectator passwords, moderation, bans, or capacity limits.
- Delayed tournament broadcasts, replay scrubbing, commentator tools, fog-perspective switching, player-follow camera, or spectator chat channels.
- Spectating campaign, instant-game, matchmaking, replay, or stopped sessions.
- Database persistence or analytics for spectator presence beyond existing session participation contracts.

## Progress checklist

- [x] Inspect issue text, labels, milestone, repository state, and related spectator references.
- [x] Trace Angular join/navigation, protocol models, socket room membership, server auth/mutation, Phaser identity, HUD composition, lockstep, snapshot recovery, and score paths.
- [x] Identify the throwing local-player invariant, rejected snapshot authority, and unsafe bootstrap ordering.
- [x] Define staged implementation, acceptance criteria, verification, risks, and explicit out-of-scope work.
- [ ] Receive and apply decisions D1-D3.
- [ ] Implement Stages 1-4 and keep this checklist current.

## Continuation prompt

```text
Implement issue #671 from docs/ai/671-aota-spectator-support.md. Treat the reviewed answers to D1-D3 as authoritative, begin with Stage 1, keep the plan checklist current, run the listed focused checks with NX_DAEMON=false, complete the omission and final-closure audits, then update the draft PR. Do not merge automatically.
```
