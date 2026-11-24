import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    brand: z.string().optional(),
    category: z.string().min(1, 'Category is required').default('General'),
    sku: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().min(1, 'Unit is required').default('pcs'),
    purchasePrice: z.number().min(0).default(0),
    sellingPrice: z.number().min(0).default(0),
    minimumStock: z.number().min(0).optional().default(10),
    maximumStock: z.number().min(0).optional(),
    initialStock: z.number().min(0).optional().default(0),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    brand: z.string().optional(),
    category: z.string().min(1).optional(),
    sku: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().min(1).optional(),
    purchasePrice: z.number().min(0).optional(),
    sellingPrice: z.number().min(0).optional(),
    minimumStock: z.number().min(0).optional(),
    maximumStock: z.number().min(0).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});
