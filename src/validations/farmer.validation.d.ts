import { z } from 'zod';
export declare const createFarmerSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        alternatePhone: z.ZodOptional<z.ZodString>;
        village: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        farmerCode: z.ZodOptional<z.ZodString>;
        creditLimit: z.ZodOptional<z.ZodNumber>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateFarmerSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        alternatePhone: z.ZodOptional<z.ZodString>;
        village: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        farmerCode: z.ZodOptional<z.ZodString>;
        creditLimit: z.ZodOptional<z.ZodNumber>;
        notes: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=farmer.validation.d.ts.map