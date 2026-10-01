import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, CheckCircle2, AlertCircle, Mail, ExternalLink } from "lucide-react";
import { api } from "../services/api.js";

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
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
      await api.submitContactMessage(form);
      setStatus("success");
      setForm(EMPTY_FORM);
    } catch (err) {
      setStatus("error");
      setErrors(err.errors && err.errors.length > 0 ? err.errors : [err.message]);
    }
  }

  return (
    <div>
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="container-page text-center">
          <Mail size={44} className="mx-auto mb-4 text-sdg7-yellow" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("contact.pageTitle")}</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">{t("contact.pageSubtitle")}</p>
        </div>
      </header>

      <div className="container-page py-16 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="card p-7">
            {status === "success" ? (
              <div className="text-center py-8 animate-fade-in">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-sdg7-green" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{t("contact.successTitle")}</h2>
                <p className="text-slate-500 mb-6">{t("contact.successText")}</p>
                <button type="button" onClick={() => setStatus("idle")} className="btn-primary">
                  {t("contact.sendAnother")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <h2 className="font-bold text-slate-800 text-lg mb-1">{t("contact.formTitle")}</h2>

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
                    <label htmlFor="ct-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t("contact.name")}
                    </label>
                    <input
                      id="ct-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="ct-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t("contact.email")}
                    </label>
                    <input
                      id="ct-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ct-subject" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t("contact.subject")}
                  </label>
                  <input
                    id="ct-subject"
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => updateField("subject", e.target.value)}
                    placeholder={t("contact.subjectPlaceholder")}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="ct-message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t("contact.message")}
                  </label>
                  <textarea
                    id="ct-message"
                    required
                    minLength={10}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    placeholder={t("contact.messagePlaceholder")}
                    className="textarea"
                  />
                </div>

                <button type="submit" disabled={status === "submitting"} className="btn-primary w-full sm:w-auto disabled:opacity-60">
                  <Send size={18} aria-hidden="true" />
                  {status === "submitting" ? t("contact.sending") : t("contact.sendButton")}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-7">
            <h2 className="font-bold text-slate-800 text-lg mb-3">{t("contact.infoTitle")}</h2>
            <p className="text-slate-500 leading-relaxed mb-4">{t("contact.infoText")}</p>
            <a
              href="https://sdgs.un.org/goals/goal7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-sdg7-blue hover:underline"
            >
              {t("contact.learnMoreUn")}
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
