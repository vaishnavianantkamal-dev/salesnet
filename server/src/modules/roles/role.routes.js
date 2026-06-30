'use strict';

const express = require('express');
const router = express.Router();

const roleController = require('./role.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createRoleSchema, updateRoleSchema } = require('./role.validation');

// GET /api/roles
router.get('/', authenticate, authorize('roles:read'), roleController.getAll.bind(roleController));

// GET /api/roles/:id
router.get('/:id', authenticate, authorize('roles:read'), roleController.getById.bind(roleController));

// POST /api/roles
router.post(
  '/',
  authenticate,
  authorize('roles:create'),
  validate(createRoleSchema),
  roleController.create.bind(roleController)
);

// PUT /api/roles/:id
router.put(
  '/:id',
  authenticate,
  authorize('roles:update'),
  validate(updateRoleSchema),
  roleController.update.bind(roleController)
);

// DELETE /api/roles/:id
router.delete('/:id', authenticate, authorize('roles:delete'), roleController.delete.bind(roleController));

module.exports = router;
