// Tests for the load-shifting optimiser, the statistics helpers and the published benchmark file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  HOURS, twoZonePrices, makeProblem, evaluate, loadProfile, randomInstance, mulberry32,
  solvePreferred, solveGreedy, solveAnneal, solveGenetic, solveExact,
} from "../src/utils/optimizer.js";
import { mean, sd, median, normalCdf, confidence95, pairedTest } from "../src/utils/stats.js";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);
const prices = twoZonePrices({ day: 4.32, night: 3.31 });

// ---------- tariff ----------
test("two-zone tariff: night 23:00-07:00 wraps around midnight", () => {
  assert.equal(prices.length, HOURS);
  assert.equal(prices[23], 3.31);
  assert.equal(prices[0], 3.31);
  assert.equal(prices[6], 3.31);
  assert.equal(prices[7], 4.32);
  assert.equal(prices[22], 4.32);
  assert.equal(prices.filter((p) => p === 3.31).length, 8);
});

// ---------- evaluation ----------
test("evaluate: cost is power x price summed over the running hours", () => {
  const problem = makeProblem({
    appliances: [{ id: "a", powerKw: 2, duration: 2, from: 0, span: 24, preferred: 22 }],
    prices,
  });
  // starting at 22:00 -> hours 22 (day price) and 23 (night price)
  const e = evaluate(problem, [22]);
  close(e.cost, 2 * 4.32 + 2 * 3.31);
  assert.equal(e.overload, 0);
});

test("evaluate: a start after midnight wraps (23:00 + 3 h covers 23, 0, 1)", () => {
  const problem = makeProblem({ appliances: [{ id: "a", powerKw: 1, duration: 3, from: 0, span: 24, preferred: 23 }], prices });
  const load = loadProfile(problem, [23]);
  assert.equal(load[23] + load[0] + load[1], 3);
  assert.equal(load[2], 0);
});

test("evaluate: exceeding the fuse limit is measured and heavily penalised", () => {
  const apps = [
    { id: "a", powerKw: 3, duration: 1, from: 0, span: 24, preferred: 10 },
    { id: "b", powerKw: 3, duration: 1, from: 0, span: 24, preferred: 10 },
  ];
  const problem = makeProblem({ appliances: apps, prices, capKw: 5 });
  const together = evaluate(problem, [10, 10]);
  close(together.overload, 1);
  const apart = evaluate(problem, [10, 11]);
  assert.equal(apart.overload, 0);
  assert.ok(together.fitness > apart.fitness + 40, "overload must cost more than any price saving");
});

// ---------- exact solver vs brute force ----------
test("exact solver matches exhaustive search on a small instance", () => {
  const problem = randomInstance(3, { prices, capKw: 4.0, count: 3 });
  let bestBrute = Infinity;
  const [a, b, c] = problem.appliances;
  for (let i = 0; i < a.span; i++)
    for (let j = 0; j < b.span; j++)
      for (let k = 0; k < c.span; k++) {
        const e = evaluate(problem, [i, j, k]);
        if (e.overload < 1e-9 && e.cost < bestBrute) bestBrute = e.cost;
      }
  const exact = solveExact(problem);
  assert.ok(exact.proven);
  close(exact.cost, bestBrute, 1e-9);
});

test("exact solver reports null when no schedule can respect the fuse limit", () => {
  const problem = makeProblem({
    appliances: [{ id: "big", powerKw: 6, duration: 1, from: 0, span: 24, preferred: 0 }],
    prices, capKw: 5,
  });
  assert.equal(solveExact(problem), null);
});

// ---------- heuristics ----------
test("all methods respect the allowed start window", () => {
  const problem = randomInstance(11, { prices, capKw: 5.5 });
  for (const solve of [solvePreferred, solveGreedy, solveAnneal, solveGenetic, solveExact]) {
    const r = solve(problem);
    r.genes.forEach((g, i) => assert.ok(g >= 0 && g < problem.appliances[i].span));
  }
});

test("optimisers beat the habitual schedule under a two-zone tariff and never beat the proven optimum", () => {
  for (let seed = 1; seed <= 10; seed++) {
    const problem = randomInstance(seed, { prices, capKw: 5.5 });
    const habit = solvePreferred(problem);
    const exact = solveExact(problem);
    assert.ok(exact.proven);
    assert.ok(exact.cost < habit.cost, "optimum must be cheaper than habit");
    for (const solve of [solveGreedy, solveAnneal, solveGenetic]) {
      const r = solve(problem, { seed });
      if (r.feasible) assert.ok(r.cost >= exact.cost - 1e-9, `${solve.name} cost below proven optimum`);
    }
  }
});

test("a flat tariff leaves nothing to gain from shifting", () => {
  const flat = twoZonePrices({ day: 3.5, night: 3.5 });
  const problem = randomInstance(5, { prices: flat, capKw: 5.5 });
  close(solveExact(problem).cost, solvePreferred(problem).cost, 1e-9);
});

test("metaheuristics are reproducible: the same seed gives the same schedule", () => {
  const problem = randomInstance(9, { prices, capKw: 4.0 });
  assert.deepEqual(solveAnneal(problem, { seed: 4 }).genes, solveAnneal(problem, { seed: 4 }).genes);
  assert.deepEqual(solveGenetic(problem, { seed: 4 }).genes, solveGenetic(problem, { seed: 4 }).genes);
});

