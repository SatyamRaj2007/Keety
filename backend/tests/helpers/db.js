/**
 * In-memory MongoDB lifecycle helpers.
 *
 * Every test file that needs a real database should call:
 *
 *   const { startDb, stopDb, clearDb } = require('../helpers/db');
 *
 *   test.before(startDb);
 *   test.after(stopDb);
 *   test.beforeEach(clearDb);   // keeps tests isolated
 */

'use strict';

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet;

async function startDb() {
  // MongoMemoryReplSet is required for Mongoose transactions (session.withTransaction).
  // It starts a 1-node replica set and waits for primary election before resolving.
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri, { dbName: 'keety_test' });
}

async function stopDb() {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
}

/** Wipe every collection but keep the connection open. */
async function clearDb() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((col) => col.deleteMany({})));
}

module.exports = { startDb, stopDb, clearDb };
