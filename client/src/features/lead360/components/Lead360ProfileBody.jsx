import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TemperatureBadge } from '@/components/ui/badge'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import {
  TEMP_STYLES, INTENT_STYLES, SENT_STYLES, RISK_STYLES, INVOICE_STYLES, CHAN_STYLES,
  COMPONENT_STYLES, EVENT_LABELS, ACTION_LABELS, SIGNAL_LABELS, timeAgo,
} from '../lib/theme'
import { ScoreRing, ScoreMeter, Tile, CompBar, ActivitySparkline, StatusBadge } from './Lead360Atoms'

export default function Lead360ProfileBody({ data }) {
  const { lead, score, sentiment, aiSummary, nextBestAction, intentSignals, behaviour, financial, timeline } = data
  const tempMeta = TEMP_STYLES[score.temperature] || TEMP_STYLES.COLD
  const intentMeta = INTENT_STYLES[score.buyingIntent] || INTENT_STYLES.LOW
  const sentMeta = SENT_STYLES[sentiment?.label] || SENT_STYLES.NEUTRAL
  const b = behaviour

  return (
    <div className="space-y-4">
      {/* Masthead */}
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-4 items-start flex-wrap">
            <Avatar className="w-14 h-14 rounded-xl">
              <AvatarFallback className="rounded-xl text-base">{getInitials(lead.basic.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{lead.basic.name}</h2>
                {lead.company?.name && <span className="text-muted-foreground text-sm">· {lead.company.name}</span>}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {lead.basic.email || lead.basic.phone} · active {timeAgo(lead.lastActivityAt)} · {lead.leadSource}
              </div>
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                <StatusBadge className={intentMeta.badge} label={intentMeta.label} />
                <StatusBadge className={sentMeta.badge} label={sentMeta.label} />
                <StatusBadge
                  className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  label={`Opportunity ${score.opportunityScore}`}
                  title="Composite conversion likelihood"
                />
              </div>
            </div>

            <ScoreRing value={score.leadScore} strokeClass={tempMeta.stroke} size={52} />
          </div>

          <div className="mt-5">
            <ScoreMeter score={score.leadScore} textClass={tempMeta.text} bgClass={tempMeta.bg} label={tempMeta.label} hint={tempMeta.hint} />
          </div>
        </CardContent>
      </Card>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 items-start">

        {/* LEFT column */}
        <div className="space-y-4">

          {/* Lead Requirements */}
          {(lead.product?.name || lead.usage || lead.description || (lead.images && lead.images.length > 0)) && (
            <Card>
              <CardHeader className="p-4 pb-3">
                <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">Requirement</div>
                <CardTitle className="text-sm font-semibold">Lead Details & Needs</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {lead.product?.name && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Product</span>
                      <div className="text-sm font-medium text-foreground">{lead.product.name} {lead.product.quantity ? `(Qty: ${lead.product.quantity})` : ''}</div>
                    </div>
                  )}
                  {lead.usage && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Usage / Purpose</span>
                      <div className="text-sm text-foreground">{lead.usage}</div>
                    </div>
                  )}
                  {lead.description && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Description</span>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{lead.description}</p>
                    </div>
                  )}
                  {lead.images?.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Attached Images</span>
                      <div className="flex flex-wrap gap-2">
                        {lead.images.map((imgUrl, i) => (
                          <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-md border border-border hover:opacity-80 transition-opacity">
                            <img src={imgUrl} alt="Attached" className="object-cover w-full h-full" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          <Card>
            <CardHeader className="p-4 pb-3">
              <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">AI read</div>
              <CardTitle className="text-sm font-semibold">Insights & recommendation</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex gap-3 items-start p-3.5 rounded-lg bg-primary/10 border border-primary/20 mb-3.5">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0 ring-4 ring-primary/20" />
                <div className="flex-1">
                  <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold mb-0.5">
                    Next best action · {(nextBestAction?.priority || 'medium').toLowerCase()} priority
                  </div>
                  <div className="text-base font-bold text-foreground">{ACTION_LABELS[nextBestAction?.action] || nextBestAction?.action}</div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{nextBestAction?.reason}</p>
                </div>
              </div>

              <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground">{aiSummary?.text}</p>

              <div className="flex gap-1.5 flex-wrap mb-3.5">
                <StatusBadge className={sentMeta.badge} label={`Sentiment · ${sentMeta.label}`} />
                <StatusBadge className={intentMeta.badge} label={`${intentMeta.label} · ${score.buyingIntentScore}`} />
              </div>

              {intentSignals?.length > 0 && <>
                <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold mb-2">Buying signals detected</div>
                <div className="grid gap-1.5">
                  {intentSignals.map((s, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground px-2.5 py-1.5 rounded-md bg-muted/50">
                      <span>{SIGNAL_LABELS[s.signal] || s.signal}</span>
                      {s.count && <span className="font-mono text-muted-foreground">×{s.count}</span>}
                    </div>
                  ))}
                </div>
              </>}
            </CardContent>
          </Card>

          {/* Engagement breakdown */}
          <Card>
            <CardHeader className="p-4 pb-3">
              <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">Observed behaviour</div>
              <CardTitle className="text-sm font-semibold">Engagement breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold mb-2.5">Why this score</div>
              <div className="grid gap-2.5">
                {COMPONENT_STYLES.map(c => (
                  <CompBar key={c.key} label={c.label} value={score.components[c.key] || 0} barClass={c.bar} />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
                <Tile label="Website visits"   value={b.website.totalVisits}      sub={`${b.website.uniqueDays} active days`} />
                <Tile label="Conversations"    value={b.product.views}            sub={`${b.product.distinctProducts} sessions`} />
                <Tile label="Documents"        value={b.product.downloads}        sub="shared / downloaded" />
                <Tile label="WhatsApp replies" value={b.whatsapp.replies}         sub={b.whatsapp.avgResponseMinutes ? `~${b.whatsapp.avgResponseMinutes}m to reply` : ''} />
                <Tile label="Calls"            value={b.call.made + b.call.received} sub={b.call.avgDurationSeconds ? `~${Math.round(b.call.avgDurationSeconds / 60)}m avg` : ''} />
                <Tile label="Quotations"       value={b.quotation.viewed}         sub={`${b.quotation.accepted} accepted`} />
              </div>
            </CardContent>
          </Card>

          {/* Activity sparkline */}
          <Card>
            <CardHeader className="p-4 pb-3">
              <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">Momentum</div>
              <CardTitle className="text-sm font-semibold">Activity · last 14 days</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ActivitySparkline timeline={timeline} />
            </CardContent>
          </Card>

          {/* Financial */}
          {financial && (() => {
            const riskMeta = RISK_STYLES[financial.paymentRisk?.band] || RISK_STYLES.LOW
            return (
              <Card>
                <CardHeader className="p-4 pb-3 flex-row items-center justify-between space-y-0">
                  <div>
                    <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">Internal · billing</div>
                    <CardTitle className="text-sm font-semibold">Financial profile</CardTitle>
                  </div>
                  <StatusBadge className={riskMeta.badge} label={riskMeta.label} title={`Risk score ${financial.paymentRisk.score}/100`} />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Tile label="Lifetime value" value={formatCurrency(financial.totalRevenue)} />
                    <Tile label="Orders"         value={financial.totalOrders} />
                    <Tile label="Avg order"      value={formatCurrency(financial.averageOrderValue)} />
                    <Tile label="Outstanding"    value={formatCurrency(financial.outstandingAmount)} accentClass={financial.outstandingAmount > 0 ? 'text-warm' : undefined} />
                  </div>
                  {financial.invoiceHistory?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold mb-2">Recent invoices</div>
                      <div className="grid gap-1.5">
                        {financial.invoiceHistory.map((inv, i) => (
                          <div key={i} className="flex justify-between items-center text-xs px-2.5 py-1.5 rounded-md bg-muted/50">
                            <span className="text-muted-foreground">{inv.invoiceId}</span>
                            <div className="flex gap-2.5 items-center">
                              <span className="font-mono text-foreground">{formatCurrency(inv.amount)}</span>
                              <StatusBadge className={INVOICE_STYLES[inv.status] || INVOICE_STYLES.PENDING} label={inv.status[0] + inv.status.slice(1).toLowerCase()} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}
        </div>

        {/* RIGHT column — Timeline */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">History</div>
            <CardTitle className="text-sm font-semibold">Activity timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ol className="list-none m-0 p-0">
              {(timeline || []).map((a, i) => {
                const chanClass = CHAN_STYLES[a.channel] || CHAN_STYLES.system
                const isLast = i === (timeline.length - 1)
                const txt = a.payload?.text || a.payload?.pageUrl || a.payload?.productName || ''
                return (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={cn('w-2.5 h-2.5 rounded-full mt-1 border-2 border-card flex-shrink-0', chanClass)} />
                      {!isLast && <span className="flex-1 w-0.5 bg-border mt-0.5" />}
                    </div>
                    <div className={cn('flex-1 min-w-0', isLast ? 'pb-0' : 'pb-4')}>
                      <div className="flex justify-between gap-2 items-baseline">
                        <span className="text-sm font-semibold text-foreground">{EVENT_LABELS[a.eventType] || a.eventType}</span>
                        <time className="text-[11px] text-muted-foreground whitespace-nowrap">{timeAgo(a.occurredAt)}</time>
                      </div>
                      {txt && <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed break-words">{txt}</p>}
                    </div>
                  </li>
                )
              })}
              {(!timeline || timeline.length === 0) && (
                <li className="text-muted-foreground text-sm">No timeline events yet.</li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