test("warm-started annealing is never worse than the greedy schedule it starts from", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const problem = randomInstance(seed, { prices, capKw: 4.0 });
    assert.ok(solveAnneal(problem, { seed }).fitness <= solveGreedy(problem).fitness + 1e-9);
  }
});

test("evaluation budget is respected", () => {
  const problem = randomInstance(2, { prices });
  assert.equal(solveAnneal(problem, { budget: 500 }).evaluations, 500);
  assert.equal(solveGenetic(problem, { budget: 500 }).evaluations, 500);
});

test("seeded random generator is deterministic and uniform enough", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
  const r = mulberry32(1);
  const xs = Array.from({ length: 5000 }, () => r());
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.ok(Math.abs(mean(xs) - 0.5) < 0.02);
});

// ---------- statistics ----------
test("stats: mean, sample standard deviation and median", () => {
  close(mean([2, 4, 6]), 4);
  close(sd([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7)); // sample sd (n - 1)
  assert.equal(sd([5]), 0);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test("stats: normal CDF reference values", () => {
  close(normalCdf(0), 0.5, 1e-7);
  close(normalCdf(1.96), 0.975, 1e-4);
  close(normalCdf(-1.96), 0.025, 1e-4);
});

test("stats: 95% confidence interval contains the mean and is symmetric", () => {
  const xs = Array.from({ length: 100 }, (_, i) => i);
  const [lo, hi] = confidence95(xs);
  close((lo + hi) / 2, mean(xs));
  assert.ok(lo < mean(xs) && hi > mean(xs));
});

test("stats: paired test detects a real shift and ignores noise", () => {
  const base = Array.from({ length: 100 }, (_, i) => 100 + (i % 7));
  const shifted = base.map((x, i) => x - 2 - ((i * 13) % 3) * 0.1);
  const real = pairedTest(base, shifted);
  assert.ok(real.meanDiff > 1.9 && real.p < 1e-6);
  const noise = base.map((x, i) => x + (i % 2 ? 0.5 : -0.5));
  const none = pairedTest(base, noise);
  assert.ok(none.p > 0.05);
  assert.equal(pairedTest([1, 1, 1], [1, 1, 1]).p, 1);
});

// ---------- published benchmark file ----------
test("benchmark.json: complete and internally consistent", () => {
  const b = JSON.parse(readFileSync(new URL("../src/data/benchmark.json", import.meta.url), "utf8"));
  assert.ok(b.settings.instancesPerRegime >= 100, "the specification asks for at least 100 runs");
  for (const regime of Object.values(b.regimes)) {
    assert.ok(regime.instances >= 100);
    assert.equal(regime.methods.exact.meanGapPct, 0);
    assert.equal(regime.methods.exact.feasiblePct, 100);
    for (const m of ["greedy", "anneal", "genetic"]) {
      assert.ok(regime.methods[m].meanGapPct >= 0, `${m}: a feasible schedule cannot beat the proven optimum`);
      assert.ok(regime.methods[m].meanSavingPct <= regime.methods.exact.meanSavingPct + 1e-9);
    }
  }
  b.sensitivity.forEach((s) => assert.ok(s.meanSavingPct <= s.upperBoundPct + 1e-9, "saving cannot exceed the tariff bound (1 - ratio)"));
  assert.equal(b.sensitivity[0].meanSavingPct, 0, "equal day and night prices leave nothing to save");
  assert.ok(b.scalability.length >= 4);
  assert.ok(b.scalability.at(-1).exactProvedPct < b.scalability[0].exactProvedPct, "exact search proves less as problems grow");
  assert.ok(b.convergence.anneal.at(-1) < b.convergence.anneal[1], "annealing improves with more evaluations");
  // reported tariff scenarios: a bigger night discount must give a bigger saving, never above the ceiling
  const sc = [...b.tariffScenarios].sort((x, y) => y.ratio - x.ratio);
  for (let i = 1; i < sc.length; i++) assert.ok(sc[i].meanSavingPct > sc[i - 1].meanSavingPct, "lower ratio -> larger saving");
  sc.forEach((t) => assert.ok(t.meanSavingPct <= (1 - t.ratio) * 100 + 1e-9));
});

// ---------- economic case study ----------
import { annualShiftableKwh, economicCase, paybackYears, OPTIONS, EUR_MDL } from "../src/utils/economics.js";

test("economics: reference household moves about 1,381 kWh a year", () => {
  close(annualShiftableKwh(), 208 + 260 + 912.5);
});

test("economics: saving = habit cost x saving %, bounded by moving everything to the cheap zone", () => {
  const e = economicCase({ annualKwh: 1000, dayPrice: 4, nightPrice: 3, savingPct: 10 });
  close(e.habitCostMdl, 4000);
  close(e.savingMdl, 400);
  close(e.upperBoundMdl, 1000);
  close(e.savingEur, 400 / EUR_MDL);
  assert.ok(e.savingMdl <= e.upperBoundMdl);
});

test("economics: payback is upfront / net yearly saving, and never when running cost is higher", () => {
  assert.equal(paybackYears({ upfrontEur: 0, yearlyEur: 0 }, 30), 0);
  close(paybackYears({ upfrontEur: 60, yearlyEur: 0 }, 30), 2);
  assert.equal(paybackYears({ upfrontEur: 1000, yearlyEur: 180 }, 30), null);
  assert.equal(OPTIONS.length, 4);
});
