# Fuzzy Waddle development startup
Run `bash tools/cloud/install.sh` from the checkout to reproduce the cloud installation. The script targets `/workspace/fuzzy-waddle` and stores package caches under `/workspace/.cache`.

Configure runtime variables and the server-only Supabase key securely in cloud environment settings. Never commit credential values. The validation results and API blockers below describe the original onboarding run, rather than the current status of every restored environment.

Use the existing isolated checkout at /workspace/fuzzy-waddle. Do not create a Git worktree unless the user explicitly requests one. Preserve tracked files, lockfiles, and existing user changes.

## Tool activation
In each shell:
cd /workspace/fuzzy-waddle
export COREPACK_HOME=/workspace/.cache/corepack
export XDG_CACHE_HOME=/workspace/.cache
export npm_config_cache=/workspace/.cache/npm
export NX_DAEMON=false
export NX_NO_CLOUD=true
Use corepack pnpm (pinned 11.14.0), rather than the global pnpm. Node must be >=24.13.0 <25; the onboarding instance used 24.19.0. Git LFS and dependencies are retained; live servers must be restarted.
Run corepack pnpm assets:check before serving. If needed, reproduce installation using the saved install_script.

## Portal
Start corepack pnpm start:portal --host=127.0.0.1 in a managed background terminal.
Wait for the build and request http://127.0.0.1:4200/ with curl; expect Fuzzy Waddle HTML. Request /main.js and /assets/sfx/character.mp3; expect JavaScript and actual MPEG audio, respectively. Inspect startup logs on failure. Do not create localhost preview links.
These portal startup and HTTP checks passed during onboarding. Browser gameplay and authenticated flows were not tested.

## API (blocked during onboarding)
Before starting, check only presence of SUPABASE_URL and SUPABASE_SERVICE_KEY, never their values. Runtime configuration should supply SUPABASE_URL=https://bhzetyxjimpabioxoodz.supabase.co, CORS_ORIGIN=http://localhost:4200,http://localhost:4201, and the server-only SUPABASE_SERVICE_KEY securely through environment settings. Do not copy example placeholder credentials or invent keys. Do not assume apps/api/.env.local is loaded automatically; exported runtime values are supported by the application.
Start corepack pnpm start:api in a managed background terminal with NODE_ENV=development and PORT=3333.
Check curl --fail http://127.0.0.1:3333/api/health returns OK. Then verify a suitable existing authenticated read-only database operation using legitimate authentication. A health response alone does not establish database readiness.
The API build and unit tests passed. API runtime did not start because the service key was absent; supabaseKey is required was confirmed with the real configured URL. HTTPS access to bhzetyxjimpabioxoodz.supabase.co returned proxy CONNECT 403. A secret requirement and its allowed hostname were saved in the draft; this does not mean runtime settings have applied. After the user saves settings, retry access and API startup.
The portal's configured client API and Socket.IO use port 3333; its tracked /api proxy points at port 3000. If a proxied route is needed, supply an external proxy config via the supported --proxy-config flag rather than editing tracked configuration.

## Validation
From /workspace/fuzzy-waddle, using the activation above:
corepack pnpm nx run-many -t build -p portal,api --configuration=development --parallel=2
corepack pnpm nx run-many -t test -p portal,api --runInBand --parallel=1
corepack pnpm phaser-editor:check
Onboarding results: both builds passed; 9 test suites and 20 tests passed; all four Phaser editor projects validated; 511 audio assets hydrated; repeat frozen installation passed; tracked git status clean.
Desktop/Tauri, local Supabase/Docker, OAuth, production builds, and full game/e2e suites are optional and were not validated. Do not run pnpm start indiscriminately: the monorepo has additional unrelated serve targets.
