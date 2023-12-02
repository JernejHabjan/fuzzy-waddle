# Fuzzy Waddle

[Available on Render](https://fuzzy-waddle.onrender.com/)
and [GitHub Pages](https://jernejhabjan.github.io/fuzzy-waddle/)

## Setup dev environment

### Api

- Copy the `.env.example` file to `.env.local` and fill in the values.
  - for CORS_ORIGIN, set it to `http://localhost:4200`

### Supabase:

#### Authentication

- Setup Google OAuth2: https://supabase.io/docs/guides/auth#google
- URL config:
  - Site URL: `https://fuzzy-waddle.onrender.com`
  - Redirect URLs
    - Add `http://localhost:4200/`
    - Add `https://fuzzy-waddle.onrender.com/`
    - Add `https://jernejhabjan.github.io/fuzzy-waddle/`

## Deployment

- Client: https://fuzzy-waddle.onrender.com/
  - build command: `pnpm i; npm run nx-build-client`
  - publish directory: `./dist/apps/client`
  - Rewrite rule:
    - add rewrite rule as we don't use hash routing:
    - destination: "/index.html"
    - action: "rewrite"
    - docs for render.com: https://render.com/docs/deploy-create-react-app#using-client-side-routing
    - docs for
      azure: https://learn.microsoft.com/en-us/azure/static-web-apps/configuration?WT.mc_id=javascript-17844-cxa#fallback-routes
- Server: https://fuzzy-waddle-api.onrender.com/
  - build command in render.com: `pnpm i; nx build api`
  - Start command in render.com: `node dist/apps/api/main.js`
  - add health check: `/api/health`
  - Add supabase environmental variables: `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
  - Add `CORS_ORIGIN` environmental
    variable: `https://fuzzy-waddle.onrender.com,https://jernejhabjan.github.io`

## Other sources

- https://www.pixilart.com/darkneess10

## Phaser Editor 2D

- `.skip` files are used to skip files from being processed by Phaser Editor 2D
- investigate issues: `Ctrl+Shift+I`
- if crashing: - if there's an issue with the Phaser shaders, try to switch the IDE to Canvas
  press `Ctrl+K`, and execute this command: `set default render type to CANVAS`, then reload the editor `Ctrl+R`

## Attribution

This project utilizes the following works:

- [Pixilart](https://www.pixilart.com/) by Pixilart Inc
- [Aseprite](https://www.aseprite.org/) by David Capello
- [Phaser](https://github.com/photonstorm/phaser) by Richard Davey (License: [MIT License](https://github.com/photonstorm/phaser/blob/master/LICENSE.md))
- [Phaser Editor 2D](https://github.com/PhaserEditor2D/PhaserEditor2D-v3) by PhaserEditor2D Team (License: [MIT License](https://github.com/PhaserEditor2D/PhaserEditor2D-v3/blob/master/LICENSE))
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
