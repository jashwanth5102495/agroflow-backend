import { z } from 'zod';

export const createPurchaseSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company or Supplier name is required'),
    supplierId: z.string().optional(),
    invoiceNumber: z.string().optional(),
    purchaseDate: z.string().or(z.date()).optional(),
    items: z.array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        productName: z.string().optional(),
        unit: z.string().optional(),
        packSize: z.string().optional(),
        quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
        purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
      })
    ).min(1, 'At least one item is required'),
    discount: z.number().min(0).optional().default(0),
    gstRate: z.number().min(0).optional().default(0),
    tax: z.number().min(0).optional().default(0),
    total: z.number().min(0).optional(),
    amountPaid: z.number().min(0).optional().default(0),
    paymentStatus: z.enum(['PAID', 'PARTIAL', 'UNPAID']).optional().default('PAID'),
    notes: z.string().optional(),
  }),
});
