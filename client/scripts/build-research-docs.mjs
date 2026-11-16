// Builds the printable research documents from client/src/data/benchmark.json, so that the abstract, the visual
// annex and the A0 poster always show exactly the numbers the benchmark produced.
//   node scripts/build-research-docs.mjs        (then print the HTML files to PDF, see docs/research/README.md)
// Output: docs/research/{abstract,visual-annex}.html, docs/stand/poster-A0.html, docs/research/figures/*.svg

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { REFERENCE_HOUSEHOLD, OPTIONS, EUR_MDL, annualShiftableKwh, economicCase, paybackYears } from "../src/utils/economics.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const b = JSON.parse(readFileSync(resolve(here, "../src/data/benchmark.json"), "utf8"));
const figDir = resolve(root, "docs/research/figures");
mkdirSync(figDir, { recursive: true });

const fmt = (n, d = 1) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const P = (p) => (p < 0.001 ? "p < 0.001" : `p = ${fmt(p, 3)}`);
const COLORS = { greedy: "#475569", anneal: "#237a36", genetic: "#1971C2", exact: "#8a6d00", habit: "#c92a2a" };
const NAMES = { preferred: "Habit", greedy: "Greedy", anneal: "Simulated annealing", genetic: "Genetic algorithm", exact: "Exact (B&B)" };

