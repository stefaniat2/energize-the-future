# Deployment Guide (free)

Frontend on **Vercel**, API on **Render**. Both auto-deploy every time you push to GitHub's
`main` branch.

```
GitHub (main) ──► Vercel  → https://energize-the-future.vercel.app        (client/)
              └─► Render  → https://energize-the-future.onrender.com/api  (server/)
```

## 1. Push the code to GitHub

```bash
git init && git add -A && git commit -m "Initial commit"
git remote add origin https://github.com/<you>/energize-the-future.git
git push -u origin main
```
`.env` files and database files are git-ignored.

## 2. Backend on Render

1. Render dashboard → **New + → Web Service** → choose the GitHub repository.
2. Settings:

| Field | Value |
|---|---|
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Instance type | Free |

3. Environment variables (all optional): `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (permanent data, see §6),
   `CLIENT_ORIGIN` (only for a custom domain), `RATE_LIMIT_MAX`. Render provides `PORT` itself — don't set it.
4. Deploy. Check `https://<your-service>.onrender.com/api/health` → `{"success":true,…}`.

The database creates and seeds itself on startup (no shell commands needed). Node 20 is selected by
`server/package.json` (`engines`) and `server/.node-version`.

## 3. Frontend on Vercel

1. Vercel → **Add New → Project** → import the repository. When it detects a monorepo, import only
   **`client`** (never `server` — Vercel runs functions, not a long-lived Express server with a file
   database).
2. Settings: Framework **Vite** · Root Directory `client` · Build `npm run build` · Output `dist`.
3. Environment variable (tick **Production, Preview and Development**):

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://<your-service>.onrender.com/api` |

4. Deploy. `client/vercel.json` makes direct links like `/mini-game` work on refresh.

> `VITE_API_URL` is baked in at **build time** — after changing it, redeploy the frontend.

## 4. Checklist after every deploy

- [ ] `…/api/health` answers
- [ ] The site loads and `/mini-game` works on a hard refresh
- [ ] Fun Facts and the game load data (proves CORS and `VITE_API_URL`)
- [ ] Submit a suggestion and a game score; both succeed

## 5. Troubleshooting (real problems we met)

| Symptom | Cause | Fix |
|---|---|---|
| Vercel `404 NOT_FOUND` on any page except `/` | Single-page app needs a rewrite | `client/vercel.json` rewrites everything to `index.html` |
| Render: `Cannot find module '/opt/render/project/src/server.js'` | Root Directory not set | Set **Root Directory = `server`**, redeploy |
| Render: crash `Assertion failed: (env) != nullptr` / exit 134 (seen with the earlier native SQLite driver) | Native module vs. newest Node | Node 20 is pinned (`engines` + `.node-version`); clear the build cache if it ever recurs |
| Render log: `Could not start: database connection failed` | Wrong `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Re-copy both values from the Turso dashboard, or remove them to use the local file |
| Browser console: *blocked by CORS policy … 'localhost:5173'* | API only allowed localhost | API now allows `localhost`, `*.vercel.app` and `CLIENT_ORIGIN` |
| Facts/game empty after the API had been idle | Free-tier disk is wiped on restart | Server re-seeds empty tables on every start |
| First request very slow | Free instance was asleep (~50 s wake-up) | Expected on the free tier; optional uptime pinger or paid plan |
| Frontend still calls `localhost:5001` | `VITE_API_URL` missing at build time | Set it for all environments and **redeploy** |

## 6. Make data permanent: Turso (free)

Without this step the API uses a local SQLite file. On Render's free tier that file lives on a disk that
can be reset, so **submitted scores, suggestions and contact messages can disappear** (facts and game
levels cannot — the server re-seeds them). A free [Turso](https://turso.tech) database fixes that:

1. Create a Turso account and a database (name it e.g. `energize-the-future`).
2. Copy its **URL** (looks like `libsql://energize-the-future-<you>.turso.io`) and create an **auth token**
   (Turso dashboard → your database → *Create token*).
3. In Render → your service → **Environment**, add:

| Key | Value |
|---|---|
| `TURSO_DATABASE_URL` | the `libsql://…` URL |
| `TURSO_AUTH_TOKEN` | the token |

4. Save (Render redeploys). In the service logs you should now see `Database: Turso (remote, persistent)`;
   the tables are created and seeded automatically on first start.
5. Submit a game score, then use *Manual Deploy → Restart*: the score must still be on the leaderboard.

Never commit the token; it belongs only in Render's environment settings.

## 7. Automation (GitHub Actions)

- **`ci.yml`** runs both test suites and a production build on every push — a red cross on GitHub means
  something broke before it reaches users. No setup needed.
- **`keep-alive.yml`** (optional) pings the API every 10 minutes so the free instance does not fall asleep
  (no 50-second wait for the first visitor — useful on competition day). Enable it with a repository
  variable: Settings → Secrets and variables → Actions → **Variables** → New variable
  `API_URL` = `https://<your-service>.onrender.com/api`. Without the variable the workflow does nothing.
