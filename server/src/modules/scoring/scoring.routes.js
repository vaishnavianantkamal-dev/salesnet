'use strict';

const express = require('express');
const router = express.Router();

const scoringController = require('./scoring.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');

// GET /api/scoring/rules — any authenticated user may view rules
router.get(
  '/rules',
  authenticate,
  scoringController.getRules.bind(scoringController)
);

// POST /api/scoring/rules — requires settings:manage
router.post(
  '/rules',
  authenticate,
  authorize('settings:manage'),
  scoringController.createRule.bind(scoringController)
);

// PATCH /api/scoring/rules/:id — requires settings:manage
router.patch(
  '/rules/:id',
  authenticate,
  authorize('settings:manage'),
  scoringController.updateRule.bind(scoringController)
);

module.exports = router;
