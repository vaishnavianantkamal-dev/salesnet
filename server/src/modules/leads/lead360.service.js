'use strict';

const Lead = require('../../models/Lead.model');
const Activity = require('../../models/Activity.model');
const Conversation = require('../../models/Conversation.model');
const Payment = require('../../models/Payment.model');
const Quotation = require('../../models/Quotation.model');
const { AppError } = require('../../middlewares/error.middleware');
const config = require('../../config/env');
const logger = require('../../utils/logger');

class Lead360Service {
  async get360(leadId) {
    const lead = await Lead.findById(leadId)
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    if (!lead || lead.isDeleted) throw new AppError('Lead not found', 404);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [activities, conversations, payments, quotations] = await Promise.all([
      Activity.find({ lead: leadId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }).lean(),
      Conversation.find({ lead: leadId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }).lean(),
      Payment.find({ lead: leadId }).sort({ createdAt: -1 }).lean(),
      Quotation.find({ lead: leadId }).sort({ createdAt: -1 }).lean(),
    ]);

    // ── Score components ────────────────────────────────────────────────────
    const hoursSince = lead.lastActivityAt
      ? (Date.now() - new Date(lead.lastActivityAt)) / 3600000
      : 999;

    const recencyScore = Math.min(100, Math.round(
      hoursSince < 1  ? 100 :
      hoursSince < 6  ? 92  :
      hoursSince < 24 ? 82  :
      hoursSince < 48 ? 65  :
      hoursSince < 72 ? 50  :
      hoursSince < 168 ? 35 :
      Math.max(5, 30 - Math.floor(hoursSince / 24))
    ));

    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
    const recentActivities = activities.filter(a => new Date(a.createdAt) >= fourteenDaysAgo);
    const frequencyScore = Math.min(100, recentActivities.length * 14);

    const inboundConvs = conversations.filter(c => c.direction === 'inbound');
    const avgResponseMinutes = inboundConvs.length > 0
      ? Math.round(inboundConvs.reduce((s, c) => s + (c.metadata?.responseTimeMinutes || 60), 0) / inboundConvs.length)
      : null;
    const responsivenessScore = avgResponseMinutes === null ? 50
      : avgResponseMinutes < 5   ? 100
      : avgResponseMinutes < 15  ? 88
      : avgResponseMinutes < 60  ? 72
      : avgResponseMinutes < 180 ? 52
      : avgResponseMinutes < 480 ? 32
      : 15;

    const engagementScore = Math.min(100, Math.round(
      recencyScore * 0.30 + frequencyScore * 0.35 + responsivenessScore * 0.35
    ));

    const leadScore = lead.score && lead.score > 0 ? lead.score
      : Math.min(100, Math.round(engagementScore * 0.45 + recencyScore * 0.30 + frequencyScore * 0.25));

    const temperature = (lead.temperature || 'cold').toUpperCase();
    const buyingIntentScore = Math.min(100, Math.round(leadScore * 0.82 + engagementScore * 0.18));
    const buyingIntent = buyingIntentScore >= 68 ? 'HIGH' : buyingIntentScore >= 42 ? 'MEDIUM' : 'LOW';
    const opportunityScore = Math.min(100, Math.round(leadScore * 0.55 + engagementScore * 0.45));

    // ── Intent signals ───────────────────────────────────────────────────────
    const intentSignals = [];
    if (quotations.length > 0) intentSignals.push({ signal: 'quotationRequested' });
    if (inboundConvs.length >= 3) intentSignals.push({ signal: 'fastReply', count: inboundConvs.length });
    if (recentActivities.length >= 3) intentSignals.push({ signal: 'repeatedProductViews', count: recentActivities.length });
    if (activities.some(a => a.type === 'meeting')) intentSignals.push({ signal: 'meetingRequested' });
    if (activities.length >= 5) intentSignals.push({ signal: 'repeatedWebsiteVisits', count: activities.length });

    // ── Sentiment ────────────────────────────────────────────────────────────
    let sentiment = 'NEUTRAL';
    const lastConvText = (conversations[0]?.content || '').toLowerCase();
    if (/urgent|asap|today|now|immediately/.test(lastConvText)) {
      sentiment = 'URGENT';
    } else if (temperature === 'HOT' && leadScore >= 70) {
      sentiment = 'INTERESTED';
    } else if (temperature === 'HOT') {
      sentiment = 'POSITIVE';
    } else if (temperature === 'WARM') {
      sentiment = 'POSITIVE';
    } else if (temperature === 'COLD' && leadScore < 35) {
      sentiment = 'CONFUSED';
    }

    // ── Next best action ─────────────────────────────────────────────────────
    const nextBestAction = this._getNextBestAction(temperature, lead.stage, leadScore, sentiment, intentSignals);

    // ── Behaviour stats ──────────────────────────────────────────────────────
    const outboundConvs = conversations.filter(c => c.direction === 'outbound');
    const callActivities = activities.filter(a => a.type === 'call');
    const behaviour = {
      website: { totalVisits: Math.max(0, recentActivities.length - 1), uniqueDays: Math.min(recentActivities.length, 7) },
      product: {
        views: activities.filter(a => a.type === 'note').length,
        distinctProducts: Math.min(activities.filter(a => a.type === 'note').length, 3),
        downloads: quotations.length,
      },
      whatsapp: {
        replies: inboundConvs.length,
        avgResponseMinutes: avgResponseMinutes || 0,
        sent: outboundConvs.length,
      },
      call: {
        made: callActivities.length,
        received: 0,
        avgDurationSeconds: callActivities.length ? 180 : 0,
      },
      quotation: {
        viewed: quotations.length,
        accepted: quotations.filter(q => ['accepted', 'approved'].includes(q.status)).length,
      },
    };

    // ── Financial ────────────────────────────────────────────────────────────
    let financial = null;
    if (payments.length > 0) {
      const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const outstanding = payments
        .filter(p => ['pending', 'overdue'].includes(p.status))
        .reduce((s, p) => s + (p.amount || 0), 0);

      financial = {
        currency: 'INR',
        totalRevenue,
        totalOrders: payments.length,
        averageOrderValue: payments.length ? Math.round(totalRevenue / payments.length) : 0,
        outstandingAmount: outstanding,
        paymentRisk: {
          band: outstanding > totalRevenue * 0.3 ? 'HIGH' : outstanding > 0 ? 'MEDIUM' : 'LOW',
          score: Math.min(100, Math.round((outstanding / Math.max(totalRevenue, 1)) * 100)),
        },
        invoiceHistory: payments.slice(0, 5).map(p => ({
          invoiceId: p.invoiceNo || 'INV-' + String(p._id).slice(-6).toUpperCase(),
          amount: p.amount,
          status: p.status === 'completed' ? 'PAID' : p.status === 'overdue' ? 'OVERDUE' : 'PENDING',
        })),
      };
    }

    // ── Timeline ─────────────────────────────────────────────────────────────
    const timeline = this._buildTimeline(activities, conversations, lead);

    // ── AI summary ───────────────────────────────────────────────────────────
    let aiSummary = { text: this._ruleBasedSummary(lead, leadScore, temperature, behaviour, intentSignals, sentiment) };
    if (config.OPENAI_API_KEY) {
      try { aiSummary = await this._openAISummary(lead, { leadScore, temperature, behaviour, intentSignals, sentiment, nextBestAction }); }
      catch (err) { logger.warn(`AI summary fallback: ${err.message}`); }
    }

    return {
      lead: {
        _id: lead._id,
        basic: {
          name: lead.contact?.name || 'Unknown',
          email: lead.contact?.email || '',
          phone: lead.contact?.phone || '',
        },
        company: { name: lead.contact?.company || lead.company?.name || '' },
        leadSource: (lead.source || 'unknown').replace(/_/g, ' '),
        stage: lead.stage,
        lastActivityAt: lead.lastActivityAt || lead.updatedAt,
        assignedTo: lead.assignedTo,
      },
      score: {
        leadScore: Math.round(leadScore),
        temperature,
        engagementScore: Math.round(engagementScore),
        buyingIntentScore: Math.round(buyingIntentScore),
        buyingIntent,
        opportunityScore: Math.round(opportunityScore),
        components: {
          engagement: Math.round(engagementScore),
          recency: Math.round(recencyScore),
          frequency: Math.round(frequencyScore),
          responsiveness: Math.round(responsivenessScore),
        },
      },
      sentiment: { label: sentiment },
      aiSummary,
      nextBestAction,
      intentSignals,
      behaviour,
      financial,
      timeline,
    };
  }

