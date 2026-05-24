/** Static SVG donut chart with legend — server-rendered. */
const COLORS = ["#b4501e", "#d9682c", "#e8924e", "#edb380", "#cfc4b0"];

export function DonutChart({
  segments,
}: {
  segments: { name: string; count: number }[];
}) {
  const total = segments.reduce((s, x) => s + x.count, 0);

  if (total === 0) {
    return (
      <div className="grid h-[200px] place-items-center text-[13px] text-muted">
        No activity to chart yet.
      </div>
    );
  }

  const R = 70;
  const STROKE = 26;
  const C = 2 * Math.PI * R;
  const fractions = segments.map((s) => s.count / total);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0">
        <g transform="translate(90,90) rotate(-90)">
          {segments.map((seg, i) => {
            const dash = fractions[i] * C;
            const offset =
              fractions.slice(0, i).reduce((a, b) => a + b, 0) * C;
            return (
              <circle
                key={seg.name}
                r={R}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </g>
        <text
          x="90"
          y="85"
          textAnchor="middle"
          fontSize="22"
          fontWeight="600"
          fill="var(--ink)"
        >
          {total}
        </text>
        <text x="90" y="103" textAnchor="middle" fontSize="11" fill="var(--muted)">
          Total posts
        </text>
      </svg>

      <ul className="flex-1 space-y-2">
        {segments.map((seg, i) => {
          const pct = Math.round((seg.count / total) * 1000) / 10;
          return (
            <li key={seg.name} className="flex items-center gap-2 text-[13px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="flex-1 truncate text-ink">{seg.name}</span>
              <span className="font-semibold text-ink">{seg.count}</span>
              <span className="w-12 text-right text-muted">({pct}%)</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
