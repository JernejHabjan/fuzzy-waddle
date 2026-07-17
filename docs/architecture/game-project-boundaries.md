# Game project boundaries

This document records the migration boundary agreed for the four games. Nx tags
and import aliases use these names throughout the migration.

## Applications

| Project | Root | Responsibility |
| --- | --- | --- |
| `portal` | `apps/portal` | Web shell and lazy composition of all game interfaces |
| `api` | `apps/api` | NestJS composition root |
| `probable-waffle-desktop` | `apps/probable-waffle-desktop` | Probable Waffle-only Angular and Tauri shell |
| `portal-e2e` | `apps/portal-e2e` | Portal end-to-end tests |
| `api-e2e` | `apps/api-e2e` | API end-to-end tests |

## Libraries

Each game owns an Angular `interface` and Phaser `gameplay` project. Networked
games additionally own `protocol` and `server` projects.

| Domain | Projects |
| --- | --- |
| Probable Waffle | `probable-waffle-gameplay`, `probable-waffle-interface`, `probable-waffle-protocol`, `probable-waffle-server` |
| Little Muncher | `little-muncher-gameplay`, `little-muncher-interface`, `little-muncher-protocol`, `little-muncher-server` |
| Fly Squasher | `fly-squasher-gameplay`, `fly-squasher-interface`, `fly-squasher-protocol`, `fly-squasher-server` |
| Dungeon Crawler | `dungeon-crawler-gameplay`, `dungeon-crawler-interface` |
| Platform | `platform-identity`, `platform-chat`, `platform-game-sessions`, `platform-database-schema`, `platform-game-host` |

## Tags and dependency direction

Projects use `scope:<game-or-platform>` and one of `type:app`,
`type:interface`, `type:gameplay`, `type:protocol`, `type:server`, or
`type:platform`.

- Applications compose libraries.
- An interface may import its own gameplay and protocol plus platform projects.
- Gameplay may import its own protocol and framework-independent platform types.
- A server may import its own protocol and platform projects.
- Protocol projects contain serializable values and boundary validation only.
- Platform projects never import game projects.
- Games never import another game's projects.

The migration introduces these tags before enabling their final lint
constraints, so unmigrated source remains usable between staged commits.

## Migration result

- Nx applications: `portal`, `portal-e2e`, `probable-waffle-desktop`, `api`,
  and `api-e2e`.
- Web routes: `/little-muncher`, `/fly-squasher`, `/dungeon-crawler`, and
  `/aota` for Probable Waffle.
- API game modules: Little Muncher, Fly Squasher, and Probable Waffle.
- Phaser Editor: one configuration and skip file per gameplay project.
- Tauri: isolated in `apps/probable-waffle-desktop/src-tauri` and configured to
  open `/aota`.
- Game assets and metadata: owned by each game below
  `libs/games/<game>/gameplay/src`.
- Phaser scenes: Fly Squasher has 4 scene files and Probable Waffle has 454;
  scene files and generated TypeScript remain in the same gameplay project.

## Contract ownership

| Contract area | Owner |
| --- | --- |
| chat | `platform-chat` |
| current user/profile and UUID | `platform-identity` |
| generic room, session, game-instance, player, spectator, and vector types | `platform-game-sessions` |
| generated database types and enums | `platform-database-schema` |
| Fly Squasher communicators, game instances, scores, and user info | `fly-squasher-protocol` |
| Little Muncher communicators, game instances, scores, and user info | `little-muncher-protocol` |
| Probable Waffle communicators, transport DTOs, campaign, achievements, match history, and user info | `probable-waffle-protocol` |
| Probable Waffle setup helpers, seeded randomness, definitions, spell/status rules | `probable-waffle-gameplay` |
