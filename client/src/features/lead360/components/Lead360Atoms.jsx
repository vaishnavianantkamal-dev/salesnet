import { cn } from '@/lib/utils'

export function StatusBadge({ label, className, title }) {
  return (
    <span
      title={title}
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
    >
      {label}
    </span>
  )
}

export function ScoreRing({ value, strokeClass, size = 52 }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-border" strokeWidth={4.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" className={strokeClass} strokeWidth={4.5}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        className="fill-foreground font-mono text-[13px] font-bold tabular-nums">
        {v}
      </text>
    </svg>
  )
}

export function ScoreMeter({ score, textClass, bgClass, label: tempLabel, hint }) {
  const v = Math.max(0, Math.min(100, Math.round(score)))
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">Lead score</span>
        <div className="flex items-baseline gap-1.5">
          <span className={cn('font-mono text-3xl font-bold leading-none tabular-nums', textClass)}>{v}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="relative h-2.5 rounded-full bg-gradient-to-r from-cold via-warm to-hot">
        <div className="absolute inset-0 rounded-full bg-card/80" />
        <div
          className={cn('absolute top-1/2 w-4 h-4 rounded-full border-[3px] border-background shadow-md transition-[left] duration-500', bgClass)}
          style={{ left: `${v}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] tracking-wider uppercase text-muted-foreground">
        <span>Cold</span>
        <span className={cn('font-bold', textClass)}>{tempLabel} · {hint}</span>
        <span>Hot</span>
      </div>
    </div>
  )
}

export function Tile({ label, value, sub, accentClass = 'text-foreground' }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-3">
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">{label}</div>
      <div className={cn('font-mono text-xl font-bold mt-0.5 tabular-nums', accentClass)}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

export function CompBar({ label, value, barClass }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="grid grid-cols-[110px_1fr_32px] items-center gap-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-[width] duration-500', barClass)} style={{ width: `${v}%` }} />
      </div>
      <span className="font-mono text-xs text-right text-muted-foreground tabular-nums">{v}</span>
    </div>
  )
}

export function ActivitySparkline({ timeline }) {
  const days = 14
  const W = 460, H = 140, P = 20
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const buckets = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    buckets.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), count: 0 })
  }
  const bmap = new Map(buckets.map(b => [b.key, b]))
  ;(timeline || []).forEach(a => {
    const k = new Date(a.occurredAt).toISOString().slice(0, 10)
    if (bmap.has(k)) bmap.get(k).count++
  })
  const max = Math.max(1, ...buckets.map(b => b.count))
  const x = i => P + (i * (W - 2 * P)) / (buckets.length - 1)
  const y = v => H - P - (v / max) * (H - 2 * P)
  let line = `M ${x(0)} ${y(buckets[0].count)}`
  buckets.forEach((b, i) => { if (i) line += ` L ${x(i)} ${y(b.count)}` })
  const area = `${line} L ${x(buckets.length - 1)} ${H - P} L ${x(0)} ${H - P} Z`
  const hasData = buckets.some(b => b.count > 0)
  if (!hasData) return <p className="text-muted-foreground text-sm text-center py-6">No activity in the last 14 days.</p>

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block text-primary">
      <defs>
        <linearGradient id="eng360" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} className="stroke-border" strokeWidth={1} />
      ))}
      <path d={area} fill="url(#eng360)" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} />
      {buckets.map((b, i) => b.count > 0 && (
        <circle key={i} cx={x(i)} cy={y(b.count)} r={3} fill="currentColor" />
      ))}
      <text x={P} y={H - 5} fontSize={9} className="fill-muted-foreground">{buckets[0].label}</text>
      <text x={W - P} y={H - 5} fontSize={9} textAnchor="end" className="fill-muted-foreground">{buckets[buckets.length - 1].label}</text>
    </svg>
  )
}
