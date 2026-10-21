# Prompt 1 — Original project brief

> The brief the team gave to the AI assistant at the start of the project (September 2026).
> It is reproduced here in condensed form: every requirement is kept, repeated formatting and
> decoration were removed. The assistant was also told to build a *real, working* site, to create
> both frontend and backend, to test everything and fix errors before finishing, and not to leave
> placeholders or TODOs.

**Role.** You are an expert full-stack web developer and UI/UX designer. Build a complete, fully
functional, modern educational website about **UN Sustainable Development Goal 7: Affordable and
Clean Energy**, educating young people about renewable energy, energy efficiency, sustainability
and how everyone can contribute.

## 1. Stack
- Frontend: React + Vite, Tailwind CSS, React Router, Lucide React icons, responsive.
- Backend: Node.js, Express, REST API, SQLite, error handling, environment variables.
- JavaScript (not TypeScript); `fetch()` for API calls; `localStorage` only for client settings;
  clean, beginner-friendly, well-organised code.

## 2. Name and design
- Name **"ENERGIZE THE FUTURE"**, subtitle **"Affordable and Clean Energy — SDG 7"**.
- Modern, clean, visually impressive; green/blue/yellow; smooth animations; cards and gradients;
  accessible contrast; mobile-first. Landing page with navigation, logo, language selector, hero,
  animated renewable-energy visual, SDG 7 explanation, calls to action, footer.
- No copyrighted images — use CSS illustrations or icons.

## 3. Pages
Home · About SDG 7 · Renewable Energy · Energy-Saving Tips · Fun Facts · Mini Game ·
Energy Calculator · Community / Suggestions · Contact — each with consistent navigation, working
language selection, responsive layout, loading and error states.

## 4. Home
Hero, short SDG 7 introduction, three objectives (affordable energy; reliable and sustainable
energy; more renewable energy), statistics cards (no outdated numbers presented as current),
interactive cards for solar/wind/hydro/geothermal, "What Can You Do?", links to game and
calculator, a call to action.

## 5. About SDG 7
Simple student-friendly language: what the UN is, what SDG 7 is, why affordable and clean energy
matter, fossil-fuel problems, energy poverty, climate and pollution, energy efficiency, how
governments/businesses/individuals can help; an interactive timeline of renewable energy;
the official SDG 7 targets — accurate and based on official UN sources.

## 6. Renewable Energy
Solar, wind, hydropower, geothermal, biomass, tidal. For each: how it works, advantages,
disadvantages, environmental impact, real-world applications, an interesting fact. Interactive
comparison cards, expandable sections, simple diagrams/animations, a comparison table.

## 7. Energy-Saving Tips
Tips for home, school, transportation, technology, public spaces; each with explanation, icon,
estimated saving (when reliable), difficulty, a completion checkbox; a progress tracker saved in
`localStorage`.

## 8. Fun Facts
At least 30 accurate facts in six categories (solar, wind, climate, energy efficiency,
hydropower, sustainable technology); random and next buttons, category filter, favorites, share,
counter; facts stored in the backend database with endpoints for all facts, facts by category and
a random fact.

## 9. Mini Game — "ENERGY HERO"
Help a polluted virtual city become clean and efficient with a limited budget. Decisions change
clean-energy %, pollution, affordability, happiness and sustainability score. At least 10 levels
with multiple-choice decisions, score, timer or limited resources, positive and negative
consequences, progress bar, final score screen, restart, achievements, high-score leaderboard.
Example decisions: solar farm, LED streetlights, wind investment, public transport, keeping an
expensive polluting source, helping a low-income neighbourhood. Scores stored in the backend;
endpoints to submit scores, get the leaderboard and get scenarios; no account required.

## 10. Energy Calculator
Inputs: appliance name, watts, hours per day, days per month, price per kWh. Outputs: daily and
monthly kWh, monthly and yearly cost, estimated CO₂. Formulas: daily = W/1000 × hours;
monthly = daily × days; cost = kWh × price; CO₂ = kWh × emission factor. Add, remove and edit
multiple appliances, totals, **compare energy-efficient appliances**, reset; explain that CO₂ is
an estimate depending on the electricity source.

## 11. Community / Suggestions
Form: name, email, category (renewable energy, energy efficiency, education, transportation,
community projects, other), message. Server-side validation, SQLite storage, POST endpoint,
meaningful success and error messages, protection against invalid input, no sensitive data
exposed, confirmation message.

## 12. Languages
English (default), Romanian, Russian with i18next / react-i18next; **every visible text**
translated (navigation, buttons, headings, forms, errors, game, tips, facts, calculator), natural
language with no machine-translation placeholders; selection stored in `localStorage`; instant
switching without reload; codes `en`, `ro`, `ru`; `src/locales/{en,ro,ru}/translation.json`.

## 13. Backend and database
Tables `facts`, `game_scenarios`, `game_scores`, `suggestions`. Routes `GET /api/facts`,
`/api/facts/random`, `/api/facts/category/:category`, `GET /api/game/scenarios`,
`POST /api/game/scores`, `GET /api/game/leaderboard`, `POST /api/suggestions`. Input validation,
correct status codes, error middleware, CORS, environment variables, database initialisation
script, seed data. The backend runs independently of the frontend.

## 14. Accessibility
Semantic HTML, heading hierarchy, labelled forms, keyboard navigation, alt text, visible focus,
accessible buttons, sufficient contrast, responsive design.

## 15. Structure
`client/` (components, pages, services, locales, hooks, App.jsx, main.jsx) and `server/`
(routes, controllers, database, middleware, server.js), plus README.md and .gitignore.

## 16. Testing and final requirements
Install dependencies, start backend and frontend, test every page, endpoint, form, the game, the
leaderboard, the calculator, all three languages and mobile layout; fix console errors, broken
links and buttons; verify the database; make sure it runs from a clean installation. README with
description, features, technologies, installation, how to start frontend and backend, database
setup, API documentation, production build.

## 17. Workflow
Inspect existing files, plan, then build everything, connect it, test, and fix problems
automatically — do not stop at a plan or only give snippets. Finish with a summary, the exact
commands to run, configuration notes and a list of tests performed. It should look like a
professional international sustainability project that could win a school competition.
