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
<div class="meta">Stefania Tabarcea · Orizont, Durlești · mentor: Azamat Jauysh<br>Project “Energize the Future” (UN Sustainable Development Goal 7) · ${SITE} · ${REPO}</div>

<h2>1. Problem</h2>
<p>Moldovan households can opt for a two-zone tariff in which night electricity (23:00–07:00) is cheaper than day electricity; Premier Energy’s official page gives ${fmt(day, 2)} and ${fmt(night, 2)} lei/kWh since 2 April 2026, a night discount of ${fmt(100 * (1 - night / day), 0)}%. A household can lower its bill by moving flexible appliances (washing machine, dishwasher, dryer, electric water heater, EV charger) to the cheap zone, but the main fuse (about 3.7 kW for 16 A, 5.75 kW for 25 A) limits the total power at any hour. “Use the washer at night” therefore becomes a constrained scheduling problem: choose one start hour per appliance so that the daily cost is minimal and the fuse limit is never exceeded. For six unrestricted appliances there are 24<sup>6</sup> ≈ 1.9·10<sup>8</sup> combinations.</p>

<h2>2. Hypotheses (written before the first full benchmark run)</h2>
<ul>
<li><b>H1.</b> An optimised schedule costs less than the habitual one (paired difference, p &lt; 0.05).</li>
<li><b>H2.</b> With an equal budget of ${b.settings.budget} evaluations, simulated annealing and a genetic algorithm end closer to the optimum than greedy placement when the fuse limit is tight.</li>
<li><b>H3.</b> The saving is bounded by (1 − night/day price) of the shiftable cost and grows roughly in line with the price gap.</li>
<li><b>H4.</b> Exact branch-and-bound stops being usable as the number of appliances grows, while the metaheuristics keep returning feasible schedules in milliseconds.</li>
</ul>

<h2>3. Method</h2>
<p>Every appliance has a power, a duration, an allowed start window and a habitual start hour. All methods minimise the same fitness (daily cost plus a large penalty per kWh above the fuse limit): (a) <i>habit</i> (reference: habitual hours, delayed only as far as the fuse requires); (b) <i>greedy</i> placement, largest energy first; (c) <i>simulated annealing</i> (Kirkpatrick et al., 1983) with geometric cooling; (d) a <i>genetic algorithm</i> (population 40, tournament selection, uniform crossover, mutation, elitism); (e) <i>exact</i> branch-and-bound (Land and Doig, 1960), used as the reference optimum. Annealing and the genetic algorithm start from the greedy schedule. Experiments use seeded random households (5–7 appliances): ${A.instances} households in regime A (5.5 kW fuse) and ${B.instances} in regime B (4.0 kW fuse; ${B.excludedInfeasible} infeasible households excluded), plus ${b.settings.instancesPerScalabilityPoint} households for each size of 6, 10, 16, 24 and 40 appliances. Gaps are measured against the proven optimum and use only schedules that respect the fuse; intervals are 95% confidence intervals; methods are compared with paired tests on identical households. All code, seeds and data are public and the benchmark is reproducible with <i>npm run benchmark</i>.</p>

