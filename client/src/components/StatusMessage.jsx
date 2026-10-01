import { useTranslation } from "react-i18next";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

export function Loading({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <Loader2 className="animate-spin text-sdg7-green" size={36} aria-hidden="true" />
      <p>{label || t("common.loading")}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center" role="alert">
      <AlertTriangle className="text-red-500" size={36} aria-hidden="true" />
      <p className="text-slate-600 max-w-md">{message || t("common.error")}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-2">
          <RefreshCw size={16} aria-hidden="true" />
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
