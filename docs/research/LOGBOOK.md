# Laboratory logbook — *Energize the Future*

Author: stefaniat2 (solo project) · Tool used for coding and drafting: Claude Code (the only AI tool).

**How to read this log (honesty note).**
- No logbook was kept before **11 November 2026**. The entries for 1 October and 21 October are **reconstructed from the
  git history** (dates are commit dates; run `git log --date=short`), not written at the time.
- From 11 November the entries are contemporaneous and every number comes from a file in this repository.
- The competition's *Template B* was not available when this was written. The entries use a plain format
  (goal → what was done → result with numbers → failure and lesson). **Copy them into the official template**, and
  **add a real entry every week**; do not back-fill experiments that were not run.

---

## Week of 28 Sep – 4 Oct 2026 *(reconstructed from git)*

**Goal:** a working multilingual SDG 7 website, published for free.
**Done:** React + Express + SQLite application, 10 routes, game, calculator, 3 languages (4 commits on 1 Oct).
**Failures and fixes (found on the live site, not locally):**

| Failure | Cause | Fix |
|---|---|---|
| Vercel showed 404 on any page other than `/` | single-page app needs a rewrite rule | `client/vercel.json` |
| Render crashed at start | native SQLite module built for a different Node version | pinned Node 20 (later replaced by a pure libSQL client) |
| Browser blocked every API call | CORS did not allow the Vercel origin | origin allow-list function |

## Week of 19 – 25 Oct 2026 *(reconstructed from git: 12 commits on 21 Oct)*

**Goal:** raise quality against the competition rubric.
**Done and measured:**

| Measure | Before | After |
|---|---|---|
| Automated tests | 0 | 29 (16 server + 13 client) |
| Lighthouse accessibility | 89–92 | 100 on the 10 pages measured |
| Lighthouse best practices / SEO | — | 100 / 100 |
| Lighthouse performance (mobile, throttled) | — | 95–98 |
| Layout shift on data pages | 0.70 | below 0.1 |
| Facts compared with sources | 0 | 5 corrections (e.g. LED “up to 90%” → “at least 75%”) |

**Failures found by measurement:** a blanket colour change made footer text *less* readable (contrast 3.75 : 1,
found by Lighthouse); the first live site called `localhost` because the API address was not applied at build
time (found by opening the live site). Details: [AI_USAGE.md](../../AI_USAGE.md).

---

## 11 November 2026 — research module (new)

**Trigger:** written evaluation of the project (6.2 / 10). Main points: no testable hypothesis; the calculator maths
is too simple for a grade-12 engineering project; no benchmark with at least 100 runs; no economic case study;
missing 2-page abstract, 1-page visual annex and this logbook; poster was A3, A0 required.
**Plan:** add a real optimisation problem with measurable results, write the hypotheses *first*.

### Experiment E1 — prototype and sanity run (20 random households)

- Built the model (24 hourly prices, appliances with power / duration / window, fuse limit) and four methods.
- **Result:** exact branch-and-bound solved every household in under 1 ms; mean gap to the optimum greedy 0.58 %,
  annealing 0.08 %, genetic 0.74 % (random starts).
- **Failure:** the “habit” baseline broke the fuse limit in **19 of 20** households, so comparing its cost with
  feasible schedules was unfair. **Fix:** the baseline now waits hour by hour until the fuse allows (what a person
  would do); the raw overload is still reported (97 % of households in regime A, 100 % in B).

### Experiment E2 — does exact search scale? (5–6 households per size, two probes)

- **Probe 1, loose fuse (5.5 kW per 6 appliances):** exact search proved the optimum for every size tested, up to
  24 appliances, in at most about 400 ms. Greedy was already within about 1 % of the optimum.
- **Probe 2, tight fuse (3.0–3.2 kW per 6 appliances):** exact search hit the 2-million-node limit in 2 of 6 households
  with 10 appliances and in most with 16 or more; at 24 and 40 appliances it returned *worse* schedules than annealing
  (for example 438 vs 422 lei on one 24-appliance household).
- **Lesson:** at household size with a loose fuse metaheuristics are not needed — an honest finding that became
  hypothesis **H4** and the scalability experiment. To make the problem hard enough to compare methods, a **tight
  4.0 kW regime (B)** was added next to the realistic 5.5 kW regime (A).

### Experiment E3 — full benchmark, version 1 (random starting schedules)

