import { z } from 'zod';
export declare const createProductSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        brand: z.ZodOptional<z.ZodString>;
        category: z.ZodString;
        sku: z.ZodOptional<z.ZodString>;
        unit: z.ZodString;
        purchasePrice: z.ZodNumber;
        sellingPrice: z.ZodNumber;
        minimumStock: z.ZodOptional<z.ZodNumber>;
        maximumStock: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateProductSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        brand: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        sku: z.ZodOptional<z.ZodString>;
        unit: z.ZodOptional<z.ZodString>;
        purchasePrice: z.ZodOptional<z.ZodNumber>;
        sellingPrice: z.ZodOptional<z.ZodNumber>;
        minimumStock: z.ZodOptional<z.ZodNumber>;
        maximumStock: z.ZodOptional<z.ZodNumber>;
        status: z.ZodOptional<z.ZodEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=product.validation.d.ts.map