  _getNextBestAction(temperature, stage, score, sentiment, signals) {
    const hasQuotation = signals.some(s => s.signal === 'quotationRequested');
    if (sentiment === 'URGENT')
      return { action: 'CALL_TODAY', priority: 'HIGH', reason: 'The lead is expressing urgency — call today before the moment passes.' };
    if (temperature === 'HOT' && hasQuotation)
      return { action: 'SCHEDULE_MEETING', priority: 'HIGH', reason: 'High intent with a quotation already sent — push for a closing meeting.' };
    if (temperature === 'HOT' && score >= 70)
      return { action: 'CALL_TODAY', priority: 'HIGH', reason: 'High score with recent engagement — strike while the iron is hot.' };
    if (temperature === 'HOT')
      return { action: 'SEND_PRODUCT_DEMO', priority: 'MEDIUM', reason: 'Warm engagement without a quotation yet — a demo will sharpen interest.' };
    if (temperature === 'WARM' && hasQuotation)
      return { action: 'FOLLOW_UP_TOMORROW', priority: 'MEDIUM', reason: 'Quotation sent but no response — follow up with a nudge tomorrow.' };
    if (temperature === 'WARM')
      return { action: 'SEND_PRODUCT_DEMO', priority: 'MEDIUM', reason: 'Moderate engagement — a targeted product demo can deepen interest.' };
    if (stage === 'new' || stage === 'contacted')
      return { action: 'SEND_BROCHURE', priority: 'MEDIUM', reason: 'Early-stage lead — send a brochure to establish value and open the conversation.' };
    return { action: 'NURTURE', priority: 'LOW', reason: 'Low engagement — add to a nurture sequence to keep the brand visible.' };
  }

