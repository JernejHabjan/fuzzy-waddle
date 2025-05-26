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

## Other Notes

- Some artwork is also publicly available here: [Pixilart](https://www.pixilart.com/darkneess10)
- Phaser Editor
  - `.skip` files are used to skip files from being processed by Phaser Editor 2D
  - Investigate Issues: `Ctrl+Shift+I`
- TileSetter:
  - there seem to be some issues with "chipped" tiles on certain GPUs. Workaround is to run the TileSetter.exe with 2 flags:
  `"C:\Program Files (x86)\Steam\steamapps\common\Tilesetter\Tilesetter.exe" --disable-gpu --disable-gpu-sandbox`
## Attribution
Please see [attributions.json](apps/client/src/assets/general/attributions.json). They are also listed on the [Attributions Page](https://fuzzy-waddle.onrender.com/attributions).
