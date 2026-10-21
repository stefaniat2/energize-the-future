# Code walkthrough — know your own project

A study guide so you can explain every part out loud. Read a section, open the files it names, then try to explain
it **without looking**. The questions at the end are the ones a jury is most likely to ask.

## 1. The whole thing in 30 seconds

> "A React single-page app (the browser part) talks over HTTPS to a small Express API, which reads and writes a
> SQLite-compatible database. Visitors' own settings stay in their browser. Everything the user sees is
> translated into three languages."

```
Browser (client/)  ──fetch JSON──►  API (server/)  ──SQL──►  Database (local file or Turso)
React · Tailwind                    Express · middleware      facts · game_scenarios · game_scores
i18next · localStorage              controllers               suggestions · contact_messages · meta
```

## 2. Follow one click: opening *Fun Facts*

1. **`client/src/App.jsx`** — React Router matches `/fun-facts` and renders `pages/FunFacts.jsx`.
2. **`FunFacts.jsx`** — a `useEffect` calls `api.getFacts(i18n.language)` when the page opens (and again if the
   language changes). While waiting it shows `<Loading />`; if it fails, `<ErrorState />` with *Try again*.
3. **`services/api.js`** — the only place that calls `fetch()`. It builds the URL from the API address, turns
   network errors and `success:false` replies into a readable `Error`, and returns `body.data`.
4. **`server/app.js`** — the request passes through, in order: security headers → CORS check → JSON body parser →
   "wait for the database" → the route.
5. **`routes/facts.js` → `controllers/factsController.js`** — runs `SELECT * FROM facts`, picks `text_en`, `text_ro`
   or `text_ru` according to `?lang=`, and replies `{ success: true, data: [...] }`.
6. **`database/db.js`** — `db.all()` sends the SQL to the database (a local file, or Turso if
   `TURSO_DATABASE_URL` is set).
7. Back in the browser, `setFacts(data)` triggers a re-render and the first fact appears.

*Why is the API address handled in `api.js`?* So no other file needs to know it. Production builds default to the
live API; `VITE_API_URL` can override it.

## 3. Energy Hero (the game) — `pages/MiniGame.jsx` + `utils/game.js`

- **Data, not code:** the 10 levels live in the database (`seedData.js`). Each has two options with `effects`
  (clean, pollution, affordability, happiness, sustainability, budget).
- **State:** five stats (0–100), budget, score, level, timer, and `outcome` (the result just shown).
- **Choosing:** `applyChoice()` applies the effects with `applyEffects()` (clamped to 0–100), adds
  `scoreForEffects()` points, and sets `outcome` — which shows the consequences panel instead of jumping on.
- **Score formula:** `10×Δsustainability + 3×Δclean + 3×Δhappiness + 3×(−Δpollution) + 2×Δaffordability`, counting
  only improvements. Sustainability pays most so long-term thinking wins.
- **Budget:** start 100 (+20 income per level). `isLocked()` locks an option you can't afford — unless nothing is
  affordable, so you can never get stuck. Taking the best option every level would cost 335 but you only ever have
  300, so you must sacrifice something: that is the game's tension.
- **Timer:** one effect ticks the clock only while a decision is pending; a *separate* effect picks the cheapest
  option when it reaches 0. (Keeping the side effect out of the state updater avoids double-firing in React's
  StrictMode.)
- **Leaderboard:** `POST /api/game/scores` (validated: name, score ≤ 5000, etc.), `GET /api/game/leaderboard`.

## 4. Calculator — `utils/energy.js`

```
daily kWh    = watts / 1000 × hours per day            150 W × 24 h → 3.6 kWh
monthly kWh  = daily × days per month                  3.6 × 30     → 108 kWh
monthly cost = monthly kWh × price per kWh             108 × 0.15   → 16.20
yearly cost  = monthly cost × 12                                    → 194.40
CO₂ (kg/mo)  = monthly kWh × 0.45                                   → 48.6 kg
trees        = CO₂ per year ÷ 21                       48.6×12 ÷ 21 → ≈ 27.8 trees
```
The page (`EnergyCalculator.jsx`) only collects input and displays results; the maths is in pure functions that the
tests check directly. Appliances are saved in `localStorage` through the `useLocalStorage` hook.

## 5. Languages — i18next

- `client/src/i18n.js` loads three JSON files and starts in the saved language (`localStorage`).
- Components call `t("section.key")`. `LanguageSelector` calls `i18n.changeLanguage()`, React re-renders instantly.
- `App.jsx` keeps `<html lang>` and the tab title in sync.
- Facts and game levels come from the database already translated: the API picks the column from `?lang=`.
- The test `client/tests/logic.test.js` fails if any language lacks a key.

## 6. Database and seeding — `server/database/`

- `db.js` connects (Turso or local file), creates tables, then runs `seedDatabase()`.
- `db.ready` is a promise: `server.js` waits for it before listening; `app.js` makes each request wait for it.
- **Versioned seeding:** `SEED_VERSION` in `seedData.js` is stored in the `meta` table. If it differs (or tables are
  empty) the server replaces *only* facts and game levels, in one transaction, with ids restarting at 1 so saved
  favourites stay valid. Scores and messages are never touched.
- All SQL uses `?` placeholders (parameterised) — user text can never become SQL.

## 7. Security — what protects what

| Measure | File | Protects against |
|---|---|---|
| Server-side validation | `middleware/validators.js` | Bad or malicious input, fake scores |
| Parameterised SQL | controllers | SQL injection |
| Rate limiting (20 writes/min/IP) | `middleware/rateLimit.js` | Spam of forms and leaderboard |
| CORS allow-list | `app.js` | Other websites using your API from a browser |
| Security headers | `middleware/security.js` | MIME sniffing, framing |
| Generic 500 messages | `middleware/errorHandler.js` | Leaking internals |
| Body limit 10 kB | `app.js` | Oversized requests |

## 8. Tests — what they prove

- **`server/tests/api.test.js`** starts the real app on a random port with an in-memory database and calls every
  endpoint, including bad input, injection text, CORS and rate limiting.
- **`server/tests/seed.test.js`** proves seeding is idempotent, refreshes old content and keeps scores.
- **`client/tests/logic.test.js`** proves the formulas, game rules, achievements and that all three languages match.
- **GitHub Actions** runs all of them on every push.

## 9. How it gets online

`git push` → GitHub → **Vercel** builds `client/` (static files) and **Render** runs `server/`
(`node server.js`). The API uses **Turso** for permanent data when its two environment variables are set. If
Render's free server sleeps, the first visitor waits ~50 s (an optional GitHub workflow pings it to keep it awake).

## 10. Questions to answer out loud (with where to look)

1. What happens between clicking a link and seeing data? → §2
2. How is the game score calculated, and why does sustainability pay most? → §3
3. Why can't the player buy every good option? Show the numbers. → §3
4. Prove the calculator is right with one example by hand. → §4
5. How does switching language work without a page reload? → §5
6. Where does the database content get its translations? → §5, §6
7. What is the `meta` table for and what happens if you change a fact's text? → §6
8. How do you stop someone from submitting a fake high score or an SQL injection? → §7
9. Why did the site break after the first deployment, and how was it fixed? (`localhost` baked in at build time;
   production default added) → `client/src/services/api.js`, `docs/DEPLOYMENT.md`
10. What did the AI do, what did you do, and what did you check yourself? → `AI_USAGE.md`