<h2>4. Results</h2>
${resultsTable}
<p class="small">Mean saving versus habit and mean gap to the proven optimum, ${A.instances} (A) and ${B.instances} (B) households.</p>
<p><b>H1 supported.</b> Annealing saves ${fmt(A.methods.anneal.meanSavingPct)}% (95% CI ${fmt(A.methods.anneal.savingCI95[0])}–${fmt(A.methods.anneal.savingCI95[1])}) in regime A and ${fmt(B.methods.anneal.meanSavingPct)}% in regime B versus habit (${P(Math.max(A.tests.anneal_vs_preferred.p, B.tests.anneal_vs_preferred.p))}, d<sub>z</sub> = ${fmt(A.tests.anneal_vs_preferred.dz, 1)} and ${fmt(B.tests.anneal_vs_preferred.dz, 1)}). Without waiting, the raw habitual start hours would exceed the fuse in ${fmt(A.habitFuseViolationPct, 0)}% (A) and ${fmt(B.habitFuseViolationPct, 0)}% (B) of households.</p>
<p><b>H2 supported, with a caveat.</b> In regime B the mean gap is ${fmt(B.methods.greedy.meanGapPct, 2)}% for greedy, ${fmt(B.methods.anneal.meanGapPct, 2)}% for annealing and ${fmt(B.methods.genetic.meanGapPct, 2)}% for the genetic algorithm (annealing vs greedy ${P(B.tests.anneal_vs_greedy.p)}; genetic vs greedy ${P(B.tests.genetic_vs_greedy.p)}). Because both searches start from the greedy schedule, part of this advantage is built in; the comparison with the exact optimum is the fair one, and neither method reaches it on every household (optimum found in ${B.methods.anneal.optimalCount}/${B.instances} and ${B.methods.genetic.optimalCount}/${B.instances} cases).</p>
<p><b>H3 supported.</b> At Premier Energy’s current ratio ${fmt(premier.ratio, 3)} the optimum saves ${fmt(premier.meanSavingPct)}% against a ceiling of ${fmt(premier.upperBoundPct)}%; across ratios 0.9 to 0.4 the saving rises from ${fmt(b.sensitivity[1].meanSavingPct)}% to ${fmt(b.sensitivity.at(-1).meanSavingPct)}% and never exceeds the ceiling, because only part of the load can move.</p>
<p><b>H4 supported.</b> Exact search finished its optimality proof for ${fmt(b.scalability[0].exactProvedPct, 0)}% of 6-appliance households but only ${fmt(lastScale.exactProvedPct, 0)}% of ${lastScale.appliances}-appliance households, where it ended ${fmt(lastScale.methods.exact.meanGapToBestPct, 2)}% above the best known schedule (the best of all methods, so it favours the method that finds it most often) against ${fmt(lastScale.methods.anneal.meanGapToBestPct, 2)}% for annealing (about ${fmt(lastScale.methods.anneal.meanMs, 0)} ms versus ${fmt(lastScale.methods.exact.meanMs, 0)} ms). At household size (6 appliances) exact search is already instant (${fmt(b.scalability[0].methods.exact.meanMs, 1)} ms), so metaheuristics matter only for larger systems such as apartment blocks or schools.</p>
<p><b>Design iteration.</b> The first version started the searches from random schedules: in regime B annealing respected the fuse in ${fmt(v1B.methods.anneal.feasiblePct)}% of households (gap ${fmt(v1B.methods.anneal.meanGapPct, 2)}%) and, on one hard 10-appliance household, ${v1.stability.anneal.infeasibleRuns} of 100 runs found no feasible schedule. Starting from the greedy schedule raised feasibility to ${fmt(B.methods.anneal.feasiblePct)}% and lowered the gap to ${fmt(B.methods.anneal.meanGapPct, 2)}%, but ${b.stability.anneal.infeasibleRuns} of 100 runs on the hard household still failed, so reliability on tight fuses remains a limitation.</p>

<h2>5. Economic analysis</h2>
<p>A reference household moves ${fmt(kwh, 0)} kWh a year (washing 208×1.0 kWh, dishwashing 260×1.0 kWh, water heating 365×2.5 kWh). At this tariff its shiftable load costs about ${fmt(econ.central.habitCostMdl, 0)} lei a year at the day price. The schedule saves <b>${fmt(econ.central.savingMdl, 0)} lei (≈ ${fmt(econ.central.savingEur, 0)} EUR) a year</b>; ${fmt(econ.low.savingMdl, 0)} lei with a tight fuse and at most ${fmt(econ.high.savingMdl, 0)} lei if everything moved to night (rate ${fmt(EUR_MDL, 2)} lei/EUR, BNM, 5 Nov 2026). The software costs nothing and can be applied with delay-start timers already built into appliances (payback immediate); three smart plugs of about 15 EUR pay back in ${fmt(paybackYears(OPTIONS[1], econ.central.savingEur), 1)} years; a 658 EUR energy manager in ${fmt(paybackYears(OPTIONS[2], econ.central.savingEur), 0)} years; an installed system at about 1,000 EUR plus 120–240 EUR/year never, since its running cost exceeds the saving. Commercial prices are indicative (one retailer, one market report). No CO<sub>2</sub> saving is claimed: moving consumption in time changes its price, not its amount.</p>

<h2>6. Conclusions and limits</h2>
<p>Under the reported Moldovan two-zone tariff, load shifting is a modest but real, free saving (about ${fmt(econ.central.savingEur, 0)} EUR per household a year) that must respect the fuse limit. For household-sized problems an exact solver is sufficient; metaheuristics become necessary above roughly 16 appliances. Limits: synthetic households (no Moldovan meter data), tariff values that may change (VAT basis not stated), constant-power appliance blocks, timings measured on one laptop. Next step: validation on real smart-meter data.</p>

<h2>References</h2>
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
<p class="cap">React + Vite · pure JavaScript algorithms · 50 automated tests · <b>npm run benchmark</b> reproduces every number · EN / RO / RU</p></section>

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
console.log("written abstract.html, visual-annex.html, poster-A0.html and figures/*.svg");
