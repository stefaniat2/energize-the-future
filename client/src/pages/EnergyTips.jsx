import { useTranslation } from "react-i18next";
import {
  Home as HomeIcon, School, Bus, Cpu, Building, CheckCircle2, Circle,
  RotateCcw, TrendingDown,
} from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

const CATEGORIES = [
  { key: "home", icon: HomeIcon, labelKey: "categoryHome", items: ["home1", "home2", "home3", "home4", "home5", "home6"] },
  { key: "school", icon: School, labelKey: "categorySchool", items: ["school1", "school2", "school3", "school4"] },
  { key: "transport", icon: Bus, labelKey: "categoryTransport", items: ["transport1", "transport2", "transport3", "transport4"] },
  { key: "tech", icon: Cpu, labelKey: "categoryTech", items: ["tech1", "tech2", "tech3"] },
  { key: "public", icon: Building, labelKey: "categoryPublic", items: ["public1", "public2", "public3"] },
];

const ALL_ITEM_IDS = CATEGORIES.flatMap((cat) => cat.items);

const DIFFICULTY_COLOR = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export default function EnergyTips() {
  const { t } = useTranslation();
  const [completed, setCompleted] = useLocalStorage("etf_completed_tips", []);

  function toggleTip(id) {
    setCompleted((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function resetProgress() {
    setCompleted([]);
  }

  const total = ALL_ITEM_IDS.length;
  const completedCount = completed.filter((id) => ALL_ITEM_IDS.includes(id)).length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div>
      <header className="bg-gradient-to-br from-sdg7-yellow-dark to-sdg7-yellow text-slate-900 py-16">
        <div className="container-page text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("tips.pageTitle")}</h1>
          <p className="text-lg text-slate-800/80 max-w-2xl mx-auto">{t("tips.pageSubtitle")}</p>
        </div>
      </header>

      {/* Progress tracker */}
      <section className="container-page -mt-10 relative z-10">
        <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#2F9E44"
                strokeWidth="4"
                strokeDasharray={`${percent} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-extrabold text-slate-800">
              {percent}%
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-bold text-slate-800 text-lg mb-1">{t("tips.progressTitle")}</h2>
            <p className="text-slate-500">{t("tips.progressText", { completed: completedCount, total })}</p>
            {completedCount === total && total > 0 && (
              <p className="mt-2 font-semibold text-sdg7-green">{t("tips.progressComplete")}</p>
            )}
          </div>
          <button type="button" onClick={resetProgress} className="btn-secondary shrink-0">
            <RotateCcw size={16} aria-hidden="true" />
            {t("tips.resetProgress")}
          </button>
        </div>
      </section>

      {/* Categories */}
      <div className="container-page py-16 space-y-14">
        {CATEGORIES.map((cat) => (
          <section key={cat.key} aria-labelledby={`cat-${cat.key}`}>
            <h2 id={`cat-${cat.key}`} className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sdg7-green/10 text-sdg7-green">
                <cat.icon size={22} aria-hidden="true" />
              </span>
              {t(`tips.${cat.labelKey}`)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.items.map((itemId) => {
                const item = t(`tips.items.${itemId}`, { returnObjects: true });
                const isDone = completed.includes(itemId);
                return (
                  <div
                    key={itemId}
                    className={`card p-5 transition-all ${isDone ? "ring-2 ring-sdg7-green bg-green-50/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-800">{item.title}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${DIFFICULTY_COLOR[item.difficulty]}`}>
                        {t(`common.${item.difficulty}`)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.text}</p>
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-sdg7-blue">
                      <TrendingDown size={14} aria-hidden="true" />
                      {t("tips.savingPotential")}: {item.saving}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleTip(itemId)}
                      aria-pressed={isDone}
                      className={`mt-4 w-full flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        isDone
                          ? "bg-sdg7-green text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
                      {isDone ? t("tips.markUndone") : t("tips.markDone")}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
