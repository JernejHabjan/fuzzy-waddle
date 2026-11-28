# Issue #637: Contextual chat throughout the game

## Status

- [x] Current chat UI, transport, authorization, persistence, and game integrations inspected
- [x] Recommended experience and channel visibility matrix defined
- [x] Product decisions accepted on 2026-08-15
- [ ] Implementation stages delivered and verified

This plan began as a `decision-pr` because issue #637 asks for chat on all relevant screens while the repository already has separate global, lobby, and in-game implementations. The product and ownership decisions are now confirmed, so the plan is ready for staged implementation.

## Confirmed decisions

- **D1 — channel visibility:** accepted. Use Global outside rooms, Room + Global in a multiplayer lobby with Room selected, and Room only during gameplay.
- **D2 — realtime ownership:** accepted. Move room delivery into authenticated platform-chat Socket.IO rooms while Probable Waffle remains the room-access authority.
- **D3 — unread scope:** accepted. Keep unread/read state client-session-local and defer cross-device read receipts.
- **Database authority:** schema and migration changes are permitted when implementation demonstrates a concrete need. Prefer the existing `global_lobby` and `game_session` model; do not create persistence work for session-local unread state.

## Recommendation

Use contextual chat: give authenticated players **Global** chat throughout the portal, make **Room** the default in a multiplayer lobby with an optional **Global** tab, and expose **Room only** during a match.

| Context | Available channels | Default | Presentation |
| --- | --- | --- | --- |
| Home, profile, game menus, music, attributions, moderation, and other portal pages | Global | Global | Persistent collapsed launcher; responsive panel or mobile sheet |
| Probable Waffle multiplayer lobby | Room, Global | Room | Chat region with channel tabs and per-channel unread badges |
| Probable Waffle match | Room only | Room | Existing HUD launcher and focused chat dialog; no Global distraction |
| Offline, skirmish, campaign, replay, unauthenticated, banned, or unavailable server | None | None | Do not render an unusable launcher |

This follows the usual separation between broad community conversation and the small group coordinating an active match. It keeps Global discoverable while a room is forming, but it prevents unrelated Global traffic from competing with gameplay. The UI should call the room channel **Room** in the lobby and **Match** in game; those are two labels for the same persisted game-session channel, so conversation and history continue across the lobby-to-match transition.

Do not add direct messages, team-only chat, cross-device read receipts, typing indicators, presence, reactions, or message editing in this issue. The schema leaves room for some of those later, but they are separate product and moderation features.

## What exists today

- `ChatFloatComponent` is owned by `HomePageComponent`, so Global chat is destroyed when the user leaves Home.
- `ChatComponent` already supplies history pagination, sending, profiles, moderation reports, and a `gameInstanceId` history filter.
- Global realtime messages use `ChatGateway`, which broadcasts to every connected socket.
- Probable Waffle room messages use the game-instance gateway and communicator, while persistence is delegated to platform chat.
- Server-side game-chat access is already centralized through `GameChatAccessRegistry` and the Probable Waffle access service.
- The database already models `global_lobby` and `game_session` channels and uniquely identifies a game-session channel.
- The lobby already embeds room chat for self-hosted multiplayer, and the Phaser HUD already opens an in-game room-chat dialog and shows unread notification UI.

The missing feature is therefore not a new chat widget. It is a coherent channel contract, one realtime ownership path, route-persistent client state, and context-aware presentation.

## Experience requirements

