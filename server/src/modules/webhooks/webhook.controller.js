'use strict';

const crypto = require('crypto');

const conversationService = require('../conversations/conversation.service');
const leadRepository = require('../leads/lead.repository');
const WebhookLog = require('../../models/WebhookLog.model');
const Lead = require('../../models/Lead.model');
const { AppError } = require('../../middlewares/error.middleware');
const { sendSuccess } = require('../../utils/response');
const { LEAD_SOURCES } = require('../../utils/constants');
const config = require('../../config/env');
const logger = require('../../utils/logger');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Verify the X-Hub-Signature-256 header sent by Meta.
 * Returns true if valid, false otherwise.
 */
function verifyMetaSignature(rawBody, signatureHeader) {
  if (!config.META_APP_SECRET) return true; // skip in dev if not configured
  if (!signatureHeader) return false;

  const [algo, receivedHex] = signatureHeader.split('=');
  if (algo !== 'sha256' || !receivedHex) return false;

  const expectedHex = crypto
    .createHmac('sha256', config.META_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(receivedHex, 'hex'), Buffer.from(expectedHex, 'hex'));
}

/**
 * Extract the raw text content from a WA message entry.
 */
function extractWaMessageText(message) {
  if (message.type === 'text' && message.text) return message.text.body || '';
  if (message.type === 'image' && message.image) return message.image.caption || '[image]';
  if (message.type === 'document' && message.document)
    return message.document.caption || '[document]';
  if (message.type === 'audio') return '[audio]';
  if (message.type === 'video' && message.video) return message.video.caption || '[video]';
  if (message.type === 'sticker') return '[sticker]';
  if (message.type === 'location' && message.location)
    return `[location: ${message.location.latitude},${message.location.longitude}]`;
  if (message.type === 'contacts') return '[contacts]';
  return `[${message.type || 'unknown'}]`;
}

/**
 * Extract media URL from a WA message entry (if present).
 */
function extractWaMediaUrl(message) {
  const types = ['image', 'document', 'audio', 'video', 'sticker'];
  for (const t of types) {
    if (message[t] && message[t].id) {
      return `https://graph.facebook.com/v19.0/${message[t].id}`; // media download URL placeholder
    }
  }
  return null;
}

/**
 * Normalize a phone number to E.164-style (strip non-digits, add + prefix).
 */
function normalizePhone(raw) {
  if (!raw) return raw;
  const digits = String(raw).replace(/\D/g, '');
  return digits.startsWith('91') && digits.length === 12 ? `+${digits}` : `+${digits}`;
}

// ---------------------------------------------------------------------------
// Controller class
// ---------------------------------------------------------------------------

class WebhookController {
  // -------------------------------------------------------------------------
  // Meta / WhatsApp webhook
  // -------------------------------------------------------------------------

