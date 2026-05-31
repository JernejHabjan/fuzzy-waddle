# Troubleshooting

## TileSetter — Chipped Tiles on Certain GPUs

Some GPU drivers cause tiles to appear "chipped" or have pixel gaps at tile edges.

**Workaround:** Launch TileSetter with GPU acceleration disabled:

```
"C:\Program Files (x86)\Steam\steamapps\common\Tilesetter\Tilesetter.exe" --disable-gpu --disable-gpu-sandbox
```

## Phaser Editor 2D

| Issue                              | Solution                                                                           |
|------------------------------------|------------------------------------------------------------------------------------|
| Files being processed unexpectedly | Add a `.skip` file to the directory to exclude it from Phaser Editor 2D processing |
| Unexpected editor behaviour        | Open DevTools with `Ctrl+Shift+I` to investigate console errors                    |

## pnpm — Wrong Package Manager

This repo enforces pnpm via an `engines` field and a preinstall hook. Running `npm install` or `yarn` will fail.

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm

# Then install dependencies
pnpm install
```

## Supabase Types Out of Sync

If you get TypeScript errors related to database types, regenerate them:

```bash
pnpm generate-supabase-types
```

## Google OAuth Provider Not Enabled Locally

If local sign-in returns `Unsupported provider: provider is not enabled`, make sure the root `.env` exists and contains:

```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
```

Then restart the local stack so `supabase/config.toml` is reloaded:

```bash
supabase stop
supabase start
```

The Google OAuth client must allow this redirect URI:

```text
http://127.0.0.1:54321/auth/v1/callback
```

## Angular Client Won't Start

Ensure the API is running and the proxy is configured. The dev proxy config is at `apps/client/proxy.conf.json` and forwards `/api/*` to `http://localhost:3333`.

## Environment Variables Missing

For local Supabase OAuth, copy the root `.env.example` to `.env`; it contains only the Google OAuth values consumed by `supabase/config.toml`:

- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`

For local API development, copy [apps/api/.env.example](../apps/api/.env.example) to `apps/api/.env.local` and fill in:

- `CORS_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

The API will fail to start or fail Supabase requests without `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`; `CORS_ORIGIN` is required for browser and WebSocket access.
