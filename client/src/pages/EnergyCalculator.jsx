import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, Trash2, Pencil, Calculator, RotateCcw, Zap, Cloud, Coins, TreePine, Scale, ArrowRight,
} from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { calculateAppliance, sumResults, treesNeededPerYear, efficiencySavings } from "../utils/energy.js";

const CURRENCIES = ["USD", "EUR", "RON", "MDL"];

const EMPTY_FORM = { name: "", power: "", hoursPerDay: "", daysPerMonth: "", pricePerKwh: "" };

// Typical illustrative values (average power draw while in use). Real appliances vary.
const COMPARISON_PRESETS = [
  { id: "bulb", oldWatts: 60, newWatts: 9, hoursPerDay: 5 },
  { id: "fridge", oldWatts: 90, newWatts: 30, hoursPerDay: 24 },
  { id: "tv", oldWatts: 200, newWatts: 60, hoursPerDay: 4 },
  { id: "ac", oldWatts: 1500, newWatts: 900, hoursPerDay: 6 },
];

export default function EnergyCalculator() {
  const { t, i18n } = useTranslation();
  const [appliances, setAppliances] = useLocalStorage("etf_appliances", []);
  const [currency, setCurrency] = useLocalStorage("etf_currency", "USD");
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

  function addPresetAppliance(appliance) {
    setAppliances((prev) => [...prev, { id: Date.now(), ...appliance }]);
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
    () => appliances.map((a) => ({ ...a, ...calculateAppliance(a) })),
    [appliances]
  );

  const totals = useMemo(() => sumResults(computed), [computed]);
  const treesNeeded = treesNeededPerYear(totals.co2Monthly);

  function fmt(n, digits = 2) {
    return Number(n).toLocaleString(i18n.language, { maximumFractionDigits: digits });
  }

  function money(n) {
    return Number(n).toLocaleString(i18n.language, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
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
          <form onSubmit={handleSubmit} className="card p-6 space-y-4 lg:sticky lg:top-24">
            <h2 className="font-bold text-slate-800 text-lg mb-2">
              {editingId ? t("calculator.editAppliance") : t("calculator.addAppliance")}
            </h2>

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
                inputMode="decimal"
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
                inputMode="decimal"
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
                inputMode="numeric"
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
                inputMode="decimal"
                value={form.pricePerKwh}
                onChange={(e) => updateField("pricePerKwh", e.target.value)}
                className="input"
              />
            </Field>

            <Field label={t("calculator.currency")} htmlFor="app-currency">
              <select
                id="app-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="select"
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </Field>

            {formError && (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            )}

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
              <div className="card p-8 text-center text-slate-500">{t("calculator.noAppliances")}</div>
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
                          aria-label={`${t("calculator.edit")}: ${a.name}`}
                          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-sdg7-blue"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAppliance(a.id)}
                          aria-label={`${t("calculator.remove")}: ${a.name}`}
                          className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <Stat label={t("calculator.dailyConsumption")} value={`${fmt(a.daily)} kWh`} />
                      <Stat label={t("calculator.monthlyConsumption")} value={`${fmt(a.monthly)} kWh`} />
                      <Stat label={t("calculator.monthlyCost")} value={money(a.monthlyCost)} />
                      <Stat label={t("calculator.yearlyCost")} value={money(a.yearlyCost)} />
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
                <TotalStat label={t("calculator.totalMonthlyCost")} value={money(totals.monthlyCost)} icon={Coins} />
                <TotalStat label={t("calculator.totalYearlyCost")} value={money(totals.yearlyCost)} icon={Coins} />
                <TotalStat label={t("calculator.totalCo2")} value={`${fmt(totals.co2Monthly)} kg`} icon={Cloud} />
              </div>
              <p className="mt-5 flex items-start gap-2 rounded-lg bg-white/10 p-3 text-sm">
                <TreePine size={18} className="mt-0.5 shrink-0 text-sdg7-yellow" aria-hidden="true" />
                <span>
                  {t("calculator.treesEquivalent", { trees: fmt(treesNeeded, 1) })}
                  <span className="block text-xs text-green-50/80 mt-1">{t("calculator.treesNote")}</span>
                </span>
              </p>
            </div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            {t("calculator.co2Disclaimer")}
          </div>

          <EfficiencyComparison
            t={t}
            fmt={fmt}
            money={money}
            onAdd={addPresetAppliance}
          />
        </div>
      </div>
    </div>
  );
}

function EfficiencyComparison({ t, fmt, money, onAdd }) {
  const [price, setPrice] = useState("0.15");
  const priceNumber = Number(price) >= 0 && price !== "" ? Number(price) : 0;

  return (
    <section className="card p-6" aria-labelledby="compare-title">
      <h2 id="compare-title" className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-2">
        <Scale size={20} className="text-sdg7-blue" aria-hidden="true" />
        {t("compare.title")}
      </h2>
      <p className="text-sm text-slate-500 mb-4">{t("compare.intro")}</p>

      <div className="max-w-xs mb-5">
        <label htmlFor="compare-price" className="block text-sm font-semibold text-slate-700 mb-1.5">
          {t("calculator.pricePerKwh")}
        </label>
        <input
          id="compare-price"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input"
        />
      </div>

      <div className="space-y-4">
        {COMPARISON_PRESETS.map((preset) => {
          const result = efficiencySavings({
            oldWatts: preset.oldWatts,
            newWatts: preset.newWatts,
            hoursPerDay: preset.hoursPerDay,
            pricePerKwh: priceNumber,
          });
          const { savedKwh, savedMoney, savedCo2, percent } = result;

          return (
            <div key={preset.id} className="rounded-xl border border-slate-100 p-4">
              <div className="grid gap-3 sm:grid-cols-2 mb-3 text-sm">
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="font-semibold text-red-700">{t(`compare.items.${preset.id}.old`)}</p>
                  <p className="text-slate-600">
                    {preset.oldWatts} W · {t("compare.hoursPerDay", { hours: preset.hoursPerDay })}
                  </p>
                  <p className="text-slate-600">{fmt(result.oldYearlyKwh)} kWh{t("calculator.perYear")}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="font-semibold text-green-700">{t(`compare.items.${preset.id}.new`)}</p>
                  <p className="text-slate-600">
                    {preset.newWatts} W · {t("compare.hoursPerDay", { hours: preset.hoursPerDay })}
                  </p>
                  <p className="text-slate-600">{fmt(result.newYearlyKwh)} kWh{t("calculator.perYear")}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-sdg7-green">
                {t("compare.saves", {
                  percent,
                  kwh: fmt(savedKwh, 0),
                  money: money(savedMoney),
                  co2: fmt(savedCo2, 0),
                })}
              </p>
              <button
                type="button"
                onClick={() =>
                  onAdd({
                    name: t(`compare.items.${preset.id}.new`),
                    power: preset.newWatts,
                    hoursPerDay: preset.hoursPerDay,
                    daysPerMonth: 30,
                    pricePerKwh: priceNumber,
                  })
                }
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sdg7-blue hover:underline"
              >
                {t("compare.addToCalculator")}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-slate-500">{t("compare.illustrative")}</p>
    </section>
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
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function TotalStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-xs text-green-50/90 mb-1">{label}</p>
      <p className="font-bold flex items-center gap-1">
        {Icon && <Icon size={14} aria-hidden="true" />}
        {value}
      </p>
    </div>
  );
}
