// Pure energy-calculation helpers (kept free of React so they can be unit tested).

// Average grid CO2 emission factor in kg of CO2 per kWh. This is a global
// approximation; the real value depends heavily on each country's electricity mix.
export const CO2_FACTOR_KG_PER_KWH = 0.45;

// A mature tree absorbs roughly 21 kg of CO2 per year (commonly cited estimate).
export const KG_CO2_PER_TREE_PER_YEAR = 21;

// Daily kWh = Power (W) / 1000 x hours per day
export function dailyKwh(powerWatts, hoursPerDay) {
  return (powerWatts / 1000) * hoursPerDay;
}

export function calculateAppliance({ power, hoursPerDay, daysPerMonth, pricePerKwh }) {
  const daily = dailyKwh(power, hoursPerDay);
  const monthly = daily * daysPerMonth;
  const monthlyCost = monthly * pricePerKwh;
  return {
    daily,
    monthly,
    monthlyCost,
    yearlyCost: monthlyCost * 12,
    co2Monthly: monthly * CO2_FACTOR_KG_PER_KWH,
  };
}

export function sumResults(results) {
  return results.reduce(
    (total, r) => ({
      daily: total.daily + r.daily,
      monthly: total.monthly + r.monthly,
      monthlyCost: total.monthlyCost + r.monthlyCost,
      yearlyCost: total.yearlyCost + r.yearlyCost,
      co2Monthly: total.co2Monthly + r.co2Monthly,
    }),
    { daily: 0, monthly: 0, monthlyCost: 0, yearlyCost: 0, co2Monthly: 0 }
  );
}

export function treesNeededPerYear(co2KgPerMonth) {
  return (co2KgPerMonth * 12) / KG_CO2_PER_TREE_PER_YEAR;
}

// Yearly savings from replacing an old appliance with an efficient one.
export function efficiencySavings({ oldWatts, newWatts, hoursPerDay, pricePerKwh }) {
  const yearlyKwh = (watts) => dailyKwh(watts, hoursPerDay) * 365;
  const savedKwh = yearlyKwh(oldWatts) - yearlyKwh(newWatts);
  return {
    oldYearlyKwh: yearlyKwh(oldWatts),
    newYearlyKwh: yearlyKwh(newWatts),
    savedKwh,
    savedMoney: savedKwh * pricePerKwh,
    savedCo2: savedKwh * CO2_FACTOR_KG_PER_KWH,
    percent: Math.round(((oldWatts - newWatts) / oldWatts) * 100),
  };
}
