/**
 * src/middleware/role.middleware.js
 *
 * Must be used AFTER auth.middleware (which sets req.user).
 * Checks whether the authenticated user's role is in the allowed list.
 *
 * Usage in a route file:
 *   router.get('/admin/...', protect, restrictTo('admin'), handler)
 *   router.get('/my/...', protect, restrictTo('student', 'admin'), handler)
 */

const { sendError } = require('../utils/response.utils');

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

module.exports = { restrictTo };

