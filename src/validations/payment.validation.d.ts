import { z } from 'zod';
import { PaymentMethod } from '../models/Sale';
export declare const createPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        referenceId: z.ZodOptional<z.ZodString>;
        referenceType: z.ZodEnum<{
            CREDIT_SETTLEMENT: "CREDIT_SETTLEMENT";
            PURCHASE: "PURCHASE";
            SALE: "SALE";
        }>;
        amount: z.ZodNumber;
        paymentMethod: z.ZodEnum<{
            BANK_TRANSFER: PaymentMethod.BANK_TRANSFER;
            CARD: PaymentMethod.CARD;
            CASH: PaymentMethod.CASH;
            UPI: PaymentMethod.UPI;
        }>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=payment.validation.d.ts.map