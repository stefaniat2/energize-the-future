import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FlaskConical, CheckCircle2, CircleDot, Coins, TriangleAlert, Terminal, Scale } from "lucide-react";
import { BarChart, LineChart, CHART_COLORS } from "../components/charts.jsx";
import benchmark from "../data/benchmark.json";
import { REFERENCE_HOUSEHOLD, OPTIONS, EUR_MDL, annualShiftableKwh, economicCase, paybackYears } from "../utils/economics.js";

const METHODS = ["greedy", "anneal", "genetic", "exact"];
const METHOD_COLORS = { greedy: CHART_COLORS.SLATE, anneal: CHART_COLORS.GREEN, genetic: CHART_COLORS.BLUE, exact: CHART_COLORS.AMBER };

export default function Research() {
  const { t, i18n } = useTranslation();
  const fmt = (n, d = 1) => n.toLocaleString(i18n.language, { minimumFractionDigits: d, maximumFractionDigits: d });
  const pText = (p) => (p < 0.001 ? "p < 0.001" : `p = ${fmt(p, 3)}`);

  const { regimes, convergence, sensitivity, scalability, stability, settings } = benchmark;
  const real = regimes.realistic;
  const cons = regimes.constrained;
  const premier = sensitivity.find((s) => s.ratio === 0.784);
  const first = scalability[0];
  const last = scalability[scalability.length - 1];

  // Verdicts are computed from the data, not typed in.
  const hypotheses = [
    {
      id: "h1",
      ok: real.tests.anneal_vs_preferred.p < 0.05 && cons.tests.anneal_vs_preferred.p < 0.05,
      evidence: t("research.h1Evidence", {
        real: fmt(real.methods.anneal.meanSavingPct), cons: fmt(cons.methods.anneal.meanSavingPct), p: pText(Math.max(real.tests.anneal_vs_preferred.p, cons.tests.anneal_vs_preferred.p)),
      }),
    },
    {
      id: "h2",
      ok: cons.tests.anneal_vs_greedy.p < 0.05 && cons.tests.genetic_vs_greedy.p < 0.05,
      evidence: t("research.h2Evidence", {
        greedy: fmt(cons.methods.greedy.meanGapPct, 2), anneal: fmt(cons.methods.anneal.meanGapPct, 2), genetic: fmt(cons.methods.genetic.meanGapPct, 2),
        p: pText(Math.max(cons.tests.anneal_vs_greedy.p, cons.tests.genetic_vs_greedy.p)),
      }),
    },
    {
      id: "h3",
      ok: sensitivity.every((s) => s.meanSavingPct <= s.upperBoundPct + 1e-9),
      evidence: t("research.h3Evidence", { ratio: fmt(premier.ratio, 3), saving: fmt(premier.meanSavingPct), bound: fmt(premier.upperBoundPct) }),
    },
    {
      id: "h4",
      ok: last.exactProvedPct < 50 && last.methods.anneal.meanGapToBestPct < last.methods.exact.meanGapToBestPct,
      evidence: t("research.h4Evidence", {
        n: last.appliances, proved: fmt(last.exactProvedPct, 0), exactGap: fmt(last.methods.exact.meanGapToBestPct, 2), annealGap: fmt(last.methods.anneal.meanGapToBestPct, 2),
      }),
    },
  ];

  // ---- economics: central estimate = what the live tool achieves (annealing, realistic fuse); low = tight fuse
  const annualKwh = annualShiftableKwh();
  const day = settings.tariff.day;
  const night = settings.tariff.night;
  const central = economicCase({ annualKwh, dayPrice: day, nightPrice: night, savingPct: real.methods.anneal.meanSavingPct });
  const low = economicCase({ annualKwh, dayPrice: day, nightPrice: night, savingPct: cons.methods.anneal.meanSavingPct });
  const high = economicCase({ annualKwh, dayPrice: day, nightPrice: night, savingPct: 100 * (1 - night / day) });

  const regimeTable = (key, regime) => (
    <div key={key} className="card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <caption className="px-4 pt-4 pb-2 text-left font-bold text-slate-800">
          {t(`research.regime_${key}`, { cap: fmt(regime.capKw, 1), n: regime.instances })}
        </caption>
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th scope="col" className="px-4 py-2">{t("optimizer.colMethod")}</th>
            <th scope="col" className="px-4 py-2">{t("research.colSaving")}</th>
            <th scope="col" className="px-4 py-2">{t("research.colGap")}</th>
            <th scope="col" className="px-4 py-2">{t("research.colOptimal")}</th>
            <th scope="col" className="px-4 py-2">{t("research.colFeasible")}</th>
            <th scope="col" className="px-4 py-2">{t("optimizer.colTime")}</th>
          </tr>
        </thead>
        <tbody>
          {["preferred", ...METHODS].map((m) => {
            const v = regime.methods[m];
            return (
              <tr key={m} className="border-t border-slate-100">
                <th scope="row" className="px-4 py-2 font-semibold text-slate-800">{t(`optimizer.methods.${m}`)}</th>
                <td className="px-4 py-2">{m === "preferred" ? "—" : `${fmt(v.meanSavingPct)}% (${fmt(v.savingCI95[0])}–${fmt(v.savingCI95[1])})`}</td>
                <td className="px-4 py-2">{fmt(v.meanGapPct, 2)}%</td>
                <td className="px-4 py-2">{m === "preferred" ? "—" : `${v.optimalCount}/${regime.instances}`}</td>
                <td className="px-4 py-2">{fmt(v.feasiblePct)}%</td>
                <td className="px-4 py-2">{m === "preferred" ? "—" : fmt(v.meanMs, 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <header className="bg-gradient-to-br from-slate-800 via-sdg7-blue-dark to-sdg7-blue text-white py-16">
        <div className="container-page text-center">
          <FlaskConical size={44} className="mx-auto mb-4 text-sdg7-yellow" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("research.pageTitle")}</h1>
          <p className="text-lg text-blue-50 max-w-3xl mx-auto">{t("research.pageSubtitle")}</p>
        </div>
      </header>

      <div className="container-page py-12 space-y-12 max-w-5xl">
        {/* ---- question and hypotheses */}
        <section aria-labelledby="q-title" className="space-y-4">
          <h2 id="q-title" className="section-title">{t("research.questionTitle")}</h2>
          <p className="text-lg text-slate-700 leading-relaxed">{t("research.questionText")}</p>
          <p className="text-sm text-slate-600">{t("research.preregistered")}</p>
          <ul className="grid gap-4 md:grid-cols-2">
            {hypotheses.map((h) => (
              <li key={h.id} className="card p-5">
                <p className="font-bold text-slate-800 mb-1">{t(`research.${h.id}Title`)}</p>
                <p className="text-slate-600 text-sm mb-3">{t(`research.${h.id}Text`)}</p>
                <p className={`flex items-center gap-2 text-sm font-semibold ${h.ok ? "text-sdg7-green" : "text-amber-800"}`}>
                  {h.ok ? <CheckCircle2 size={18} aria-hidden="true" /> : <CircleDot size={18} aria-hidden="true" />}
                  {h.ok ? t("research.supported") : t("research.notSupported")}
                </p>
                <p className="mt-1 text-sm text-slate-600">{h.evidence}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- method */}
        <section aria-labelledby="m-title" className="space-y-4">
          <h2 id="m-title" className="section-title">{t("research.methodTitle")}</h2>
          <p className="text-slate-700 leading-relaxed">{t("research.methodText", { budget: settings.budget })}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {["preferred", ...METHODS].map((m) => (
              <li key={m} className="card p-4 text-sm">
                <span className="font-bold text-slate-800">{t(`optimizer.methods.${m}`)}.</span>{" "}
                <span className="text-slate-600">{t(`research.about_${m}`)}</span>
              </li>
            ))}
          </ul>
          <p className="text-slate-700 leading-relaxed">{t("research.statsText", { n: settings.instancesPerRegime, runs: settings.instancesPerScalabilityPoint })}</p>
        </section>

        {/* ---- results */}
        <section aria-labelledby="r-title" className="space-y-6">
          <h2 id="r-title" className="section-title">{t("research.resultsTitle")}</h2>
          <p className="text-slate-600 text-sm">{t("research.tableHelp")}</p>
          {regimeTable("realistic", real)}
          {regimeTable("constrained", cons)}
          <p className="text-sm text-slate-600">
            {t("research.habitViolations", { real: fmt(real.habitFuseViolationPct, 0), cons: fmt(cons.habitFuseViolationPct, 0) })}
          </p>

          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-2">{t("research.convergenceTitle")}</h3>
            <p className="text-sm text-slate-600 mb-3">{t("research.convergenceText")}</p>
            <LineChart
              logY
              xTicks={convergence.checkpoints}
              xLabel={t("research.evaluations")}
              yLabel={t("research.gapAxis")}
              ariaLabel={t("research.convergenceAria", { start: fmt(convergence.anneal[0], 1), anneal: fmt(convergence.anneal.at(-1), 1), genetic: fmt(convergence.genetic.at(-1), 1) })}
              series={[
                { name: t("optimizer.methods.anneal"), color: METHOD_COLORS.anneal, values: convergence.anneal },
                { name: t("optimizer.methods.genetic"), color: METHOD_COLORS.genetic, values: convergence.genetic },
              ]}
            />
            <p className="mt-2 text-sm text-slate-600">{t("research.convergenceFoot", { greedy: fmt(convergence.greedy, 2), anneal: fmt(convergence.anneal.at(-1), 2), genetic: fmt(convergence.genetic.at(-1), 2) })}</p>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-2">{t("research.sensitivityTitle")}</h3>
            <p className="text-sm text-slate-600 mb-3">{t("research.sensitivityText", { night: fmt(settings.tariff.night, 2), day: fmt(settings.tariff.day, 2), ratio: fmt(settings.tariff.night / settings.tariff.day, 3) })}</p>
            <BarChart
              ariaLabel={t("research.sensitivityAria")}
              max={40}
              bars={sensitivity.filter((s) => s.ratio < 1).map((s) => ({
                label: t("research.ratioLabel", { ratio: fmt(s.ratio, 3) }),
                value: s.meanSavingPct,
                ci: s.ci95,
                color: s.ratio === 0.784 ? CHART_COLORS.GREEN : CHART_COLORS.BLUE,
                text: `${fmt(s.meanSavingPct)}%  (≤ ${fmt(s.upperBoundPct, 0)}%)`,
              }))}
            />
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <caption className="px-4 pt-4 pb-1 text-left font-bold text-slate-800">{t("research.scalabilityTitle")}</caption>
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-2">{t("research.colAppliances")}</th>
                  <th scope="col" className="px-4 py-2">{t("research.colProved")}</th>
                  {METHODS.map((m) => <th key={m} scope="col" className="px-4 py-2">{t(`optimizer.methods.${m}`)}</th>)}
                </tr>
              </thead>
              <tbody>
                {scalability.map((s) => (
                  <tr key={s.appliances} className="border-t border-slate-100">
                    <th scope="row" className="px-4 py-2 font-semibold">{s.appliances}</th>
                    <td className="px-4 py-2">{fmt(s.exactProvedPct, 0)}%</td>
                    {METHODS.map((m) => (
                      <td key={m} className="px-4 py-2">
                        {fmt(s.methods[m].meanGapToBestPct, 2)}%
                        <span className="text-slate-500"> · {fmt(s.methods[m].meanMs, 1)} ms</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-sm text-slate-600">{t("research.scalabilityText", { n: first.appliances })}</p>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-2">{t("research.stabilityTitle")}</h3>
            <p className="text-sm text-slate-600">
              {t("research.stabilityText", {
                ref: fmt(stability.anneal.referenceCost, 2),
                saMean: fmt(stability.anneal.meanCost, 2), saSd: fmt(stability.anneal.sdCost, 2), saFail: stability.anneal.infeasibleRuns,
                gaMean: fmt(stability.genetic.meanCost, 2), gaSd: fmt(stability.genetic.sdCost, 2), gaFail: stability.genetic.infeasibleRuns,
              })}
            </p>
          </div>
        </section>

        {/* ---- economics */}
        <section aria-labelledby="e-title" className="space-y-5">
          <h2 id="e-title" className="section-title flex items-center gap-3">
            <Coins size={30} className="text-sdg7-yellow-dark" aria-hidden="true" />
            {t("research.econTitle")}
          </h2>
          <p className="text-slate-700 leading-relaxed">{t("research.econText", { day: fmt(day, 2), night: fmt(night, 2), kwh: fmt(annualKwh, 0), rate: fmt(EUR_MDL, 2) })}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <caption className="px-4 pt-4 pb-2 text-left font-bold text-slate-800">{t("research.assumptionsTitle")}</caption>
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-2">{t("research.colAppliance")}</th>
                    <th scope="col" className="px-4 py-2">{t("research.colUse")}</th>
                    <th scope="col" className="px-4 py-2">kWh</th>
                  </tr>
                </thead>
                <tbody>
                  {REFERENCE_HOUSEHOLD.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <th scope="row" className="px-4 py-2 font-semibold">{t(`optimizer.appliances.${a.id}`)}</th>
                      <td className="px-4 py-2">{a.perYear} × {fmt(a.kwhEach, 1)} kWh</td>
                      <td className="px-4 py-2">{fmt(a.perYear * a.kwhEach, 0)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 bg-slate-50 font-bold">
                    <th scope="row" className="px-4 py-2">{t("research.total")}</th>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2">{fmt(annualKwh, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <caption className="px-4 pt-4 pb-2 text-left font-bold text-slate-800">{t("research.savingsTitle")}</caption>
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-2">{t("research.colCase")}</th>
                    <th scope="col" className="px-4 py-2">{t("research.colMdl")}</th>
                    <th scope="col" className="px-4 py-2">{t("research.colEur")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[["low", low], ["central", central], ["high", high]].map(([k, v]) => (
                    <tr key={k} className={`border-t border-slate-100 ${k === "central" ? "bg-green-50 font-semibold" : ""}`}>
                      <th scope="row" className="px-4 py-2">{t(`research.case_${k}`)}</th>
                      <td className="px-4 py-2">{fmt(v.savingMdl, 0)}</td>
                      <td className="px-4 py-2">{fmt(v.savingEur, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-sm text-slate-600">{t("research.savingsNote", { habit: fmt(central.habitCostMdl, 0) })}</p>
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <caption className="px-4 pt-4 pb-2 text-left font-bold text-slate-800">{t("research.optionsTitle")}</caption>
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-2">{t("research.colOption")}</th>
                  <th scope="col" className="px-4 py-2">{t("research.colUpfront")}</th>
                  <th scope="col" className="px-4 py-2">{t("research.colYearly")}</th>
                  <th scope="col" className="px-4 py-2">{t("research.colPayback")}</th>
                </tr>
              </thead>
              <tbody>
                {OPTIONS.map((o) => {
                  const years = paybackYears(o, central.savingEur);
                  return (
                    <tr key={o.id} className="border-t border-slate-100">
                      <th scope="row" className="px-4 py-2 font-semibold">{t(`research.option_${o.id}`)}</th>
                      <td className="px-4 py-2">{fmt(o.upfrontEur, 0)} €</td>
                      <td className="px-4 py-2">{fmt(o.yearlyEur, 0)} €</td>
                      <td className="px-4 py-2">
                        {years === null ? t("research.never") : years === 0 ? t("research.immediate") : t("research.years", { n: fmt(years, 1) })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="px-4 py-3 text-sm text-slate-600">{t("research.optionsNote")}</p>
          </div>

          <p className="flex gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{t("research.econHonest")}</span>
          </p>
        </section>

        {/* ---- limits and reproducibility */}
        <section aria-labelledby="l-title" className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 id="l-title" className="flex items-center gap-2 text-xl font-bold text-slate-800 mb-3">
              <Scale size={22} className="text-sdg7-blue" aria-hidden="true" />
              {t("research.limitsTitle")}
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {["l1", "l2", "l3", "l4", "l5"].map((k) => <li key={k}>{t(`research.${k}`)}</li>)}
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 mb-3">
              <Terminal size={22} className="text-sdg7-green" aria-hidden="true" />
              {t("research.reproduceTitle")}
            </h2>
            <p className="text-sm text-slate-600 mb-3">{t("research.reproduceText")}</p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-sm text-slate-100"><code>cd client{"\n"}npm install{"\n"}npm run benchmark{"\n"}npm test</code></pre>
            <p className="mt-3 text-xs text-slate-500">
              {t("research.generated", { date: benchmark.generatedOn, node: benchmark.environment.node, platform: benchmark.environment.platform })}
            </p>
          </div>
        </section>

        <p className="text-center">
          <Link to="/optimizer" className="btn-primary">{t("research.tryIt")}</Link>
        </p>
      </div>
    </div>
  );
}
