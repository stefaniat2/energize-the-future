import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Pencil, Calculator, RotateCcw, Zap, Cloud, DollarSign } from "lucide-react";

// Average grid CO2 emission factor (kg of CO2 per kWh). This is a global approximation;
// the actual value depends heavily on each country's specific electricity mix.
const CO2_FACTOR_KG_PER_KWH = 0.45;

const EMPTY_FORM = { name: "", power: "", hoursPerDay: "", daysPerMonth: "", pricePerKwh: "" };

export default function EnergyCalculator() {
  const { t } = useTranslation();
  const [appliances, setAppliances] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateForm() {
    const { name, power, hoursPerDay, daysPerMonth, pricePerKwh } = form;
    const numericFields = [power, hoursPerDay, daysPerMonth, pricePerKwh];
    if (!name.trim()) return false;
    if (numericFields.some((v) => v === "" || Number.isNaN(Number(v)) || Number(v) < 0)) return false;
    if (Number(hoursPerDay) > 24 || Number(daysPerMonth) > 31) return false;
    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      setFormError(t("calculator.formError"));
      return;
    }
    setFormError("");

    const applianceData = {
      name: form.name.trim(),
      power: Number(form.power),
      hoursPerDay: Number(form.hoursPerDay),
      daysPerMonth: Number(form.daysPerMonth),
      pricePerKwh: Number(form.pricePerKwh),
    };

    if (editingId) {
      setAppliances((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...applianceData } : a)));
      setEditingId(null);
    } else {
      setAppliances((prev) => [...prev, { id: Date.now(), ...applianceData }]);
    }
    setForm(EMPTY_FORM);
  }

  function startEdit(appliance) {
    setEditingId(appliance.id);
    setForm({
      name: appliance.name,
      power: String(appliance.power),
      hoursPerDay: String(appliance.hoursPerDay),
      daysPerMonth: String(appliance.daysPerMonth),
      pricePerKwh: String(appliance.pricePerKwh),
    });
    setFormError("");
  }

  function removeAppliance(id) {
    setAppliances((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  }

  function resetAll() {
    setAppliances([]);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  }

  const computed = useMemo(
    () =>
      appliances.map((a) => {
        const daily = (a.power / 1000) * a.hoursPerDay;
        const monthly = daily * a.daysPerMonth;
        const monthlyCost = monthly * a.pricePerKwh;
        const yearlyCost = monthlyCost * 12;
        const co2Monthly = monthly * CO2_FACTOR_KG_PER_KWH;
        return { ...a, daily, monthly, monthlyCost, yearlyCost, co2Monthly };
      }),
    [appliances]
  );

  const totals = useMemo(
    () =>
      computed.reduce(
        (acc, a) => ({
          daily: acc.daily + a.daily,
          monthly: acc.monthly + a.monthly,
          monthlyCost: acc.monthlyCost + a.monthlyCost,
          yearlyCost: acc.yearlyCost + a.yearlyCost,
          co2Monthly: acc.co2Monthly + a.co2Monthly,
        }),
        { daily: 0, monthly: 0, monthlyCost: 0, yearlyCost: 0, co2Monthly: 0 }
      ),
    [computed]
  );

  function fmt(n, digits = 2) {
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
  }

  return (
    <div>
      <header className="bg-gradient-to-br from-sdg7-blue-dark to-sdg7-blue text-white py-16">
        <div className="container-page text-center">
          <Calculator size={44} className="mx-auto mb-4 text-sdg7-yellow" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("calculator.pageTitle")}</h1>
          <p className="text-lg text-blue-50/90 max-w-2xl mx-auto">{t("calculator.pageSubtitle")}</p>
        </div>
      </header>

      <div className="container-page py-16 grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card p-6 space-y-4 sticky top-24">
            <h2 className="font-bold text-slate-800 text-lg mb-2">{t("calculator.addAppliance")}</h2>

            <Field label={t("calculator.applianceName")} htmlFor="app-name">
              <input
                id="app-name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={t("calculator.applianceNamePlaceholder")}
                className="input"
              />
            </Field>

            <Field label={t("calculator.power")} htmlFor="app-power">
              <input
                id="app-power"
                type="number"
                min="0"
                value={form.power}
                onChange={(e) => updateField("power", e.target.value)}
                className="input"
              />
            </Field>

            <Field label={t("calculator.hoursPerDay")} htmlFor="app-hours">
              <input
                id="app-hours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.hoursPerDay}
                onChange={(e) => updateField("hoursPerDay", e.target.value)}
                className="input"
              />
            </Field>

            <Field label={t("calculator.daysPerMonth")} htmlFor="app-days">
              <input
                id="app-days"
                type="number"
                min="0"
                max="31"
                value={form.daysPerMonth}
                onChange={(e) => updateField("daysPerMonth", e.target.value)}
                className="input"
              />
            </Field>

            <Field label={t("calculator.pricePerKwh")} htmlFor="app-price">
              <input
                id="app-price"
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerKwh}
                onChange={(e) => updateField("pricePerKwh", e.target.value)}
                className="input"
              />
            </Field>

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <button type="submit" className="btn-primary w-full">
              {editingId ? <Pencil size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
              {editingId ? t("calculator.update") : t("calculator.addAppliance")}
            </button>
          </form>
        </div>

        {/* Appliances + totals */}
        <div className="lg:col-span-3 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-lg">{t("calculator.yourAppliances")}</h2>
              {appliances.length > 0 && (
                <button type="button" onClick={resetAll} className="btn-secondary text-sm !px-4 !py-2">
                  <RotateCcw size={14} aria-hidden="true" />
                  {t("calculator.resetAll")}
                </button>
              )}
            </div>

            {computed.length === 0 ? (
              <div className="card p-8 text-center text-slate-400">{t("calculator.noAppliances")}</div>
            ) : (
              <div className="space-y-4">
                {computed.map((a) => (
                  <div key={a.id} className="card p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-bold text-slate-800">{a.name}</h3>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(a)}
                          aria-label={t("calculator.edit")}
                          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-sdg7-blue"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAppliance(a.id)}
                          aria-label={t("calculator.remove")}
                          className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <Stat label={t("calculator.dailyConsumption")} value={`${fmt(a.daily)} kWh`} />
                      <Stat label={t("calculator.monthlyConsumption")} value={`${fmt(a.monthly)} kWh`} />
                      <Stat label={t("calculator.monthlyCost")} value={fmt(a.monthlyCost)} />
                      <Stat label={t("calculator.yearlyCost")} value={fmt(a.yearlyCost)} />
                      <Stat label={t("calculator.co2Emissions")} value={`${fmt(a.co2Monthly)} kg`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {computed.length > 0 && (
            <div className="card p-6 bg-gradient-to-br from-sdg7-green-dark to-sdg7-green text-white">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap size={20} aria-hidden="true" />
                {t("calculator.totalsTitle")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <TotalStat label={t("calculator.totalDaily")} value={`${fmt(totals.daily)} kWh`} />
                <TotalStat label={t("calculator.totalMonthly")} value={`${fmt(totals.monthly)} kWh`} />
                <TotalStat
                  label={t("calculator.totalMonthlyCost")}
                  value={fmt(totals.monthlyCost)}
                  icon={DollarSign}
                />
                <TotalStat label={t("calculator.totalYearlyCost")} value={fmt(totals.yearlyCost)} icon={DollarSign} />
                <TotalStat label={t("calculator.totalCo2")} value={`${fmt(totals.co2Monthly)} kg`} icon={Cloud} />
              </div>
            </div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            {t("calculator.co2Disclaimer")}
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-2">{t("calculator.efficiencyTipsTitle")}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t("calculator.efficiencyTipsText")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function TotalStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-xs text-green-50/80 mb-1">{label}</p>
      <p className="font-bold flex items-center gap-1">
        {Icon && <Icon size={14} aria-hidden="true" />}
        {value}
      </p>
    </div>
  );
}
