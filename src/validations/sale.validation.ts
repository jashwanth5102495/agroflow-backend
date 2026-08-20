import { z } from 'zod';
import { PaymentMethod } from '../models/Sale';

export const createSaleSchema = z.object({
  body: z.object({
    farmerId: z.string().min(1, 'Farmer is required'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    items: z.array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
        discount: z.number().min(0).optional().default(0),
      })
    ).min(1, 'At least one item is required'),
    discount: z.number().min(0).optional().default(0),
    tax: z.number().min(0).optional().default(0),
    amountPaid: z.number().min(0).optional().default(0),
    paymentMethod: z.enum([
      PaymentMethod.CASH,
      PaymentMethod.UPI,
      PaymentMethod.CARD,
      PaymentMethod.BANK_TRANSFER,
      PaymentMethod.CREDIT,
      PaymentMethod.PARTIAL
    ]),
  }),
});
