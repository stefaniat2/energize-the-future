# Research folder — MoldSEF-style deliverables

Everything here is generated from, or explains, one reproducible experiment: `client/scripts/benchmark.mjs`.

| File | What it is |
|---|---|
| [`abstract.pdf`](abstract.pdf) / `abstract.html` | **2-page abstract**, Times New Roman 12 pt, under 1 MB |
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
node scripts/build-research-docs.mjs       # rebuilds abstract, annex and poster HTML + figures
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

## What the author still has to do (cannot be done by the AI)

- [x] Author name, school and mentor are filled in (Stefania Tabarcea · Orizont, Durlești · mentor Azamat Jauysh).
- [ ] **Copy the abstract and the logbook into the organisers' official Template A / Template B.** The layouts here
      follow the stated rules (2 pages, Times New Roman 12 pt, files under 1 MB) but are not the official files.
- [x] Solo entry: the author reports that the teacher confirmed it is allowed.
- [x] Weekly entries: the author reports that the teacher said they are not required.
- [x] Tariff checked at Premier Energy's official page on 16 Nov 2026 and the benchmark re-run (`ECONOMICS.md`).
- [ ] Print the A0 poster at a print shop and check the QR code from 1.5 m with two phones.
- [x] Romanian and Russian text of the new pages: the author reports it reads well (no corrections to log).
