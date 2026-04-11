# Architecture

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend (web) | Angular 21, Phaser 4, Bootstrap 5, Chart.js |
| Frontend (desktop) | Tauri 2 (Rust shell wrapping the Angular build) |
| Backend | NestJS 11, Socket.IO |
| Database / Auth | Supabase (PostgreSQL) |
| Monorepo tooling | Nx 22 |
| Package manager | pnpm |

## Monorepo Structure

```
fuzzy-waddle/
├── apps/
│   ├── client/                   # Angular SPA + all Phaser games (web)
│   ├── probable-waffle-client/   # Standalone Angular app for desktop (Tauri)
│   │   └── src-tauri/            # Tauri v2 Rust shell
│   └── api/                      # NestJS backend
├── libs/
│   └── api-interfaces/  # Shared TypeScript contracts (client ↔ server)
├── DBMs/                # SQL migration scripts
```

`probable-waffle-client` reuses all game code, services, and assets from `apps/client` via the `@fuzzy-waddle/client/*` path alias — no code is duplicated.

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

## Desktop App Architecture (Tauri)

`apps/probable-waffle-client` is a standalone Angular app that wraps only the Probable Waffle (AOTA) game for desktop distribution.

- Bootstraps with its own `main.ts` and `app.routes.ts` — no service worker, no other games
- Three build configurations: `production` (web), `development`, and `tauri` (sets `environment.isDesktop = true`)
- `TauriService` (`apps/client/src/app/shared/services/tauri.service.ts`) provides cursor locking for RTS edge-scroll panning via a custom Rust command — is a no-op in browser builds
- The Rust shell lives in `src-tauri/src/lib.rs` and exposes one command: `set_cursor_grab(grab: bool)`
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
