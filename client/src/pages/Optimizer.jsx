import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarClock, Play, FlaskConical, TriangleAlert } from "lucide-react";
import { ScheduleChart, LoadChart } from "../components/charts.jsx";
import {
  HOURS, DEFAULT_CAP_KW, twoZonePrices, makeProblem, loadProfile, METHODS, solveAnneal, solveGenetic, solveExact,
} from "../utils/optimizer.js";

// Allowed start hours for each window choice (cyclic, so "evening" runs 17:00 ... 06:00).
const WINDOWS = {
  any: { from: 0, span: 24 },
  day: { from: 8, span: 14 },
  evening: { from: 17, span: 14 },
};

const TARIFF_PRESETS = {
  premier: { day: 3.75, night: 2.94 },
  feeNord: { day: 4.89, night: 3.9 },
  flat: { day: 3.59, night: 3.59 },
  custom: null,
};

const DEFAULT_APPLIANCES = [
  { id: "washer", on: true, powerKw: 2.0, duration: 2, window: "any", habit: 19 },
  { id: "dishwasher", on: true, powerKw: 1.5, duration: 2, window: "any", habit: 21 },
  { id: "dryer", on: true, powerKw: 2.5, duration: 2, window: "any", habit: 19 },
  { id: "boiler", on: true, powerKw: 2.0, duration: 3, window: "any", habit: 18 },
  { id: "ev", on: false, powerKw: 3.7, duration: 4, window: "evening", habit: 18 },
];

// Fridge, lights and cooking cannot be moved, but they use part of the fuse capacity.
const BASE_LOAD = Array.from({ length: HOURS }, (_, h) => 0.3 + (h >= 6 && h < 9 ? 0.8 : 0) + (h >= 18 && h < 22 ? 1.5 : 0));

