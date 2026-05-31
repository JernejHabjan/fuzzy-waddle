# Deployment

Both the client and API are deployed on [Render](https://render.com).

## Client

| Setting           | Value                                                                   |
|-------------------|-------------------------------------------------------------------------|
| URL               | [https://fuzzy-waddle.onrender.com](https://fuzzy-waddle.onrender.com/) |
| Build Command     | `pnpm i; npm run nx-build-client`                                       |
| Publish Directory | `./dist/apps/client`                                                    |

**Rewrite rule** — required for Angular client-side routing:

| Field       | Value         |
|-------------|---------------|
| Destination | `/index.html` |
| Action      | `rewrite`     |

References: [Render SPA routing](https://render.com/docs/deploy-create-react-app#using-client-side-routing) · [Azure Static Web Apps fallback routes](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration?WT.mc_id=javascript-17844-cxa#fallback-routes)

## API

| Setting                     | Value                                                                                                                             |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| URL                         | [https://fuzzy-waddle-api.onrender.com](https://fuzzy-waddle-api.onrender.com/)                                                   |
| Build Command               | `pnpm i; nx build api`                                                                                                            |
| Start Command               | `node dist/apps/api/main.js`                                                                                                      |
| Health Check                | `/api/health`                                                                                                                     |
| Env: `SUPABASE_URL`         | Supabase project URL                                                                                                              |
| Env: `SUPABASE_SERVICE_KEY` | Supabase service-role key                                                                                                         |
| Env: `CORS_ORIGIN`          | `https://fuzzy-waddle.onrender.com,https://jernejhabjan.github.io,http://localhost:4200,http://tauri.localhost,tauri://localhost` |

## GitHub Pages (client mirror)

A second client deployment runs on GitHub Pages at [https://jernejhabjan.github.io/fuzzy-waddle/](https://jernejhabjan.github.io/fuzzy-waddle/).
This is handled automatically by the CI workflow in `.github/workflows/`.
