// Household load-shifting optimiser (pure JavaScript, no React, fully unit-tested).
//
// PROBLEM. A household owns N shiftable appliances (washing machine, EV charger, ...). Each one must run
// for `duration` consecutive hours once per day, starting inside an allowed window. Electricity has an
// hourly price (a time-of-use tariff) and the main fuse limits the total power in every hour (`capKw`).
// Choose one start hour per appliance so that the daily cost is minimal and the fuse limit is never exceeded.
//
// This is a small constrained scheduling problem. Its search space is  prod(span_i)  start-hour
// combinations (24^6 = 191 million for six unrestricted appliances), so exhaustive search is too slow
// for a phone, while smart search is fast.
//
// FOUR METHODS (all minimise the same fitness and get the SAME budget of fitness evaluations):
//   preferred - not an algorithm: habitual start hours, delayed only as far as the fuse requires (the reference)
//   greedy    - place appliances one by one, biggest energy first, each at its cheapest feasible hour
//   anneal    - simulated annealing (starts from the greedy schedule, accepts worse moves early, strict later)
//   genetic   - genetic algorithm (population seeded with the greedy schedule, tournament, crossover, mutation)
//   exact     - branch and bound; provably optimal, used as the reference to measure the optimality gap

export const HOURS = 24;
export const DEFAULT_CAP_KW = 5.5; // typical single-phase 25 A fuse at 230 V is about 5.75 kW
export const DEFAULT_BUDGET = 2400; // fitness evaluations given to each metaheuristic

// ---------- seeded random numbers (so every experiment is reproducible) ----------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- tariffs ----------
// Builds 24 hourly prices from a two-zone tariff. The night zone may wrap around midnight (23:00-07:00).
export function twoZonePrices({ day, night, nightFrom = 23, nightTo = 7 }) {
  return Array.from({ length: HOURS }, (_, h) => {
    const inNight = nightFrom > nightTo ? h >= nightFrom || h < nightTo : h >= nightFrom && h < nightTo;
    return inNight ? night : day;
  });
}

// ---------- problem helpers ----------
// An appliance has: powerKw, duration (hours), from + span (allowed start hours: from, from+1, ... mod 24),
// and preferred (the start hour the household uses out of habit). A "schedule" is an array of genes;
// gene i is an offset 0..span_i-1 so start hour = (from_i + gene_i) mod 24.
export function startHour(app, gene) {
  return (app.from + gene) % HOURS;
}

export function loadProfile(problem, genes) {
  const load = problem.baseLoad.slice();
  problem.appliances.forEach((app, i) => {
    const s = startHour(app, genes[i]);
    for (let k = 0; k < app.duration; k++) load[(s + k) % HOURS] += app.powerKw;
  });
  return load;
}

// cost = money spent on the shiftable appliances only (base load cannot be moved, so it is ignored).
// overload = kWh that exceed the fuse limit. fitness = cost + penalty x overload (penalty is large).
export function evaluate(problem, genes) {
  let cost = 0;
  problem.appliances.forEach((app, i) => {
    const s = startHour(app, genes[i]);
    for (let k = 0; k < app.duration; k++) cost += app.powerKw * problem.prices[(s + k) % HOURS];
  });
  const load = loadProfile(problem, genes);
  let overload = 0;
  for (let h = 0; h < HOURS; h++) overload += Math.max(0, load[h] - problem.capKw);
  return { cost, overload, fitness: cost + problem.penalty * overload };
}

export function makeProblem({ appliances, baseLoad, prices, capKw = DEFAULT_CAP_KW }) {
  const maxPrice = Math.max(...prices);
  return {
    appliances,
    baseLoad: baseLoad ?? new Array(HOURS).fill(0),
    prices,
    capKw,
    // one overloaded kWh costs more than running anything at the highest tariff, so infeasible schedules lose
    penalty: 10 * maxPrice,
  };
}

export function preferredGenes(problem) {
  return problem.appliances.map((app) => {
    const gene = (app.preferred - app.from + HOURS) % HOURS;
    return Math.min(gene, app.span - 1);
  });
}

function energyOf(app) {
  return app.powerKw * app.duration;
}

