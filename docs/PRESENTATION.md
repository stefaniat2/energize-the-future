# Presentation Kit (7 minutes + questions)

Everything the jury sees you do is scored, so this page maps **each rubric criterion to a moment
in your talk or demo**, gives you a script, a demo route and prepared answers.

## 1. Rubric → where you prove it

| Criterion | Evidence to show / say | Where |
|---|---|---|
| 01 Originality | Not a brochure: a *strategy game* with a real budget that forces trade-offs, a calculator that turns watts into money, CO₂ **and trees**, an old-vs-efficient comparison, 3 languages | Demo, min 2–4 |
| 02 Practicality | Real use: check your own appliance, see what an LED saves with *your* price, habit tracker, ideas box; works on phone | Demo, min 3–4 |
| 03 UI/UX | Consistent SDG-colour design, one burger menu, instant language switch, clear feedback after every decision, loading/error states, keyboard + screen-reader support | Demo throughout |
| 04 Functionality | Everything works live, including backend: leaderboard, forms. 28 automated tests pass | Demo + "how it works" |
| 05 Technical skills | React/Vite, Express REST API, SQLite, i18n, CORS, rate limiting, validation, self-seeding database, pure tested logic, deployed on Vercel + Render | Min 4:30–5:30 |
| 06 Oral presentation | Clear structure, a hook, a story, enthusiasm, eye contact, timing | Whole talk |
| 07 Documentation | README, architecture, user guide, deployment guide, API reference, tests documented | Show the repo, 20 s |
| 08 Stand design | Poster + QR + live leaderboard challenge | [STAND.md](STAND.md) |
| 09 Responsible AI | Tools and prompts documented, what AI did vs. you, mistakes found and fixed, human review, licences, privacy | Min 5:30–6:15 + `AI_USAGE.md` |

## 2. The talk (7:00)

> Speak it in your own words — the script is a skeleton. Short sentences. Look at the jury, not the screen.

**0:00 — Hook (30 s)**
"About 660 million people on Earth still have no electricity. Two billion cook over smoke-filled
fires. And the energy we *do* have is heating the planet. The UN calls this Goal 7: affordable and
clean energy for everyone by 2030. Our question was: how do we make young people *feel* that
problem — and know what to do about it?"

**0:30 — Idea (45 s)**
"We built **Energize the Future**: not a page of facts, but a place with three things to do —
*Learn* (SDG 7, six renewable technologies), *Play* (Energy Hero, a city strategy game), and
*Measure* (an energy calculator with your own numbers). It speaks English, Romanian and Russian,
because climate action can't wait for a translation."

**1:15 — Live demo (3 min)** — follow the route in §3.

**4:15 — How it works (1 min 15 s)**
"A React app talks to an Express API with a SQLite database. Three technical choices I'm proud of:
*one* — the server **seeds itself**, so our free host can restart and still serve facts and game
levels; *two* — game and calculator logic are **pure functions with unit tests**, 28 tests in
total, including one that fails if any language is missing a translation; *three* — security:
validation, rate limiting, a CORS allow-list, no tracking."

**5:30 — Responsible AI (1 min)**
"We built this with an AI coding assistant, Claude Code — and we're open about it. **We** chose the
topic, wrote the brief, decided the features and reviewed everything. The AI wrote code and
drafted translations. It also made mistakes — the game's budget wasn't actually enforced, a
turbine animation was broken, the server crashed on the host — and our tests and our own
checks caught them. Every prompt, tool and check is public in AI_USAGE.md and on the *AI & Credits*
page. The AI was a fast assistant; the judgement was ours."

**6:30 — Impact and next steps (30 s)**
"Next: a permanent database, more levels using real national data, and teacher mode for
classrooms. Scan the QR code, beat 2,000 points in Energy Hero, and put your name on our
leaderboard. Thank you!"

## 3. Live demo route (≈3 minutes)

Do exactly this; practise it until it takes 3 minutes.

1. **Home** — "Hero, objectives, real statistics." (10 s)
2. **Language** — switch to **Русский**, then **Română**, back to English. "Everything, including database content." (15 s)
3. **Mini Game** — type your name → Start. On level 1 choose the solar farm → show the **consequences
   panel** ("every choice has a visible price"). On level 2 point at the **cost badges** and the
   budget: "I can't buy everything." Keep choosing the first (expensive) option on every level; at **level 8** you will see the
   **locked option** ("not enough budget"). Finish, **Submit to Leaderboard**, show the leaderboard. (75 s)
