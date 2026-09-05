# Workspace source index

Repository-relative routes, verified 2026-09-05. This is a maintained shortlist, not a full file catalog. Confirm moved paths against the current checkout; package.json, tsconfig.base.json and each project's project.json remain authoritative.

| Need | Start here |
| --- | --- |
| Angular host/lobby UI | apps/portal/src/app/ |
| NestJS application composition | apps/api/src/ |
| Desktop host | apps/probable-waffle-desktop/ |
| RTS pure logic / runtime / shared wire / backend | libs/games/probable-waffle/gameplay/src/lib/ ; libs/games/probable-waffle/phaser/src/lib/ ; libs/games/probable-waffle/protocol/src/lib/ ; libs/games/probable-waffle/server/src/lib/ |
| RTS shared models and campaigns | libs/games/probable-waffle/interface/src/lib/ ; libs/games/probable-waffle/campaign/src/ |
| Shared identity, sessions, hosting, schema | libs/platform/identity/ ; libs/platform/game-sessions/ ; libs/platform/game-host/ ; libs/platform/database-schema/ |
| Assets and authoring metadata | apps/portal/src/assets/ ; apps/portal/src/metadata/ |
| Browser tests / backend e2e | apps/portal-e2e/ ; apps/api-e2e/ |
| Jest presets / editor checks / asset checks | tools/testing/ ; tools/phaser-editor/validate-project.mjs ; tools/assets/check-git-lfs.mjs |

For RTS internals, read [the focused source map](../../fuzzy-waddle-phaser/references/rts-source-index.md). For checks, read [verification routes](verification.md). Do not load both for an unrelated docs edit.

## Fast discovery

- Exact path/symbol known: read it, then rg within its owning directory for callers/tests. Follow imports/path aliases rather than assuming the Angular app owns gameplay.
- Ownership genuinely unknown: use the repository's jbcontext search workflow with one focused semantic question. If unavailable, report the limitation and use bounded rg/rg --files in the most likely library.
- Inspect the first useful result before broadening. Stop discovery when authority, consumers and focused test route are established.
- Existing .scene files are authoring inputs; inspect generated ownership before GUI edits.
- Update only the moved/touched index row when code moves. Do not maintain a second exhaustive symbol registry or store line numbers that immediately drift.
