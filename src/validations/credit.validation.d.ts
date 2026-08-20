import { z } from 'zod';
export declare const addCreditPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodNumber;
        paymentMethod: z.ZodEnum<{
            BANK_TRANSFER: "BANK_TRANSFER";
            CARD: "CARD";
            CASH: "CASH";
            UPI: "UPI";
        }>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=credit.validation.d.ts.map