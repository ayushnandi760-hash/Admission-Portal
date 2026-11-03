/**
 * src/middleware/auth.middleware.js
 *
 * Verifies the JWT sent in the Authorization header.
 * If valid, attaches the decoded user payload to req.user so controllers
 * can read the caller's ID and role without hitting the database again.
 *
 * Expected header format: "Authorization: Bearer <token>"
 */

const { verifyToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, { statusCode: 401, message: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return sendError(res, { statusCode: 401, message: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = { protect };