const METHOD_ORDER = ["preferred", "greedy", "anneal", "genetic", "exact"];
const clampNum = (value, lo, hi, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

function buildProblem(rows, prices, capKw) {
  const appliances = rows
    .filter((r) => r.on)
    .map((r) => {
      const win = WINDOWS[r.window];
      const offset = (r.habit - win.from + HOURS) % HOURS;
      return {
        id: r.id,
        name: r.id,
        powerKw: r.powerKw,
        duration: r.duration,
        from: win.from,
        span: win.span,
        preferred: (win.from + Math.min(offset, win.span - 1)) % HOURS, // habit pulled inside the allowed window
      };
    });
  return makeProblem({ appliances, baseLoad: BASE_LOAD, prices, capKw });
}

function runAll(problem) {
  const out = {};
  for (const m of METHOD_ORDER) {
    const t0 = performance.now();
    let result;
    if (m === "anneal") result = solveAnneal(problem, { seed: 1 });
    else if (m === "genetic") result = solveGenetic(problem, { seed: 1 });
    else if (m === "exact") result = solveExact(problem);
    else result = METHODS[m](problem);
    if (result) result.ms = performance.now() - t0;
    out[m] = result;
  }
  return out;
}

export default function Optimizer() {
  const { t, i18n } = useTranslation();
  const [preset, setPreset] = useState("premier");
  const [dayPrice, setDayPrice] = useState(TARIFF_PRESETS.premier.day);
  const [nightPrice, setNightPrice] = useState(TARIFF_PRESETS.premier.night);
  const [capKw, setCapKw] = useState(DEFAULT_CAP_KW);
  const [rows, setRows] = useState(DEFAULT_APPLIANCES);
  const [shown, setShown] = useState("best");
  const [run, setRun] = useState(0); // incremented by the button; results are recomputed from the current inputs

  const fmt = (n, d = 2) => n.toLocaleString(i18n.language, { minimumFractionDigits: d, maximumFractionDigits: d });

  const prices = useMemo(() => twoZonePrices({ day: dayPrice, night: nightPrice }), [dayPrice, nightPrice]);
  const analysis = useMemo(() => {
    const active = rows.filter((r) => r.on);
    if (!active.length) return { empty: true };
    const problem = buildProblem(rows, prices, capKw);
    const results = runAll(problem);
    const feasible = METHOD_ORDER.filter((m) => results[m] && results[m].feasible);
    if (!results.exact) return { problem, results, impossible: true };
    // cheapest feasible schedule; on a tie prefer the method with the strongest guarantee (exact first)
    const priority = { exact: 0, anneal: 1, genetic: 2, greedy: 3 };
    const best = feasible
      .filter((m) => m !== "preferred")
      .sort((a, b) => (Math.abs(results[a].cost - results[b].cost) < 1e-9 ? priority[a] - priority[b] : results[a].cost - results[b].cost))[0] ?? "exact";
    return { problem, results, best };
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function choosePreset(value) {
    setPreset(value);
    if (TARIFF_PRESETS[value]) {
      setDayPrice(TARIFF_PRESETS[value].day);
      setNightPrice(TARIFF_PRESETS[value].night);
    }
  }

  const shownMethod = shown === "best" ? analysis.best : shown;
  const shownResult = analysis.results && analysis.results[shownMethod];
  const habit = analysis.results?.preferred;
  const names = analysis.problem?.appliances.map((a) => t(`optimizer.appliances.${a.name}`));

  return (
    <div>
      <header className="bg-gradient-to-br from-sdg7-blue-dark via-sdg7-blue to-sdg7-green text-white py-16">
        <div className="container-page text-center">
          <CalendarClock size={44} className="mx-auto mb-4 text-sdg7-yellow" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("optimizer.pageTitle")}</h1>
          <p className="text-lg text-blue-50 max-w-3xl mx-auto">{t("optimizer.pageSubtitle")}</p>
        </div>
      </header>

      <div className="container-page py-12 space-y-8">
        <section className="card p-7" aria-labelledby="how-title">
          <h2 id="how-title" className="text-xl font-bold text-slate-800 mb-2">{t("optimizer.howTitle")}</h2>
          <p className="text-slate-600 leading-relaxed">{t("optimizer.howText")}</p>
        </section>

        <form
          className="grid gap-8 lg:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setRun((n) => n + 1);
          }}
        >
          <section className="card p-7" aria-labelledby="tariff-title">
            <h2 id="tariff-title" className="text-xl font-bold text-slate-800 mb-4">{t("optimizer.tariffTitle")}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="tariff-preset" className="block text-sm font-semibold text-slate-700 mb-1">{t("optimizer.tariffPreset")}</label>
                <select id="tariff-preset" className="select" value={preset} onChange={(e) => choosePreset(e.target.value)}>
                  {Object.keys(TARIFF_PRESETS).map((k) => (
                    <option key={k} value={k}>{t(`optimizer.presets.${k}`)}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="price-day" className="block text-sm font-semibold text-slate-700 mb-1">{t("optimizer.dayPrice")}</label>
                  <input id="price-day" type="number" min="0.1" max="50" step="0.01" inputMode="decimal" className="input" value={dayPrice}
                    onChange={(e) => { setPreset("custom"); setDayPrice(clampNum(e.target.value, 0.1, 50, dayPrice)); }} />
                </div>
                <div>
                  <label htmlFor="price-night" className="block text-sm font-semibold text-slate-700 mb-1">{t("optimizer.nightPrice")}</label>
                  <input id="price-night" type="number" min="0.1" max="50" step="0.01" inputMode="decimal" className="input" value={nightPrice}
                    onChange={(e) => { setPreset("custom"); setNightPrice(clampNum(e.target.value, 0.1, 50, nightPrice)); }} />
                </div>
              </div>
              <div>
                <label htmlFor="fuse" className="block text-sm font-semibold text-slate-700 mb-1">{t("optimizer.fuse")}</label>
                <input id="fuse" type="number" min="1" max="30" step="0.1" inputMode="decimal" className="input" value={capKw}
                  onChange={(e) => setCapKw(clampNum(e.target.value, 1, 30, capKw))} />
                <p className="mt-1 text-sm text-slate-500">{t("optimizer.fuseHint")}</p>
              </div>
              <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{t("optimizer.tariffNote")}</span>
              </p>
            </div>
          </section>

          <section className="card p-7" aria-labelledby="appliances-title">
            <h2 id="appliances-title" className="text-xl font-bold text-slate-800 mb-4">{t("optimizer.appliancesTitle")}</h2>
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className={`rounded-xl border p-3 ${r.on ? "border-sdg7-green/40 bg-green-50/40" : "border-slate-200"}`}>
                  <label className="flex items-center gap-2 font-semibold text-slate-800">
                    <input type="checkbox" checked={r.on} onChange={(e) => updateRow(r.id, { on: e.target.checked })} className="h-5 w-5 accent-[#237a36]" />
                    {t(`optimizer.appliances.${r.id}`)}
                  </label>
                  {r.on && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <label htmlFor={`p-${r.id}`} className="block text-xs font-semibold text-slate-600 mb-1">{t("optimizer.power")}</label>
                        <input id={`p-${r.id}`} type="number" min="0.1" max="10" step="0.1" inputMode="decimal" className="input" value={r.powerKw}
                          onChange={(e) => updateRow(r.id, { powerKw: clampNum(e.target.value, 0.1, 10, r.powerKw) })} />
                      </div>
                      <div>
                        <label htmlFor={`d-${r.id}`} className="block text-xs font-semibold text-slate-600 mb-1">{t("optimizer.duration")}</label>
                        <input id={`d-${r.id}`} type="number" min="1" max="12" step="1" inputMode="numeric" className="input" value={r.duration}
                          onChange={(e) => updateRow(r.id, { duration: Math.round(clampNum(e.target.value, 1, 12, r.duration)) })} />
                      </div>
                      <div>
                        <label htmlFor={`h-${r.id}`} className="block text-xs font-semibold text-slate-600 mb-1">{t("optimizer.habit")}</label>
                        <input id={`h-${r.id}`} type="number" min="0" max="23" step="1" inputMode="numeric" className="input" value={r.habit}
                          onChange={(e) => updateRow(r.id, { habit: Math.round(clampNum(e.target.value, 0, 23, r.habit)) })} />
                      </div>
                      <div>
                        <label htmlFor={`w-${r.id}`} className="block text-xs font-semibold text-slate-600 mb-1">{t("optimizer.window")}</label>
                        <select id={`w-${r.id}`} className="select" value={r.window} onChange={(e) => updateRow(r.id, { window: e.target.value })}>
                          {Object.keys(WINDOWS).map((w) => <option key={w} value={w}>{t(`optimizer.windows.${w}`)}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button type="submit" className="btn-primary mt-6">
              <Play size={18} aria-hidden="true" />
              {t("optimizer.run")}
            </button>
          </section>
        </form>

        <section aria-live="polite" aria-labelledby="results-title" className="space-y-6">
          <h2 id="results-title" className="section-title">{t("optimizer.resultsTitle")}</h2>

          {analysis.empty && <p className="card p-6 text-slate-600">{t("optimizer.noAppliances")}</p>}
          {analysis.impossible && (
            <p className="card p-6 text-red-700" role="alert">{t("optimizer.impossible", { cap: fmt(capKw, 1) })}</p>
          )}

          {analysis.results && !analysis.impossible && (
            <>
              <div className="card overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{t("optimizer.tableCaption")}</caption>
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th scope="col" className="px-4 py-3">{t("optimizer.colMethod")}</th>
                      <th scope="col" className="px-4 py-3">{t("optimizer.colCost")}</th>
                      <th scope="col" className="px-4 py-3">{t("optimizer.colSaving")}</th>
                      <th scope="col" className="px-4 py-3">{t("optimizer.colTime")}</th>
                      <th scope="col" className="px-4 py-3">{t("optimizer.colFuse")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {METHOD_ORDER.map((m) => {
                      const r = analysis.results[m];
                      const saving = habit.cost - r.cost;
                      return (
                        <tr key={m} className={`border-t border-slate-100 ${m === analysis.best ? "bg-green-50 font-semibold" : ""}`}>
                          <th scope="row" className="px-4 py-3 font-semibold text-slate-800">
                            {t(`optimizer.methods.${m}`)}
                            {m === analysis.best && <span className="ml-2 rounded-full bg-sdg7-green px-2 py-0.5 text-xs text-white">{t("optimizer.best")}</span>}
                          </th>
                          <td className="px-4 py-3">{fmt(r.cost)}</td>
                          <td className="px-4 py-3">{m === "preferred" ? "—" : `${fmt(saving)} (${fmt((saving / habit.cost) * 100, 1)}%)`}</td>
                          <td className="px-4 py-3">{m === "preferred" ? "—" : fmt(r.ms, 2)}</td>
                          <td className="px-4 py-3">{r.feasible ? t("optimizer.yes") : t("optimizer.no")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-600">
                {t("optimizer.yearNote", { amount: fmt(Math.max(0, habit.cost - analysis.results[analysis.best].cost) * 365, 0) })}
              </p>

              <div className="card p-6">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <label htmlFor="shown-method" className="text-sm font-semibold text-slate-700">{t("optimizer.showMethod")}</label>
                  <select id="shown-method" className="select max-w-xs" value={shown} onChange={(e) => setShown(e.target.value)}>
                    <option value="best">{t("optimizer.best")}</option>
                    {METHOD_ORDER.filter((m) => m !== "preferred").map((m) => <option key={m} value={m}>{t(`optimizer.methods.${m}`)}</option>)}
                  </select>
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{t("optimizer.scheduleTitle")}</h3>
                <ScheduleChart
                  problem={analysis.problem}
                  habitStarts={habit.starts}
                  optimisedStarts={shownResult.starts}
                  names={names}
                  prices={prices}
                  ariaLabel={t("optimizer.scheduleAria", { list: analysis.problem.appliances.map((a, i) => `${names[i]} ${String(shownResult.starts[i]).padStart(2, "0")}:00`).join(", ") })}
                  legend={{ habit: t("optimizer.legendHabit"), optimised: t("optimizer.legendOptimised"), cheap: t("optimizer.legendCheap"), expensive: t("optimizer.legendExpensive") }}
                />
                <h3 className="font-bold text-slate-800 mt-6 mb-2">{t("optimizer.loadTitle")}</h3>
                <LoadChart
                  habitLoad={loadProfile(analysis.problem, habit.genes)}
                  optimisedLoad={loadProfile(analysis.problem, shownResult.genes)}
                  capKw={capKw}
                  ariaLabel={t("optimizer.loadAria", { cap: fmt(capKw, 1) })}
                  legend={{ fuse: t("optimizer.fuseLine"), habit: t("optimizer.legendHabit"), optimised: t("optimizer.legendOptimised") }}
                />
              </div>
            </>
          )}
        </section>

        <p className="text-center">
          <Link to="/research" className="btn-secondary">
            <FlaskConical size={18} aria-hidden="true" />
            {t("optimizer.researchLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
