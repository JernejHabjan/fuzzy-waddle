# #641 / #642 Party and Friends System plan

## Status

- [x] Inventory identity, lobby, matchmaking, realtime, and persistence boundaries.
- [x] Record the accepted product decisions.
- [x] Expand the queue design to custom lobbies, 2v2, 3v3, 4v4, and FFA.
- [ ] Implement staged contracts, persistence, server authority, and clients.
- [ ] Complete automated, multi-profile, reconnect, and abuse validation.

## Confirmed decisions

- Friendship is mutual, with pending inbound and outbound requests.
- Initial discovery is exact, case-insensitive lookup by unique username.
- A party has at most four members. On leader departure or expiry of reconnect grace, leadership
  transfers to the earliest-joined online member; an empty party dissolves.
- Party integration supports custom lobbies and every currently declared matchmaking configuration:
  FFA, 2v2, 3v3, and 4v4. Delivery remains staged so each flow is independently reviewable.
- Party invitations expire after five minutes. Server-side rate limits and block/ignore controls are
  required before public launch.

## Repository evidence and constraints

- `user_profiles` already owns a case-insensitively unique optional username and active-account RLS,
  so discovery can extend `UserProfilesService` without introducing a second identity key.
- Authenticated Socket.IO and HTTP guards exist, but there is no social/presence gateway or shared
  social protocol.
- Custom game instances and lobby authorization are server-owned. Private rooms currently admit only
  the host or existing players/spectators, so party lobby admission needs an explicit server-issued
  invitation/allowlist path rather than client-side player injection.
- Matchmaking currently stores pending game instances in one process, accepts one user per request,
  intersects map pools, and promotes a match when a map's start positions are full.
- The protocol already declares FFA, 2v2, 3v3, and 4v4 and assigns teams by join position. Party
  tickets therefore need atomic placement and stable slot/team reservations; appending individual
  members would split parties or overfill teams.
- The current in-memory game-instance and matchmaking model is a single-server authority. This plan
  keeps that deployment invariant explicit for the first release and places storage behind an
  adapter so a future multi-replica deployment can use Redis/Postgres coordination without changing
  client contracts.

## Architecture and authority

Use a platform-level social module for friendship, blocks, presence, and party contracts; probable
waffle consumes party snapshots for lobby and matchmaking integration. Clients send intent only.
Nest services authenticate the caller, load authoritative membership, enforce leadership and
capacity, transact persistent mutations, then publish sanitized events to per-user or per-party
Socket.IO rooms.

```text
Angular intent -> guarded Nest command -> social persistence/party authority
                                      -> user/party socket event
Party queue intent -> immutable party snapshot -> matchmaking queue adapter
                                           -> atomic team/slot reservation -> game instance
```

Supabase remains durable authority for relationships, blocks, parties, membership, and invitations.
Presence and queue occupancy are ephemeral server state with reconnect grace; their service
interfaces must not expose the in-memory implementation.

## Data model

### Friendships and safety

- `friend_relationships`: canonical ordered user pair, requester, `pending | accepted`, timestamps,
  and a uniqueness constraint on the pair. Decline/cancel/remove deletes the row; all transitions
  are server validated.
- `user_blocks`: blocker/blockee pair and creation time. A block removes any friendship, revokes
  outstanding invites, prevents discovery/invites, and hides presence in one transaction.
- Exact username discovery returns only the minimum public profile projection and never email,
  moderation data, blocked users, or inactive accounts.

### Parties

- `parties`: id, leader user id, revision, created/updated timestamps.
- `party_members`: party id, user id, stable joined sequence/time, and uniqueness on user id so one
  user cannot join two parties.
- `party_invitations`: id, party id, inviter, invitee, expiry, terminal status, and idempotency key.
- Database functions/RPCs own multi-row transitions such as accept invite, leader transfer, block,
  and disband. RLS permits members to read their party and users to read invitations addressed to
  them; service-role mutations remain behind guarded Nest commands.

### Queue tickets

- A ticket contains ticket id, party id/revision, ordered member snapshot, selected faction per
  member, map-pool intersection, team configuration, enqueue time, and lifecycle state.
- At most one active ticket may contain a user. Any membership/revision change invalidates the
  ticket before matching.
- FFA places every member in a separate team but keeps the ticket atomic for match admission and
  cancellation. Team modes place the whole party on one team; a party larger than team capacity is
  rejected. Parties can be combined only when their sizes exactly fit remaining team slots.
- The matcher selects a common map with sufficient start positions, reserves all player slots/team
  assignments atomically, creates the game instance, and only then emits `match-found` to every
  member. Failure rolls back the reservation and leaves tickets queued or explicitly failed.

## API and realtime contract

Contracts belong in shared protocol libraries and use typed user, friendship, party, invitation,
and ticket identifiers.

- Friends HTTP intents: exact username lookup; list with cursor; send, accept, decline, cancel, and
  remove; block and unblock.
- Party HTTP intents: get current; invite, accept, decline; leave, kick, transfer leader, disband;
  create/join custom lobby; enqueue/cancel matchmaking.
- Realtime projections: friendship changed, invitation changed, party snapshot changed, presence
  changed, queue state changed, and match found. Events include monotonic revision/version so stale
  reconnect delivery cannot overwrite newer state.
- Presence states are `offline | online | in_lobby | queued | in_game`; the server derives activity
  from authenticated socket counts and authoritative lobby/queue/game transitions. Clients cannot
  set presence directly.

## Implementation stages

### Stage 1: social contracts and persistence

