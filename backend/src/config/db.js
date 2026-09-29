'use strict';

const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic.
 *
 * Node.js 24 + MongoDB Atlas occasionally produces a TLS "alert internal error"
 * (SSL alert 80) on the very first connection attempt due to TLS 1.3 session
 * resumption behaviour. A single retry clears it in all observed cases.
 */
async function connectDatabase(uri, { retries = 3, retryDelayMs = 2000 } = {}) {
  mongoose.set('strictQuery', true);

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000
      });
      return mongoose.connection;
    } catch (err) {
      lastError = err;
      const isTlsError = err.message?.includes('SSL') || err.message?.includes('TLS') || err.message?.includes('ssl');
      if (isTlsError && attempt < retries) {
        console.warn(`[db] Connection attempt ${attempt} failed (TLS), retrying in ${retryDelayMs}ms…`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

module.exports = { connectDatabase };
