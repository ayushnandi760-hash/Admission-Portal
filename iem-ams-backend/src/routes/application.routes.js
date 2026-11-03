/**
 * src/routes/application.routes.js
 *
 * Student-facing routes for managing their own admission application.
 */

const express = require('express');
const router = express.Router();
const {
  getProgramsConfig,
  createApplication,
  getMyApplication,
  getApplicationById,
  updateApplication,
  checkDocumentsStatus,
  submitApplication,
} = require('../controllers/application.controller');
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');

// Public or student-accessible configuration
router.get('/config/programs', getProgramsConfig);

// All routes below require authentication + student role
router.use(protect, restrictTo('student'));

// POST /api/v1/applications — Create a new draft application
router.post('/', createApplication);

// GET  /api/v1/applications/my — Get the student's own application
router.get('/my', getMyApplication);

// GET  /api/v1/applications/:id/documents-status — Check uploaded vs missing documents
router.get('/:id/documents-status', checkDocumentsStatus);

// GET  /api/v1/applications/:id — Get application by ID (with ownership check)
router.get('/:id', getApplicationById);

// PUT  /api/v1/applications/:id — Update fields of a draft application
router.put('/:id', updateApplication);

// POST /api/v1/applications/:id/submit — Finalise and submit the application
router.post('/:id/submit', submitApplication);

module.exports = router;
