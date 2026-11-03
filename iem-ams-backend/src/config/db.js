/**
 * src/config/db.js
 *
 * Establishes the Mongoose connection to MongoDB.
 * The URI is read from environment variables — never hardcoded.
 * Exports a single async function called by server.js at startup.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process if DB connection fails — app cannot run without it
  }
};

module.exports = connectDB;

