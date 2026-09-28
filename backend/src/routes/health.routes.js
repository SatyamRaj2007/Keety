const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok', service: 'keety-api' }
  });
});

module.exports = router;