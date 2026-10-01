import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap, ExternalLink } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();

  const quickLinks = [
    { to: "/about", key: "about" },
    { to: "/renewable-energy", key: "renewable" },
    { to: "/energy-tips", key: "tips" },
    { to: "/mini-game", key: "game" },
    { to: "/calculator", key: "calculator" },
  ];

  const resources = [
    { href: "https://sdgs.un.org/goals", key: "unSdgSite" },
    { href: "https://sdgs.un.org/goals/goal7", key: "unSdg7Site" },
    { href: "https://www.irena.org/", key: "irena" },
    { href: "https://www.iea.org/", key: "iea" },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container-page py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white font-extrabold text-lg mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sdg7-green via-sdg7-blue to-sdg7-yellow">
              <Zap size={20} fill="white" aria-hidden="true" />
            </span>
            {t("brand.name")}
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{t("footer.about")}</p>
        </div>

        <nav aria-label="Footer quick links">
          <h3 className="text-white font-semibold mb-4">{t("footer.quickLinks")}</h3>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-sdg7-yellow transition-colors">
                  {t(`nav.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer resources">
          <h3 className="text-white font-semibold mb-4">{t("footer.resources")}</h3>
          <ul className="space-y-2 text-sm">
            {resources.map((res) => (
              <li key={res.href}>
                <a
                  href={res.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-sdg7-yellow transition-colors"
                >
                  {t(`footer.${res.key}`)}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-white font-semibold mb-4">{t("nav.contact")}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/contact" className="hover:text-sdg7-yellow transition-colors">
                {t("nav.contact")}
              </Link>
            </li>
            <li>
              <Link to="/community" className="hover:text-sdg7-yellow transition-colors">
                {t("nav.community")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>{t("footer.rightsReserved")}</p>
          <p>{t("footer.madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}
