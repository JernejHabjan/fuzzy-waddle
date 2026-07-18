# Getting Started

## Prerequisites

| Tool    | Requirement                                         |
| ------- | --------------------------------------------------- |
| Node.js | `>=24.13.0`                                         |
| pnpm    | `>=10.0`; npm/yarn are not supported for installs   |
| Git     | Latest stable                                       |
| Git LFS | Required for playable audio assets                  |
| Docker  | Required only when running the local Supabase stack |

## 1. Clone & Install

```bash
git lfs install
git clone https://github.com/JernejHabjan/fuzzy-waddle.git
cd fuzzy-waddle
pnpm install
```

If the repository was cloned before Git LFS was installed, hydrate the existing checkout:

```bash
pnpm assets:hydrate
```

## 2. Configure Environment

There are two env files for local development:

- The root `.env` is read by the Supabase CLI while starting the local stack. It only contains the local Google OAuth provider values referenced from `supabase/config.toml`.
- `apps/api/.env.local` is read by the Nest API. It contains API runtime values such as CORS and Supabase connection credentials.

Copy the root env example:

```bash
cp .env.example .env
```

| Variable                                  | Local value / source                     |
| ----------------------------------------- | ---------------------------------------- |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Google Cloud Console OAuth client ID     |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`    | Google Cloud Console OAuth client secret |

Copy the API env example:

```bash
cp apps/api/.env.example apps/api/.env.local
```

| Variable               | Local value / source                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| `CORS_ORIGIN`          | `http://localhost:4200`                                                    |
| `SUPABASE_URL`         | Local Supabase API URL, usually `http://127.0.0.1:54321`                   |
| `SUPABASE_SERVICE_KEY` | Local secret key from `supabase status` > `Authentication Keys` > `Secret` |

See the [Supabase setup guide](supabase.md) for local startup, Google OAuth, and hosted project values.

## 3. Start the Dev Servers

If you are using local Supabase, start it first:

```bash
supabase start
```

Then start the app:

```bash
pnpm start          # starts both client and API concurrently
```

Or individually:

```bash
pnpm start:client   # Angular client → http://localhost:4200
pnpm start:api      # NestJS API     → http://localhost:3333
```

## Common Commands

| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `pnpm build`     | Build all projects                               |
| `pnpm test`      | Run all unit tests                               |
| `pnpm lint`      | Lint all projects                                |
| `pnpm lint-fix`  | Lint with auto-fix                               |
| `pnpm e2e`       | Run Cypress end-to-end tests                     |
| `pnpm format`    | Format code                                      |
| `pnpm dep-graph` | Open Nx dependency graph                         |
| `pnpm phaser-editor:check` | Validate all self-contained Phaser Editor projects |

To run a command for a single app:

```bash
nx build portal
nx test api
nx lint portal
nx test platform-identity --testFile=libs/platform/identity/src/lib/client/auth/auth.service.spec.ts
```
