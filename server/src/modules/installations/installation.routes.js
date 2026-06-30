'use strict';

const express = require('express');
const router = express.Router();

const installationController = require('./installation.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createInstallationSchema, updateInstallationSchema } = require('./installation.validation');

// GET /api/installations
router.get(
  '/',
  authenticate,
  authorize('installations:read'),
  installationController.getAll.bind(installationController)
);

// GET /api/installations/:id
router.get(
  '/:id',
  authenticate,
  authorize('installations:read'),
  installationController.getById.bind(installationController)
);

// POST /api/installations
router.post(
  '/',
  authenticate,
  authorize('installations:create'),
  validate(createInstallationSchema),
  installationController.create.bind(installationController)
);

// PUT /api/installations/:id
router.put(
  '/:id',
  authenticate,
  authorize('installations:update'),
  validate(updateInstallationSchema),
  installationController.update.bind(installationController)
);

// GET /api/installations/lead/:leadId
router.get(
  '/lead/:leadId',
  authenticate,
  authorize('installations:read'),
  installationController.getByLead.bind(installationController)
);

module.exports = router;
