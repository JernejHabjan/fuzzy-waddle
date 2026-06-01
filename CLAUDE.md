# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fuzzy Waddle is an Nx monorepo containing a multiplayer game platform with multiple Phaser-based games, an Angular frontend, and a NestJS backend.

## Build & Development Commands

```bash
# Install dependencies (pnpm required)
pnpm install

# Start both client and API
pnpm start

# Start individual apps
pnpm start:client     # Angular client at localhost:4200
pnpm start:api        # NestJS API at localhost:3333

# Build
pnpm build            # Build all projects
nx build client       # Build client only
nx build api          # Build API only

# Tauri desktop (requires Rust — see wiki/tauri-desktop.md)
pnpm tauri:dev        # Angular dev server + Tauri window (parallel)
pnpm tauri:build      # Build platform installers (.msi/.dmg/.AppImage)

# Test
pnpm test             # Run all tests
nx test client        # Test client only
nx test api           # Test API only
nx test client --testFile=apps/client/src/app/auth/auth.service.spec.ts  # Single test file

# Lint
pnpm lint             # Lint all projects
pnpm lint-fix         # Lint with auto-fix
nx lint client        # Lint client only

# E2E
pnpm e2e              # Run Cypress e2e tests
```

## Architecture

### Monorepo Structure

- **apps/client**: Angular 21 SPA with Phaser 4 game engine integration
  - `src-tauri/`: Tauri v2 Rust shell for the Probable Waffle desktop app
- **apps/api**: NestJS 11 backend with WebSocket gateways
- **libs/api-interfaces**: Shared TypeScript interfaces for client-server contracts

### Client (Angular + Phaser)

- Four games: Probable Waffle (strategy), Fly Squasher (arcade), Little Muncher (platformer), Dungeon Crawler (RPG)
- Game code lives in `apps/client/src/app/{game-name}/game/` (Phaser scenes)
- UI/GUI for games in `apps/client/src/app/{game-name}/gui/`
- Shared Phaser abstractions in `apps/client/src/app/shared/game/phaser/`
- Game assets in `apps/client/src/assets/{game-name}/`
- Asset pack metadata (Phaser Editor 2D) in `apps/client/src/metadata/{game-name}/`

### API (NestJS)

- Game-specific modules in `apps/api/src/app/{game-name}/`
- WebSocket gateways handle real-time game state sync
- Auth via Supabase OAuth + JWT (guards in `apps/api/src/auth/`)

### Real-time Communication

- Socket.IO for multiplayer game state synchronization
- Client: `AuthenticatedSocketService` creates JWT-authenticated connections
- Server: `@WebSocketGateway()` decorators with `SupabaseAuthGuard`
- Event contracts defined in `libs/api-interfaces/src/lib/communicators/`

### State Management

- Angular services with RxJS Subjects/Observables
- Phaser game data via registry pattern (`BaseGame` class)
- Game saves via IndexedDB (`GameInstanceIndexeddbStorageService`)

## Key Configuration Files

- `nx.json`: Nx workspace config (default base is `develop` branch)
- `apps/client/proxy.conf.json`: Dev server API proxy
- `apps/client/ngsw-config.json`: Service worker config
- `.env`: API environment variables (copy from README instructions)

## Angular Conventions (from copilot-instructions.md)

- **Always use standalone components** (do NOT set `standalone: true` - it's default in Angular v20+)
- Use `input()` and `output()` functions instead of `@Input`/`@Output` decorators
- Use signals for state: `signal()`, `computed()`, `effect()`
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in components
- Use native control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- Use `inject()` function instead of constructor injection
- Use `host` object in decorator instead of `@HostBinding`/`@HostListener`
- Use `class` bindings instead of `ngClass`, `style` bindings instead of `ngStyle`
- Prefer Reactive forms over Template-driven forms
- **Do not remove or modify existing comments** - treat them as read-only

## TypeScript Conventions

- Use strict type checking
- Avoid `any` type; use `unknown` when type is uncertain
- Prefer type inference when obvious

## File Organization Rules

When generating files, place them in appropriate locations to keep the project tidy:

- **Documentation/markdown files**: Place in `docs/ai/` (create if needed)
- **Debug scripts and one-off test files**: Place in `tmp/` (already gitignored)
- **Never create files in the project root** unless they are standard config files

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
