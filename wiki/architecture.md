# Architecture

## Tech Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| Frontend (web)     | Angular 21, Phaser 4, Bootstrap 5, Chart.js     |
| Frontend (desktop) | Tauri 2 (Rust shell wrapping the Angular build) |
| Backend            | NestJS 11, Socket.IO                            |
| Database / Auth    | Supabase (PostgreSQL)                           |
| Monorepo tooling   | Nx 22                                           |
| Package manager    | pnpm                                            |

## Monorepo Structure

```
fuzzy-waddle/
├── apps/
│   ├── client/          # Angular SPA + all Phaser games (web + desktop)
│   │   └── src-tauri/   # Tauri v2 Rust shell (Probable Waffle desktop)
│   └── api/             # NestJS backend
├── libs/
│   └── api-interfaces/  # Shared TypeScript contracts (client ↔ server)
└── supabase/            # Local Supabase config, migrations, schemas, and seeds
```

## Games

| Game            | Genre              | Directory                              |
| --------------- | ------------------ | -------------------------------------- |
| Probable Waffle | Real-time strategy | `apps/client/src/app/probable-waffle/` |
| Fly Squasher    | Arcade             | `apps/client/src/app/fly-squasher/`    |
| Little Muncher  | Platformer         | `apps/client/src/app/little-muncher/`  |
| Dungeon Crawler | RPG                | `apps/client/src/app/dungeon-crawler/` |

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

## Desktop App Architecture (Tauri)

The Probable Waffle desktop app is built directly from `apps/client` — no separate wrapper app.

- `apps/client/src-tauri/` contains the Tauri v2 Rust shell
- `apps/client/project.json` has three build configs: `production` (web), `development`, and `tauri` (swaps `environment.ts` → `environment.prod.ts`, disables service worker)
- `TauriService` (`apps/client/src/app/shared/services/tauri.service.ts`) and standalone `isTauri()` provide runtime Tauri detection — no-ops in browser builds
- The Rust shell exposes desktop commands for cursor grab, fullscreen toggling, app version lookup, and quitting
- On startup in Tauri, `AppComponent` automatically navigates to `/aota`
- Connects to the same hosted NestJS API as the web app

See [Tauri Desktop](tauri-desktop.md) for prerequisites and build instructions.

## API Architecture

- Game modules in `apps/api/src/app/{game-name}/`
- Authentication via Supabase OAuth + JWT (`SupabaseAuthGuard`)
- WebSocket gateways (`@WebSocketGateway()`) handle real-time multiplayer state

## Real-time Communication

Socket.IO is used for multiplayer game state synchronization:

- **Client**: `AuthenticatedSocketService` establishes a JWT-authenticated Socket.IO connection
- **Server**: WebSocket gateways with `SupabaseAuthGuard` validate tokens on every event
- **Event contracts**: defined in `libs/api-interfaces/src/lib/communicators/` — import these in both client and server to keep event names and payloads in sync
- **AOTA multiplayer design**: see [AOTA Multiplayer Architecture](aota-multiplayer-architecture.md)

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
