import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import AboutSDG7 from "./pages/AboutSDG7.jsx";
import RenewableEnergy from "./pages/RenewableEnergy.jsx";
import EnergyTips from "./pages/EnergyTips.jsx";
import FunFacts from "./pages/FunFacts.jsx";
import MiniGame from "./pages/MiniGame.jsx";
import EnergyCalculator from "./pages/EnergyCalculator.jsx";
import Community from "./pages/Community.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";
import AIUsage from "./pages/AIUsage.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

// Route -> translation key used for the browser tab title.
const PAGE_TITLE_KEYS = {
  "/": "nav.home",
  "/about": "nav.about",
  "/renewable-energy": "nav.renewable",
  "/energy-tips": "nav.tips",
  "/fun-facts": "nav.facts",
  "/mini-game": "nav.game",
  "/calculator": "nav.calculator",
  "/community": "nav.community",
  "/contact": "nav.contact",
  "/ai-usage": "nav.ai",
};

export default function App() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  // Keep <html lang> in sync so screen readers pronounce the page correctly.
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Translated, page-specific browser tab title.
  useEffect(() => {
    const key = PAGE_TITLE_KEYS[pathname];
    const brand = t("brand.name");
    document.title = key ? `${t(key)} | ${brand}` : `404 | ${brand}`;
  }, [pathname, i18n.language, t]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-sdg7-green focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
      >
        {t("a11y.skipToContent")}
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-screen flex-1 outline-none">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutSDG7 />} />
          <Route path="/renewable-energy" element={<RenewableEnergy />} />
          <Route path="/energy-tips" element={<EnergyTips />} />
          <Route path="/fun-facts" element={<FunFacts />} />
          <Route path="/mini-game" element={<MiniGame />} />
          <Route path="/calculator" element={<EnergyCalculator />} />
          <Route path="/community" element={<Community />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ai-usage" element={<AIUsage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