- [ ] Keep one chat launcher alive at the application shell so route changes do not reset Global history, scroll position, draft text, open/minimized state, or unread count.
- [ ] Open chat only on explicit user action. New messages increment a subtle badge and never steal focus or open a panel.
- [ ] Preserve a draft independently per channel when switching between Room and Global.
- [ ] Mark a channel read only when its message list is visible and caught up; opening one channel must not clear another channel's badge.
- [ ] Deduplicate by persisted message ID and render the sender's accepted message exactly once.
- [ ] Show reconnect/loading/send-failure states without discarding the draft; disable sending while the user lacks access or the server is unavailable.
- [ ] Keep history and new-message scroll behavior stable: follow new messages only when already near the bottom, otherwise retain position and show a new-message affordance.
- [ ] On narrow screens, use a bottom sheet that protects the primary navigation/playfield and keeps the composer above the on-screen keyboard.
- [ ] Use real buttons for launchers, tabs, and close controls; provide visible focus, accessible names, keyboard tab behavior, Escape-to-close for dialogs, and focus return to the launcher.
- [ ] Announce unread/status changes politely without announcing every background-channel message or interrupting gameplay.
- [ ] Retain existing reporting, sanitization, roles, profiles, and room-access enforcement in every presentation.

The accessibility behavior should follow the W3C dialog and keyboard patterns: focus enters a modal dialog, remains contained, closes with Escape, and returns to the invoking control. Realtime delivery should use server-owned Socket.IO rooms so only authorized channel subscribers receive a room event.

References:

