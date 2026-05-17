# Getting Started

## Prerequisites

| Tool | Requirement |
| ---- | ----------- |
| Node.js | LTS recommended |
| pnpm | [Install pnpm](https://pnpm.io/installation) — **required**, npm/yarn are not supported |
| Git | Latest stable |

## 1. Clone & Install

```bash
git clone https://github.com/JernejHabjan/fuzzy-waddle.git
cd fuzzy-waddle
pnpm install
```

## 2. Configure Environment

Copy `.env.example` to `.env` in the project root and fill in the values:

| Variable               | Value                                 |
| ---------------------- | ------------------------------------- |
| `CORS_ORIGIN`          | `http://localhost:4200`               |
| `SUPABASE_URL`         | From your Supabase project settings   |
| `SUPABASE_SERVICE_KEY` | `service_role` key from Supabase dashboard |

See the [Supabase setup guide](supabase.md) for how to obtain these values.

## 3. Start the Dev Servers

```bash
pnpm start          # starts both client and API concurrently
```

Or individually:

```bash
pnpm start:client   # Angular client → http://localhost:4200
pnpm start:api      # NestJS API     → http://localhost:3333
```

## Common Commands

| Command | Description |
| ------- | ----------- |
| `pnpm build` | Build all projects |
| `pnpm test` | Run all unit tests |
| `pnpm lint` | Lint all projects |
| `pnpm lint-fix` | Lint with auto-fix |
| `pnpm e2e` | Run Cypress end-to-end tests |
| `pnpm format` | Format code |
| `pnpm dep-graph` | Open Nx dependency graph |
| `pnpm editor` | Launch Phaser Editor 2D (port 1959) |

To run a command for a single app:

```bash
nx build client
nx test api
nx lint client
nx test client --testFile=apps/client/src/app/auth/auth.service.spec.ts
```
