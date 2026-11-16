// Reproducible benchmark for the load-shifting optimiser.   Run:  npm run benchmark   (in client/)
// It writes client/src/data/benchmark.json (shown on the Research page) and docs/research/*.csv.
//
// HYPOTHESES (written BEFORE the first full run; see docs/research/LOGBOOK.md):
//   H1  Under a two-zone tariff, an optimised schedule costs less than the habitual one:
//       paired difference in daily cost > 0, p < 0.05, in both fuse regimes.
//   H2  With the same budget of 2400 fitness evaluations, simulated annealing and the genetic algorithm reach a
//       smaller mean optimality gap than greedy placement in the constrained regime (4.0 kW fuse).
//   H3  The saving is bounded by the tariff: with night/day price ratio r, the saving of the optimum is at most
//       (1 - r) of the shiftable cost, and grows roughly linearly as r falls.
//   H4  Exact branch and bound stops being usable as the number of appliances grows, while the metaheuristics
//       keep returning feasible schedules within milliseconds (crossover expected somewhere below 24 appliances).
//
// Everything is seeded, so the numbers are identical on every run (only the millisecond timings vary).

import { writeFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  twoZonePrices, randomInstance, solvePreferred, solveGreedy, solveAnneal, solveGenetic, solveExact, DEFAULT_BUDGET,
} from "../src/utils/optimizer.js";
import { mean, sd, median, confidence95, pairedTest } from "../src/utils/stats.js";

const here = dirname(fileURLToPath(import.meta.url));
const outJson = resolve(here, "../src/data/benchmark.json");
const outDir = resolve(here, "../../docs/research");
mkdirSync(dirname(outJson), { recursive: true });
mkdirSync(outDir, { recursive: true });

// Tariffs: Premier Energy's official page (since 2 April 2026); FEE Nord is a 2025 media report (docs/research/ECONOMICS.md). They are INPUTS: change them and re-run.
const TARIFFS = {
  premier: { label: "Premier Energy two-zone, in force since 2 April 2026 (premierenergy.md)", day: 3.75, night: 2.94 },
  feeNord: { label: "FEE Nord two-zone (reported 2025)", day: 4.89, night: 3.9 },
};
const prices = twoZonePrices(TARIFFS.premier);
const N_INSTANCES = 200;
const N_SCALE = 100;
const REGIMES = { realistic: 5.5, constrained: 4.0 };
const BUDGET = DEFAULT_BUDGET;

function timed(fn) {
  const t0 = performance.now();
  const result = fn();
  return [result, performance.now() - t0];
}

function runAll(problem, seed) {
  const out = {};
  [out.preferred] = timed(() => solvePreferred(problem));
  let ms;
  [out.greedy, ms] = timed(() => solveGreedy(problem));
  out.greedy.ms = ms;
  [out.anneal, ms] = timed(() => solveAnneal(problem, { budget: BUDGET, seed }));
  out.anneal.ms = ms;
  [out.genetic, ms] = timed(() => solveGenetic(problem, { budget: BUDGET, seed }));
  out.genetic.ms = ms;
  [out.exact, ms] = timed(() => solveExact(problem, { nodeLimit: 3_000_000 }));
  if (out.exact) out.exact.ms = ms;
  return out;
}

const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;
const pct = (a, b) => ((a - b) / b) * 100; // percent by which a exceeds b

