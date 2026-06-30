import { useQuery } from '@tanstack/react-query'
import { X, Loader2, RefreshCw } from 'lucide-react'
import { getLead360Api } from '@/api/lead360.api'

// ── Design tokens matching the HTML preview ───────────────────────────────────
const T = {
  bg:      '#0f1420',
  surface: '#161d2e',
  surf2:   '#1d2740',
  line:    '#28344e',
  ink:     '#eef2fb',
  inkDim:  '#9fb0cc',
  inkMute: '#6b7c9c',
  cold:    '#4f8cff',
  warm:    '#f4b740',
  hot:     '#ff5a4d',
  good:    '#38d39f',
  bad:     '#ff6b6b',
  accent:  '#8b9dff',
}

const TEMP_META = {
  HOT:  { label: 'Hot',  color: T.hot,  hint: 'Acting now' },
  WARM: { label: 'Warm', color: T.warm, hint: 'Engaged' },
  COLD: { label: 'Cold', color: T.cold, hint: 'Dormant' },
}

const INTENT_META = {
  HIGH:   { label: 'High intent',   color: T.hot  },
  MEDIUM: { label: 'Medium intent', color: T.warm },
  LOW:    { label: 'Low intent',    color: T.inkMute },
}

const SENT_META = {
  POSITIVE:       { label: 'Positive',       color: T.good },
  INTERESTED:     { label: 'Interested',      color: T.good },
  URGENT:         { label: 'Urgent',          color: T.hot  },
  NEGATIVE:       { label: 'Negative',        color: T.bad  },
  NOT_INTERESTED: { label: 'Not interested',  color: T.bad  },
  CONFUSED:       { label: 'Confused',        color: T.warm },
  NEUTRAL:        { label: 'Neutral',         color: T.inkDim },
}

const RISK_META = {
  LOW:    { label: 'Low risk',    color: T.good },
  MEDIUM: { label: 'Medium risk', color: T.warm },
  HIGH:   { label: 'High risk',  color: T.bad  },
}

const EVENT_LABELS = {
  LEAD_CREATED:       'Lead created',
  WHATSAPP_REPLIED:   'Replied on WhatsApp',
  WHATSAPP_READ:      'WhatsApp read',
  WEBSITE_VISIT:      'Activity logged',
  PRODUCT_VIEW:       'Note added',
  CALL_MADE:          'Call logged',
  MEETING_SCHEDULED:  'Meeting scheduled',
  QUOTATION_VIEWED:   'Quotation viewed',
  PAYMENT_RECEIVED:   'Payment received',
}

const ACTION_LABELS = {
  CALL_TODAY:          'Call today',
  SCHEDULE_MEETING:    'Schedule a meeting',
  SEND_BROCHURE:       'Send brochure',
  SEND_PRODUCT_DEMO:   'Send product demo',
  OFFER_DISCOUNT:      'Offer a discount',
  FOLLOW_UP_TOMORROW:  'Follow up tomorrow',
  ASSIGN_SENIOR_EXEC:  'Assign a senior exec',
  NURTURE:             'Add to nurture',
}

const SIGNAL_LABELS = {
  repeatedWebsiteVisits:  'Repeated website visits',
  repeatedProductViews:   'Repeated activity sessions',
  quotationRequested:     'Requested a quotation',
  pricingPageViewed:      'Viewed pricing',
  meetingRequested:       'Requested a meeting',
  fastReply:              'Replies quickly',
  catalogViewed:          'Browsed the catalog',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (n = '') =>
  n.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

const money = (n) => {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0) }
  catch { return '₹' + (n || 0) }
}

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.round((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60); if (m < 60) return m + 'm ago'
  const h = Math.round(m / 60); if (h < 24) return h + 'h ago'
  const d = Math.round(h / 24); if (d < 30) return d + 'd ago'
  return Math.round(d / 30) + 'mo ago'
}

// ── UI atoms ──────────────────────────────────────────────────────────────────
function Pill({ color, label, title = '' }) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
        borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        color, background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function ScoreRing({ value, color, size = 52 }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.line} strokeWidth={4.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4.5}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: T.ink, fontFamily: 'ui-monospace, monospace' }}>
        {v}
      </text>
    </svg>
  )
}

