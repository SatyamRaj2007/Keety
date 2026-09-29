'use strict';

/**
 * ai.context.js — Business context assembly for KEETY AI
 *
 * Responsibilities (per AI.md §46, §45, §56):
 *   - Fetch only the data necessary for the request type
 *   - Build a capability registry so the model knows what data exists
 *   - Minimise context size (don't dump the entire DB to the LLM)
 *   - Never mix tenant data
 */

const Product = require('../../models/Product');
const Inventory = require('../../models/Inventory');
const analyticsService = require('../analytics/analytics.service');

/**
 * Build a capability registry for the business.
 * Tells the model what data is actually available so it doesn't invent
 * answers for fields that don't exist (AI.md §42, §45, §113–§115).
 */
async function buildCapabilityRegistry(businessId) {
  const [hasProducts, hasInventory, hasSales, hasExpenses, hasCustomers] = await Promise.all([
    Product.exists({ businessId, status: 'ACTIVE' }),
    Inventory.exists({ businessId }),
    // Sales presence is inferred from analytics revenue > 0 (avoid extra query)
    Promise.resolve(null),
    Promise.resolve(null),
    Promise.resolve(null)
  ]);

  return {
    HAS_PRODUCTS: Boolean(hasProducts),
    HAS_INVENTORY: Boolean(hasInventory),
    // These are populated after analytics are fetched
    HAS_SALES: false,
    HAS_EXPENSES: false,
    HAS_CUSTOMERS: false
  };
}

/**
 * Assemble the full business context object sent to Gemini.
 * Per AI.md §46: "Construct minimal relevant context."
 *
 * @param {object} business - The Mongoose business document from req.business
 * @param {'ask'|'growth'|'product'|'summary'} requestType
 * @param {object} [opts]
 * @param {string} [opts.period] - Analytics period override (daily/weekly/monthly)
 * @param {string} [opts.productId] - For product-intelligence requests
 * @returns {{ context: object, capabilities: object }}
 */
async function assembleContext(business, requestType, opts = {}) {
  const period = opts.period || 'monthly';
  const businessId = business._id;

  // Fetch analytics (deterministic source of truth — AI.md §3, §7)
  const analytics = await analyticsService.getAnalytics(businessId, { period });

  // Build capability registry
  const capabilities = await buildCapabilityRegistry(businessId);
  capabilities.HAS_SALES = analytics.salesCount > 0;
  capabilities.HAS_EXPENSES = analytics.expenseSummary.total > 0;
  capabilities.HAS_CUSTOMERS = analytics.customerSummary.newCustomers > 0;

  // Core business identity
  const businessContext = {
    name: business.name,
    type: business.businessType,
    currency: business.currency,
    timezone: business.timezone || 'UTC',
    description: business.description || ''
  };

  // Analytics snapshot — deterministic numbers (AI.md §9)
  const analyticsContext = {
    period: {
      label: period,
      startDate: analytics.period.startDate,
      endDate: analytics.period.endDate
    },
    revenue: analytics.revenue,
    salesCount: analytics.salesCount,
    averageOrderValue: analytics.averageOrderValue,
    revenueGrowthPercent: analytics.growthPercent,
    topProducts: analytics.topProducts.slice(0, 5),
    slowProducts: analytics.slowProducts.slice(0, 5),
    lowStockProducts: analytics.lowStockProducts,
    expenseSummary: analytics.expenseSummary,
    customerSummary: analytics.customerSummary
  };

  // For product-intelligence requests, attach individual product data
  let productContext = null;
  if (requestType === 'product' && opts.productId) {
    const Product = require('../../models/Product');
    const Inventory = require('../../models/Inventory');
    const [product, inventory] = await Promise.all([
      Product.findOne({ _id: opts.productId, businessId }).lean(),
      Inventory.findOne({ businessId, productId: opts.productId }).lean()
    ]);
    if (product) {
      // Find this product in analytics performance data
      const perfData = analytics.topProducts.find((p) => String(p._id) === String(opts.productId))
        || analytics.slowProducts.find((p) => String(p._id) === String(opts.productId));

      productContext = {
        id: product._id,
        name: product.name,
        sku: product.sku || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price,
        costPrice: product.costPrice || null,
        unit: product.unit,
        status: product.status,
        inventory: inventory
          ? { quantity: inventory.quantity, reorderLevel: inventory.reorderLevel }
          : null,
        performanceThisPeriod: perfData || null
      };
    }
  }

  return {
    context: {
      business: businessContext,
      analytics: analyticsContext,
      ...(productContext && { product: productContext }),
      capabilities,
      dataNote: 'All numbers are from the authoritative business database. Do not invent metrics.'
    },
    capabilities,
    analytics // pass back for service use
  };
}

module.exports = { assembleContext };
