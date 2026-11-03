/**
 * src/routes/admin.routes.js
 *
 * Admin-only routes. All require a valid JWT AND role === 'admin'.
 * Students attempting to access these routes receive a 403 Forbidden.
 */

const express = require('express');
const router = express.Router();
const {
  getAllApplications,
  getApplicationDetail,
  updateApplicationStatus,
  getStats,
  downloadDocumentAsAdmin,
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'));

// GET   /api/v1/admin/stats — Aggregate counts by status and program
router.get('/stats', getStats);

// GET   /api/v1/admin/applications — List all applications (supports ?status= and ?program= filters)
router.get('/applications', getAllApplications);

// GET   /api/v1/admin/applications/:id — Full application detail with documents
router.get('/applications/:id', getApplicationDetail);

// PATCH /api/v1/admin/applications/:id/status — Update status and add remarks
router.patch('/applications/:id/status', updateApplicationStatus);

// GET   /api/v1/admin/documents/:docId/download — Download any document
router.get('/documents/:docId/download', downloadDocumentAsAdmin);

module.exports = router;

