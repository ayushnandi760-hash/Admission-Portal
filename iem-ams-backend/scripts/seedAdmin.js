/**
 * scripts/seedAdmin.js
 *
 * One-time script to create the first admin account.
 * Run with: npm run seed:admin
 *
 * Admin credentials are read from .env — never hardcoded here.
 * Required env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 *
 * Example .env additions:
 *   ADMIN_EMAIL=admin@iem.edu.in
 *   ADMIN_PASSWORD=SecureAdminPass@123
 *   ADMIN_NAME=IEM Administrator
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User.model');

const seed = async () => {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    console.error(
      'Missing required env vars: MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME'
    );
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log(`Admin account already exists for ${ADMIN_EMAIL}. Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await User.create({
    fullName: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
  });

  console.log(`Admin account created: ${admin.email} (id: ${admin._id})`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

