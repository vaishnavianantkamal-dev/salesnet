// Lead 360° status → styling maps, using the same Tailwind/shadcn tokens
// (bg-x-100 / dark:bg-x-900/30 badge pattern, hot/warm/cold accent colors)
// as the rest of the app (see LeadDetailPage, TasksPage, badge.jsx).

// Literal Tailwind utility classes per temperature — using the app's hot/warm/cold
// palette (tailwind.config.js). Written out in full (not template-built) so the
// Tailwind JIT scanner can find them.
export const TEMP_STYLES = {
  HOT:  { label: 'Hot',  hint: 'Acting now', text: 'text-hot',  stroke: 'stroke-hot',  bg: 'bg-hot' },
  WARM: { label: 'Warm', hint: 'Engaged',    text: 'text-warm', stroke: 'stroke-warm', bg: 'bg-warm' },
  COLD: { label: 'Cold', hint: 'Dormant',    text: 'text-cold', stroke: 'stroke-cold', bg: 'bg-cold' },
}

export const INTENT_STYLES = {
  HIGH:   { label: 'High intent',   badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  MEDIUM: { label: 'Medium intent', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  LOW:    { label: 'Low intent',    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export const SENT_STYLES = {
  POSITIVE:       { label: 'Positive',       badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INTERESTED:     { label: 'Interested',     badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  URGENT:         { label: 'Urgent',         badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  NEGATIVE:       { label: 'Negative',       badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  NOT_INTERESTED: { label: 'Not interested', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CONFUSED:       { label: 'Confused',       badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  NEUTRAL:        { label: 'Neutral',        badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export const RISK_STYLES = {
  LOW:    { label: 'Low risk',    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  MEDIUM: { label: 'Medium risk', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  HIGH:   { label: 'High risk',   badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export const INVOICE_STYLES = {
  PAID:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export const EVENT_LABELS = {
  LEAD_CREATED:      'Lead created',
  WHATSAPP_REPLIED:  'Replied on WhatsApp',
  WHATSAPP_READ:     'WhatsApp read',
  WEBSITE_VISIT:     'Activity logged',
  PRODUCT_VIEW:      'Note added',
  CALL_MADE:         'Call logged',
  MEETING_SCHEDULED: 'Meeting scheduled',
  QUOTATION_VIEWED:  'Quotation viewed',
  PAYMENT_RECEIVED:  'Payment received',
}

export const ACTION_LABELS = {
  CALL_TODAY:         'Call today',
  SCHEDULE_MEETING:   'Schedule a meeting',
  SEND_BROCHURE:      'Send brochure',
  SEND_PRODUCT_DEMO:  'Send product demo',
  OFFER_DISCOUNT:     'Offer a discount',
  FOLLOW_UP_TOMORROW: 'Follow up tomorrow',
  ASSIGN_SENIOR_EXEC: 'Assign a senior exec',
  NURTURE:            'Add to nurture',
}

export const SIGNAL_LABELS = {
  repeatedWebsiteVisits: 'Repeated website visits',
  repeatedProductViews:  'Repeated activity sessions',
  quotationRequested:    'Requested a quotation',
  pricingPageViewed:     'Viewed pricing',
  meetingRequested:      'Requested a meeting',
  fastReply:              'Replies quickly',
  catalogViewed:          'Browsed the catalog',
}

// Timeline rail dot colors, per channel — solid Tailwind bg utilities.
export const CHAN_STYLES = {
  whatsapp: 'bg-green-500',
  website:  'bg-sky-500',
  call:     'bg-amber-500',
  meeting:  'bg-indigo-500',
  system:   'bg-gray-400',
}

// Score-component breakdown bar colors.
export const COMPONENT_STYLES = [
  { key: 'engagement',     label: 'Engagement',     bar: 'bg-sky-500' },
  { key: 'recency',        label: 'Recency',        bar: 'bg-amber-500' },
  { key: 'frequency',      label: 'Frequency',      bar: 'bg-indigo-500' },
  { key: 'responsiveness', label: 'Responsiveness', bar: 'bg-green-500' },
]

export function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.round((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60); if (m < 60) return m + 'm ago'
  const h = Math.round(m / 60); if (h < 24) return h + 'h ago'
  const d = Math.round(h / 24); if (d < 30) return d + 'd ago'
  return Math.round(d / 30) + 'mo ago'
}
