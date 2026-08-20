import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    brand: z.string().optional(),
    category: z.string().min(2, 'Category is required'),
    sku: z.string().optional(),
    unit: z.string().min(1, 'Unit is required'),
    purchasePrice: z.number().min(0),
    sellingPrice: z.number().min(0),
    minimumStock: z.number().min(0).optional(),
    maximumStock: z.number().min(0).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    brand: z.string().optional(),
    category: z.string().min(2).optional(),
    sku: z.string().optional(),
    unit: z.string().min(1).optional(),
    purchasePrice: z.number().min(0).optional(),
    sellingPrice: z.number().min(0).optional(),
    minimumStock: z.number().min(0).optional(),
    maximumStock: z.number().min(0).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});
