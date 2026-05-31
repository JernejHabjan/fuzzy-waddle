# Supabase Setup

Fuzzy Waddle uses [Supabase](https://supabase.com) for authentication, the PostgreSQL database, and real-time features.

## Hosted Authentication

### Google OAuth

For the hosted Supabase project, enable Google in **Authentication > Providers > Google** and enter the OAuth client ID and secret from Google Cloud Console. The Google OAuth app must include Supabase's callback URL:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

For this hosted project, `<project-ref>` is `bhzetyxjimpabioxoodz`.

See Supabase's current [Google OAuth guide](https://supabase.com/docs/guides/auth/social-login/auth-google) for the Google Cloud Console steps.

### Hosted URL Configuration

In your Supabase project under **Authentication → URL Configuration**:

| Setting       | Value                                                                                     |
|---------------|-------------------------------------------------------------------------------------------|
| Site URL      | `https://fuzzy-waddle.onrender.com`                                                       |
| Redirect URLs | `http://localhost:4200/`                                                                  |
|               | `https://fuzzy-waddle.onrender.com/`                                                      |
|               | `https://jernejhabjan.github.io/fuzzy-waddle/`                                            |
|               | `http://localhost:4200/assets/auth-callback.html` ← Tauri dev OAuth callback              |
|               | `https://fuzzy-waddle.onrender.com/assets/auth-callback.html` ← Tauri prod OAuth callback |
|               | `com.fuzzywaddle.probablewaffle://auth/callback` ← Tauri deep-link (kept as fallback)     |

## Local Supabase Development

A local Supabase config is available under `supabase/`. It is loaded by `supabase start` and uses Docker.

The local Supabase CLI reads the root `.env` file because `supabase/config.toml` references its Google OAuth values with `env(...)`. The Nest API does not use the root `.env`; its local values belong in `apps/api/.env.local`.

### Local Google OAuth

Local Google sign-in is enabled in `supabase/config.toml`:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
skip_nonce_check = true
```

Copy the root `.env.example` to `.env` and fill in the Google OAuth values:

```bash
cp .env.example .env
```

Create the Google OAuth client in Google Cloud Console under **APIs & Services > Credentials**. Use **Web application** as the application type and add this authorized redirect URI:

```text
http://127.0.0.1:54321/auth/v1/callback
```

After changing `.env` or `supabase/config.toml`, restart the local stack:

```bash
supabase stop
supabase start
```

### Local URLs

Short local workflow:

```bash
supabase start
supabase status
supabase stop
```

- `supabase start` starts the local Supabase Docker stack defined by `supabase/config.toml`.
- `supabase status` prints the local API URL, Studio URL, database URL, and local keys.
- `supabase stop` shuts the local stack down.

Default local endpoints in this repo:

| Service  | URL / connection string                                   |
|----------|-----------------------------------------------------------|
| API      | `http://127.0.0.1:54321`                                  |
| Database | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio   | `http://127.0.0.1:54323`                                  |
| Inbucket | `http://127.0.0.1:54324`                                  |

The default local database password is `postgres`.

The local auth redirect allow-list in `supabase/config.toml` includes:

- `http://localhost:4200`
- `http://localhost:4200/`
- `http://127.0.0.1:4200`
- `http://127.0.0.1:4200/`

### App Environment Values

Env ownership in this repo:

| File                                           | Used by                  | Values                                                                                    |
|------------------------------------------------|--------------------------|-------------------------------------------------------------------------------------------|
| `.env`                                         | Supabase CLI local stack | `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`         |
| `apps/api/.env.local`                          | Nest API                 | `CORS_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`                                     |
| `apps/client/src/environments/environment*.ts` | Angular client           | public API URL, client URL, Supabase URL, Supabase anon/publishable key, Socket.IO config |

For the Nest API:

- `SUPABASE_URL` should point to the Supabase API endpoint.
  - Hosted Supabase: use your project URL from the dashboard.
  - Local Supabase: use `http://127.0.0.1:54321`.
- `SUPABASE_SERVICE_KEY` is the server-only service role key.
  - Hosted Supabase: copy it from **Project Settings > API keys > service_role**.
  - Local Supabase: run `supabase status` and copy `Authentication Keys > Secret`.
- `CORS_ORIGIN` is not a Supabase setting; it is the Nest API allow-list for browser and WebSocket origins.
- During local API development, put these values in `apps/api/.env.local`.
- [apps/api/.env.example](../apps/api/.env.example) documents the API variables.

For the Angular client:

- Hosted Supabase values live in `apps/client/src/environments/environment.prod.ts`.
- Local Supabase values live in `apps/client/src/environments/environment.ts`.
- The browser client must use the anon/publishable key, never the service role key.

## Generating TypeScript Types

Keep the shared types in `libs/api-interfaces/src/database/database.types.ts` in sync with your Supabase schema:

Run:

```bash
pnpm generate-supabase-types
```

This script is defined in the root `package.json`.

## Database Migrations

Supabase declarative schemas live in `supabase/schemas/`. Migration files live in `supabase/migrations/` and are what actually get applied to databases.

Keep schema files numbered and grouped by feature/table. Keep object-level grants and revokes beside the objects they protect in the same schema file, then generate or update migrations from that schema state.

The existing `supabase/migrations/20260530175708_initial_migration.sql` migration is the baseline migration. It includes explicit object-level Data API grants required by Supabase's public schema exposure rules.

Recommended workflow:

```bash
# 1. Start local Supabase if it is not already running
supabase start

# 2. Edit supabase/schemas/*.sql

# 3. Create a new migration file
supabase migration new describe_change

# 4. Add the required SQL to the generated file in supabase/migrations/

# 5. Recreate the local database and apply all migrations locally
supabase db reset

# 6. Check local schema warnings
supabase db lint --local --schema public --level warning --fail-on none
```

After creating a migration:

1. Edit the generated SQL file with the required schema/data changes.
2. Manually review the SQL before running it.
3. Verify it locally against the Supabase CLI stack before committing.

Use the CLI for migration creation instead of writing ad-hoc SQL files by hand.

### Applying Migrations Locally

To update the local Supabase instance after adding or editing migrations, run:

```bash
supabase db reset
```

This recreates the local database, reapplies every migration from `supabase/migrations/`, and runs local seeds configured in `supabase/config.toml`. It is the cleanest local check because it proves the full migration history can build the database from scratch.

If you only need the current local stack details before or after applying migrations, run:

```bash
supabase status
```

### Applying Migrations Remotely

Do not use `supabase db reset` on the hosted database. That command is for local development.

The linked hosted Supabase project is updated by the project deployment flow after migrations are merged into the `main` branch. Treat local verification as the gate: run `supabase db reset` and `supabase db lint --local --schema public --level warning --fail-on none` before opening or merging the PR.

If an urgent manual remote apply is ever needed outside the normal merge flow, preview first:

```bash
supabase db push --dry-run
```

Then apply only after reviewing the SQL and confirming the target project:

```bash
supabase db push
```

## Connecting via JDBC

Useful for inspecting the database with tools like DBeaver or IntelliJ DataGrip:

1. Open [Supabase → Database → Settings → Connection string](https://supabase.com/dashboard/project/bhzetyxjimpabioxoodz/database/settings?showConnect=true)
2. Select **Transaction pooler**
3. Select **JDBC**
4. Copy the connection string into your database client
