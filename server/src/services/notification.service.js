'use strict';

const Notification = require('../models/Notification.model');
const { emitToUser } = require('../config/socket');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Creates a Notification document and emits a real-time socket event
   * to the recipient's personal room (user:{recipientId}).
   *
   * @param {string|mongoose.Types.ObjectId} recipientId
   * @param {string} type  - must match Notification.model enum values
   * @param {string} title
   * @param {string} body
   * @param {object} [data={}]  - arbitrary extra payload stored on the document
   * @returns {Promise<import('../models/Notification.model').default>}
   */
  async createNotification(recipientId, type, title, body, data = {}) {
    try {
      const notification = await Notification.create({
        recipient: recipientId,
        type,
        title,
        body,
        data: data || {},
      });

      // Emit real-time event — non-fatal if socket is not yet initialised
      try {
        emitToUser(recipientId.toString(), 'notification:new', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });
      } catch (socketErr) {
        logger.warn(`Socket emit failed for notification ${notification._id}: ${socketErr.message}`);
      }

      return notification;
    } catch (err) {
      logger.error(`Failed to create notification for recipient ${recipientId}: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new NotificationService();