- Add branded identifiers, state machines, DTOs, migrations, indexes, RLS, transactional RPCs, and
  repository/service interfaces.
- Implement exact-username public projection and friend/block commands.
- Test self-request rejection, duplicate/crossed requests, idempotency, authorization, inactive
  users, block cleanup, and concurrent accepts.

Acceptance: two authenticated users can safely complete the full friend lifecycle; blocked users
cannot discover, invite, or observe each other's presence.

### Stage 2: presence and friends UI

- Add authenticated user socket rooms, connection counting, reconnect grace, server-derived activity,
  and snapshot-on-reconnect.
- Add a lazy-loaded social panel for search, inbound/outbound requests, friends, blocks, and presence.
- Add Angular service/component tests and gateway/service tests.

Acceptance: multiple tabs do not create false offline transitions; unauthorized users receive no
presence event; reconnect converges from a fresh snapshot.

### Stage 3: party core

- Implement party/invitation persistence, five-minute expiry, leader transfer, kick/leave/disband,
  four-member capacity, revision checks, and rate limits.
- Add the party panel and actionable invitations.
- Test concurrent invite acceptance, one-party-per-user, leader loss, expiry, blocks, and stale
  client revisions.

Acceptance: party state remains server authoritative and converges for all members after reconnect.

### Stage 4: custom lobby integration

- Let the leader create/select a custom lobby and issue server-owned admission grants to all party
  members.
- Reserve member player slots before clients navigate; validate map capacity; expose readiness and
  per-member faction/team choices while only the host controls lobby-wide settings.
- Revoke grants on leave, kick, disband, lobby close, or expiry; reuse current host-transfer rules.

Acceptance: the whole party joins public or private custom lobbies without client-side identity
spoofing, over-capacity, partial placement, or orphaned reservations.

### Stage 5: generic party matchmaking engine

- Replace per-user pending entries with queue tickets and a serialized queue mutation boundary.
- Implement shared capacity, map-intersection, slot-reservation, cancellation, and match-promotion
  primitives before enabling individual configurations.
- Preserve solo tickets as one-member parties and explicitly document the single-server invariant.

Acceptance: enqueue/cancel/match operations are idempotent; no user or slot exists in two active
tickets/matches; party revision changes invalidate stale tickets.

### Stage 6: all declared matchmaking flows

- Enable 2v2 first as the smallest team-placement proof, then 3v3 and 4v4 using the same generic fit
  algorithm, then FFA with atomic separate-team placement.
- Match whole tickets without splitting parties. Combine tickets by capacity and common map pool,
  with deterministic team/slot assignment independent of request arrival races.
- Test solo-only, full premade, mixed party sizes, incompatible maps, capacity rejection, cancellation,
  disconnect/reconnect, and simultaneous match completion for every configuration.

Acceptance: FFA, 2v2, 3v3, and 4v4 are supported end to end; no mode uses a special client-authority
shortcut. Rollout flags may enable configurations independently without changing contracts.

### Stage 7: hardening and release

- Add structured audit/diagnostic events, metrics for invite and queue outcomes, bounded cleanup, and
  abuse-limit tests.
- Run affected lint, type checks, unit/integration tests, builds, database reset/migration validation,
  and a two-to-eight-profile manual matrix covering all configurations.
- Document the single-server queue limitation and create a separate scaling issue before adding a
  second API replica.

## Acceptance matrix

- Friends: request, crossed request, accept, decline, cancel, remove, block, unblock, pagination.
- Presence: multi-tab, abrupt disconnect, grace reconnect, lobby, queue, game, privacy after block.
- Party: invite expiry/rate limit, concurrent accept, full party, leader leave/disconnect, kick,
  disband, stale revision, blocked relationship.
- Lobby: public/private admission, capacity, host transfer, party mutation during reservation.
- Matchmaking: solo, 2+2, 3+3, 4+4, mixed ticket sizes, party FFA, map intersection, cancellation,
  duplicate queue, reconnect, and atomic match-found delivery.
- Security: forged user/party ids, non-leader commands, stale grants, inactive/banned profiles, RLS,
  event audience isolation, and rate limits.

## Risks and deferred scaling work

- Supporting every declared flow is practical because the protocol already models all four team
  configurations, but implementing them in one undifferentiated change would hide placement bugs.
  Stages 5 and 6 deliberately build one generic engine and enable modes incrementally.
- Multi-replica presence and queue coordination is deferred until deployment requires it. The first
  implementation must fail startup or disable queue ownership when configured inconsistently,
  rather than silently running independent queues.
- Public display-name/fuzzy discovery, larger-than-four parties, cross-game parties, party voice chat,
  and durable offline presence history remain out of scope.

## Remaining questions

None block Stage 1. Product tuning such as invite-rate numbers, reconnect-grace duration, and queue
wait thresholds should use conservative configurable defaults and can be adjusted without changing
the approved contracts.

## Continuation prompt

```text
Continue #641/#642 from draft PR #763. Treat all decisions in the plan as approved, including
support for custom lobbies plus FFA, 2v2, 3v3, and 4v4 through one generic party-ticket matcher.
Implement Stage 1 only: shared typed contracts, Supabase migrations/schema/RLS/RPCs, exact-username
discovery, friend lifecycle, block/unblock behavior, Nest services/controllers, and focused tests.
Do not implement presence, party UI, lobbies, or matchmaking yet. Keep the PR draft, report complete
validation evidence, and provide the exact Stage 2 continuation prompt. Do not merge.
```
