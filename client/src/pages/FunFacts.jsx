import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Shuffle, ArrowRight, Heart, Share2, Sun, Wind, CloudSun, Gauge, Droplets, Cpu } from "lucide-react";
import { api } from "../services/api.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { Loading, ErrorState } from "../components/StatusMessage.jsx";

const CATEGORY_META = {
  solar: { icon: Sun, labelKey: "categorySolar", color: "text-sdg7-yellow", bg: "bg-yellow-50" },
  wind: { icon: Wind, labelKey: "categoryWind", color: "text-sdg7-blue", bg: "bg-blue-50" },
  climate: { icon: CloudSun, labelKey: "categoryClimate", color: "text-sky-600", bg: "bg-sky-50" },
  efficiency: { icon: Gauge, labelKey: "categoryEfficiency", color: "text-sdg7-green", bg: "bg-green-50" },
  hydropower: { icon: Droplets, labelKey: "categoryHydropower", color: "text-cyan-600", bg: "bg-cyan-50" },
  technology: { icon: Cpu, labelKey: "categoryTechnology", color: "text-indigo-600", bg: "bg-indigo-50" },
};

export default function FunFacts() {
  const { t, i18n } = useTranslation();
  const [facts, setFacts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [category, setCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [favorites, setFavorites] = useLocalStorage("etf_favorite_facts", []);

  const loadFacts = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await api.getFacts(i18n.language);
      setFacts(data);
      setCurrentIndex(0);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
    }
  }, [i18n.language]);

  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  const filteredFacts = useMemo(() => {
    let list = facts;
    if (category !== "all") list = list.filter((f) => f.category === category);
    if (showFavoritesOnly) list = list.filter((f) => favorites.includes(f.id));
    return list;
  }, [facts, category, showFavoritesOnly, favorites]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [category, showFavoritesOnly]);

  if (status === "loading") return <Loading />;
  if (status === "error") return <ErrorState message={t("facts.loadError")} onRetry={loadFacts} />;

  const currentFact = filteredFacts[currentIndex];

  function goNext() {
    if (filteredFacts.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredFacts.length);
  }

  function goRandom() {
    if (filteredFacts.length === 0) return;
    let nextIndex = Math.floor(Math.random() * filteredFacts.length);
    if (filteredFacts.length > 1 && nextIndex === currentIndex) {
      nextIndex = (nextIndex + 1) % filteredFacts.length;
    }
    setCurrentIndex(nextIndex);
  }

  function toggleFavorite(id) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function shareFact() {
    if (!currentFact) return;
    const text = currentFact.text;
    try {
      if (navigator.share) {
        await navigator.share({ text, title: t("brand.name") });
      } else {
        await navigator.clipboard.writeText(text);
        setCopiedId(currentFact.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // User cancelled the share dialog — nothing to do.
    }
  }

  const categories = Object.keys(CATEGORY_META);

  return (
    <div>
      <header className="bg-gradient-to-br from-sdg7-blue-dark to-sdg7-blue text-white py-16">
        <div className="container-page text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("facts.pageTitle")}</h1>
          <p className="text-lg text-blue-50/90 max-w-2xl mx-auto">{t("facts.pageSubtitle")}</p>
        </div>
      </header>

      <div className="container-page py-16">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              category === "all" ? "bg-sdg7-blue text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t("common.allCategories")}
          </button>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  category === cat ? "bg-sdg7-blue text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <meta.icon size={14} aria-hidden="true" />
                {t(`facts.${meta.labelKey}`)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
            aria-pressed={showFavoritesOnly}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              showFavoritesOnly ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Heart size={14} aria-hidden="true" fill={showFavoritesOnly ? "white" : "none"} />
            {t("facts.myFavorites")} ({favorites.length})
          </button>
        </div>

        {/* Fact card */}
        <div className="max-w-2xl mx-auto">
          {filteredFacts.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">
              {showFavoritesOnly ? t("facts.noFavorites") : t("facts.loadError")}
            </div>
          ) : (
            <div className="card p-8 sm:p-10 text-center animate-fade-in">
              {currentFact && (
                <>
                  {(() => {
                    const meta = CATEGORY_META[currentFact.category];
                    if (!meta) return null;
                    return (
                      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 ${meta.bg} ${meta.color}`}>
                        <meta.icon size={16} aria-hidden="true" />
                        {t(`facts.${meta.labelKey}`)}
                      </span>
                    );
                  })()}
                  <p className="text-xl sm:text-2xl font-medium text-slate-800 leading-relaxed mb-8">
                    {currentFact.text}
                  </p>
                  <p className="text-sm text-slate-400 mb-6">
                    {t("facts.factCounter", { current: currentIndex + 1, total: filteredFacts.length })}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button type="button" onClick={() => toggleFavorite(currentFact.id)} className="btn-secondary" aria-pressed={favorites.includes(currentFact.id)}>
                      <Heart size={18} fill={favorites.includes(currentFact.id) ? "currentColor" : "none"} aria-hidden="true" />
                      {favorites.includes(currentFact.id) ? t("facts.unfavorite") : t("facts.favorite")}
                    </button>
                    <button type="button" onClick={shareFact} className="btn-secondary">
                      <Share2 size={18} aria-hidden="true" />
                      {copiedId === currentFact.id ? t("facts.shareCopied") : t("facts.shareFact")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button type="button" onClick={goRandom} className="btn-primary" disabled={filteredFacts.length === 0}>
              <Shuffle size={18} aria-hidden="true" />
              {t("facts.randomFact")}
            </button>
            <button type="button" onClick={goNext} className="btn-accent" disabled={filteredFacts.length === 0}>
              {t("facts.nextFact")}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
