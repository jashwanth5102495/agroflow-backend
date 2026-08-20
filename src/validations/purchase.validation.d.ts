import { z } from 'zod';
export declare const createPurchaseSchema: z.ZodObject<{
    body: z.ZodObject<{
        supplierId: z.ZodString;
        invoiceNumber: z.ZodString;
        purchaseDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        items: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            quantity: z.ZodNumber;
            purchasePrice: z.ZodNumber;
        }, z.core.$strip>>;
        discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        tax: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        amountPaid: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=purchase.validation.d.ts.map