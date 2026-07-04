'use strict';

const axios = require('axios');
const mongoose = require('mongoose');

const conversationRepository = require('./conversation.repository');
const leadRepository = require('../leads/lead.repository');
const Activity = require('../../models/Activity.model');
const Lead = require('../../models/Lead.model');
const ScoringRule = require('../../models/ScoringRule.model');
const LeadScore = require('../../models/LeadScore.model');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');
const { CHANNELS, MESSAGE_TYPES, DELIVERY_STATUS, ACTIVITY_TYPES, SCORING_EVENTS } = require('../../utils/constants');
const { emitToLead } = require('../../config/socket');
const config = require('../../config/env');
const logger = require('../../utils/logger');

class ConversationService {
  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Look up the scoring rule for a given event and apply the points to the lead.
   * Silently skips if no active rule exists.
   */
  async _applyScoring(leadId, event, performedById) {
    try {
      const rule = await ScoringRule.findOne({ event, isActive: true }).lean();
      if (!rule) return;

      const lead = await Lead.findById(leadId).select('score').lean();
      if (!lead) return;

      const previousScore = lead.score || 0;
      const newScore = previousScore + rule.points;

      await Promise.all([
        Lead.findByIdAndUpdate(leadId, { $inc: { score: rule.points } }),
        LeadScore.create({
          lead: leadId,
          event,
          points: rule.points,
          previousScore,
          newScore,
          triggeredBy: performedById ? 'user' : 'system',
          performedBy: performedById || null,
        }),
      ]);
    } catch (err) {
      logger.warn(`Scoring skipped for event=${event} leadId=${leadId}: ${err.message}`);
    }
  }

  /**
   * Create an Activity record.
   */
  async _createActivity(leadId, type, description, performedBy, metadata = {}) {
    try {
      await Activity.create({ lead: leadId, type, description, performedBy, metadata });
    } catch (err) {
      logger.warn(`Activity creation failed for lead=${leadId}: ${err.message}`);
    }
  }

