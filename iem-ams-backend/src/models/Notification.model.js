/**
 * src/models/Notification.model.js
 *
 * Mongoose schema for the `notifications` collection.
 *
 * Notifications are created by the server (e.g., when an admin updates
 * an application status) and displayed to the student in the navbar bell.
 *
 * Simple polling is used in Phase 8. This can be upgraded to WebSockets later.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Application Notification',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'danger'],
      default: 'info',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

