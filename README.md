# Fuzzy Waddle
## Setup dev environment
### Api
- Copy the `.env.example` file to `.env.local` and fill in the values.

## Deployment
- Client: https://fuzzy-waddle.onrender.com/
  - build command: `pnpm i; npm run nx-build-client`
  - publish directory: `./dist/apps/client`
  - Rewrite rule:
    - add rewrite rule as we don't use hash routing:
    - destination: "/index.html"
    - action: "rewrite"
    - docs for render.com: https://render.com/docs/deploy-create-react-app#using-client-side-routing
    - docs for azure: https://learn.microsoft.com/en-us/azure/static-web-apps/configuration?WT.mc_id=javascript-17844-cxa#fallback-routes
- Server: https://fuzzy-waddle-api.onrender.com/
  - build command in render.com: `pnpm i;  nx build api`
  - Start command in render.com: `node dist/apps/api/main.js`
  - Add supabase environmental variables: `SUPABASE_URL` and `SUPABASE_KEY` and `SUPABASE_JWT_SECRET`
- DB: https://supabase.com/
