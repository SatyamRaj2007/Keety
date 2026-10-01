const { z } = require('zod');

const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().max(254).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  externalId: z.string().trim().max(100).optional().or(z.literal(''))
}).strict();

const updateCustomerSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  email: z.string().trim().max(254).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  externalId: z.string().trim().max(100).optional().or(z.literal(''))
}).strict();

module.exports = { createCustomerSchema, updateCustomerSchema };
