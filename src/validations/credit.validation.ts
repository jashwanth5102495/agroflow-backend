import { z } from 'zod';

export const addCreditPaymentSchema = z.object({
  body: z.object({
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']),
    notes: z.string().optional(),
  }),
});
