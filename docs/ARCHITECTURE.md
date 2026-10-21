# Architecture and Design Decisions

This document explains *how* Energize the Future works and *why* it was built this way.

## 1. Overview

Two independent programs talk over HTTPS:

- **Client** (`client/`) — React single-page app, built by Vite into static files (hosted on Vercel).
- **Server** (`server/`) — Express REST API with an embedded SQLite database (hosted on Render).

```
Browser ──GET static files──► Vercel (client/dist)
   │
   └──fetch /api/... (JSON)──► Render: Express ─► middleware ─► controller ─► SQLite
```

The server never renders HTML, and the client never touches the database, so either side can be
replaced or redeployed without changing the other as long as the API contract (README) holds.

## 2. Server

### Layers

| Layer | Files | Responsibility |
|---|---|---|
| App | `app.js` | Builds the Express app (CORS, headers, rate limit, routes). Exported so tests can start it on any port |
| Entry | `server.js` | Reads `PORT` and calls `listen` — nothing else |
| Routes | `routes/*.js` | Map URL + method to a controller and attach middleware |
| Middleware | `middleware/` | `validators` (input checks), `rateLimit`, `security` (headers), `errorHandler` |
| Controllers | `controllers/*.js` | Read/write the database and shape the JSON response |
| Database | `database/db.js` | Opens SQLite, creates tables, auto-seeds empty ones |

### Data model

| Table | Columns | Notes |
|---|---|---|
| `facts` | id, category, text_en, text_ro, text_ru, created_at | 35 rows; language chosen per request |
| `game_scenarios` | id, level, title_*/description_* (en/ro/ru), options_json | `options_json` holds two options, each with `text` per language and `effects` |
| `game_scores` | id, player_name, score, sustainability_score, levels_completed, created_at | Leaderboard = ordered by score, then sustainability |
| `suggestions` | id, name, email, category, message, created_at | Community form |
| `contact_messages` | id, name, email, subject, message, created_at | Contact form |

### Decisions and reasons

- **SQLite via `better-sqlite3`.** Zero-setup (no database server to install), synchronous API
  that is easy to read for beginners, and fast enough for this scale. Trade-off: on free hosting
  the file is not persistent — see "Self-seeding" and the README's known limitations.
- **Translations stored in columns (`text_en/ro/ru`)** instead of separate tables: one query
  returns everything and the API picks the language, which keeps controllers tiny.
- **Self-seeding database.** `db.js` calls `seedDatabase()` after creating tables; it inserts the
  starter data *only into empty tables*. A fresh clone, a test run with `:memory:` and a free-tier
  host that restarts with a blank disk all start working without a manual step.
  `npm run seed` forces a reset.
- **Validation in middleware** keeps controllers free of checks and gives a uniform
  `{ success:false, errors:[…] }` response. Score validation also bounds the score (max 5000, while the
  theoretical game maximum is 2436) so leaderboard cheating via a hand-made request is rejected.
- **CORS allow-list function**, not a single origin: `localhost` (development), any
  `*.vercel.app` host (production *and* preview deployments) and anything in `CLIENT_ORIGIN`
  (custom domains). Anything else gets `403`.
- **Rate limiting** (in-memory, per IP, 20 writes/minute) protects forms and the leaderboard from
  spam without adding a dependency. `trust proxy` is enabled so the real visitor IP is used
  behind Render's proxy. Reads are unrestricted.
- **Error handling.** Expected errors (`4xx`) return their message; unexpected errors (`5xx`)
  are logged with a stack trace but the client only sees a generic message.
- **Node 20 pinned** (`engines`, `.node-version`) because the native SQLite module crashed on
  the newest Node release on the host.

## 3. Client

### Structure

- `pages/` — one component per route; `components/` — shared UI (Navbar, Footer, LanguageSelector,
  Loading/Error states, ScrollToTop).
- `utils/energy.js` and `utils/game.js` — **pure functions** with no React: the calculator
  formulas and the game rules. Pages call them; tests exercise them directly.
- `services/api.js` — the only place that calls `fetch()`. Converts failures (network, bad JSON,
  `success:false`) into `Error`s with a readable `message`, so pages just `try/catch`.
- `hooks/useLocalStorage.js` — state that survives reloads (language, tips progress, favorites,
  appliances, currency, player name). Wrapped in `try/catch` so private browsing never crashes it.

### Decisions and reasons

- **Single-page app + `vercel.json` rewrite** so deep links such as `/mini-game` work on refresh.
- **i18next** with one JSON file per language; the whole UI uses `t("section.key")`.
  Dynamic keys (`t(\`tips.items.${id}.title\`)`) keep list components small.
  A test fails if any language is missing a key.