// ---------------------------------------------------------------- experiment 1: two fuse regimes
const regimes = {};
const csvRows = ["regime,seed,appliances,preferred,greedy,anneal,genetic,exact,greedy_ms,anneal_ms,genetic_ms,exact_ms,habit_overload_kwh"];
for (const [name, capKw] of Object.entries(REGIMES)) {
  const rows = [];
  let infeasible = 0;
  for (let seed = 1; seed <= N_INSTANCES; seed++) {
    const problem = randomInstance(seed, { prices, capKw });
    const r = runAll(problem, seed);
    if (!r.exact || !r.exact.proven) {
      infeasible++; // no schedule satisfies the fuse limit (or proof not finished): excluded and counted
      continue;
    }
    rows.push({ seed, n: problem.appliances.length, r });
    csvRows.push([name, seed, problem.appliances.length, ...["preferred", "greedy", "anneal", "genetic", "exact"].map((m) => round(r[m].cost, 2)),
      ...["greedy", "anneal", "genetic", "exact"].map((m) => round(r[m].ms, 2)), round(r.preferred.habitOverload, 2)].join(","));
  }
  const ok = (x, m) => x.r[m].overload < 1e-9; // the schedule respects the fuse limit
  const methods = {};
  for (const m of ["preferred", "greedy", "anneal", "genetic", "exact"]) {
    const feas = rows.filter((x) => ok(x, m));
    const gap = feas.map((x) => pct(x.r[m].cost, x.r.exact.cost));
    const saving = feas.map((x) => ((x.r.preferred.cost - x.r[m].cost) / x.r.preferred.cost) * 100);
    const ms = rows.map((x) => x.r[m].ms ?? 0);
    methods[m] = {
      feasiblePct: round((feas.length / rows.length) * 100, 1),
      meanCost: round(mean(feas.map((x) => x.r[m].cost))),
      meanSavingPct: round(mean(saving), 2),
      savingCI95: confidence95(saving).map((v) => round(v, 2)),
      meanGapPct: round(mean(gap), 3),
      gapCI95: confidence95(gap).map((v) => round(v, 3)),
      medianGapPct: round(median(gap), 3),
      optimalCount: gap.filter((g) => g < 1e-6).length,
      meanMs: round(mean(ms), 2),
      sdMs: round(sd(ms), 2),
    };
  }
  // Paired tests use only instances where BOTH schedules are feasible.
  const paired = (a, b) => {
    const both = rows.filter((x) => ok(x, a) && ok(x, b));
    const t = pairedTest(both.map((x) => x.r[a].cost), both.map((x) => x.r[b].cost)); // positive = b is cheaper
    return { n: both.length, meanDiff: round(t.meanDiff, 3), t: round(t.t, 2), p: t.p, dz: round(t.dz, 2) };
  };
  const tests = {};
  for (const m of ["greedy", "anneal", "genetic", "exact"]) tests[`${m}_vs_preferred`] = paired("preferred", m);
  for (const m of ["anneal", "genetic"]) tests[`${m}_vs_greedy`] = paired("greedy", m);
  const habitFuseViolations = rows.filter((x) => x.r.preferred.habitOverload > 1e-9).length;
  regimes[name] = {
    capKw, instances: rows.length, excludedInfeasible: infeasible,
    habitFuseViolationPct: round((habitFuseViolations / rows.length) * 100, 1),
    meanDailySavingLei: round(mean(rows.map((x) => x.r.preferred.cost - x.r.exact.cost)), 2), // optimum vs habit (shiftable appliances only)
    methods, tests,
  };
  console.log(`regime ${name}: ${rows.length} instances (${infeasible} infeasible)`);
}

// ---------------------------------------------------------------- experiment 2: convergence (constrained regime)
const checkpoints = [1, 50, 100, 200, 400, 800, 1200, 1600, 2000, 2400];
const conv = { checkpoints, anneal: [], genetic: [], greedy: 0 };
{
  const acc = { anneal: checkpoints.map(() => []), genetic: checkpoints.map(() => []) };
  const greedyGaps = [];
  for (let seed = 1; seed <= N_INSTANCES; seed++) {
    const problem = randomInstance(seed, { prices, capKw: REGIMES.constrained });
    const exact = solveExact(problem);
    if (!exact || !exact.proven) continue;
    for (const m of ["anneal", "genetic"]) {
      const res = m === "anneal" ? solveAnneal(problem, { budget: BUDGET, seed }) : solveGenetic(problem, { budget: BUDGET, seed });
      checkpoints.forEach((c, i) => {
        const fit = res.history[Math.min(c, res.history.length) - 1];
        acc[m][i].push(pct(fit, exact.cost)); // fitness includes the overload penalty, so early points can be > cost gap
      });
    }
    greedyGaps.push(pct(solveGreedy(problem).fitness, exact.cost));
  }
  conv.anneal = acc.anneal.map((a) => round(mean(a), 3));
  conv.genetic = acc.genetic.map((a) => round(mean(a), 3));
  conv.greedy = round(mean(greedyGaps), 3);
}

