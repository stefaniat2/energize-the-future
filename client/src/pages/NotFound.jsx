import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Zap } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container-page py-24 text-center flex flex-col items-center gap-6">
      <Zap size={56} className="text-sdg7-yellow" aria-hidden="true" />
      <h1 className="text-5xl font-extrabold text-slate-800">404</h1>
      <p className="text-slate-500 max-w-md">
        This page seems to have run out of power. Let's get you back to a brighter path.
      </p>
      <Link to="/" className="btn-primary">
        <Home size={18} aria-hidden="true" />
        {t("nav.home")}
      </Link>
    </div>
  );
}
