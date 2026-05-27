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

SQL migrations live in `DBMs/`. Apply them in order against your Supabase project using the Supabase dashboard SQL editor or the CLI.

`DBMs/0010_supabase_create_grants.sql` adds explicit Data API grants required by Supabase's public schema exposure changes. Keep grants alongside table creation in future migrations.

## Connecting via JDBC

Useful for inspecting the database with tools like DBeaver or IntelliJ DataGrip:

1. Open [Supabase → Database → Settings → Connection string](https://supabase.com/dashboard/project/bhzetyxjimpabioxoodz/database/settings?showConnect=true)
2. Select **Transaction pooler**
3. Select **JDBC**
4. Copy the connection string into your database client

## Local Supabase Development

A local Supabase config is available under `supabase/`. See the [Supabase local development docs](https://supabase.com/docs/guides/local-development) for how to run Supabase locally with Docker.
