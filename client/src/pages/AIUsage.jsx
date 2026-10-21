import { useTranslation } from "react-i18next";
import { Bot, UserCheck, BookOpenCheck, Scale, ShieldCheck, TriangleAlert, ExternalLink } from "lucide-react";

// Proper nouns and licence names are not translated.
const OPEN_SOURCE = [
  ["React", "MIT"],
  ["Vite", "MIT"],
  ["Tailwind CSS", "MIT"],
  ["React Router", "MIT"],
  ["i18next / react-i18next", "MIT"],
  ["Lucide icons", "ISC"],
  ["Express", "MIT"],
  ["better-sqlite3", "MIT"],
  ["Poppins font", "SIL OFL 1.1"],
];

export default function AIUsage() {
  const { t } = useTranslation();

  const sections = [
    { icon: Bot, title: "ai.toolsTitle", text: "ai.toolsText" },
    { icon: UserCheck, title: "ai.humanTitle", text: "ai.humanText" },
    { icon: BookOpenCheck, title: "ai.factsTitle", text: "ai.factsText" },
    { icon: ShieldCheck, title: "ai.privacyTitle", text: "ai.privacyText" },
    { icon: TriangleAlert, title: "ai.limitsTitle", text: "ai.limitsText" },
  ];

  return (
    <div>
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="container-page text-center">
          <Bot size={44} className="mx-auto mb-4 text-sdg7-yellow" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("ai.pageTitle")}</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">{t("ai.pageSubtitle")}</p>
        </div>
      </header>

      <div className="container-page py-16 space-y-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="card p-7">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sdg7-blue/10 text-sdg7-blue">
                <section.icon size={24} aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t(section.title)}</h2>
              <p className="text-slate-600 leading-relaxed">{t(section.text)}</p>
            </section>
          ))}
        </div>

        <section className="card p-7" aria-labelledby="licenses-title">
          <h2 id="licenses-title" className="flex items-center gap-2 text-xl font-bold text-slate-800 mb-4">
            <Scale size={22} className="text-sdg7-green" aria-hidden="true" />
            {t("ai.licensesTitle")}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            {OPEN_SOURCE.map(([name, license]) => (
              <li key={name} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-700">{name}</span>
                <span className="text-slate-500">{license}</span>
              </li>
            ))}
          </ul>
          <p className="text-slate-600 leading-relaxed mb-4">{t("ai.imagesText")}</p>
          <a
            href="https://github.com/stefaniat2/energize-the-future"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-sdg7-blue hover:underline"
          >
            GitHub
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        </section>
      </div>
    </div>
  );
}
