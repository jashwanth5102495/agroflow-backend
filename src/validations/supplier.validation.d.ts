import { z } from 'zod';
export declare const createSupplierSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        companyName: z.ZodOptional<z.ZodString>;
        phone: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        address: z.ZodOptional<z.ZodString>;
        gstNumber: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateSupplierSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        companyName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        address: z.ZodOptional<z.ZodString>;
        gstNumber: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=supplier.validation.d.ts.map