import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { api } from "../services/api.js";

const CATEGORY_OPTIONS = [
  { value: "renewable-energy", key: "categoryRenewable" },
  { value: "energy-efficiency", key: "categoryEfficiency" },
  { value: "education", key: "categoryEducation" },
  { value: "transportation", key: "categoryTransportation" },
  { value: "community-projects", key: "categoryCommunity" },
  { value: "other", key: "categoryOther" },
];

const EMPTY_FORM = { name: "", email: "", category: "", message: "" };

export default function Community() {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errors, setErrors] = useState([]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setErrors([]);
    try {
      await api.submitSuggestion(form);
      setStatus("success");
      setForm(EMPTY_FORM);
    } catch (err) {
      setStatus("error");
      setErrors(err.errors && err.errors.length > 0 ? err.errors : [err.message]);
    }
  }

  function submitAnother() {
    setStatus("idle");
    setErrors([]);
  }

  return (
    <div>
      <header className="bg-gradient-to-br from-sdg7-green-dark to-sdg7-green text-white py-16">
        <div className="container-page text-center">
          <Users size={44} className="mx-auto mb-4 text-sdg7-yellow" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("community.pageTitle")}</h1>
          <p className="text-lg text-green-50/90 max-w-2xl mx-auto">{t("community.pageSubtitle")}</p>
        </div>
      </header>

      <div className="container-page py-16 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card p-7">
            <h2 className="font-bold text-slate-800 text-lg mb-3">{t("community.whySubmitTitle")}</h2>
            <p className="text-slate-500 leading-relaxed">{t("community.whySubmitText")}</p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card p-7">
            {status === "success" ? (
              <div className="text-center py-8 animate-fade-in">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-sdg7-green" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{t("community.successTitle")}</h2>
                <p className="text-slate-500 mb-6">{t("community.successText")}</p>
                <button type="button" onClick={submitAnother} className="btn-primary">
                  {t("community.submitAnother")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <h2 className="font-bold text-slate-800 text-lg mb-1">{t("community.formTitle")}</h2>

                {status === "error" && errors.length > 0 && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4" role="alert">
                    <p className="flex items-center gap-2 font-semibold text-red-700 mb-2">
                      <AlertCircle size={18} aria-hidden="true" />
                      {t("community.errorTitle")}
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                      {errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="c-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t("community.name")}
                    </label>
                    <input
                      id="c-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder={t("community.namePlaceholder")}
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="c-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t("community.email")}
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder={t("community.emailPlaceholder")}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="c-category" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t("community.category")}
                  </label>
                  <select
                    id="c-category"
                    required
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="select"
                  >
                    <option value="" disabled>
                      {t("community.selectCategory")}
                    </option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(`community.${opt.key}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="c-message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t("community.message")}
                  </label>
                  <textarea
                    id="c-message"
                    required
                    minLength={10}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    placeholder={t("community.messagePlaceholder")}
                    className="textarea"
                  />
                </div>

                <button type="submit" disabled={status === "submitting"} className="btn-primary w-full sm:w-auto disabled:opacity-60">
                  <Send size={18} aria-hidden="true" />
                  {status === "submitting" ? t("community.submitting") : t("community.submitButton")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
