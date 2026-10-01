import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧" },
  { code: "ro", flag: "🇷🇴" },
  { code: "ru", flag: "🇷🇺" },
];

export default function LanguageSelector({ variant = "light" }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function changeLanguage(code) {
    i18n.changeLanguage(code);
    localStorage.setItem("etf_language", code);
    setOpen(false);
  }

  const textColor = variant === "light" ? "text-slate-700" : "text-white";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.selectLanguage")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium ${textColor} hover:bg-black/5 transition-colors`}
      >
        <Globe size={18} aria-hidden="true" />
        <span>{LANGUAGES.find((l) => l.code === i18n.language)?.flag || "🌐"}</span>
        <span className="hidden sm:inline">{t(`language.${i18n.language}`)}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-fade-in"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={i18n.language === lang.code}
                onClick={() => changeLanguage(lang.code)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-sdg7-green/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{t(`language.${lang.code}`)}</span>
                </span>
                {i18n.language === lang.code && <Check size={16} className="text-sdg7-green" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
