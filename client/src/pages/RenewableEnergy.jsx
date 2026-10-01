import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sun, Wind, Droplets, Flame, Sprout, Waves, ChevronDown,
  ThumbsUp, ThumbsDown, Cog, Globe, Lightbulb, Check,
} from "lucide-react";

const SOURCES = [
  { key: "solar", icon: Sun, color: "text-sdg7-yellow", bg: "bg-yellow-50", ring: "ring-yellow-200" },
  { key: "wind", icon: Wind, color: "text-sdg7-blue", bg: "bg-blue-50", ring: "ring-blue-200" },
  { key: "hydro", icon: Droplets, color: "text-cyan-600", bg: "bg-cyan-50", ring: "ring-cyan-200" },
  { key: "geothermal", icon: Flame, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" },
  { key: "biomass", icon: Sprout, color: "text-sdg7-green", bg: "bg-green-50", ring: "ring-green-200" },
  { key: "tidal", icon: Waves, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-200" },
];

export default function RenewableEnergy() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState("solar");

  const tableRows = [
    { key: "solar", consistency: "consistencyMedium", cost: "costDown", bestUse: "bestUseSolar" },
    { key: "wind", consistency: "consistencyMedium", cost: "costDown", bestUse: "bestUseWind" },
    { key: "hydro", consistency: "consistencyHigh", cost: "costStable", bestUse: "bestUseHydro" },
    { key: "geothermal", consistency: "consistencyHigh", cost: "costStable", bestUse: "bestUseGeo" },
    { key: "biomass", consistency: "consistencyMedium", cost: "costStable", bestUse: "bestUseBiomass" },
    { key: "tidal", consistency: "consistencyHigh", cost: "costStable", bestUse: "bestUseTidal" },
  ];

  return (
    <div>
      <header className="bg-gradient-to-br from-sdg7-green-dark to-sdg7-green text-white py-16">
        <div className="container-page text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("renewable.pageTitle")}</h1>
          <p className="text-lg text-green-50/90 max-w-2xl mx-auto">{t("renewable.pageSubtitle")}</p>
        </div>
      </header>

      <section className="container-page py-16">
        <h2 className="section-title text-center">{t("renewable.compareTitle")}</h2>
        <p className="section-subtitle text-center">{t("renewable.compareSubtitle")}</p>

        <div className="mt-10 space-y-4 max-w-4xl mx-auto">
          {SOURCES.map((source) => {
            const isOpen = expanded === source.key;
            const data = t(`renewable.${source.key}`, { returnObjects: true });
            return (
              <div key={source.key} className={`card overflow-hidden ${isOpen ? `ring-2 ${source.ring}` : ""}`}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : source.key)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="flex items-center gap-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${source.bg} ${source.color}`}>
                      <source.icon size={26} aria-hidden="true" />
                    </span>
                    <span className="text-lg font-bold text-slate-800">{data.name}</span>
                  </span>
                  <ChevronDown
                    className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 pt-1 grid gap-5 sm:grid-cols-2 animate-fade-in">
                    <InfoBlock icon={Cog} label={t("common.howItWorks")} text={data.how} />
                    <InfoBlock icon={Globe} label={t("common.environmentalImpact")} text={data.impact} />
                    <InfoBlock icon={ThumbsUp} label={t("common.advantages")} text={data.pros} tone="text-sdg7-green" />
                    <InfoBlock icon={ThumbsDown} label={t("common.disadvantages")} text={data.cons} tone="text-red-500" />
                    <InfoBlock icon={Lightbulb} label={t("common.realWorldUse")} text={data.uses} />
                    <InfoBlock icon={Lightbulb} label={t("common.funFact")} text={data.fact} tone="text-sdg7-blue" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-white py-16">
        <div className="container-page">
          <h2 className="section-title text-center">{t("renewable.tableTitle")}</h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-100 shadow-md">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left font-semibold text-slate-600">{t("renewable.tableHeaderSource")}</th>
                  <th scope="col" className="px-5 py-3 text-left font-semibold text-slate-600">{t("renewable.tableHeaderRenewable")}</th>
                  <th scope="col" className="px-5 py-3 text-left font-semibold text-slate-600">{t("renewable.tableHeaderConsistency")}</th>
                  <th scope="col" className="px-5 py-3 text-left font-semibold text-slate-600">{t("renewable.tableHeaderCost")}</th>
                  <th scope="col" className="px-5 py-3 text-left font-semibold text-slate-600">{t("renewable.tableHeaderBestUse")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.map((row) => {
                  const source = SOURCES.find((s) => s.key === row.key);
                  const data = t(`renewable.${row.key}`, { returnObjects: true });
                  return (
                    <tr key={row.key} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 flex items-center gap-2 font-medium text-slate-800">
                        <source.icon size={18} className={source.color} aria-hidden="true" />
                        {data.name}
                      </td>
                      <td className="px-5 py-4">
                        <Check className="text-sdg7-green" size={18} aria-label={t("common.yes")} />
                      </td>
                      <td className="px-5 py-4 text-slate-500">{t(`renewable.${row.consistency}`)}</td>
                      <td className="px-5 py-4 text-slate-500">{t(`renewable.${row.cost}`)}</td>
                      <td className="px-5 py-4 text-slate-500">{t(`renewable.${row.bestUse}`)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, text, tone = "text-slate-700" }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-2 ${tone}`}>
        <Icon size={14} aria-hidden="true" />
        {label}
      </p>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}
