# Architecture

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | Angular 21, Phaser 4, Bootstrap 5, Chart.js |
| Backend | NestJS 11, Socket.IO |
| Database / Auth | Supabase (PostgreSQL) |
| Monorepo tooling | Nx 22 |
| Package manager | pnpm |

## Monorepo Structure

```
fuzzy-waddle/
├── apps/
│   ├── client/          # Angular SPA + Phaser games
│   └── api/             # NestJS backend
├── libs/
│   └── api-interfaces/  # Shared TypeScript contracts (client ↔ server)
├── DBMs/                # SQL migration scripts
```

## Games

| Game | Genre | Directory |
| ---- | ----- | --------- |
| Probable Waffle | Real-time strategy | `apps/client/src/app/probable-waffle/` |
| Fly Squasher | Arcade | `apps/client/src/app/fly-squasher/` |
| Little Muncher | Platformer | `apps/client/src/app/little-muncher/` |
| Dungeon Crawler | RPG | `apps/client/src/app/dungeon-crawler/` |

Each game follows the same layout:

```
{game}/
├── game/       # Phaser scenes and game logic
├── gui/        # Angular UI components (menus, HUD, etc.)
└── services/   # Angular services bridging UI and game
```

## Client Architecture

- **Phaser scenes** live in `game/` subdirectories and communicate with Angular via a shared registry pattern (`BaseGame` class)
- **Shared Phaser abstractions** are in `apps/client/src/app/shared/game/phaser/`
- **Asset packs** (Phaser Editor 2D metadata) are in `apps/client/src/metadata/{game-name}/`
- **Assets** (sprites, audio, tilemaps) are in `apps/client/src/assets/{game-name}/`

## API Architecture

- Game modules in `apps/api/src/app/{game-name}/`
- Authentication via Supabase OAuth + JWT (`SupabaseAuthGuard`)
- WebSocket gateways (`@WebSocketGateway()`) handle real-time multiplayer state

## Real-time Communication

Socket.IO is used for multiplayer game state synchronization:

- **Client**: `AuthenticatedSocketService` establishes a JWT-authenticated Socket.IO connection
- **Server**: WebSocket gateways with `SupabaseAuthGuard` validate tokens on every event
- **Event contracts**: defined in `libs/api-interfaces/src/lib/communicators/` — import these in both client and server to keep event names and payloads in sync

## Shared Interfaces

`libs/api-interfaces` is the single source of truth for all client-server contracts:

```
libs/api-interfaces/src/lib/
├── communicators/    # Real-time Socket.IO event types
├── game-instance/    # Game state and session types
├── game/             # Base game types
├── user-info/        # User profile types
└── chat/             # Chat message types
```
