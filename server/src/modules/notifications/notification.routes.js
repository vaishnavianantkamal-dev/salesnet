'use strict';

const express = require('express');
const router = express.Router();

const notificationController = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications/unread-count — must be defined before /:id routes
router.get(
  '/unread-count',
  notificationController.getUnreadCount.bind(notificationController)
);

// PATCH /api/notifications/read-all — must be defined before /:id routes
router.patch(
  '/read-all',
  notificationController.markAllRead.bind(notificationController)
);

// GET /api/notifications
router.get(
  '/',
  notificationController.getMyNotifications.bind(notificationController)
);

// PATCH /api/notifications/:id/read
router.patch(
  '/:id/read',
  notificationController.markRead.bind(notificationController)
);

module.exports = router;
