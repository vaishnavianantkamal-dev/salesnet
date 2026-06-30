'use strict';

const express = require('express');
const router = express.Router();

const webhookController = require('./webhook.controller');

// ---------------------------------------------------------------------------
// Meta / Facebook webhook
// GET  /webhooks/meta  — hub.challenge verification
// POST /webhooks/meta  — leadgen + WhatsApp status/message events
// ---------------------------------------------------------------------------
router.get('/meta', webhookController.metaVerify.bind(webhookController));
router.post('/meta', webhookController.metaEvent.bind(webhookController));

// ---------------------------------------------------------------------------
// WhatsApp webhook (alias for Meta — same handler)
// GET  /webhooks/whatsapp  — hub.challenge verification
// POST /webhooks/whatsapp  — WhatsApp message / status events
// ---------------------------------------------------------------------------
router.get('/whatsapp', webhookController.metaVerify.bind(webhookController));
router.post('/whatsapp', webhookController.metaEvent.bind(webhookController));

// ---------------------------------------------------------------------------
// Google Ads Lead webhook
// POST /webhooks/google
// Validates google_key header, creates lead from normalized payload.
// ---------------------------------------------------------------------------
router.post('/google', webhookController.googleEvent.bind(webhookController));

// ---------------------------------------------------------------------------
// JustDial webhook
// POST /webhooks/justdial
// Validates token header, creates lead from normalized payload.
// ---------------------------------------------------------------------------
router.post('/justdial', webhookController.justDialEvent.bind(webhookController));

module.exports = router;
