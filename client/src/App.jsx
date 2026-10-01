import { Routes, Route } from "react-router-dom";
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
import ScrollToTop from "./components/ScrollToTop.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
