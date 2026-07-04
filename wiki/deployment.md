# Deployment

Both the client and API are deployed on [Render](https://render.com).

## Client

| Setting           | Value                                                                   |
|-------------------|-------------------------------------------------------------------------|
| URL               | [https://fuzzy-waddle.onrender.com](https://fuzzy-waddle.onrender.com/) |
| Build Command     | `pnpm install --frozen-lockfile; pnpm nx-build-client`                  |
| Publish Directory | `./dist/apps/client`                                                    |

**Rewrite rule** — required for Angular client-side routing:

| Field       | Value         |
|-------------|---------------|
| Destination | `/index.html` |
| Action      | `rewrite`     |

Reference: [Render SPA routing](https://render.com/docs/deploy-create-react-app#using-client-side-routing)

## API

| Setting                     | Value                                                                                                                             |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| URL                         | [https://fuzzy-waddle-api.onrender.com](https://fuzzy-waddle-api.onrender.com/)                                                   |
| Build Command               | `pnpm install --frozen-lockfile; pnpm nx build api`                                                                               |
| Start Command               | `node dist/apps/api/main.js`                                                                                                      |
| Health Check                | `/api/health`                                                                                                                     |
| Env: `SUPABASE_URL`         | Supabase project URL                                                                                                              |
| Env: `SUPABASE_SERVICE_KEY` | Supabase service-role key                                                                                                         |
| Env: `CORS_ORIGIN`          | `https://fuzzy-waddle.onrender.com,https://jernejhabjan.github.io,http://localhost:4200,http://tauri.localhost,tauri://localhost` |

## GitHub Pages (client mirror)

A second client deployment runs on GitHub Pages at [https://jernejhabjan.github.io/fuzzy-waddle/](https://jernejhabjan.github.io/fuzzy-waddle/).
This is handled automatically after merges to `main`.

Automated release behavior after merging to `main` is documented in [releases.md](releases.md).

## Supabase Hosted Settings

The hosted Supabase project must allow the deployed client URLs in **Authentication > URL Configuration** and must have Google enabled under **Authentication > Providers**. Keep the URL list in sync with [supabase.md](supabase.md) when Render, GitHub Pages, or Tauri callback URLs change.

Database migrations are verified locally with the Supabase CLI and applied to the hosted project after they are merged into `main`. See [supabase.md](supabase.md#database-migrations) for the local and remote migration workflow.
