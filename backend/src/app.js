const cors = require('cors');
const { randomUUID } = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes');
const logger = require('./utils/logger');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/error.middleware');

function createApp({
  clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  authRateLimit = {}
} = {}) {
  const app = express();

  const defaultAuthRateLimit = {
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please try again later.'
        }
      });
    }
  };

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const requestId = req.get('x-request-id') || randomUUID();
    req.id = requestId;
    req.logger = logger.child({
      requestId,
      method: req.method,
      url: req.originalUrl
    });
    res.setHeader('x-request-id', requestId);

    const startedAt = Date.now();
    res.on('finish', () => {
      req.logger.info({
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        userId: req.user?._id ? String(req.user._id) : undefined,
        businessId: req.businessId ? String(req.businessId) : undefined
      }, 'request completed');
    });

    return next();
  });
  app.use(helmet());
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
  app.use('/api/auth', rateLimit({ ...defaultAuthRateLimit, ...authRateLimit }));
  app.use('/api', apiRoutes);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };