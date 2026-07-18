# Architecture

## Tech Stack

| Layer              | Technology                                  |
| ------------------ | ------------------------------------------- |
| Frontend (web)     | Angular 21, Phaser 4, Bootstrap 5, Chart.js |
| Frontend (desktop) | Angular 21 and Tauri 2                      |
| Backend            | NestJS 11, Socket.IO                        |
| Database / Auth    | Supabase (PostgreSQL)                       |
| Monorepo tooling   | Nx 23, pnpm                                 |

## Monorepo Structure

```text
fuzzy-waddle/
├── apps/
│   ├── portal/                     # Browser shell for all games
│   ├── probable-waffle-desktop/    # Probable Waffle Angular/Tauri host
│   └── api/                        # NestJS composition root
├── libs/
│   ├── games/
│   │   ├── probable-waffle/
│   │   ├── little-muncher/
│   │   ├── fly-squasher/
│   │   └── dungeon-crawler/
│   └── platform/
│       ├── identity/
│       ├── chat/
│       ├── game-sessions/
│       ├── database-schema/
│       └── game-host/
└── supabase/
```

Each game is split by game-facing responsibility:

- `gameplay` owns Phaser scenes, prefabs, game rules, assets, and Phaser Editor configuration.
- `interface` owns Angular routes, menus, HUD, browser networking, and UI orchestration.
- `protocol` owns serializable multiplayer values and transport validation.
- `server` owns the game's NestJS controllers, gateways, and server orchestration.

Dungeon Crawler is local-only and currently needs only `gameplay` and `interface`.
Applications compose libraries; game libraries do not import another game, and
platform libraries do not import games.

See [Game project boundaries](../docs/architecture/game-project-boundaries.md)
for the complete project list and dependency direction.

## Browser and Desktop Applications

`apps/portal` lazy-loads the four game interfaces. Its production output is
`dist/apps/portal`.

`apps/probable-waffle-desktop` is a separate Angular application that composes
only Probable Waffle and its required platform capabilities. Its Rust shell is
in `apps/probable-waffle-desktop/src-tauri`, and its frontend output is
`dist/apps/probable-waffle-desktop`.

## Phaser Editor

Each Phaser Editor project is independently openable:

- `libs/games/probable-waffle/phaser`
- `libs/games/little-muncher/gameplay`
- `libs/games/fly-squasher/gameplay`
- `libs/games/dungeon-crawler/gameplay`

The `.scene` files, generated TypeScript, metadata, assets, `.skip`, and
`phasereditor2d.config.json` live together in the owning Phaser Editor project.
Probable Waffle keeps framework-free rules in its separate `gameplay` project,
with dependency direction `interface -> phaser -> gameplay -> protocol`.
Editor-only copies of shared prefab definitions use thin local TypeScript
adapters, so the editor can resolve every prefab ID while runtime behaviour
continues to come from `platform-game-host`.

Run `pnpm phaser-editor:check` to verify asset-pack URLs, multiatlas frames,
and prefab references across all four editor projects.

## API Architecture

`apps/api` is the NestJS composition root. Game-specific backend code lives in
the owning `server` project and is registered by the API application.
Authentication, database setup, and cross-game infrastructure remain platform
or application composition concerns.

## Contracts

There is no catch-all API interfaces package. Import contracts from their owner:

- identity and UUID values: `@fuzzy-waddle/platform-identity`
- chat values: `@fuzzy-waddle/platform-chat`
- sessions, rooms, players, spectators, and vectors: `@fuzzy-waddle/platform-game-sessions`
- generated database schema: `@fuzzy-waddle/platform-database-schema`
- game-specific transport values: the owning `*-protocol` project

## Database Architecture

- Supabase Auth owns login identity; `user_profiles` stores app profile data.
- Game content lives in TypeScript and assets. Database rows store stable game,
  level, hill, and map keys.
- Game history and scoring use shared session, participant, score, metric, and
  snapshot tables.
- Chat uses shared channel and message tables.
- NestJS handles service-role operations, moderation, score submission,
  snapshots, and cross-user aggregation.

## Real-time Communication

Socket.IO carries multiplayer state. The Angular interface owns the browser
socket adapter, each game protocol owns its event names and payloads, and the
matching server project owns the NestJS gateway. Probable Waffle's detailed
design is documented in [AOTA Multiplayer Architecture](aota-multiplayer-architecture.md).
