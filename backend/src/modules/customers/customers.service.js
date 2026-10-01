const mongoose = require('mongoose');
const Customer = require('../../models/Customer');
const { ApiError } = require('../../utils/errors');

function ensureCustomerId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Customer ID is invalid');
  }
}

async function createCustomer(businessId, input) {
  return Customer.create({
    ...input,
    businessId,
    email: input.email || '',
    phone: input.phone || '',
    externalId: input.externalId || ''
  });
}

async function listCustomers(businessId, { page, limit, search }) {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const filter = { businessId };

  if (typeof search === 'string' && search.trim().length > 0) {
    const safeSearch = search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
      { phone: { $regex: safeSearch, $options: 'i' } },
      { externalId: { $regex: safeSearch, $options: 'i' } }
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Customer.countDocuments(filter)
  ]);

  return {
    customers,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit) || 0
    }
  };
}

async function getCustomer(businessId, id) {
  ensureCustomerId(id);
  const customer = await Customer.findOne({ _id: id, businessId });
  if (!customer) throw new ApiError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  return customer;
}

async function updateCustomer(businessId, id, input) {
  ensureCustomerId(id);
  const customer = await Customer.findOneAndUpdate(
    { _id: id, businessId },
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!customer) throw new ApiError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  return customer;
}

async function deleteCustomer(businessId, id) {
  ensureCustomerId(id);
  const customer = await Customer.findOneAndDelete({ _id: id, businessId });
  if (!customer) throw new ApiError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
}

module.exports = { createCustomer, deleteCustomer, getCustomer, listCustomers, updateCustomer };
