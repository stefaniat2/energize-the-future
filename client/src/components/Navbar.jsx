import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Zap } from "lucide-react";
import LanguageSelector from "./LanguageSelector.jsx";

export default function Navbar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const links = [
    { to: "/", key: "home" },
    { to: "/about", key: "about" },
    { to: "/renewable-energy", key: "renewable" },
    { to: "/energy-tips", key: "tips" },
    { to: "/fun-facts", key: "facts" },
    { to: "/mini-game", key: "game" },
    { to: "/calculator", key: "calculator" },
    { to: "/community", key: "community" },
    { to: "/contact", key: "contact" },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkClass = ({ isActive }) =>
    `block w-full px-4 py-2.5 text-sm font-medium transition-colors ${
      isActive ? "bg-sdg7-green text-white" : "text-slate-700 hover:bg-sdg7-green/10"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <nav className="container-page flex items-center justify-between h-16" aria-label="Main navigation">
        <NavLink to="/" className="flex items-center gap-2 font-extrabold text-lg text-slate-800 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sdg7-green via-sdg7-blue to-sdg7-yellow text-white shadow-md">
            <Zap size={20} fill="white" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">{t("brand.name")}</span>
        </NavLink>

        <div className="flex items-center gap-2" ref={menuRef}>
          <LanguageSelector />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={linkClass}
                    end={link.to === "/"}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(`nav.${link.key}`)}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
