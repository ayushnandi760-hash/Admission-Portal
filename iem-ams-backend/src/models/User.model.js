/**
 * src/models/User.model.js
 *
 * Mongoose schema for the `users` collection.
 *
 * Fields:
 *   - fullName    : Student's or admin's display name
 *   - email       : Login identifier; must be unique across all users
 *   - passwordHash: bcrypt hash — the raw password is NEVER stored
 *   - role        : Controls which routes/features the user can access
 *
 * The schema intentionally has NO `password` field to prevent accidental
 * plain-text storage. Hashing is done in the auth controller before saving.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned in query results unless explicitly requested
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('User', userSchema);

