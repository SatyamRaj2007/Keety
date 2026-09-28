const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().max(254),
  password: z.string().min(8).max(128)
}).strict();

const loginSchema = z.object({
  email: z.email().trim().max(254),
  password: z.string().min(1).max(128)
}).strict();

module.exports = { loginSchema, registerSchema };