'use strict';

/**
 * Unit tests — sales service
 *
 * Covers: createSale calculations, discount validation, inventory decrement,
 * insufficient-stock rejection, inactive product rejection, customer
 * ownership, duplicate product IDs (caught at validation layer), and the
 * core transaction atomicity guarantee.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { startDb, stopDb, clearDb } = require('../helpers/db');
const {
  makeUserWithBusiness,
  makeProduct,
  makeInventory,
  makeCustomer
} = require('../helpers/factories');
const { createSale, getSale, listSales } = require('../../src/modules/sales/sales.service');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'placeholder';

test.before(startDb);
test.after(stopDb);
test.beforeEach(clearDb);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function setup() {
  const { user, token, business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 200, status: 'ACTIVE' });
  const inventory = await makeInventory(business._id, product._id, { quantity: 50 });
  return { user, token, business, product, inventory };
}

// ---------------------------------------------------------------------------
// createSale — happy path & calculations
// ---------------------------------------------------------------------------

test('createSale — computes subtotal, applies discount and tax, persists correct totalAmount', async () => {
  const { business, product } = await setup();

  // price=200, qty=3 → subtotal=600, discount=50, tax=30, total=580
  const sale = await createSale(business._id, {
    items: [{ productId: product._id.toString(), quantity: 3 }],
    discount: 50,
    tax: 30
  });

  assert.equal(sale.subtotal, 600);
  assert.equal(sale.discount, 50);
  assert.equal(sale.tax, 30);
  assert.equal(sale.totalAmount, 580);
});

test('createSale — stores denormalised productName and unitPrice in each item', async () => {
  const { business, product } = await setup();

  const sale = await createSale(business._id, {
    items: [{ productId: product._id.toString(), quantity: 2 }]
  });

  assert.equal(sale.items.length, 1);
  assert.equal(sale.items[0].productName, product.name);
  assert.equal(sale.items[0].unitPrice, product.price);
  assert.equal(sale.items[0].total, product.price * 2);
});

test('createSale — defaults discount and tax to 0 when omitted', async () => {
  const { business, product } = await setup();
  const sale = await createSale(business._id, {
    items: [{ productId: product._id.toString(), quantity: 1 }]
  });
  assert.equal(sale.discount, 0);
  assert.equal(sale.tax, 0);
  assert.equal(sale.totalAmount, product.price);
});

test('createSale — a sale with multiple products sums all item totals correctly', async () => {
  const { business } = await setup();
  const p1 = await makeProduct(business._id, { price: 100 });
  const p2 = await makeProduct(business._id, { price: 300 });
  await makeInventory(business._id, p1._id, { quantity: 10 });
  await makeInventory(business._id, p2._id, { quantity: 10 });

  const sale = await createSale(business._id, {
    items: [
      { productId: p1._id.toString(), quantity: 2 }, // 200
      { productId: p2._id.toString(), quantity: 1 }  // 300
    ]
  });

  assert.equal(sale.subtotal, 500);
  assert.equal(sale.totalAmount, 500);
});

// ---------------------------------------------------------------------------
// createSale — discount validation
// ---------------------------------------------------------------------------

test('createSale — throws 400 INVALID_DISCOUNT when discount exceeds subtotal', async () => {
  const { business, product } = await setup();

  // price=200, qty=1 → subtotal=200; discount=300 is invalid
  await assert.rejects(
    () => createSale(business._id, {
      items: [{ productId: product._id.toString(), quantity: 1 }],
      discount: 300
    }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'INVALID_DISCOUNT');
      return true;
    }
  );
});

test('createSale — allows discount exactly equal to subtotal (edge boundary)', async () => {
  const { business, product } = await setup();
  const sale = await createSale(business._id, {
    items: [{ productId: product._id.toString(), quantity: 1 }],
    discount: product.price // discount == subtotal → totalAmount == 0
  });
  assert.equal(sale.totalAmount, 0);
});

// ---------------------------------------------------------------------------
// createSale — inventory
// ---------------------------------------------------------------------------

test('createSale — decrements inventory by the purchased quantity', async () => {
  const Inventory = require('../../src/models/Inventory');
  const { business, product, inventory } = await setup();
  const beforeQty = inventory.quantity; // 50

  await createSale(business._id, {
    items: [{ productId: product._id.toString(), quantity: 5 }]
  });

  const updated = await Inventory.findById(inventory._id);
  assert.equal(updated.quantity, beforeQty - 5);
});

test('createSale — throws 409 INSUFFICIENT_STOCK when inventory is too low', async () => {
  const { business, product } = await makeUserWithBusiness().then(async (ctx) => {
    const p = await makeProduct(ctx.business._id, { price: 100 });
    await makeInventory(ctx.business._id, p._id, { quantity: 2 });
    return { business: ctx.business, product: p };
  });

  await assert.rejects(
    () => createSale(business._id, {
      items: [{ productId: product._id.toString(), quantity: 10 }]
    }),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'INSUFFICIENT_STOCK');
      return true;
    }
  );
});

test('createSale — skips inventory check when no inventory record exists for a product', async () => {
  const { business } = await makeUserWithBusiness();
  // Product exists but has no Inventory row → sale should succeed.
  const product = await makeProduct(business._id, { price: 50 });

  const sale = await createSale(business._id, {
    items: [{ productId: product._id.toString(), quantity: 1 }]
  });
  assert.ok(sale._id);
});

test('createSale — does not modify inventory when INSUFFICIENT_STOCK is thrown (atomicity)', async () => {
  const Inventory = require('../../src/models/Inventory');
  const { business, product, inventory } = await setup();
  const Inv2 = require('../../src/models/Inventory');
  // Create a second product with not enough stock.
  const scarce = await makeProduct(business._id, { price: 50 });
  await makeInventory(business._id, scarce._id, { quantity: 1 });

  await assert.rejects(
    () => createSale(business._id, {
      items: [
        { productId: product._id.toString(), quantity: 2 },   // enough stock
        { productId: scarce._id.toString(), quantity: 5 }     // insufficient
      ]
    }),
    (err) => err.code === 'INSUFFICIENT_STOCK'
  );

  // First product's inventory must be unchanged — the transaction rolled back.
  const unchanged = await Inv2.findById(inventory._id);
  assert.equal(unchanged.quantity, inventory.quantity);
});

// ---------------------------------------------------------------------------
// createSale — product validation
// ---------------------------------------------------------------------------

test('createSale — throws 400 INVALID_SALE_ITEMS for an INACTIVE product', async () => {
  const { business } = await makeUserWithBusiness();
  const inactive = await makeProduct(business._id, { status: 'INACTIVE' });

  await assert.rejects(
    () => createSale(business._id, {
      items: [{ productId: inactive._id.toString(), quantity: 1 }]
    }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'INVALID_SALE_ITEMS');
      return true;
    }
  );
});

test('createSale — throws 400 INVALID_SALE_ITEMS when product belongs to a different business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const foreignProduct = await makeProduct(ctx2.business._id, { price: 100 });
  await makeInventory(ctx2.business._id, foreignProduct._id, { quantity: 10 });

  await assert.rejects(
    () => createSale(ctx1.business._id, {
      items: [{ productId: foreignProduct._id.toString(), quantity: 1 }]
    }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'INVALID_SALE_ITEMS');
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// createSale — customer validation
// ---------------------------------------------------------------------------

test('createSale — throws 400 INVALID_CUSTOMER when customer belongs to a different business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const product = await makeProduct(ctx1.business._id, { price: 100 });
  await makeInventory(ctx1.business._id, product._id, { quantity: 10 });
  const foreignCustomer = await makeCustomer(ctx2.business._id);

  await assert.rejects(
    () => createSale(ctx1.business._id, {
      items: [{ productId: product._id.toString(), quantity: 1 }],
      customerId: foreignCustomer._id.toString()
    }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'INVALID_CUSTOMER');
      return true;
    }
  );
});

test('createSale — succeeds when a valid customer from the same business is supplied', async () => {
  const { business, product } = await setup();
  const customer = await makeCustomer(business._id);

  const sale = await createSale(business._id, {
    items: [{ productId: product._id.toString(), quantity: 1 }],
    customerId: customer._id.toString()
  });
  assert.equal(String(sale.customerId), String(customer._id));
});

// ---------------------------------------------------------------------------
// concurrency — optimistic inventory lock
// ---------------------------------------------------------------------------

test('createSale — concurrent requests for limited stock: exactly one succeeds', async () => {
  const { business } = await makeUserWithBusiness();
  const product = await makeProduct(business._id, { price: 100 });
  // Only 1 unit available.
  await makeInventory(business._id, product._id, { quantity: 1 });

  const item = { productId: product._id.toString(), quantity: 1 };
  const [result1, result2] = await Promise.allSettled([
    createSale(business._id, { items: [item] }),
    createSale(business._id, { items: [item] })
  ]);

  const fulfilled = [result1, result2].filter((r) => r.status === 'fulfilled');
  const rejected = [result1, result2].filter((r) => r.status === 'rejected');
  assert.equal(fulfilled.length, 1, 'exactly one concurrent sale should succeed');
  assert.equal(rejected.length, 1, 'the other concurrent sale should fail');
  assert.equal(rejected[0].reason.code, 'INSUFFICIENT_STOCK');
});

// ---------------------------------------------------------------------------
// listSales / getSale
// ---------------------------------------------------------------------------

test('listSales — only returns sales belonging to the requested business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const p1 = await makeProduct(ctx1.business._id, { price: 100 });
  const p2 = await makeProduct(ctx2.business._id, { price: 100 });
  await makeInventory(ctx1.business._id, p1._id, { quantity: 10 });
  await makeInventory(ctx2.business._id, p2._id, { quantity: 10 });

  await createSale(ctx1.business._id, { items: [{ productId: p1._id.toString(), quantity: 1 }] });
  await createSale(ctx2.business._id, { items: [{ productId: p2._id.toString(), quantity: 1 }] });

  const { sales } = await listSales(ctx1.business._id, {});
  assert.equal(sales.length, 1, 'business A must only see its own sales');
  assert.equal(String(sales[0].businessId), String(ctx1.business._id));
});

test('listSales — pagination returns correct page and total', async () => {
  const { business, product } = await setup();
  const item = { productId: product._id.toString(), quantity: 1 };
  // Create 3 sales.
  for (let i = 0; i < 3; i++) {
    await createSale(business._id, { items: [item] });
  }

  const page1 = await listSales(business._id, { page: '1', limit: '2' });
  assert.equal(page1.sales.length, 2);
  assert.equal(page1.pagination.total, 3);
  assert.equal(page1.pagination.pages, 2);

  const page2 = await listSales(business._id, { page: '2', limit: '2' });
  assert.equal(page2.sales.length, 1);
});

test('getSale — throws 404 SALE_NOT_FOUND when accessed by a different business', async () => {
  const ctx1 = await makeUserWithBusiness();
  const ctx2 = await makeUserWithBusiness();
  const p = await makeProduct(ctx1.business._id, { price: 100 });
  await makeInventory(ctx1.business._id, p._id, { quantity: 10 });

  const sale = await createSale(ctx1.business._id, {
    items: [{ productId: p._id.toString(), quantity: 1 }]
  });

  await assert.rejects(
    () => getSale(ctx2.business._id, sale._id.toString()),
    (err) => {
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, 'SALE_NOT_FOUND');
      return true;
    }
  );
});

test('getSale — throws 400 VALIDATION_ERROR for a malformed sale ID', async () => {
  const { business } = await makeUserWithBusiness();
  await assert.rejects(
    () => getSale(business._id, 'not-an-object-id'),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'VALIDATION_ERROR');
      return true;
    }
  );
});
