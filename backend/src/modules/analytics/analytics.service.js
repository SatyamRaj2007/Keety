const Customer = require('../../models/Customer');
const Expense = require('../../models/Expense');
const Inventory = require('../../models/Inventory');
const Sale = require('../../models/Sale');
const { calculateGrowth, getAnalyticsRange } = require('./analytics.utils');

async function summarizeSales(businessId, range) {
  const [summary] = await Sale.aggregate([
    { $match: { businessId, status: 'COMPLETED', soldAt: { $gte: range.start, $lt: range.end } } },
    { $group: { _id: null, revenue: { $sum: '$totalAmount' }, salesCount: { $sum: 1 } } }
  ]);
  return summary || { revenue: 0, salesCount: 0 };
}

async function getAnalytics(businessId, query = {}) {
  const range = getAnalyticsRange(query);
  const customerStart = range.current.start;
  const customerEnd = range.current.end;

  const [current, previous, productPerformance, lowStock, expenseTotals, currentCustomers, previousCustomers] = await Promise.all([
    summarizeSales(businessId, range.current),
    summarizeSales(businessId, range.previous),
    Sale.aggregate([
      { $match: { businessId, status: 'COMPLETED', soldAt: { $gte: range.current.start, $lt: range.current.end } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productId',
        name: { $first: '$items.productName' },
        revenue: { $sum: '$items.total' },
        quantitySold: { $sum: '$items.quantity' }
      } },
      { $sort: { revenue: -1 } }
    ]),
    Inventory.find({ businessId, $expr: { $lte: ['$quantity', '$reorderLevel'] } })
      .populate({ path: 'productId', select: 'name status', match: { status: 'ACTIVE' } })
      .lean(),
    Expense.aggregate([
      { $match: { businessId, expenseDate: { $gte: customerStart, $lt: customerEnd } } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } }
    ]),
    Customer.countDocuments({ businessId, createdAt: { $gte: customerStart, $lt: customerEnd } }),
    Customer.countDocuments({ businessId, createdAt: { $gte: range.previous.start, $lt: range.previous.end } })
  ]);

  const expensesByCategory = Object.fromEntries(expenseTotals.map(({ _id, amount }) => [_id, amount]));
  const lowStockProducts = lowStock
    .filter((entry) => entry.productId)
    .map((entry) => ({
      productId: entry.productId._id,
      name: entry.productId.name,
      quantity: entry.quantity,
      reorderLevel: entry.reorderLevel
    }));

  return {
    period: { startDate: range.current.start, endDate: new Date(range.current.end.getTime() - 1) },
    revenue: current.revenue,
    salesCount: current.salesCount,
    averageOrderValue: current.salesCount ? Number((current.revenue / current.salesCount).toFixed(2)) : 0,
    growthPercent: calculateGrowth(current.revenue, previous.revenue),
    topProducts: productPerformance.slice(0, 5),
    slowProducts: [...productPerformance].sort((a, b) => a.quantitySold - b.quantitySold).slice(0, 5),
    lowStockProducts,
    expenseSummary: { total: expenseTotals.reduce((sum, item) => sum + item.amount, 0), byCategory: expensesByCategory },
    customerSummary: {
      newCustomers: currentCustomers,
      growthPercent: calculateGrowth(currentCustomers, previousCustomers)
    }
  };
}

module.exports = { getAnalytics };