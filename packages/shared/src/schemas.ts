import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  sortBy: z.string().trim().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const emailSchema = z.string().trim().toLowerCase().email('Invalid institutional email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, 'Must be a valid Indian 10-digit mobile number');

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid record identifier');

