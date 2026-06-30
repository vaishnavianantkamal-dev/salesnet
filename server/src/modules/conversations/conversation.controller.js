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
   * POST /leads/:leadId/whatsapp/message
   * Send a free-text WhatsApp message.
   */
  async sendMessage(req, res, next) {
    try {
      const { message } = req.body;
      const conversation = await conversationService.sendWhatsAppMessage(
        req.params.leadId,
        message,
        req.user
      );
      return sendSuccess(res, { conversation }, 'WhatsApp message sent successfully', 201);
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
