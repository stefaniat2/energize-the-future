# ⚡ Energize the Future

**Affordable and Clean Energy — SDG 7**

A full-stack educational website that teaches young people about the United Nations
Sustainable Development Goal 7 (SDG 7): renewable energy, energy efficiency,
sustainability, and how everyone can contribute to a cleaner future.

Built with a React + Vite frontend and a Node.js + Express + SQLite backend, fully
translated into **English, Romanian, and Russian**.

---

## Table of Contents

1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [Running the Project](#running-the-project)
6. [Database](#database)
7. [API Documentation](#api-documentation)
8. [Multilingual Support](#multilingual-support)
9. [Building for Production](#building-for-production)
10. [Known Limitations](#known-limitations)

---

## Features

- **Home** — hero section, SDG 7 objectives, live stats, renewable energy source cards, and calls to action.
- **About SDG 7** — plain-language explanation of the UN, SDG 7, energy poverty, climate change, an interactive timeline, and the official SDG 7 targets.
- **Renewable Energy** — expandable cards for solar, wind, hydro, geothermal, biomass, and tidal energy, plus a comparison table.
- **Energy-Saving Tips** — 20 practical tips across 5 categories with a completion tracker saved in `localStorage`.
- **Fun Facts** — 35 educational facts served from the backend, with category filters, random/next navigation, favorites, and sharing.
- **Mini Game: Energy Hero** — a 10-level city-building game where budget, clean energy %, pollution, affordability, happiness, and sustainability all respond to your choices, with a timer, achievements, and a backend leaderboard.
- **Energy Calculator** — add multiple appliances and instantly see daily/monthly energy use, monthly/yearly cost, and estimated CO₂ emissions.
- **Community / Suggestions** — a validated form that stores sustainability suggestions in the database.
- **Contact** — a validated contact form stored in the database.
- **Full i18n** — every visible string (nav, forms, game, tips, facts, calculator, errors) is translated into English, Romanian, and Russian with instant switching and no page reload.
- **Accessibility** — semantic HTML, labeled form fields, visible focus states, keyboard-navigable menus, and alt/aria labeling throughout.

## Technologies Used

**Frontend**
- React 18 + Vite
- React Router v6
- Tailwind CSS
- react-i18next / i18next
- lucide-react icons

**Backend**
- Node.js + Express
- SQLite via `better-sqlite3`
- dotenv for configuration
- Custom validation and error-handling middleware

## Project Structure

```
energize-the-future/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Navbar, Footer, LanguageSelector, etc.
│   │   ├── pages/              # One file per route
│   │   ├── services/api.js     # fetch() wrapper for the backend
│   │   ├── locales/{en,ro,ru}/translation.json
│   │   ├── hooks/useLocalStorage.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                    # Express + SQLite backend
│   ├── routes/                 # facts.js, game.js, suggestions.js, contact.js
│   ├── controllers/            # Route handlers
│   ├── database/               # db.js (schema) + seed.js (starter data)
│   ├── middleware/              # validators.js, errorHandler.js
│   ├── server.js
│   └── .env
│
└── README.md
```

## Installation

Requires **Node.js 18+** and npm.

```bash
git clone <this-repo-url> energize-the-future
cd energize-the-future
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

## Running the Project

The backend and frontend run as two independent processes.

### 1. Set up and seed the database (first time only)

```bash
cd server
npm run seed
```

This creates `server/database/energize.db` and fills it with 35 educational facts
and 10 game scenarios. It's safe to re-run — it clears and reseeds those tables.

### 2. Start the backend

```bash
cd server
npm run dev
```

The API runs at **http://localhost:5001** (configurable via `server/.env`).

> Port 5001 is used instead of 5000 because macOS reserves port 5000 for AirPlay
> Receiver on many machines. Change `PORT` in `server/.env` if you need a different port.

### 3. Start the frontend

In a separate terminal:

```bash
cd client
npm run dev
```

The site runs at **http://localhost:5173**.

Open that URL in your browser — the frontend automatically talks to the backend
at `http://localhost:5001/api` (configurable via `client/.env` and the
`VITE_API_URL` variable, see `client/src/services/api.js`).

## Database

SQLite database file: `server/database/energize.db` (created automatically on
first run of the server or the seed script).

Tables:

| Table              | Purpose                                             |
|--------------------|------------------------------------------------------|
| `facts`            | Educational facts (category + text in en/ro/ru)     |
| `game_scenarios`   | The 10 Energy Hero levels (title, description, options with effects, in en/ro/ru) |
| `game_scores`      | Submitted player scores for the leaderboard          |
| `suggestions`      | Community sustainability suggestions                 |
| `contact_messages` | Messages submitted through the Contact page          |

Re-seed at any time with `npm run seed` inside `server/`.

## API Documentation

Base URL: `http://localhost:5001/api`

| Method | Endpoint                          | Description                                    |
|--------|------------------------------------|-------------------------------------------------|
| GET    | `/health`                          | Health check                                   |
| GET    | `/facts?lang=en`                   | All facts, translated to `lang` (en/ro/ru)     |
| GET    | `/facts/random?lang=en&category=`  | One random fact, optionally filtered by category |
| GET    | `/facts/category/:category?lang=en`| All facts in a category                        |
| GET    | `/game/scenarios?lang=en`          | All 10 game levels, translated                 |
| POST   | `/game/scores`                     | Submit a score `{ playerName, score, sustainabilityScore, levelsCompleted }` |
| GET    | `/game/leaderboard?limit=10`       | Top scores, highest first                      |
| POST   | `/suggestions`                     | Submit a suggestion `{ name, email, category, message }` |
| POST   | `/contact`                         | Submit a contact message `{ name, email, subject, message }` |

All POST endpoints validate input server-side and return:

```json
{ "success": false, "message": "Invalid input.", "errors": ["..."] }
```

on a `400` response, or `{ "success": true, "data": {...} }` on success.

Fact categories: `solar`, `wind`, `climate`, `efficiency`, `hydropower`, `technology`.

Suggestion categories: `renewable-energy`, `energy-efficiency`, `education`,
`transportation`, `community-projects`, `other`.

## Multilingual Support

- Languages: English (`en`, default), Romanian (`ro`), Russian (`ru`).
- Powered by `i18next` / `react-i18next`.
- All UI text lives in `client/src/locales/{en,ro,ru}/translation.json` — all
  three files share the exact same 432 keys.
- The selected language is stored in `localStorage` (`etf_language`) and
  restored on the next visit.
- Backend content (facts and game scenarios) stores translated text directly in
  the database and returns it based on a `?lang=` query parameter.

## Building for Production

Frontend:

```bash
cd client
npm run build   # outputs to client/dist
npm run preview # optional: preview the production build locally
```

Backend:

```bash
cd server
NODE_ENV=production node server.js
```

Serve `client/dist` with any static host (Nginx, Vercel, Netlify, etc.) and
point `VITE_API_URL` at your deployed backend's `/api` URL before building.

## Known Limitations

- The game leaderboard and appliance calculator do not require accounts —
  scores are stored anonymously with a player-chosen name.
- CO₂ estimates in the Energy Calculator use a single average grid emission
  factor (0.45 kg CO₂/kWh) for simplicity; real-world emissions vary by country
  and energy mix, as noted in the app itself.
- `npm audit` reports moderate-severity advisories in Vite/esbuild and React
  Router that require breaking major-version upgrades — acceptable for local
  development and learning purposes, but worth revisiting before any public
  deployment.
