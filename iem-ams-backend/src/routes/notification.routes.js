/**
 * src/routes/notification.routes.js
 *
 * Routes for retrieving and managing user notification feeds.
 * Protected by JWT authentication middleware.
 */

const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(protect);

// GET   /api/v1/notifications/my — Get my alerts & unread badge count
router.get('/my', getMyNotifications);

// PATCH /api/v1/notifications/read-all — Mark all as read
router.patch('/read-all', markAllAsRead);

// PATCH /api/v1/notifications/:id/read — Mark single alert as read
router.patch('/:id/read', markAsRead);

module.exports = router;

