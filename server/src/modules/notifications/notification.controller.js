'use strict';

const Notification = require('../../models/Notification.model');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

class NotificationController {
  /**
   * GET /api/notifications
   * Returns the authenticated user's notifications, paginated, unread first.
   */
  async getMyNotifications(req, res, next) {
    try {
      const userId = req.user._id || req.user.userId;
      const { page, limit, skip } = getPaginationOptions(req.query);

      const baseQuery = { recipient: userId };

      const [notifications, total] = await Promise.all([
        Notification.find(baseQuery)
          .sort({ isRead: 1, createdAt: -1 }) // unread (false=0) first, then newest
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(baseQuery),
      ]);

      const meta = buildPaginationMeta(total, page, limit);

      return sendSuccess(
        res,
        { notifications, meta },
        'Notifications fetched successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Marks a single notification as read.
   */
  async markRead(req, res, next) {
    try {
      const userId = req.user._id || req.user.userId;
      const { id } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, recipient: userId },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true }
      );

      if (!notification) {
        return next(new AppError('Notification not found', 404));
      }

      return sendSuccess(res, { notification }, 'Notification marked as read', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Marks all of the authenticated user's unread notifications as read.
   */
  async markAllRead(req, res, next) {
    try {
      const userId = req.user._id || req.user.userId;

      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );

      return sendSuccess(
        res,
        { modifiedCount: result.modifiedCount },
        'All notifications marked as read',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Returns the count of unread notifications for the authenticated user.
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user._id || req.user.userId;
      const count = await Notification.countDocuments({ recipient: userId, isRead: false });
      return sendSuccess(res, { count }, 'Unread count fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
