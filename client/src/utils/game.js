// Pure game-rule helpers for Energy Hero (kept free of React so they can be unit tested).

export const INITIAL_STATS = { clean: 15, pollution: 70, affordability: 45, happiness: 50, sustainability: 20 };

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// Apply one decision's effects to the city stats, keeping every stat within 0-100.
export function applyEffects(stats, effects) {
  return {
    clean: clamp(stats.clean + effects.clean),
    pollution: clamp(stats.pollution + effects.pollution),
    affordability: clamp(stats.affordability + effects.affordability),
    happiness: clamp(stats.happiness + effects.happiness),
    sustainability: clamp(stats.sustainability + effects.sustainability),
  };
}

// Points earned for a decision: only improvements score (a drop in pollution counts as one).
export function scoreForEffects(effects) {
  return (
    Math.max(0, effects.sustainability) * 10 +
    Math.max(0, effects.clean) * 3 +
    Math.max(0, effects.happiness) * 3 +
    Math.max(0, -effects.pollution) * 3 +
    Math.max(0, effects.affordability) * 2
  );
}

export function costOf(option) {
  return Math.max(0, -option.effects.budget);
}

// An option is locked only when it is too expensive AND another option is affordable,
// so the player can never get stuck with nothing to choose.
export function isLocked(option, options, budget) {
  const affordable = (o) => costOf(o) <= budget;
  return !affordable(option) && options.some(affordable);
}

export function earnedAchievements(stats, finished) {
  return [
    { id: 1, key: "achievement1", earned: stats.clean >= 50 },
    { id: 2, key: "achievement2", earned: stats.pollution <= 20 },
    { id: 3, key: "achievement3", earned: stats.happiness >= 70 },
    { id: 4, key: "achievement4", earned: stats.sustainability >= 80 },
    { id: 5, key: "achievement5", earned: finished },
  ].filter((a) => a.earned);
}
