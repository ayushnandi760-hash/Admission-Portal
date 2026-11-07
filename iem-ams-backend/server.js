/**
 * server.js
 *
 * Application entry point.
 *
 * 1. Loads environment variables from .env using dotenv
 * 2. Connects to MongoDB via Mongoose
 * 3. Starts the Express HTTP server on the configured PORT
 *
 * Run with:  node server.js
 *            or
 *            npx nodemon server.js   (auto-restarts on file changes during development)
 */

require('dotenv').config(); // Must be first — other modules may read process.env at import time

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // Wait for DB before accepting requests

  // Auto-seed default administrator if not present in database
  try {
    const User = require('./src/models/User.model');
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@iem.edu.in';
    const adminPass = process.env.ADMIN_PASSWORD || 'SecureAdminPass@123';
    const adminName = process.env.ADMIN_NAME || 'IEM Administrator';

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPass, 12);
      await User.create({
        fullName: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
      });
      console.log(`Default admin account automatically created: ${adminEmail}`);
    }
  } catch (err) {
    console.error('Admin auto-seed warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`IEM-AMS server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