// ---------------------------------------------------------------- experiment 3: tariff sensitivity (H3)
const sensitivity = [];
for (const ratio of [1.0, 0.9, 0.8, 0.784, 0.7, 0.6, 0.5, 0.4]) {
  const p = twoZonePrices({ day: 3.75, night: 3.75 * ratio });
  const savings = [];
  for (let seed = 1; seed <= N_SCALE; seed++) {
    const problem = randomInstance(seed, { prices: p, capKw: REGIMES.realistic });
    const ex = solveExact(problem);
    const pre = solvePreferred(problem);
    if (ex && ex.proven) savings.push(((pre.cost - ex.cost) / pre.cost) * 100);
  }
  sensitivity.push({ ratio, meanSavingPct: round(mean(savings), 2), ci95: confidence95(savings).map((v) => round(v, 2)), upperBoundPct: round((1 - ratio) * 100, 1) });
}

// ---------------------------------------------------------------- experiment 3b: reported tariff scenarios (sources conflict)
const tariffScenarios = [];
const SCENARIOS = {
  premier: { label: "Premier Energy two-zone, in force since 2 April 2026 (official page)", day: 3.75, night: 2.94 },
  premierLaunch2025: { label: "Premier Energy two-zone as reported at launch (Jan 2025)", day: 4.32, night: 3.31 },
  premierLowerDay: { label: "Premier Energy, day price reported lowered to 3.89 (Aug 2025)", day: 3.89, night: 3.31 },
  feeNord: { label: "FEE Nord two-zone as reported (2025)", day: 4.89, night: 3.9 },
};
for (const [id, t] of Object.entries(SCENARIOS)) {
  const p = twoZonePrices(t);
  const savings = [];
  for (let seed = 1; seed <= N_INSTANCES; seed++) {
    const problem = randomInstance(seed, { prices: p, capKw: REGIMES.realistic });
    const ex = solveExact(problem);
    const pre = solvePreferred(problem);
    if (ex && ex.proven) savings.push(((pre.cost - ex.cost) / pre.cost) * 100);
  }
  tariffScenarios.push({ id, label: t.label, day: t.day, night: t.night, ratio: round(t.night / t.day, 3), n: savings.length, meanSavingPct: round(mean(savings), 2), ci95: confidence95(savings).map((v) => round(v, 2)) });
}

// ---------------------------------------------------------------- experiment 4: scalability (H4)
const scalability = [];
for (const n of [6, 10, 16, 24, 40]) {
  const capKw = (REGIMES.constrained * n) / 6;
  const rows = [];
  for (let seed = 1; seed <= N_SCALE; seed++) {
    const problem = randomInstance(seed, { prices, capKw, count: n });
    const r = runAll(problem, seed);
    const costs = ["greedy", "anneal", "genetic", "exact"].filter((m) => r[m] && r[m].overload < 1e-9).map((m) => r[m].cost);
    if (!costs.length) continue;
    rows.push({ r, best: Math.min(...costs) }); // best known schedule (the reference when exact cannot prove optimality)
  }
  const entry = { appliances: n, instances: rows.length, capKw: round(capKw, 2), methods: {} };
  entry.exactProvedPct = round((rows.filter((x) => x.r.exact && x.r.exact.proven).length / rows.length) * 100, 1);
  for (const m of ["greedy", "anneal", "genetic", "exact"]) {
    const ok = rows.filter((x) => x.r[m] && x.r[m].overload < 1e-9);
    entry.methods[m] = {
      feasiblePct: round((ok.length / rows.length) * 100, 1),
      meanGapToBestPct: ok.length ? round(mean(ok.map((x) => pct(x.r[m].cost, x.best))), 3) : null,
      meanMs: ok.length ? round(mean(ok.map((x) => x.r[m].ms)), 1) : null,
    };
  }
  scalability.push(entry);
  console.log(`scalability n=${n}: exact proved ${entry.exactProvedPct}%`);
}