function makeResult(problem, genes, evaluations, history) {
  const e = evaluate(problem, genes);
  return {
    genes: genes.slice(),
    starts: problem.appliances.map((a, i) => startHour(a, genes[i])),
    cost: e.cost,
    overload: e.overload,
    fitness: e.fitness,
    feasible: e.overload < 1e-9,
    evaluations,
    history, // best fitness after each evaluation (used for convergence plots)
  };
}

// ---------- method 0: preferred (baseline) ----------
// What a sensible household does with no optimiser: each appliance starts at its habitual hour; if that
// would exceed the fuse limit the household waits hour by hour until it fits. `habitOverload` records how
// many kWh of overload the raw habits (without waiting) would have caused.
export function solvePreferred(problem) {
  const apps = problem.appliances;
  const raw = preferredGenes(problem);
  const habitOverload = evaluate(problem, raw).overload;
  const load = problem.baseLoad.slice();
  const genes = new Array(apps.length).fill(0);
  apps.forEach((app, i) => {
    let chosen = raw[i];
    for (let step = 0; step < app.span; step++) {
      const g = (raw[i] + step) % app.span;
      const s = startHour(app, g);
      let fits = true;
      for (let k = 0; k < app.duration; k++) if (load[(s + k) % HOURS] + app.powerKw > problem.capKw + 1e-9) fits = false;
      if (fits) {
        chosen = g;
        break;
      }
    }
    genes[i] = chosen;
    const s = startHour(app, chosen);
    for (let k = 0; k < app.duration; k++) load[(s + k) % HOURS] += app.powerKw;
  });
  const result = makeResult(problem, genes, 1, []);
  result.history = [result.fitness];
  result.habitOverload = habitOverload;
  return result;
}

// ---------- method 1: greedy ----------
export function solveGreedy(problem) {
  const order = problem.appliances.map((_, i) => i).sort((a, b) => energyOf(problem.appliances[b]) - energyOf(problem.appliances[a]));
  const load = problem.baseLoad.slice();
  const genes = new Array(problem.appliances.length).fill(0);
  let evaluations = 0;
  for (const i of order) {
    const app = problem.appliances[i];
    let best = 0;
    let bestScore = Infinity;
    for (let g = 0; g < app.span; g++) {
      const s = startHour(app, g);
      let cost = 0;
      let over = 0;
      for (let k = 0; k < app.duration; k++) {
        const h = (s + k) % HOURS;
        cost += app.powerKw * problem.prices[h];
        over += Math.max(0, load[h] + app.powerKw - problem.capKw) - Math.max(0, load[h] - problem.capKw);
      }
      evaluations++;
      const score = cost + problem.penalty * over;
      if (score < bestScore) {
        bestScore = score;
        best = g;
      }
    }
    genes[i] = best;
    const s = startHour(app, best);
    for (let k = 0; k < app.duration; k++) load[(s + k) % HOURS] += app.powerKw;
  }
  const result = makeResult(problem, genes, evaluations, []);
  result.history = [result.fitness];
  return result;
}

// ---------- method 2: simulated annealing ----------
export function solveAnneal(problem, { budget = DEFAULT_BUDGET, seed = 1, warmStart = true } = {}) {
  const rand = mulberry32(seed);
  const n = problem.appliances.length;
  // warm start: begin from the greedy schedule (v1 began from a random one and often never became feasible)
  let current = warmStart ? solveGreedy(problem).genes : problem.appliances.map((a) => Math.floor(rand() * a.span));
  let currentFit = evaluate(problem, current).fitness;
  let best = current.slice();
  let bestFit = currentFit;
  const history = [bestFit];
  const t0 = 2 * Math.max(...problem.prices); // money units: early on a move worse by ~1 day-rate is accepted
  const t1 = 0.005;
  for (let it = 1; it < budget; it++) {
    const temp = t0 * Math.pow(t1 / t0, it / budget); // geometric cooling
    const candidate = current.slice();
    const i = Math.floor(rand() * n);
    const span = problem.appliances[i].span;
    if (rand() < 0.5 && span > 1) {
      candidate[i] = (candidate[i] + (rand() < 0.5 ? 1 : span - 1)) % span; // small shift
    } else {
      candidate[i] = Math.floor(rand() * span); // jump anywhere
    }
    const fit = evaluate(problem, candidate).fitness;
    if (fit <= currentFit || rand() < Math.exp((currentFit - fit) / temp)) {
      current = candidate;
      currentFit = fit;
      if (fit < bestFit) {
        best = candidate.slice();
        bestFit = fit;
      }
    }
    history.push(bestFit);
  }
  return makeResult(problem, best, budget, history);
}

