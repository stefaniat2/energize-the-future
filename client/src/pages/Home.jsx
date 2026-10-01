import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sun, Wind, Droplets, Flame, Gamepad2, Calculator, ArrowRight,
  Lightbulb, Bike, Users, BookOpen, Zap, Globe2,
} from "lucide-react";

export default function Home() {
  const { t } = useTranslation();

  const objectives = [
    { icon: Zap, titleKey: "objective1Title", textKey: "objective1Text", color: "from-sdg7-yellow to-amber-400" },
    { icon: Globe2, titleKey: "objective2Title", textKey: "objective2Text", color: "from-sdg7-blue to-sky-400" },
    { icon: Sun, titleKey: "objective3Title", textKey: "objective3Text", color: "from-sdg7-green to-emerald-400" },
  ];

  const stats = [
    { labelKey: "stat1Label", valueKey: "stat1Value" },
    { labelKey: "stat2Label", valueKey: "stat2Value" },
    { labelKey: "stat3Label", valueKey: "stat3Value" },
    { labelKey: "stat4Label", valueKey: "stat4Value" },
  ];

  const sources = [
    { icon: Sun, nameKey: "solarName", shortKey: "solarShort", color: "text-sdg7-yellow", bg: "bg-yellow-50" },
    { icon: Wind, nameKey: "windName", shortKey: "windShort", color: "text-sdg7-blue", bg: "bg-blue-50" },
    { icon: Droplets, nameKey: "hydroName", shortKey: "hydroShort", color: "text-cyan-600", bg: "bg-cyan-50" },
    { icon: Flame, nameKey: "geoName", shortKey: "geoShort", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const actions = [
    { icon: Lightbulb, key: "action1" },
    { icon: Bike, key: "action2" },
    { icon: Users, key: "action3" },
    { icon: BookOpen, key: "action4" },
    { icon: Gamepad2, key: "action5" },
    { icon: Calculator, key: "action6" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sdg7-blue-dark via-sdg7-blue to-sdg7-green text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-sdg7-yellow blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sdg7-green blur-3xl" />
        </div>

        <div className="container-page relative py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <p className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold tracking-wide mb-5">
              {t("brand.tagline")}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg text-blue-50/90 max-w-xl mb-8">{t("home.heroSubtitle")}</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/mini-game" className="btn-accent">
                <Gamepad2 size={20} aria-hidden="true" />
                {t("home.heroCtaGame")}
              </Link>
              <Link
                to="/calculator"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border-2 border-white/70 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-white hover:text-sdg7-blue hover:scale-105 active:scale-95"
              >
                <Calculator size={20} aria-hidden="true" />
                {t("home.heroCtaCalculator")}
              </Link>
            </div>
          </div>

          {/* CSS-only renewable energy illustration */}
          <div className="relative h-72 sm:h-96 flex items-center justify-center" aria-hidden="true">
            <div className="absolute h-40 w-40 sm:h-56 sm:w-56 rounded-full bg-sdg7-yellow shadow-2xl shadow-yellow-500/40 animate-pulse-slow" />
            <div className="absolute h-40 w-40 sm:h-56 sm:w-56 rounded-full border-4 border-dashed border-yellow-200/60 animate-spin-slow" />

            {/* Wind turbine */}
            <div className="absolute left-2 sm:left-6 bottom-4 flex flex-col items-center animate-float">
              <svg viewBox="0 0 100 100" className="h-16 w-16 sm:h-20 sm:w-20 overflow-visible">
                <g className="animate-spin-slow" style={{ animationDuration: "3s", transformOrigin: "50px 50px" }}>
                  <rect x="47" y="10" width="6" height="40" rx="3" fill="white" />
                  <rect x="47" y="10" width="6" height="40" rx="3" fill="white" transform="rotate(120 50 50)" />
                  <rect x="47" y="10" width="6" height="40" rx="3" fill="white" transform="rotate(240 50 50)" />
                </g>
                <circle cx="50" cy="50" r="5" fill="#e2e8f0" />
              </svg>
              <div className="h-16 sm:h-24 w-1.5 bg-white/90 rounded" />
            </div>

            {/* Second turbine */}
            <div className="absolute right-4 sm:right-10 bottom-10 flex flex-col items-center animate-float-delayed scale-75">
              <svg viewBox="0 0 100 100" className="h-16 w-16 sm:h-20 sm:w-20 overflow-visible">
                <g className="animate-spin-slow" style={{ animationDuration: "3.5s", transformOrigin: "50px 50px" }}>
                  <rect x="47" y="10" width="6" height="40" rx="3" fill="white" />
                  <rect x="47" y="10" width="6" height="40" rx="3" fill="white" transform="rotate(120 50 50)" />
                  <rect x="47" y="10" width="6" height="40" rx="3" fill="white" transform="rotate(240 50 50)" />
                </g>
                <circle cx="50" cy="50" r="5" fill="#e2e8f0" />
              </svg>
              <div className="h-14 sm:h-20 w-1.5 bg-white/80 rounded" />
            </div>

            {/* Solar panel */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 grid grid-cols-3 gap-1 rotate-[-8deg] shadow-xl">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-5 w-5 sm:h-7 sm:w-7 bg-sdg7-blue-dark border border-blue-200/40 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="container-page py-16 text-center">
        <h2 className="section-title">{t("home.introTitle")}</h2>
        <p className="section-subtitle">{t("home.introText")}</p>
      </section>

      {/* Objectives */}
      <section className="bg-white py-16">
        <div className="container-page">
          <h2 className="section-title text-center">{t("home.objectivesTitle")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {objectives.map((obj, i) => (
              <div key={i} className="card p-7 animate-fade-in">
                <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${obj.color} text-white shadow-lg`}>
                  <obj.icon size={28} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{t(`home.${obj.titleKey}`)}</h3>
                <p className="text-slate-500 leading-relaxed">{t(`home.${obj.textKey}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-page text-center">
          <h2 className="section-title">{t("home.statsTitle")}</h2>
          <p className="section-subtitle">{t("home.statsSubtitle")}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={i} className="card p-6">
                <p className="text-3xl sm:text-4xl font-extrabold text-sdg7-green mb-2">{t(`home.${stat.valueKey}`)}</p>
                <p className="text-sm text-slate-500">{t(`home.${stat.labelKey}`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400 max-w-2xl mx-auto">{t("home.statsNote")}</p>
        </div>
      </section>

      {/* Renewable sources */}
      <section className="py-16 bg-white">
        <div className="container-page">
          <h2 className="section-title text-center">{t("home.sourcesTitle")}</h2>
          <p className="section-subtitle text-center">{t("home.sourcesSubtitle")}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sources.map((source, i) => (
              <Link
                to="/renewable-energy"
                key={i}
                className={`card p-6 ${source.bg} hover:-translate-y-1`}
              >
                <source.icon className={`${source.color} mb-4`} size={36} aria-hidden="true" />
                <h3 className="font-bold text-slate-800 mb-2">{t(`home.${source.nameKey}`)}</h3>
                <p className="text-sm text-slate-500">{t(`home.${source.shortKey}`)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What can you do */}
      <section className="py-16 bg-gradient-to-br from-sdg7-green-dark to-sdg7-green text-white">
        <div className="container-page">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-3">{t("home.actionTitle")}</h2>
          <p className="text-center text-green-50/90 max-w-2xl mx-auto mb-10">{t("home.actionSubtitle")}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                <action.icon size={24} className="shrink-0 mt-0.5 text-sdg7-yellow" aria-hidden="true" />
                <p className="text-sm leading-relaxed">{t(`home.${action.key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 text-white text-center">
        <div className="container-page">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t("home.ctaTitle")}</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8">{t("home.ctaText")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/mini-game" className="btn-accent">
              {t("home.ctaButtonGame")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/calculator" className="btn-secondary bg-transparent text-white border-white hover:bg-white hover:text-slate-900">
              {t("home.ctaButtonCalculator")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
