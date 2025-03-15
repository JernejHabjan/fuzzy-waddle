# Fuzzy Waddle

[![Deploy on Render](https://img.shields.io/badge/Render-Deployed-brightgreen)](https://fuzzy-waddle.onrender.com/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen)](https://jernejhabjan.github.io/fuzzy-waddle/)
[![Open Issues](https://img.shields.io/github/issues/JernejHabjan/fuzzy-waddle)](https://github.com/JernejHabjan/fuzzy-waddle/issues)
[![Open Pull Requests](https://img.shields.io/github/issues-pr/JernejHabjan/fuzzy-waddle)](https://github.com/JernejHabjan/fuzzy-waddle/pulls)
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-blue)](CONTRIBUTING.md)

## Setup Dev Environment

### pnpm
- [Install pnpm](https://pnpm.io/installation)

### API

- Copy the `.env.example` file to `.env.local` and fill in the values.
  - For `CORS_ORIGIN`, set it to `http://localhost:4200`
  - For Supabase, `service_role` as `SUPABASE_SERVICE_KEY` and `URL` are [shown here](https://supabase.com/dashboard/project/bhzetyxjimpabioxoodz/settings/api)

### Supabase Authentication

- Setup Google OAuth2: [Supabase Google OAuth2 Setup](https://supabase.io/docs/guides/auth#google)
- URL config:
  - Site URL: `https://fuzzy-waddle.onrender.com`
  - Redirect URLs:
    - `http://localhost:4200/`
    - `https://fuzzy-waddle.onrender.com/`
    - `https://jernejhabjan.github.io/fuzzy-waddle/`

## Deployment

### Client
- URL: [https://fuzzy-waddle.onrender.com/](https://fuzzy-waddle.onrender.com/)
- Build Command: `pnpm i; npm run nx-build-client`
- Publish Directory: `./dist/apps/client`
- Rewrite Rule:
  - Destination: `/index.html`
  - Action: `rewrite`
  - Documentation:
    - [Render](https://render.com/docs/deploy-create-react-app#using-client-side-routing)
    - [Azure](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration?WT.mc_id=javascript-17844-cxa#fallback-routes)

### Server
- URL: [https://fuzzy-waddle-api.onrender.com/](https://fuzzy-waddle-api.onrender.com/)
- Build Command: `pnpm i; nx build api`
- Start Command: `node dist/apps/api/main.js`
- Add Health Check: `/api/health`
- Add Supabase Environmental Variables: `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Add `CORS_ORIGIN` Environmental Variable: `https://fuzzy-waddle.onrender.com,https://jernejhabjan.github.io`

## Other Sources

- [Pixilart](https://www.pixilart.com/darkneess10)

## Phaser Editor

- `.skip` files are used to skip files from being processed by Phaser Editor 2D
- Investigate Issues: `Ctrl+Shift+I`

## Attribution

This project utilizes the following works:

- [Pixilart](https://www.pixilart.com/) by Pixilart Inc
- [Aseprite](https://www.aseprite.org/) by David Capello
- [Phaser](https://github.com/photonstorm/phaser) by  Phaser Studio Inc. (License: [MIT License](https://github.com/photonstorm/phaser/blob/master/LICENSE.md))
- [Phaser Editor](https://phaser.io/editor) by Phaser Studio Inc. (License: [All Rights Reserved](https://phaser.io/editor))
- [Universal LPC Spritesheet Character Generator](https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator) by Sander Frenken (License: [GPL-3.0 license](https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator/blob/master/LICENSE)) with [Standalone Editor](https://pflat.itch.io/lpc-character-generator) by [pflat](https://pflat.itch.io/) (License: [GNU GPL v3.0](http://www.gnu.org/licenses/gpl-3.0.html) and/or [Creative Commons Attribution-ShareAlike 3.0](http://creativecommons.org/licenses/by-sa/3.0/))
- [Tiled](https://github.com/mapeditor/tiled) by Thorbjørn Lindeijer (License: [3 licenses](https://github.com/mapeditor/tiled))
- [TexturePacker](https://www.codeandweb.com/texturepacker) by CodeAndWeb GmbH
- [TileSetter](https://www.tilesetter.org/) by Led
- [Laigter](https://azagaya.itch.io/laigter) by Azagaya
- [Angular](https://angular.io/) by Google LLC (License: [MIT License](https://github.com/angular/angular/blob/master/LICENSE))
- [NestJS](https://nestjs.com/) by Kamil Myśliwiec and the NestJS contributors (License: [MIT License](https://github.com/nestjs/nest/blob/master/LICENSE))
- [Supabase](https://supabase.io/) by Supabase Pte. Ltd. (License: [Apache License 2.0](https://github.com/supabase/supabase/blob/master/LICENSE))

Parts of this project utilize the features, code, or assets provided by these sources.

Please refer to the respective sources and licenses for more details.