// ---------------------------------------------------------------- experiment 5: stability across random seeds
const stability = {};
{
  const problem = randomInstance(7, { prices, capKw: (REGIMES.constrained * 10) / 6, count: 10 });
  const exact = solveExact(problem);
  const ref = exact && exact.proven ? exact.cost : null;
  for (const m of ["anneal", "genetic"]) {
    const costs = [];
    let failures = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const res = m === "anneal" ? solveAnneal(problem, { budget: BUDGET, seed }) : solveGenetic(problem, { budget: BUDGET, seed });
      if (res.overload < 1e-9) costs.push(res.cost); else failures++;
    }
    stability[m] = {
      runs: 100, infeasibleRuns: failures, referenceCost: ref ? round(ref, 2) : null,
      meanCost: round(mean(costs), 2), sdCost: round(sd(costs), 3), minCost: round(Math.min(...costs), 2), maxCost: round(Math.max(...costs), 2),
      foundOptimumPct: ref ? round((costs.filter((c) => c - ref < 1e-6).length / 100) * 100, 1) : null,
    };
  }
}

// ---------------------------------------------------------------- experiment 6: ablation (starting point and repair step)
// Same households and seeds as regime B. "polish" reserves 10% of the budget for a final coordinate-descent repair.
const ABL = {
  saRandom: { label: "Annealing, random start", run: (p, sd) => solveAnneal(p, { seed: sd, warmStart: false }) },
  saWarm: { label: "Annealing, greedy start (used)", run: (p, sd) => solveAnneal(p, { seed: sd }) },
  saPolish: { label: "Annealing, greedy start + repair", run: (p, sd) => solveAnneal(p, { seed: sd, polish: true }) },
  gaRandom: { label: "Genetic, random start", run: (p, sd) => solveGenetic(p, { seed: sd, warmStart: false }) },
  gaWarm: { label: "Genetic, greedy start (used)", run: (p, sd) => solveGenetic(p, { seed: sd }) },
  gaPolish: { label: "Genetic, greedy start + repair", run: (p, sd) => solveGenetic(p, { seed: sd, polish: true }) },
};
const ablation = { regime: "constrained", variants: {} };
{
  const acc = Object.fromEntries(Object.keys(ABL).map((k) => [k, { feas: 0, gaps: [], opt: 0 }]));
  let n = 0;
  for (let seed = 1; seed <= N_INSTANCES; seed++) {
    const problem = randomInstance(seed, { prices, capKw: REGIMES.constrained });
    const ex = solveExact(problem);
    if (!ex || !ex.proven) continue;
    n++;
    for (const [k, v] of Object.entries(ABL)) {
      const r = v.run(problem, seed);
      if (r.overload < 1e-9) {
        acc[k].feas++;
        const gap = pct(r.cost, ex.cost);
        acc[k].gaps.push(gap);
        if (gap < 1e-6) acc[k].opt++;
      }
    }
  }
  const hard = randomInstance(7, { prices, capKw: (REGIMES.constrained * 10) / 6, count: 10 });
  ablation.instances = n;
  for (const [k, v] of Object.entries(ABL)) {
    let failed = 0;
    for (let sd = 1; sd <= 100; sd++) if (v.run(hard, sd).overload > 1e-9) failed++;
    ablation.variants[k] = { label: v.label, feasiblePct: round((acc[k].feas / n) * 100, 1), meanGapPct: round(mean(acc[k].gaps), 3), optimalCount: acc[k].opt, hardCaseFailedRuns: failed };
  }
}

const result = {
  generatedBy: "client/scripts/benchmark.mjs",
  generatedOn: new Date().toISOString().slice(0, 10),
  environment: { node: process.version, platform: `${os.platform()} ${os.arch()}`, cpu: os.cpus()[0]?.model ?? "unknown" },
  settings: { budget: BUDGET, instancesPerRegime: N_INSTANCES, instancesPerScalabilityPoint: N_SCALE, tariff: TARIFFS.premier, tariffFeeNord: TARIFFS.feeNord, regimes: REGIMES },
  regimes, convergence: conv, sensitivity, tariffScenarios, scalability, stability, ablation,
};
writeFileSync(outJson, JSON.stringify(result, null, 2) + "\n");
writeFileSync(resolve(outDir, "benchmark-instances.csv"), csvRows.join("\n") + "\n");
console.log("written", outJson);
