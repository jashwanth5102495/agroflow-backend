import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    companyName: z.string().optional(),
    phone: z.string().min(10, 'Invalid phone number'),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    gstNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    companyName: z.string().optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    gstNumber: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});