- [Socket.IO rooms](https://socket.io/docs/v4/rooms/)
- [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [W3C keyboard interface guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [W3C alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)

## Architecture

Introduce a shared discriminated channel reference such as `global` or `game-session + GameInstanceId`. It is the only channel identity accepted by UI state, HTTP history, websocket subscription, send, and server persistence. Keep transport DTOs separate from trusted `ChatMessage` output and validate incoming websocket data at the gateway.

`ChatService` remains the low-level API/socket adapter. Add a contracted client coordinator with a matching stub to own channel-keyed state: messages, pagination, drafts, loading/error state, visibility, and unread counts. Components bind to that state rather than creating independent subscriptions and message arrays.

Move room realtime delivery into the platform chat gateway:

```text
Angular context -> subscribe(channel) -> ChatGateway -> authorize room -> socket.join(channel room)
Angular composer -> send(channel, text) -> ChatGateway -> sanitize/persist -> emit persisted message to channel room
                                                               -> sender and peers receive exactly once
```

Global and room chat then share one validation, persistence, moderation, and delivery path. Probable Waffle remains the authority that answers whether a user may join a game-session chat through `GameChatAccessRegistry`; its general gameplay gateway no longer carries chat messages after migration. This avoids maintaining two subtly different chat transports.

The application shell chooses whether to render the Global launcher from authentication, account, server, route, and active-game context. Probable Waffle lobby and game surfaces own their contextual presentations and reuse the same coordinator. The shell must not overlay a second Global launcher on those surfaces.

## Delivery stages

### 1. Channel contract and scoped realtime authority

- [ ] Add documented, strongly typed channel references, subscription/send events, acknowledgements, and runtime guards.
- [ ] Have the server authorize subscribe and send, join/leave Socket.IO rooms, persist before broadcast, and return typed errors without leaking private room existence.
- [ ] Route Global events only to Global subscribers rather than all connected sockets.
- [ ] Reuse `GameChatAccessRegistry` for game-session access and cover unauthorized subscribe, history, send, report, reconnect, and channel-switch cases.
- [ ] Validate that existing channel constraints support the final typed identity and concurrency behavior; if they do not, update the canonical schema, generated migration, database types, and focused database tests together with documented SQL intent.
- [ ] Migrate Probable Waffle chat off the general game communicator without altering unrelated lockstep/game events.

Acceptance: two users in one room receive their persisted messages exactly once; an outsider and a user in another room receive nothing and cannot fetch or report that room's messages; Global delivery remains isolated from room delivery.

### 2. Route-persistent client chat state

- [ ] Add the contracted channel coordinator and stub, with one managed socket listener and channel-keyed state.
- [ ] Adapt `ChatComponent` into a reusable channel view with loading, reconnect, send failure/retry, stable pagination, draft retention, and unread semantics.
- [ ] Make subscription ownership and teardown explicit across reconnect, logout, leaving a room, and component destruction.
- [ ] Update all behaviorally changed service/component tests.

Acceptance: route navigation and channel switching preserve loaded messages, drafts, scroll intent, and accurate unread badges without duplicate subscriptions or messages.

### 3. Global application-shell surface

- [ ] Move the Home-only launcher to an application-shell chat host and remove the duplicate Home registration.
- [ ] Hide it when unauthenticated, banned, offline, in an unsupported Tauri context, or on a route with an owning room/match surface.
- [ ] Provide a compact desktop panel and responsive mobile sheet with accessible focus/open/close behavior.

Acceptance: Global chat is reachable and stateful on every supported non-room portal route and never obscures a room lobby or active match.

### 4. Multiplayer lobby channel switcher

- [ ] Keep the embedded lobby presentation, add Room/Global tabs, select Room on entry, and show independent unread badges and drafts.
- [ ] Continue the same room channel and history into the match; do not create separate lobby and match conversations.
- [ ] Preserve the lobby's responsive layout and make channel selection keyboard operable.

Acceptance: lobby members can deliberately switch channels, never mistake where a message will be sent, and see room history continue when the match begins.

### 5. Focused in-game room chat

- [ ] Keep the existing Phaser chat launcher/notification entry point, expose only Match chat, and bind its Angular dialog to the shared channel state.
- [ ] Preserve game-input suppression while the dialog is open, close on Escape or HUD shutdown, restore focus/input on close, and avoid global notifications during play.
- [ ] Keep the Phaser Editor `.scene` files synchronized with any launcher or notification visual changes.

Acceptance: players and spectators with room access can communicate before and during the match; chat cannot leak across rooms, double-send, leave game input active while typing, or leave modal/input state stuck after close/reconnect/scene shutdown.

### 6. Verification and rollout

- [ ] Run focused `platform-chat`, `probable-waffle-server`, `probable-waffle-interface`, `probable-waffle-phaser`, and `portal` tests and lint with `NX_DAEMON=false`, plus the Portal production build and database validation when schema or migration files change.
- [ ] Manually playtest with two authorized users and one outsider across Home -> game menu -> room lobby -> match -> leave room, including refresh/reconnect, channel switches, narrow viewport, keyboard-only operation, report flow, and server unavailability.
- [ ] Confirm no stale Home-only chat registration, duplicate transport, listener leak, debug output, placeholder, or outdated chat documentation remains.

## Decision record

### Decision 1: channel visibility

**Status:** accepted on 2026-08-15.

Use the matrix above: Global outside rooms, Room + Global in a lobby with Room selected, and Room only in game.

**Why:** it matches player intent at each stage and protects the match from unrelated noise while keeping the wider community reachable during setup.

### Decision 2: one platform chat transport

**Status:** accepted on 2026-08-15.

Migrate room chat from the Probable Waffle game communicator to authenticated, server-scoped platform chat rooms while retaining Probable Waffle as the access authority.

**Why:** Global and room chat then share one typed delivery, persistence, moderation, reconnect, and error contract instead of accumulating fixes in two transports.

### Decision 3: unread scope

**Status:** accepted on 2026-08-15.

Keep unread counts and read position in the current client session for this issue; defer cross-device read receipts and database membership tracking.

**Why:** it delivers the expected navigation experience without adding read-receipt privacy, retention, and multi-device synchronization policy to a chat-availability issue.

### Database changes

**Status:** authorized when needed.

The existing database already models unique Global and game-session channels, so no migration is required merely because database changes are allowed. If implementation exposes a missing constraint, index, channel field, or concurrency invariant, update the canonical schema and migration together, regenerate shared database types, document the SQL ownership and workflow, and add focused validation. Do not persist unread/read state under this issue.

## Continuation prompt

```text
Implement issue #637 from docs/ai/637-contextual-chat.md, starting with Stage 1. D1, D2, and D3 in the Decision record are authoritative. Database changes are authorized only when a concrete implementation need is demonstrated; keep unread state client-session-local. Complete one stage at a time with its tests, stage review, omission audit, and focused commit; stop for any new product, security, multiplayer-authority, or persistence decision. After all stages, run the listed verification and manual playtest, then update the draft PR without merging it.
```
