'use strict';

const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createUserSchema, updateUserSchema, resetPasswordSchema } = require('./user.validation');

// GET /api/users
router.get('/', authenticate, authorize('users:read'), userController.getAll.bind(userController));

// GET /api/users/:id
router.get('/:id', authenticate, authorize('users:read'), userController.getById.bind(userController));

// POST /api/users
router.post(
  '/',
  authenticate,
  authorize('users:create'),
  validate(createUserSchema),
  userController.create.bind(userController)
);

// PUT /api/users/:id
router.put(
  '/:id',
  authenticate,
  authorize('users:update'),
  validate(updateUserSchema),
  userController.update.bind(userController)
);

// DELETE /api/users/:id (soft delete - deactivate)
router.delete('/:id', authenticate, authorize('users:delete'), userController.deactivate.bind(userController));

// POST /api/users/:id/reset-password
router.post(
  '/:id/reset-password',
  authenticate,
  authorize('users:update'),
  validate(resetPasswordSchema),
  userController.resetPassword.bind(userController)
);

module.exports = router;
