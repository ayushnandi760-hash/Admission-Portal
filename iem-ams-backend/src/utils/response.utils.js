/**
 * src/utils/response.utils.js
 *
 * Provides a standardised JSON response shape across all controllers:
 *   { success: boolean, message: string, data: any }
 *
 * Using consistent response shapes makes frontend error handling predictable.
 */

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { sendSuccess, sendError };

