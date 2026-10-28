# Arena Nepal

A free community site for Nepali mobile gamers: **PUBG Mobile, Free Fire, eFootball and EA FC Mobile**.
Players post 1v1 or squad challenges, join custom rooms on real maps, enter sponsor-funded tournaments,
climb XP leaderboards by province, and buy in-game currency from a top-up store.

> **No betting, ever.** There is no wallet, no entry fee and no cash winnings. XP is rank points only and can't be
> bought, sold or cashed out. Tournament prizes are sponsor-funded. Money only enters through the top-up store,
> and it never touches challenges or matches.

## Stack

| Part | Tech |
|---|---|
| Frontend (`client/`) | React + Vite, React Router, Tailwind CSS v4, motion |
| Backend (`server/`) | Node.js 20+, Express 5, Mongoose 8, JWT auth, zod validation, multer uploads |
| Database | MongoDB Atlas (free M0 cluster), or a built-in local database for development |

## No database yet? It runs locally

You can skip Atlas for now. If `MONGODB_URI` in `server/.env` is missing or still says `PASTE_YOUR_ATLAS_URI_HERE`,
the server starts its own MongoDB in the background:

```bash
npm run install:all
npm run dev
```

- You'll see `Using local dev database (server/.data). Set MONGODB_URI in server/.env to use Atlas.`
- Data lives in `server/.data/db` (port 27018) and **survives restarts**. It's gitignored.
- The first start on an empty database loads the demo data automatically. `npm run seed` and `npm run seed:clear-demo` use the same local database, even while the server is running.
- The first run downloads the MongoDB binary once (~70 MB), so give it a minute.
- To start fresh, stop the server and delete `server/.data`.
- When you're ready for Atlas, follow the steps below and paste the URI into `server/.env`. Nothing else changes. Local data is not copied to Atlas, so run `npm run seed` there.

## 1. Create a free MongoDB Atlas database

1. Sign up at <https://www.mongodb.com/cloud/atlas/register> and create a **free M0 cluster** (pick the Mumbai/Singapore region for the lowest latency from Nepal).
2. **Database Access** → *Add New Database User* → username + password (save them).
3. **Network Access** → *Add IP Address* → add your current IP (or `0.0.0.0/0` while developing).
4. **Connect** → *Drivers* → copy the connection string. It looks like
   `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority`.
5. Add the database name `arena` after `.net/`:
   `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/arena?retryWrites=true&w=majority`

## 2. Configure the server

```bash
cp server/.env.example server/.env     # Windows: copy server\.env.example server\.env
```

Edit `server/.env`:

```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/arena
JWT_SECRET=<any long random string>
CLIENT_ORIGIN=http://localhost:5173
```

Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
Never commit `.env` (it's already in `.gitignore`). If your password has special characters, URL-encode them.

## 3. Install, seed, run

```bash
npm run install:all   # installs root, server and client dependencies
npm run seed          # WIPES the database and loads demo data (60 demo players, ~200 ranked results)
npm run seed:clear-demo   # removes only the demo players and everything tied to them
npm run dev           # API on http://localhost:5000, site on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the API, so just open <http://localhost:5173>.

### Seeded logins

| Role | Login | Password |
|---|---|---|
| Admin | `admin@arena.np` | `Admin@123` |
| Organiser | `org@arena.np` | `Org@1234` |
| Players | `ktm_sniper`, `pokhara_rush`, `birgunj_boss`, `dharan_dragon`, … (12 total) | `Player@123` |

Log in with either email or username. Demo players are flagged `isDemo` (visible in the admin user list). Clear them with `npm run seed:clear-demo` before real launch.

## How it works

- **Challenges:** create → another player accepts → creator posts room ID/password (visible only to the two teams and admins) → start → both sides report the winner with a screenshot. Matching reports settle it (winners +30 XP, losers +10). Mismatched reports open a dispute for an admin.
- **Ranked:** challenges in ranked modes (PUBG TDM/Arena, FF Clash Squad/Lone Wolf, eFootball Friendly, FC H2H) move a per-game Elo rating (start 1000, K 32, team = average rating). Each side reports its own players' kills/goals with a screenshot. Tiers: Bronze, Silver 1100, Gold 1250, Platinum 1400, Diamond 1550, Legend 1700. See `/api/ranked/ladder`, `/api/users/:username/records` and `/rating-history`. Rating is a ranking number only.
- **Matches:** admins/organisers host custom rooms on real maps. The room ID/password is revealed to registered players 15 minutes before start.
- **Tournaments:** free entry, sponsor-funded prizes.
- **Top-up store:** pick a pack, enter your game UID and eSewa/Khalti/bank reference; an admin verifies payment and marks it fulfilled. (No live payment gateway yet.)
- **Leaderboard:** overall or per game, filter by province and by week / season (calendar quarter) / all time.

## Folder map

```
.
├─ package.json            root scripts: install:all, dev, seed (concurrently)
├─ client/                 React app (Vite, port 5173)
└─ server/                 Express API (port 5000)
   ├─ .env.example
   ├─ uploads/             screenshots/evidence (served at /uploads, gitignored)
   └─ src/
      ├─ index.js          connect DB + listen
      ├─ app.js            middleware, routes, error handler
      ├─ config/           env, db, games (static game/map config, provinces, XP rules)
      ├─ models/           User, Challenge, Match, Tournament, Dispute, Notification, TopupProduct, TopupOrder, XpLog
      ├─ middleware/       auth (JWT, roles), upload (multer), validate (zod), error
      ├─ controllers/      one per resource
      ├─ routes/           one per resource + schemas.js (zod) + index.js (/api)
      ├─ services/         xp, rating (Elo), notify, challenges (settlement)
      ├─ utils/
      └─ seed/             seed.js, demo.js (demo players + ranked history), clearDemo.js
```

## API

All endpoints live under `/api` (auth via `Authorization: Bearer <token>`). Errors are `{ "error": "message" }`.
Main groups: `/auth`, `/users`, `/games`, `/challenges`, `/ranked`, `/matches`, `/tournaments`, `/leaderboard`,
`/disputes`, `/notifications`, `/store`, `/admin`. `GET /api/health` returns `{ ok: true }`.