- 200 households (regime A, 5.5 kW) and 193 (regime B, 4.0 kW; 7 had no feasible schedule and were excluded).
- Mean gap to the optimum, regime B: greedy 1.25 %, annealing 0.83 %, genetic 1.02 %; schedules respecting the fuse:
  94.3 %, 95.9 %, 95.9 %. Saved copy: `benchmark-v1-random-start.json`.
- **Failure 1 (in my own analysis):** infeasible schedules were counted in the cost gaps, which can flatter a method.
  **Fix:** gaps and savings now use only schedules that respect the fuse; the feasibility rate is reported separately.
- **Failure 2 (experiment bug):** the stability test used a 4.0 kW fuse for a 10-appliance household, which is almost
  infeasible. **Fix:** fuse scaled with the number of appliances. On the corrected hard household, **43 / 100**
  annealing runs and **38 / 100** genetic runs found no schedule within the fuse.

### Experiment E4 — design change: start from the greedy schedule

- **Hypothesis for the change:** random starts rarely reach the feasible region on tight fuses; starting from the
  greedy schedule should help.
- **Result (regime B):** annealing gap 0.83 % → **0.41 %**, feasibility 95.9 % → **98.4 %**; genetic gap 1.02 % →
  **0.91 %**; failed runs on the hard household: annealing 43 → **25**, genetic 38 → **2**.
- **Lesson and caveat:** a clear improvement, but the searches can no longer end worse than greedy, so part of their
  advantage over greedy is built in. The fair comparison is against the proven optimum (neither method reaches it on
  every household). Annealing still fails on 25 % of runs on the hardest case — kept as a stated limitation.

### Experiment E5 — final run, tests, audit

- **12 November:** benchmark (adds the three reported tariff scenarios), 34 client + 16 server = **50 tests**
  pass; Lighthouse on the new pages: Scheduler 95 / 100 / 100 / 100, Research 98 / 100 / 100 / 100 (performance /
  accessibility / best practices / SEO; home re-measured 97 / 100 / 100 / 100).
- Documents generated from the data file: abstract (2 pages), visual annex (1 page), A0 poster.

### Experiment E6 — 16 November 2026: checking the tariff at the source

- **Why:** the economic case used 2025 media figures (4.32 / 3.31 lei/kWh) whose sources conflicted.
- **What was done:** read Premier Energy's own page on differentiated prices and a Moldpres article in full.
  **Finding:** since 2 April 2026 the official prices are **3.75 (day) / 2.94 (night) lei/kWh**, flat price 3.56; the
  tariff is optional, needs a meter that records hourly use, and binds the household for 12 months.
- **Result of re-running everything with the official prices:** saving of annealing 11.3 % → **10.4 %** (5.5 kW fuse)
  and 6.2 % → **5.6 %** (4.0 kW fuse); gap in regime B 0.41 % (unchanged); all four hypotheses still supported; yearly
  saving of the reference household **33 € → 27 €** (675 → 539 lei); smart-plug payback 1.3 → 1.7 years.
- **Lesson:** the *conclusions* were robust to the tariff but the *money figures* were not — the 2025 reports
  overstated the night discount (23 % → 22 %) and the day price. The page, the documents and the pitch were updated.
  The table below was measured under the 2025 tariff; under the official tariff the v2 row is gap 0.41 %, feasibility
  97.9 %, hard-case failed runs 28 (annealing) / 4 (genetic) of 100.

### Quantitative progress (regime B, 4.0 kW fuse; measured on 11 Nov with the 2025 tariff)

| Version | Annealing gap | Annealing feasible | Genetic gap | Hard-case failed runs (SA / GA) |
|---|---|---|---|---|
| v1 random start | 0.83 % | 95.9 % | 1.02 % | 43 / 38 of 100 |
| v2 greedy start | 0.41 % | 98.4 % | 0.91 % | 25 / 2 of 100 |

---

## Entries still to be written by the author

The author reports that the teacher has confirmed that weekly entries are not required. Optional experiments that would strengthen the work:

- [ ] Compare the schedule with a **real week of smart-meter data** from a household or the school (needs consent and
      the utility's data export).
- [x] Check the tariff at the source — done on 16 Nov 2026 (E6). A real electricity bill would still confirm the VAT basis.
- [ ] Test the Scheduler page on a real phone and on the stand laptop and note what confuses visitors.
- [ ] Ask a Romanian and a Russian speaker to proofread the new pages and record their corrections here.

| Date | Experiment | Result (numbers) | Failure / lesson | Next |
|---|---|---|---|---|
| | | | | |
