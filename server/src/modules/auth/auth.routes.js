'use strict';

const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');
const { loginSchema, refreshSchema, changePasswordSchema } = require('./auth.validation');

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), authController.login.bind(authController));

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), authController.refresh.bind(authController));

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout.bind(authController));

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe.bind(authController));

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

module.exports = router;
