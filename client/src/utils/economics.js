// Economic case study for a reference Moldovan household (pure functions, unit-tested).
// All inputs are ASSUMPTIONS written down on purpose; docs/research/ECONOMICS.md lists each one with its source
// and how sure we are of it. Nothing here is a measurement of a real home.

// Official BNM EUR/MDL rate, 5 November 2026 (20.1773). The rate moves a little every day.
export const EUR_MDL = 20.18;

// Reference household: yearly electricity that CAN be moved to another hour of the day.
export const REFERENCE_HOUSEHOLD = [
  { id: "washer", perYear: 208, kwhEach: 1.0 }, // 4 washes a week
  { id: "dishwasher", perYear: 260, kwhEach: 1.0 }, // 5 cycles a week
  { id: "boiler", perYear: 365, kwhEach: 2.5 }, // electric water heater with a storage tank, heated once a day
];

export const annualShiftableKwh = (household = REFERENCE_HOUSEHOLD) =>
  household.reduce((sum, a) => sum + a.perYear * a.kwhEach, 0);

// Ways to run the schedule the optimiser finds. Money in EUR; sources and certainty in ECONOMICS.md.
export const OPTIONS = [
  { id: "timer", upfrontEur: 0, yearlyEur: 0 }, // delay-start timer already built into the appliance
  { id: "plugs", upfrontEur: 45, yearlyEur: 0 }, // 3 smart plugs at about 15 EUR (indicative)
  { id: "sma", upfrontEur: 658, yearlyEur: 0 }, // retail price of a PV/storage energy manager (one retailer)
  { id: "hems", upfrontEur: 1000, yearlyEur: 180 }, // installed HEMS + subscription (market-report range 120-240 a year)
];

export function economicCase({ annualKwh, dayPrice, nightPrice, savingPct, eurMdl = EUR_MDL }) {
  // The habitual schedule runs mostly in the day zone, so its yearly cost is approximated at the day price.
  const habitCostMdl = annualKwh * dayPrice;
  const savingMdl = (habitCostMdl * savingPct) / 100;
  const upperBoundMdl = annualKwh * (dayPrice - nightPrice); // everything moved to the cheap zone
  return {
    habitCostMdl,
    savingMdl,
    savingEur: savingMdl / eurMdl,
    upperBoundMdl,
    upperBoundEur: upperBoundMdl / eurMdl,
  };
}

// Years until an option pays for itself, or null when it never does (its running cost exceeds the saving).
export function paybackYears(option, savingEurPerYear) {
  const net = savingEurPerYear - option.yearlyEur;
  if (option.upfrontEur === 0 && net >= 0) return 0;
  if (net <= 0) return null;
  return option.upfrontEur / net;
}
