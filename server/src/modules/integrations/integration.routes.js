'use strict';

const express = require('express');

const router = express.Router();
const integrationController = require('./integration.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');

// All integration routes require authentication and the settings:manage permission.

// GET /api/integrations
router.get(
  '/',
  authenticate,
  authorize('settings:manage'),
  integrationController.getAll.bind(integrationController)
);

// GET /api/integrations/:name
router.get(
  '/:name',
  authenticate,
  authorize('settings:manage'),
  integrationController.getByName.bind(integrationController)
);

// PUT /api/integrations/:name
router.put(
  '/:name',
  authenticate,
  authorize('settings:manage'),
  integrationController.upsertByName.bind(integrationController)
);

// PATCH /api/integrations/:name/toggle
router.patch(
  '/:name/toggle',
  authenticate,
  authorize('settings:manage'),
  integrationController.toggleActive.bind(integrationController)
);

// POST /api/integrations/:name/test
router.post(
  '/:name/test',
  authenticate,
  authorize('settings:manage'),
  integrationController.testConnection.bind(integrationController)
);

module.exports = router;
