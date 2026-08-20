import { z } from 'zod';
import { PaymentMethod } from '../models/Sale';
export declare const createSaleSchema: z.ZodObject<{
    body: z.ZodObject<{
        farmerId: z.ZodString;
        invoiceNumber: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            quantity: z.ZodNumber;
            discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        }, z.core.$strip>>;
        discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        tax: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        amountPaid: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        paymentMethod: z.ZodEnum<{
            BANK_TRANSFER: PaymentMethod.BANK_TRANSFER;
            CARD: PaymentMethod.CARD;
            CASH: PaymentMethod.CASH;
            CREDIT: PaymentMethod.CREDIT;
            PARTIAL: PaymentMethod.PARTIAL;
            UPI: PaymentMethod.UPI;
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=sale.validation.d.ts.map