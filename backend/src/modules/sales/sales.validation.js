const { z } = require('zod');

const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().regex(/^[a-f\d]{24}$/i),
    quantity: z.number().int().positive()
  }).strict()).min(1).max(100),
  customerId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  discount: z.number().finite().min(0).optional(),
  tax: z.number().finite().min(0).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'ONLINE', 'OTHER']).optional(),
  soldAt: z.iso.datetime().optional()
}).strict().refine((sale) => new Set(sale.items.map((item) => item.productId)).size === sale.items.length, {
  message: 'Each product can only appear once in a sale',
  path: ['items']
});

module.exports = { createSaleSchema };