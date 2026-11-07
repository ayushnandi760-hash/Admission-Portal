/**
 * src/routes/auth.routes.js
 *
 * Public routes — no JWT required.
 * Connects HTTP verbs + paths to the auth controller methods.
 * The /me route is the only protected one (verifies the caller's own token).
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe, setupAdmin } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// GET & POST /api/v1/auth/setup-admin — Safe self-healing endpoint to guarantee admin account exists
router.get('/setup-admin', setupAdmin);
router.post('/setup-admin', setupAdmin);

// POST /api/v1/auth/register — Create a new student account
router.post('/register', register);

// POST /api/v1/auth/login — Authenticate and receive a JWT
router.post('/login', login);

// GET  /api/v1/auth/me — Return the logged-in user's profile
router.get('/me', protect, getMe);

module.exports = router;

