'use strict';

const express = require('express');

const router = express.Router();

const followupController = require('./followup.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const { createFollowupSchema, updateFollowupSchema, queryFollowupSchema } = require('./followup.validation');

// GET /api/followups/upcoming — must be before /:id to avoid route conflict
router.get(
  '/upcoming',
  authenticate,
  authorize('followups:read'),
  followupController.getUpcoming.bind(followupController)
);

// GET /api/followups
router.get(
  '/',
  authenticate,
  authorize('followups:read'),
  validateQuery(queryFollowupSchema),
  followupController.getAll.bind(followupController)
);

// GET /api/followups/:id
router.get(
  '/:id',
  authenticate,
  authorize('followups:read'),
  followupController.getById.bind(followupController)
);

// POST /api/followups
router.post(
  '/',
  authenticate,
  authorize('followups:create'),
  validate(createFollowupSchema),
  followupController.create.bind(followupController)
);

// PUT /api/followups/:id
router.put(
  '/:id',
  authenticate,
  authorize('followups:update'),
  validate(updateFollowupSchema),
  followupController.update.bind(followupController)
);

// DELETE /api/followups/:id
router.delete(
  '/:id',
  authenticate,
  authorize('followups:update'),
  followupController.delete.bind(followupController)
);

module.exports = router;