// ---------- method 3: genetic algorithm ----------
export function solveGenetic(problem, { budget = DEFAULT_BUDGET, seed = 1, population = 40, warmStart = true } = {}) {
  const rand = mulberry32(seed);
  const apps = problem.appliances;
  const n = apps.length;
  const randomGenes = () => apps.map((a) => Math.floor(rand() * a.span));
  const seedGenes = warmStart ? solveGreedy(problem).genes : null;
  let pop = Array.from({ length: population }, (_, idx) => {
    const genes = seedGenes && idx === 0 ? seedGenes : randomGenes(); // one individual is the greedy schedule
    return { genes, fit: evaluate(problem, genes).fitness };
  });
  let evaluations = population;
  let best = pop.reduce((a, b) => (b.fit < a.fit ? b : a));
  const history = new Array(population).fill(0).map(() => 0);
  let runningBest = Infinity;
  pop.forEach((p, idx) => {
    runningBest = Math.min(runningBest, p.fit);
    history[idx] = runningBest;
  });
  const tournament = () => {
    let winner = pop[Math.floor(rand() * pop.length)];
    for (let k = 1; k < 3; k++) {
      const c = pop[Math.floor(rand() * pop.length)];
      if (c.fit < winner.fit) winner = c;
    }
    return winner;
  };
  while (evaluations < budget) {
    pop.sort((a, b) => a.fit - b.fit);
    const next = [pop[0], pop[1]]; // elitism: the two best survive unchanged
    while (next.length < population && evaluations < budget) {
      const a = tournament();
      const b = tournament();
      const child = new Array(n);
      for (let i = 0; i < n; i++) {
        child[i] = rand() < 0.9 && rand() < 0.5 ? b.genes[i] : a.genes[i]; // uniform crossover
        if (rand() < 0.12) child[i] = Math.floor(rand() * apps[i].span); // mutation
      }
      const fit = evaluate(problem, child).fitness;
      evaluations++;
      runningBest = Math.min(runningBest, fit);
      history.push(runningBest);
      next.push({ genes: child, fit });
    }
    pop = next;
    best = pop.reduce((a, b) => (b.fit < a.fit ? b : a), best);
  }
  return makeResult(problem, best.genes, evaluations, history);
}

// ---------- method 4: exact (branch and bound) ----------
// Appliances are placed biggest first. A branch is cut when the fuse limit is already exceeded (loads only
// grow) or when cost so far + the cheapest possible cost of the remaining appliances cannot beat the best.
export function solveExact(problem, { nodeLimit = 3_000_000 } = {}) {
  const apps = problem.appliances;
  const order = apps.map((_, i) => i).sort((a, b) => energyOf(apps[b]) - energyOf(apps[a]));
  // cheapest possible cost of each appliance when ignoring the fuse limit (optimistic bound)
  const minCost = apps.map((app) => {
    let m = Infinity;
    for (let g = 0; g < app.span; g++) {
      const s = startHour(app, g);
      let c = 0;
      for (let k = 0; k < app.duration; k++) c += app.powerKw * problem.prices[(s + k) % HOURS];
      m = Math.min(m, c);
    }
    return m;
  });
  const suffix = new Array(order.length + 1).fill(0);
  for (let d = order.length - 1; d >= 0; d--) suffix[d] = suffix[d + 1] + minCost[order[d]];

  const load = problem.baseLoad.slice();
  const genes = new Array(apps.length).fill(0);
  let bestCost = Infinity;
  let bestGenes = null;
  let nodes = 0;
  let complete = true;

  function place(depth, costSoFar) {
    if (nodes++ > nodeLimit) {
      complete = false;
      return;
    }
    if (depth === order.length) {
      if (costSoFar < bestCost) {
        bestCost = costSoFar;
        bestGenes = genes.slice();
      }
      return;
    }
    const i = order[depth];
    const app = apps[i];
    for (let g = 0; g < app.span; g++) {
      const s = startHour(app, g);
      let ok = true;
      let cost = 0;
      for (let k = 0; k < app.duration; k++) {
        const h = (s + k) % HOURS;
        load[h] += app.powerKw;
        cost += app.powerKw * problem.prices[h];
        if (load[h] > problem.capKw + 1e-9) ok = false;
      }
      if (ok && costSoFar + cost + suffix[depth + 1] < bestCost - 1e-12) {
        genes[i] = g;
        place(depth + 1, costSoFar + cost);
      }
      for (let k = 0; k < app.duration; k++) load[(s + k) % HOURS] -= app.powerKw;
    }
  }
  place(0, 0);
  if (!bestGenes) return null; // no schedule respects the fuse limit
  const result = makeResult(problem, bestGenes, nodes, [bestCost]);
  result.proven = complete;
  return result;
}

