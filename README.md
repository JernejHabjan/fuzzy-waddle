

# FuzzyWaddle
## Setup
### Api
- Copy the `.env.example` file to `.env.local` and fill in the values.

## Deployment
- Client: https://fuzzy-waddle.onrender.com/
  - build command: `npm run nx-build-client`
  - publish directory: `./dist/apps/client`
- Server: https://fuzzy-waddle-api.onrender.com/
  - build command in render.com: `npm i; nx build api`
  - Start command in render.com: `node dist/apps/api/main.js`
  - Add supabase environmental variables: `SUPABASE_URL` and `SUPABASE_KEY` and `SUPABASE_JWT_SECRET`
- DB: https://supabase.com/
