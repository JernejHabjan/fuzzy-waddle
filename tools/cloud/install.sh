#!/usr/bin/env bash
set -euo pipefail
cd /workspace/fuzzy-waddle
export COREPACK_HOME=/workspace/.cache/corepack
export XDG_CACHE_HOME=/workspace/.cache
export npm_config_cache=/workspace/.cache/npm
export NX_DAEMON=false
export NX_NO_CLOUD=true
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if(major!==24 || minor<13) throw new Error("Node >=24.13.0 <25 is required")'
git lfs install --local
git lfs pull
git lfs checkout
corepack pnpm install --frozen-lockfile --store-dir /workspace/.cache/pnpm-store
corepack pnpm assets:check
