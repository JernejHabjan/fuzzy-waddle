# Fuzzy Waddle

## Setup dev environment

### Api

- Copy the `.env.example` file to `.env.local` and fill in the values.
  - for CORS_ORIGIN, set it to `http://localhost:4201`

### Supabase:

- Setup Google OAuth2: https://supabase.io/docs/guides/auth#google
- URL config:
  - Site URL: `https://fuzzy-waddle.onrender.com`
  - Add `http://localhost:4200/`
  - Add `https://fuzzy-waddle.onrender.com/`

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
  - Add `CORS_ORIGIN` environmental variable: `https://fuzzy-waddle.onrender.com`
