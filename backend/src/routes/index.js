const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('../modules/auth/auth.routes');
const businessRoutes = require('../modules/business/business.routes');
const productsRoutes = require('../modules/products/products.routes');
const salesRoutes = require('../modules/sales/sales.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');
const aiRoutes = require('../modules/ai/ai.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/business', businessRoutes);
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);

module.exports = router;