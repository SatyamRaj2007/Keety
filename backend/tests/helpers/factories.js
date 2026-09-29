/**
 * Test data factories.
 *
 * Each factory creates and persists one document with realistic synthetic data.
 * Override any field by passing a partial object as the second argument.
 *
 * Every business-owned record stores an explicit `businessId` so ownership
 * and isolation tests can create data for multiple businesses independently.
 *
 * Usage:
 *   const { makeUser, makeBusiness, makeProduct, ... } = require('../helpers/factories');
 *   const user = await makeUser();
 *   const biz  = await makeBusiness(user);
 *   const prod = await makeProduct(biz._id);
 */

'use strict';

const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

// Import models — they register themselves idempotently.
const User = require('../../src/models/User');
const Business = require('../../src/models/Business');
const Product = require('../../src/models/Product');
const Sale = require('../../src/models/Sale');
const Customer = require('../../src/models/Customer');
const Inventory = require('../../src/models/Inventory');
const Expense = require('../../src/models/Expense');

const { createToken } = require('../../src/utils/jwt');

// A fixed bcrypt hash for the string "Password1!" — avoids re-hashing on every
// factory call while still exercising bcrypt in tests that call it explicitly.
const FIXED_HASH = bcrypt.hashSync('Password1!', 4);
const DEFAULT_PASSWORD = 'Password1!';

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

async function makeUser(overrides = {}) {
  const data = {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    passwordHash: FIXED_HASH,
    role: 'OWNER',
    isActive: true,
    ...overrides
  };
  return User.create(data);
}

/** Returns { user, token } — the token is a real signed JWT. */
async function makeAuthUser(overrides = {}) {
  const user = await makeUser(overrides);
  const token = createToken(user);
  return { user, token };
}

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------

const BUSINESS_TYPES = ['CLOTHING', 'RESTAURANT', 'SALON', 'GROCERY_RETAIL', 'ELECTRONICS', 'OTHER'];

async function makeBusiness(owner, overrides = {}) {
  const data = {
    ownerId: owner._id,
    name: faker.company.name(),
    businessType: faker.helpers.arrayElement(BUSINESS_TYPES),
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    location: {
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: 'India'
    },
    ...overrides
  };
  const biz = await Business.create(data);
  // Keep User.businessIds in sync so the business middleware auto-select works.
  await User.updateOne({ _id: owner._id }, { $addToSet: { businessIds: biz._id } });
  owner.businessIds = [...(owner.businessIds || []), biz._id];
  return biz;
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

async function makeProduct(businessId, overrides = {}) {
  return Product.create({
    businessId,
    name: faker.commerce.productName(),
    sku: faker.string.alphanumeric(8).toUpperCase(),
    category: faker.commerce.department(),
    description: faker.commerce.productDescription(),
    price: Number(faker.commerce.price({ min: 10, max: 5000 })),
    costPrice: Number(faker.commerce.price({ min: 5, max: 2000 })),
    unit: 'piece',
    status: 'ACTIVE',
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

async function makeInventory(businessId, productId, overrides = {}) {
  return Inventory.create({
    businessId,
    productId,
    quantity: 100,
    reservedQuantity: 0,
    reorderLevel: 5,
    lastUpdatedAt: new Date(),
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

async function makeCustomer(businessId, overrides = {}) {
  return Customer.create({
    businessId,
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// Sale
// ---------------------------------------------------------------------------

/**
 * Creates a completed sale directly in the DB (bypasses the transaction service).
 * Use this when you need pre-existing sale data without exercising the create flow.
 */
async function makeSale(businessId, items, overrides = {}) {
  const saleItems = items.map(({ product, quantity }) => ({
    productId: product._id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    total: product.price * quantity
  }));
  const subtotal = saleItems.reduce((sum, i) => sum + i.total, 0);
  const discount = overrides.discount || 0;
  const tax = overrides.tax || 0;
  return Sale.create({
    businessId,
    items: saleItems,
    subtotal,
    discount,
    tax,
    totalAmount: subtotal - discount + tax,
    paymentMethod: 'CASH',
    status: 'COMPLETED',
    soldAt: new Date(),
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

async function makeExpense(businessId, overrides = {}) {
  return Expense.create({
    businessId,
    category: 'OPERATIONS',
    description: faker.lorem.sentence(),
    amount: Number(faker.commerce.price({ min: 50, max: 10000 })),
    currency: 'INR',
    expenseDate: new Date(),
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// Composite helpers
// ---------------------------------------------------------------------------

/**
 * Creates an authenticated user + one business.
 * Returns { user, token, business }.
 */
async function makeUserWithBusiness(userOverrides = {}, bizOverrides = {}) {
  const { user, token } = await makeAuthUser(userOverrides);
  const business = await makeBusiness(user, bizOverrides);
  return { user, token, business };
}

module.exports = {
  DEFAULT_PASSWORD,
  makeUser,
  makeAuthUser,
  makeBusiness,
  makeProduct,
  makeInventory,
  makeCustomer,
  makeSale,
  makeExpense,
  makeUserWithBusiness
};
