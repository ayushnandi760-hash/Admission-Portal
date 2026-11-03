/**
 * src/utils/jwt.utils.js
 *
 * Thin wrappers around jsonwebtoken's sign and verify methods.
 * The secret is always pulled from process.env — never hardcoded.
 * Centralising token logic here means all routes share the same config.
 */

const jwt = require('jsonwebtoken');

/**
 * Signs a payload and returns a JWT string.
 * @param {Object} payload - Data to embed (e.g. { id, role })
 * @returns {string} Signed JWT
 */
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
};

/**
 * Verifies a JWT string and returns the decoded payload.
 * Throws if token is invalid or expired.
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { signToken, verifyToken };