  /**
   * GET /webhooks/meta  (also aliased as GET /webhooks/whatsapp)
   * Responds to Meta's hub verification challenge.
   */
  metaVerify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.META_VERIFY_TOKEN) {
      logger.info('Meta webhook verified');
      return res.status(200).send(challenge);
    }

    logger.warn(`Meta webhook verification failed: mode=${mode}, token=${token}`);
    return res.status(403).json({ success: false, message: 'Verification failed' });
  }

  /**
   * POST /webhooks/meta  (also aliased as POST /webhooks/whatsapp)
   * Handles inbound WhatsApp messages, delivery status updates, and leadgen events.
   *
   * NOTE: Express must be configured with `express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } })`
   * so that req.rawBody is available for HMAC verification.
   */
  async metaEvent(req, res) {
    // Acknowledge immediately to prevent Meta retries
    res.status(200).json({ success: true });

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const signature = req.headers['x-hub-signature-256'];

    if (!verifyMetaSignature(rawBody, signature)) {
      logger.warn('Meta webhook: invalid signature, ignoring payload');
      return;
    }

    const body = req.body;
    if (!body || body.object !== 'whatsapp_business_account') {
      // Could be a page/leadgen object
      if (body && body.object === 'page') {
        await this._processMetaLeadgen(body);
      }
      return;
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};

        // ---- Inbound messages ----
        const messages = value.messages || [];
        for (const message of messages) {
          try {
            await conversationService.handleInboundMessage({
              waMessageId: message.id,
              from: normalizePhone(message.from),
              text: extractWaMessageText(message),
              messageType: message.type || 'text',
              mediaUrl: extractWaMediaUrl(message),
              waData: message,
            });
          } catch (err) {
            logger.error(`handleInboundMessage error: ${err.message}`);
          }
        }

        // ---- Delivery status updates ----
        const statuses = value.statuses || [];
        for (const statusEntry of statuses) {
          try {
            await conversationService.handleStatusUpdate({
              waMessageId: statusEntry.id,
              status: statusEntry.status,
            });
          } catch (err) {
            logger.error(`handleStatusUpdate error: ${err.message}`);
          }
        }

        // ---- Leadgen (WhatsApp lead ads) ----
        if (change.field === 'leadgen') {
          await this._processMetaLeadgen(entry);
        }
      }
    }
  }

  /**
   * Process Meta Facebook leadgen form submissions.
   * Creates a lead from the leadgen data.
   */
  async _processMetaLeadgen(payload) {
    let webhookLog = null;
    try {
      webhookLog = await WebhookLog.create({
        source: LEAD_SOURCES.FACEBOOK,
        rawPayload: payload,
        status: 'received',
      });

      const changes = (payload.changes || []).filter((c) => c.field === 'leadgen');
      for (const change of changes) {
        const leadData = change.value || {};
        const fieldData = leadData.field_data || [];

        const fields = {};
        for (const f of fieldData) {
          fields[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
        }

        const phone = normalizePhone(fields.phone_number || fields.phone || '');
        if (!phone) continue;

        // Avoid duplicate leads
        const existing = await Lead.findOne({ 'contact.phone': phone, isDeleted: false }).lean();
        if (existing) {
          logger.info(`Leadgen duplicate for phone=${phone}`);
          continue;
        }

        const newLead = await leadRepository.create({
          source: LEAD_SOURCES.FACEBOOK,
          contact: {
            name: fields.full_name || fields.name || '',
            email: fields.email || '',
            phone,
          },
          source_metadata: leadData,
        });

        if (webhookLog) {
          await WebhookLog.findByIdAndUpdate(webhookLog._id, {
            $set: { status: 'processed', parsedData: fields, leadCreated: newLead._id },
          });
        }
      }
    } catch (err) {
      logger.error(`Meta leadgen processing error: ${err.message}`);
      if (webhookLog) {
        await WebhookLog.findByIdAndUpdate(webhookLog._id, {
          $set: { status: 'failed', error: err.message },
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Google webhook
  // -------------------------------------------------------------------------

  /**
   * POST /webhooks/google
   * Validates google_key header, normalizes payload, and creates a lead.
   */
  async googleEvent(req, res) {
    res.status(200).json({ success: true, message: 'Received' });

    const googleKey = req.headers['google_key'] || req.headers['x-google-key'];
    if (!config.GOOGLE_LEAD_KEY || googleKey !== config.GOOGLE_LEAD_KEY) {
      logger.warn(`Google webhook: invalid key header (received: ${googleKey})`);
      return;
    }

    let webhookLog = null;
    try {
      webhookLog = await WebhookLog.create({
        source: LEAD_SOURCES.GOOGLE,
        rawPayload: req.body,
        status: 'received',
      });

      const body = req.body || {};

      const phone = normalizePhone(
        body.phone_number || body.phone || body.user_phone_number || ''
      );
      if (!phone) {
        await WebhookLog.findByIdAndUpdate(webhookLog._id, {
          $set: { status: 'failed', error: 'Missing phone number' },
        });
        return;
      }

      // Duplicate check
      const existing = await Lead.findOne({ 'contact.phone': phone, isDeleted: false }).lean();
      if (existing) {
        await WebhookLog.findByIdAndUpdate(webhookLog._id, { $set: { status: 'duplicate', leadCreated: existing._id } });
        return;
      }

      const newLead = await leadRepository.create({
        source: LEAD_SOURCES.GOOGLE,
        contact: {
          name: body.full_name || body.name || body.user_full_name || '',
          email: body.email || body.user_email || '',
          phone,
        },
        source_metadata: body,
      });

      await WebhookLog.findByIdAndUpdate(webhookLog._id, {
        $set: { status: 'processed', parsedData: body, leadCreated: newLead._id },
      });
    } catch (err) {
      logger.error(`Google webhook processing error: ${err.message}`);
      if (webhookLog) {
        await WebhookLog.findByIdAndUpdate(webhookLog._id, {
          $set: { status: 'failed', error: err.message },
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // JustDial webhook
  // -------------------------------------------------------------------------

  /**
   * POST /webhooks/justdial
   * Validates token header, normalizes payload, and creates a lead.
   */
  async justDialEvent(req, res) {
    res.status(200).json({ success: true, message: 'Received' });

    const token = req.headers['token'] || req.headers['x-justdial-token'] || req.body.token;
    if (!config.JUSTDIAL_TOKEN || token !== config.JUSTDIAL_TOKEN) {
      logger.warn(`JustDial webhook: invalid token (received: ${token})`);
      return;
    }

    let webhookLog = null;
    try {
      webhookLog = await WebhookLog.create({
        source: LEAD_SOURCES.JUSTDIAL,
        rawPayload: req.body,
        status: 'received',
      });

      const body = req.body || {};

      // JustDial sends mobile, phone, or contact_no
      const rawPhone = body.mobile || body.phone || body.contact_no || body.phoneno || '';
      const phone = normalizePhone(rawPhone);

      if (!phone || phone === '+') {
        await WebhookLog.findByIdAndUpdate(webhookLog._id, {
          $set: { status: 'failed', error: 'Missing phone number' },
        });
        return;
      }

      // Duplicate check
      const existing = await Lead.findOne({ 'contact.phone': phone, isDeleted: false }).lean();
      if (existing) {
        await WebhookLog.findByIdAndUpdate(webhookLog._id, {
          $set: { status: 'duplicate', leadCreated: existing._id },
        });
        return;
      }

      const name = [body.name, body.company]
        .filter(Boolean)
        .join(' - ')
        .trim();

      const newLead = await leadRepository.create({
        source: LEAD_SOURCES.JUSTDIAL,
        contact: {
          name: name || '',
          email: body.email || '',
          phone,
          company: body.company || '',
          city: body.city || body.brancharea || '',
        },
        source_metadata: body,
      });

      await WebhookLog.findByIdAndUpdate(webhookLog._id, {
        $set: { status: 'processed', parsedData: body, leadCreated: newLead._id },
      });
    } catch (err) {
      logger.error(`JustDial webhook processing error: ${err.message}`);
      if (webhookLog) {
        await WebhookLog.findByIdAndUpdate(webhookLog._id, {
          $set: { status: 'failed', error: err.message },
        });
      }
    }
  }
}

module.exports = new WebhookController();
