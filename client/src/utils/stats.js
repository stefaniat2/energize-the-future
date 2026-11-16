// Small statistics helpers for the benchmark (pure functions, unit-tested).

export const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Sample standard deviation (n - 1 in the denominator).
export function sd(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

export function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Error function (Abramowitz & Stegun 7.1.26, max error 1.5e-7) -> standard normal CDF.
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}
export const normalCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

// 95% confidence interval of the mean. With n >= 100 the t-distribution is almost identical to the
// normal one (1.984 vs 1.960), so the normal value is used.
export function confidence95(xs) {
  const m = mean(xs);
  const half = (1.96 * sd(xs)) / Math.sqrt(xs.length);
  return [m - half, m + half];
}

// Paired two-sided test on the differences a[i] - b[i]: is the mean difference zero?
// Returns the t statistic, a normal-approximation p-value (valid for n >= 30) and Cohen's d_z effect size.
export function pairedTest(a, b) {
  const diffs = a.map((x, i) => x - b[i]);
  const m = mean(diffs);
  const s = sd(diffs);
  if (s === 0) return { n: diffs.length, meanDiff: m, t: m === 0 ? 0 : Infinity, p: m === 0 ? 1 : 0, dz: m === 0 ? 0 : Infinity };
  const t = m / (s / Math.sqrt(diffs.length));
  const p = 2 * (1 - normalCdf(Math.abs(t)));
  return { n: diffs.length, meanDiff: m, t, p, dz: m / s };
}