export const METHODS = {
  preferred: solvePreferred,
  greedy: solveGreedy,
  anneal: solveAnneal,
  genetic: solveGenetic,
  exact: solveExact,
};

// ---------- random benchmark instances ----------
// Appliance catalogue. Powers are typical nameplate values; windows describe when the household would
// accept running it (a flexible window can start at any hour; a restricted one models noise or habits).
const CATALOGUE = [
  { id: "washer", kw: [1.8, 2.3], dur: [2, 2], habit: [17, 21], restricted: { from: 7, span: 15 } },
  { id: "dishwasher", kw: [1.2, 1.8], dur: [2, 2], habit: [19, 22], restricted: { from: 9, span: 14 } },
  { id: "dryer", kw: [2.0, 2.8], dur: [2, 2], habit: [18, 21], restricted: { from: 8, span: 14 } },
  { id: "ev", kw: [3.3, 3.7], dur: [3, 5], habit: [17, 19], restricted: { from: 17, span: 14 } },
  { id: "boiler", kw: [1.8, 2.2], dur: [2, 3], habit: [5, 7], restricted: { from: 4, span: 18 } },
  { id: "pump", kw: [0.8, 1.2], dur: [2, 4], habit: [14, 17], restricted: { from: 6, span: 17 } },
];

export function randomInstance(seed, { prices, capKw = DEFAULT_CAP_KW, count } = {}) {
  const rand = mulberry32(seed);
  const between = (lo, hi) => lo + rand() * (hi - lo);
  const intBetween = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const n = count ?? intBetween(5, 7);
  const picks = [...CATALOGUE].sort(() => rand() - 0.5).slice(0, Math.min(n, CATALOGUE.length));
  while (picks.length < n) picks.push(CATALOGUE[Math.floor(rand() * CATALOGUE.length)]);
  const appliances = picks.map((c, idx) => {
    const flexible = rand() < 0.5;
    const from = flexible ? 0 : c.restricted.from;
    const span = flexible ? HOURS : c.restricted.span;
    const habitHour = intBetween(c.habit[0], c.habit[1]);
    let preferred = habitHour;
    if (!flexible) {
      const offset = (habitHour - from + HOURS) % HOURS;
      preferred = (from + Math.min(offset, span - 1)) % HOURS;
    }
    return {
      id: `${c.id}-${idx}`,
      name: c.id,
      powerKw: Math.round(between(c.kw[0], c.kw[1]) * 100) / 100,
      duration: intBetween(c.dur[0], c.dur[1]),
      from,
      span,
      preferred,
    };
  });
  // Non-shiftable base load: fridge etc. plus a morning and an evening bump.
  const scale = between(0.8, 1.2);
  const baseLoad = Array.from({ length: HOURS }, (_, h) => {
    let kw = 0.3;
    if (h >= 6 && h < 9) kw += 0.8;
    if (h >= 18 && h < 22) kw += 1.5;
    return Math.round(kw * scale * 100) / 100;
  });
  return makeProblem({ appliances, baseLoad, prices, capKw });
}

// ---------- the live tool: build a problem from the user's choices ----------
export function appliancesFromPreset(items) {
  return items.map((it, idx) => ({
    id: `${it.id}-${idx}`,
    name: it.id,
    powerKw: it.powerKw,
    duration: it.duration,
    from: it.from,
    span: it.span,
    preferred: it.preferred,
  }));
}
