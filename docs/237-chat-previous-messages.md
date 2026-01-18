# 237 - Chat View Previous Messages

## Summary
When joining a chat (lobby or general app chat), users should see previous messages (default: last 10). Scrolling up should lazy-load older messages.

---

## Current State Analysis

| Component | Status |
|-----------|--------|
| Message persistence (generic chat) | Exists - saves to `messages` table |
| Message persistence (lobby chat) | Missing - not saved to DB |
| Message retrieval endpoint | Missing |
| Pagination support | Missing |
| History fetch on join | Missing |
| Lazy loading on scroll | Missing |

---

## Implementation Tasks

### Phase 1: Database

- [ ] Update `DBMs/0003_messages.sql` - add `game_instance_id` column (nullable) for lobby-scoped messages
- [ ] Add index on `created_at` for efficient pagination queries
- [ ] Add RLS policy for service_role SELECT

### Phase 2: Backend - Chat Service

- [ ] Add `getMessages(limit, offset, gameInstanceId?)` method to `apps/api/src/app/chat/chat.service.ts`
- [ ] Add `postMessageWithGameInstance(text, user, gameInstanceId?)` method to support lobby messages
- [ ] Update interface in `IChatService`

### Phase 3: Backend - REST Endpoint

- [ ] Add `GET /chat/messages` endpoint to `apps/api/src/app/chat/chat.controller.ts`
- [ ] Query params: `limit` (default 10), `offset` (default 0), `gameInstanceId` (optional)
- [ ] Add `GetMessagesDto` for validation

### Phase 4: Backend - WebSocket Gateway

- [ ] Update `apps/api/src/app/probable-waffle/game-instance/game-instance.gateway.ts` to persist lobby messages
- [ ] Emit message history on room join (optional - or let client fetch via REST)

### Phase 5: Client - Chat Service

- [ ] Add `getMessages(limit, offset, gameInstanceId?)` method to `apps/client/src/app/data-access/chat/chat.service.ts`
- [ ] Return `Observable<ChatMessage[]>` or `Promise<ChatMessage[]>`

### Phase 6: Client - Shared Chat Component

- [ ] Update `apps/client/src/app/shared/components/chat/chat.component.ts`
- [ ] Add input for `gameInstanceId` (optional)
- [ ] Fetch previous messages on `ngOnInit`
- [ ] Add scroll event listener for lazy loading
- [ ] Track `hasMoreMessages` and `isLoading` state
- [ ] Prepend older messages when scrolled to top

### Phase 7: Client - Lobby Chat Integration

- [ ] Update `apps/client/src/app/probable-waffle/gui/lobby/lobby-chat/lobby-chat.component.ts`
- [ ] Pass `gameInstanceId` to shared chat component

---

## File Changes

| File | Action |
|------|--------|
| `DBMs/0003_messages.sql` | Modify |
| `apps/api/src/app/chat/chat.service.ts` | Modify |
| `apps/api/src/app/chat/chat.controller.ts` | Modify |
| `apps/api/src/app/probable-waffle/game-instance/game-instance.gateway.ts` | Modify |
| `apps/client/src/app/data-access/chat/chat.service.ts` | Modify |
| `apps/client/src/app/shared/components/chat/chat.component.ts` | Modify |
| `apps/client/src/app/shared/components/chat/chat.component.html` | Modify |
| `apps/client/src/app/probable-waffle/gui/lobby/lobby-chat/lobby-chat.component.ts` | Modify |
| `libs/api-interfaces/src/lib/chat/chat.ts` | Modify - add DTOs |

---

## API Contract

### GET /chat/messages

**Request:**
```
GET /chat/messages?limit=10&offset=0&gameInstanceId=abc123
```

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "text": "Hello",
      "userId": "uuid",
      "fullName": "User Name",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "hasMore": true
}
```

---

## Implementation Order

1. Database schema update
2. Backend service methods
3. Backend REST endpoint
4. Backend gateway persistence
5. Client service methods
6. Client shared component update
7. Lobby integration
8. Testing

---

## Notes

- Messages sorted by `created_at DESC` for retrieval, reversed on client for display
- Scroll threshold: load more when within 50px of top
- Debounce scroll events to prevent excessive API calls
- Consider adding message caching on client
