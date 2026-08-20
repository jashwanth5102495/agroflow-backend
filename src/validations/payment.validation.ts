import { z } from 'zod';
import { PaymentMethod } from '../models/Sale';

export const createPaymentSchema = z.object({
  body: z.object({
    referenceId: z.string().optional(),
    referenceType: z.enum(['SALE', 'PURCHASE', 'CREDIT_SETTLEMENT']),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    paymentMethod: z.enum([
      PaymentMethod.CASH,
      PaymentMethod.UPI,
      PaymentMethod.CARD,
      PaymentMethod.BANK_TRANSFER,
    ]),
    notes: z.string().optional(),
  }),
});
