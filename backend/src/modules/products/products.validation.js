const { z } = require('zod');

const productFields = {
  name: z.string().trim().min(1).max(160),
  sku: z.string().trim().max(80).optional(),
  category: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  price: z.number().finite().min(0),
  costPrice: z.number().finite().min(0).optional(),
  unit: z.string().trim().max(40).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
};

const createProductSchema = z.object(productFields).strict();
const updateProductSchema = z.object(productFields).partial().strict();

module.exports = { createProductSchema, updateProductSchema };