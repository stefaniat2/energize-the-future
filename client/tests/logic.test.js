// Unit tests for the calculator formulas, game rules and translation files.
// Run with: npm test   (uses Node's built-in test runner, no extra dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  calculateAppliance, sumResults, treesNeededPerYear, efficiencySavings, CO2_FACTOR_KG_PER_KWH,
} from "../src/utils/energy.js";
import {
  INITIAL_STATS, applyEffects, scoreForEffects, costOf, isLocked, earnedAchievements, clamp,
} from "../src/utils/game.js";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

// ---------- Energy calculator ----------
test("calculator: formulas from the specification", () => {
  // 150 W fridge, 24 h/day, 30 days, 0.15 per kWh
  const r = calculateAppliance({ power: 150, hoursPerDay: 24, daysPerMonth: 30, pricePerKwh: 0.15 });
  close(r.daily, 3.6);
  close(r.monthly, 108);
  close(r.monthlyCost, 16.2);
  close(r.yearlyCost, 194.4);
  close(r.co2Monthly, 108 * CO2_FACTOR_KG_PER_KWH);
});

test("calculator: zero usage produces zero everything", () => {
  const r = calculateAppliance({ power: 0, hoursPerDay: 0, daysPerMonth: 0, pricePerKwh: 0 });
  assert.deepEqual(r, { daily: 0, monthly: 0, monthlyCost: 0, yearlyCost: 0, co2Monthly: 0 });
});

test("calculator: totals add up across appliances", () => {
  const a = calculateAppliance({ power: 100, hoursPerDay: 10, daysPerMonth: 30, pricePerKwh: 0.2 });
  const b = calculateAppliance({ power: 50, hoursPerDay: 4, daysPerMonth: 30, pricePerKwh: 0.2 });
  const total = sumResults([a, b]);
  close(total.monthly, a.monthly + b.monthly);
  close(total.yearlyCost, a.yearlyCost + b.yearlyCost);
  assert.deepEqual(sumResults([]), { daily: 0, monthly: 0, monthlyCost: 0, yearlyCost: 0, co2Monthly: 0 });
});

test("calculator: trees needed uses 21 kg CO2 per tree per year", () => {
  close(treesNeededPerYear(21 / 12), 1);
});

test("efficiency comparison: LED bulb saves 85% of the power", () => {
  const s = efficiencySavings({ oldWatts: 60, newWatts: 9, hoursPerDay: 5, pricePerKwh: 0.15 });
  assert.equal(s.percent, 85);
  close(s.savedKwh, ((60 - 9) / 1000) * 5 * 365);
  close(s.savedMoney, s.savedKwh * 0.15);
});

// ---------- Energy Hero rules ----------
test("game: stats are clamped between 0 and 100", () => {
  const maxed = applyEffects(
    { clean: 95, pollution: 3, affordability: 50, happiness: 50, sustainability: 99 },
    { clean: 20, pollution: -20, affordability: 0, happiness: 0, sustainability: 25, budget: 0 }
  );
  assert.equal(maxed.clean, 100);
  assert.equal(maxed.pollution, 0);
  assert.equal(maxed.sustainability, 100);
  assert.equal(clamp(-5), 0);
});

test("game: scoring matches the documented formula", () => {
  // first scenario, solar farm option
  const solar = { clean: 15, pollution: -10, affordability: -5, happiness: 5, sustainability: 10, budget: -30 };
  assert.equal(scoreForEffects(solar), 10 * 10 + 15 * 3 + 5 * 3 + 10 * 3 + 0); // 190
  // a purely negative decision scores nothing
  const bad = { clean: -5, pollution: 15, affordability: -2, happiness: -8, sustainability: -15, budget: 0 };
  assert.equal(scoreForEffects(bad), 0);
});

test("game: budget locks only unaffordable options and never traps the player", () => {
  const pricey = { effects: { budget: -50 } };
  const free = { effects: { budget: 0 } };
  assert.equal(costOf(pricey), 50);
  assert.equal(costOf(free), 0);
  assert.equal(isLocked(pricey, [pricey, free], 45), true);
  assert.equal(isLocked(pricey, [pricey, free], 50), false);
  assert.equal(isLocked(free, [pricey, free], 0), false);
  const cheap = { effects: { budget: -15 } };
  const cheap2 = { effects: { budget: -10 } };
  assert.equal(isLocked(cheap, [cheap, cheap2], 5), false, "nothing affordable => nothing locked");
});

test("game: achievements unlock at the documented thresholds", () => {
  assert.deepEqual(earnedAchievements(INITIAL_STATS, false), []);
  const great = { clean: 60, pollution: 10, affordability: 50, happiness: 80, sustainability: 90 };
  assert.deepEqual(earnedAchievements(great, true).map((a) => a.id), [1, 2, 3, 4, 5]);
});

test("game: an all-best playthrough of the seeded scenarios is winnable and reaches every achievement", async () => {
  const { scenarios } = await import("../../server/database/seedData.js");
  let stats = INITIAL_STATS;
  for (const s of scenarios) stats = applyEffects(stats, s.options[0].effects);
  const ids = earnedAchievements(stats, true).map((a) => a.id);
  assert.deepEqual(ids, [1, 2, 3, 4, 5]);
});

// ---------- Translations ----------
const load = (lang) => JSON.parse(readFileSync(new URL(`../src/locales/${lang}/translation.json`, import.meta.url), "utf8"));

function flatten(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

test("i18n: English, Romanian and Russian have exactly the same keys", () => {
  const en = flatten(load("en")).sort();
  for (const lang of ["ro", "ru"]) {
    assert.deepEqual(flatten(load(lang)).sort(), en, `${lang} keys differ from en`);
  }
});

test("i18n: no empty strings, and {{placeholders}} match across languages", () => {
  const placeholders = (s) => (s.match(/{{\w+}}/g) || []).sort().join(",");
  const get = (obj, path) => path.split(".").reduce((o, k) => o[k], obj);
  const en = load("en");
  for (const key of flatten(en)) {
    for (const lang of ["en", "ro", "ru"]) {
      const value = get(load(lang), key);
      assert.ok(String(value).trim().length > 0, `${lang}:${key} is empty`);
      assert.equal(placeholders(String(value)), placeholders(String(get(en, key))), `${lang}:${key} placeholders differ`);
    }
  }
});

test("i18n: Romanian and Russian are really translated (not copies of English)", () => {
  const en = load("en");
  const identical = (lang) => {
    const other = load(lang);
    const get = (obj, path) => path.split(".").reduce((o, k) => o[k], obj);
    return flatten(en).filter((k) => {
      const v = get(en, k);
      return String(v).length > 25 && v === get(other, k);
    });
  };
  assert.deepEqual(identical("ro"), []);
  assert.deepEqual(identical("ru"), []);
});
