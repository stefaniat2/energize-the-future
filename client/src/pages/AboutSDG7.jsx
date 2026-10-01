import { useTranslation } from "react-i18next";
import {
  Landmark, Target, DollarSign, Leaf, Fuel, Users2, CloudRain,
  Gauge, Building2, Briefcase, User, CheckCircle2,
} from "lucide-react";

export default function AboutSDG7() {
  const { t } = useTranslation();

  const sections = [
    { icon: Landmark, titleKey: "unTitle", textKey: "unText" },
    { icon: Target, titleKey: "sdgTitle", textKey: "sdgText" },
    { icon: DollarSign, titleKey: "whyAffordableTitle", textKey: "whyAffordableText" },
    { icon: Leaf, titleKey: "whyCleanTitle", textKey: "whyCleanText" },
    { icon: Fuel, titleKey: "fossilTitle", textKey: "fossilText" },
    { icon: Users2, titleKey: "povertyTitle", textKey: "povertyText" },
    { icon: CloudRain, titleKey: "climateTitle", textKey: "climateText" },
    { icon: Gauge, titleKey: "efficiencyTitle", textKey: "efficiencyText" },
  ];

  const timeline = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    year: t(`about.timeline${n}Year`),
    text: t(`about.timeline${n}Text`),
  }));

  const targets = [1, 2, 3, 4, 5].map((n) => t(`about.target${n}`));

  const helpers = [
    { icon: Building2, textKey: "helpGovText" },
    { icon: Briefcase, textKey: "helpBusinessText" },
    { icon: User, textKey: "helpIndividualText" },
  ];

  return (
    <div>
      <header className="bg-gradient-to-br from-sdg7-blue-dark to-sdg7-blue text-white py-16">
        <div className="container-page text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("about.pageTitle")}</h1>
          <p className="text-lg text-blue-50/90 max-w-2xl mx-auto">{t("about.pageSubtitle")}</p>
        </div>
      </header>

      <section className="container-page py-16 grid gap-8 md:grid-cols-2">
        {sections.map((s, i) => (
          <div key={i} className="card p-7">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sdg7-blue/10 text-sdg7-blue">
              <s.icon size={24} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{t(`about.${s.titleKey}`)}</h2>
            <p className="text-slate-500 leading-relaxed">{t(`about.${s.textKey}`)}</p>
          </div>
        ))}
      </section>

      {/* How everyone can help */}
      <section className="bg-white py-16">
        <div className="container-page">
          <h2 className="section-title text-center">{t("about.helpTitle")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {helpers.map((h, i) => (
              <div key={i} className="card p-7 text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sdg7-green/10 text-sdg7-green">
                  <h.icon size={26} aria-hidden="true" />
                </div>
                <p className="text-slate-500 leading-relaxed">{t(`about.${h.textKey}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-page">
          <h2 className="section-title text-center">{t("about.timelineTitle")}</h2>
          <p className="section-subtitle text-center">{t("about.timelineSubtitle")}</p>

          <ol className="mt-12 relative border-l-2 border-sdg7-green/30 ml-4 sm:ml-0 sm:pl-0 space-y-10 sm:space-y-8 sm:border-l-0">
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-sdg7-green/30 -translate-x-1/2" />
            {timeline.map((item, i) => (
              <li
                key={i}
                className={`relative sm:flex sm:items-center sm:w-full ${
                  i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                <div className="sm:w-1/2 sm:px-8">
                  <div className={`card p-5 ${i % 2 === 0 ? "sm:text-right" : "sm:text-left"}`}>
                    <p className="font-extrabold text-sdg7-green text-lg mb-1">{item.year}</p>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
                <span className="absolute -left-[9px] sm:left-1/2 top-1 sm:top-1/2 h-4 w-4 -translate-y-0 sm:-translate-x-1/2 sm:-translate-y-1/2 rounded-full bg-sdg7-green ring-4 ring-white" />
                <div className="hidden sm:block sm:w-1/2" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Targets */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container-page">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-3">{t("about.targetsTitle")}</h2>
          <p className="text-center text-slate-300 max-w-2xl mx-auto mb-10">{t("about.targetsSubtitle")}</p>
          <ul className="space-y-4 max-w-3xl mx-auto">
            {targets.map((target, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-white/5 p-4">
                <CheckCircle2 className="shrink-0 mt-0.5 text-sdg7-yellow" size={22} aria-hidden="true" />
                <p className="text-slate-200 leading-relaxed">{target}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
