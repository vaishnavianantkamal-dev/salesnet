'use strict';

const express = require('express');

const router = express.Router();

const leadController = require('./lead.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { publicLimiter } = require('../../middlewares/rateLimit.middleware');
const {
  createLeadSchema,
  updateLeadSchema,
  assignSchema,
  stageSchema,
} = require('./lead.validation');

// ─── Public route (no auth) ──────────────────────────────────────────────────

// POST /api/leads/public
router.post(
  '/public',
  publicLimiter,
  validate(createLeadSchema),
  leadController.createPublic.bind(leadController)
);

// POST /api/leads/ingest
router.post(
  '/ingest',
  leadController.ingest.bind(leadController)
);

// ─── Authenticated routes ────────────────────────────────────────────────────

// GET /api/leads
router.get(
  '/',
  authenticate,
  authorize('leads:read'),
  leadController.getAll.bind(leadController)
);

// GET /api/leads/action-queue
// Must be declared before /:id to avoid "action-queue" being interpreted as an id
router.get(
  '/action-queue',
  authenticate,
  leadController.getActionQueue.bind(leadController)
);

// POST /api/leads/import
router.post(
  '/import',
  authenticate,
  authorize('leads:create'),
  leadController.importLeads.bind(leadController)
);

// POST /api/leads
router.post(
  '/',
  authenticate,
  authorize('leads:create'),
  validate(createLeadSchema),
  leadController.create.bind(leadController)
);

// GET /api/leads/:id/360  — must be before /:id
router.get(
  '/:id/360',
  authenticate,
  authorize('leads:read'),
  leadController.get360.bind(leadController)
);

// GET /api/leads/:id
router.get(
  '/:id',
  authenticate,
  authorize('leads:read'),
  leadController.getById.bind(leadController)
);

// PUT /api/leads/:id  (full update)
router.put(
  '/:id',
  authenticate,
  authorize('leads:update'),
  validate(updateLeadSchema),
  leadController.update.bind(leadController)
);

// PATCH /api/leads/:id  (partial update — same handler, schema is all-optional)
router.patch(
  '/:id',
  authenticate,
  authorize('leads:update'),
  validate(updateLeadSchema),
  leadController.update.bind(leadController)
);

// PATCH /api/leads/:id/assign
router.patch(
  '/:id/assign',
  authenticate,
  authorize('leads:assign'),
  validate(assignSchema),
  leadController.assign.bind(leadController)
);

// PATCH /api/leads/:id/stage
router.patch(
  '/:id/stage',
  authenticate,
  authorize('leads:update'),
  validate(stageSchema),
  leadController.changeStage.bind(leadController)
);

// DELETE /api/leads/:id
router.delete(
  '/:id',
  authenticate,
  authorize('leads:delete'),
  leadController.delete.bind(leadController)
);

module.exports = router;