- **Locale-aware formatting** with `Intl` (`toLocaleString`) for numbers and currencies instead
  of hand-written formatting.
- **Navigation in a single burger menu** (requested by the team) with outside-click and `Esc`
  closing; the same control works on phones and laptops.
- **Accessibility built in**: skip link, labelled controls, `aria-pressed`, progress bars with
  values, live regions for game feedback, translated `aria-label`s, `<html lang>` sync,
  reduced-motion CSS.
- **Loading and error states** (`StatusMessage`) for every page that depends on the API.

## 4. Energy Hero — game design

The game is a small simulation expressed as data, so levels can be changed in the database
without touching code.

**State.** Five stats from 0–100 — clean energy, pollution, affordability, happiness,
sustainability — plus budget, score and timer.

| Rule | Value |
|---|---|
| Starting stats | clean 15 · pollution 70 · affordability 45 · happiness 50 · sustainability 20 |
| Starting budget | 100 (+20 income when each level starts → 120 on level 1) |
| Income | +20 at the start of every level |
| Time per decision | 25 s; if it runs out, the **cheapest** option is chosen automatically |
| Options per level | 2, each with a cost and effects on the stats |
| Budget rule | An unaffordable option is locked — unless no option is affordable (never a dead end) |

**Score for one decision** (only improvements count; falling pollution counts as an improvement):

```
score = 10 × max(0, Δsustainability)
      +  3 × max(0, Δclean)
      +  3 × max(0, Δhappiness)
      +  3 × max(0, −Δpollution)
      +  2 × max(0, Δaffordability)
```

**Achievements** (checked at the end): Clean Starter (clean ≥ 50) · Pollution Fighter (pollution ≤ 20)
· People's Champion (happiness ≥ 70) · Sustainability Master (sustainability ≥ 80) ·
Energy Hero (finished all levels).

**Why the budget matters.** Taking the best option on every level would cost 335 units but the
player only ever has 120 + 9×20 = 300, so something must be sacrificed — in testing the
expensive option on level 8 (cost 50) becomes unaffordable even for a perfect run. A perfect-looking run is therefore capped below the 2436-point theoretical maximum (about 2090 in
testing). Player choices, not luck, decide the outcome. Consequences are shown after every decision (`+15 Clean Energy`,
`−30 Budget`), because feedback is how players learn.

## 5. Calculator

```
daily kWh      = watts / 1000 × hours per day
monthly kWh    = daily × days per month
monthly cost   = monthly kWh × price per kWh
yearly cost    = monthly cost × 12
CO₂ (kg/month) = monthly kWh × 0.45          ← average grid factor, an estimate
trees needed   = CO₂ per year ÷ 21 kg         ← approx. absorption of one mature tree
```

The **efficiency comparison** uses typical illustrative wattages (60 W → 9 W bulb, 90 W → 30 W
fridge, 200 W → 60 W TV, 1500 W → 900 W air conditioner), the visitor's price per kWh, and
`efficiencySavings()` to show percent, kWh, money and CO₂ saved per year; one click adds the
efficient version to the list.

## 6. Testing strategy

| Level | What | How |
|---|---|---|
| Unit | Calculator, game rules, translation files | `client/tests/logic.test.js` (13 tests) |
| Integration | Every API endpoint on a real Express app with an in-memory database | `server/tests/api.test.js` (15 tests) |
| Manual (browser) | See checklist below | Done before each release |
| Deployment | Live site against the live API | After each deploy |

### Manual browser checklist

- [ ] Every page loads without console errors in English, Romanian and Russian
- [ ] Language switch updates text, tab title and `<html lang>` instantly; choice survives reload
- [ ] Burger menu opens, links work, `Esc` and outside click close it
- [ ] Game: start → decide 10 levels → consequences shown → results → submit → leaderboard shows score
- [ ] Game: budget locks an unaffordable option; timer pauses on the results panel
- [ ] Calculator: add / edit / remove, totals, currency change, reload keeps data, preset adds appliance
- [ ] Tips: tick tips, progress ring updates, reload keeps progress, reset works
- [ ] Facts: filters, random, next, favorite, share/copy, counter
- [ ] Community and Contact: invalid input shows server errors; valid input shows confirmation
- [ ] Phone width (≈375 px): no horizontal scrolling, menu usable, forms usable
- [ ] Keyboard only: skip link, tab order, visible focus, no keyboard traps
