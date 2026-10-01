const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('../modules/auth/auth.routes');
const businessRoutes = require('../modules/business/business.routes');
const productsRoutes = require('../modules/products/products.routes');
const salesRoutes = require('../modules/sales/sales.routes');
const customersRoutes = require('../modules/customers/customers.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');
const aiRoutes = require('../modules/ai/ai.routes');
const ragRoutes = require('../modules/rag/rag.routes');
const automationRoutes = require('../modules/automation/automation.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/business', businessRoutes);
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);
router.use('/customers', customersRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/rag', ragRoutes);
router.use('/automation', automationRoutes);
router.use('/automations', automationRoutes);

module.exports = router;