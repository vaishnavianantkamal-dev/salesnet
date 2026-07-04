'use strict';

const conversationService = require('../conversations/conversation.service');
const logger = require('../../utils/logger');

class WapzioController {
  /**
   * Handle incoming webhooks from Wapzio for all channels (FB, Insta, WA)
   */
  async handleEvent(req, res, next) {
    try {
      logger.debug('Received Wapzio webhook payload:', req.body);


    const payload = req.body;

    // A standard parsing structure assuming Wapzio passes down the sender, text, channel, etc.
    // If the exact structure differs, this will need to be adjusted.
    const from = payload.from || payload.sender || payload.phone;
    const text = payload.text || payload.message || payload.body || '';
    const messageType = payload.type || 'text';
    const channel = payload.channel || 'whatsapp'; // facebook, instagram, whatsapp
    const messageId = payload.id || payload.messageId;

    if (!from) {
      logger.warn('Wapzio webhook missing sender/from field');
      return res.status(200).send('OK');
    }

    // Pass to our existing inbound message handler.
    // Ensure we normalize the channel.
    await conversationService.handleInboundMessage({
      waMessageId: messageId,
      from: String(from),
      text,
      messageType,
      channel,
      mediaUrl: payload.mediaUrl || null,
      waData: { channel, ...payload },
    });

    res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WapzioController();
