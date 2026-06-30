'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });

const activityController = require('./activity.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createNoteSchema } = require('./activity.validation');

// GET /api/leads/:leadId/activities
router.get(
  '/',
  authenticate,
  authorize('leads:read'),
  activityController.getByLead.bind(activityController)
);

// POST /api/leads/:leadId/activities
router.post(
  '/',
  authenticate,
  authorize('leads:update'),
  validate(createNoteSchema),
  activityController.createNote.bind(activityController)
);

module.exports = router;