function Meter({ score, meta }) {
  const v = Math.max(0, Math.min(100, Math.round(score)))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 600 }}>Lead score</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: meta.color, fontFamily: 'ui-monospace, monospace' }}>{v}</span>
          <span style={{ fontSize: 12, color: T.inkMute }}> / 100</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 10, borderRadius: 999, background: `linear-gradient(90deg, ${T.cold} 0%, #38bdf8 28%, ${T.warm} 64%, ${T.hot} 100%)` }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: T.surface, opacity: 0.82 }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${v}%`, width: 16, height: 16, borderRadius: '50%',
          background: meta.color, border: `3px solid ${T.bg}`, transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 0 1px rgba(255,255,255,0.22), 0 4px 12px -2px rgba(0,0,0,0.6)`,
          transition: 'left 0.6s cubic-bezier(.16,1,.3,1)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.inkMute }}>
        <span>Cold</span>
        <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label} · {meta.hint}</span>
        <span>Hot</span>
      </div>
    </div>
  )
}

function Tile({ label, value, sub, accent = T.ink }) {
  return (
    <div style={{ padding: '12px 13px 10px', borderRadius: 9, background: T.surf2, border: `1px solid ${T.line}` }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent, fontFamily: 'ui-monospace, monospace', marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.inkMute, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function CompBar({ label, value, color }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 32px', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12.5, color: T.inkDim }}>{label}</span>
      <div style={{ height: 7, borderRadius: 999, background: T.surf2, overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', borderRadius: 999, background: color, transition: 'width 0.6s cubic-bezier(.16,1,.3,1)' }} />
      </div>
      <span style={{ fontSize: 12, textAlign: 'right', color: T.inkMute, fontFamily: 'ui-monospace, monospace' }}>{v}</span>
    </div>
  )
}

function ActivitySparkline({ timeline }) {
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
  if (!hasData) return <p style={{ color: T.inkMute, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No activity in the last 14 days.</p>

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="eng360" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} stroke={T.line} strokeWidth={1} />
      ))}
      <path d={area} fill="url(#eng360)" />
      <path d={line} fill="none" stroke="#38bdf8" strokeWidth={2} />
      {buckets.map((b, i) => b.count > 0 && (
        <circle key={i} cx={x(i)} cy={y(b.count)} r={3} fill="#38bdf8" />
      ))}
      <text x={P} y={H - 5} fontSize={9} fill={T.inkMute}>{buckets[0].label}</text>
      <text x={W - P} y={H - 5} fontSize={9} fill={T.inkMute} textAnchor="end">{buckets[buckets.length - 1].label}</text>
    </svg>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function Lead360Panel({ leadId, leadName, onClose }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['lead360', leadId],
    queryFn: () => getLead360Api(leadId).then(r => r.data?.data || r.data),
    enabled: !!leadId,
    staleTime: 60 * 1000,
  })

  const panel = {
    position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
    width: 'min(820px, 95vw)', background: T.bg,
    borderLeft: `1px solid ${T.line}`,
    boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
    display: 'flex', flexDirection: 'column',
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    color: T.ink, overflowY: 'auto',
    animation: 'slideIn360 0.25s cubic-bezier(.16,1,.3,1)',
  }

  return (
    <>
      <style>{`@keyframes slideIn360 { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.45)' }} />

      <div style={panel}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${T.line}`, flexShrink: 0, position: 'sticky', top: 0, background: T.bg, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 600 }}>SalesNest · Intelligence</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 750, letterSpacing: '-0.02em' }}>Lead 360° — {leadName || 'Profile'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => refetch()} disabled={isFetching}
              style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${T.line}`, background: T.surf2, color: T.inkDim, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
              <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
              Recompute
            </button>
            <button onClick={onClose}
              style={{ padding: 8, borderRadius: 9, border: `1px solid ${T.line}`, background: T.surf2, color: T.inkDim, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 20, display: 'grid', gap: 16 }}>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: T.inkDim }}>
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Building 360° profile…</span>
            </div>
          )}
          {isError && (
            <div style={{ textAlign: 'center', padding: 40, color: T.bad, fontSize: 14 }}>
              Failed to load profile. <button onClick={() => refetch()} style={{ color: T.accent, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
            </div>
          )}
          {data && <ProfileBody data={data} />}
        </div>
      </div>
    </>
  )
}

function ProfileBody({ data }) {
  const { lead, score, sentiment, aiSummary, nextBestAction, intentSignals, behaviour, financial, timeline } = data
  const tempMeta = TEMP_META[score.temperature] || TEMP_META.COLD
  const intentMeta = INTENT_META[score.buyingIntent] || INTENT_META.LOW
  const sentMeta = SENT_META[sentiment?.label] || SENT_META.NEUTRAL
  const b = behaviour

  const COMP_COLS = [
    { key: 'engagement',     label: 'Engagement',     color: '#38bdf8' },
    { key: 'recency',        label: 'Recency',         color: T.warm   },
    { key: 'frequency',      label: 'Frequency',       color: T.accent },
    { key: 'responsiveness', label: 'Responsiveness',  color: T.good   },
  ]

  const CHAN_COLORS = {
    whatsapp: T.good, website: '#38bdf8', call: T.warm, meeting: T.accent, system: T.inkMute,
  }

  const sectionCard = (children, style = {}) => (
    <div style={{
      background: `linear-gradient(180deg, ${T.surface} 0%, ${T.surface} 60%, ${T.surf2} 100%)`,
      border: `1px solid ${T.line}`, borderRadius: 14,
      boxShadow: '0 1px 0 rgba(255,255,255,.03) inset, 0 12px 30px -18px rgba(0,0,0,.8)',
      ...style,
    }}>{children}</div>
  )

  const cardHeader = (eyebrow, title, right = null) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${T.line}` }}>
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 600 }}>{eyebrow}</div>
        <h3 style={{ margin: '3px 0 0', fontSize: 14.5, fontWeight: 650 }}>{title}</h3>
      </div>
      {right}
    </div>
  )

  return (
    <>
      {/* ── Masthead ── */}
      {sectionCard(
        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: 13, display: 'grid', placeItems: 'center',
              fontSize: 17, fontWeight: 700, flexShrink: 0,
              color: tempMeta.color, background: `color-mix(in srgb, ${tempMeta.color} 16%, ${T.surf2})`,
              border: `1px solid color-mix(in srgb, ${tempMeta.color} 30%, transparent)`,
            }}>{initials(lead.basic.name)}</div>

            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' }}>{lead.basic.name}</h2>
                {lead.company?.name && <span style={{ color: T.inkDim, fontSize: 13 }}>· {lead.company.name}</span>}
              </div>
              <div style={{ marginTop: 3, fontSize: 12, color: T.inkMute }}>
                {lead.basic.email || lead.basic.phone} · active {timeAgo(lead.lastActivityAt)} · {lead.leadSource}
              </div>
              <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
                <Pill color={intentMeta.color} label={intentMeta.label} />
                <Pill color={sentMeta.color} label={sentMeta.label} />
                <Pill color={T.accent} label={`Opportunity ${score.opportunityScore}`} title="Composite conversion likelihood" />
              </div>
            </div>

            <ScoreRing value={score.leadScore} color={tempMeta.color} size={52} />
          </div>

          <div style={{ marginTop: 18 }}>
            <Meter score={score.leadScore} meta={tempMeta} />
          </div>
        </div>
      )}

      {/* ── Two column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>

        {/* LEFT column */}
        <div style={{ display: 'grid', gap: 16 }}>

          {/* AI Insights */}
          {sectionCard(<>
            {cardHeader('AI read', 'Insights & recommendation')}
            <div style={{ padding: 18 }}>
              {/* Next best action */}
              <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start', padding: 14, borderRadius: 9, background: `color-mix(in srgb, ${T.accent} 12%, ${T.surf2})`, border: `1px solid color-mix(in srgb, ${T.accent} 28%, transparent)`, marginBottom: 14 }}>
                <span style={{ marginTop: 3, width: 8, height: 8, borderRadius: 999, background: T.accent, flexShrink: 0, boxShadow: `0 0 0 4px color-mix(in srgb, ${T.accent} 25%, transparent)` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 600, marginBottom: 3 }}>
                    Next best action · {(nextBestAction?.priority || 'medium').toLowerCase()} priority
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700 }}>{ACTION_LABELS[nextBestAction?.action] || nextBestAction?.action}</div>
                  <p style={{ margin: '5px 0 0', fontSize: 12.5, color: T.inkDim, lineHeight: 1.5 }}>{nextBestAction?.reason}</p>
                </div>
              </div>

              {/* AI summary */}
              <p style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.65, color: T.inkDim }}>{aiSummary?.text}</p>

              {/* Sentiment + intent */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
                <Pill color={sentMeta.color} label={`Sentiment · ${sentMeta.label}`} />
                <Pill color={intentMeta.color} label={`${intentMeta.label} · ${score.buyingIntentScore}`} />
              </div>

              {/* Signals */}
              {intentSignals?.length > 0 && <>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 600, marginBottom: 8 }}>Buying signals detected</div>
                <div style={{ display: 'grid', gap: 5 }}>
                  {intentSignals.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: T.inkDim, padding: '6px 10px', borderRadius: 8, background: T.surf2 }}>
                      <span>{SIGNAL_LABELS[s.signal] || s.signal}</span>
                      {s.count && <span style={{ color: T.inkMute, fontFamily: 'ui-monospace, monospace' }}>×{s.count}</span>}
                    </div>
                  ))}
                </div>
              </>}
            </div>
          </>)}

          {/* Engagement breakdown */}
          {sectionCard(<>
            {cardHeader('Observed behaviour', 'Engagement breakdown')}
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 600, marginBottom: 10 }}>Why this score</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {COMP_COLS.map(c => (
                  <CompBar key={c.key} label={c.label} value={score.components[c.key] || 0} color={c.color} />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginTop: 18 }}>
                <Tile label="Website visits"   value={b.website.totalVisits}      sub={`${b.website.uniqueDays} active days`} />
                <Tile label="Conversations"    value={b.product.views}            sub={`${b.product.distinctProducts} sessions`} />
                <Tile label="Documents"        value={b.product.downloads}        sub="shared / downloaded" />
                <Tile label="WhatsApp replies" value={b.whatsapp.replies}         sub={b.whatsapp.avgResponseMinutes ? `~${b.whatsapp.avgResponseMinutes}m to reply` : ''} />
                <Tile label="Calls"            value={b.call.made + b.call.received} sub={b.call.avgDurationSeconds ? `~${Math.round(b.call.avgDurationSeconds / 60)}m avg` : ''} />
                <Tile label="Quotations"       value={b.quotation.viewed}         sub={`${b.quotation.accepted} accepted`} />
              </div>
            </div>
          </>)}

          {/* Activity sparkline */}
          {sectionCard(<>
            {cardHeader('Momentum', 'Activity · last 14 days')}
            <div style={{ padding: 18 }}>
              <ActivitySparkline timeline={timeline} />
            </div>
          </>)}

          {/* Financial */}
          {financial && (() => {
            const riskMeta = RISK_META[financial.paymentRisk?.band] || RISK_META.LOW
            return sectionCard(<>
              {cardHeader('Internal · billing', 'Financial profile', <Pill color={riskMeta.color} label={riskMeta.label} title={`Risk score ${financial.paymentRisk.score}/100`} />)}
              <div style={{ padding: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
                  <Tile label="Lifetime value" value={money(financial.totalRevenue)} />
                  <Tile label="Orders"         value={financial.totalOrders} />
                  <Tile label="Avg order"      value={money(financial.averageOrderValue)} />
                  <Tile label="Outstanding"    value={money(financial.outstandingAmount)} accent={financial.outstandingAmount > 0 ? T.warm : T.ink} />
                </div>
                {financial.invoiceHistory?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMute, fontWeight: 600, marginBottom: 8 }}>Recent invoices</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {financial.invoiceHistory.map((inv, i) => {
                        const c = inv.status === 'PAID' ? T.good : inv.status === 'OVERDUE' ? T.bad : T.warm
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, padding: '7px 10px', borderRadius: 8, background: T.surf2 }}>
                            <span style={{ color: T.inkDim }}>{inv.invoiceId}</span>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{money(inv.amount)}</span>
                              <Pill color={c} label={inv.status[0] + inv.status.slice(1).toLowerCase()} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>)
          })()}
        </div>

        {/* RIGHT column — Timeline */}
        <div>
          {sectionCard(<>
            {cardHeader('History', 'Activity timeline')}
            <div style={{ padding: 18 }}>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {(timeline || []).map((a, i) => {
                  const chanColor = CHAN_COLORS[a.channel] || T.inkMute
                  const isLast = i === (timeline.length - 1)
                  const txt = a.payload?.text || a.payload?.pageUrl || a.payload?.productName || ''
                  return (
                    <li key={i} style={{ display: 'flex', gap: 13 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ width: 11, height: 11, borderRadius: 999, background: chanColor, marginTop: 4, border: `2px solid ${T.bg}`, flexShrink: 0 }} />
                        {!isLast && <span style={{ flex: 1, width: 2, background: T.line, marginTop: 2 }} />}
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{EVENT_LABELS[a.eventType] || a.eventType}</span>
                          <time style={{ fontSize: 11, color: T.inkMute, whiteSpace: 'nowrap' }}>{timeAgo(a.occurredAt)}</time>
                        </div>
                        {txt && <p style={{ margin: '2px 0 0', fontSize: 12, color: T.inkDim, lineHeight: 1.45, overflowWrap: 'anywhere' }}>{txt}</p>}
                      </div>
                    </li>
                  )
                })}
                {(!timeline || timeline.length === 0) && (
                  <li style={{ color: T.inkMute, fontSize: 13 }}>No timeline events yet.</li>
                )}
              </ol>
            </div>
          </>)}
        </div>
      </div>
    </>
  )
}
