'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });

const conversationController = require('./conversation.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { sendTemplateSchema, sendMessageSchema } = require('./conversation.validation');

// GET /leads/:leadId/conversations
router.get(
  '/leads/:leadId/conversations',
  authenticate,
  authorize('conversations:read'),
  conversationController.getByLead.bind(conversationController)
);

// POST /leads/:leadId/conversations/template
router.post(
  '/leads/:leadId/conversations/template',
  authenticate,
  authorize('conversations:send'),
  validate(sendTemplateSchema),
  conversationController.sendTemplate.bind(conversationController)
);
router.post(
  '/leads/:leadId/whatsapp/template',
  authenticate,
  authorize('conversations:send'),
  validate(sendTemplateSchema),
  conversationController.sendTemplate.bind(conversationController)
);

// POST /leads/:leadId/conversations/message
router.post(
  '/leads/:leadId/conversations/message',
  authenticate,
  authorize('conversations:send'),
  validate(sendMessageSchema),
  conversationController.sendMessage.bind(conversationController)
);
router.post(
  '/leads/:leadId/whatsapp/message',
  authenticate,
  authorize('conversations:send'),
  validate(sendMessageSchema),
  conversationController.sendMessage.bind(conversationController)
);

// PATCH /leads/:leadId/conversations/read
router.patch(
  '/leads/:leadId/conversations/read',
  authenticate,
  authorize('conversations:read'),
  conversationController.markRead.bind(conversationController)
);

// GET /inbox
router.get(
  '/inbox',
  authenticate,
  authorize('conversations:read'),
  conversationController.getInbox.bind(conversationController)
);

module.exports = router;
