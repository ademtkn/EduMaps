/** Dependency-free SVG bar chart for per-day totals (server-rendered, accessible via the table fallback). */
export function DailyChart({ rows, days, height = 180 }: { rows: { day: string; total: number }[]; days: number; height?: number }) {
  const byDay = new Map<string, number>();
  for (const r of rows) byDay.set(r.day, (byDay.get(r.day) ?? 0) + Number(r.total));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bishkek" }).format(d);
    return { key, label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bishkek" }).format(d), value: byDay.get(key) ?? 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.value));
  const w = 100 / days;

  return (
    <figure>
      <svg viewBox={`0 0 100 ${height / 4}`} preserveAspectRatio="none" role="img" aria-label="Daily views" className="h-44 w-full">
        {[0.25, 0.5, 0.75].map((t) => <line key={t} x1="0" x2="100" y1={(height / 4) * t} y2={(height / 4) * t} stroke="var(--color-ink-200)" strokeWidth="0.2" />)}
        {series.map((s, i) => {
          const h = (s.value / max) * (height / 4 - 2);
          return <rect key={s.key} x={i * w + w * 0.15} y={height / 4 - h} width={w * 0.7} height={h} rx="0.6" fill="var(--color-brand-500)"><title>{`${s.label}: ${s.value}`}</title></rect>;
        })}
      </svg>
      <figcaption className="mt-2 flex justify-between text-caption text-ink-500"><span>{series[0]?.label}</span><span>Peak {max}</span><span>{series.at(-1)?.label}</span></figcaption>
    </figure>
  );
}

export function HBar({ items }: { items: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between gap-3 text-small"><span className="truncate font-medium text-ink-800">{item.label}</span><span className="shrink-0 text-ink-600">{item.value}{item.sub ? ` · ${item.sub}` : ""}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-leaf-500" style={{ width: `${(item.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
