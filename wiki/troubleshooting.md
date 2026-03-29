# Troubleshooting

## TileSetter — Chipped Tiles on Certain GPUs

Some GPU drivers cause tiles to appear "chipped" or have pixel gaps at tile edges.

**Workaround:** Launch TileSetter with GPU acceleration disabled:

```
"C:\Program Files (x86)\Steam\steamapps\common\Tilesetter\Tilesetter.exe" --disable-gpu --disable-gpu-sandbox
```

## Phaser Editor 2D

| Issue | Solution |
| ----- | -------- |
| Files being processed unexpectedly | Add a `.skip` file to the directory to exclude it from Phaser Editor 2D processing |
| Unexpected editor behaviour | Open DevTools with `Ctrl+Shift+I` to investigate console errors |

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

## Angular Client Won't Start

Ensure the API is running and the proxy is configured. The dev proxy config is at `apps/client/proxy.conf.json` and forwards `/api/*` to `http://localhost:3333`.

## Environment Variables Missing

Copy `.env.example` to `.env.local` and fill in all values. The API will fail to start without `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`. See [Getting Started](getting-started.md) for details.
