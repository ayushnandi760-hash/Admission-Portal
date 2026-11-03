/**
 * src/controllers/notification.controller.js
 *
 * Handles student notification feeds:
 * - getMyNotifications: retrieves latest alerts + unread count
 * - markAsRead: marks an individual alert as read
 * - markAllAsRead: marks all unread alerts as read
 */

const Notification = require('../models/Notification.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

// GET /api/v1/notifications/my
const getMyNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(20),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);

    return sendSuccess(res, {
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// PATCH /api/v1/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return sendError(res, { statusCode: 404, message: 'Notification not found.' });
    }

    return sendSuccess(res, { data: notification });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// PATCH /api/v1/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    return sendSuccess(res, { message: 'All notifications marked as read.' });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
