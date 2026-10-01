const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Customer = require('../../models/Customer');
const Inventory = require('../../models/Inventory');
const Product = require('../../models/Product');
const Sale = require('../../models/Sale');
const { ApiError } = require('../../utils/errors');

function normalizeSaleResponse(sale, isDuplicate = false) {
  if (!sale) return sale;

  const plainSale = sale.toObject ? sale.toObject() : { ...sale };
  return {
    ...plainSale,
    sale: { ...plainSale },
    isDuplicate: Boolean(isDuplicate)
  };
}

function buildIdempotencyHash(input) {
  const canonical = {
    customerId: input.customerId || null,
    items: [...input.items].map(({ productId, quantity }) => ({ productId, quantity })).sort((a, b) => a.productId.localeCompare(b.productId)),
    discount: Number(input.discount || 0),
    tax: Number(input.tax || 0),
    paymentMethod: input.paymentMethod || 'OTHER',
    soldAt: input.soldAt || null
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

async function createSale(businessId, input) {
  const session = await mongoose.startSession();
  let sale;
  let isDuplicate = false;

  try {
    const idempotencyKey = input.idempotencyKey ? String(input.idempotencyKey).trim() : null;

    if (idempotencyKey) {
      const existing = await Sale.findOne({ businessId, idempotencyKey }).lean();
      if (existing) {
        const expectedHash = buildIdempotencyHash(input);
        if (existing.idempotencyHash && existing.idempotencyHash !== expectedHash) {
          throw new ApiError(409, 'IDEMPOTENCY_KEY_REUSED', 'This idempotency key is already associated with a different request payload');
        }
        return normalizeSaleResponse(existing, true);
      }
    }

    await session.withTransaction(async () => {
      const currentKey = input.idempotencyKey ? String(input.idempotencyKey).trim() : null;
      const currentHash = currentKey ? buildIdempotencyHash(input) : null;

      if (currentKey) {
        const existing = await Sale.findOne({ businessId, idempotencyKey: currentKey }).session(session).lean();
        if (existing) {
          const expectedHash = buildIdempotencyHash(input);
          if (existing.idempotencyHash && existing.idempotencyHash !== expectedHash) {
            throw new ApiError(409, 'IDEMPOTENCY_KEY_REUSED', 'This idempotency key is already associated with a different request payload');
          }
          sale = existing;
          isDuplicate = true;
          return;
        }
      }

      if (input.customerId) {
        const customer = await Customer.exists({ _id: input.customerId, businessId }).session(session);
        if (!customer) {
          throw new ApiError(400, 'INVALID_CUSTOMER', 'Customer does not belong to this business');
        }
      }

      const productIds = input.items.map((item) => item.productId);
      const products = await Product.find({
        businessId,
        _id: { $in: productIds },
        status: 'ACTIVE'
      }).session(session);
      const productsById = new Map(products.map((product) => [product._id.toString(), product]));

      if (productsById.size !== productIds.length) {
        throw new ApiError(400, 'INVALID_SALE_ITEMS', 'One or more products are unavailable for this business');
      }

      const items = input.items.map(({ productId, quantity }) => {
        const product = productsById.get(productId);
        const total = product.price * quantity;
        return {
          productId: product._id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          total
        };
      });
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discount = input.discount || 0;

      if (discount > subtotal) {
        throw new ApiError(400, 'INVALID_DISCOUNT', 'Discount cannot exceed the sale subtotal');
      }

      for (const item of items) {
        const inventory = await Inventory.findOne({ businessId, productId: item.productId }).session(session);
        if (!inventory) continue;

        const update = await Inventory.updateOne(
          { _id: inventory._id, quantity: { $gte: item.quantity } },
          { $inc: { quantity: -item.quantity }, $set: { lastUpdatedAt: new Date() } },
          { session }
        );

        if (update.modifiedCount !== 1) {
          throw new ApiError(409, 'INSUFFICIENT_STOCK', `Insufficient stock for ${item.productName}`);
        }
      }

      const payload = {
        businessId,
        customerId: input.customerId || null,
        items,
        subtotal,
        discount,
        tax: input.tax || 0,
        totalAmount: subtotal - discount + (input.tax || 0),
        paymentMethod: input.paymentMethod || 'OTHER',
        soldAt: input.soldAt ? new Date(input.soldAt) : new Date(),
        ...(currentKey ? { idempotencyKey: currentKey, idempotencyHash: currentHash } : {})
      };

      try {
        [sale] = await Sale.create([payload], { session });
      } catch (error) {
        if (error && error.code === 11000) {
          const duplicate = await Sale.findOne({ businessId, idempotencyKey: currentKey }).session(session).lean();
          if (duplicate) {
            if (duplicate.idempotencyHash && duplicate.idempotencyHash !== currentHash) {
              throw new ApiError(409, 'IDEMPOTENCY_KEY_REUSED', 'This idempotency key is already associated with a different request payload');
            }
            sale = duplicate;
            isDuplicate = true;
            return;
          }
        }
        throw error;
      }
    });

    return normalizeSaleResponse(sale, isDuplicate);
  } finally {
    await session.endSession();
  }
}

async function listSales(businessId, query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const filter = { businessId };
  if (query.status) filter.status = query.status;

  const [sales, total] = await Promise.all([
    Sale.find(filter).sort({ soldAt: -1 }).skip((page - 1) * limit).limit(limit),
    Sale.countDocuments(filter)
  ]);

  return { sales, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getSale(businessId, id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'VALIDATION_ERROR', 'Sale ID is invalid');
  const sale = await Sale.findOne({ _id: id, businessId });
  if (!sale) throw new ApiError(404, 'SALE_NOT_FOUND', 'Sale not found');
  return sale;
}

module.exports = { createSale, getSale, listSales };