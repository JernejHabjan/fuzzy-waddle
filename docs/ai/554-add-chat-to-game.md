# #554 Add Chat to Game

## Overview
Add in-game chat to Probable Waffle. Chat button in Phaser HUD (above minimap) emits utility event to open Angular modal. Incoming messages show as toast notification in Phaser HUD when chat closed.

---

## Files to Modify/Create

### New Files (Phaser)
- [ ] `apps/client/src/app/probable-waffle/game/prefabs/gui/buttons/ChatButton.ts` - Phaser button above minimap
- [ ] `apps/client/src/app/probable-waffle/game/prefabs/gui/labels/ChatNotification.ts` - Phaser toast notification

### New Files (Angular)
- [ ] `apps/client/src/app/probable-waffle/gui/in-game-chat/in-game-chat.component.ts` - Chat modal component
- [ ] `apps/client/src/app/probable-waffle/gui/in-game-chat/in-game-chat.component.html`
- [ ] `apps/client/src/app/probable-waffle/gui/in-game-chat/in-game-chat.component.scss`

### Modified Files
- [ ] `apps/client/src/app/probable-waffle/game/world/scenes/hud-scenes/HudProbableWaffle.ts` - Add ChatButton and ChatNotification
- [ ] `apps/client/src/app/probable-waffle/communicators/probable-waffle-communicator.service.ts` - Add "chat" to utilityEvents type
- [ ] `apps/client/src/app/probable-waffle/communicators/game-instance-client.service.ts` - Handle "chat" event, open modal, listen to messages for notification

---

## Implementation Steps

### Phase 1: ChatButton Phaser Prefab

- [ ] **1.1** Create `ChatButton.ts` in `prefabs/gui/buttons/`
  - Extend `Phaser.GameObjects.Container`
  - Structure similar to `IdleWorkersButton.ts`:
    - 9-slice button background (`cryos_mini_gui/buttons/button_small.png`)
    - Chat icon/text (use text "💬" or simple "Chat" text)
    - Interactive area with pointer events
    - Use `OnPointerUpScript` + `EmitEventActionScript` pattern
  - On click: emit `this.communicator.utilityEvents.emit({ name: "chat" })`
  - Add unread badge indicator (small circle/dot) - hidden by default
  - Method: `showUnreadBadge()` / `hideUnreadBadge()`

- [ ] **1.2** Add to `HudProbableWaffle.ts`
  - Import ChatButton
  - Create instance in `editorCreate()`: position below `idleWorkersButton`
  - Add to class fields
  - Handle positioning in `updatePositionOfUiElements()`:
    - Position: left side, below idleWorkersButton (above minimap area)
    - Scale responsive like other buttons
    - Hide for Skirmish mode (single-player)
    - Hide on small screens (`< minimapHideBreakpoint`)

### Phase 2: ChatNotification Phaser Component

- [ ] **2.1** Create `ChatNotification.ts` in `prefabs/gui/labels/`
  - Extend `Phaser.GameObjects.Container`
  - Semi-transparent dark background (9-slice or rectangle)
  - Player name text (bold/colored)
  - Message text (truncated with ellipsis if too long)
  - Max width ~250px
  - Hidden by default (`visible = false`)
  - Method: `showMessage(playerName: string, messageText: string)`:
    - Set texts
    - Show container
    - Auto-hide after 5 seconds via `this.scene.time.delayedCall(5000, ...)`
  - Method: `hide()`

- [ ] **2.2** Add to `HudProbableWaffle.ts`
  - Import ChatNotification
  - Create instance in `editorCreate()`
  - Position in `updatePositionOfUiElements()`:
    - Above ChatButton on left side
    - Responsive positioning

### Phase 3: Angular Chat Modal

- [ ] **3.1** Create `InGameChatComponent`
  - Standalone component
  - Wrap shared `ChatComponent` from `shared/components/chat/`
  - Inputs from modal: `fromGame`, `dialogRef`
  - Inject `ProbableWaffleCommunicatorService`
  - Inject `GameInstanceClientService` for `gameInstanceId`
  - Subscribe to `communicatorService.message?.on` for incoming messages
  - On new message from user: send via `communicatorService.message?.send()`
  - Template: container with chat component, close button

