const { z } = require('zod');

const businessTypes = ['CLOTHING', 'RESTAURANT', 'SALON', 'GROCERY_RETAIL', 'ELECTRONICS', 'OTHER'];
const createBusinessSchema = z.object({
  name: z.string().trim().min(1).max(120),
  businessType: z.enum(businessTypes),
  description: z.string().trim().max(500).optional(),
  location: z.object({
    address: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional()
  }).strict().optional(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  timezone: z.string().trim().min(1).max(100).optional()
}).strict();

const updateBusinessSchema = createBusinessSchema.partial();

module.exports = { createBusinessSchema, updateBusinessSchema };