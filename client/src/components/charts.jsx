// Small dependency-free SVG charts. Every chart has role="img" and an aria-label; the pages also show the same
// numbers in a table, so nothing is available only through colour or shape.
import { HOURS } from "../utils/optimizer.js";

const GREEN = "#237a36";
const BLUE = "#1971C2";
const BLUE_DARK = "#124E89";
const AMBER = "#8a6d00";
const SLATE = "#475569";
const RED = "#c92a2a";

// A bar that may wrap around midnight is drawn as one or two rectangles.
function segments(start, duration) {
  const end = start + duration;
  if (end <= HOURS) return [[start, duration]];
  return [[start, HOURS - start], [0, end - HOURS]];
}

// ---------------------------------------------------------------- schedule timeline
export function ScheduleChart({ problem, habitStarts, optimisedStarts, names, prices, ariaLabel, legend }) {
  const left = 150;
  const cell = 26;
  const top = 44;
  const rowH = 34;
  const width = left + cell * HOURS + 8;
  const height = top + rowH * problem.appliances.length + 26;
  const maxPrice = Math.max(...prices);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="min-w-[640px] w-full">
        {Array.from({ length: HOURS }, (_, h) => (
          <g key={h}>
            <rect x={left + h * cell} y={top - 16} width={cell} height={10} fill={prices[h] < maxPrice ? "#bfdbfe" : "#fde68a"} />
            <rect x={left + h * cell} y={top} width={cell} height={rowH * problem.appliances.length} fill={prices[h] < maxPrice ? "#eff6ff" : "#fffbeb"} stroke="#e2e8f0" strokeWidth="0.5" />
            {h % 2 === 0 && (
              <text x={left + h * cell + cell / 2} y={top - 22} textAnchor="middle" fontSize="11" fill={SLATE}>
                {h}
              </text>
            )}
          </g>
        ))}
        {problem.appliances.map((app, i) => {
          const y = top + i * rowH;
          return (
            <g key={app.id}>
              <text x={left - 8} y={y + rowH / 2 + 4} textAnchor="end" fontSize="12" fill="#1e293b" fontWeight="600">
                {names[i]}
              </text>
              {segments(habitStarts[i], app.duration).map(([s, d], k) => (
                <rect key={`h${k}`} x={left + s * cell + 1} y={y + 4} width={d * cell - 2} height={11} rx="3" fill="#fff" stroke={SLATE} strokeWidth="1.5" strokeDasharray="4 2" />
              ))}
              {segments(optimisedStarts[i], app.duration).map(([s, d], k) => (
                <rect key={`o${k}`} x={left + s * cell + 1} y={y + 18} width={d * cell - 2} height={11} rx="3" fill={GREEN} />
              ))}
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600" aria-hidden="true">
        <li><span className="mr-1 inline-block h-3 w-5 rounded border-2 border-dashed border-slate-500 align-middle" />{legend.habit}</li>
        <li><span className="mr-1 inline-block h-3 w-5 rounded bg-sdg7-green align-middle" />{legend.optimised}</li>
        <li><span className="mr-1 inline-block h-3 w-5 rounded bg-blue-200 align-middle" />{legend.cheap}</li>
        <li><span className="mr-1 inline-block h-3 w-5 rounded bg-amber-200 align-middle" />{legend.expensive}</li>
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- hourly load with the fuse line
export function LoadChart({ habitLoad, optimisedLoad, capKw, ariaLabel, legend }) {
  const left = 40;
  const cell = 26;
  const top = 14;
  const h = 150;
  const width = left + cell * HOURS + 8;
  const maxY = Math.max(capKw * 1.15, ...habitLoad, ...optimisedLoad);
  const y = (v) => top + h - (v / maxY) * h;
  const step = (load) => load.map((v, i) => `${i === 0 ? "M" : "L"}${left + i * cell},${y(v)} L${left + (i + 1) * cell},${y(v)}`).join(" ");
  const ticks = [0, Math.round(maxY / 2), Math.round(maxY)];
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${top + h + 28}`} role="img" aria-label={ariaLabel} className="min-w-[640px] w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={left + cell * HOURS} y1={y(t)} y2={y(t)} stroke="#e2e8f0" />
            <text x={left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={SLATE}>{t}</text>
          </g>
        ))}
        {Array.from({ length: HOURS }, (_, i) => i % 2 === 0 && (
          <text key={i} x={left + i * cell + cell / 2} y={top + h + 16} textAnchor="middle" fontSize="11" fill={SLATE}>{i}</text>
        ))}
        <path d={step(habitLoad)} fill="none" stroke={SLATE} strokeWidth="2" strokeDasharray="5 3" />
        <path d={step(optimisedLoad)} fill="none" stroke={GREEN} strokeWidth="2.5" />
        <line x1={left} x2={left + cell * HOURS} y1={y(capKw)} y2={y(capKw)} stroke={RED} strokeWidth="1.5" strokeDasharray="2 3" />
        <text x={left + cell * HOURS} y={y(capKw) - 4} textAnchor="end" fontSize="11" fill={RED} fontWeight="600">{legend.fuse}</text>
      </svg>
      <ul className="mt-1 flex flex-wrap gap-x-5 text-sm text-slate-600" aria-hidden="true">
        <li><span className="mr-1 inline-block h-0 w-5 border-t-2 border-dashed border-slate-500 align-middle" />{legend.habit}</li>
        <li><span className="mr-1 inline-block h-0 w-5 border-t-[3px] border-sdg7-green align-middle" />{legend.optimised}</li>
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- line chart (log y-axis option)
export function LineChart({ series, xTicks, ariaLabel, xLabel, yLabel, logY = false }) {
  const w = 560;
  const h = 260;
  const m = { l: 52, r: 16, t: 14, b: 44 };
  const xs = xTicks;
  const allY = series.flatMap((s) => s.values).filter((v) => v > 0);
  const yMin = logY ? Math.pow(10, Math.floor(Math.log10(Math.min(...allY)))) : 0;
  const yMax = logY ? Math.pow(10, Math.ceil(Math.log10(Math.max(...allY)))) : Math.max(...allY) * 1.1;
  const sx = (x) => m.l + ((x - xs[0]) / (xs[xs.length - 1] - xs[0])) * (w - m.l - m.r);
  const sy = (v) => {
    const t = logY ? (Math.log10(Math.max(v, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin)) : (v - yMin) / (yMax - yMin);
    return h - m.b - t * (h - m.t - m.b);
  };
  const yTicks = logY ? [yMin, yMin * 10, yMin * 100, yMax].filter((v, i, a) => a.indexOf(v) === i) : [0, yMax / 2, yMax];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel} className="w-full">
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={w - m.r} y1={sy(t)} y2={sy(t)} stroke="#e2e8f0" />
          <text x={m.l - 6} y={sy(t) + 4} textAnchor="end" fontSize="12" fill={SLATE}>{logY ? t : Math.round(t)}</text>
        </g>
      ))}
      {xs.map((x, i) => (i % 2 === 0 || i === xs.length - 1) && (
        <text key={x} x={sx(x)} y={h - m.b + 16} textAnchor="middle" fontSize="12" fill={SLATE}>{x}</text>
      ))}
      <text x={(m.l + w - m.r) / 2} y={h - 6} textAnchor="middle" fontSize="12" fill={SLATE}>{xLabel}</text>
      <text transform={`translate(12 ${h / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill={SLATE}>{yLabel}</text>
      {series.map((s) => (
        <g key={s.name}>
          {s.flat ? (
            <line x1={sx(xs[0])} x2={sx(xs[xs.length - 1])} y1={sy(s.values[0])} y2={sy(s.values[0])} stroke={s.color} strokeWidth="2" strokeDasharray="6 4" />
          ) : (
            <>
              <polyline fill="none" stroke={s.color} strokeWidth="2.5" points={s.values.map((v, i) => `${sx(xs[i])},${sy(v)}`).join(" ")} />
              {s.values.map((v, i) => <circle key={i} cx={sx(xs[i])} cy={sy(v)} r="3" fill={s.color} />)}
            </>
          )}
        </g>
      ))}
      <g transform={`translate(${m.l + 10} ${m.t + 6})`}>
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${i * 200} 0)`}>
            <rect width="14" height="4" y="5" fill={s.color} />
            <text x="19" y="10" fontSize="12" fill="#1e293b">{s.name}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------- horizontal bars with optional 95% interval
export function BarChart({ bars, ariaLabel, unit = "%", max }) {
  const w = 560;
  const left = 170;
  const rowH = 34;
  const top = 6;
  const h = top + bars.length * rowH + 6;
  const top1 = max ?? Math.max(...bars.map((b) => (b.ci ? b.ci[1] : b.value))) * 1.1;
  const sx = (v) => left + (v / top1) * (w - left - 70);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel} className="w-full">
      {bars.map((b, i) => {
        const y = top + i * rowH;
        return (
          <g key={b.label}>
            <text x={left - 8} y={y + 20} textAnchor="end" fontSize="13" fill="#1e293b">{b.label}</text>
            <rect x={left} y={y + 6} width={Math.max(sx(b.value) - left, 1)} height={20} rx="4" fill={b.color ?? BLUE} />
            {b.ci && (
              <g stroke="#0f172a" strokeWidth="1.5">
                <line x1={sx(b.ci[0])} x2={sx(b.ci[1])} y1={y + 16} y2={y + 16} />
                <line x1={sx(b.ci[0])} x2={sx(b.ci[0])} y1={y + 11} y2={y + 21} />
                <line x1={sx(b.ci[1])} x2={sx(b.ci[1])} y1={y + 11} y2={y + 21} />
              </g>
            )}
            <text x={sx(b.ci ? b.ci[1] : b.value) + 8} y={y + 21} fontSize="13" fontWeight="600" fill="#0f172a">{b.text ?? `${b.value}${unit}`}</text>
          </g>
        );
      })}
    </svg>
  );
}

export const CHART_COLORS = { GREEN, BLUE, BLUE_DARK, AMBER, SLATE, RED };
