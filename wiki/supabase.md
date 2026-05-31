# Supabase Setup

Fuzzy Waddle uses [Supabase](https://supabase.com) for authentication, the PostgreSQL database, and real-time features.

## Authentication

### Google OAuth2

Follow the [Supabase Google OAuth2 guide](https://supabase.io/docs/guides/auth#google) to configure the provider.

### URL Configuration

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

## Generating TypeScript Types

Keep the shared types in `libs/api-interfaces/src/database/database.types.ts` in sync with your Supabase schema:

1. Set up the Supabase CLI by following the [official guide](https://supabase.com/docs/guides/api/rest/generating-types)
2. Run:

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

## Local Supabase Development

A local Supabase config is available under `supabase/`. See the [Supabase local development docs](https://supabase.com/docs/guides/local-development) for how to run Supabase locally with Docker.

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

- API: `http://127.0.0.1:54321`
- Database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Password by default is `postgres`
- Studio: `http://127.0.0.1:54323`
- Inbucket: `http://127.0.0.1:54324`

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

For this repo's app environment variables:

- `SUPABASE_URL` should point to your Supabase API endpoint.
  - Hosted Supabase: use your project URL from the dashboard.
  - Local `supabase start`: use `http://127.0.0.1:54322`.
- `SUPABASE_SERVICE_KEY` is the Supabase `service_role` key.
  - Hosted Supabase: copy it from the project API settings.
- `CORS_ORIGIN` is not a Supabase setting; it is this Nest API's allow-list for browser and WebSocket origins.
