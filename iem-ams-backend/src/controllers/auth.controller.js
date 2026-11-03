/**
 * src/controllers/auth.controller.js
 *
 * Handles user registration, login, and profile retrieval.
 *
 * register — hashes the password with bcrypt, saves the User, returns a JWT
 * login    — finds user by email, compares password hash, returns a JWT
 * getMe    — returns the logged-in user's profile (no password)
 *
 * The JWT payload contains { id, role } — enough for middleware to authorise
 * subsequent requests without a database round-trip.
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const { signToken } = require('../utils/jwt.utils');
const { sendSuccess, sendError } = require('../utils/response.utils');

const SALT_ROUNDS = 12;

// POST /api/v1/auth/register
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Basic presence check (detailed validation via express-validator added in Phase 2)
    if (!fullName || !email || !password) {
      return sendError(res, { statusCode: 400, message: 'fullName, email, and password are required.' });
    }

    if (password.length < 8) {
      return sendError(res, { statusCode: 400, message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({ fullName, email, passwordHash, role: 'student' });

    const token = signToken({ id: user._id, role: user.role });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Account created successfully.',
      data: {
        token,
        user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, { statusCode: 400, message: 'Email and password are required.' });
    }

    // Explicitly select passwordHash (it has select: false in the schema)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      return sendError(res, { statusCode: 401, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, { statusCode: 401, message: 'Invalid email or password.' });
    }

    const token = signToken({ id: user._id, role: user.role });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful.',
      data: {
        token,
        user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, { statusCode: 404, message: 'User not found.' });
    }
    return sendSuccess(res, {
      data: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: err.message });
  }
};

module.exports = { register, login, getMe };

