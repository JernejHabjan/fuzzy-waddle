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
| ------------- | ----------------------------------------------------------------------------------------- |
| Site URL      | `https://fuzzy-waddle.onrender.com`                                                       |
| Redirect URLs | `http://localhost:4200/`                                                                  |
|               | `https://fuzzy-waddle.onrender.com/`                                                      |
|               | `https://jernejhabjan.github.io/fuzzy-waddle/`                                            |
|               | `http://localhost:4200/assets/auth-callback.html` ← Tauri dev OAuth callback              |
|               | `https://fuzzy-waddle.onrender.com/assets/auth-callback.html` ← Tauri prod OAuth callback |
|               | `com.fuzzywaddle.probablewaffle://auth/callback` ← Tauri deep-link (kept as fallback)     |

## Local Supabase Development

A local Supabase config is available under `supabase/`. It is loaded by `supabase start` and uses Docker.

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

| Service  | URL / connection string                                      |
| -------- | ------------------------------------------------------------ |
| API      | `http://127.0.0.1:54321`                                     |
| Database | `postgresql://postgres:postgres@127.0.0.1:54322/postgres`     |
| Studio   | `http://127.0.0.1:54323`                                     |
| Inbucket | `http://127.0.0.1:54324`                                     |

The default local database password is `postgres`.

The local auth redirect allow-list in `supabase/config.toml` includes:

- `http://localhost:4200`
- `http://localhost:4200/`
- `http://127.0.0.1:4200`
- `http://127.0.0.1:4200/`

### App Environment Values

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

Supabase migrations live in `supabase/migrations/` and should be created with the Supabase CLI so timestamps and metadata stay consistent.

Recommended workflow:

```bash
# Create a new migration file
supabase migration new describe_change

# Review the generated SQL file in supabase/migrations/
# Then apply all local migrations to the local database
supabase db reset
```

After creating a migration:

1. Edit the generated SQL file with the required schema/data changes.
2. Manually review the SQL before running it.
3. Verify it locally against the Supabase CLI stack before committing.

Use the CLI for migration creation instead of writing ad-hoc SQL files by hand.

The existing `supabase/migrations/20260530175708_initial_migration.sql` migration includes the explicit object-level Data API grants required by Supabase's public schema exposure rules. Keep per-object grants alongside table creation in future migrations.

## Connecting via JDBC

Useful for inspecting the database with tools like DBeaver or IntelliJ DataGrip:

1. Open [Supabase → Database → Settings → Connection string](https://supabase.com/dashboard/project/bhzetyxjimpabioxoodz/database/settings?showConnect=true)
2. Select **Transaction pooler**
3. Select **JDBC**
4. Copy the connection string into your database client

### Applying migrations locally

To update the local Supabase instance after adding or editing migrations, run:

```bash
supabase db reset
```

This recreates the local database, reapplies migrations from `supabase/migrations/`, and runs local seeds configured in `supabase/config.toml`.

If you need to check the current local stack details before or after applying migrations, run:

```bash
supabase status
```

### Merge flow note

The local instance only changes when you run the relevant Supabase CLI commands yourself. The other Supabase environment is updated separately and applies migrations after they are merged to the `main` branch, so verify migrations locally before opening or merging a PR.
