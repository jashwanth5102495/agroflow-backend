import { z } from 'zod';

export const createPurchaseSchema = z.object({
  body: z.object({
    supplierId: z.string().min(1, 'Supplier is required'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    purchaseDate: z.string().datetime().or(z.date()),
    items: z.array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
        purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
      })
    ).min(1, 'At least one item is required'),
    discount: z.number().min(0).optional().default(0),
    tax: z.number().min(0).optional().default(0),
    amountPaid: z.number().min(0).optional().default(0),
  }),
});
