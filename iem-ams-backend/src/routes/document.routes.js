/**
 * src/routes/document.routes.js
 *
 * Routes for uploading and retrieving admission documents.
 * Upload and delete are restricted to students; download is accessible to both roles.
 */

const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getMyDocuments,
  downloadDocument,
  deleteDocument,
} = require('../controllers/document.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const upload = require('../config/multer');
const { sendError } = require('../utils/response.utils');

// Custom wrapper to handle Multer upload errors gracefully with 400 status
const handleMulterUpload = (req, res, next) => {
  upload.single('docFile')(req, res, (err) => {
    if (err) {
      return sendError(res, {
        statusCode: 400,
        message: err.message || 'File upload failed. Ensure the file is PDF, JPG, or PNG and under 5 MB.',
      });
    }
    next();
  });
};

// POST /api/v1/documents/upload — Multipart upload (student only)
router.post('/upload', protect, restrictTo('student'), handleMulterUpload, uploadDocument);

// GET  /api/v1/documents/my — List documents for caller's application
router.get('/my', protect, restrictTo('student'), getMyDocuments);

// DELETE /api/v1/documents/:id — Delete an uploaded document
router.delete('/:id', protect, restrictTo('student'), deleteDocument);

// GET  /api/v1/documents/:id/download — Download a specific document
router.get('/:id/download', protect, downloadDocument);

module.exports = router;
