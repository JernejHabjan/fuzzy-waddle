# #641 / #642 Party and Friends System plan

## Status

- [x] Inventory identity, lobby, matchmaking, and realtime boundaries.
- [ ] Resolve product decisions.
- [ ] Implement staged contracts, persistence, and server authority.
- [ ] Implement friends, presence, party, lobby, and queue flows.
- [ ] Complete automated and multi-profile manual validation.

## Current boundary

`user_profiles` provides identity, authenticated Socket.IO is available, and custom lobbies plus
single-player matchmaking exist. There is no friends/party schema, social API, presence gateway,
or party-aware queue. Current pending matchmaking is in-memory and accepts one user at a time.

## Stages

1. Contracts and persistence: friend state machine, party/membership/invitation model, migrations,
   RLS, server-owned DTOs, and authorization tests.
2. Friends MVP: exact username discovery; send, accept, decline, cancel, remove; paged list.
3. Presence: server-owned `offline | online | in_lobby | queued | in_game`, reconnect grace, and
   client subscription.
4. Party MVP: create, leave, disband, kick, leader transfer, and invitations; home-screen panel.
5. Custom lobby flow: leader-driven lobby settings and member placement.
6. Atomic matchmaking queue: party-capacity checks, cancellation, match-found transition, and
   duplicate-queue protection.
7. Lifecycle/security: authorization, disconnect/reconnect cleanup, observability, and a
   two-browser-profile manual matrix.

## Agent decisions needed

### Relationship model

**Question:** Directional subscriptions or mutual friendship with requests?

**Recommended default:** Mutual friendship with pending inbound/outbound state.

### Discovery

**Question:** Exact username lookup or public display-name search?

**Recommended default:** Exact unique username lookup initially.

### Party size and leader loss

**Question:** What is the initial cap and leader-disconnect behavior?

**Recommended default:** Cap at four; transfer to the earliest joined online member, dissolve only
when empty.

### Queue scope

**Question:** Which party flows ship first?

**Recommended default:** Custom lobbies first, then 2v2 matchmaking; defer larger teams and FFA.

### Invite safety

**Question:** What expiry and abuse controls are required?

**Recommended default:** Five-minute expiry, server rate limiting, and block/ignore before public
launch.

**Reply to each:** `Accept recommendation`, `Use: <alternative>`, or `Defer`.

## Continuation prompt

```text
Continue the #641/#642 decision PR. Treat each answered Agent decision needed item as final.
Do not implement runtime product code yet. Update the staged plan with the data model, API/event
contracts, migration/RLS authority, acceptance matrix, risks, and the smallest Stage 1 issue.
Keep this PR draft and provide the exact next implementation prompt.
```
