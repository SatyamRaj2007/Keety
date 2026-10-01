const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'keety-api',
      requestId: req.id
    }
  });
});

router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'live',
      service: 'keety-api',
      requestId: req.id
    }
  });
});

router.get('/ready', async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;

  if (!dbReady) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'NOT_READY',
        message: 'Database connection is not ready.'
      },
      data: {
        status: 'not-ready',
        service: 'keety-api',
        db: 'disconnected',
        requestId: req.id
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      status: 'ready',
      service: 'keety-api',
      db: 'connected',
      requestId: req.id
    }
  });
});

module.exports = router;