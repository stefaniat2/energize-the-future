# Responsible AI Usage — Energize the Future

This document explains **which AI tools were used, how, under whose direction, and how the
results were checked**, so that another person could understand — and reproduce — the process.

## 1. Summary

| | |
|---|---|
| **AI tool** | Claude Code (desktop app) by Anthropic — an AI coding assistant that reads, writes, runs and tests code in the project folder |
| **Models** | Claude Sonnet 5 and Claude Sonnet 5.5 |
| **Used for** | Writing code, drafting Romanian/Russian/English texts, writing tests, finding and fixing bugs, writing documentation, explaining deployment steps |
| **Not used for** | Choosing the topic or rubric, deciding what the project should do, creating accounts, publishing the website (done by people), generating images (none used) |
| **Humans in the loop** | The team wrote the brief, reviewed every result on screen, tested the site, reported problems, made the design decisions and deployed it |
| **Period** | September–October 2026 |

## 2. Who did what

| Task | AI | Team |
|---|---|---|
| Choosing SDG 7 and the competition rubric | – | ✔ |
| Writing the project brief (pages, game, calculator, languages, stack) | – | ✔ |
| Planning and writing the React frontend and Express backend | ✔ | reviewed, directed changes |
| Drafting English, Romanian and Russian texts and facts | ✔ | reviewed (see checklist, §7) |
| Designing the look (colours, layout) | proposed within the brief | approved, requested changes (e.g. burger-menu navigation) |
| Writing and running automated tests | ✔ | reviewed results |
| Testing in the browser, reporting problems with screenshots and logs | ✔ (automated checks) | ✔ (real devices, real deployment) |
| Creating GitHub, Vercel and Render accounts and deploying | – | ✔ (AI gave step-by-step instructions and fixed configuration files) |
| Final decisions and approval to publish | – | ✔ |

Every change was requested by a person in a written prompt, shown as a result, and accepted or
corrected by a person. The AI uploaded code to GitHub only when asked to; creating the hosting
accounts and publishing the website was done by the team.

## 3. Prompts

The prompts that shaped the project are kept in the repository so the process is transparent.

1. **Original brief** — a detailed 17-section specification (stack, design, 9 pages, game,
   calculator, 3 languages, backend, accessibility, testing). See
   [docs/prompts/01-original-brief.md](docs/prompts/01-original-brief.md).
2. **Follow-up prompts** (quoted from the conversation):
   - *"where can i find this project on my computer?"* → project moved to the Desktop folder.
   - *"can you remove all the shortcuts for the pages from the navbar and make them accessible through a burger button that sits next to the language button (this is for the laptop/larger dimension)"* → navigation redesign.
   - *"tell me how can i publish this website for free"* → free-hosting plan (Vercel + Render).
   - *"no, make it work and make fix all the other bugs you can find, after that push the changes"* → CORS fix, self-seeding database, defensive API URL handling.
   - *"make this project eligible for 45 points based on the graph above"* (competition rubric) → this round of work: automated tests, security hardening, game consequences and enforced budget, efficiency comparison tool, accessibility, documentation, this document.
   - *"i need to migrate the project to a new git hub account , and changing the person doing the commits"* → history re-authored and pushed to the new repository (a backup was made first).
   - *"do everything you can"* (to finish the remaining improvements) → optional permanent database (Turso), Lighthouse audit and fixes, licence, CI, screenshots and documentation updates.

## 4. How the AI's output was verified

The AI was not trusted blindly. Every feature was checked in several ways:

1. **Automated tests — 28 tests** (`npm test` in `server/` and `client/`):
   API behaviour, validation, CORS, rate limiting, SQL-injection text, calculator formulas,
   game rules, and a guard that Romanian and Russian have the same keys as English.
2. **Hand calculation.** For example, a 150 W refrigerator running 24 h/day for 30 days at
   0.15 per kWh must give 3.6 kWh/day, 108 kWh/month, 16.20/month, 194.40/year and 48.6 kg CO₂ —
   the app was checked against these numbers, not just "looks plausible".
3. **Real browser testing** of every page, the whole game from level 1 to the leaderboard,
   language switching, and phone-width layout.
4. **Lighthouse audit** (Chrome's accessibility / performance / SEO checker) on all 10 pages of the production
   build: it initially reported accessibility 89–92 and, after fixes, **100 for Accessibility, Best Practices
   and SEO on every page** (Performance 95–98 on throttled mobile).
5. **Real deployment testing**, which found problems that local testing could not (below).

### Mistakes made by the AI that testing caught

Being transparent about errors is part of using AI responsibly:

| Problem | How it was found | Fix |
|---|---|---|
| Animated wind-turbine blades rendered as a single arrow | Visual check in the browser | Redrawn as inline SVG |
| Game "budget" was displayed but never enforced; no feedback after decisions | Reviewing the game against the original brief | Budget now locks unaffordable options; a consequences panel shows every effect |
| Timer could apply the automatic choice twice under React StrictMode | Code review while refactoring | Timer logic split from the side effect |
| Backend crashed on Render (native module vs. newest Node version) | Deployment log pasted by the team | Node 20 pinned (`engines`, `.node-version`) |
| Website blocked by CORS after deployment | Browser console screenshot from the team | Origin allow-list (localhost, `*.vercel.app`, configured origins) |
| Free host wipes the database on restart → empty facts and game | Reasoning about the host, then reproduced locally | Server seeds itself when tables are empty |
| 404 page and some ARIA labels were only in English | Automated scan for hard-coded strings | All translated; scan found nothing left |
| Calculator lacked the "compare efficient appliances" feature required by the brief | Checking the result against the brief | Real comparison tool built |
| A blanket "make grey text darker" change made the **footer** text *less* readable (3.75:1 on the dark background) | Lighthouse colour-contrast audit | Footer text lightened; every badge/chip colour pair now measured, not guessed |
| Logo link had no accessible name on phones; footer headings skipped a level; `robots.txt` was invalid; pages jumped ~0.7 layout-shift units while data loaded | Lighthouse | `aria-label`, heading levels fixed, real `robots.txt`, page header rendered immediately with data loading inside it |

## 5. Data, privacy and licensing

- **What the AI saw:** source code, the project brief, screenshots of the developer's own
  dashboards and error logs. No visitor data from the live site was shared with the AI.
- **What the website stores:** only what a visitor chooses to submit (game name and score,
  suggestions, contact messages). No accounts, cookies, analytics or trackers. Preferences
  (language, tips progress, favorites, appliances) stay in the visitor's browser.
- **Content sources:** public information from the United Nations (SDG 7), the International
  Energy Agency and IRENA. Figures are marked as approximate.
- **No copyrighted media.** Illustrations are CSS/SVG made for this project; icons are
  [Lucide](https://lucide.dev) (ISC).
- **Open-source software:** React, Vite, Tailwind CSS, React Router, i18next / react-i18next,
  Express, @libsql/client (MIT) · lucide-react (ISC) · Poppins typeface (SIL Open Font License 1.1).
  The full list is shown in the app on the *AI & Credits* page.
- **AI-generated code and text** were produced for this project under the team's instructions
  and are the team's to publish; no third-party code was pasted in beyond the dependencies above.

## 6. Reproducing the process

1. Install [Claude Code](https://claude.com/claude-code) and open an empty folder.
2. Give it the brief in `docs/prompts/01-original-brief.md`.
3. Review each step; ask for changes in plain language (see the follow-up prompts above).
4. Accept the result only when the **acceptance checks** pass: `npm test` in `server/` and
   `client/`, `npm run build`, and the manual browser checklist in
   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#testing-strategy).

AI output is not deterministic, so a re-run will not produce identical code — the tests and
checklists are what define "correct", not the exact wording of the files.

## 7. Human review checklist (to be completed by the team)

Tick these before presenting. They are what turns "AI-generated" into "AI-assisted and verified".

- [ ] A Romanian speaker has read the Romanian texts; a Russian speaker has read the Russian texts
- [ ] The facts and statistics on the Home, About and Fun Facts pages were compared with the
      linked UN / IEA / IRENA sources
- [ ] Every team member can open the code and explain: the game scoring formula
      (`client/src/utils/game.js`), the calculator formulas (`client/src/utils/energy.js`),
      how a request travels frontend → API → database, and why the server re-seeds itself
- [ ] The website was opened and used on a real phone and a laptop
- [ ] No passwords, tokens or personal data are in the repository (`.env` is git-ignored)

## 8. Limits and ethical notes

- AI can be wrong or sound more certain than it is. That is why numbers are tested by hand and
  statistics are labelled approximate.
- Translations were drafted by AI and need native review (checklist above); inform us through
  the Contact page if you find an error.
- CO₂ results are estimates based on one average emission factor.
- The project teaches energy awareness; running AI itself also uses energy, which is one reason
  the work was done in a few focused iterations rather than by regenerating everything repeatedly.