  /**
   * Build the Meta Cloud API headers and base URL.
   */
  async _metaApiConfig() {
    const Integration = mongoose.model('Integration');
    const integration = await Integration.findOne({ name: 'meta_whatsapp' }).lean();

    const accessToken = integration?.config?.accessToken || config.WA_ACCESS_TOKEN;
    const phoneNumberId = integration?.config?.phoneNumberId || config.WA_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      throw new AppError('WhatsApp integration is not configured', 503);
    }
    return {
      url: `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Public service methods
  // ---------------------------------------------------------------------------

  /**
   * Get paginated conversation messages for a lead.
   * @param {string} leadId
   * @param {Object} query  - page, limit, sort, order
   * @param {Object} currentUser
   */
  async getConversations(leadId, query, currentUser) {
    // Verify lead exists and user has visibility
    await leadRepository.findById(leadId);

    const { page, limit, skip, sort } = getPaginationOptions(query);

    const { data, total } = await conversationRepository.findByLead(leadId, {
      skip,
      limit,
      sort,
    });

    return {
      conversations: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Send a WhatsApp template message via Meta Cloud API.
   * Stores the conversation record, creates an Activity, applies scoring.
   *
   * @param {string} leadId
   * @param {string} templateName
   * @param {string} languageCode
   * @param {Array}  params         - array of parameter values for the template body
   * @param {Object} sentBy         - user document (req.user)
   */
  async sendWhatsAppTemplate(leadId, templateName, languageCode = 'en', params = [], sentBy) {
    const lead = await leadRepository.findById(leadId);
    const phone = lead.contact && lead.contact.phone;
    if (!phone) {
      throw new AppError('Lead does not have a phone number', 422);
    }

    const { url, headers } = await this._metaApiConfig();

    // Build component parameters
    const components = [];
    if (params && params.length > 0) {
      components.push({
        type: 'body',
        parameters: params.map((p) => ({ type: 'text', text: String(p) })),
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length ? { components } : {}),
      },
    };

    let waMessageId = null;
    try {
      const response = await axios.post(url, payload, { headers });
      waMessageId =
        response.data &&
        response.data.messages &&
        response.data.messages[0] &&
        response.data.messages[0].id
          ? response.data.messages[0].id
          : null;
    } catch (err) {
      const metaError =
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error.message
          : err.message;
      logger.error(`Meta API template send failed: ${metaError}`);
      throw new AppError(`WhatsApp send failed: ${metaError}`, 502);
    }

    const templateContent = `[Template: ${templateName}]${params.length ? ' - ' + params.join(', ') : ''}`;

    const conversation = await conversationRepository.create({
      lead: leadId,
      channel: CHANNELS.WHATSAPP,
      direction: 'outbound',
      messageType: MESSAGE_TYPES.TEMPLATE,
      content: templateContent,
      deliveryStatus: DELIVERY_STATUS.SENT,
      externalMessageId: waMessageId,
      sentBy: sentBy._id || sentBy.id,
      whatsappData: { templateName, languageCode, params },
    });

    // Update lead's last activity timestamp
    await Lead.findByIdAndUpdate(leadId, { $set: { lastActivityAt: new Date() } });

    // Activity log
    await this._createActivity(
      leadId,
      ACTIVITY_TYPES.MESSAGE_SENT,
      `WhatsApp template "${templateName}" sent`,
      sentBy._id || sentBy.id,
      { templateName, languageCode, messageId: waMessageId }
    );

    // Scoring
    await this._applyScoring(leadId, SCORING_EVENTS.LEAD_CONTACTED, sentBy._id || sentBy.id);

    return conversation;
  }

  /**
   * Send a free-text WhatsApp message (within 24 h customer-service window) directly via Meta API.
   */
  async sendWhatsAppMessage(leadId, messageText, sentBy) {
    const lead = await leadRepository.findById(leadId);
    const phone = lead.contact && lead.contact.phone;
    if (!phone) {
      throw new AppError('Lead does not have a phone number', 422);
    }

    const { url, headers } = await this._metaApiConfig();

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    };

    let waMessageId = null;
    try {
      const response = await axios.post(url, payload, { headers });
      waMessageId =
        response.data &&
        response.data.messages &&
        response.data.messages[0] &&
        response.data.messages[0].id
          ? response.data.messages[0].id
          : null;
    } catch (err) {
      const metaError =
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error.message
          : err.message;
      logger.error(`Meta API text send failed: ${metaError}`);
      throw new AppError(`WhatsApp send failed: ${metaError}`, 502);
    }

    const conversation = await conversationRepository.create({
      lead: leadId,
      channel: CHANNELS.WHATSAPP,
      direction: 'outbound',
      messageType: MESSAGE_TYPES.TEXT,
      content: messageText,
      deliveryStatus: DELIVERY_STATUS.SENT,
      externalMessageId: waMessageId,
      sentBy: sentBy._id || sentBy.id,
      whatsappData: null,
    });

    // Update lead's last activity timestamp
    await Lead.findByIdAndUpdate(leadId, { $set: { lastActivityAt: new Date() } });

    // Activity log
    await this._createActivity(
      leadId,
      ACTIVITY_TYPES.MESSAGE_SENT,
      `WhatsApp message sent`,
      sentBy._id || sentBy.id,
      { messageId: waMessageId }
    );

    // Scoring
    await this._applyScoring(leadId, SCORING_EVENTS.LEAD_CONTACTED, sentBy._id || sentBy.id);

    return conversation;
  }

  /**
   * Send a free-text Facebook message via Wapzio.
   */
  async sendFacebookMessage(leadId, messageText, sentBy) {
    return this._sendWapzioMessage(leadId, messageText, sentBy, 'facebook', 'https://api.wapzio.com/api/webhook/facebook');
  }

  /**
   * Send a free-text Instagram message via Wapzio.
   */
  async sendInstagramMessage(leadId, messageText, sentBy) {
    return this._sendWapzioMessage(leadId, messageText, sentBy, 'instagram', 'https://api.wapzio.com/api/webhook/instagram');
  }

  /**
   * Internal helper to send omnichannel messages via Wapzio
   */
  async _sendWapzioMessage(leadId, messageText, sentBy, channel, endpoint) {
    const lead = await leadRepository.findById(leadId);
    const phone = lead.contact && lead.contact.phone;
    if (!phone) {
      throw new AppError('Lead does not have a phone number or identifier', 422);
    }

    // You may need to add Wapzio API Keys here
    const headers = { 'Content-Type': 'application/json' };

    // This payload is a best-guess based on standard webhook architectures.
    const payload = {
      to: phone,
      channel: channel,
      type: 'text',
      text: messageText,
    };

    let wapzioMessageId = null;
    try {
      const response = await axios.post(endpoint, payload, { headers });
      wapzioMessageId = response.data?.id || response.data?.messageId || null;
    } catch (err) {
      const metaError = err.response?.data?.error?.message || err.message;
      logger.error(`Wapzio API message send failed: ${metaError}`);
      throw new AppError(`Wapzio send failed: ${metaError}`, 502);
    }

    const conversation = await conversationRepository.create({
      lead: leadId,
      channel: channel,
      direction: 'outbound',
      messageType: MESSAGE_TYPES.TEXT,
      content: messageText,
      deliveryStatus: DELIVERY_STATUS.SENT,
      externalMessageId: wapzioMessageId,
      sentBy: sentBy._id || sentBy.id,
      whatsappData: null, // Could rename to channelData in the future
    });

    // Update lead's last activity timestamp
    await Lead.findByIdAndUpdate(leadId, { $set: { lastActivityAt: new Date() } });

    // Activity log
    await this._createActivity(
      leadId,
      ACTIVITY_TYPES.MESSAGE_SENT,
      `${channel} message sent`,
      sentBy._id || sentBy.id,
      { messageId: wapzioMessageId, channel }
    );

    // Scoring
    await this._applyScoring(leadId, SCORING_EVENTS.LEAD_CONTACTED, sentBy._id || sentBy.id);

    return conversation;
  }


  /**
   * Inbox: latest conversation per lead for the requesting user.
   * Super admins / admins see all; others see only their assigned leads.
   *
   * @param {Object} query       - page, limit
   * @param {Object} currentUser
   */
  async getInbox(query, currentUser) {
    const { page, limit, skip } = getPaginationOptions(query);

    const roleKey = currentUser.role && currentUser.role.key;
    const isAdmin = roleKey === 'super_admin' || roleKey === 'admin';

    // Build match conditions for inbox aggregation
    const matchStage = {};
    if (query.channel) {
      matchStage.channel = query.channel;
    }

    const { data, total } = await conversationRepository.findInbox(matchStage, { skip, limit });

    // For non-admins, filter to assigned leads post-aggregation (the aggregation
    // already joins lead info, so we can filter in-process here for correctness;
    // alternatively this is enforced by the aggregation $match on assignedTo).
    const userId = String(currentUser._id || currentUser.id);
    const filtered = isAdmin
      ? data
      : data.filter((item) => {
          const assignedTo = item.lead && item.lead.assignedTo;
          return assignedTo && String(assignedTo._id) === userId;
        });

    return {
      inbox: filtered,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Process an inbound WhatsApp message payload from Meta webhook.
   * Stores the conversation, applies scoring, updates lead, emits socket event.
   *
   * @param {Object} payload - normalized inbound message object
   *   Expected fields: waMessageId, from (phone), text, messageType, mediaUrl, timestamp, waData
   */
  async handleInboundMessage(payload) {
    const { waMessageId, from, text, messageType = 'text', mediaUrl = null, channel = 'whatsapp', waData = {} } = payload;

    if (!from) {
      logger.warn('handleInboundMessage: missing "from" phone number');
      return;
    }

    // Find lead by phone number
    const lead = await Lead.findOne({
      'contact.phone': from,
      isDeleted: false,
    }).lean();

    if (!lead) {
      logger.warn(`handleInboundMessage: no lead found for phone=${from}`);
      return;
    }

    const leadId = lead._id;

    // Deduplicate: skip if message already stored
    if (waMessageId) {
      const existing = await conversationRepository.findByWaMessageId(waMessageId);
      if (existing) {
        logger.debug(`handleInboundMessage: duplicate waMessageId=${waMessageId}, skipping`);
        return;
      }
    }

    const conversation = await conversationRepository.create({
      lead: leadId,
      channel: channel,
      direction: 'inbound',
      messageType: messageType || MESSAGE_TYPES.TEXT,
      content: text || '[media message]',
      mediaUrl: mediaUrl || null,
      deliveryStatus: DELIVERY_STATUS.DELIVERED,
      externalMessageId: waMessageId || null,
      sentBy: null,
      whatsappData: waData,
    });

    // Update lead's last activity timestamp
    await Lead.findByIdAndUpdate(leadId, { $set: { lastActivityAt: new Date() } });

    // Scoring: customer replied
    await this._applyScoring(leadId, SCORING_EVENTS.WHATSAPP_REPLIED, null);

    // Emit socket event to anyone watching this lead's conversation
    emitToLead(String(leadId), 'message:received', {
      leadId: String(leadId),
      conversation,
    });

    return conversation;
  }

  /**
   * Process inbound Facebook/Instagram social messages.
   * Maps PSID/IGSID to leads. If unknown, creates a new lead.
   */
  async handleInboundSocialMessage(payload) {
    const { channel, senderId, text, messageId, rawEvent } = payload;
    
    if (!senderId) {
      logger.warn(`handleInboundSocialMessage: missing senderId for channel ${channel}`);
      return;
    }

    // Lookup lead by social ID
    let lead = null;
    if (channel === 'facebook') {
      lead = await Lead.findOne({ 'social.facebookId': senderId, isDeleted: false }).lean();
    } else if (channel === 'instagram') {
      lead = await Lead.findOne({ 'social.instagramId': senderId, isDeleted: false }).lean();
    }

    // If no lead exists, create one!
    if (!lead) {
      logger.info(`Unknown ${channel} sender ${senderId}, creating new lead...`);
      const socialSource = channel === 'facebook' ? LEAD_SOURCES.FACEBOOK : LEAD_SOURCES.OTHER;
      const dummyPhone = `${channel === 'facebook' ? 'FB' : 'IG'}-${senderId}`;
      
      const newLeadData = {
        source: socialSource,
        contact: {
          name: `${channel} User ${senderId.slice(-4)}`,
          phone: dummyPhone, // To satisfy required phone constraint
        },
        social: {
          [channel === 'facebook' ? 'facebookId' : 'instagramId']: senderId,
        },
        source_metadata: rawEvent,
      };
      
      const created = await leadRepository.create(newLeadData);
      lead = await Lead.findById(created._id).lean();
    }

    const leadId = lead._id;

    // Deduplicate
    if (messageId) {
      const existing = await conversationRepository.findByWaMessageId(messageId);
      if (existing) {
        logger.debug(`handleInboundSocialMessage: duplicate messageId=${messageId}, skipping`);
        return;
      }
    }

    const conversation = await conversationRepository.create({
      lead: leadId,
      channel: channel === 'facebook' ? CHANNELS.FACEBOOK : CHANNELS.INSTAGRAM,
      direction: 'inbound',
      messageType: MESSAGE_TYPES.TEXT,
      content: text || '[media]',
      deliveryStatus: DELIVERY_STATUS.DELIVERED,
      externalMessageId: messageId || null,
      sentBy: null,
      whatsappData: rawEvent, // repurpose for channel raw event
    });

    // Update lead's last activity timestamp
    await Lead.findByIdAndUpdate(leadId, { $set: { lastActivityAt: new Date() } });

    // Scoring
    await this._applyScoring(leadId, SCORING_EVENTS.WHATSAPP_REPLIED, null);

    // Emit socket event to anyone watching this lead's conversation
    emitToLead(String(leadId), 'message:received', {
      leadId: String(leadId),
      conversation,
    });

    return conversation;
  }

  /**
   * Process a WhatsApp delivery status update from Meta webhook.
   * Updates deliveryStatus; if status is 'read', applies scoring.
   *
   * @param {Object} payload - { waMessageId, status }
   */
  async handleStatusUpdate(payload) {
    const { waMessageId, status } = payload;

    if (!waMessageId || !status) {
      logger.warn('handleStatusUpdate: missing waMessageId or status');
      return;
    }

    // Map Meta status strings to our DELIVERY_STATUS enum
    const statusMap = {
      sent: DELIVERY_STATUS.SENT,
      delivered: DELIVERY_STATUS.DELIVERED,
      read: DELIVERY_STATUS.READ,
      failed: DELIVERY_STATUS.FAILED,
    };

    const mappedStatus = statusMap[status.toLowerCase()];
    if (!mappedStatus) {
      logger.debug(`handleStatusUpdate: unknown status "${status}", skipping`);
      return;
    }

    const updated = await conversationRepository.updateDeliveryStatus(waMessageId, mappedStatus);
    if (!updated) {
      logger.debug(`handleStatusUpdate: no conversation found for waMessageId=${waMessageId}`);
      return;
    }

    if (mappedStatus === DELIVERY_STATUS.READ) {
      await this._applyScoring(updated.lead, SCORING_EVENTS.EMAIL_OPENED, null);
    }

    return updated;
  }

  /**
   * Mark all conversations for a lead as read.
   * @param {string} leadId
   */
  async markAsRead(leadId) {
    await conversationRepository.markAsRead(leadId);
    return { success: true };
  }
}

module.exports = new ConversationService();