- [ ] **3.2** Style as modal
  - Dark semi-transparent background
  - Reasonable size (~400x500px)
  - Close button in header
  - Use existing modal styling patterns from `OptionsComponent`

### Phase 4: Wire Up Communication

- [ ] **4.1** Update `ProbableWaffleCommunicatorService`
  - Add `"chat"` to utilityEvents type union:
    ```typescript
    utilityEvents = new EventEmitter<{ name: "save-game" | "load-game" | "settings" | "chat"; data?: any }>();
    ```

- [ ] **4.2** Update `GameInstanceClientService.listenToUtilityGameEvents()`
  - Add `"chat"` to filter
  - Handle `"chat"` case: open `InGameChatComponent` modal via `NgbModal`

- [ ] **4.3** Add message listener for notifications
  - In `GameInstanceClientService`, subscribe to `communicatorService.message?.on`
  - When message received:
    - Emit event to Phaser HUD to show notification (via communicator or scene event)
    - Set unread badge on ChatButton
  - When chat modal opens: clear unread state

- [ ] **4.4** Communication from Angular to Phaser for notifications
  - Add new event to `utilityEvents`: `"chat-message-received"` with ChatMessage data
  - OR add to `allScenes` EventEmitter
  - HudProbableWaffle subscribes and calls `chatNotification.showMessage()`

### Phase 5: Hide for Skirmish Mode

- [ ] **5.1** In `HudProbableWaffle.updatePositionOfUiElements()`
  - Check `gameType !== ProbableWaffleGameInstanceType.Skirmish`
  - Set `chatButton.visible` accordingly
  - Also hide chatNotification for Skirmish

---

## Component Hierarchy

```
HudProbableWaffle (Phaser Scene)
├── [existing elements]
├── ChatButton (bottom-left, above minimap, below idleWorkersButton)
│   └── unread badge indicator
└── ChatNotification (above ChatButton)
    ├── background
    ├── player name text
    └── message text

Angular (Modal overlay)
└── InGameChatComponent (NgbModal)
    └── ChatComponent (shared)
```

---

## Data Flow

```
Opening Chat:
ChatButton click → utilityEvents.emit({ name: "chat" })
  → GameInstanceClientService.listenToUtilityGameEvents()
  → NgbModal.open(InGameChatComponent)

Sending Message:
User types → ChatComponent.newMessage
  → InGameChatComponent → communicatorService.message.send()
  → WebSocket → Server → broadcast to room

Receiving Message (chat open):
WebSocket → communicatorService.message.on
  → InGameChatComponent receives → ChatComponent displays

Receiving Message (chat closed):
WebSocket → communicatorService.message.on
  → GameInstanceClientService detects chat closed
  → Emit to Phaser: allScenes.emit({ name: "chat-message-received", data: message })
  → HudProbableWaffle → chatNotification.showMessage()
  → HudProbableWaffle → chatButton.showUnreadBadge()
```

---

## Positioning Reference

```
┌─────────────────────────────────────┐
│  [Resources]              [Menu]    │
│                                     │
│                                     │
│  ┌─────────────────┐                │
│  │ Chat Notification│ (5s, auto-hide)
│  └─────────────────┘                │
│  [💬•] Chat Button (• = unread)     │
│  [zzz] Idle Workers                 │
│  [>>] Game Speed                    │
│  ┌─────────────┐      ┌───────────┐ │
│  │  Minimap    │      │  Actions  │ │
│  └─────────────┘      └───────────┘ │
└─────────────────────────────────────┘
```

---

## Key Dependencies

- `ChatComponent` from `apps/client/src/app/shared/components/chat/`
- `ProbableWaffleCommunicatorService` - message TwoWayCommunicator
- `GameInstanceClientService` - gameInstanceId, modal handling
- `NgbModal` - Angular modal service
- Button textures: `gui` atlas, `cryos_mini_gui/buttons/button_small.png`

---

## Notes

- No backend changes needed - reuses existing WebSocket room
- No tests required per ticket
- Messages persist to same Supabase table
- Follow existing patterns from IdleWorkersButton (Phaser) and OptionsComponent (Angular modal)
