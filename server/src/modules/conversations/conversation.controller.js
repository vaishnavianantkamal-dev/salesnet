'use strict';

const conversationService = require('./conversation.service');
const { sendSuccess } = require('../../utils/response');

class ConversationController {
  /**
   * GET /leads/:leadId/conversations
   * Returns paginated messages for a lead.
   */
  async getByLead(req, res, next) {
    try {
      const result = await conversationService.getConversations(
        req.params.leadId,
        req.query,
        req.user
      );
      return sendSuccess(res, result, 'Conversations fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /leads/:leadId/whatsapp/template
   * Send a WhatsApp template message.
   */
  async sendTemplate(req, res, next) {
    try {
      const { templateName, languageCode, params } = req.body;
      const conversation = await conversationService.sendWhatsAppTemplate(
        req.params.leadId,
        templateName,
        languageCode,
        params,
        req.user
      );
      return sendSuccess(res, { conversation }, 'WhatsApp template sent successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /leads/:leadId/whatsapp/message (Note: routes to any channel now)
   * Send a free-text omnichannel message via Wapzio.
   */
  async sendMessage(req, res, next) {
    try {
      const { body, message, channel } = req.body;
      const text = body || message;
      const ch = channel || 'whatsapp';

      let conversation;
      if (ch === 'facebook') {
        conversation = await conversationService.sendFacebookMessage(req.params.leadId, text, req.user);
      } else if (ch === 'instagram') {
        conversation = await conversationService.sendInstagramMessage(req.params.leadId, text, req.user);
      } else {
        conversation = await conversationService.sendWhatsAppMessage(req.params.leadId, text, req.user);
      }

      return sendSuccess(res, { message: conversation }, `${ch} message sent successfully via Meta API`, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /leads/:leadId/conversations/read
   * Mark all conversations for a lead as read.
   */
  async markRead(req, res, next) {
    try {
      const result = await conversationService.markAsRead(req.params.leadId);
      return sendSuccess(res, result, 'Conversations marked as read successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /inbox
   * Returns inbox with latest message per lead and unread counts.
   */
  async getInbox(req, res, next) {
    try {
      const result = await conversationService.getInbox(req.query, req.user);
      return sendSuccess(res, result, 'Inbox fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConversationController();
