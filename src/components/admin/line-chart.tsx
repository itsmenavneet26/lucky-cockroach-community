/** Static SVG line chart — server-rendered, no client JS. */
export function LineChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  if (data.length < 2) {
    return (
      <div className="grid h-[200px] place-items-center text-[13px] text-muted">
        Not enough data yet.
      </div>
    );
  }

  const W = 640;
  const H = 200;
  const padX = 8;
  const padTop = 12;
  const padBottom = 28;
  const max = Math.max(...data.map((d) => d.total), 1);
  const min = Math.min(...data.map((d) => d.total));
  const span = max - min || 1;

  const x = (i: number) =>
    padX + (i / (data.length - 1)) * (W - padX * 2);
  const y = (v: number) =>
    padTop + (1 - (v - min) / span) * (H - padTop - padBottom);

  const line = data.map((d, i) => `${x(i)},${y(d.total)}`).join(" ");
  const area = `${padX},${H - padBottom} ${line} ${W - padX},${H - padBottom}`;

  const ticks = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Member growth">
      <defs>
        <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={padX}
          x2={W - padX}
          y1={padTop + g * (H - padTop - padBottom)}
          y2={padTop + g * (H - padTop - padBottom)}
          stroke="var(--border)"
          strokeWidth="1"
        />
      ))}

      <polygon points={area} fill="url(#lc-area)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(data.length - 1)}
        cy={y(data[data.length - 1].total)}
        r="4"
        fill="var(--accent)"
      />

      {ticks.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
          fontSize="11"
          fill="var(--muted)"
        >
          {data[i].date}
        </text>
      ))}
    </svg>
  );
}
