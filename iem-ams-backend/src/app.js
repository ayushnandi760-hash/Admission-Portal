/**
 * src/app.js
 *
 * Express application factory.
 *
 * This file builds and configures the Express app:
 *   1. Security middleware (Helmet, CORS, rate-limiting, mongo-sanitize)
 *   2. Request parsing (JSON body, URL-encoded)
 *   3. Logging (Morgan — HTTP request logs in development)
 *   4. Route mounting
 *   5. Health check endpoint
 *   6. Global error handler (catch-all for unhandled errors)
 *
 * server.js imports this app and binds it to a port.
 * Keeping them separate makes the app easier to test without starting a server.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/auth.routes');
const applicationRoutes = require('./routes/application.routes');
const documentRoutes = require('./routes/document.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────
// Helmet sets HTTP headers that protect against well-known web vulnerabilities
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
// Allow requests only from the Angular dev server (or production domain)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting on Auth Routes ──────────────────────────────────────────
// Prevents brute-force attacks on the login/register endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 requests per IP per window
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Request Parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit JSON body size to prevent abuse
app.use(express.urlencoded({ extended: true }));

// ─── NoSQL Injection Prevention ────────────────────────────────────────────
// Strips keys containing '$' or '.' from req.body and req.params
// (Uses direct sanitization to avoid 'Cannot set property query' getter error on Node 24)
app.use((req, _res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params);
  }
  next();
});

// ─── HTTP Request Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ──────────────────────────────────────────────────────────
// Simple endpoint to verify the server is running. Used by Phase 1 testing.
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'IEM-AMS API is running.',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;

