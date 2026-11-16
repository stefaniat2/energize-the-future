# Research folder — MoldSEF-style deliverables

Everything here is generated from, or explains, one reproducible experiment: `client/scripts/benchmark.mjs`.

| File | What it is |
|---|---|
| [`abstract.pdf`](abstract.pdf) / `abstract.html` | **2-page abstract** (English) in the official Annex 2 structure, Times New Roman 12 pt, under 1 MB |
| [`abstract-ro.pdf`](abstract-ro.pdf) / `abstract-ro.html` | The same abstract in **Romanian** (the contest runs in Romanian and English) |
| [`full-paper.pdf`](full-paper.pdf) / `full-paper.html` | **Full text of the work** (7 pages): problem, methods, experiments, results, errors found, economics, limits |
| [`research-plan.pdf`](research-plan.pdf) / `research-plan.html` | **1-page research plan** (question, hypotheses, methods, timetable, risks) |
| [`visual-annex.pdf`](visual-annex.pdf) / `visual-annex.html` | **1-page visual annex** (4 figures, results table, pipeline), under 1 MB |
| [`LOGBOOK.md`](LOGBOOK.md) | Dated laboratory logbook: experiments, failures, quantitative progress |
| [`ECONOMICS.md`](ECONOMICS.md) | Economic case study: every assumption, source and certainty level |
| [`../stand/poster-A0.pdf`](../stand/poster-A0.pdf) | **A0 portrait poster** (841 × 1189 mm), vector, with QR code |
| `benchmark-instances.csv` | One row per random household: cost of every method and timings |
| `benchmark-v1-random-start.json` | Results of the first version (random starting schedules), kept for the logbook |
| `figures/*.svg` | The four figures as stand-alone vector files |

## Reproduce everything

```bash
cd client
npm install
npm run benchmark                          # ~3-4 min; writes src/data/benchmark.json and the CSV
node scripts/build-research-docs.mjs       # rebuilds abstracts (EN/RO), full paper, plan, annex and poster HTML + figures
```

Then print the three HTML files to PDF (Chrome → Print → *Save as PDF*, background graphics **on**, margins **none**;
paper A4 for the abstract and the annex, custom 841 × 1189 mm for the poster), or from the terminal:

```bash
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless=new --no-pdf-header-footer --print-to-pdf=docs/research/abstract.pdf    file://$PWD/docs/research/abstract.html
"$CH" --headless=new --no-pdf-header-footer --print-to-pdf=docs/research/visual-annex.pdf file://$PWD/docs/research/visual-annex.html
"$CH" --headless=new --no-pdf-header-footer --virtual-time-budget=15000 --print-to-pdf=docs/stand/poster-A0.pdf file://$PWD/docs/stand/poster-A0.html
```

Results are seeded, so the numbers are identical on every run; only the millisecond timings change.

## What the official rules say (read 16 Nov 2026)

Source: *Regulamentul Concursului Național „Mold SEF”*, Ministry of Education order no. 74 of 13 Feb 2014 (the file
published on mecc.gov.md), plus the 2025 announcement for MoldSEF 2026 (13–16 Feb 2026), which refers to the 2021
regulation (order no. 1697/2021). **The 2021 text was not read**; confirm it still matches.

- **Abstract (Annex 2):** at most 2 A4 pages, Times New Roman 12, at most 1 MB; images and photos are attached
  separately (extra material at most 1 MB). It must state the **thematic category**, the **project title**, the
  **author(s)**, the **grade (clasa)**, and a text covering: aim of the research; relevance and possible use (scientific and
  practical value); methods; analysis of the data obtained; literature used. → `abstract.pdf` follows this.
- **Stand (Annex 3):** an **A0 poster or two A1 sheets placed horizontally one under the other**. Bring: the abstract,
  the **full text of the work**, the **research plan**, the **lab logbook (only if needed)** and other illustrative
  material. Authors must stand beside their stand.
- **Individual projects are allowed** ("inițiativele individuale sunt încurajate"); teams have at most 2 members.
- **Language:** the contest is held in **Romanian and English** (Russian is not listed).
- **Jury:** an individual discussion of **at most 10 minutes** with the author. Score out of 100: applicability and
  economic benefit 30 · creative approach 20 · scientific approach 20 · complexity and rigour 10 · novelty of the topic 10 ·
  clarity of the presentation (visual and oral) 10.
- **Categories:** I Sciences · II Applied sciences (incl. energy, electronics, economy) · III Information technology
  (incl. algorithms, software). The abstract uses **III**; **II (Energetică și termotehnică)** would also fit — choose with
  your teacher.

**Prepared for the stand:** the abstract (EN and RO), the *full text of the work* (`full-paper.pdf`), the *research plan*
(`research-plan.pdf`), the logbook (`LOGBOOK.md`, "if needed") and the A0 poster. Print them and keep them on the table.

## What the author still has to do (cannot be done by the AI)

- [x] Author name, school and mentor are filled in (Stefania Tabarcea · Orizont, Durlești · mentor Azamat Jauysh).
- [x] **Templates:** no downloadable "Template A / B" exists in the public rules. The MoldSEF regulation (Annex 2) only fixes the content and format of the abstract, and the abstract here follows it (see below). The logbook is "if needed" and has no template.
- [ ] **Add your grade (clasa)** where the abstract shows `[grade]` — the regulation requires it. Then re-run `node scripts/build-research-docs.mjs` (or ask for it) and re-export the PDF.
- [ ] Check with the organisers/teacher that the **2026 edition** (rules of MEC order no. 1697/2021) still matches the 2014 text read here.
- [x] Solo entry: the author reports that the teacher confirmed it is allowed.
- [x] Weekly entries: the author reports that the teacher said they are not required.
- [x] Tariff checked at Premier Energy's official page on 16 Nov 2026 and the benchmark re-run (`ECONOMICS.md`).
- [ ] Print the A0 poster at a print shop and check the QR code from 1.5 m with two phones.
- [x] Romanian and Russian text of the new pages: the author reports it reads well (no corrections to log).
