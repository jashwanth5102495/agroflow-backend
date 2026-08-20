import { z } from 'zod';

export const createFarmerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Invalid phone number'),
    alternatePhone: z.string().optional(),
    village: z.string().optional(),
    address: z.string().optional(),
    farmerCode: z.string().optional(),
    creditLimit: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

export const updateFarmerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    alternatePhone: z.string().optional(),
    village: z.string().optional(),
    address: z.string().optional(),
    farmerCode: z.string().optional(),
    creditLimit: z.number().min(0).optional(),
    notes: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});