4. **Calculator** — add *Refrigerator, 150 W, 24 h, 30 days, price 0.15* → "3.6 kWh a day, 194 a year,
   48.6 kg CO₂ a month" → show **trees**. Then scroll to **Compare efficient alternatives**, press
   *Add the efficient version* on the LED bulb. (60 s)
5. **Menu** → **AI & Credits** — "Everything is documented." (15 s)

Tip: the numbers above are deterministic — if yours differ, something is wrong; check before presenting.

### Pre-flight checklist (do it 10 minutes before)

- [ ] Open `https://energize-the-future.onrender.com/api/health` **to wake the free server** (first request can take ~50 s!)
- [ ] Open the site, play one level, then reload — confirm facts and game load
- [ ] Phone on hotspot: scan the QR from the poster
- [ ] Laptop charged; browser zoom 100 %; notifications off; a second tab with the repo's README
- [ ] **Backup plan:** run it locally (`cd server && npm run dev`, `cd client && npm run dev`) and have a
      60-second screen recording ready in case the Wi-Fi fails

## 4. Questions the jury may ask

Answer in your own words and **honestly** — describe what *you* decided and checked.

| Question | Strong answer (adapt to what is true for you) |
|---|---|
| What is original here? | The combination: a strategy game where budget forces trade-offs + a calculator that links watts to money, CO₂ and trees + real efficiency comparison, in three languages. |
| Who is it for and is it practical? | Students 12–18 and their families. They can enter their own appliances and electricity price and see real savings; it works on phones. |
| How does the game work? | 5 stats 0–100; each level has two options with a cost and effects; +20 budget per level; 25 s timer; score rewards improvements, sustainability most. Unaffordable options lock, so the perfect score is impossible — you must prioritise. |
| How do you know the calculator is right? | Formulas from the brief; unit tests; I checked by hand: 150 W × 24 h × 30 d = 108 kWh. CO₂ uses an average 0.45 kg/kWh and says it's an estimate. |
| What did the AI do and what did you do? | See `AI_USAGE.md`: AI wrote code and drafted texts; we set the goals, reviewed every result, tested, deployed and decided. Name one thing **you** changed or caught. |
| Could you build it without AI? | Be honest: slower. But I can explain every part — e.g. how a request goes from the browser to the database — and I fixed/changed [example]. |
| What mistakes did the AI make? | Budget not enforced; broken turbine animation; crash on the host; missing comparison feature; untranslated 404 text. Tests and review caught them. |
| How are translations checked? | Automated test: same keys in all languages, none empty, placeholders match, none left in English. Native-speaker review: [say who reviewed RO / RU]. |
| How do you make sure facts are correct? | Based on UN / IEA / IRENA; statistics are labelled approximate and link to the sources. |
| Is it secure? | Server-side validation, parameterised SQL, rate limiting, CORS allow-list, body size limit, security headers, no accounts or tracking; tested with an SQL-injection attempt. |
| What about privacy? | No cookies or analytics; only what users submit is stored; preferences stay in their browser. |
| Is it accessible? | Skip link, labelled forms, keyboard use, ARIA progress bars and live regions, reduced-motion, translated page titles and `lang`. |
| Why SQLite? | Zero setup, easy to understand, enough for this scale. Limitation: free hosting isn't persistent — upgrade path is Turso/Postgres by changing one file. |
| Why does it sometimes load slowly? | The free server sleeps after 15 min; the first request wakes it (~50 s). |
| What would you improve? | Permanent database, teacher mode, more levels using national energy data, user accounts for progress. |
| How can others run it? | `README.md`: clone, `npm install`, `npm run dev` in `server/` and `client/` — no database setup needed. |

## 5. Delivery tips (criterion 06)

- Open with the question, not with "Hello, our project is…".
- One idea per sentence; pause after numbers.
- Show, don't tell: spend ≥ 40 % of the time on the live demo.
- Share the talk if you are more than one person: decide who does *hook + idea*, who *demo*, who
  *how it works + AI*, and rehearse the hand-overs.
- Time yourself: 7:00 means 6:30 in rehearsal (nerves slow you down).
- If something fails, say "that's the free server waking up" and switch to the backup recording.