// ------------------------------------------------------------------ SVG helpers (plain strings)
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
function lineChart({ w = 560, h = 300, series, xs, xLabels, xTitle, yTitle, logY = false, font = "Times New Roman, serif", fs = 13, legendStep = 200 }) {
  const m = { l: 58 + (fs > 15 ? 8 : 0), r: Math.round(fs * 2.2), t: 30 + (fs > 15 ? 8 : 0), b: 50 };
  const all = series.flatMap((s) => s.values).filter((v) => v > 0);
  const yMin = logY ? 10 ** Math.floor(Math.log10(Math.min(...all))) : 0;
  const yMax = logY ? 10 ** Math.ceil(Math.log10(Math.max(...all))) : Math.max(...all) * 1.1;
  const sx = (i) => m.l + (i / (xs.length - 1)) * (w - m.l - m.r);
  const sy = (v) => {
    const t = logY ? (Math.log10(Math.max(v, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin)) : (v - yMin) / (yMax - yMin);
    return h - m.b - t * (h - m.t - m.b);
  };
  const ticks = logY ? [yMin, yMin * 10, yMin * 100, yMax].filter((v, i, a) => v <= yMax && a.indexOf(v) === i) : [0, yMax / 2, yMax];
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="font-family:${font};font-size:${fs}px" role="img">`;
  ticks.forEach((t) => (out += `<line x1="${m.l}" x2="${w - m.r}" y1="${sy(t)}" y2="${sy(t)}" stroke="#d6dde6"/><text x="${m.l - 6}" y="${sy(t) + 4}" text-anchor="end" fill="#334155">${logY ? t : fmt(t, 0)}</text>`));
  xs.forEach((x, i) => (out += `<text x="${sx(i)}" y="${h - m.b + 18}" text-anchor="middle" fill="#334155">${esc(xLabels ? xLabels[i] : x)}</text>`));
  out += `<text x="${(m.l + w - m.r) / 2}" y="${h - 8}" text-anchor="middle" fill="#334155">${esc(xTitle)}</text>`;
  out += `<text transform="translate(14 ${h / 2}) rotate(-90)" text-anchor="middle" fill="#334155">${esc(yTitle)}</text>`;
  series.forEach((s) => {
    if (s.flat) out += `<line x1="${sx(0)}" x2="${sx(xs.length - 1)}" y1="${sy(s.values[0])}" y2="${sy(s.values[0])}" stroke="${s.color}" stroke-width="2.2" stroke-dasharray="7 5"/>`;
    else {
      out += `<polyline fill="none" stroke="${s.color}" stroke-width="2.6" points="${s.values.map((v, i) => `${sx(i)},${sy(v)}`).join(" ")}"/>`;
      s.values.forEach((v, i) => (out += `<circle cx="${sx(i)}" cy="${sy(v)}" r="3.4" fill="${s.color}"/>`));
    }
  });
  series.forEach((s, i) => (out += `<g transform="translate(${m.l + 8 + i * legendStep} 12)"><rect width="16" height="4" y="3" fill="${s.color}"/><text x="21" y="9" fill="#0f172a">${esc(s.name)}</text></g>`));
  return out + "</svg>";
}

function barChart({ w = 560, bars, max, font = "Times New Roman, serif", fs = 13, left = 150, rowH = 28 }) {
  const h = bars.length * rowH + 8;
  const sx = (v) => left + (v / max) * (w - left - fs * 11.5);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="font-family:${font};font-size:${fs}px" role="img">`;
  bars.forEach((bar, i) => {
    const y = 4 + i * rowH;
    out += `<text x="${left - 8}" y="${y + 17}" text-anchor="end" fill="#0f172a">${esc(bar.label)}</text><rect x="${left}" y="${y + 4}" width="${Math.max(sx(bar.value) - left, 1)}" height="${rowH - 10}" rx="3" fill="${bar.color}"/>`;
    if (bar.ci) out += `<g stroke="#0f172a" stroke-width="1.4"><line x1="${sx(bar.ci[0])}" x2="${sx(bar.ci[1])}" y1="${y + rowH / 2 - 1}" y2="${y + rowH / 2 - 1}"/><line x1="${sx(bar.ci[0])}" x2="${sx(bar.ci[0])}" y1="${y + 7}" y2="${y + rowH - 9}"/><line x1="${sx(bar.ci[1])}" x2="${sx(bar.ci[1])}" y1="${y + 7}" y2="${y + rowH - 9}"/></g>`;
    out += `<text x="${sx(bar.ci ? bar.ci[1] : bar.value) + 7}" y="${y + 17}" fill="#0f172a" font-weight="bold">${esc(bar.text)}</text>`;
  });
  return out + "</svg>";
}

function groupedBars({ w = 560, h = 280, groups, series, yTitle, font = "Times New Roman, serif", fs = 13, legendStep = 130 }) {
  const m = { l: 54, r: 12, t: 30, b: 40 };
  const yMax = Math.ceil(Math.max(...groups.flatMap((g) => g.values)) * 1.15 * 2) / 2;
  const sy = (v) => h - m.b - (v / yMax) * (h - m.t - m.b);
  const gw = (w - m.l - m.r) / groups.length;
  const bw = (gw - 16) / series.length;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="font-family:${font};font-size:${fs}px" role="img">`;
  [0, yMax / 2, yMax].forEach((t) => (out += `<line x1="${m.l}" x2="${w - m.r}" y1="${sy(t)}" y2="${sy(t)}" stroke="#d6dde6"/><text x="${m.l - 6}" y="${sy(t) + 4}" text-anchor="end" fill="#334155">${fmt(t, 1)}</text>`));
  groups.forEach((g, gi) => {
    g.values.forEach((v, si) => {
      const x = m.l + gi * gw + 8 + si * bw;
      out += `<rect x="${x}" y="${sy(v)}" width="${bw - 3}" height="${h - m.b - sy(v)}" fill="${series[si].color}"/><text x="${x + (bw - 3) / 2}" y="${sy(v) - 4}" text-anchor="middle" fill="#0f172a" font-size="${fs - 2}">${fmt(v, 2)}</text>`;
    });
    out += `<text x="${m.l + gi * gw + gw / 2}" y="${h - m.b + 17}" text-anchor="middle" fill="#334155">${esc(g.label)}</text>`;
  });
  out += `<text transform="translate(14 ${h / 2}) rotate(-90)" text-anchor="middle" fill="#334155">${esc(yTitle)}</text>`;
  series.forEach((s, i) => (out += `<g transform="translate(${m.l + 8 + i * legendStep} 10)"><rect width="14" height="10" fill="${s.color}"/><text x="19" y="9" fill="#0f172a">${esc(s.name)}</text></g>`));
  return out + "</svg>";
}

// ------------------------------------------------------------------ numbers
const A = b.regimes.realistic;
const B = b.regimes.constrained;
const conv = b.convergence;
const lastScale = b.scalability.at(-1);
const premier = b.sensitivity.find((s) => s.ratio === 0.784);
const kwh = annualShiftableKwh();
const { day, night } = b.settings.tariff;
const econ = {
  low: economicCase({ annualKwh: kwh, dayPrice: day, nightPrice: night, savingPct: B.methods.anneal.meanSavingPct }),
  central: economicCase({ annualKwh: kwh, dayPrice: day, nightPrice: night, savingPct: A.methods.anneal.meanSavingPct }),
  high: economicCase({ annualKwh: kwh, dayPrice: day, nightPrice: night, savingPct: 100 * (1 - night / day) }),
};
const v1 = JSON.parse(readFileSync(resolve(root, "docs/research/benchmark-v1-random-start.json"), "utf8"));
const v1B = v1.regimes.constrained;

// ------------------------------------------------------------------ figures
function figures(font, fs, w = 560, h = 290, rowH = 28) {
  const f = { font, fs };
  return {
    convergence: lineChart({ ...f, w, h, xs: conv.checkpoints, series: [
      { name: "Annealing", color: COLORS.anneal, values: conv.anneal },
      { name: "Genetic", color: COLORS.genetic, values: conv.genetic },
      { name: "Greedy (fixed)", color: COLORS.greedy, values: [conv.greedy], flat: true },
    ], xTitle: "Fitness evaluations used", yTitle: "Gap (%, log scale)", logY: true, legendStep: fs * 8.5 }),
    sensitivity: barChart({ ...f, w, rowH, left: fs * 10, bars: b.sensitivity.filter((s) => s.ratio < 1).map((s) => ({
      label: `night/day = ${fmt(s.ratio, 3)}`, value: s.meanSavingPct, ci: s.ci95, color: s.ratio === 0.784 ? COLORS.anneal : COLORS.genetic,
      text: `${fmt(s.meanSavingPct)}% (ceiling ${fmt(s.upperBoundPct, 0)}%)`,
    })), max: 36 }),
    scalability: lineChart({ ...f, w, h, xs: b.scalability.map((s) => s.appliances), series: ["greedy", "anneal", "genetic", "exact"].map((m) => ({
      name: m === "anneal" ? "Annealing" : m === "genetic" ? "Genetic" : m === "exact" ? "Exact (B&B)" : "Greedy", color: COLORS[m], values: b.scalability.map((s) => Math.max(s.methods[m].meanGapToBestPct, 0.001)),
    })), xTitle: "Number of appliances", yTitle: "Gap (%, log scale)", logY: true, legendStep: fs * 8.5 }),
    regimes: groupedBars({ ...f, w, h, groups: [{ label: "Regime A (5.5 kW fuse)", values: ["greedy", "anneal", "genetic"].map((m) => A.methods[m].meanGapPct) }, { label: "Regime B (4.0 kW fuse)", values: ["greedy", "anneal", "genetic"].map((m) => B.methods[m].meanGapPct) }],
      series: [{ name: "Greedy", color: COLORS.greedy }, { name: "Annealing", color: COLORS.anneal }, { name: "Genetic", color: COLORS.genetic }], yTitle: "Mean gap (%)", legendStep: fs * 9 }),
  };
}
const figSerif = figures("Times New Roman, serif", 13);
for (const [name, svg] of Object.entries(figSerif)) writeFileSync(resolve(figDir, `${name}.svg`), svg + "\n");

// ------------------------------------------------------------------ shared pieces
const SITE = "https://energize-the-future.vercel.app";
const REPO = "github.com/stefaniat2/energize-the-future";
const qrSvg = (readFileSync(resolve(root, "docs/stand/poster.html"), "utf8").match(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 31 31"[\s\S]*?<\/svg>/) || [""])[0];
const when = b.generatedOn;

const resultsTable = `
<table class="t">
<tr><th>Method</th><th>Saving vs habit A</th><th>Gap A</th><th>Saving vs habit B</th><th>Gap B</th><th>Fuse OK B</th></tr>
${["greedy", "anneal", "genetic", "exact"].map((m) => `<tr><td>${NAMES[m]}</td><td>${fmt(A.methods[m].meanSavingPct)}%</td><td>${fmt(A.methods[m].meanGapPct, 2)}%</td><td>${fmt(B.methods[m].meanSavingPct)}%</td><td>${fmt(B.methods[m].meanGapPct, 2)}%</td><td>${fmt(B.methods[m].feasiblePct)}%</td></tr>`).join("")}
</table>`;

// ================================================================== 1. ABSTRACT (2 pages, Times New Roman 12 pt)
const abstract = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Abstract — Energize the Future</title>
<style>
@page { size: A4; margin: 15mm 18mm 15mm 18mm; }
* { box-sizing: border-box; }
body { font: 12pt/1.22 "Times New Roman", Times, serif; color: #000; margin: 0; text-align: justify; }
h1 { font-size: 14pt; text-align: center; margin: 0 0 3pt; line-height: 1.2; }
.meta { text-align: center; font-size: 11pt; margin-bottom: 6pt; }
h2 { font-size: 12pt; margin: 5pt 0 1pt; }
p { margin: 0 0 3pt; } ul { margin: 0 0 3pt; padding-left: 16pt; } li { margin-bottom: 0; }
table.t { border-collapse: collapse; width: 100%; font-size: 10.5pt; margin: 3pt 0 4pt; }
.t th, .t td { border: .5pt solid #000; padding: 1.5pt 4pt; text-align: center; } .t td:first-child { text-align: left; }
.small { font-size: 10.5pt; } .ref { font-size: 10.5pt; margin: 0 0 1.5pt; padding-left: 14pt; text-indent: -14pt; text-align: left; }
.ph { background: #fff3b0; }
</style></head><body>
<h1>Cost-optimal load shifting for Moldovan households under a two-zone electricity tariff: a benchmark of greedy, simulated-annealing, genetic and exact schedulers</h1>
<div class="meta"><b>Thematic category:</b> III. Information technology (algorithms, software applications) · <b>Author:</b> Stefania Tabarcea · <b>Grade:</b> <span class="ph">[grade]</span><br>Orizont, Durlești · mentor: Azamat Jauysh<br>Project “Energize the Future” (UN SDG 7) · ${SITE} · ${REPO}</div>

<h2>1. Aim and relevance of the research</h2>
<p>Moldovan households can opt for a two-zone tariff in which night electricity (23:00–07:00) is cheaper than day electricity; Premier Energy’s official page gives ${fmt(day, 2)} and ${fmt(night, 2)} lei/kWh since 2 April 2026, a night discount of ${fmt(100 * (1 - night / day), 0)}%. A household can lower its bill by moving flexible appliances (washing machine, dishwasher, dryer, electric water heater, EV charger) to the cheap zone, but the main fuse (about 3.7 kW for 16 A, 5.75 kW for 25 A) limits the total power at any hour. “Use the washer at night” therefore becomes a constrained scheduling problem: choose one start hour per appliance so that the daily cost is minimal and the fuse limit is never exceeded. For six unrestricted appliances there are 24<sup>6</sup> ≈ 1.9·10<sup>8</sup> combinations.</p>

<h2>2. Hypotheses (written before the first full benchmark run)</h2>
<ul>
<li><b>H1.</b> An optimised schedule costs less than the habitual one (paired difference, p &lt; 0.05).</li>
<li><b>H2.</b> With an equal budget of ${b.settings.budget} evaluations, simulated annealing and a genetic algorithm end closer to the optimum than greedy placement when the fuse limit is tight.</li>
<li><b>H3.</b> The saving is bounded by (1 − night/day price) of the shiftable cost and grows roughly in line with the price gap.</li>
<li><b>H4.</b> Exact branch-and-bound stops being usable as the number of appliances grows, while the metaheuristics keep returning feasible schedules in milliseconds.</li>
</ul>

<h2>3. Methods used</h2>
<p>Every appliance has a power, a duration, an allowed start window and a habitual start hour. All methods minimise the same fitness (daily cost plus a large penalty per kWh above the fuse limit): (a) <i>habit</i> (reference: habitual hours, delayed only as far as the fuse requires); (b) <i>greedy</i> placement, largest energy first; (c) <i>simulated annealing</i> (Kirkpatrick et al., 1983) with geometric cooling; (d) a <i>genetic algorithm</i> (population 40, tournament selection, uniform crossover, mutation, elitism); (e) <i>exact</i> branch-and-bound (Land and Doig, 1960), used as the reference optimum. Annealing and the genetic algorithm start from the greedy schedule. Experiments use seeded random households (5–7 appliances): ${A.instances} households in regime A (5.5 kW fuse) and ${B.instances} in regime B (4.0 kW fuse; ${B.excludedInfeasible} infeasible households excluded), plus ${b.settings.instancesPerScalabilityPoint} households for each size of 6, 10, 16, 24 and 40 appliances. Gaps are measured against the proven optimum and use only schedules that respect the fuse; intervals are 95% confidence intervals; methods are compared with paired tests on identical households. All code, seeds and data are public and the benchmark is reproducible with <i>npm run benchmark</i>.</p>

<h2>4. Analysis of the data obtained</h2>
${resultsTable}
<p class="small">Mean saving versus habit and mean gap to the proven optimum, ${A.instances} (A) and ${B.instances} (B) households.</p>
<p><b>H1 supported.</b> Annealing saves ${fmt(A.methods.anneal.meanSavingPct)}% (95% CI ${fmt(A.methods.anneal.savingCI95[0])}–${fmt(A.methods.anneal.savingCI95[1])}) in regime A and ${fmt(B.methods.anneal.meanSavingPct)}% in regime B versus habit (${P(Math.max(A.tests.anneal_vs_preferred.p, B.tests.anneal_vs_preferred.p))}, d<sub>z</sub> = ${fmt(A.tests.anneal_vs_preferred.dz, 1)} and ${fmt(B.tests.anneal_vs_preferred.dz, 1)}). Without waiting, the raw habitual start hours would exceed the fuse in ${fmt(A.habitFuseViolationPct, 0)}% (A) and ${fmt(B.habitFuseViolationPct, 0)}% (B) of households.</p>
<p><b>H2 supported, with a caveat.</b> In regime B the mean gap is ${fmt(B.methods.greedy.meanGapPct, 2)}% for greedy, ${fmt(B.methods.anneal.meanGapPct, 2)}% for annealing and ${fmt(B.methods.genetic.meanGapPct, 2)}% for the genetic algorithm (annealing vs greedy ${P(B.tests.anneal_vs_greedy.p)}; genetic vs greedy ${P(B.tests.genetic_vs_greedy.p)}). Because both searches start from the greedy schedule, part of this advantage is built in; the comparison with the exact optimum is the fair one, and neither method reaches it on every household (optimum found in ${B.methods.anneal.optimalCount}/${B.instances} and ${B.methods.genetic.optimalCount}/${B.instances} cases).</p>
<p><b>H3 supported.</b> At Premier Energy’s current ratio ${fmt(premier.ratio, 3)} the optimum saves ${fmt(premier.meanSavingPct)}% against a ceiling of ${fmt(premier.upperBoundPct)}%; across ratios 0.9 to 0.4 the saving rises from ${fmt(b.sensitivity[1].meanSavingPct)}% to ${fmt(b.sensitivity.at(-1).meanSavingPct)}% and never exceeds the ceiling, because only part of the load can move.</p>
<p><b>H4 supported.</b> Exact search finished its optimality proof for ${fmt(b.scalability[0].exactProvedPct, 0)}% of 6-appliance households but only ${fmt(lastScale.exactProvedPct, 0)}% of ${lastScale.appliances}-appliance households, where it ended ${fmt(lastScale.methods.exact.meanGapToBestPct, 2)}% above the best known schedule (the best of all methods, so it favours the method that finds it most often) against ${fmt(lastScale.methods.anneal.meanGapToBestPct, 2)}% for annealing (about ${fmt(lastScale.methods.anneal.meanMs, 0)} ms versus ${fmt(lastScale.methods.exact.meanMs, 0)} ms). At household size (6 appliances) exact search is already instant (${fmt(b.scalability[0].methods.exact.meanMs, 1)} ms), so metaheuristics matter only for larger systems such as apartment blocks or schools.</p>
<p><b>Design iteration.</b> The first version started the searches from random schedules: in regime B annealing respected the fuse in ${fmt(v1B.methods.anneal.feasiblePct)}% of households (gap ${fmt(v1B.methods.anneal.meanGapPct, 2)}%) and, on one hard 10-appliance household, ${v1.stability.anneal.infeasibleRuns} of 100 runs found no feasible schedule. Starting from the greedy schedule raised feasibility to ${fmt(B.methods.anneal.feasiblePct)}% and lowered the gap to ${fmt(B.methods.anneal.meanGapPct, 2)}%, but ${b.stability.anneal.infeasibleRuns} of 100 runs on the hard household still failed, so reliability on tight fuses remains a limitation.</p>

<h2>5. Practical and economic value</h2>
<p>A reference household moves ${fmt(kwh, 0)} kWh a year (washing 208×1.0 kWh, dishwashing 260×1.0 kWh, water heating 365×2.5 kWh). At this tariff its shiftable load costs about ${fmt(econ.central.habitCostMdl, 0)} lei a year at the day price. The schedule saves <b>${fmt(econ.central.savingMdl, 0)} lei (≈ ${fmt(econ.central.savingEur, 0)} EUR) a year</b>; ${fmt(econ.low.savingMdl, 0)} lei with a tight fuse and at most ${fmt(econ.high.savingMdl, 0)} lei if everything moved to night (rate ${fmt(EUR_MDL, 2)} lei/EUR, BNM, 5 Nov 2026). The software costs nothing and can be applied with delay-start timers already built into appliances (payback immediate); three smart plugs of about 15 EUR pay back in ${fmt(paybackYears(OPTIONS[1], econ.central.savingEur), 1)} years; a 658 EUR energy manager in ${fmt(paybackYears(OPTIONS[2], econ.central.savingEur), 0)} years; an installed system at about 1,000 EUR plus 120–240 EUR/year never, since its running cost exceeds the saving. Commercial prices are indicative (one retailer, one market report). No CO<sub>2</sub> saving is claimed: moving consumption in time changes its price, not its amount.</p>

<h2>6. Conclusions and limits</h2>
<p>Under the reported Moldovan two-zone tariff, load shifting is a modest but real, free saving (about ${fmt(econ.central.savingEur, 0)} EUR per household a year) that must respect the fuse limit. For household-sized problems an exact solver is sufficient; metaheuristics become necessary above roughly 16 appliances. Limits: synthetic households (no Moldovan meter data), tariff values that may change (VAT basis not stated), constant-power appliance blocks, timings measured on one laptop. Next step: validation on real smart-meter data.</p>

<h2>Literature used</h2>
<p class="ref">Kirkpatrick S., Gelatt C. D., Vecchi M. P. (1983). Optimization by simulated annealing. <i>Science</i> 220(4598), 671–680.</p>
<p class="ref">Land A. H., Doig A. G. (1960). An automatic method of solving discrete programming problems. <i>Econometrica</i> 28(3), 497–520.</p>
<p class="ref">Holland J. H. (1975). <i>Adaptation in Natural and Artificial Systems.</i> University of Michigan Press.</p>
<p class="ref">Premier Energy Moldova (2026). Information on differentiated prices, in force since 2 April 2026 (premierenergy.md); Moldpres (31 March 2026), ANRE tariffs for Premier Energy and FEE Nord. National Bank of Moldova, official EUR/MDL rate, 5 Nov 2026 (20.1773). Sources and certainty: docs/research/ECONOMICS.md.</p>
<p class="ref">AI use: Claude Code (Anthropic) was the only AI tool; it wrote code and drafts under the author’s direction and review (AI_USAGE.md). Data generated ${when}.</p>
</body></html>`;
writeFileSync(resolve(root, "docs/research/abstract.html"), abstract);

// ================================================================== 2. VISUAL ANNEX (1 page)
const fa = figures("Times New Roman, serif", 12, 520);
const annex = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Visual annex — Energize the Future</title>
<style>
@page { size: A4; margin: 12mm 14mm; }
* { box-sizing: border-box; } body { font: 10pt/1.25 "Times New Roman", Times, serif; margin: 0; color: #000; }
h1 { font-size: 13pt; margin: 0 0 2pt; text-align: center; } .sub { text-align: center; font-size: 9.5pt; margin-bottom: 6pt; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5pt 10pt; }
figure { margin: 0; border: .5pt solid #888; padding: 3pt 4pt; } figure svg { width: 100%; height: auto; display: block; }
figcaption { font-size: 8.8pt; line-height: 1.2; margin-top: 1pt; } figcaption b { font-size: 9pt; }
.flow { display: flex; align-items: stretch; gap: 3pt; margin: 6pt 0; font-size: 8.6pt; text-align: center; }
.flow div { flex: 1; border: .6pt solid #000; padding: 3pt; } .flow b { display: block; font-size: 9pt; } .arr { flex: none !important; border: 0 !important; padding: 8pt 0 0 !important; font-weight: bold; }
table.t { border-collapse: collapse; width: 100%; font-size: 8.8pt; margin: 4pt 0; } .t th, .t td { border: .5pt solid #000; padding: 1pt 3pt; text-align: center; } .t td:first-child { text-align: left; }
.note { font-size: 8.6pt; }
</style></head><body>
<h1>Visual annex — load shifting under a two-zone tariff</h1>
<div class="sub">“Energize the Future” (UN SDG 7) · Stefania Tabarcea · Orizont, Durlești · ${SITE} · ${REPO}</div>
<div class="flow">
<div><b>Input</b>Appliances, windows, habits, 24 hourly prices, fuse limit</div><div class="arr">→</div>
<div><b>Model</b>Cost = Σ power × price; overload penalty above the fuse</div><div class="arr">→</div>
<div><b>Solvers</b>Greedy · Annealing · Genetic · Exact (same ${b.settings.budget}-evaluation budget)</div><div class="arr">→</div>
<div><b>Evidence</b>${A.instances}+${B.instances} seeded households, paired tests, 95% CI</div><div class="arr">→</div>
<div><b>Result</b>Schedule, cost, saving, fuse check — in ms, in the browser</div>
</div>
<div class="grid">
<figure>${fa.convergence}<figcaption><b>Fig. 1.</b> Convergence (regime B). Both searches start from the greedy schedule (${fmt(conv.greedy, 2)}% gap) and reach ${fmt(conv.anneal.at(-1), 2)}% (annealing) and ${fmt(conv.genetic.at(-1), 2)}% (genetic) after ${b.settings.budget} evaluations.</figcaption></figure>
<figure>${fa.regimes}<figcaption><b>Fig. 2.</b> Mean gap to the proven optimum. Annealing is closest in both regimes; the gap grows when the fuse is tight (regime B).</figcaption></figure>
<figure>${fa.sensitivity}<figcaption><b>Fig. 3.</b> Saving of the optimal schedule versus the night/day price ratio (95% CI; ceiling = 1 − ratio). Current ratio ${fmt(premier.ratio, 3)} highlighted: ${fmt(premier.meanSavingPct)}%.</figcaption></figure>
<figure>${fa.scalability}<figcaption><b>Fig. 4.</b> Scalability. Exact search proved optimality for ${fmt(b.scalability[0].exactProvedPct, 0)}% of 6-appliance households but only ${fmt(lastScale.exactProvedPct, 0)}% of ${lastScale.appliances}-appliance ones (0.00% is drawn at 0.001).</figcaption></figure>
</div>
${resultsTable}
<div class="note"><b>Economics (reference household, ${fmt(kwh, 0)} kWh/year movable):</b> saving ${fmt(econ.central.savingMdl, 0)} lei ≈ ${fmt(econ.central.savingEur, 0)} EUR a year (range ${fmt(econ.low.savingMdl, 0)}–${fmt(econ.high.savingMdl, 0)} lei). Software 0 EUR; built-in timers pay back immediately; 3 smart plugs ${fmt(paybackYears(OPTIONS[1], econ.central.savingEur), 1)} years; installed energy-management system never. Tariff ${fmt(day, 2)}/${fmt(night, 2)} lei/kWh, Premier Energy official page, from 2 Apr 2026 (verify on your bill). Synthetic households; no CO<sub>2</sub> saving claimed. Reproduce: <i>cd client &amp;&amp; npm run benchmark</i>.</div>
</body></html>`;
writeFileSync(resolve(root, "docs/research/visual-annex.html"), annex);

// ================================================================== 3. POSTER A0 (portrait, 841 x 1189 mm)
const fp = figures("Poppins, Arial, sans-serif", 17, 640, 285, 38);
const optionRows = OPTIONS.map((o, i) => {
  const y = paybackYears(o, econ.central.savingEur);
  const label = ["Built-in delay-start timer", "3 smart plugs (≈15 € each)", "Commercial energy manager (≈658 €)", "Installed HEMS (≈1,000 € + 180 €/yr)"][i];
  return `<tr><td>${label}</td><td>${fmt(o.upfrontEur, 0)} €</td><td>${y === null ? "never" : y === 0 ? "immediately" : fmt(y, 1) + " years"}</td></tr>`;
}).join("");
const poster = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Poster A0 — Energize the Future</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
@page { size: 841mm 1189mm; margin: 0; }
* { box-sizing: border-box; } html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; width: 841mm; height: 1189mm; font-family: Poppins, Arial, sans-serif; font-size: 28pt; line-height: 1.32; color: #1e293b; background: #f8fafc; position: relative; overflow: hidden; }
header { height: 158mm; padding: 20mm 30mm; color: #fff; background: linear-gradient(135deg, #124e89, #1971c2 58%, #237a36); position: relative; }
header .tag { display: inline-block; background: rgba(255,255,255,.2); border-radius: 50mm; padding: 3mm 10mm; font-size: 25pt; font-weight: 600; }
header h1 { font-size: 66pt; line-height: 1.05; margin: 6mm 0 4mm; font-weight: 800; max-width: 600mm; }
header .sub { font-size: 28pt; max-width: 600mm; line-height: 1.25; }
header .qr { position: absolute; right: 30mm; top: 18mm; width: 118mm; background: #fff; border-radius: 7mm; padding: 6mm; color: #0f172a; text-align: center; font-size: 20pt; font-weight: 600; }
header .qr svg { width: 100%; height: auto; display: block; }
main { padding: 11mm 30mm 0; display: grid; grid-template-columns: 1fr 1fr; gap: 9mm; }
.box { background: #fff; border: .8mm solid #dbe3ec; border-radius: 6mm; padding: 6mm 9mm; break-inside: avoid; }
.box h2 { margin: 0 0 3mm; font-size: 34pt; line-height: 1.15; color: #124e89; font-weight: 700; } .wide { grid-column: 1 / -1; }
.hyp { background: #e8f3ff; border-color: #1971c2; } ul { margin: 0; padding-left: 9mm; } li { margin-bottom: 1.5mm; }
.good { background: #e9f7ee; border-color: #237a36; } .warn { background: #fff8db; border-color: #f5c518; }
svg { width: 100%; height: auto; display: block; } .cap { font-size: 21pt; line-height: 1.25; color: #475569; margin: 2mm 0 0; }
table { border-collapse: collapse; width: 100%; font-size: 23pt; } th { background: #124e89; color: #fff; padding: 2mm 3mm; text-align: left; } td { padding: 1.8mm 3mm; border-bottom: .4mm solid #dbe3ec; }
.big { display: flex; gap: 7mm; } .big div { flex: 1; background: #fff; border: .8mm solid #cfdbe8; border-radius: 5mm; padding: 4mm 5mm; text-align: center; line-height: 1.15; } .big b { display: block; font-size: 52pt; color: #237a36; line-height: 1.05; } .big span { font-size: 20pt; color: #475569; }
.flow { display: grid; grid-template-columns: 1fr; gap: 2.5mm; } .flow div { background: #f1f5f9; border-radius: 3mm; padding: 2.5mm 5mm; font-size: 23pt; line-height: 1.25; } .flow b { color: #124e89; }
footer { position: absolute; left: 0; right: 0; bottom: 0; height: 36mm; background: #0f172a; color: #e2e8f0; padding: 6mm 30mm; font-size: 21pt; line-height: 1.4; }
.ph { background: #fff3b0; color: #000; padding: 0 2mm; }
</style></head><body>
<header>
 <span class="tag">UN Sustainable Development Goal 7 · Affordable and Clean Energy</span>
 <h1>Energize the Future: a smart scheduler for cheaper household energy</h1>
 <div class="sub">Four algorithms, ${A.instances + B.instances} random households, one honest result.<br>Stefania Tabarcea · Orizont, Durlești</div>
 <div class="qr">${qrSvg}<div style="margin-top:2mm">Try it live</div></div>
</header>
<main>
<section class="box hyp"><h2>Research question</h2>
<p style="margin:0 0 3mm"><b>Can a computer pick appliance start times that cut a Moldovan household’s bill under a two-zone tariff, without ever overloading the main fuse — and which algorithm does it best?</b></p>
<ul><li><b>H1</b> Optimised schedules beat habit.</li><li><b>H2</b> Annealing and genetic search beat greedy when the fuse is tight.</li><li><b>H3</b> The saving is capped by (1 − night/day price).</li><li><b>H4</b> Exact search stops scaling; metaheuristics keep working.</li></ul>
<p class="cap">Written before the first full run; verdicts computed from data. All four supported.</p></section>

<section class="box"><h2>How it works</h2>
<div class="flow"><div><b>Input</b> appliances, windows, habits, 24 hourly prices, fuse limit</div><div><b>Model</b> cost = Σ power × price + overload penalty</div><div><b>Solvers</b> habit · greedy · annealing · genetic · exact, equal ${b.settings.budget} evaluations</div><div><b>Output</b> schedule, cost, saving, fuse check — in ms, in the browser</div></div>
<p class="cap">React + Vite · pure JavaScript algorithms · 52 automated tests · <b>npm run benchmark</b> reproduces every number · EN / RO / RU</p></section>

<section class="box"><h2>Fig. 1 — Convergence</h2>${fp.convergence}<p class="cap">Both searches start from greedy (${fmt(conv.greedy, 2)}% gap) and fall to ${fmt(conv.anneal.at(-1), 2)}% (annealing) and ${fmt(conv.genetic.at(-1), 2)}% (genetic).</p></section>
<section class="box"><h2>Fig. 2 — Gap to the proven optimum</h2>${fp.regimes}<p class="cap">Annealing is closest in both regimes (${A.instances} and ${B.instances} households).</p></section>
<section class="box"><h2>Fig. 3 — The tariff sets the ceiling</h2>${fp.sensitivity}<p class="cap">At Premier Energy’s current ratio ${fmt(premier.ratio, 3)} the optimum saves ${fmt(premier.meanSavingPct)}% (ceiling ${fmt(premier.upperBoundPct)}%).</p></section>
<section class="box"><h2>Fig. 4 — Where exact search fails</h2>${fp.scalability}<p class="cap">Exact proof finished for ${fmt(b.scalability[0].exactProvedPct, 0)}% of 6-appliance households, ${fmt(lastScale.exactProvedPct, 0)}% of ${lastScale.appliances}-appliance ones.</p></section>

<section class="box good wide"><h2>Key results</h2>
<div class="big"><div><b>${fmt(A.methods.anneal.meanSavingPct)}%</b><span>saving vs habit, 5.5 kW fuse</span></div><div><b>${fmt(B.methods.anneal.meanSavingPct)}%</b><span>saving vs habit, 4.0 kW fuse</span></div><div><b>${fmt(B.methods.anneal.meanGapPct, 2)}%</b><span>gap to optimum (greedy ${fmt(B.methods.greedy.meanGapPct, 2)}%)</span></div><div><b>${fmt(lastScale.exactProvedPct, 0)}%</b><span>exact proofs finished at ${lastScale.appliances} appliances</span></div></div></section>

<section class="box warn"><h2>Economic case study</h2>
<p style="margin:0 0 2mm">Reference household: <b>${fmt(kwh, 0)} kWh/year</b> movable · tariff ${fmt(day, 2)} / ${fmt(night, 2)} lei/kWh (Premier Energy, official) · ${fmt(EUR_MDL, 2)} lei per EUR</p>
<div class="big" style="margin-bottom:3mm"><div><b>${fmt(econ.central.savingEur, 0)} € / year</b><span>≈ ${fmt(econ.central.savingMdl, 0)} lei (range ${fmt(econ.low.savingMdl, 0)}–${fmt(econ.high.savingMdl, 0)} lei)</span></div></div>
<table><tr><th>Option</th><th>Cost</th><th>Pays back</th></tr>${optionRows}</table>
<p class="cap">Tool: free, open source. Commercial prices are indicative. No CO₂ saving is claimed.</p></section>

<div style="display:grid;gap:9mm;align-content:start">
<section class="box"><h2>Honest limits</h2><ul>
<li>Synthetic households; no Moldovan meter data yet.</li><li>Tariff from Premier Energy’s official page (VAT basis not stated); the tool accepts your own prices.</li><li>Searches start from greedy, so part of their edge over greedy is built in.</li><li>Annealing still fails on some hard tight-fuse cases (${b.stability.anneal.infeasibleRuns}/100 runs on one household).</li></ul></section>
<section class="box"><h2>Responsible AI</h2><p style="margin:0;font-size:23pt">The author set the question, hypotheses and experiments and reviewed every result. <b>Claude Code</b> — the only AI tool used — wrote code and drafts under that direction. Its mistakes (a baseline that broke the fuse, infeasible schedules counted in gaps, random starts) were found by tests and review and are logged in docs/research/LOGBOOK.md.</p></section>
</div>
</main>
<footer>Live site: ${SITE} · Code and data: ${REPO} · Sources and certainty levels: docs/FACT_CHECK.md, docs/research/ECONOMICS.md · Benchmark run ${when} (Node ${b.environment.node}) · MIT licence</footer>
</body></html>`;
writeFileSync(resolve(root, "docs/stand/poster-A0.html"), poster);

// ================================================================== 4. ROMANIAN ABSTRACT (2 pages)
const fr = (n, d = 1) => n.toLocaleString("ro-RO", { minimumFractionDigits: d, maximumFractionDigits: d });
const PR = (p) => (p < 0.001 ? "p < 0,001" : `p = ${fr(p, 3)}`);
const abstractRo = `<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Rezumat — Energize the Future</title>
<style>
@page { size: A4; margin: 15mm 18mm 15mm 18mm; } * { box-sizing: border-box; }
body { font: 12pt/1.22 "Times New Roman", Times, serif; color: #000; margin: 0; text-align: justify; }
h1 { font-size: 14pt; text-align: center; margin: 0 0 3pt; line-height: 1.2; } .meta { text-align: center; font-size: 11pt; margin-bottom: 6pt; }
h2 { font-size: 12pt; margin: 5pt 0 1pt; } p { margin: 0 0 3pt; } ul { margin: 0 0 3pt; padding-left: 16pt; } li { margin-bottom: 0; }
table.t { border-collapse: collapse; width: 100%; font-size: 10.5pt; margin: 3pt 0 4pt; } .t th, .t td { border: .5pt solid #000; padding: 1.5pt 4pt; text-align: center; } .t td:first-child { text-align: left; }
.small { font-size: 10.5pt; } .ref { font-size: 10.5pt; margin: 0 0 1.5pt; padding-left: 14pt; text-indent: -14pt; text-align: left; } .ph { background: #fff3b0; }
</style></head><body>
<h1>Programarea optimă a consumului casnic de energie electrică în Republica Moldova cu tarif pe două zone: compararea metodelor greedy, a călirii simulate, a algoritmului genetic și a căutării exacte</h1>
<div class="meta"><b>Categoria tematică:</b> III. Tehnologia informației (algoritmi, aplicații software) · <b>Autor:</b> Ștefania Tabarcea · <b>Clasa:</b> <span class="ph">[clasa]</span><br>Orizont, Durlești · coordonator: Azamat Jauysh<br>Proiectul „Energize the Future” (ODD 7 al ONU) · ${SITE} · ${REPO}</div>

<h2>1. Scopul și actualitatea cercetării</h2>
<p>Gospodăriile din Republica Moldova pot alege un tarif pe două zone, în care energia electrică de noapte (23:00–07:00) este mai ieftină decât cea de zi; pagina oficială Premier Energy indică ${fr(day, 2)} și ${fr(night, 2)} lei/kWh din 2 aprilie 2026, adică o reducere nocturnă de ${fr(100 * (1 - night / day), 0)}%. O familie poate reduce factura mutând aparatele flexibile (mașina de spălat, mașina de spălat vase, uscătorul, boilerul electric, încărcătorul pentru mașina electrică) în zona ieftină, dar siguranța principală (circa 3,7 kW la 16 A, 5,75 kW la 25 A) limitează puterea totală la fiecare oră. „Pornește mașina noaptea” devine astfel o problemă de planificare cu restricții: se alege o oră de pornire pentru fiecare aparat astfel încât costul zilnic să fie minim, iar siguranța să nu fie depășită. Pentru șase aparate fără restricții există 24<sup>6</sup> ≈ 1,9·10<sup>8</sup> combinații. Scopul este să măsurăm cât se poate economisi și care algoritm este cel mai potrivit.</p>

<h2>2. Ipoteze (scrise înainte de prima rulare completă)</h2>
<ul>
<li><b>H1.</b> Un program optimizat costă mai puțin decât cel obișnuit (diferență pe perechi, p &lt; 0,05).</li>
<li><b>H2.</b> La același buget de ${b.settings.budget} de evaluări, călirea simulată și algoritmul genetic ajung mai aproape de optim decât metoda greedy atunci când siguranța este strânsă.</li>
<li><b>H3.</b> Economia este plafonată de (1 − preț noapte/preț zi) din costul consumului mutabil și crește aproximativ proporțional cu diferența de preț.</li>
<li><b>H4.</b> Căutarea exactă prin ramificare și limitare nu mai poate fi folosită când numărul de aparate crește, în timp ce metodele euristice returnează programe viabile în milisecunde.</li>
</ul>

<h2>3. Metode utilizate</h2>
<p>Fiecare aparat are putere, durată, interval permis de pornire și oră obișnuită. Toate metodele minimizează același scor (costul zilnic plus o penalizare mare pe kWh peste limita siguranței): (a) <i>obiceiul</i> (referință: orele obișnuite, amânate doar cât cere siguranța); (b) metoda <i>greedy</i>, cel mai mare consum primul; (c) <i>călirea simulată</i> (Kirkpatrick et al., 1983) cu răcire geometrică; (d) un <i>algoritm genetic</i> (populație 40, selecție prin turneu, încrucișare uniformă, mutație, elitism); (e) <i>ramificare și limitare</i> (Land și Doig, 1960), optimul exact de referință. Călirea și algoritmul genetic pornesc de la programul greedy. Experimentele folosesc gospodării aleatorii cu valoare inițială fixă (5–7 aparate): ${A.instances} în regimul A (siguranță 5,5 kW) și ${B.instances} în regimul B (4,0 kW; ${B.excludedInfeasible} fără soluție viabilă, excluse), plus ${b.settings.instancesPerScalabilityPoint} pentru fiecare dimensiune de 6, 10, 16, 24 și 40 de aparate. Distanțele se măsoară față de optimul dovedit și iau în calcul doar programele care respectă siguranța; intervalele sunt intervale de încredere de 95%; metodele se compară prin teste pe perechi, pe aceleași gospodării. Codul, valorile inițiale și datele sunt publice, iar testul se reproduce cu <i>npm run benchmark</i>.</p>

<h2>4. Analiza datelor obținute</h2>
<table class="t"><tr><th>Metoda</th><th>Economie A</th><th>Distanță A</th><th>Economie B</th><th>Distanță B</th><th>Siguranță OK B</th></tr>
${["greedy", "anneal", "genetic", "exact"].map((m) => `<tr><td>${{ greedy: "Greedy", anneal: "Călire simulată", genetic: "Algoritm genetic", exact: "Exact (R&amp;L)" }[m]}</td><td>${fr(A.methods[m].meanSavingPct)}%</td><td>${fr(A.methods[m].meanGapPct, 2)}%</td><td>${fr(B.methods[m].meanSavingPct)}%</td><td>${fr(B.methods[m].meanGapPct, 2)}%</td><td>${fr(B.methods[m].feasiblePct)}%</td></tr>`).join("")}</table>
<p class="small">Economia față de obicei și distanța medie față de optimul dovedit; ${A.instances} (A) și ${B.instances} (B) gospodării.</p>
<p><b>H1 susținută.</b> Călirea economisește ${fr(A.methods.anneal.meanSavingPct)}% (IC 95%: ${fr(A.methods.anneal.savingCI95[0])}–${fr(A.methods.anneal.savingCI95[1])}) în regimul A și ${fr(B.methods.anneal.meanSavingPct)}% în regimul B (${PR(Math.max(A.tests.anneal_vs_preferred.p, B.tests.anneal_vs_preferred.p))}). Fără amânare, orele obișnuite ar depăși siguranța la ${fr(A.habitFuseViolationPct, 0)}% (A) și ${fr(B.habitFuseViolationPct, 0)}% (B) dintre gospodării.</p>
<p><b>H2 susținută, cu rezervă.</b> În regimul B distanța medie este ${fr(B.methods.greedy.meanGapPct, 2)}% (greedy), ${fr(B.methods.anneal.meanGapPct, 2)}% (călire) și ${fr(B.methods.genetic.meanGapPct, 2)}% (genetic). Deoarece ambele căutări pornesc de la greedy, o parte din avantaj este încorporată; comparația corectă este cu optimul exact, pe care niciuna nu îl atinge la toate gospodăriile (${B.methods.anneal.optimalCount}/${B.instances} și ${B.methods.genetic.optimalCount}/${B.instances}).</p>
<p><b>H3 susținută.</b> La raportul actual ${fr(premier.ratio, 3)} optimul economisește ${fr(premier.meanSavingPct)}% față de plafonul de ${fr(premier.upperBoundPct)}%; între rapoartele 0,9 și 0,4 economia crește de la ${fr(b.sensitivity[1].meanSavingPct)}% la ${fr(b.sensitivity.at(-1).meanSavingPct)}% fără a depăși plafonul. <b>H4 susținută.</b> Căutarea exactă și-a încheiat demonstrația pentru ${fr(b.scalability[0].exactProvedPct, 0)}% dintre gospodăriile cu 6 aparate, dar doar pentru ${fr(lastScale.exactProvedPct, 0)}% la ${lastScale.appliances} aparate; la dimensiunea unei case (6 aparate) este deja instantanee, deci euristicile contează la sisteme mai mari (blocuri, școli).</p>

<h2>5. Valoarea practică și economică</h2>
<p>O gospodărie de referință mută ${fr(kwh, 0)} kWh pe an (spălat, spălat vase, încălzirea apei). Economia este de <b>${fr(econ.central.savingMdl, 0)} lei (≈ ${fr(econ.central.savingEur, 0)} EUR) pe an</b>; ${fr(econ.low.savingMdl, 0)} lei cu siguranță strânsă și cel mult ${fr(econ.high.savingMdl, 0)} lei dacă tot consumul s-ar muta noaptea (curs ${fr(EUR_MDL, 2)} lei/EUR, BNM, 5 nov. 2026). Programul costă 0 EUR și poate fi aplicat cu temporizatoarele aparatelor (amortizare imediată); trei prize inteligente (≈15 EUR bucata, ipoteză) se amortizează în ${fr(paybackYears(OPTIONS[1], econ.central.savingEur), 1)} ani, un manager energetic de 658 EUR în ${fr(paybackYears(OPTIONS[2], econ.central.savingEur), 0)} de ani, iar un sistem instalat de ≈1.000 EUR plus 120–240 EUR/an niciodată. Tariful pe două zone necesită un contor cu înregistrare orară și un angajament de 12 luni. Nu se pretinde nicio reducere de CO<sub>2</sub>. Limite: gospodării sintetice, bază TVA nespecificată pentru tarif, aparate cu putere constantă; pasul următor este validarea pe date reale de la contor.</p>

<h2>Literatura utilizată</h2>
<p class="ref">Kirkpatrick S., Gelatt C. D., Vecchi M. P. (1983). Optimization by simulated annealing. <i>Science</i> 220(4598), 671–680.</p>
<p class="ref">Land A. H., Doig A. G. (1960). An automatic method of solving discrete programming problems. <i>Econometrica</i> 28(3), 497–520.</p>
<p class="ref">Holland J. H. (1975). <i>Adaptation in Natural and Artificial Systems.</i> University of Michigan Press.</p>
<p class="ref">Premier Energy Moldova (2026). Informații privind prețurile diferențiate (premierenergy.md); Moldpres (31.03.2026), tarifele ANRE; Banca Națională a Moldovei, cursul oficial EUR/MDL, 5.11.2026. Surse și grad de certitudine: docs/research/ECONOMICS.md.</p>
<p class="ref">IA: Claude Code (Anthropic) a fost singurul instrument de IA; a scris codul și ciornele sub îndrumarea și verificarea autoarei (AI_USAGE.md).</p>
</body></html>`;
writeFileSync(resolve(root, "docs/research/abstract-ro.html"), abstractRo);

// ================================================================== 5. RESEARCH PLAN (1 page)
const plan = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Research plan — Energize the Future</title>
<style>
@page { size: A4; margin: 15mm 17mm; } * { box-sizing: border-box; }
body { font: 11pt/1.3 "Times New Roman", Times, serif; margin: 0; color: #000; }
h1 { font-size: 15pt; margin: 0 0 2pt; text-align: center; } .meta { text-align: center; font-size: 10.5pt; margin-bottom: 6pt; }
h2 { font-size: 11.5pt; margin: 6pt 0 2pt; } p { margin: 0 0 3pt; } ul { margin: 0 0 3pt; padding-left: 15pt; } li { margin-bottom: 1pt; }
table { border-collapse: collapse; width: 100%; font-size: 10pt; margin: 3pt 0; } th, td { border: .5pt solid #000; padding: 2pt 4pt; text-align: left; vertical-align: top; } th { background: #eee; }
.ph { background: #fff3b0; }
</style></head><body>
<h1>Research plan — “Energize the Future”: cost-optimal appliance scheduling under a two-zone tariff</h1>
<div class="meta">Stefania Tabarcea · Orizont, Durlești · grade <span class="ph">[grade]</span> · mentor: Azamat Jauysh · category III (algorithms, software applications)</div>
<h2>1. Question and goal</h2>
<p>Can a computer choose start times for a household’s appliances so that the electricity bill falls under Moldova’s two-zone tariff without exceeding the main fuse, and which algorithm does this best? Goal: measure the saving, compare four methods fairly, and deliver a free, multilingual tool (EN/RO/RU) that anyone can use in a browser.</p>
<h2>2. Hypotheses (fixed before the full benchmark)</h2>
<ul><li>H1 optimised schedules cost less than habit · H2 annealing and genetic search beat greedy on a tight fuse · H3 the saving is capped by (1 − night/day price) · H4 exact search stops scaling while heuristics keep working.</li></ul>
<h2>3. Methods and materials</h2>
<ul>
<li><b>Model:</b> 24 hourly prices, appliances (power, duration, allowed window, habit), fuse limit; fitness = cost + penalty × overload.</li>
<li><b>Solvers:</b> habit baseline, greedy, simulated annealing, genetic algorithm, exact branch and bound; equal budget of ${b.settings.budget} evaluations.</li>
<li><b>Experiments:</b> ${A.instances} + ${B.instances} seeded random households (two fuse regimes), scalability (6–40 appliances, ${b.settings.instancesPerScalabilityPoint} each), tariff sensitivity, stability over 100 seeds. Paired tests, 95% confidence intervals.</li>
<li><b>Data:</b> Premier Energy official prices (3.75 / 2.94 lei/kWh from 2 April 2026), BNM exchange rate, public price listings; no personal data.</li>
<li><b>Tools:</b> JavaScript, React/Vite, Node.js; 52 automated tests; Lighthouse audits; Claude Code as the only AI tool, under the author’s direction.</li></ul>
<h2>4. Timetable (dates from the logbook)</h2>
<table><tr><th>Phase</th><th>What</th><th>When</th><th>Status</th></tr>
<tr><td>1</td><td>Educational website, game, calculator, hosting (Vercel, Render, Turso)</td><td>1 Oct 2026</td><td>done</td></tr>
<tr><td>2</td><td>Quality: tests, accessibility, fact-check, translation review</td><td>21 Oct 2026</td><td>done</td></tr>
<tr><td>3</td><td>Research module: model, solvers, benchmark, statistics, economic case</td><td>11–12 Nov 2026</td><td>done</td></tr>
<tr><td>4</td><td>Tariff checked at the operator’s official page; results re-run</td><td>16 Nov 2026</td><td>done</td></tr>
<tr><td>5</td><td>Validation on real smart-meter data (a household or the school); solar panels and battery in the model; professional proofreading</td><td>after the contest</td><td>planned</td></tr></table>
<h2>5. Expected results (and what was found)</h2>
<p>Expected: a saving bounded by the night discount (${fmt(100 * (1 - night / day), 0)}%). Found: ${fmt(A.methods.anneal.meanSavingPct)}% (5.5 kW fuse) and ${fmt(B.methods.anneal.meanSavingPct)}% (4.0 kW), about ${fmt(econ.central.savingEur, 0)} EUR (${fmt(econ.central.savingMdl, 0)} lei) a year for a reference household; annealing ${fmt(B.methods.anneal.meanGapPct, 2)}% from the optimum versus ${fmt(B.methods.greedy.meanGapPct, 2)}% for greedy; exact search proving optimality in only ${fmt(lastScale.exactProvedPct, 0)}% of ${lastScale.appliances}-appliance cases.</p>
<h2>6. Risks and ethics</h2>
<ul><li>Synthetic households and a tariff whose VAT basis is not stated: shown as limits; the tool accepts the user’s own prices.</li>
<li>No claim of CO<sub>2</sub> savings; commercial prices are labelled indicative.</li>
<li>The tool runs in the browser and stores no personal data; AI use and mistakes are documented (AI_USAGE.md, LOGBOOK.md); sources and certainty levels are in ECONOMICS.md and FACT_CHECK.md.</li></ul>
</body></html>`;
writeFileSync(resolve(root, "docs/research/research-plan.html"), plan);

// ================================================================== 6. FULL PAPER (EN)
const paper = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Full text — Energize the Future</title>
<style>
@page { size: A4; margin: 20mm 20mm 20mm 22mm; @bottom-center { content: counter(page); font: 10pt "Times New Roman", serif; } }
* { box-sizing: border-box; } body { font: 12pt/1.35 "Times New Roman", Times, serif; margin: 0; color: #000; text-align: justify; }
h1 { font-size: 17pt; text-align: center; margin: 0 0 4pt; line-height: 1.2; } .meta { text-align: center; font-size: 11pt; margin-bottom: 10pt; }
h2 { font-size: 13pt; margin: 12pt 0 3pt; break-after: avoid; } h3 { font-size: 12pt; margin: 8pt 0 2pt; font-style: italic; break-after: avoid; }
p { margin: 0 0 6pt; } ul, ol { margin: 0 0 6pt; padding-left: 18pt; } li { margin-bottom: 2pt; }
table.t { border-collapse: collapse; width: 100%; font-size: 10.5pt; margin: 4pt 0 6pt; break-inside: avoid; } .t th, .t td { border: .5pt solid #000; padding: 2pt 5pt; text-align: center; } .t td:first-child { text-align: left; }
figure { margin: 6pt 0 8pt; break-inside: avoid; } figure svg { width: 100%; height: auto; display: block; } figcaption { font-size: 10.5pt; text-align: left; margin-top: 2pt; }
.eq { text-align: center; font-style: italic; margin: 4pt 0 6pt; } .abs { font-size: 11pt; border: .5pt solid #000; padding: 5pt 8pt; margin-bottom: 8pt; } .ph { background: #fff3b0; }
.ref { font-size: 11pt; margin: 0 0 3pt; padding-left: 14pt; text-indent: -14pt; text-align: left; }
</style></head><body>
<h1>Cost-optimal load shifting for Moldovan households under a two-zone electricity tariff: a benchmark of greedy, simulated-annealing, genetic and exact schedulers</h1>
<div class="meta">Stefania Tabarcea · grade <span class="ph">[grade]</span> · Orizont, Durlești · mentor: Azamat Jauysh<br>Category III — Information technology (algorithms, software applications) · MoldSEF 2026<br>Project “Energize the Future” (UN SDG 7) · ${SITE} · ${REPO}</div>
<div class="abs"><b>Abstract.</b> Moldova’s two-zone household tariff makes night electricity about ${fmt(100 * (1 - night / day), 0)}% cheaper, but the main fuse limits how much can run at once. We model the choice of start hours for flexible appliances as a constrained scheduling problem and compare a habit baseline, greedy placement, simulated annealing, a genetic algorithm and exact branch and bound on ${A.instances + B.instances} seeded random households. Optimised schedules save ${fmt(A.methods.anneal.meanSavingPct)}% (5.5 kW fuse) and ${fmt(B.methods.anneal.meanSavingPct)}% (4.0 kW fuse) against habit (p &lt; 0.001); for a reference household this is about ${fmt(econ.central.savingEur, 0)} EUR a year. Exact search is instant at household size but proves optimality in only ${fmt(lastScale.exactProvedPct, 0)}% of ${lastScale.appliances}-appliance cases, where annealing is best. The method is implemented as a free browser tool in English, Romanian and Russian.</div>

<h2>1. Introduction</h2>
<p>About 655 million people still lack electricity (UN, 2024), and the electricity that is available is increasingly sold at prices that vary by hour. UN Sustainable Development Goal 7 asks for affordable and clean energy for all. In Moldova, households connected to low-voltage networks may opt for a tariff with two price zones. Premier Energy’s official page states ${fmt(day, 2)} lei/kWh for 07:00–23:00 and ${fmt(night, 2)} lei/kWh for 23:00–07:00, in force since 2 April 2026, against a flat price of 3.56 lei/kWh. The tariff is optional, requires a meter that records hourly use, and binds the household for 12 months.</p>
<p>A household can profit by running flexible appliances at night, but the main fuse (about 3.7 kW for 16 A, 5.75 kW for 25 A) limits the total power at every hour. Running everything at the cheapest hour would trip it. The question studied here is: <i>can an algorithm choose start times that lower the bill without breaching the fuse, and which algorithm is best?</i> The project began as an educational website about SDG 7 (learning pages, a strategy game, an appliance calculator) and was extended with this research module.</p>

<h2>2. Problem formulation</h2>
<p>There are N appliances. Appliance i has power p<sub>i</sub> (kW), a duration d<sub>i</sub> (whole hours, one continuous run per day), an allowed set of start hours S<sub>i</sub> (a window of the 24-hour cycle) and a habitual start hour. A schedule assigns each appliance a start hour s<sub>i</sub> ∈ S<sub>i</sub>; hours wrap around midnight. With hourly prices c<sub>h</sub> and a non-movable base load b<sub>h</sub> (refrigerator, lighting, cooking):</p>
<div class="eq">cost(s) = Σ<sub>i</sub> Σ<sub>k=0..d<sub>i</sub>−1</sub> p<sub>i</sub> · c<sub>(s<sub>i</sub>+k) mod 24</sub></div>
<div class="eq">L<sub>h</sub>(s) = b<sub>h</sub> + Σ<sub>i</sub> p<sub>i</sub> · [appliance i runs in hour h],   overload(s) = Σ<sub>h</sub> max(0, L<sub>h</sub> − C)</div>
<p>where C is the fuse limit. The objective is to minimise cost(s) subject to overload(s) = 0. For solvers that explore infeasible schedules, the fitness is cost(s) + λ · overload(s) with λ = 10 · max<sub>h</sub> c<sub>h</sub>, so one kWh above the fuse costs more than running anything at the highest price. For six appliances with unrestricted windows the search space has 24<sup>6</sup> ≈ 1.9 · 10<sup>8</sup> elements.</p>

<h2>3. Methods</h2>
<h3>3.1 Habit baseline</h3>
<p>Each appliance starts at its habitual hour; if that would exceed the fuse, it waits hour by hour until it fits. This is what a sensible household does without an optimiser. The raw overload of unchecked habits is reported separately. (An earlier version let habits ignore the fuse, which made the baseline unfair; see Section 6.)</p>
<h3>3.2 Greedy placement</h3>
<p>Appliances are sorted by energy p<sub>i</sub>d<sub>i</sub> (largest first) and each is placed at the hour with the lowest incremental fitness, given those already placed. One pass, no backtracking.</p>
<h3>3.3 Simulated annealing</h3>
<p>Starting from the greedy schedule, ${b.settings.budget} iterations: pick one appliance and change its start (a one-hour shift or a jump to any allowed hour); always accept an improvement and accept a worse schedule with probability exp(−Δ/T). The temperature falls geometrically from 2 · max c<sub>h</sub> to 0.005 (Kirkpatrick et al., 1983).</p>
<h3>3.4 Genetic algorithm</h3>
<p>Population 40 (one member is the greedy schedule); tournament selection (size 3); uniform crossover (probability 0.9); mutation 12% per gene; the two best individuals survive each generation; stops after ${b.settings.budget} fitness evaluations (Holland, 1975).</p>
<h3>3.5 Exact branch and bound</h3>
<p>Appliances are placed in order of decreasing energy. A branch is pruned when the fuse is already exceeded (loads only grow) or when the cost so far plus the cheapest possible cost of the remaining appliances cannot beat the best schedule found (Land and Doig, 1960). A node limit of 3·10<sup>6</sup> bounds the run; when it ends before the limit, the optimum is <i>proven</i>.</p>

<h2>4. Experimental design</h2>
<p><b>Households.</b> A seeded generator draws 5–7 appliances from a catalogue (washing machine, dishwasher, dryer, EV charger, water heater, pump) with realistic powers (0.8–3.7 kW) and durations (2–5 h). Each appliance is either unrestricted or limited to a plausible window; habitual hours are drawn from evening-heavy ranges; the base load has a morning and an evening bump. <b>Regimes.</b> Regime A uses a 5.5 kW fuse (typical 25 A connection) and ${A.instances} households; regime B uses 4.0 kW (tight) and ${B.instances} households (${B.excludedInfeasible} more had no feasible schedule and were excluded). <b>Scalability.</b> Sizes 6, 10, 16, 24 and 40 appliances, ${b.settings.instancesPerScalabilityPoint} households each, fuse scaled with size. <b>Sensitivity.</b> Night/day price ratios from 0.9 to 0.4 and three further tariff scenarios. <b>Stability.</b> 100 seeds on one hard 10-appliance household.</p>
<p><b>Metrics and statistics.</b> Saving relative to habit; gap to the proven optimum (feasible schedules only); share of households where the optimum was found; share where the fuse was respected; run time (one laptop). Intervals are 95% confidence intervals of the mean; two methods are compared by a paired test on identical households (t statistic with a normal-approximation p-value, valid for n ≥ 30) with effect size d<sub>z</sub>. All randomness is seeded, so every number is reproducible with <i>npm run benchmark</i>.</p>

<h2>5. Results</h2>
<table class="t"><tr><th>Method</th><th>Saving A</th><th>Gap A</th><th>Optimum found A</th><th>Saving B</th><th>Gap B</th><th>Optimum found B</th><th>Fuse OK B</th><th>Time (ms)</th></tr>
${["greedy", "anneal", "genetic", "exact"].map((m) => `<tr><td>${NAMES[m]}</td><td>${fmt(A.methods[m].meanSavingPct)}%</td><td>${fmt(A.methods[m].meanGapPct, 2)}%</td><td>${A.methods[m].optimalCount}/${A.instances}</td><td>${fmt(B.methods[m].meanSavingPct)}%</td><td>${fmt(B.methods[m].meanGapPct, 2)}%</td><td>${B.methods[m].optimalCount}/${B.instances}</td><td>${fmt(B.methods[m].feasiblePct)}%</td><td>${fmt(B.methods[m].meanMs, 2)}</td></tr>`).join("")}</table>
<p><b>H1 (supported).</b> Annealing saves ${fmt(A.methods.anneal.meanSavingPct)}% (95% CI ${fmt(A.methods.anneal.savingCI95[0])}–${fmt(A.methods.anneal.savingCI95[1])}) in regime A and ${fmt(B.methods.anneal.meanSavingPct)}% (${fmt(B.methods.anneal.savingCI95[0])}–${fmt(B.methods.anneal.savingCI95[1])}) in regime B against habit (${P(Math.max(A.tests.anneal_vs_preferred.p, B.tests.anneal_vs_preferred.p))}; d<sub>z</sub> = ${fmt(A.tests.anneal_vs_preferred.dz, 1)} and ${fmt(B.tests.anneal_vs_preferred.dz, 1)}). Raw habitual start hours would exceed the fuse in ${fmt(A.habitFuseViolationPct, 0)}% and ${fmt(B.habitFuseViolationPct, 0)}% of households.</p>
<figure>${figSerif.regimes}<figcaption><b>Figure 1.</b> Mean gap to the proven optimum. Annealing is closest in both regimes; the gap grows when the fuse is tight.</figcaption></figure>
<p><b>H2 (supported, with a caveat).</b> In regime B the gap is ${fmt(B.methods.greedy.meanGapPct, 2)}% for greedy, ${fmt(B.methods.anneal.meanGapPct, 2)}% for annealing and ${fmt(B.methods.genetic.meanGapPct, 2)}% for the genetic algorithm (annealing vs greedy ${P(B.tests.anneal_vs_greedy.p)}; genetic vs greedy ${P(B.tests.genetic_vs_greedy.p)}). Both searches start from the greedy schedule and so can never end worse than it; part of the advantage is therefore built in. The fair reference is the proven optimum, which annealing finds in ${B.methods.anneal.optimalCount} of ${B.instances} households and the genetic algorithm in ${B.methods.genetic.optimalCount}.</p>
<figure>${figSerif.convergence}<figcaption><b>Figure 2.</b> Convergence in regime B: mean gap to the optimum versus fitness evaluations used.</figcaption></figure>
<p><b>H3 (supported).</b> At Premier Energy’s ratio ${fmt(premier.ratio, 3)} the optimum saves ${fmt(premier.meanSavingPct)}% (95% CI ${fmt(premier.ci95[0])}–${fmt(premier.ci95[1])}) against a ceiling of ${fmt(premier.upperBoundPct)}%. Across ratios 0.9 to 0.4 the saving rises from ${fmt(b.sensitivity[1].meanSavingPct)}% to ${fmt(b.sensitivity.at(-1).meanSavingPct)}% and stays below the ceiling, at roughly half of it, because only part of the load can move without breaching windows and fuse. With the same code, the earlier 2025 media tariffs (4.32/3.31; 3.89/3.31; 4.89/3.90) give ${b.tariffScenarios.filter((t) => t.id !== "premier").map((t) => fmt(t.meanSavingPct)).join("%, ")}% — the saving depends on the tariff.</p>
<figure>${figSerif.sensitivity}<figcaption><b>Figure 3.</b> Saving of the optimal schedule versus the night/day price ratio (95% CI); the ceiling is 1 − ratio.</figcaption></figure>
<p><b>H4 (supported).</b> Exact search finished its optimality proof for ${fmt(b.scalability[0].exactProvedPct, 0)}%, ${fmt(b.scalability[1].exactProvedPct, 0)}%, ${fmt(b.scalability[2].exactProvedPct, 0)}%, ${fmt(b.scalability[3].exactProvedPct, 0)}% and ${fmt(lastScale.exactProvedPct, 0)}% of households with 6, 10, 16, 24 and 40 appliances. At 40 appliances it ended ${fmt(lastScale.methods.exact.meanGapToBestPct, 2)}% above the best known schedule (the best of all methods, which favours the method that finds it most often) against ${fmt(lastScale.methods.anneal.meanGapToBestPct, 2)}% for annealing, in about ${fmt(lastScale.methods.anneal.meanMs, 0)} ms versus ${fmt(lastScale.methods.exact.meanMs, 0)} ms. At household size exact search is already instant (${fmt(b.scalability[0].methods.exact.meanMs, 1)} ms), so heuristics matter for larger systems such as apartment blocks or schools.</p>
<figure>${figSerif.scalability}<figcaption><b>Figure 4.</b> Gap to the best known schedule versus number of appliances (log scale; 0.00% is drawn at 0.001).</figcaption></figure>
<p><b>Stability.</b> On one hard 10-appliance household (proven optimum ${fmt(b.stability.anneal.referenceCost, 2)} lei) 100 seeds gave a mean of ${fmt(b.stability.anneal.meanCost, 2)} ± ${fmt(b.stability.anneal.sdCost, 2)} for annealing (${b.stability.anneal.infeasibleRuns} runs found no schedule within the fuse) and ${fmt(b.stability.genetic.meanCost, 2)} ± ${fmt(b.stability.genetic.sdCost, 2)} for the genetic algorithm (${b.stability.genetic.infeasibleRuns} failed runs). Neither method reliably finds the exact optimum on hard cases; they come close.</p>

<h2>6. Design iterations and errors found</h2>
<ol>
<li><b>Unfair baseline.</b> In the first prototype the habit baseline ignored the fuse and broke it in 19 of 20 sample households, so its cost could not be compared with feasible schedules. It now waits until the fuse allows.</li>
<li><b>Infeasible schedules in the gaps.</b> The first analysis counted infeasible schedules in the cost gaps, which can flatter a method. Gaps now use only feasible schedules and the feasibility rate is reported separately.</li>
<li><b>Stability test bug.</b> The stability test used a fuse limit far too tight for 10 appliances; it was corrected by scaling the fuse with size.</li>
<li><b>Random versus greedy start.</b> With random starting schedules annealing respected the fuse in ${fmt(v1B.methods.anneal.feasiblePct)}% of regime-B households (gap ${fmt(v1B.methods.anneal.meanGapPct, 2)}%) and ${v1.stability.anneal.infeasibleRuns} of 100 runs on the hard household failed. Starting from the greedy schedule improved this (final feasibility ${fmt(B.methods.anneal.feasiblePct)}%, gap ${fmt(B.methods.anneal.meanGapPct, 2)}%), at the price of the built-in advantage discussed above.</li>
<li><b>Out-of-date tariff.</b> The first economic case used 2025 media figures (4.32/3.31 lei/kWh); reading the operator’s own page showed the 2026 prices (3.75/2.94), which lowered the estimated saving from about 33 to 27 EUR a year. The conclusions did not change; the money figures did.</li></ol>
<p><b>Ablation of the starting point and of a repair step</b> (regime B, ${b.ablation.instances} households; the last column uses the hard 10-appliance household with 100 seeds). “Repair” is a final coordinate-descent pass that tries every other start hour of every appliance and keeps any improvement; it uses 10% of the same evaluation budget.</p>
<table class="t"><tr><th>Variant</th><th>Fuse respected</th><th>Gap to optimum</th><th>Optimum found</th><th>Failed runs (hard case)</th></tr>
${Object.values(b.ablation.variants).map((v) => `<tr><td>${v.label}</td><td>${fmt(v.feasiblePct)}%</td><td>${fmt(v.meanGapPct, 2)}%</td><td>${v.optimalCount}/${b.ablation.instances}</td><td>${v.hardCaseFailedRuns}/100</td></tr>`).join("")}</table>
<p>The greedy start clearly helps annealing (gap ${fmt(b.ablation.variants.saRandom.meanGapPct, 2)}% → ${fmt(b.ablation.variants.saWarm.meanGapPct, 2)}%, hard-case failures ${b.ablation.variants.saRandom.hardCaseFailedRuns} → ${b.ablation.variants.saWarm.hardCaseFailedRuns}) and removes most hard-case failures of the genetic algorithm (${b.ablation.variants.gaRandom.hardCaseFailedRuns} → ${b.ablation.variants.gaWarm.hardCaseFailedRuns}), but changes the genetic algorithm’s mean gap very little. The repair step is a mixed result: it lowers annealing’s gap (${fmt(b.ablation.variants.saWarm.meanGapPct, 2)}% → ${fmt(b.ablation.variants.saPolish.meanGapPct, 2)}%) and hard-case failures (${b.ablation.variants.saWarm.hardCaseFailedRuns} → ${b.ablation.variants.saPolish.hardCaseFailedRuns}), yet the share of households with a feasible schedule falls (${fmt(b.ablation.variants.saWarm.feasiblePct)}% → ${fmt(b.ablation.variants.saPolish.feasiblePct)}%) because the repair takes budget away from the search, and it brings nothing to the genetic algorithm. It was therefore not adopted by default.</p>
<p>The full dated record is in the logbook (docs/research/LOGBOOK.md).</p>

<h2>7. Economic analysis</h2>
<p>A reference household moves ${fmt(kwh, 0)} kWh a year: washing 208 × 1.0 kWh, dishwashing 260 × 1.0 kWh and water heating 365 × 2.5 kWh (assumptions, not measurements). Its shiftable load costs about ${fmt(econ.central.habitCostMdl, 0)} lei a year at the day price (the habit mostly runs in the day zone).</p>
<table class="t"><tr><th>Case</th><th>Saving</th><th>Lei / year</th><th>EUR / year</th></tr>
<tr><td>Low: tight 4.0 kW fuse</td><td>${fmt(B.methods.anneal.meanSavingPct)}%</td><td>${fmt(econ.low.savingMdl, 0)}</td><td>${fmt(econ.low.savingEur, 1)}</td></tr>
<tr><td><b>Central: realistic 5.5 kW fuse</b></td><td>${fmt(A.methods.anneal.meanSavingPct)}%</td><td>${fmt(econ.central.savingMdl, 0)}</td><td>${fmt(econ.central.savingEur, 1)}</td></tr>
<tr><td>Ceiling: everything moved to night</td><td>${fmt(100 * (1 - night / day))}%</td><td>${fmt(econ.high.savingMdl, 0)}</td><td>${fmt(econ.high.savingEur, 1)}</td></tr></table>
<table class="t"><tr><th>Option</th><th>Upfront (EUR)</th><th>Per year (EUR)</th><th>Pays back in</th></tr>
${OPTIONS.map((o, i) => { const y = paybackYears(o, econ.central.savingEur); return `<tr><td>${["Delay-start timer built into the appliance (this tool is free)", "3 smart plugs (about 15 EUR each, assumption)", "Commercial energy manager (658 EUR, one retailer)", "Installed energy-management system (about 1,000 EUR + subscription)"][i]}</td><td>${fmt(o.upfrontEur, 0)}</td><td>${fmt(o.yearlyEur, 0)}</td><td>${y === null ? "never" : y === 0 ? "immediately" : fmt(y, 1) + " years"}</td></tr>`; }).join("")}</table>
<p>Exchange rate ${fmt(EUR_MDL, 2)} lei/EUR (National Bank of Moldova, 5 November 2026). The sources and certainty level of every input are listed in docs/research/ECONOMICS.md. The saving is modest and depends on the tariff; no CO<sub>2</sub> saving is claimed because moving consumption in time changes its price, not its quantity; a meter with hourly registration is required. No school case is given because no school meter data was available.</p>

<h2>8. Software implementation</h2>
<p>The algorithms are pure JavaScript functions (client/src/utils/optimizer.js) with seeded random numbers, so they run unchanged in the browser tool and in the benchmark script. The Smart Scheduler page lets a user choose a tariff, a fuse limit and appliances and compares the methods in milliseconds; the Research page renders the benchmark file and computes the hypothesis verdicts from it, so the page cannot disagree with the experiment. The surrounding website (React, Vite, Tailwind, Express, SQLite/Turso) offers learning pages, a budget strategy game and an appliance calculator in English, Romanian and Russian. Quality measures: 52 automated tests (including the exact solver checked against exhaustive search and a consistency test of the published benchmark), Lighthouse scores of 100 for accessibility, best practices and SEO and 95–98 for performance on the pages measured, text alternatives for every chart, and no personal data collected.</p>

<h2>9. Limitations</h2>
<ul>
<li>Households are random but synthetic; no real Moldovan meter data was used.</li>
<li>Appliances are constant-power blocks that run once a day; real cycles vary.</li>
<li>The Premier Energy page does not state whether prices include VAT; FEE Nord’s two-zone prices for 2026 were not found.</li>
<li>The searches start from the greedy schedule, so their advantage over greedy is partly built in; annealing still fails on some hard tight-fuse cases.</li>
<li>Commercial prices are indicative; run times come from one laptop.</li></ul>

<h2>10. Conclusions</h2>
<p>Under Premier Energy’s current two-zone tariff, load shifting is a modest but real and free saving (about ${fmt(econ.central.savingEur, 0)} EUR per reference household a year) that must respect the fuse. For household-sized problems an exact solver is sufficient; metaheuristics, and annealing in particular, become necessary above roughly 16 appliances. The strongest next step is validation on real smart-meter data from a home or the school.</p>

<h2>11. Responsible use of AI</h2>
<p>Claude Code (Anthropic) was the only AI tool used. It wrote the code, tests and drafts under the author’s direction; the author set the question and hypotheses, reviewed the results and decides what is claimed. Mistakes made by the assistant and how they were found are documented in AI_USAGE.md and LOGBOOK.md. The Romanian and Russian texts were drafted by AI and read by the author and friends who speak those languages.</p>

<h2>References</h2>
<p class="ref">Holland J. H. (1975). <i>Adaptation in Natural and Artificial Systems.</i> University of Michigan Press.</p>
<p class="ref">Kirkpatrick S., Gelatt C. D., Vecchi M. P. (1983). Optimization by simulated annealing. <i>Science</i> 220(4598), 671–680.</p>
<p class="ref">Land A. H., Doig A. G. (1960). An automatic method of solving discrete programming problems. <i>Econometrica</i> 28(3), 497–520.</p>
<p class="ref">Premier Energy Moldova (2026). Informații privind prețurile diferențiate. premierenergy.md/informatii-privind-preturile-diferentiate/ (read 16 November 2026).</p>
<p class="ref">Moldpres (31 March 2026). ANRE a ieftinit energia electrică pentru consumatorii Premier Energy și FEE Nord.</p>
<p class="ref">National Bank of Moldova. Official exchange rate EUR/MDL, 5 November 2026 (20.1773).</p>
<p class="ref">United Nations. Sustainable Development Goal 7 (sdgs.un.org/goals/goal7).</p>
<p class="ref">Source code, data and logbook: ${REPO}.</p>
</body></html>`;
writeFileSync(resolve(root, "docs/research/full-paper.html"), paper);

console.log("written abstract.html, visual-annex.html, poster-A0.html and figures/*.svg");
