# Fuzzy Waddle

> A multiplayer browser game platform built with Angular, Phaser, and NestJS.

[![Deploy on Render](https://img.shields.io/badge/Render-Deployed-brightgreen)](https://fuzzy-waddle.onrender.com/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen)](https://jernejhabjan.github.io/fuzzy-waddle/)
[![Open Issues](https://img.shields.io/github/issues/JernejHabjan/fuzzy-waddle)](https://github.com/JernejHabjan/fuzzy-waddle/issues)
[![Open Pull Requests](https://img.shields.io/github/issues-pr/JernejHabjan/fuzzy-waddle)](https://github.com/JernejHabjan/fuzzy-waddle/pulls)
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-blue)](CONTRIBUTING.md)

**Play now:** [fuzzy-waddle.onrender.com](https://fuzzy-waddle.onrender.com/)

---

## Games

| Game | Genre | Status |
| ---- | ----- | ------ |
| Probable Waffle | Real-time strategy | Active |
| Little Muncher | Platformer | Active |
| Fly Squasher | Arcade | Active |
| Dungeon Crawler | RPG | In development |

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | Angular 21, Phaser 4, Bootstrap 5 |
| Backend | NestJS 11, Socket.IO |
| Database / Auth | Supabase (PostgreSQL + OAuth) |
| Monorepo | Nx 22 |
| Package manager | pnpm |

---

## Quick Start

```bash
git clone https://github.com/JernejHabjan/fuzzy-waddle.git
cd fuzzy-waddle
pnpm install
cp .env.example .env.local   # fill in Supabase credentials
pnpm start
```

Client runs at `http://localhost:4200` · API at `http://localhost:3333`

For full setup instructions see the [Getting Started guide](wiki/getting-started.md).

---

## Wiki

| Page | Description |
| ---- | ----------- |
| [Getting Started](wiki/getting-started.md) | Prerequisites, install, common commands |
| [Architecture](wiki/architecture.md) | Monorepo layout, game structure, real-time communication |
| [Supabase Setup](wiki/supabase.md) | Auth, type generation, JDBC, local dev |
| [Deployment](wiki/deployment.md) | Render and GitHub Pages deployment config |
| [Troubleshooting](wiki/troubleshooting.md) | Common issues and fixes |

---

## Contributing

Contributions are welcome — bug fixes, features, and compatibility improvements.
Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a PR.

---

## Attribution

Some artwork is publicly available on [Pixilart](https://www.pixilart.com/darkneess10).
Full attribution list: [attributions.json](apps/client/src/assets/general/attributions.json) · [Attributions page](https://fuzzy-waddle.onrender.com/attributions)

---

## License

© Jernej Habjan. All rights reserved.

Forking and contributing via pull requests is **allowed**.
Using or distributing this code outside of GitHub requires **explicit written permission**.
See [LICENSE.md](LICENSE).
