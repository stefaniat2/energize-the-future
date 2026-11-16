# Economic case study — assumptions, sources, certainty

Checked on **12 and 16 November 2026**. On 12 November the figures were found by web search summaries. On
**16 November the operator's own page and a Moldpres article were read in full**, and the model was updated to the
official Premier Energy prices. Levels follow [FACT_CHECK.md](../FACT_CHECK.md):
**A** read at the source · **B** found through search, quoted in the result · **C** assumption or general knowledge.

## What is modelled

A reference household that can move **1,381 kWh a year** of electricity to another hour (washing 208 × 1.0 kWh,
dishwashing 260 × 1.0 kWh, water heating 365 × 2.5 kWh). The scheduler of the website chooses start hours under a
two-zone tariff and a fuse limit. The yearly cost of the habitual schedule is approximated at the **day price**
(the habit mostly runs in the day zone). Code: `client/src/utils/economics.js` (unit-tested); the numbers are on the
[Research page](https://energize-the-future.vercel.app/research).

## Inputs and sources

| Input | Value used | Source / reasoning | Level |
|---|---|---|---|
| **Premier Energy two-zone price, low-voltage households** | day 07:00–23:00: **3.75** lei/kWh (375 bani); night 23:00–07:00: **2.94** lei/kWh (294 bani); in force since **2 April 2026** | Operator's own page, [premierenergy.md — Informații privind prețurile diferențiate](https://premierenergy.md/informatii-privind-preturile-diferentiate/), read on 16 Nov 2026. VAT basis **not stated** on the page; the linked ANRE decision PDF was **not** read | **A** (for the page) |
| Premier Energy universal (flat) price | **3.56** lei/kWh | Same page; matches [Moldpres, 31 March 2026](https://www.moldpres.md/rom/economie/anre-a-ieftinit-energia-electrica-pentru-consumatorii-premier-energy-si-fee-nord-noile-tarife-in-vigoare-din-aprilie) (“3 lei și 56 de bani”) | **A** |
| FEE Nord (north) | flat 3.95 lei/kWh from April 2026 (Moldpres). Its **two-zone** prices were not found for 2026; the model keeps a **2025** media report (day 4.89, night 3.90) only as a comparison scenario | Moldpres article read; two-zone figure from 2025 search summaries | flat **A**, two-zone **C** |
| Earlier Premier Energy reports | 4.32 / 3.31 (Jan 2025 launch) and a day price of 3.89 (Aug 2025) | Search summaries of 2025 media; **superseded** by the official 2026 prices, kept as comparison scenarios | **C** |
| The two-zone tariff is optional | “a right, not an obligation”; no day-only or night-only choice; **12-month commitment** after signing | Premier Energy page | **A** |
| Meter needed | a meter that records hourly use; an eligible existing meter can be reprogrammed by the operator (you pay for unsealing and sealing), otherwise you buy, install and maintain a new one | Premier Energy page. Meter price **not found** | **A** (rule), cost unknown |
| EUR/MDL | **20.18** (official rate 20.1773) | National Bank of Moldova, 5 November 2026 (search result) | **B** |
| Commercial energy manager | **658 €** incl. VAT | One retailer listing (SMA Home Manager HM-20, aio.lv), valid until July 2026; made for solar + battery systems, so the comparison flatters it | **B** (single source) |
| Installed home-energy-management system | **about 1,000 €** + 120–240 €/year (180 € used) | Summary of a paid market report; methodology unknown | **C** |
| Smart plug | **about 15 €** each | **Assumption**; only US prices found (20 USD plug, 45–50 USD strips) | **C** |
| Appliance energy per use and uses per year | see above | **Assumptions**, not measured | **C** |
| Fuse limits | 16 A × 230 V = 3.68 kW; 25 A × 230 V = 5.75 kW | Arithmetic | **A** |
| Night discount | 1 − 2.94 / 3.75 = **21.6 %** | Arithmetic from the official prices | **A** |

## Results

Savings of the **optimal** schedule against the habitual one over 200 random households with a 5.5 kW fuse
(`benchmark.json → tariffScenarios`). Euro amounts use 20.18 lei/EUR.

| Tariff scenario (day / night, lei/kWh) | Night/day | Saving | Lei / year | EUR / year |
|---|---|---|---|---|
| **Premier Energy, official, since 2 Apr 2026 (3.75 / 2.94)** | 0.784 | 10.5 % (CI 9.9–11.0) | **542** | **26.8** |
| Premier Energy as reported Jan 2025 (4.32 / 3.31), superseded | 0.766 | 11.4 % | 679 | 33.7 |
| FEE Nord 2025 report (4.89 / 3.90), may be outdated | 0.798 | 9.8 % | 659 | 32.6 |
| Premier Energy Aug 2025 report (3.89 / 3.31), superseded | 0.851 | 7.1 % | 379 | 18.8 |

For the **official tariff** the website shows (annealing solver, the one that runs in the browser):

| Case | Saving | Lei / year | EUR / year |
|---|---|---|---|
| Low: tight 4.0 kW fuse | 5.6 % | 291 | 14.4 |
| **Central: realistic 5.5 kW fuse** | **10.4 %** | **539** | **26.7** |
| Ceiling: everything moved to the cheap zone | 21.6 % | 1,118 | 55.4 |

The yearly cost of this load at the day price is about **5,177 lei**.

### What it costs to apply the schedule

| Option | Upfront | Per year | Pays back (central saving 26.7 €/year) |
|---|---|---|---|
| Delay-start timer already built into most washers and dishwashers; this tool is free and open source | 0 € | 0 € | immediately |
| 3 smart plugs (about 15 € each, assumption) | 45 € | 0 € | 1.7 years |
| Commercial energy manager (658 €, one retailer) | 658 € | 0 € | 24.6 years |
| Installed system (about 1,000 € + 180 €/year) | 1,000 € | 180 € | **never** (running cost exceeds the saving) |

Not included: the cost of a meter that records hourly use if the household does not already have one.

## Honest reading

1. The saving is **modest — about 27 euros a year for the reference household**. It is real, free with built-in
   timers, and **not a reason to buy an expensive system**.
2. It depends strongly on the tariff: between about 19 and 34 EUR across the four scenarios. The official 2026
   price narrowed the day/night gap compared with the 2025 reports, so the saving **fell** when the model was updated.
3. **No CO₂ saving is claimed.** Moving use to the night changes the price, not the amount of energy.
4. The meter, the 12-month commitment and the unstated VAT basis are real conditions a household must check.
5. The households are synthetic; no Moldovan meter data was used.
6. **School or community:** no school meter data was available, so no school figure is given. For a group of similar
   households multiply the saving by their number.

## How to update the numbers

Change the tariff in `client/scripts/benchmark.mjs` (`TARIFFS` and `SCENARIOS`), then:

```bash
cd client && npm run benchmark && node scripts/build-research-docs.mjs
```

The Research page, the abstract, the annex and the poster all read the same `benchmark.json`.