  _buildTimeline(activities, conversations, lead) {
    const ATYPE_MAP = {
      call: { eventType: 'CALL_MADE', channel: 'call' },
      meeting: { eventType: 'MEETING_SCHEDULED', channel: 'meeting' },
      message_sent: { eventType: 'WHATSAPP_READ', channel: 'whatsapp' },
      status_change: { eventType: 'WEBSITE_VISIT', channel: 'system' },
      note: { eventType: 'PRODUCT_VIEW', channel: 'website' },
      email: { eventType: 'WEBSITE_VISIT', channel: 'system' },
      assignment: { eventType: 'LEAD_CREATED', channel: 'system' },
      score_update: { eventType: 'WEBSITE_VISIT', channel: 'system' },
    };

    const events = [];

    activities.slice(0, 8).forEach(a => {
      const mapped = ATYPE_MAP[a.type] || { eventType: 'WEBSITE_VISIT', channel: 'system' };
      events.push({ ...mapped, occurredAt: a.createdAt, payload: { text: a.description } });
    });

    conversations.slice(0, 5).forEach(c => {
      events.push({
        eventType: c.direction === 'inbound' ? 'WHATSAPP_REPLIED' : 'WHATSAPP_READ',
        channel: 'whatsapp',
        occurredAt: c.createdAt,
        payload: c.direction === 'inbound' ? { text: c.content?.slice(0, 120) } : {},
      });
    });

    events.push({ eventType: 'LEAD_CREATED', channel: 'system', occurredAt: lead.createdAt, payload: {} });

    return events.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)).slice(0, 14);
  }

  _ruleBasedSummary(lead, score, temperature, behaviour, signals, sentiment) {
    const name = (lead.contact?.name || 'This lead').split(' ')[0];
    const company = lead.contact?.company || lead.company?.name || 'their company';
    const src = (lead.source || 'an enquiry').replace(/_/g, ' ');
    const wa = behaviour.whatsapp.replies;
    const q = behaviour.quotation.viewed;

    if (temperature === 'HOT') {
      return `${name} from ${company} is your hottest open lead with a score of ${Math.round(score)}.${wa > 0 ? ` Active on WhatsApp with ${wa} recent repl${wa > 1 ? 'ies' : 'y'}.` : ''}${q > 0 ? ` A quotation has been shared and viewed.` : ''} Act promptly — high-intent leads cool off fast.`;
    }
    if (temperature === 'WARM') {
      return `${name} from ${company} came in via ${src} and is warming up (score: ${Math.round(score)}).${wa > 0 ? ` They've replied on WhatsApp ${wa} time${wa > 1 ? 's' : ''}.` : ''} Continue nurturing with targeted content to push toward a decision.`;
    }
    return `${name} from ${company} enquired via ${src} but engagement has been low (score: ${Math.round(score)}). Consider sending a concise brochure or personalised follow-up to re-spark interest.`;
  }

  async _openAISummary(lead, { leadScore, temperature, behaviour, intentSignals, sentiment, nextBestAction }) {
    const axios = require('axios');
    const name = lead.contact?.name || 'this lead';
    const company = lead.contact?.company || lead.company?.name || '';
    const prompt = [
      `You are a CRM sales intelligence assistant. Write 2-3 concise, action-oriented sentences about this lead for the sales team.`,
      `Lead: ${name}${company ? ' from ' + company : ''}`,
      `Score: ${leadScore}/100, Temperature: ${temperature}, Sentiment: ${sentiment}`,
      `WhatsApp replies: ${behaviour.whatsapp.replies}, Quotations: ${behaviour.quotation.viewed}`,
      `Signals: ${intentSignals.map(s => s.signal).join(', ') || 'none'}`,
      `Recommended next action: ${nextBestAction.action}`,
      `Be specific. Do not start with "This lead". Mention name and company.`,
    ].join('\n');

    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 130, temperature: 0.65 },
      { headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` }, timeout: 8000 }
    );
    return { text: res.data.choices[0].message.content.trim() };
  }
}

module.exports = new Lead360Service();
